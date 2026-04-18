const prisma = require('../config/database');

class BillingService {
  async createInvoice(invoiceData) {
    const invoice_number = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoice_number,
        order_id: invoiceData.order_id,
        sender_name: invoiceData.sender_name,
        amount: invoiceData.amount,
        tax_amount: invoiceData.tax_amount || 0,
        total_amount: invoiceData.total_amount || invoiceData.amount,
        status: 'DRAFT',
      },
    });
    return invoice;
  }

  async getInvoiceById(invoiceId) {
    const invoice = await prisma.invoice.findUnique({ where: { invoice_id: invoiceId } });
    return invoice || null;
  }

  async getInvoicesByOrder(orderId) {
    return prisma.invoice.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'desc' },
    });
  }

  async getInvoicesByStatus(status) {
    const where = {};
    if (status) where.status = status;

    return prisma.invoice.findMany({ where, orderBy: { created_at: 'desc' } });
  }

  async updateInvoiceStatus(invoiceId, newStatus) {
    const invoice = await prisma.invoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: newStatus,
        ...(newStatus === 'ISSUED' && { issued_date: new Date() }),
        ...(newStatus === 'PAID' && { paid_date: new Date() }),
      },
    });
    return invoice;
  }

  async getWeeklyReport() {
    const reportPeriodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const shipments = await prisma.shipment.findMany({
      where: { created_at: { gte: reportPeriodStart } },
      select: { status: true },
    });

    const invoices = await prisma.invoice.findMany({
      where: { created_at: { gte: reportPeriodStart } },
      select: { total_amount: true },
    });

    return {
      total_shipments: shipments.length,
      delivered_count: shipments.filter(s => s.status === 'DELIVERED').length,
      failed_count: shipments.filter(s => s.status === 'FAILED_DELIVERY').length,
      total_billing_amount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    };
  }
}

module.exports = new BillingService();
