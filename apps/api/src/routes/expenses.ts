import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../plugins/authMiddleware';

const expensesRoutes: FastifyPluginAsync = async (server) => {
  // List expenses
  server.get('/', {
    preHandler: authenticate
  }, async (request, reply) => {
    const user = request.user as { companyId?: string };

    try {
      const expenses = await server.prisma.expense.findMany({
        where: {
          companyId: user.companyId,
          deletedAt: null
        },
        include: {
          items: {
            include: {
              category: true
            }
          },
          submitter: {
            select: {
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.send({
        success: true,
        data: expenses
      });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch expenses'
      });
    }
  });

  // Create expense
  server.post('/', {
    preHandler: authenticate
  }, async (request, reply) => {
    const user = request.user as { id: string; companyId?: string };
    const { items } = request.body as { items: Array<{ description: string; amount: number; categoryId?: string }> };

    try {
      const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);

      const expense = await server.prisma.expense.create({
        data: {
          companyId: user.companyId!,
          submitterId: user.id,
          totalAmount,
          items: {
            create: items.map(item => ({
              description: item.description,
              amount: item.amount,
              categoryId: item.categoryId
            }))
          }
        },
        include: {
          items: true
        }
      });

      // Create audit log
      await server.prisma.auditLog.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          actionType: 'CREATE',
          module: 'EXPENSES',
          entityType: 'EXPENSE',
          entityId: expense.id
        }
      });

      return reply.status(201).send({
        success: true,
        data: expense,
        message: 'Expense submitted successfully'
      });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create expense'
      });
    }
  });

  // Approve expense
  server.post('/:id/approve', {
    preHandler: authenticate
  }, async (request, reply) => {
    const user = request.user as { id: string; companyId?: string };
    const { id } = request.params as { id: string };

    try {
      const expense = await server.prisma.expense.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      await server.prisma.expenseStatusHistory.create({
        data: {
          expenseId: id,
          status: 'APPROVED',
          changedById: user.id
        }
      });

      await server.prisma.auditLog.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          actionType: 'APPROVE',
          module: 'EXPENSES',
          entityType: 'EXPENSE',
          entityId: id
        }
      });

      return reply.send({
        success: true,
        data: expense,
        message: 'Expense approved'
      });
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to approve expense'
      });
    }
  });
};

export default expensesRoutes;
