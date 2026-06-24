'use strict';
/**
 * SUITE 6 — Inventario de Productos
 * CP-014a/b/c: Listar productos (vacío, con datos, filtrado)
 * CP-015:      Métricas del dashboard
 * CP-016a/b/c: Crear producto (validaciones + exitoso)
 * CP-017a/b/c: Obtener producto por ID
 * CP-018a/b:   Eliminar producto
 */
const request = require('supertest');
const app     = require('../src/server');
const jwt     = require('jsonwebtoken');
require('dotenv').config();

let token;
let idProductoCreado;

// Registramos un usuario real para las pruebas que tocan la BD
beforeAll(async () => {
  const correo = `prod_test_${Date.now()}@despensa.cl`;
  const regRes = await request(app).post('/api/auth/register').send({
    pri_nom_usuario:   'Producto',
    pri_ape_usuario:   'Test',
    correo_usuario:    correo,
    password_usuario:  'Clave1234',
    num_tel_usuario:   912345678,
    fecha_nac_usuario: '1995-06-15',
  });

  // Obtenemos el JWT real vía exchange
  const exchangeRes = await request(app).post('/api/auth/exchange').send({
    code: regRes.body.exchange_token,
  });

  token = exchangeRes.body.jwt;
});

describe('Módulo: Inventario de Productos', () => {

  test('CP-014a | GET /api/productos → HTTP 200 retorna array', async () => {
    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('CP-014c | GET /api/productos?q=leche → HTTP 200 con filtro aplicado', async () => {
    const res = await request(app)
      .get('/api/productos?q=leche')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('CP-015 | GET /api/productos/metricas → HTTP 200 con campos del dashboard', async () => {
    const res = await request(app)
      .get('/api/productos/metricas')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total_productos');
    expect(res.body).toHaveProperty('proximos_vencer');
    expect(res.body).toHaveProperty('vencidos');
    expect(res.body).toHaveProperty('items_lista_pendiente');
  });

  test('CP-016a | POST /api/productos sin nombre → HTTP 400', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fecha_vencimiento: '2027-01-01',
        cantidad_unidad:   3,
        tipo_producto:     'Alimento',
      });
    expect(res.statusCode).toBe(400);
  });

  test('CP-016b | POST /api/productos con tipo inválido → HTTP 400', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre_producto:   'Producto Test',
        fecha_vencimiento: '2027-01-01',
        cantidad_unidad:   3,
        tipo_producto:     'TipoInexistente',
      });
    expect(res.statusCode).toBe(400);
  });

  test('CP-016c | POST /api/productos con datos válidos → HTTP 201', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nombre_producto:   'Leche Test',
        marca_producto:    'Marca Test',
        fecha_vencimiento: '2027-06-30',
        cantidad_unidad:   5,
        stock_minimo:      2,
        tipo_producto:     'Lácteo',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.id_producto).toBeDefined();
    idProductoCreado = res.body.id_producto;
  });

  test('CP-017a | GET /api/productos/9999 → HTTP 404 producto no encontrado', async () => {
    const res = await request(app)
      .get('/api/productos/9999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  test('CP-017b | GET /api/productos/abc → HTTP 400 ID inválido', async () => {
    const res = await request(app)
      .get('/api/productos/abc')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  test('CP-017c | GET /api/productos/:id → HTTP 200 con datos del producto creado', async () => {
    if (!idProductoCreado) return;
    const res = await request(app)
      .get(`/api/productos/${idProductoCreado}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.nombre_producto).toBe('Leche Test');
  });

  test('CP-018a | DELETE /api/productos/9999 → HTTP 404', async () => {
    const res = await request(app)
      .delete('/api/productos/9999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });

  test('CP-018b | DELETE /api/productos/:id → HTTP 200 producto eliminado', async () => {
    if (!idProductoCreado) return;
    const res = await request(app)
      .delete(`/api/productos/${idProductoCreado}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.mensaje).toMatch(/eliminado/i);
  });

});
