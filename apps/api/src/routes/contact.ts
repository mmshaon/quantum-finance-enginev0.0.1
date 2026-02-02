import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { AppError } from '../plugins/error-handler';

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
});

export const contactRoutes: FastifyPluginAsync = async (server) => {
  server.post('/', async (request, reply) => {
    const body = contactSchema.parse(request.body);
    const user = (request as any).user;
    const companyId = user?.companyId ?? null;

    const msg = await server.prisma.contactMessage.create({
      data: {
        companyId,
        name: body.name,
        email: body.email,
        subject: body.subject,
        message: body.message,
      },
    });

    return reply.status(201).send({ success: true, data: { id: msg.id, message: 'Message sent successfully' } });
  });

  server.get('/', {
    preHandler: [server.authenticate],
  }, async (request, reply) => {
    const user = (request as any).user as { companyId?: string; isCreator?: boolean };
    if (!user.companyId && !user.isCreator) throw new AppError('Unauthorized', 403, 'FORBIDDEN');

    const where: any = {};
    if (user.companyId && !user.isCreator) where.companyId = user.companyId;

    const messages = await server.prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return reply.send({ success: true, data: messages });
  });
};
