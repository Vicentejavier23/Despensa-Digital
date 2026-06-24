'use strict';
const { Router } = require('express');
const { body, param, query, validationResult } = require('express-validator');
const pool = require('../config/db');
const { verificarJWT } = require('../middleware/auth.middleware');

const router = Router();
router.use(verificarJWT);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function validar(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ error: errors.array()[0].msg, detalles: errors.array() });
  next();
}

// Resuelve nombre_categoria → id_categoria (upsert). Retorna null si no se provee.
async function resolverCategoria(client, nombre) {
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) return null;
  const { rows } = await client.query(
    `INSERT INTO CATEGORIA_PRODUCTO (nombre_categoria)
     VALUES ($1)
     ON CONFLICT (nombre_categoria) DO UPDATE SET nombre_categoria = EXCLUDED.nombre_categoria
     RETURNING id_categoria`,
    [nombre.trim()]
  );
  return rows[0]?.id_categoria ?? null;
}

// Resuelve tipo_almacenaje → id_almacenaje (upsert). Retorna null si no se provee.
async function resolverAlmacenaje(client, tipo) {
  if (!tipo || typeof tipo !== 'string' || !tipo.trim()) return null;
  const { rows } = await client.query(
    `INSERT INTO TIPO_ALMACENAJE (tipo_almacenaje)
     VALUES ($1)
     ON CONFLICT (tipo_almacenaje) DO UPDATE SET tipo_almacenaje = EXCLUDED.tipo_almacenaje
     RETURNING id_almacenaje`,
    [tipo.trim()]
  );
  return rows[0]?.id_almacenaje ?? null;
}

// ─── GET /api/productos ────────────────────────────────────────────────────────
// Filtros: ?q=texto  &tipo=Alimento  &almacenaje=Despensa  &estado=proximo|vencido|ok
router.get('/', async (req, res, next) => {
  try {
    const { id_usuario } = req.usuario;
    const { q, tipo, almacenaje } = req.query;

    let sql = `
      SELECT
        p.id_producto, p.nombre_producto, p.marca_producto,
        p.cod_barra_producto, p.fecha_vencimiento, p.cantidad_unidad,
        p.stock_minimo, p.tipo_producto, p.peso_gramos, p.mililitros,
        p.fecha_apertura,
        c.nombre_categoria,
        a.tipo_almacenaje
      FROM PRODUCTO p
      LEFT JOIN CATEGORIA_PRODUCTO c ON c.id_categoria = p.CATEGORIA_id_categoria
      LEFT JOIN TIPO_ALMACENAJE    a ON a.id_almacenaje = p.TIPO_ALMACENAJE_id
      WHERE p.USUARIO_id_usuario = $1
    `;
    const params = [id_usuario];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (p.nombre_producto ILIKE $${params.length} OR p.marca_producto ILIKE $${params.length})`;
    }
    if (tipo) {
      params.push(tipo);
      sql += ` AND p.tipo_producto = $${params.length}`;
    }
    if (almacenaje) {
      params.push(almacenaje);
      sql += ` AND a.tipo_almacenaje = $${params.length}`;
    }

    sql += ' ORDER BY p.fecha_vencimiento ASC';

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
});

// ─── GET /api/productos/metricas ──────────────────────────────────────────────
router.get('/metricas', async (req, res, next) => {
  try {
    const { id_usuario } = req.usuario;

    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int AS total_productos,
        COUNT(*) FILTER (
          WHERE fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
        )::int AS proximos_vencer,
        COUNT(*) FILTER (
          WHERE fecha_vencimiento < CURRENT_DATE
        )::int AS vencidos,
        (
          SELECT COUNT(*)::int FROM LISTA_COMPRAS
          WHERE USUARIO_id_usuario = $1 AND estado_lista = false
        ) AS items_lista_pendiente
      FROM PRODUCTO
      WHERE USUARIO_id_usuario = $1
    `, [id_usuario]);

    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ─── GET /api/productos/:id ────────────────────────────────────────────────────
router.get('/:id',
  param('id').isInt({ min: 1 }),
  validar,
  async (req, res, next) => {
    try {
      const { id_usuario } = req.usuario;
      const { rows } = await pool.query(`
        SELECT
          p.*, c.nombre_categoria, a.tipo_almacenaje
        FROM PRODUCTO p
        LEFT JOIN CATEGORIA_PRODUCTO c ON c.id_categoria = p.CATEGORIA_id_categoria
        LEFT JOIN TIPO_ALMACENAJE    a ON a.id_almacenaje = p.TIPO_ALMACENAJE_id
        WHERE p.id_producto = $1 AND p.USUARIO_id_usuario = $2
      `, [req.params.id, id_usuario]);

      if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(rows[0]);
    } catch (err) { next(err); }
  }
);

// ─── POST /api/productos ───────────────────────────────────────────────────────
router.post('/', [
  body('nombre_producto').trim().notEmpty().withMessage('El nombre del producto es requerido'),
  body('fecha_vencimiento').isDate().withMessage('Fecha de vencimiento inválida'),
  body('cantidad_unidad').isInt({ min: 0 }).withMessage('La cantidad debe ser un número >= 0'),
  body('stock_minimo').optional().isInt({ min: 0 }).withMessage('Stock mínimo debe ser >= 0'),
  body('tipo_producto')
    .isIn(['Alimento','Bebida','Lácteo','Congelado','Otro'])
    .withMessage('Tipo de producto inválido'),
], validar, async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id_usuario } = req.usuario;
    const {
      nombre_producto, marca_producto, cod_barra_producto,
      fecha_vencimiento, cantidad_unidad, stock_minimo = 2,
      tipo_producto, peso_gramos, mililitros, fecha_apertura,
      nombre_categoria, tipo_almacenaje,
    } = req.body;

    const id_categoria  = await resolverCategoria(client, nombre_categoria);
    const id_almacenaje = await resolverAlmacenaje(client, tipo_almacenaje);

    const { rows } = await client.query(`
      INSERT INTO PRODUCTO (
        nombre_producto, marca_producto, cod_barra_producto,
        fecha_vencimiento, cantidad_unidad, stock_minimo,
        tipo_producto, peso_gramos, mililitros, fecha_apertura,
        CATEGORIA_id_categoria, TIPO_ALMACENAJE_id, USUARIO_id_usuario
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      nombre_producto.trim(),
      marca_producto?.trim() || 'Sin marca',
      cod_barra_producto || null,
      fecha_vencimiento,
      cantidad_unidad,
      stock_minimo,
      tipo_producto,
      peso_gramos || null,
      mililitros   || null,
      fecha_apertura || null,
      id_categoria,
      id_almacenaje,
      id_usuario,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
  finally { client.release(); }
});

// ─── PUT /api/productos/:id ────────────────────────────────────────────────────
router.put('/:id',
  param('id').isInt({ min: 1 }),
  validar,
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      const { id_usuario } = req.usuario;
      const {
        nombre_producto, marca_producto, cod_barra_producto,
        fecha_vencimiento, cantidad_unidad, stock_minimo,
        tipo_producto, peso_gramos, mililitros, fecha_apertura,
        nombre_categoria, tipo_almacenaje,
      } = req.body;

      const id_categoria  = nombre_categoria !== undefined
        ? await resolverCategoria(client, nombre_categoria)
        : undefined;
      const id_almacenaje = tipo_almacenaje !== undefined
        ? await resolverAlmacenaje(client, tipo_almacenaje)
        : undefined;

      const { rows } = await client.query(`
        UPDATE PRODUCTO SET
          nombre_producto        = COALESCE($1,  nombre_producto),
          marca_producto         = COALESCE($2,  marca_producto),
          cod_barra_producto     = COALESCE($3,  cod_barra_producto),
          fecha_vencimiento      = COALESCE($4,  fecha_vencimiento),
          cantidad_unidad        = COALESCE($5,  cantidad_unidad),
          stock_minimo           = COALESCE($6,  stock_minimo),
          tipo_producto          = COALESCE($7,  tipo_producto),
          peso_gramos            = COALESCE($8,  peso_gramos),
          mililitros             = COALESCE($9,  mililitros),
          fecha_apertura         = COALESCE($10, fecha_apertura),
          CATEGORIA_id_categoria = COALESCE($11, CATEGORIA_id_categoria),
          TIPO_ALMACENAJE_id     = COALESCE($12, TIPO_ALMACENAJE_id)
        WHERE id_producto = $13 AND USUARIO_id_usuario = $14
        RETURNING *
      `, [
        nombre_producto    || null,
        marca_producto     || null,
        cod_barra_producto || null,
        fecha_vencimiento  || null,
        cantidad_unidad    ?? null,
        stock_minimo       ?? null,
        tipo_producto      || null,
        peso_gramos        || null,
        mililitros         || null,
        fecha_apertura     || null,
        id_categoria       ?? null,
        id_almacenaje      ?? null,
        req.params.id,
        id_usuario,
      ]);

      if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(rows[0]);
    } catch (err) { next(err); }
    finally { client.release(); }
  }
);

// ─── DELETE /api/productos/:id ─────────────────────────────────────────────────
router.delete('/:id',
  param('id').isInt({ min: 1 }),
  validar,
  async (req, res, next) => {
    try {
      const { id_usuario } = req.usuario;
      const { rowCount } = await pool.query(
        'DELETE FROM PRODUCTO WHERE id_producto = $1 AND USUARIO_id_usuario = $2',
        [req.params.id, id_usuario]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ mensaje: 'Producto eliminado' });
    } catch (err) { next(err); }
  }
);

module.exports = router;
