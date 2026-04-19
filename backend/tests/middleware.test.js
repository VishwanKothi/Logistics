const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

describe('Middleware', () => {
  // --- Auth Middleware ---
  describe('Authentication (authMiddleware)', () => {
    it('should return 401 for request without token', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/no token/i);
    });

    it('should return 401 for request with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(401);
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { user_id: 1, email: 'admin@example.com', role: 'ADMIN' },
        config.JWT_SECRET,
        { expiresIn: '0s' }
      );
      // Wait a tick for it to expire
      await new Promise(r => setTimeout(r, 100));
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
    });

    it('should return 401 for token with wrong secret', async () => {
      const badToken = jwt.sign(
        { user_id: 1, email: 'admin@example.com', role: 'ADMIN' },
        'wrong_secret_key',
        { expiresIn: '1h' }
      );
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${badToken}`);
      expect(res.status).toBe(401);
    });

    it('should return 401 for malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'NotBearer sometoken');
      expect(res.status).toBe(401);
    });
  });

  // --- Role Middleware ---
  describe('Role Authorization (roleMiddleware)', () => {
    it('should return 403 when CUSTOMER accesses admin-only billing', async () => {
      // First login as customer
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: 'customer1@example.com', password: 'password123' });
      const token = loginRes.body.token;

      const res = await request(app)
        .get('/api/billing/reports/weekly')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/insufficient permissions/i);
    });

    it('should return 403 when DRIVER accesses order creation', async () => {
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: 'driver1-mumbai@example.com', password: 'password123' });
      const token = loginRes.body.token;

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sender_name: 'X', pickup_address: 'X', pickup_city: 'X',
          receiver_name: 'X', receiver_phone: 'X', delivery_address: 'X',
          delivery_city: 'X', origin_warehouse_id: 1,
        });
      expect(res.status).toBe(403);
    });
  });

  // --- Validation Middleware ---
  describe('Validation (handleValidationErrors)', () => {
    it('should return 400 with validation errors for invalid login body', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'not-an-email', password: '' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it('should return 400 for empty registration body', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  // --- 404 Handler ---
  describe('404 Handler', () => {
    it('should return 404 for non-existent route', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/route not found/i);
    });
  });

  // --- Health Check ---
  describe('Health Check', () => {
    it('should return 200 with status UP', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
    });
  });
});
