'use strict';
/**
 * SUITE 3 — Autenticación: Login
 * CP-007a: Sin correo → 400
 * CP-007b: Correo con formato inválido → 400
 * CP-007c: Sin contraseña → 400
 * CP-008a: Contraseña incorrecta → 401 con mensaje genérico
 * CP-008b: Usuario inexistente → 401 con mismo mensaje genérico
 * CP-009: Login exitoso → 200 con exchange_token y mobile_token
 */
const request = require('supertest');
const app     = require('../src/server');

describe('Módulo: Autenticación — Login', () => {

  test('CP-007a | Login sin correo → HTTP 400', async () => {
    const res = await request(app).post('/api/auth/login').send({
      password_usuario: 'Clave1234',
    });
    expect(res.statusCode).toBe(400);
  });

  test('CP-007b | Login con correo inválido → HTTP 400, campo correo_usuario', async () => {
    const res = await request(app).post('/api/auth/login').send({
      correo_usuario:   'noescorreo',
      password_usuario: 'Clave1234',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.campo).toBe('correo_usuario');
  });

  test('CP-007c | Login sin contraseña → HTTP 400', async () => {
    const res = await request(app).post('/api/auth/login').send({
      correo_usuario: 'alguien@correo.cl',
    });
    expect(res.statusCode).toBe(400);
  });

  test('CP-008a | Contraseña incorrecta → HTTP 401, mensaje genérico', async () => {
    const res = await request(app).post('/api/auth/login').send({
      correo_usuario:   'alonsodiego44@gmail.com',
      password_usuario: 'ClaveIncorrecta99',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/correo o contraseña incorrectos/i);
  });

  test('CP-008b | Usuario inexistente → HTTP 401, mismo mensaje genérico', async () => {
    const res = await request(app).post('/api/auth/login').send({
      correo_usuario:   'noexiste@despensa.cl',
      password_usuario: 'Clave1234',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/correo o contraseña incorrectos/i);
  });

  test('CP-009 | Login exitoso → HTTP 200 con exchange_token y mobile_token', async () => {
    // Primero registramos un usuario temporal para el login
    const correo = `login_test_${Date.now()}@despensa.cl`;
    await request(app).post('/api/auth/register').send({
      pri_nom_usuario:  'Login',
      pri_ape_usuario:  'Test',
      correo_usuario:   correo,
      password_usuario: 'Clave1234',
      num_tel_usuario:  912345678,
      fecha_nac_usuario:'1995-06-15',
    });

    const res = await request(app).post('/api/auth/login').send({
      correo_usuario:   correo,
      password_usuario: 'Clave1234',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.exchange_token).toBeDefined();
    expect(res.body.mobile_token).toBeDefined();
  });

});
