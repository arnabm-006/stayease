import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

describe('Authentication & Authorization Suite', () => {
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'SecurePassword@123',
    firstName: 'Alexander',
    lastName: 'Wright',
    phone: '+1 555-0199',
  };

  it('should hash and verify passwords securely with bcrypt', async () => {
    const raw = 'MySecretPass123';
    const hash = await hashPassword(raw);
    expect(hash).not.toBe(raw);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isBadMatch = await verifyPassword('WrongPassword', hash);
    expect(isBadMatch).toBe(false);
  });

  it('should register a new customer account successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.role).toBe('CUSTOMER');
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject duplicate email registration with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should authenticate with correct credentials and issue session token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject login with wrong password with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'IncorrectPassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject unauthenticated access to protected routes with 401', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject ordinary customer from accessing administration dashboard with 403', async () => {
    // Login as test customer
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginRes.body.data.token;

    const adminRes = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(adminRes.status).toBe(403);
    expect(adminRes.body.success).toBe(false);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email.toLowerCase() },
    });
  });
});
