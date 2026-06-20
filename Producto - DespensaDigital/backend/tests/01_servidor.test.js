'use strict';
/**
 * SUITE 1 — Servidor / Infraestructura
 * CP-001: Disponibilidad del servidor (GET /health)
 * CP-002: Headers de seguridad HTTP
 * CP-003: Ruta inexistente → 404
 */
const request = require('supertest');
const app     = require('../src/server');

describe('Módulo: Servidor / Infraestructura', () => {

  test('CP-001 | GET /health → HTTP 200 con status ok y timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  test('CP-002 | GET /health → headers de seguridad presentes (x-powered-by desactivado)', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.statusCode).toBe(200);
  });

  test('CP-003 | GET /api/ruta-inexistente → HTTP 404 con mensaje de error', async () => {
    const res = await request(app).get('/api/ruta-inexistente');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/no encontrada/i);
  });

});
