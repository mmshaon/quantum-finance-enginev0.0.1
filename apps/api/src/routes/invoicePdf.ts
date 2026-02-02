import { FastifyInstance } from "fastify";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

export async function invoicePdfRoutes(app: FastifyInstance) {
  app.get(
    "/invoices/:id/pdf",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("BILLING", "VIEW")
      ]
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const companyId = req.companyId as string;

      const invoice = await app.prisma.incomeBill.findFirst({
        where: { id, companyId },
        include: {
          company: true,
          items: true,
          payments: true
        }
      });

      if (!invoice) {
        return reply.status(404).send({ error: "Invoice not found" });
      }

      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const stream = new Readable().wrap(doc);

      reply.header("Content-Type", "application/pdf");
      reply.header(
        "Content-Disposition",
        `attachment; filename=invoice-${invoice.billNumber}.pdf`
      );

      const cyan = "#00e5ff";

      // Header
      doc.fillColor(cyan).fontSize(24).text(invoice.company.name, { align: "left" });
      doc
        .fillColor("white")
        .fontSize(10)
        .text(invoice.company.address || "", { align: "left" })
        .moveDown(1);

      doc
        .fontSize(20)
        .fillColor(cyan)
        .text("INVOICE / فاتورة", { align: "center" })
        .moveDown(1);

      // Invoice info
      doc
        .fontSize(12)
        .fillColor("white")
        .text(`Invoice No: ${invoice.billNumber}`)
        .text(`Client: ${invoice.clientName}`)
        .text(`Issue Date: ${invoice.createdAt.toISOString().slice(0, 10)}`)
        .moveDown(1);

      // Table header
      doc
        .fontSize(12)
        .fillColor(cyan)
        .text("Description", 40, doc.y, { continued: true })
        .text("Qty", 300, doc.y, { continued: true })
        .text("Rate", 350, doc.y, { continued: true })
        .text("Total", 450, doc.y)
        .moveDown(0.5);
      doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke(cyan).moveDown(0.5);

      // Items
      doc.fillColor("white");
      invoice.items.forEach((item) => {
        doc
          .text(item.description, 40, doc.y, { continued: true })
          .text(item.quantity.toString(), 300, doc.y, { continued: true })
          .text(Number(item.rate).toFixed(2), 350, doc.y, { continued: true })
          .text(Number(item.amount).toFixed(2), 450, doc.y)
          .moveDown(0.3);
      });

      doc.moveDown(1);

      // Totals
      const collected = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const outstanding = Number(invoice.totalAmount) - collected;

      doc
        .fontSize(14)
        .fillColor(cyan)
        .text(`Subtotal: ${Number(invoice.subtotal).toFixed(2)} SAR`)
        .text(`Total Amount: ${Number(invoice.totalAmount).toFixed(2)} SAR`)
        .text(`Collected: ${collected.toFixed(2)} SAR`)
        .text(`Outstanding: ${outstanding.toFixed(2)} SAR`)
        .moveDown(1);

      // Footer
      doc
        .fontSize(10)
        .fillColor("white")
        .text("Thank you for your business.", { align: "center" })
        .text("شكراً لتعاملكم معنا", { align: "center" });

      doc.end();

      return reply.send(stream);
    }
  );
}
