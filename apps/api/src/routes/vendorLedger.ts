import { FastifyInstance } from "fastify";

export async function vendorLedgerRoutes(app: FastifyInstance) {
  app.get(
    "/vendor-ledger",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROCUREMENT", "VIEW")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;

      const vendors = await app.prisma.vendor.findMany({
        where: { companyId },
        include: {
          invoices: {
            include: { payments: true }
          },
          payments: true
        }
      });

      const ledger = vendors.map((vendor) => {
        let balance = 0;
        const entries: {
          type: "invoice" | "payment";
          amount: number;
          date: string;
          ref: string;
        }[] = [];

        vendor.invoices.forEach((invoice) => {
          balance += Number(invoice.totalAmount);
          entries.push({
            type: "invoice",
            amount: Number(invoice.totalAmount),
            date: invoice.invoiceDate.toISOString(),
            ref: invoice.invoiceNumber
          });
          invoice.payments.forEach((payment) => {
            balance -= Number(payment.amount);
            entries.push({
              type: "payment",
              amount: Number(payment.amount),
              date: payment.paidDate.toISOString(),
              ref: payment.reference || "Payment"
            });
          });
        });

        vendor.payments.forEach((p) => {
          balance -= Number(p.amount);
          entries.push({
            type: "payment",
            amount: Number(p.amount),
            date: p.paidDate.toISOString(),
            ref: p.reference || "Payment"
          });
        });

        entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          balance,
          entries
        };
      });

      return { success: true, ledger };
    }
  );
}
