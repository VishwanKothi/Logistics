const request = require('supertest');
const app = require('../server');
const { getAuthHeader } = require('./helpers/authHelper');

describe('Order API', () => {
  let createdOrderId;

  // --- Create Order ---
  describe('POST /api/orders', () => {
    it('should create an order as ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .post('/api/orders')
        .set(headers)
        .send({
          sender_name: 'Test Sender',
          sender_email: 'sender@test.com',
          sender_phone: '1111111111',
          pickup_address: '123 Test St',
          pickup_city: 'Mumbai',
          receiver_name: 'Test Receiver',
          receiver_phone: '2222222222',
          delivery_address: '456 Deliver Ave',
          delivery_city: 'Delhi',
          origin_warehouse_id: 1,
        });
      expect(res.status).toBe(201);
      expect(res.body.order).toHaveProperty('order_id');
      createdOrderId = res.body.order.order_id;
    });

    it('should create an order as CUSTOMER', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const res = await request(app)
        .post('/api/orders')
        .set(headers)
        .send({
          sender_name: 'Customer Sender',
          sender_email: 'cs@test.com',
          sender_phone: '3333333333',
          pickup_address: '789 Pickup Rd',
          pickup_city: 'Mumbai',
          receiver_name: 'Customer Receiver',
          receiver_phone: '4444444444',
          delivery_address: '321 Drop Blvd',
          delivery_city: 'Kolkata',
          origin_warehouse_id: 1,
        });
      expect(res.status).toBe(201);
    });

    it('should reject order creation by DRIVER (forbidden role)', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app)
        .post('/api/orders')
        .set(headers)
        .send({
          sender_name: 'X', pickup_address: 'X', pickup_city: 'X',
          receiver_name: 'X', receiver_phone: 'X', delivery_address: 'X',
          delivery_city: 'X', origin_warehouse_id: 1,
        });
      expect(res.status).toBe(403);
    });

    it('should reject order with missing required fields', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .post('/api/orders')
        .set(headers)
        .send({ sender_name: 'Incomplete' });
      expect(res.status).toBe(400);
    });
  });

  // --- Get Orders ---
  describe('GET /api/orders', () => {
    it('should return orders for ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/orders').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return only own orders for CUSTOMER', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const res = await request(app).get('/api/orders').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).toBe(401);
    });
  });

  // --- Get Order by ID ---
  describe('GET /api/orders/:orderId', () => {
    it('should return order by valid ID', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get(`/api/orders/${createdOrderId}`).set(headers);
      expect(res.status).toBe(200);
      expect(res.body.order_id).toBe(createdOrderId);
    });

    it('should return 404 for non-existent order', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/orders/999999').set(headers);
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid order ID', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/orders/abc').set(headers);
      expect(res.status).toBe(400);
    });
  });

  // --- Update Order ---
  describe('PUT /api/orders/:orderId', () => {
    it('should update order as ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .put(`/api/orders/${createdOrderId}`)
        .set(headers)
        .send({ notes: 'Updated via test' });
      expect(res.status).toBe(200);
    });

    it('should reject update by CUSTOMER', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const res = await request(app)
        .put(`/api/orders/${createdOrderId}`)
        .set(headers)
        .send({ notes: 'Hack attempt' });
      expect(res.status).toBe(403);
    });
  });

  // --- Update Order Status ---
  describe('PATCH /api/orders/:orderId/status', () => {
    it('should update order status as ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .patch(`/api/orders/${createdOrderId}/status`)
        .set(headers)
        .send({ status: 'CONFIRMED' });
      expect(res.status).toBe(200);
    });

    it('should reject status update with missing status field', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .patch(`/api/orders/${createdOrderId}/status`)
        .set(headers)
        .send({});
      expect(res.status).toBe(400);
    });

    it('should reject status update by DRIVER', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app)
        .patch(`/api/orders/${createdOrderId}/status`)
        .set(headers)
        .send({ status: 'CONFIRMED' });
      expect(res.status).toBe(403);
    });
  });
});
