import { FastifyInstance } from "fastify";

export async function periodClosingRoutes(app: FastifyInstance) {
  app.post(
    "/accounting/periods/close",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("ACCOUNTING", "EDIT")
      ]
    },
    async (req: any, reply) => {
      const companyId = req.companyId as string;
      const dateFilter = req.body?.asOf ? new Date(req.body.asOf) : new Date();

      const invoices = await app.prisma.projectInvoice.findMany({
        where: {
          companyId,
          status: { not: "PAID" },
          foreignAmount: { not: null }
        }
      });

      let totalGain = 0;
      let totalLoss = 0;
      const diffs: Array<{ invoiceId: string; diff: number }> = [];

      for (const invoice of invoices) {
        if (!invoice.foreignAmount || !invoice.currencyCode) continue;
        const currentFx = await app.prisma.fxRate.findFirst({
          where: { baseCode: invoice.currencyCode, quoteCode: "SAR" },
          orderBy: { date: "desc" }
        });
        const currentRate = Number(currentFx?.rate || invoice.fxRate || 1);
        const revalued = Number((Number(invoice.foreignAmount) * currentRate).toFixed(2));
        const diff = Number((revalued - Number(invoice.totalAmount)).toFixed(2));
        if (Math.abs(diff) < 0.01) continue;
        diffs.push({ invoiceId: invoice.id, diff });
        if (diff > 0) totalGain += diff;
        else totalLoss += Math.abs(diff);
      }

      if (totalGain === 0 && totalLoss === 0) {
        return { success: true, message: "No unrealized exposures to close", diffs };
      }

      const arAccount = await app.prisma.account.findFirst({
        where: { companyId, code: "1200" }
      });
      const fxGain = await app.prisma.account.findFirst({
        where: { companyId, code: "7300" }
      });
      const fxLoss = await app.prisma.account.findFirst({
        where: { companyId, code: "7500" }
      });

      if (!arAccount) {
        return reply.status(500).send({ error: "accounts Receivable account not configured" });
      }

      const lines: any[] = [];
      if (totalGain > 0 && fxGain) {
        lines.push({ accountId: arAccount.id, debit: totalGain, credit: 0 });
        lines.push({ accountId: fxGain.id, debit: 0, credit: totalGain });
      }
      if (totalLoss > 0 && fxLoss) {
        lines.push({ accountId: arAccount.id, debit: 0, credit: totalLoss });
        lines.push({ accountId: fxLoss.id, debit: totalLoss, credit: 0 });
      }

      if (lines.length === 0) {
        return reply.status(500).send({ error: "FX gain/loss accounts missing" });
      }

      await app.prisma.journalEntry.create({
        data: {
          companyId,
          date: dateFilter,
          reference: `CLOSE-${dateFilter.toISOString().slice(0, 10)}`,
          description: `Unrealized FX closing ${dateFilter.toISOString().slice(0, 10)}`,
          lines: {
            create: lines
          }
        }
      });

      return { success: true, diffs, totalGain, totalLoss };
    }
  );
}
