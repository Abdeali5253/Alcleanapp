import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';

let app: Express;
let validateProductionConfiguration: (env: NodeJS.ProcessEnv) => void;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.ALLOWED_ORIGINS = 'https://alclean.pk';
  ({ default: app, validateProductionConfiguration } = await import('./index.js'));
});

describe('security regression routes', () => {
  it('fails closed when production configuration is incomplete', () => {
    expect(() => validateProductionConfiguration({})).toThrow(/ALLOWED_ORIGINS/);
    expect(() =>
      validateProductionConfiguration({
        ALLOWED_ORIGINS: 'https://alclean.pk',
        GOOGLE_CLIENT_ID: 'client',
      }),
    ).toThrow(/Shopify/);
  });

  it.each([
    ['post', '/api/notifications/send'],
    ['post', '/api/notifications/send-to-user'],
    ['post', '/api/notifications/send-to-token'],
    ['get', '/api/notifications/devices'],
    ['get', '/api/notifications/status'],
    ['post', '/api/shopify/create-order'],
  ] as const)('keeps removed %s %s route unavailable', async (method, path) => {
    const response = await request(app)[method](path).send({});
    expect(response.status).toBe(404);
  });

  it('rejects notification history without a customer token', async () => {
    const response = await request(app).get('/api/notifications/history');
    expect(response.status).toBe(401);
  });

  it('rejects a malformed customer token without contacting Shopify', async () => {
    const response = await request(app)
      .get('/api/notifications/history')
      .set('Authorization', 'Bearer short');
    expect(response.status).toBe(401);
  });

  it('rejects a well-formed but invalid or expired customer token', async () => {
    const response = await request(app)
      .get('/api/notifications/history')
      .set('Authorization', `Bearer ${'x'.repeat(20)}`);
    expect(response.status).toBe(401);
  });

  it('rejects hostile browser origins', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'https://attacker.example');
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('enforces the bounded JSON request size', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'a'.repeat(40_000), password: 'x' });
    expect(response.status).toBe(413);
  });

  it('rate limits repeated authentication attempts', async () => {
    let response = await request(app).post('/api/auth/login').send({});
    for (let attempt = 1; attempt < 21; attempt += 1) {
      response = await request(app).post('/api/auth/login').send({});
    }
    expect(response.status).toBe(429);
  });
});
