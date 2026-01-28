import Fastify from "fastify";
import prismaPlugin from "./plugins/prisma";
import authPlugin from "./plugins/auth";
import tenantPlugin from "./plugins/tenant";
import rbacPlugin from "./plugins/rbac";
import loggerPlugin from "./plugins/logger";

import { authRoutes } from "./routes/auth";
import { expensesRoutes } from "./routes/expenses";
import { userRoutes } from "./routes/users";
import { announcementRoutes } from "./routes/announcements";

const app = Fastify({ logger: true });

app.register(prismaPlugin);
app.register(authPlugin);
app.register(tenantPlugin);
app.register(rbacPlugin);
app.register(loggerPlugin);

app.get("/health", async () => {
  return { status: "ok", service: "qfe-api" };
});

app.register(authRoutes);
app.register(userRoutes);
app.register(announcementRoutes);
app.register(expensesRoutes);

app
  .listen({ port: 4000, host: "0.0.0.0" })
  .then(() => console.log("QFE API running on http://localhost:4000"))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
