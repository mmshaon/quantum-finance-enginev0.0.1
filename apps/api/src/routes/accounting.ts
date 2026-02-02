import { FastifyInstance } from "fastify";

export async function accountingRoutes(app: FastifyInstance) {
  // List active accounts
  app.get(
    "/accounts",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("ACCOUNTING", "VIEW")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const accounts = await app.prisma.account.findMany({
        where: { companyId, isActive: true },
        orderBy: { code: "asc" }
      });
      return { success: true, accounts };
    }
  );

  // Create account
  app.post(
    "/accounts",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("ACCOUNTING", "CREATE")
      ]
    },
    async (req: any, reply) => {
      const companyId = req.companyId as string;
      const body = req.body as {
        code: string;
        name: string;
        type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
        isRetainedEarnings?: boolean;
      };

      if (!body.code || !body.name || !body.type) {
        return reply.status(400).send({ error: "Missing account data" });
      }

      const account = await app.prisma.account.create({
        data: {
          companyId,
          code: body.code,
          name: body.name,
          type: body.type,
          isRetainedEarnings: !!body.isRetainedEarnings
        }
      });

      return reply.status(201).send({ success: true, account });
    }
  );

  // Create balanced journal entry
  app.post(
    "/journal-entries",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("ACCOUNTING", "CREATE")
      ]
    },
    async (req: any, reply) => {
      const companyId = req.companyId as string;
      const userId = req.currentUser.id as string;
      const body = req.body as {
        date: string;
        reference?: string;
        description?: string;
        lines: {
          accountId: string;
          debit: number;
          credit: number;
          memo?: string;
          foreignAmount?: number;
          foreignCode?: string;
          fxRate?: number;
        }[];
      };

      if (!body.date || !body.lines?.length) {
        return reply.status(400).send({ error: "Missing journal data" });
      }

      let totalDebit = 0;
      let totalCredit = 0;
      for (const l of body.lines) {
        if (!l.accountId) {
          return reply.status(400).send({ error: "Line missing accountId" });
        }
        if ((l.debit || 0) < 0 || (l.credit || 0) < 0) {
          return reply.status(400).send({ error: "Debit/Credit cannot be negative" });
        }
        totalDebit += l.debit || 0;
        totalCredit += l.credit || 0;
      }

      if (Number(totalDebit.toFixed(2)) !== Number(totalCredit.toFixed(2))) {
        return reply.status(400).send({ error: "Journal not balanced (debits != credits)" });
      }

      const date = new Date(body.date);
      if (Number.isNaN(date.getTime())) {
        return reply.status(400).send({ error: "Invalid date" });
      }

      const entry = await app.prisma.journalEntry.create({
        data: {
          companyId,
          date,
          reference: body.reference || null,
          description: body.description || null,
          createdById: userId,
          lines: {
            create: body.lines.map((l) => ({
              accountId: l.accountId,
              debit: l.debit || 0,
              credit: l.credit || 0,
              memo: l.memo || null,
              foreignAmount: l.foreignAmount ?? null,
              foreignCode: l.foreignCode ?? null,
              fxRate: l.fxRate ?? null
            }))
          }
        },
        include: {
          lines: { include: { account: true } }
        }
      });

      return reply.status(201).send({ success: true, entry });
    }
  );

  // General ledger (optional filter by account)
  app.get(
    "/ledger",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("ACCOUNTING", "VIEW")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const { accountId, from, to } = req.query as {
        accountId?: string;
        from?: string;
        to?: string;
      };

      const whereEntry: any = { companyId };
      if (from || to) {
        whereEntry.date = {};
        if (from) whereEntry.date.gte = new Date(from);
        if (to) whereEntry.date.lte = new Date(to);
      }

      const whereLine: any = {};
      if (accountId) whereLine.accountId = accountId;

      const entries = await app.prisma.journalEntry.findMany({
        where: whereEntry,
        orderBy: { date: "asc" },
        include: {
          lines: {
            where: whereLine,
            include: { account: true }
          }
        }
      });

      const lines = entries
        .flatMap((e) =>
          e.lines.map((l) => ({
            id: l.id,
            date: e.date,
            reference: e.reference,
            description: e.description,
            account: {
              id: l.account.id,
              code: l.account.code,
              name: l.account.name,
              type: l.account.type
            },
            debit: Number(l.debit),
            credit: Number(l.credit),
            memo: l.memo,
            foreignAmount: l.foreignAmount ? Number(l.foreignAmount) : null,
            foreignCode: l.foreignCode,
            fxRate: l.fxRate ? Number(l.fxRate) : null
          }))
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return { success: true, lines };
    }
  );

  // Trial balance
  app.get(
    "/trial-balance",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("ACCOUNTING", "VIEW")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const { to } = req.query as { to?: string };

      const whereEntry: any = { companyId };
      if (to) {
        whereEntry.date = { lte: new Date(to) };
      }

      const entries = await app.prisma.journalEntry.findMany({
        where: whereEntry,
        include: {
          lines: { include: { account: true } }
        }
      });

      const map = new Map<
        string,
        { accountId: string; code: string; name: string; type: string; debit: number; credit: number }
      >();

      for (const e of entries) {
        for (const l of e.lines) {
          const key = l.accountId;
          if (!map.has(key)) {
            map.set(key, {
              accountId: l.accountId,
              code: l.account.code,
              name: l.account.name,
              type: l.account.type,
              debit: 0,
              credit: 0
            });
          }
          const agg = map.get(key)!;
          agg.debit += Number(l.debit);
          agg.credit += Number(l.credit);
        }
      }

      const rows = Array.from(map.values()).sort((a, b) =>
        a.code.localeCompare(b.code)
      );

      const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
      const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

      return {
        success: true,
        rows,
        totals: {
          debit: totalDebit,
          credit: totalCredit
        }
      };
    }
  );
}
