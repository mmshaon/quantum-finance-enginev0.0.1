import fp from "fastify-plugin";

export default fp(async (app) => {
  app.decorate(
    "requirePermission",
    (moduleKey: string, action: string) =>
      async (request: any, reply: any) => {
        const user = request.currentUser;
        if (user.isCreator) return;

        const perms = new Set<string>();
        for (const ur of user.roles ?? []) {
          for (const rp of ur.role.permissions ?? []) {
            const p = rp.permission;
            perms.add(`${p.module}:${p.action}`);
          }
        }

        if (!perms.has(`${moduleKey}:${action}`)) {
          return reply.code(403).send({ error: "Forbidden" });
        }
      }
  );
});

declare module "fastify" {
  interface FastifyInstance {
    requirePermission: (moduleKey: string, action: string) => any;
  }
}
