import { FastifyInstance } from "fastify";

function hasRole(user: any, roleName: string): boolean {
  if (!user?.roles) return false;
  return user.roles.some((ur: any) => ur.role?.name === roleName);
}

export async function userRoutes(app: FastifyInstance) {
  // List pending users (creator or ADMIN)
  app.get(
    "/admin/users/pending",
    {
      preHandler: [app.authenticate]
    },
    async (req: any, reply) => {
      const user = req.currentUser;

      if (!user.isCreator && !hasRole(user, "ADMIN")) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const pendingUsers = await app.prisma.user.findMany({
        where: { isApproved: false }
      });

      return { success: true, users: pendingUsers };
    }
  );

  // Approve user
  app.post(
    "/admin/users/:id/approve",
    {
      preHandler: [app.authenticate]
    },
    async (req: any, reply) => {
      const user = req.currentUser;

      if (!user.isCreator && !hasRole(user, "ADMIN")) {
        return reply.status(403).send({ error: "Forbidden" });
      }

      const { id } = req.params as { id: string };

      const target = await app.prisma.user.findUnique({
        where: { id }
      });

      if (!target) {
        return reply.status(404).send({ error: "User not found" });
      }

      if (target.isApproved) {
        return reply.status(400).send({ error: "User already approved" });
      }

      const updated = await app.prisma.user.update({
        where: { id },
        data: {
          isApproved: true,
          companyId: user.companyId
        }
      });

      await app.prisma.auditLog.create({
        data: {
          userId: user.id,
          companyId: user.companyId || undefined,
          actionType: "APPROVE_USER",
          module: "AUTH",
          entityType: "User",
          entityId: updated.id,
          metadata: {
            approvedBy: user.email,
            approvedUser: updated.email
          }
        }
      });

      return { success: true, user: updated };
    }
  );
}
