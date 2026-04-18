const billingService = require('../services/billingService');

class BillingController {
  async createInvoice(req, res) {
    try {
      const invoiceData = {
        order_id: parseInt(req.body.order_id, 10),
        sender_name: req.body.sender_name,
        amount: parseFloat(req.body.amount),
        tax_amount: parseFloat(req.body.tax_amount || 0),
        total_amount: parseFloat(req.body.total_amount || req.body.amount),
      };

      const invoice = await billingService.createInvoice(invoiceData);
      res.status(201).json({ message: 'Invoice created successfully', invoice });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInvoiceById(req, res) {
    try {
      const invoiceId = parseInt(req.params.invoiceId, 10);
      if (isNaN(invoiceId)) return res.status(400).json({ error: 'Invalid invoice ID' });

      const invoice = await billingService.getInvoiceById(invoiceId);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      res.status(200).json(invoice);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrderInvoices(req, res) {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

      const invoices = await billingService.getInvoicesByOrder(orderId);
      res.status(200).json(invoices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInvoicesByStatus(req, res) {
    try {
      const { status } = req.query;
      const invoices = await billingService.getInvoicesByStatus(status);
      res.status(200).json(invoices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateInvoiceStatus(req, res) {
    try {
      const invoiceId = parseInt(req.params.invoiceId, 10);
      if (isNaN(invoiceId)) return res.status(400).json({ error: 'Invalid invoice ID' });

      const { status } = req.body;
      const invoice = await billingService.updateInvoiceStatus(invoiceId, status);
      res.status(200).json({ message: 'Invoice status updated', invoice });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWeeklyReport(req, res) {
    try {
      const report = await billingService.getWeeklyReport();
      res.status(200).json(report);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new BillingController();
