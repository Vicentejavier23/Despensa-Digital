'use strict';
/**
 * /api/alertas — RF-08
 * Sistema de alertas preventivas con umbral configurable.
 */
const { Router } = require('express');
const { query, validationResult } = require('express-validator');
const pool = require('../config/db');
const { verificarJWT } = require('../middleware/auth.middleware');

const router = Router();
router.use(verificarJWT);

// GET /api/alertas?dias=5&stock_bajo=true
router.get('/', [
  query('dias').optional().isInt({ min: 1, max: 30 }).withMessage('dias debe ser entre 1 y 30'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ error: errors.array()[0].msg });

  try {
    const { run_usuario } = req.usuario;
    const dias      = parseInt(req.query.dias || '5', 10);
    const inclStock = req.query.stock_bajo !== 'false';

    const { rows: porVencer } = await pool.query(`
      SELECT
        p.id_producto, p.nombre_producto, p.marca_producto,
        p.fecha_vencimiento, p.cantidad_unidad, p.stock_minimo,
        p.tipo_producto,
        c.nombre_categoria,
        a.tipo_almacenaje,
        (p.fecha_vencimiento - CURRENT_DATE)::int AS dias_restantes,
        'VENCIMIENTO' AS tipo_alerta
      FROM PRODUCTO p
      LEFT JOIN CATEGORIA_PRODUCTO c ON c.id_categoria = p.CATEGORIA_id_categoria
      LEFT JOIN TIPO_ALMACENAJE    a ON a.id_almacenaje = p.TIPO_ALMACENAJE_id
      WHERE p.USUARIO_run_usuario = $1
        AND p.fecha_vencimiento >= CURRENT_DATE
        AND p.fecha_vencimiento <= CURRENT_DATE + ($2 || ' days')::interval
      ORDER BY p.fecha_vencimiento ASC
    `, [run_usuario, dias]);

    let porStockBajo = [];
    if (inclStock) {
      const { rows } = await pool.query(`
        SELECT
          p.id_producto, p.nombre_producto, p.marca_producto,
          p.fecha_vencimiento, p.cantidad_unidad, p.stock_minimo,
          p.tipo_producto,
          c.nombre_categoria,
          a.tipo_almacenaje,
          NULL::int AS dias_restantes,
          'STOCK_BAJO' AS tipo_alerta
        FROM PRODUCTO p
        LEFT JOIN CATEGORIA_PRODUCTO c ON c.id_categoria = p.CATEGORIA_id_categoria
        LEFT JOIN TIPO_ALMACENAJE    a ON a.id_almacenaje = p.TIPO_ALMACENAJE_id
        WHERE p.USUARIO_run_usuario = $1
          AND p.cantidad_unidad < p.stock_minimo
        ORDER BY p.cantidad_unidad ASC
      `, [run_usuario]);
      porStockBajo = rows;
    }

    res.json({
      configuracion: { dias_vencimiento: dias, incluye_stock_bajo: inclStock },
      total_alertas: porVencer.length + porStockBajo.length,
      por_vencer:    porVencer,
      stock_bajo:    porStockBajo,
    });
  } catch (err) { next(err); }
});

module.exports = router;
