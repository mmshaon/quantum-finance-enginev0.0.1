import { FastifyInstance } from "fastify";

export async function statementsRoutes(app: FastifyInstance) {
  app.get(
    "/statements/overview",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("ACCOUNTING", "VIEW")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;

      const entries = await app.prisma.journalEntry.findMany({
        where: { companyId },
        include: {
          lines: {
            include: { account: true }
          }
        }
      });

      const balanceSheetMap = new Map<
        string,
        { code: string; name: string; type: string; balance: number }
      >();
      const plMap = new Map<
        string,
        { code: string; name: string; type: string; amount: number }
      >();
      let cashInflows = 0;
      let cashOutflows = 0;
      const equityMap = new Map<string, { code: string; name: string; change: number }>();

      for (const entry of entries) {
        for (const line of entry.lines) {
          const acc = line.account;
          const delta = Number(line.debit) - Number(line.credit);

          if (acc.type === "ASSET" || acc.type === "LIABILITY" || acc.type === "EQUITY") {
            if (!balanceSheetMap.has(acc.id)) {
              balanceSheetMap.set(acc.id, {
                code: acc.code,
                name: acc.name,
                type: acc.type,
                balance: 0
              });
            }
            balanceSheetMap.get(acc.id)!.balance += delta;
          }

          if (acc.type === "REVENUE" || acc.type === "EXPENSE") {
            if (!plMap.has(acc.id)) {
              plMap.set(acc.id, {
                code: acc.code,
                name: acc.name,
                type: acc.type,
                amount: 0
              });
            }
            const amount =
              acc.type === "REVENUE" ? Number(line.credit) - Number(line.debit) : Number(line.debit) - Number(line.credit);
            plMap.get(acc.id)!.amount += amount;
          }

          if (acc.type === "EQUITY") {
            if (!equityMap.has(acc.id)) {
              equityMap.set(acc.id, { code: acc.code, name: acc.name, change: 0 });
            }
            equityMap.get(acc.id)!.change += Number(line.credit) - Number(line.debit);
          }

          if (acc.type === "ASSET" && acc.code.startsWith("10")) {
            cashInflows += Number(line.debit);
            cashOutflows += Number(line.credit);
          }
        }
      }

      const balanceRows = Array.from(balanceSheetMap.values());
      const assets = balanceRows.filter((r) => r.type === "ASSET");
      const liabilities = balanceRows.filter((r) => r.type === "LIABILITY");
      const equity = balanceRows.filter((r) => r.type === "EQUITY");

      const totalAssets = assets.reduce((sum, r) => sum + r.balance, 0);
      const totalLiabilities = liabilities.reduce((sum, r) => sum + r.balance, 0);
      const totalEquity = equity.reduce((sum, r) => sum + r.balance, 0);

      const revenue = Array.from(plMap.values()).filter((r) => r.type === "REVENUE");
      const expense = Array.from(plMap.values()).filter((r) => r.type === "EXPENSE");
      const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
      const totalExpense = expense.reduce((sum, r) => sum + r.amount, 0);

      const cashflowNet = cashInflows - cashOutflows;

      const equityRows = Array.from(equityMap.values());
      const totalEquityChange = equityRows.reduce((sum, r) => sum + r.change, 0);

      return {
        success: true,
        balanceSheet: {
          assets,
          liabilities,
          equity,
          totals: { assets: totalAssets, liabilities: totalLiabilities, equity: totalEquity }
        },
        profitLoss: {
          revenue,
          expense,
          totals: { revenue: totalRevenue, expense: totalExpense, netIncome: totalRevenue - totalExpense }
        },
        cashflow: {
          inflows: cashInflows,
          outflows: cashOutflows,
          net: cashflowNet
        },
        equity: {
          rows: equityRows,
          totalChange: totalEquityChange
        }
      };
    }
  );
}
