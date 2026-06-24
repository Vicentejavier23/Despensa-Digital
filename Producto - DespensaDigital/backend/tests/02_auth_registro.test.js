'use strict';
/**
 * SUITE 2 — Autenticación: Registro
 * CP-004a: Correo obligatorio
 * CP-004b: Formato de correo inválido
 * CP-004c: Contraseña sin mayúscula
 * CP-004d: Teléfono inválido
 * CP-005: Registro exitoso
 * CP-006: Correo duplicado
 */
const request = require('supertest');
const app     = require('../src/server');

const BASE_VALIDO = {
  pri_nom_usuario:  'Test',
  pri_ape_usuario:  'Usuario',
  correo_usuario:   `test_${Date.now()}@despensa.cl`,
  password_usuario: 'Clave1234',
  num_tel_usuario:  912345678,
  fecha_nac_usuario:'1995-06-15',
};

describe('Módulo: Autenticación — Registro', () => {

  test('CP-004a | Registro sin correo → HTTP 400, campo correo_usuario', async () => {
    const { correo_usuario, ...sinCorreo } = BASE_VALIDO;
    const res = await request(app).post('/api/auth/register').send(sinCorreo);
    expect(res.statusCode).toBe(400);
    expect(res.body.campo).toBe('correo_usuario');
  });

  test('CP-004b | Correo con formato inválido → HTTP 400, campo correo_usuario', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...BASE_VALIDO,
      correo_usuario: 'no-es-correo',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.campo).toBe('correo_usuario');
  });

  test('CP-004c | Contraseña sin mayúscula → HTTP 400, campo password_usuario', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...BASE_VALIDO,
      correo_usuario:   `test_${Date.now()}b@despensa.cl`,
      password_usuario: 'sinmayuscula123',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.campo).toBe('password_usuario');
  });

  test('CP-004d | Teléfono muy corto → HTTP 400, campo num_tel_usuario', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...BASE_VALIDO,
      correo_usuario:  `test_${Date.now()}c@despensa.cl`,
      num_tel_usuario: 123456,
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.campo).toBe('num_tel_usuario');
  });

  test('CP-005 | Registro exitoso → HTTP 201 con exchange_token', async () => {
    const res = await request(app).post('/api/auth/register').send(BASE_VALIDO);
    expect(res.statusCode).toBe(201);
    expect(res.body.exchange_token).toBeDefined();
  });

  test('CP-006 | Correo duplicado → HTTP 409', async () => {
    const res = await request(app).post('/api/auth/register').send(BASE_VALIDO);
    expect(res.statusCode).toBe(409);
  });

});
