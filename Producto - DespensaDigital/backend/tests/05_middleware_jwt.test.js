'use strict';
/**
 * SUITE 5 — Middleware JWT
 * CP-011:  Sin token → 401
 * CP-012a: Firma inválida → 401
 * CP-012b: Token expirado → 401 con mensaje de sesión
 * CP-012c: Sin prefijo "Bearer " → 401
 * CP-013:  Token válido → acceso permitido (200)
 */
const request = require('supertest');
const app     = require('../src/server');
const { generarTokenValido, generarTokenExpirado, generarTokenFirmaInvalida } = require('./setup');

describe('Módulo: Middleware JWT', () => {

  test('CP-011 | Sin header Authorization → HTTP 401 token requerido', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/token de autenticación requerido/i);
  });

  test('CP-012a | Token con firma inválida → HTTP 401 token inválido', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${generarTokenFirmaInvalida()}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/token inválido/i);
  });

  test('CP-012b | Token expirado → HTTP 401 sesión expirada', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${generarTokenExpirado()}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/sesión expirada/i);
  });

  test('CP-012c | Header sin prefijo Bearer → HTTP 401', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', generarTokenValido());
    expect(res.statusCode).toBe(401);
  });

  test('CP-013 | Token válido → HTTP 200 acceso permitido', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${generarTokenValido()}`);
    expect(res.statusCode).toBe(200);
  });

});
