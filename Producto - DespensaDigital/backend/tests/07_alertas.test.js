'use strict';
/**
 * SUITE 7 — Sistema de Alertas
 * CP-019:  Sin token → 401
 * CP-020a: dias=0 inválido → 400
 * CP-020b: dias=31 fuera de rango → 400
 * CP-021a: Alertas con token válido → 200 con estructura correcta
 * CP-021b: ?dias=7 respetado → 200 con dias_vencimiento=7
 * CP-022:  Sin alertas activas → 200 con total_alertas=0
 */
const request = require('supertest');
const app     = require('../src/server');
const { generarTokenValido } = require('./setup');

let token;

beforeAll(() => {
  token = generarTokenValido();
});

describe('Módulo: Sistema de Alertas', () => {

  test('CP-019 | GET /api/alertas sin token → HTTP 401', async () => {
    const res = await request(app).get('/api/alertas');
    expect(res.statusCode).toBe(401);
  });

  test('CP-020a | GET /api/alertas?dias=0 → HTTP 400 validación', async () => {
    const res = await request(app)
      .get('/api/alertas?dias=0')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  test('CP-020b | GET /api/alertas?dias=31 → HTTP 400 fuera de rango', async () => {
    const res = await request(app)
      .get('/api/alertas?dias=31')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  test('CP-021a | GET /api/alertas → HTTP 200 con estructura por_vencer, stock_bajo, total_alertas', async () => {
    const res = await request(app)
      .get('/api/alertas')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('por_vencer');
    expect(res.body).toHaveProperty('stock_bajo');
    expect(res.body).toHaveProperty('total_alertas');
    expect(res.body).toHaveProperty('configuracion');
  });

  test('CP-021b | GET /api/alertas?dias=7 → configuracion.dias_vencimiento = 7', async () => {
    const res = await request(app)
      .get('/api/alertas?dias=7')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.configuracion.dias_vencimiento).toBe(7);
  });

  test('CP-022 | GET /api/alertas → total_alertas es número >= 0', async () => {
    const res = await request(app)
      .get('/api/alertas')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.total_alertas).toBe('number');
    expect(res.body.total_alertas).toBeGreaterThanOrEqual(0);
  });

});
