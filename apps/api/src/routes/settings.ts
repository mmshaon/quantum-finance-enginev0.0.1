import { FastifyPluginAsync } from 'fastify';

const settingsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get company settings
  fastify.get('/company', { preHandler: [fastify.authenticate] }, async (request) => {
    const { companyId } = (request as any).user;

    const company = await fastify.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        settings: {
          include: {
            theme: true
          }
        }
      }
    });

    return company;
  });

  // Update company settings
  fastify.patch('/company', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId, companyId } = (request as any).user;
    const { language, currency, darkModeDefault } = request.body as any;

    const settings = await fastify.prisma.companySettings.upsert({
      where: { companyId },
      create: {
        companyId,
        language: language || 'en',
        currency: currency || 'SAR',
        darkModeDefault: darkModeDefault !== undefined ? darkModeDefault : true
      },
      update: {
        language,
        currency,
        darkModeDefault
      }
    });

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'UPDATE',
        module: 'SETTINGS',
        entityType: 'CompanySettings',
        entityId: settings.id
      }
    });

    return settings;
  });

  // Get user profile
  fastify.get('/profile', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId } = (request as any).user;

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        address: true,
        phone: true,
        profileImage: true,
        company: {
          select: {
            name: true,
            address: true
          }
        }
      }
    });

    return user;
  });

  // Update user profile
  fastify.patch('/profile', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId, companyId } = (request as any).user;
    const { fullName, address, phone, profileImage } = request.body as any;

    const user = await fastify.prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        address,
        phone,
        profileImage,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        address: true,
        phone: true,
        profileImage: true
      }
    });

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'UPDATE',
        module: 'SETTINGS',
        entityType: 'User',
        entityId: userId
      }
    });

    return user;
  });
};

export default settingsRoutes;
