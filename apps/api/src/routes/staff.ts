import { FastifyInstance } from "fastify";

export async function staffRoutes(app: FastifyInstance) {
  app.get(
    "/staff/:id/financial",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("HR", "VIEW")
      ]
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const companyId = req.companyId as string;

      const staff = await app.prisma.staff.findFirst({
        where: { id, companyId },
        include: {
          user: { select: { fullName: true, email: true } },
          accountLedger: { orderBy: { createdAt: "desc" } }
        }
      });

      if (!staff) {
        return reply.status(404).send({ error: "Staff not found" });
      }

      let balance = 0;
      for (const entry of staff.accountLedger) {
        if (entry.type === "DEBIT") balance += Number(entry.amount);
        else balance -= Number(entry.amount);
      }

      return {
        success: true,
        staff: {
          id: staff.id,
          name: staff.user?.fullName || staff.fullName,
          email: staff.user?.email,
          position: staff.position
        },
        balance,
        ledger: staff.accountLedger.map((e) => ({
          id: e.id,
          type: e.type,
          amount: Number(e.amount),
          reference: e.reference,
          createdAt: e.createdAt
        }))
      };
    }
  );
}
