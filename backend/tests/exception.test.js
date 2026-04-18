const request = require('supertest');
const app = require('../server');
const { getAuthHeader } = require('./helpers/authHelper');

describe('Exception API', () => {
  let testShipmentId;
  let testExceptionId;

  beforeAll(async () => {
    // Create order + shipment for exception tests
    const adminHeaders = await getAuthHeader('ADMIN');
    const orderRes = await request(app)
      .post('/api/orders')
      .set(adminHeaders)
      .send({
        sender_name: 'Exc Sender', sender_email: 'e@t.com', sender_phone: '111',
        pickup_address: 'A', pickup_city: 'Mumbai',
        receiver_name: 'Exc Receiver', receiver_phone: '222',
        delivery_address: 'B', delivery_city: 'Delhi',
        origin_warehouse_id: 1,
      });
    const orderId = orderRes.body.order.order_id;

    const mgrHeaders = await getAuthHeader('MANAGER');
    const shipRes = await request(app)
      .post('/api/shipments')
      .set(mgrHeaders)
      .send({ order_id: orderId, items_count: 1 });
    testShipmentId = shipRes.body.shipment.shipment_id;
  });

  describe('POST /api/exceptions', () => {
    it('should create exception as DRIVER', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app)
        .post('/api/exceptions')
        .set(headers)
        .send({
          shipment_id: testShipmentId,
          exception_type: 'DELAYED',
          severity: 'MEDIUM',
          description: 'Package delayed due to traffic',
        });
      expect(res.status).toBe(201);
      expect(res.body.exception).toHaveProperty('exception_id');
      testExceptionId = res.body.exception.exception_id;
    });

    it('should create exception as WAREHOUSE_STAFF', async () => {
      const headers = await getAuthHeader('WAREHOUSE_STAFF');
      const res = await request(app)
        .post('/api/exceptions')
        .set(headers)
        .send({
          shipment_id: testShipmentId,
          exception_type: 'DAMAGED',
          severity: 'HIGH',
          description: 'Package arrived damaged',
        });
      expect(res.status).toBe(201);
    });

    it('should reject exception creation by CUSTOMER', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const res = await request(app)
        .post('/api/exceptions')
        .set(headers)
        .send({
          shipment_id: testShipmentId,
          exception_type: 'DELAYED',
          severity: 'LOW',
          description: 'Test',
        });
      expect(res.status).toBe(403);
    });

    it('should reject exception with missing fields', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app)
        .post('/api/exceptions')
        .set(headers)
        .send({ shipment_id: testShipmentId });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/exceptions', () => {
    it('should return exceptions for ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/exceptions').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return own exceptions for DRIVER', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app).get('/api/exceptions').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/exceptions');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/exceptions/:exceptionId', () => {
    it('should return exception by ID', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get(`/api/exceptions/${testExceptionId}`).set(headers);
      expect(res.status).toBe(200);
      expect(res.body.exception_id).toBe(testExceptionId);
    });

    it('should return 404 for non-existent exception', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/exceptions/999999').set(headers);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/exceptions/shipment/:shipmentId', () => {
    it('should return exceptions for a shipment', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get(`/api/exceptions/shipment/${testShipmentId}`).set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/exceptions/:exceptionId/resolve', () => {
    it('should resolve exception as ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .patch(`/api/exceptions/${testExceptionId}/resolve`)
        .set(headers)
        .send({ resolutionNotes: 'Resolved by rerouting package' });
      expect(res.status).toBe(200);
    });

    it('should reject resolution by DRIVER', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app)
        .patch(`/api/exceptions/${testExceptionId}/resolve`)
        .set(headers)
        .send({ resolutionNotes: 'Attempted resolution' });
      expect(res.status).toBe(403);
    });

    it('should reject resolution with missing notes', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app)
        .patch(`/api/exceptions/${testExceptionId}/resolve`)
        .set(headers)
        .send({});
      expect(res.status).toBe(400);
    });
  });
});
