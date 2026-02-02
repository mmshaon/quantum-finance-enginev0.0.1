import { FastifyPluginAsync } from 'fastify';

const projectsRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all projects
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request) => {
    const { companyId } = (request as any).user;

    const projects = await fastify.prisma.project.findMany({
      where: { companyId, deletedAt: null },
      include: {
        budgets: true,
        workers: {
          include: {
            staff: {
              select: {
                fullName: true,
                position: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return projects;
  });

  // Get project by ID
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;

    const project = await fastify.prisma.project.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        budgets: true,
        expenseLinks: {
          include: {
            expense: {
              include: {
                items: true
              }
            }
          }
        },
        workers: {
          include: {
            staff: true
          }
        },
        progressLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    return project;
  });

  // Create project
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId, companyId } = (request as any).user;
    const { name, ownerName, value, workType, reference, contactInfo, startDate, endDate } = request.body as any;

    // Generate project number
    const count = await fastify.prisma.project.count({ where: { companyId } });
    const projectNumber = `PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const project = await fastify.prisma.project.create({
      data: {
        companyId,
        projectNumber,
        name,
        ownerName,
        value,
        workType,
        reference,
        contactInfo,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'PLANNED'
      }
    });

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'CREATE',
        module: 'PROJECTS',
        entityType: 'Project',
        entityId: project.id,
        metadata: { projectNumber, name }
      }
    });

    return project;
  });

  // Update project
  fastify.patch('/:id', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = request.params as any;
    const { userId, companyId } = (request as any).user;
    const updates = request.body as any;

    const project = await fastify.prisma.project.findFirst({
      where: { id, companyId, deletedAt: null }
    });

    if (!project) {
      throw { statusCode: 404, message: 'Project not found' };
    }

    const updated = await fastify.prisma.project.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'UPDATE',
        module: 'PROJECTS',
        entityType: 'Project',
        entityId: id
      }
    });

    return updated;
  });

  // Add progress log
  fastify.post('/:id/progress', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = request.params as any;
    const { userId, companyId } = (request as any).user;
    const { progressPercent, notes } = request.body as any;

    const log = await fastify.prisma.projectProgressLog.create({
      data: {
        projectId: id,
        progressPercent,
        notes
      }
    });

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'CREATE',
        module: 'PROJECTS',
        entityType: 'ProjectProgressLog',
        entityId: log.id,
        metadata: { projectId: id, progressPercent }
      }
    });

    return log;
  });
};

export default projectsRoutes;
