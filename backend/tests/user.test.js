const request = require('supertest');
const app = require('../server');
const { getAuthHeader } = require('./helpers/authHelper');

describe('User API', () => {
  // --- Registration ---
  describe('POST /api/users/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          email: `testuser_${Date.now()}@test.com`,
          phone: '9999999999',
          password: 'password123',
          role: 'CUSTOMER',
        });
      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('user_id');
      expect(res.body.user.role).toBe('CUSTOMER');
    });

    it('should reject registration with missing name', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ email: 'x@x.com', phone: '123', password: 'password123', role: 'CUSTOMER' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ name: 'X', email: 'notanemail', phone: '123', password: 'password123', role: 'CUSTOMER' });
      expect(res.status).toBe(400);
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({ name: 'X', email: 'x@x.com', phone: '123', password: '12', role: 'CUSTOMER' });
      expect(res.status).toBe(400);
    });
  });

  // --- Login ---
  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'admin@example.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('user_id');
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'admin@example.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });
      expect(res.status).toBe(401);
    });

    it('should reject login with missing password', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'admin@example.com' });
      expect(res.status).toBe(400);
    });
  });

  // --- Profile ---
  describe('GET /api/users/profile', () => {
    it('should return profile for authenticated user', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/users/profile').set(headers);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user_id');
      expect(res.body).toHaveProperty('email');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/users/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update profile for authenticated user', async () => {
      const headers = await getAuthHeader('CUSTOMER');
      const res = await request(app)
        .put('/api/users/profile')
        .set(headers)
        .send({ name: 'Updated Customer Name' });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Customer Name');
    });
  });

  // --- Get Users by Role ---
  describe('GET /api/users/role/:role', () => {
    it('should return users of the specified role', async () => {
      const headers = await getAuthHeader('ADMIN');
      const res = await request(app).get('/api/users/role/DRIVER').set(headers);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/users/role/DRIVER');
      expect(res.status).toBe(401);
    });
  });
});
