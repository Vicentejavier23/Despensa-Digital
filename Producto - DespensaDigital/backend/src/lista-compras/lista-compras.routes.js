'use strict';
/**
 * /api/lista-compras
 * RF-09 — Lista de compras con generación automática por stock bajo.
 */
const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { verificarJWT } = require('../middleware/auth.middleware');

const router = Router();
router.use(verificarJWT);

// GET /api/lista-compras
router.get('/', async (req, res, next) => {
  try {
    const { id_usuario } = req.usuario;
    const { rows } = await pool.query(`
      SELECT
        lc.id_lista, lc.fecha_lista, lc.estado_lista,
        lc.cantidad_producto, lc.tipo_lista,
        p.nombre_producto, p.marca_producto, p.id_producto,
        p.cantidad_unidad, p.stock_minimo
      FROM LISTA_COMPRAS lc
      JOIN PRODUCTO p ON p.id_producto = lc.PRODUCTO_id_producto
      WHERE lc.USUARIO_id_usuario = $1
      ORDER BY lc.estado_lista ASC, lc.fecha_lista DESC
    `, [id_usuario]);
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/lista-compras/generar  — RF-09 generación automática
// Detecta todos los productos con cantidad_unidad < stock_minimo
// e inserta uno a uno en LISTA_COMPRAS (evita duplicados pendientes)
router.post('/generar', async (req, res, next) => {
  try {
    const { id_usuario } = req.usuario;

    // Productos con stock bajo que NO tienen entrada pendiente ya en la lista
    const { rows: faltantes } = await pool.query(`
      SELECT p.id_producto, p.nombre_producto, p.stock_minimo, p.cantidad_unidad,
             (p.stock_minimo - p.cantidad_unidad) AS cantidad_a_pedir
      FROM PRODUCTO p
      WHERE p.USUARIO_id_usuario = $1
        AND p.cantidad_unidad < p.stock_minimo
        AND NOT EXISTS (
          SELECT 1 FROM LISTA_COMPRAS lc
          WHERE lc.PRODUCTO_id_producto = p.id_producto
            AND lc.USUARIO_id_usuario  = $1
            AND lc.estado_lista = false
        )
    `, [id_usuario]);

    if (faltantes.length === 0) {
      return res.json({ mensaje: 'No hay productos con stock bajo sin cubrir', insertados: 0, items: [] });
    }

    const client = await pool.connect();
    const insertados = [];
    try {
      await client.query('BEGIN');
      for (const prod of faltantes) {
        const { rows } = await client.query(`
          INSERT INTO LISTA_COMPRAS
            (fecha_lista, estado_lista, cantidad_producto, tipo_lista,
             USUARIO_id_usuario, PRODUCTO_id_producto)
          VALUES (CURRENT_DATE, false, $1, 'AUTOMATICA', $2, $3)
          RETURNING *
        `, [prod.cantidad_a_pedir, id_usuario, prod.id_producto]);
        insertados.push({ ...rows[0], nombre_producto: prod.nombre_producto });
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.status(201).json({
      mensaje: `${insertados.length} producto(s) agregados automáticamente`,
      insertados: insertados.length,
      items: insertados,
    });
  } catch (err) { next(err); }
});

// POST /api/lista-compras  — manual
router.post('/', [
  body('id_producto').isInt({ min: 1 }).withMessage('id_producto requerido'),
  body('cantidad_producto').isInt({ min: 1 }).withMessage('Cantidad debe ser >= 1'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  try {
    const { id_usuario } = req.usuario;
    const { id_producto, cantidad_producto, tipo_lista } = req.body;

    const { rows: check } = await pool.query(
      'SELECT id_producto FROM PRODUCTO WHERE id_producto = $1 AND USUARIO_id_usuario = $2',
      [id_producto, id_usuario]
    );
    if (check.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });

    const { rows } = await pool.query(`
      INSERT INTO LISTA_COMPRAS
        (fecha_lista, estado_lista, cantidad_producto, tipo_lista,
         USUARIO_id_usuario, PRODUCTO_id_producto)
      VALUES (CURRENT_DATE, false, $1, $2, $3, $4)
      RETURNING *
    `, [cantidad_producto, tipo_lista || 'MANUAL', id_usuario, id_producto]);

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/lista-compras/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { id_usuario } = req.usuario;
    const { estado_lista, cantidad_producto } = req.body;

    const { rows } = await pool.query(`
      UPDATE LISTA_COMPRAS SET
        estado_lista      = COALESCE($1, estado_lista),
        cantidad_producto = COALESCE($2, cantidad_producto)
      WHERE id_lista = $3 AND USUARIO_id_usuario = $4
      RETURNING *
    `, [estado_lista ?? null, cantidad_producto ?? null, req.params.id, id_usuario]);

    if (rows.length === 0) return res.status(404).json({ error: 'Item no encontrado' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/lista-compras/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id_usuario } = req.usuario;
    const { rowCount } = await pool.query(
      'DELETE FROM LISTA_COMPRAS WHERE id_lista = $1 AND USUARIO_id_usuario = $2',
      [req.params.id, id_usuario]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Item no encontrado' });
    res.json({ mensaje: 'Item eliminado de la lista' });
  } catch (err) { next(err); }
});

module.exports = router;
