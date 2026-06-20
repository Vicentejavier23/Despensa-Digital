'use strict';
/**
 * SUITE 4 — Autenticación: Exchange Token
 * CP-010a: Sin código → 400
 * CP-010b: Código inválido → 401
 */
const request = require('supertest');
const app     = require('../src/server');

describe('Módulo: Autenticación — Exchange Token', () => {

  test('CP-010a | Exchange sin código → HTTP 400', async () => {
    const res = await request(app).post('/api/auth/exchange').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/código de intercambio requerido/i);
  });

  test('CP-010b | Exchange con código inventado → HTTP 401', async () => {
    const res = await request(app).post('/api/auth/exchange').send({
      code: 'codigo-completamente-invalido-xyz123',
    });
    expect(res.statusCode).toBe(401);
  });

});
