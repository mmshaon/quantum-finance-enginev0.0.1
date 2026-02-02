import { FastifyInstance } from "fastify";

export async function fxRoutes(app: FastifyInstance) {
  app.post(
    "/fx",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("ACCOUNTING", "CREATE")
      ]
    },
    async (req: any) => {
      const body = req.body as {
        baseCode: string;
        quoteCode: string;
        rate: number;
        date: string;
      };
      const fx = await app.prisma.fxRate.create({
        data: {
          baseCode: body.baseCode,
          quoteCode: body.quoteCode,
          rate: body.rate,
          date: new Date(body.date)
        }
      });
      return { success: true, fx };
    }
  );

  app.get(
    "/fx/latest",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope
      ]
    },
    async (req: any) => {
      const { base, quote } = req.query as { base: string; quote: string };
      const fx = await app.prisma.fxRate.findFirst({
        where: { baseCode: base, quoteCode: quote },
        orderBy: { date: "desc" }
      });
      return { success: true, fx };
    }
  );

  app.get(
    "/fx/unrealized",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const invoices = await app.prisma.projectInvoice.findMany({
        where: { companyId, status: { not: "PAID" }, foreignAmount: { not: null } }
      });

      const data = [];
      for (const invoice of invoices) {
        if (!invoice.foreignAmount || !invoice.currencyCode) continue;
        const fx = await app.prisma.fxRate.findFirst({
          where: { baseCode: invoice.currencyCode, quoteCode: "SAR" },
          orderBy: { date: "desc" }
        });
        const currentRate = Number(fx?.rate || invoice.fxRate || 1);
        const revaluedBase = Number((Number(invoice.foreignAmount) * currentRate).toFixed(2));
        const unrealized = Number((revaluedBase - Number(invoice.totalAmount)).toFixed(2));
        data.push({
          invoiceId: invoice.id,
          invoiceNo: invoice.invoiceNo,
          currency: invoice.currencyCode,
          originalRate: invoice.fxRate || 1,
          currentRate,
          invoiceBase: Number(invoice.totalAmount),
          revaluedBase,
          unrealized
        });
      }

      const total = data.reduce((sum, row) => sum + row.unrealized, 0);
      return { success: true, exposures: data, total };
    }
  );
}
