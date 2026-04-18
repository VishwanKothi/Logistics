const request = require('supertest');
const app = require('../../server');

const TEST_ACCOUNTS = {
  ADMIN: { email: 'admin@example.com', password: 'password123' },
  CUSTOMER: { email: 'customer@example.com', password: 'password123' },
  MANAGER: { email: 'manager-mumbai@example.com', password: 'password123' },
  DRIVER: { email: 'driver1-mumbai@example.com', password: 'password123' },
  WAREHOUSE_STAFF: { email: 'staff-mumbai@example.com', password: 'password123' },
};

const tokenCache = {};

/**
 * Get a valid Bearer token for the given role.
 * Caches tokens to avoid repeated login calls.
 */
async function getAuthToken(role) {
  if (tokenCache[role]) return tokenCache[role];

  const account = TEST_ACCOUNTS[role];
  if (!account) throw new Error(`No test account for role: ${role}`);

  const res = await request(app)
    .post('/api/users/login')
    .send(account);

  if (res.status !== 200) {
    throw new Error(`Login failed for ${role}: ${res.body.error || res.status}`);
  }

  tokenCache[role] = res.body.token;
  return res.body.token;
}

/**
 * Get auth header object for the given role.
 */
async function getAuthHeader(role) {
  const token = await getAuthToken(role);
  return { Authorization: `Bearer ${token}` };
}

module.exports = { getAuthToken, getAuthHeader, TEST_ACCOUNTS };
