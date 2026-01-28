import fp from "fastify-plugin";

export default fp(async (app) => {
  app.decorate(
    "withCompanyScope",
    async (request: any, reply: any) => {
      const user = request.currentUser;
      if (!user?.companyId && !user?.isCreator) {
        return reply.code(400).send({ error: "No company context" });
      }
      request.companyId = user.companyId;
    }
  );
});

declare module "fastify" {
  interface FastifyInstance {
    withCompanyScope: any;
  }
  interface FastifyRequest {
    companyId?: string;
  }
}
