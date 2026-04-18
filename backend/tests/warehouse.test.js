const request = require('supertest');
const app = require('../server');
const { getAuthHeader } = require('./helpers/authHelper');

describe('Warehouse API', () => {
  describe('GET /api/warehouses', () => {
    it('should return all warehouses (public endpoint)', async () => {
      const res = await request(app).get('/api/warehouses');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('warehouse_id');
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('city');
    });
  });

  describe('GET /api/warehouses/:warehouseId', () => {
    it('should return warehouse by ID with users', async () => {
      const res = await request(app).get('/api/warehouses/1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('warehouse_id', 1);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('should return 404 for non-existent warehouse', async () => {
      const res = await request(app).get('/api/warehouses/999999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/warehouses/:warehouseId/drivers', () => {
    it('should return drivers for a warehouse (authenticated)', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/warehouses/1/drivers').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/warehouses/1/drivers');
      expect(res.status).toBe(401);
    });
  });
});
