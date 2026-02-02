import { FastifyInstance } from "fastify";

export async function procurementRoutes(app: FastifyInstance) {
  // Vendors
  app.get(
    "/vendors",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROCUREMENT", "VIEW")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const vendors = await app.prisma.vendor.findMany({ where: { companyId } });
      return { success: true, vendors };
    }
  );

  app.post(
    "/vendors",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROCUREMENT", "CREATE")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const body = req.body as {
        name: string;
        code: string;
        email?: string;
        phone?: string;
        contactName?: string;
        address?: string;
      };
      const vendor = await app.prisma.vendor.create({
        data: { companyId, ...body }
      });
      return { success: true, vendor };
    }
  );

  app.patch(
    "/vendors/:id",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROCUREMENT", "UPDATE")
      ]
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const companyId = req.companyId as string;
      const body = req.body as Partial<{
        name: string;
        code: string;
        email?: string;
        phone?: string;
        contactName?: string;
        address?: string;
        isActive?: boolean;
      }>;
      const vendor = await app.prisma.vendor.updateMany({
        where: { id, companyId },
        data: body
      });
      return { success: true, vendor };
    }
  );

  // Purchase Orders
  app.get(
    "/purchase-orders",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROCUREMENT", "VIEW")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const orders = await app.prisma.purchaseOrder.findMany({
        where: { companyId },
        include: { vendor: true, project: true }
      });
      return { success: true, orders };
    }
  );

  app.post(
    "/purchase-orders",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROCUREMENT", "CREATE")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const body = req.body as {
        vendorId: string;
        projectId?: string;
        poNumber: string;
        issueDate: string;
        notes?: string;
        items: { description: string; quantity: number; unitPrice: number }[];
      };
      const order = await app.prisma.purchaseOrder.create({
        data: {
          companyId,
          vendorId: body.vendorId,
          projectId: body.projectId,
          poNumber: body.poNumber,
          issueDate: new Date(body.issueDate),
          notes: body.notes,
          items: {
            create: body.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.quantity * item.unitPrice
            }))
          }
        }
      });
      return { success: true, order };
    }
  );

  // Goods Received Notes
  app.post(
    "/purchase-orders/:id/grn",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROCUREMENT", "CREATE")
      ]
    },
    async (req: any, reply) => {
      const { id } = req.params as { id: string };
      const body = req.body as {
        grnNumber: string;
        receivedDate: string;
        items: { poItemId: string; quantity: number; description: string }[];
        notes?: string;
      };
      const po = await app.prisma.purchaseOrder.findFirst({
        where: { id }
      });
      if (!po) return reply.status(404).send({ error: "PO not found" });
      
      const grn = await app.prisma.goodsReceivedNote.create({
        data: {
          companyId: po.companyId,
          purchaseOrderId: id,
          grnNumber: body.grnNumber,
          receivedDate: new Date(body.receivedDate),
          notes: body.notes || null,
          items: {
            create: body.items.map(item => ({
              poItemId: item.poItemId,
              description: item.description,
              quantity: item.quantity
            }))
          }
        }
      });
      
      // Update PO status based on received quantities
      await app.prisma.purchaseOrder.update({
        where: { id },
        data: { status: "PARTIALLY_RECEIVED" }
      });
      
      return { success: true, grn };
    }
  );

  // Vendor Invoices
  app.post(
    "/vendor-invoices",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROCUREMENT", "CREATE")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const body = req.body as {
        vendorId: string;
        purchaseOrderId?: string;
        invoiceNumber: string;
        invoiceDate: string;
        dueDate?: string;
        totalAmount: number;
        notes?: string;
      };
      const invoice = await app.prisma.vendorInvoice.create({
        data: {
          companyId,
          vendorId: body.vendorId,
          purchaseOrderId: body.purchaseOrderId,
          invoiceNumber: body.invoiceNumber,
          invoiceDate: new Date(body.invoiceDate),
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          totalAmount: body.totalAmount,
          notes: body.notes
        }
      });
      return { success: true, invoice };
    }
  );

  // Vendor Payments
  app.post(
    "/vendor-payments",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROCUREMENT", "CREATE")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const body = req.body as {
        vendorId: string;
        invoiceId?: string;
        amount: number;
        paidDate: string;
        method?: string;
        reference?: string;
      };
      const payment = await app.prisma.vendorPayment.create({
        data: {
          companyId,
          vendorId: body.vendorId,
          invoiceId: body.invoiceId,
          amount: body.amount,
          paidDate: new Date(body.paidDate),
          method: body.method,
          reference: body.reference
        }
      });
      return { success: true, payment };
    }
  );

  // Vendor Ledger Aging
  app.get(
    "/vendors/ledger/aging",
    {
      preHandler: [
        app.authenticate,
        app.withCompanyScope,
        app.requirePermission("PROCUREMENT", "VIEW")
      ]
    },
    async (req: any) => {
      const companyId = req.companyId as string;
      const invoices = await app.prisma.vendorInvoice.findMany({
        where: { companyId },
        include: { payments: true, vendor: true }
      });
      
      const now = new Date();
      const buckets = [
        { key: "0-30", from: 0, to: 30 },
        { key: "31-60", from: 31, to: 60 },
        { key: "61-90", from: 61, to: 90 },
        { key: "90+", from: 91, to: 1000 }
      ];
      
      const aging = invoices.map(invoice => {
        const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = Number(invoice.totalAmount) - paid;
        const daysOverdue = Math.max(0, Math.floor((now.getTime() - invoice.dueDate!.getTime()) / (1000 * 60 * 60 * 24)));
        
        const bucket = buckets.find(b => daysOverdue >= b.from && daysOverdue <= b.to);
        
        return {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          vendorName: invoice.vendor.name,
          dueDate: invoice.dueDate,
          totalAmount: invoice.totalAmount,
          paidAmount: paid,
          balance,
          daysOverdue,
          bucket: bucket?.key || "90+"
        };
      });
      
      return { success: true, aging };
    }
  );
}
