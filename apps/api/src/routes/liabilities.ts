import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { AppError } from '../plugins/error-handler';

const createSchema = z.object({
  typeId: z.string().optional(),
  lenderName: z.string().optional(),
  description: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z.string().optional(),
});

export const liabilitiesRoutes: FastifyPluginAsync = async (server) => {
  server.addHook('preHandler', server.authenticate);

  server.get('/', async (request, reply) => {
    const user = (request as any).user;
    const { page = '1', limit = '20' } = request.query as any;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const where: any = { deletedAt: null };
    if (user.companyId) where.companyId = user.companyId;

    const [liabilities, total] = await Promise.all([
      server.prisma.liability.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { type: true } }),
      server.prisma.liability.count({ where }),
    ]);

    return reply.send({ success: true, data: { liabilities, total, page: parseInt(page, 10), limit: take } });
  });

  server.post('/', async (request, reply) => {
    const user = (request as any).user;
    const body = createSchema.parse(request.body);

    if (!user.companyId) throw new AppError('User must belong to a company', 400, 'NO_COMPANY');

    const liability = await server.prisma.liability.create({
      data: {
        companyId: user.companyId,
        typeId: body.typeId,
        lenderName: body.lenderName,
        description: body.description,
        amount: new Decimal(body.amount),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
      include: { type: true },
    });

    await server.prisma.auditLog.create({
      data: { userId: user.id, companyId: user.companyId, actionType: 'CREATE', module: 'LIABILITIES', entityType: 'Liability', entityId: liability.id },
    });

    return reply.status(201).send({ success: true, data: liability });
  });
};
