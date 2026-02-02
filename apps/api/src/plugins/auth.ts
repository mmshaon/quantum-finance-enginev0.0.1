import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyReply, FastifyRequest } from "fastify";

export default fp(async (app) => {
  app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret"
  });

  app.decorate(
    "authenticate",
    async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
        const { userId } = request.user;
        const user = await app.prisma.user.findUnique({
          where: { id: userId },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true }
                    }
                  }
                }
              }
            },
            company: true
          }
        });
        if (!user || !user.isApproved) {
          return reply.code(403).send({ error: "Unauthorized" });
        }
        request.currentUser = user;
      } catch {
        return reply.code(401).send({ error: "Invalid token" });
      }
    }
  );

  app.decorate("checkRole", (roles: string[]) => {
    return async (request: any, reply: any) => {
      try {
        await request.jwtVerify();
        const user = await app.prisma.user.findUnique({
          where: { id: request.user.userId },
          include: {
            roles: {
              include: {
                role: true
              }
            }
          }
        });

        if (!user) {
          return reply.code(401).send({ error: "User not found" });
        }

        const userRoles = user.roles.map(ur => ur.role.name);
        const hasRole = roles.some(role => userRoles.includes(role));

        if (!hasRole && !user.isCreator) {
          return reply.code(403).send({ error: "Forbidden" });
        }
      } catch (err) {
        return reply.code(401).send({ error: "Unauthorized" });
      }
    };
  });
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    checkRole: (roles: string[]) => (request: any, reply: any) => Promise<void>;
  }
  interface FastifyRequest {
    currentUser?: any;
  }
}
