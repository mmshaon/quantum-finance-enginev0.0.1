import fp from "fastify-plugin";

export default fp(async (app) => {
  app.addHook("onResponse", async (request: any, reply) => {
    const userId = request.currentUser?.id ?? null;
    const companyId = request.currentUser?.companyId ?? null;

    try {
      await app.prisma.auditLog.create({
        data: {
          userId,
          companyId,
          actionType: request.method,
          module:
            (request.routerPath || request.url || "").split("/")[1] ?? "unknown",
          metadata: {
            statusCode: reply.statusCode
          }
        }
      });
    } catch (e) {
      app.log.error(e);
    }
  });
});
