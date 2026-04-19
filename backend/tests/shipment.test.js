const request = require('supertest');
const app = require('../server');
const { getAuthHeader } = require('./helpers/authHelper');

describe('Shipment API', () => {
  let testOrderId;
  let testShipmentId;

  beforeAll(async () => {
    // Get a valid warehouse ID
    const headers = await getAuthHeader('ADMIN');
    const whRes = await request(app).get('/api/warehouses').set(headers);
    const validWhId = whRes.body[0]?.warehouse_id || 1;

    // Create a test order to attach shipments to
    const res = await request(app)
      .post('/api/orders')
      .set(headers)
      .send({
        sender_name: 'Ship Sender', sender_email: 's@t.com', sender_phone: '111',
        pickup_address: 'A', pickup_city: 'Mumbai',
        receiver_name: 'Ship Receiver', receiver_phone: '222',
        delivery_address: 'B', delivery_city: 'Delhi',
        origin_warehouse_id: validWhId,
        items_count: 2,
        weight_kg: 5.5
      });
    testOrderId = res.body.order.order_id;
  });

  describe('POST /api/shipments', () => {
    it('should create a shipment as MANAGER', async () => {
      const headers = await getAuthHeader('MANAGER');
      const res = await request(app)
        .post('/api/shipments')
        .set(headers)
        .send({ order_id: testOrderId, items_count: 5, weight_kg: 2.5 });
      expect(res.status).toBe(201);
      expect(res.body.shipment).toHaveProperty('shipment_id');
      testShipmentId = res.body.shipment.shipment_id;
    });

    it('should reject shipment creation by CUSTOMER', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const res = await request(app)
        .post('/api/shipments')
        .set(headers)
        .send({ order_id: testOrderId });
      expect(res.status).toBe(403);
    });

    it('should reject shipment with missing order_id', async () => {
      const headers = await getAuthHeader('MANAGER');
      const res = await request(app)
        .post('/api/shipments')
        .set(headers)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/shipments/:shipmentId', () => {
    it('should return shipment by ID', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get(`/api/shipments/${testShipmentId}`).set(headers);
      expect(res.status).toBe(200);
      expect(res.body.shipment_id).toBe(testShipmentId);
    });

    it('should return 404 for non-existent shipment', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/shipments/999999').set(headers);
      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ID', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/shipments/abc').set(headers);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/shipments/order/:orderId', () => {
    it('should return shipments for an order', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get(`/api/shipments/order/${testOrderId}`).set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/shipments/active', () => {
    it('should return active shipments for ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/shipments/active').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/shipments/warehouse', () => {
    it('should return warehouse shipments for MANAGER', async () => {
      const headers = await getAuthHeader('MANAGER');
      const res = await request(app).get('/api/shipments/warehouse').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject for CUSTOMER', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const res = await request(app).get('/api/shipments/warehouse').set(headers);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/shipments/:shipmentId/status', () => {
    it('should update shipment status as ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .patch(`/api/shipments/${testShipmentId}/status`)
        .set(headers)
        .send({ newStatus: 'PICKED_UP', changeReason: 'Test' });
      expect(res.status).toBe(200);
    });

    it('should reject status that role cannot set', async () => {
      const headers = await getAuthHeader('WAREHOUSE_STAFF');
      const res = await request(app)
        .patch(`/api/shipments/${testShipmentId}/status`)
        .set(headers)
        .send({ newStatus: 'DELIVERED' });
      expect(res.status).toBe(403);
    });

    it('should reject with missing newStatus', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .patch(`/api/shipments/${testShipmentId}/status`)
        .set(headers)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/shipments/:shipmentId/route', () => {
    let validDestWhId = 2;
    beforeAll(async () => {
      const headers = await getAuthHeader('ADMIN');
      const whRes = await request(app).get('/api/warehouses').set(headers);
      if (whRes.body && whRes.body.length > 1) validDestWhId = whRes.body[1].warehouse_id;
      else if (whRes.body && whRes.body.length > 0) validDestWhId = whRes.body[0].warehouse_id;
    });

    it('should route shipment as MANAGER', async () => {
      const headers = await getAuthHeader('MANAGER');
      const res = await request(app)
        .patch(`/api/shipments/${testShipmentId}/route`)
        .set(headers)
        .send({ dest_warehouse_id: validDestWhId });
      expect(res.status).toBe(200);
    });

    it('should reject routing by DRIVER', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app)
        .patch(`/api/shipments/${testShipmentId}/route`)
        .set(headers)
        .send({ dest_warehouse_id: validDestWhId });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/shipments/driver/deliveries', () => {
    it('should return pending deliveries for DRIVER', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app).get('/api/shipments/driver/deliveries').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject for non-DRIVER roles', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const res = await request(app).get('/api/shipments/driver/deliveries').set(headers);
      expect(res.status).toBe(403);
    });
  });
});
