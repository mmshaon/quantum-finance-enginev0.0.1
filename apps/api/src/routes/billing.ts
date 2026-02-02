import { FastifyInstance } from "fastify";

export async function billingRoutes(app: FastifyInstance) {
  // create invoice
  app.post(
    "/projects/:id/invoices",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("BILLING", "CREATE")
      ]
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const companyId = req.companyId as string;
      const body = req.body as {
        invoiceNo: string;
        issueDate: string;
        dueDate?: string;
        notes?: string;
        currencyCode?: string;
        fxRate?: number;
        items: { description: string; quantity: number; unitPrice: number }[];
      };

      if (!body.invoiceNo || !body.issueDate || !body.items?.length) {
        return reply.status(400).send({ error: "Missing invoice data" });
      }

      const project = await app.prisma.project.findFirst({
        where: { id, companyId }
      });
      if (!project) return reply.status(404).send({ error: "Project not found" });

      const foreignTotal = body.items.reduce(
        (sum, i) => sum + i.quantity * i.unitPrice,
        0
      );
      let fxRate = Number(body.fxRate || 0) || 1;
      const currencyCode = body.currencyCode || "SAR";
      if (currencyCode !== "SAR" && !body.fxRate) {
        const fx = await app.prisma.fxRate.findFirst({
          where: { baseCode: currencyCode, quoteCode: "SAR" },
          orderBy: { date: "desc" }
        });
        fxRate = Number(fx?.rate || 1);
      }
      const baseTotal = Number((foreignTotal * fxRate).toFixed(2));

      const invoice = await app.prisma.projectInvoice.create({
        data: {
          companyId,
          projectId: id,
          invoiceNo: body.invoiceNo,
          issueDate: new Date(body.issueDate),
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          notes: body.notes || null,
          totalAmount: baseTotal,
          currencyCode,
          fxRate,
          foreignAmount: foreignTotal,
          status: "SENT",
          items: {
            create: body.items.map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              lineTotal: i.quantity * i.unitPrice
            }))
          }
        },
        include: { items: true, payments: true }
      });

      const arAccount = await app.prisma.account.findFirst({
        where: { companyId, code: "1200" }
      });
      const revenueAccount = await app.prisma.account.findFirst({
        where: { companyId, code: "4000" }
      });

      if (arAccount && revenueAccount) {
        await app.prisma.journalEntry.create({
          data: {
            companyId,
            date: new Date(body.issueDate),
            reference: `INV-${invoice.invoiceNo}`,
            description: `Invoice ${invoice.invoiceNo}`,
            lines: {
              create: [
                {
                  accountId: arAccount.id,
                  debit: baseTotal,
                  credit: 0,
                  foreignAmount: Number(foreignTotal),
                  foreignCode: currencyCode,
                  fxRate
                },
                {
                  accountId: revenueAccount.id,
                  debit: 0,
                  credit: baseTotal,
                  memo: `Revenue ${invoice.invoiceNo}`
                }
              ]
            }
          }
        });
      }

      return reply.status(201).send({ success: true, invoice });
    }
  );

  // list invoices
  app.get(
    "/projects/:id/invoices",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("BILLING", "VIEW")
      ]
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const companyId = req.companyId as string;

      const invoices = await app.prisma.projectInvoice.findMany({
        where: { companyId, projectId: id },
        orderBy: { issueDate: "desc" },
        include: { items: true, payments: true }
      });

      const enriched = invoices.map((inv) => {
        const collected = inv.payments.reduce(
          (s, p) => s + Number(p.amount),
          0
        );
        return {
          ...inv,
          collected,
          outstanding: Number(inv.totalAmount) - collected
        };
      });

      return { success: true, invoices: enriched };
    }
  );

  // record payment
  app.post(
    "/invoices/:invoiceId/payments",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("BILLING", "EDIT")
      ]
    },
    async (req: any, reply) => {
      const { invoiceId } = req.params as { invoiceId: string };
      const companyId = req.companyId as string;
      const userId = req.currentUser.id as string;
      const body = req.body as {
        amount: number;
        paidDate: string;
        method?: string;
        reference?: string;
        currencyCode?: string;
        fxRate?: number;
      };

      if (!body.amount || !body.paidDate) {
        return reply.status(400).send({ error: "Invalid payment data" });
      }

      const invoice = await app.prisma.projectInvoice.findFirst({
        where: { id: invoiceId, companyId }
      });
      if (!invoice) return reply.status(404).send({ error: "Invoice not found" });

      const paymentCurrency = body.currencyCode || invoice.currencyCode || "SAR";
      let paymentFxRate = Number(body.fxRate || invoice.fxRate || 0) || 1;
      if (paymentCurrency !== "SAR" && !body.fxRate) {
        const fx = await app.prisma.fxRate.findFirst({
          where: { baseCode: paymentCurrency, quoteCode: "SAR" },
          orderBy: { date: "desc" }
        });
        paymentFxRate = Number(fx?.rate || 1);
      }
      const paymentForeignAmount = Number(body.amount);
      const paymentBaseAmount = Number((paymentForeignAmount * paymentFxRate).toFixed(2));

      const payment = await app.prisma.projectPayment.create({
        data: {
          companyId,
          projectId: invoice.projectId,
          invoiceId: invoice.id,
          amount: paymentBaseAmount,
          paidDate: new Date(body.paidDate),
          method: body.method || null,
          reference: body.reference || null,
          currencyCode: paymentCurrency,
          fxRate: paymentFxRate,
          foreignAmount: paymentForeignAmount
        }
      });

      const payments = await app.prisma.projectPayment.findMany({
        where: { invoiceId: invoice.id }
      });
      const collected = payments.reduce((s, p) => s + Number(p.amount), 0);
      const total = Number(invoice.totalAmount);
      let status: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "CANCELLED" =
        "SENT";
      if (collected === 0) status = "SENT";
      else if (collected > 0 && collected < total) status = "PARTIALLY_PAID";
      else if (collected >= total) status = "PAID";

      await app.prisma.projectInvoice.update({
        where: { id: invoice.id },
        data: { status }
      });

      // simple journal entry (cash in / reduce AR) if accounts exist
      const bank = await app.prisma.account.findFirst({
        where: { companyId, code: "1010" }
      });
      const ar = await app.prisma.account.findFirst({
        where: { companyId, code: "1200" }
      });
      if (bank && ar) {
        const fxGainAccount = await app.prisma.account.findFirst({
          where: { companyId, code: "7300" }
        });
        const fxLossAccount = await app.prisma.account.findFirst({
          where: { companyId, code: "7500" }
        });

        const diff = Number((Number(paymentBaseAmount) - Number(invoice.totalAmount)).toFixed(2));

        const lines: any[] = [
          {
            accountId: bank.id,
            debit: paymentBaseAmount,
            credit: 0,
            foreignAmount: paymentForeignAmount,
            foreignCode: paymentCurrency,
            fxRate: paymentFxRate
          },
          {
            accountId: ar.id,
            debit: 0,
            credit: invoice.totalAmount,
            memo: "Settlement"
          }
        ];

        if (diff > 0 && fxGainAccount) {
          lines.push({
            accountId: fxGainAccount.id,
            debit: 0,
            credit: diff,
            memo: "Realized FX gain"
          });
        } else if (diff < 0 && fxLossAccount) {
          lines.push({
            accountId: fxLossAccount.id,
            debit: Math.abs(diff),
            credit: 0,
            memo: "Realized FX loss"
          });
        }

        await app.prisma.journalEntry.create({
          data: {
            companyId,
            date: new Date(body.paidDate),
            reference: `PAY-${payment.id}`,
            description: `Payment for invoice ${invoice.invoiceNo}`,
            createdById: userId,
            lines: {
              create: lines
            }
          }
        });
      }

      return { success: true, payment };
    }
  );

  // revenue summary
  app.get(
    "/projects/:id/revenue-summary",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROJECTS", "VIEW")
      ]
    },
    async (req: any) => {
      const { id } = req.params as { id: string };
      const companyId = req.companyId as string;
      const { from, to } = req.query as { from?: string; to?: string };
      const dateFilter: any = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);

      const payments = await app.prisma.projectPayment.aggregate({
        _sum: { amount: true },
        where: {
          companyId,
          projectId: id,
          ...(Object.keys(dateFilter).length ? { paidDate: dateFilter } : {})
        }
      });

      return { success: true, collected: Number(payments._sum.amount || 0) };
    }
  );
}
