import fp from "fastify-plugin";
import jwt from "@fastify/jwt";

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
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: any;
  }
  interface FastifyRequest {
    currentUser?: any;
  }
}
