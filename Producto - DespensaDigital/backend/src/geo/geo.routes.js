'use strict';
const { Router } = require('express');
const pool = require('../config/db');

const router = Router();

/**
 * GET /api/geo/paises
 * Retorna todos los países disponibles.
 */
router.get('/paises', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id_pais, nombre_pais FROM PAIS ORDER BY nombre_pais ASC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/geo/regiones?id_pais=1
 * Retorna las regiones de un país.
 */
router.get('/regiones', async (req, res, next) => {
  const { id_pais } = req.query;
  if (!id_pais || isNaN(Number(id_pais))) {
    return res.status(400).json({ error: 'id_pais requerido y debe ser numérico' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id_region, nombre_region FROM REGION WHERE PAIS_id_pais = $1 ORDER BY nombre_region ASC',
      [Number(id_pais)]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/geo/ciudades?id_region=7
 * Retorna las ciudades de una región.
 */
router.get('/ciudades', async (req, res, next) => {
  const { id_region } = req.query;
  if (!id_region || isNaN(Number(id_region))) {
    return res.status(400).json({ error: 'id_region requerido y debe ser numérico' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT c.id_ciudad, c.nombre_ciudad
       FROM CIUDAD c
       WHERE c.REGION_id_region = $1
         AND EXISTS (SELECT 1 FROM COMUNA co WHERE co.CIUDAD_id_ciudad = c.id_ciudad)
       ORDER BY c.nombre_ciudad ASC`,
      [Number(id_region)]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/geo/comunas?id_ciudad=1
 * Retorna las comunas de una ciudad.
 */
router.get('/comunas', async (req, res, next) => {
  const { id_ciudad } = req.query;
  if (!id_ciudad || isNaN(Number(id_ciudad))) {
    return res.status(400).json({ error: 'id_ciudad requerido y debe ser numérico' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT id_comuna, nombre_comuna FROM COMUNA WHERE CIUDAD_id_ciudad = $1 ORDER BY nombre_comuna ASC',
      [Number(id_ciudad)]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
