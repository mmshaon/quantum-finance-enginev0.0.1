import { FastifyPluginAsync } from 'fastify';

const controlPanelRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all modules
  fastify.get('/modules', { preHandler: [fastify.authenticate] }, async (request) => {
    const { companyId } = (request as any).user;

    const modules = await fastify.prisma.moduleDefinition.findMany({
      include: {
        submodules: true,
        companyModules: {
          where: { companyId }
        }
      }
    });

    return modules.map(module => ({
      ...module,
      isEnabled: module.companyModules[0]?.isEnabled ?? false,
      isLocked: module.companyModules[0]?.isLocked ?? false
    }));
  });

  // Toggle module
  fastify.post('/modules/:moduleId/toggle', { 
    preHandler: [fastify.authenticate, fastify.checkRole(['ADMIN'])] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    const { moduleId } = request.params as any;

    const currentModule = await fastify.prisma.companyModule.findUnique({
      where: { companyId_moduleId: { companyId, moduleId } }
    });

    const companyModule = await fastify.prisma.companyModule.upsert({
      where: {
        companyId_moduleId: {
          companyId,
          moduleId
        }
      },
      update: {
        isEnabled: !currentModule?.isEnabled
      },
      create: {
        companyId,
        moduleId,
        isEnabled: true
      }
    });

    return { message: 'Module toggled successfully', companyModule };
  });
};

export default controlPanelRoutes;
