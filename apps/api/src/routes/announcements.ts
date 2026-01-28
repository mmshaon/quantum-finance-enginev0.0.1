import { FastifyInstance } from "fastify";

export async function announcementRoutes(app: FastifyInstance) {
  app.get("/announcements", async () => {
    const sections = await app.prisma.systemGuideSection.findMany({
      orderBy: { order: "asc" },
      take: 5
    });

    return {
      success: true,
      announcements: sections.map((s) => ({
        id: s.id,
        title: s.title,
        content: s.content
      }))
    };
  });
}
