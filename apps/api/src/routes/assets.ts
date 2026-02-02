import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';
import { AppError } from '../plugins/error-handler';

const createSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  value: z.number().positive(),
  isOperatingCash: z.boolean().optional(),
  acquiredAt: z.string().optional(),
});

export const assetsRoutes: FastifyPluginAsync = async (server) => {
  server.addHook('preHandler', server.authenticate);

  server.get('/', async (request, reply) => {
    const user = (request as any).user;
    const { page = '1', limit = '20' } = request.query as any;
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const where: any = { deletedAt: null };
    if (user.companyId) where.companyId = user.companyId;

    const [assets, total] = await Promise.all([
      server.prisma.asset.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { category: true } }),
      server.prisma.asset.count({ where }),
    ]);

    return reply.send({ success: true, data: { assets, total, page: parseInt(page, 10), limit: take } });
  });

  server.get('/categories', async (request, reply) => {
    const user = (request as any).user;
    const where = user.companyId ? { companyId: user.companyId } : {};
    const categories = await server.prisma.assetCategory.findMany({ where });
    return reply.send({ success: true, data: categories });
  });

  server.post('/categories', async (request, reply) => {
    const user = (request as any).user;
    const body = z.object({ name: z.string().min(1), description: z.string().optional() }).parse(request.body);
    if (!user.companyId) throw new AppError('User must belong to a company', 400, 'NO_COMPANY');
    const cat = await server.prisma.assetCategory.create({
      data: { companyId: user.companyId, name: body.name, description: body.description },
    });
    return reply.status(201).send({ success: true, data: cat });
  });

  server.post('/', async (request, reply) => {
    const user = (request as any).user;
    const body = createSchema.parse(request.body);

    if (!user.companyId) throw new AppError('User must belong to a company', 400, 'NO_COMPANY');

    const asset = await server.prisma.asset.create({
      data: {
        companyId: user.companyId,
        name: body.name,
        categoryId: body.categoryId,
        description: body.description,
        value: new Decimal(body.value),
        isOperatingCash: body.isOperatingCash ?? false,
        acquiredAt: body.acquiredAt ? new Date(body.acquiredAt) : null,
      },
      include: { category: true },
    });

    await server.prisma.auditLog.create({
      data: { userId: user.id, companyId: user.companyId, actionType: 'CREATE', module: 'ASSETS', entityType: 'Asset', entityId: asset.id },
    });

    return reply.status(201).send({ success: true, data: asset });
  });
};
