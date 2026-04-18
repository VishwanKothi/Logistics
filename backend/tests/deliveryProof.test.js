const request = require('supertest');
const app = require('../server');
const { getAuthHeader } = require('./helpers/authHelper');
const path = require('path');
const fs = require('fs');

describe('Delivery Proof API', () => {
  let testShipmentId;

  beforeAll(async () => {
    // Create order + shipment for proof tests
    const adminHeaders = await getAuthHeader('ADMIN');
    const orderRes = await request(app)
      .post('/api/orders')
      .set(adminHeaders)
      .send({
        sender_name: 'Proof Sender', sender_email: 'p@t.com', sender_phone: '111',
        pickup_address: 'A', pickup_city: 'Mumbai',
        receiver_name: 'Proof Receiver', receiver_phone: '222',
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

  describe('POST /api/delivery-proofs/upload', () => {
    it('should upload proof as DRIVER', async () => {
      const headers = await getAuthHeader('DRIVER');
      // Create a temporary test file
      const testFilePath = path.join(__dirname, 'test_proof.txt');
      fs.writeFileSync(testFilePath, 'test proof content');

      const res = await request(app)
        .post('/api/delivery-proofs/upload')
        .set(headers)
        .field('shipment_id', testShipmentId)
        .field('proof_type', 'PHOTO')
        .attach('proof', testFilePath);

      // Clean up
      fs.unlinkSync(testFilePath);

      expect(res.status).toBe(201);
      expect(res.body.proof).toHaveProperty('proof_id');
    });

    it('should reject upload without file', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app)
        .post('/api/delivery-proofs/upload')
        .set(headers)
        .field('shipment_id', testShipmentId)
        .field('proof_type', 'PHOTO');
      expect(res.status).toBe(400);
    });

    it('should reject upload by CUSTOMER', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const testFilePath = path.join(__dirname, 'test_proof2.txt');
      fs.writeFileSync(testFilePath, 'test');

      const res = await request(app)
        .post('/api/delivery-proofs/upload')
        .set(headers)
        .field('shipment_id', testShipmentId)
        .field('proof_type', 'PHOTO')
        .attach('proof', testFilePath);

      fs.unlinkSync(testFilePath);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/delivery-proofs', () => {
    it('should return proofs for ADMIN', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/delivery-proofs').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return own proofs for DRIVER', async () => {
      const headers = await getAuthHeader('DRIVER');
      const res = await request(app).get('/api/delivery-proofs').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/delivery-proofs');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/delivery-proofs/shipment/:shipmentId', () => {
    it('should return proofs for a shipment', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get(`/api/delivery-proofs/shipment/${testShipmentId}`).set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 400 for invalid shipment ID', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/delivery-proofs/shipment/abc').set(headers);
      expect(res.status).toBe(400);
    });
  });
});
