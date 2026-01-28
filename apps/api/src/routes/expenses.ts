import { FastifyInstance } from "fastify";

export async function expensesRoutes(app: FastifyInstance) {
  app.post(
    "/expenses",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("EXPENSES", "CREATE")
      ]
    },
    async (req: any, reply) => {
      const { items } = req.body as any;
      const companyId = req.companyId;
      const submitterId = req.currentUser.id;

      const totalAmount = items.reduce(
        (sum: number, i: any) => sum + Number(i.amount),
        0
      );

      const expense = await app.prisma.expense.create({
        data: {
          companyId,
          submitterId,
          totalAmount,
          items: {
            create: items.map((i: any) => ({
              description: i.description,
              amount: i.amount,
              categoryId: i.categoryId,
              receiptUrl: i.receiptUrl
            }))
          },
          statusLogs: {
            create: {
              status: "PENDING",
              comment: "Submitted",
              changedById: submitterId
            }
          }
        }
      });

      return { success: true, expenseId: expense.id };
    }
  );
}
