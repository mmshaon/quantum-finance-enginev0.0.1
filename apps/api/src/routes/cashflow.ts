import { FastifyInstance } from "fastify";

export async function cashflowRoutes(app: FastifyInstance) {
  app.get(
    "/cashflow/summary",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("FINANCE", "VIEW")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;

      // Revenue collected
      const payments = await app.prisma.incomePayment.findMany({
        where: { bill: { companyId } }
      });
      const totalCollected = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      // Invoiced
      const invoices = await app.prisma.incomeBill.findMany({
        where: { companyId }
      });
      const totalInvoiced = invoices.reduce(
        (sum, inv) => sum + Number(inv.totalAmount),
        0
      );

      const totalOutstanding = totalInvoiced - totalCollected;

      // Expenses
      const expenses = await app.prisma.expense.findMany({
        where: { companyId }
      });
      const totalExpenses = expenses.reduce(
        (sum, e) => sum + Number(e.totalAmount),
        0
      );

      // Manpower cost not tracked in schema -> set to 0
      const manpowerCost = 0;

      const netCashflow = totalCollected - (totalExpenses + manpowerCost);

      return {
        success: true,
        totals: {
          collected: totalCollected,
          invoiced: totalInvoiced,
          outstanding: totalOutstanding,
          expenses: totalExpenses,
          manpowerCost,
          netCashflow
        }
      };
    }
  );
}
