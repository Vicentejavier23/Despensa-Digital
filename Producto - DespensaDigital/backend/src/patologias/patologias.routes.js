'use strict';
const { Router } = require('express');
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const { verificarJWT } = require('../middleware/auth.middleware');

const router = Router();
router.use(verificarJWT);

// GET /api/patologias
router.get('/', async (req, res, next) => {
  try {
    const { run_usuario } = req.usuario;
    const { rows } = await pool.query(
      `SELECT * FROM PATOLOGIAS WHERE USUARIO_run_usuario = $1 ORDER BY fecha_diagnostico DESC`,
      [run_usuario]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/patologias
router.post('/', [
  body('nombre_patologia').trim().notEmpty().withMessage('Nombre requerido'),
  body('tipo_patologia').trim().notEmpty().withMessage('Tipo requerido'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });

  try {
    const { run_usuario } = req.usuario;
    const { nombre_patologia, tipo_patologia, fecha_diagnostico, patologia_activa } = req.body;

    const { rows } = await pool.query(`
      INSERT INTO PATOLOGIAS (nombre_patologia, tipo_patologia, fecha_diagnostico, patologia_activa, USUARIO_run_usuario)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [nombre_patologia, tipo_patologia, fecha_diagnostico || null, patologia_activa !== false, run_usuario]);

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/patologias/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { run_usuario } = req.usuario;
    const { id } = req.params;
    const { patologia_activa, nombre_patologia, tipo_patologia, fecha_diagnostico } = req.body;

    const { rows } = await pool.query(`
      UPDATE PATOLOGIAS SET
        patologia_activa = COALESCE($1, patologia_activa),
        nombre_patologia = COALESCE($2, nombre_patologia),
        tipo_patologia   = COALESCE($3, tipo_patologia),
        fecha_diagnostico = COALESCE($4, fecha_diagnostico)
      WHERE id_patologias = $5 AND USUARIO_run_usuario = $6
      RETURNING *
    `, [
      patologia_activa ?? null,
      nombre_patologia ?? null,
      tipo_patologia ?? null,
      fecha_diagnostico ?? null,
      id, run_usuario,
    ]);

    if (rows.length === 0) return res.status(404).json({ error: 'Patología no encontrada' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/patologias/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { run_usuario } = req.usuario;
    const { id } = req.params;
    const { rowCount } = await pool.query(
      'DELETE FROM PATOLOGIAS WHERE id_patologias = $1 AND USUARIO_run_usuario = $2',
      [id, run_usuario]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Patología no encontrada' });
    res.json({ mensaje: 'Patología eliminada' });
  } catch (err) { next(err); }
});

module.exports = router;
