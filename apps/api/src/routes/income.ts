import { FastifyPluginAsync } from 'fastify';
import PDFDocument from 'pdfkit';
import { numberToWords } from '@quantum-finance/utils';

const incomeRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all bills
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request) => {
    const { companyId } = (request as any).user;

    const bills = await fastify.prisma.incomeBill.findMany({
      where: { companyId },
      include: {
        items: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return bills;
  });

  // Get bill by ID
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;

    const bill = await fastify.prisma.incomeBill.findFirst({
      where: { id, companyId },
      include: {
        items: true,
        payments: true,
        dues: true
      }
    });

    if (!bill) {
      throw { statusCode: 404, message: 'Bill not found' };
    }

    return bill;
  });

  // Create bill
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request) => {
    const { userId, companyId } = (request as any).user;
    const { clientName, clientAddress, clientContact, items, vatEnabled, vatRate, discount, remarks } = request.body as any;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw { statusCode: 400, message: 'At least one bill item is required' };
    }

    // Calculate amounts
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.rate), 0);
    let totalAmount = subtotal;

    if (discount) {
      totalAmount -= discount;
    }

    if (vatEnabled && vatRate) {
      totalAmount += (totalAmount * vatRate) / 100;
    }

    // Generate bill number
    const count = await fastify.prisma.incomeBill.count({ where: { companyId } });
    const billNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Create bill
    const bill = await fastify.prisma.incomeBill.create({
      data: {
        companyId,
        billNumber,
        clientName,
        clientAddress,
        clientContact,
        vatEnabled,
        vatRate,
        discount,
        subtotal,
        totalAmount,
        amountInWords: numberToWords(Math.floor(totalAmount)),
        remarks,
        status: 'DRAFT',
        items: {
          create: items.map((item: any, index: number) => ({
            serialNumber: index + 1,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
            remarks: item.remarks
          }))
        }
      },
      include: {
        items: true
      }
    });

    // Log audit
    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'CREATE',
        module: 'INCOME',
        entityType: 'IncomeBill',
        entityId: bill.id,
        metadata: { billNumber, totalAmount }
      }
    });

    return bill;
  });

  // Update bill status
  fastify.patch('/:id/status', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = request.params as any;
    const { userId, companyId } = (request as any).user;
    const { status } = request.body as any;

    if (!['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'REJECTED'].includes(status)) {
      throw { statusCode: 400, message: 'Invalid status' };
    }

    const bill = await fastify.prisma.incomeBill.findFirst({
      where: { id, companyId }
    });

    if (!bill) {
      throw { statusCode: 404, message: 'Bill not found' };
    }

    const updated = await fastify.prisma.incomeBill.update({
      where: { id },
      data: { status, updatedAt: new Date() },
      include: {
        items: true,
        payments: true
      }
    });

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'UPDATE',
        module: 'INCOME',
        entityType: 'IncomeBill',
        entityId: id,
        metadata: { status }
      }
    });

    return updated;
  });

  // Add payment
  fastify.post('/:id/payments', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = request.params as any;
    const { userId, companyId } = (request as any).user;
    const { amount, method, reference } = request.body as any;

    const bill = await fastify.prisma.incomeBill.findFirst({
      where: { id, companyId }
    });

    if (!bill) {
      throw { statusCode: 404, message: 'Bill not found' };
    }

    const payment = await fastify.prisma.incomePayment.create({
      data: {
        billId: id,
        amount,
        method,
        reference,
        paymentDate: new Date()
      }
    });

    // Check if fully paid
    const payments = await fastify.prisma.incomePayment.findMany({
      where: { billId: id }
    });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    let newStatus = bill.status;
    if (totalPaid >= Number(bill.totalAmount)) {
      newStatus = 'PAID';
    } else if (totalPaid > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    await fastify.prisma.incomeBill.update({
      where: { id },
      data: { status: newStatus }
    });

    await fastify.prisma.auditLog.create({
      data: {
        userId,
        companyId,
        actionType: 'CREATE',
        module: 'INCOME',
        entityType: 'IncomePayment',
        entityId: payment.id,
        metadata: { billId: id, amount }
      }
    });

    return payment;
  });
};

export default incomeRoutes;
