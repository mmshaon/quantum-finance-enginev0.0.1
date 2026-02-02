import { FastifyInstance } from "fastify";

export async function projectHrRoutes(app: FastifyInstance) {
  // HR summary per project
  app.get(
    "/projects/:id/hr-summary",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROJECTS", "VIEW")
      ]
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const companyId = req.companyId as string;
      const { from, to } = req.query as { from?: string; to?: string };

      const project = await app.prisma.project.findFirst({
        where: { id, companyId }
      });
      if (!project) return reply.status(404).send({ error: "Project not found" });

      const dateFilter: any = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);

      const attendance = await app.prisma.staffAttendance.findMany({
        where: {
          companyId,
          projectId: id,
          ...(Object.keys(dateFilter).length ? { date: dateFilter } : {})
        },
        include: {
          staff: {
            include: { user: { select: { fullName: true, email: true } } }
          }
        }
      });

      const staffIds = Array.from(new Set(attendance.map((a) => a.staffId)));
      const staffProfiles = await app.prisma.staff.findMany({
        where: { id: { in: staffIds } },
        select: { id: true, fullName: true, dailyRate: true, user: { select: { fullName: true, email: true } } }
      });
      const rateMap = new Map(staffProfiles.map((s) => [s.id, Number(s.dailyRate || 0)]));

      const staffSummary = staffIds.map((sid) => {
        const recs = attendance.filter((a) => a.staffId === sid);
        const presentDays = recs.filter((r) => r.status === "PRESENT").length;
        const leaveDays = recs.filter((r) => r.status === "LEAVE").length;
        const dailyRate = rateMap.get(sid) || 0;
        const cost = (presentDays + leaveDays) * dailyRate;
        const staff = staffProfiles.find((s) => s.id === sid);
        return {
          staffId: sid,
          name: staff?.user?.fullName || staff?.fullName || "Unknown",
          email: staff?.user?.email,
          presentDays,
          leaveDays,
          dailyRate,
          manpowerCost: cost
        };
      });

      const totalManpowerCost = staffSummary.reduce((s, v) => s + v.manpowerCost, 0);

      return {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          code: project.projectNumber,
          clientName: project.ownerName,
          contractValue: project.value
        },
        period: { from: from || null, to: to || null },
        staffSummary,
        totalManpowerCost
      };
    }
  );

  // Profitability (includes expenses and payments)
  app.get(
    "/projects/:id/profitability",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROJECTS", "VIEW")
      ]
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const companyId = req.companyId as string;
      const { from, to } = req.query as { from?: string; to?: string };

      const project = await app.prisma.project.findFirst({
        where: { id, companyId }
      });
      if (!project) return reply.status(404).send({ error: "Project not found" });

      const dateFilter: any = {};
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);

      const attendance = await app.prisma.staffAttendance.findMany({
        where: {
          companyId,
          projectId: id,
          ...(Object.keys(dateFilter).length ? { date: dateFilter } : {})
        }
      });

      const staffIds = Array.from(new Set(attendance.map((a) => a.staffId)));
      const staffProfiles = await app.prisma.staff.findMany({
        where: { id: { in: staffIds } },
        select: { id: true, dailyRate: true }
      });
      const rateMap = new Map(staffProfiles.map((s) => [s.id, Number(s.dailyRate || 0)]));

      let manpowerCost = 0;
      for (const sid of staffIds) {
        const recs = attendance.filter((a) => a.staffId === sid);
        const present = recs.filter((r) => r.status === "PRESENT").length;
        const leave = recs.filter((r) => r.status === "LEAVE").length;
        manpowerCost += (present + leave) * (rateMap.get(sid) || 0);
      }

      let otherExpenses = 0;
      const expenses = await app.prisma.expense.findMany({
        where: {
          companyId,
          projectLinks: { some: { projectId: id } },
          ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
        }
      });
      otherExpenses = expenses.reduce((s, e) => s + Number(e.totalAmount), 0);

      const paymentsAgg = await app.prisma.projectPayment.aggregate({
        _sum: { amount: true },
        where: {
          companyId,
          projectId: id,
          ...(Object.keys(dateFilter).length ? { paidDate: dateFilter } : {})
        }
      });
      const revenue = Number(paymentsAgg._sum.amount || 0);

      const totalCost = manpowerCost + otherExpenses;
      const profit = revenue - totalCost;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        success: true,
        project: {
          id: project.id,
          name: project.name,
          code: project.projectNumber,
          clientName: project.ownerName,
          contractValue: project.value
        },
        period: { from: from || null, to: to || null },
        manpowerCost,
        otherExpenses,
        totalCost,
        revenue,
        profit,
        margin
      };
    }
  );
}
