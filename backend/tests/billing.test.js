const request = require('supertest');
const app = require('../server');
const { getAuthHeader } = require('./helpers/authHelper');

describe('Billing API', () => {
  let testInvoiceId;

  // We need an existing order to create invoices against
  let testOrderId;
  beforeAll(async () => {
    const headers = await getAuthHeader('ADMIN');
    const res = await request(app)
      .post('/api/orders')
      .set(headers)
      .send({
        sender_name: 'Bill Sender', sender_email: 'b@t.com', sender_phone: '111',
        pickup_address: 'A', pickup_city: 'Mumbai',
        receiver_name: 'Bill Receiver', receiver_phone: '222',
        delivery_address: 'B', delivery_city: 'Delhi',
        origin_warehouse_id: 1,
      });
    testOrderId = res.body.order.order_id;
  });

  describe('POST /api/billing', () => {
    it('should create an invoice as ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .post('/api/billing')
        .set(headers)
        .send({ order_id: testOrderId, amount: 500, sender_name: 'Bill Sender', tax_amount: 90, total_amount: 590 });
      expect(res.status).toBe(201);
      expect(res.body.invoice).toHaveProperty('invoice_id');
      testInvoiceId = res.body.invoice.invoice_id;
    });

    it('should reject invoice creation by CUSTOMER', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const res = await request(app)
        .post('/api/billing')
        .set(headers)
        .send({ order_id: testOrderId, amount: 100 });
      expect(res.status).toBe(403);
    });

    it('should reject invoice with missing amount', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .post('/api/billing')
        .set(headers)
        .send({ order_id: testOrderId });
      expect(res.status).toBe(400);
    });

    it('should reject invoice with negative amount', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .post('/api/billing')
        .set(headers)
        .send({ order_id: testOrderId, amount: -10 });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/billing/:invoiceId', () => {
    it('should return invoice by ID', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get(`/api/billing/${testInvoiceId}`).set(headers);
      expect(res.status).toBe(200);
      expect(res.body.invoice_id).toBe(testInvoiceId);
    });

    it('should return 404 for non-existent invoice', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/billing/999999').set(headers);
      expect(res.status).toBe(404);
    });

    it('should reject for non-ADMIN', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app).get(`/api/billing/${testInvoiceId}`).set(headers);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/billing/order/:orderId', () => {
    it('should return invoices for an order', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get(`/api/billing/order/${testOrderId}`).set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/billing/status', () => {
    it('should return invoices filtered by status', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/billing/status?status=DRAFT').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject for non-ADMIN', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const res = await request(app).get('/api/billing/status?status=DRAFT').set(headers);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/billing/:invoiceId/status', () => {
    it('should update invoice status as ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .patch(`/api/billing/${testInvoiceId}/status`)
        .set(headers)
        .send({ status: 'ISSUED' });
      expect(res.status).toBe(200);
    });

    it('should reject with missing status', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .patch(`/api/billing/${testInvoiceId}/status`)
        .set(headers)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/billing/reports/weekly', () => {
    it('should return weekly report for ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/billing/reports/weekly').set(headers);
      expect(res.status).toBe(200);
    });

    it('should reject for non-ADMIN', async () => {
      const headers = await getAuthHeader('MANAGER');
      const res = await request(app).get('/api/billing/reports/weekly').set(headers);
      expect(res.status).toBe(403);
    });
  });
});
