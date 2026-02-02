import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { AppError } from '../plugins/error-handler';
import { InvestmentCategory } from '@prisma/client';

const createSchema = z.object({
  category: z.enum(['PRIMARY', 'PERMANENT', 'PROJECT', 'PERSONAL_FUND', 'INVESTOR_FUND']),
  amount: z.number().positive(),
  description: z.string().optional(),
  investorName: z.string().optional(),
  projectId: z.string().optional(),
});

export const investmentsRoutes: FastifyPluginAsync = async (server) => {
  server.addHook('preHandler', server.authenticate);

  server.get('/', async (request, reply) => {
    const user = (request as any).user;
    const { page = '1', limit = '20', category } = request.query as any;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const where: any = {};
    if (user.companyId) where.companyId = user.companyId;
    if (category) where.category = category;

    const [investments, total] = await Promise.all([
      server.prisma.investment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { name: true } } },
      }),
      server.prisma.investment.count({ where }),
    ]);

    return reply.send({ success: true, data: { investments, total, page: parseInt(page, 10), limit: take } });
  });

  server.post('/', async (request, reply) => {
    const user = (request as any).user;
    const body = createSchema.parse(request.body);

    if (!user.companyId) throw new AppError('User must belong to a company', 400, 'NO_COMPANY');

    const investment = await server.prisma.investment.create({
      data: {
        companyId: user.companyId,
        category: body.category as InvestmentCategory,
        amount: new Decimal(body.amount),
        description: body.description,
        investorName: body.investorName,
        projectId: body.projectId || undefined,
      },
      include: { project: true },
    });

    await server.prisma.auditLog.create({
      data: { 
        id: `audit_${Date.now()}`,
        userId: user.id, 
        companyId: user.companyId, 
        actionType: 'CREATE', 
        module: 'INVESTMENTS', 
        entityType: 'Investment', 
        entityId: investment.id 
      },
    });

    return reply.status(201).send({ success: true, data: investment });
  });
};
