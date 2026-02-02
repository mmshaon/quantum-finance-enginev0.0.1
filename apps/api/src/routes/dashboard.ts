import { FastifyPluginAsync } from 'fastify';

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/stats', { preHandler: [fastify.authenticate] }, async (request) => {
    const { companyId } = (request as any).user;

    // Get counts and totals
    const [
      totalExpenses,
      totalIncome,
      totalProjects,
      activeStaff,
      pendingApprovals,
      recentExpenses,
      recentBills
    ] = await Promise.all([
      fastify.prisma.expense.aggregate({
        where: { companyId, status: 'APPROVED' },
        _sum: { totalAmount: true }
      }),
      fastify.prisma.incomeBill.aggregate({
        where: { companyId, status: { in: ['PAID', 'PARTIALLY_PAID'] } },
        _sum: { totalAmount: true }
      }),
      fastify.prisma.project.count({
        where: { companyId, deletedAt: null }
      }),
      fastify.prisma.staff.count({
        where: { companyId, deletedAt: null }
      }),
      fastify.prisma.expense.count({
        where: { companyId, status: 'PENDING' }
      }),
      fastify.prisma.expense.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          submitter: {
            select: { fullName: true }
          }
        }
      }),
      fastify.prisma.incomeBill.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      totalExpenses: totalExpenses._sum.totalAmount || 0,
      totalIncome: totalIncome._sum.totalAmount || 0,
      totalProjects,
      activeStaff,
      pendingApprovals,
      recentExpenses,
      recentBills
    };
  });
};

export default dashboardRoutes;
