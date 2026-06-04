'use strict';
/**
 * ============================================================
 * auth.controller.js — Controlador de autenticación
 * ============================================================
 * Proyecto  : DespensaDigital v2
 * Curso     : TPY1101 — Duoc UC
 *
 * Endpoints que maneja:
 *  POST /api/auth/register  → valida datos y crea cuenta nueva
 *  POST /api/auth/login     → valida correo+contraseña, retorna exchange_token
 *  POST /api/auth/exchange  → canjea exchange_token por JWT real + datos del usuario
 *
 * El login NUNCA acepta RUT — solo correo electrónico + contraseña.
 * Cuando se registra desde la web, el RUT se genera automáticamente.
 * ============================================================
 */
const { body, validationResult } = require('express-validator');
const { registrarUsuario, autenticarUsuario, firmarJWT } = require('./auth.service');
const { consumeToken } = require('../utils/tokenStore');
const { calcularDV } = require('../utils/rutValidator');
const pool = require('../config/db');

// ─── Validaciones de registro ─────────────────────────────────────────────────
// run_usuario y dvrun_usuario son opcionales cuando se registra desde la web
// (la app móvil siempre los envía; la web no los expone al usuario)
const validacionesRegistro = [
  body('run_usuario')
    .optional()
    .isInt({ min: 1_000_000, max: 99_999_999 })
    .withMessage('RUT inválido — debe ser un número entre 1.000.000 y 99.999.999'),
  body('dvrun_usuario')
    .optional()
    .matches(/^[0-9kK]$/)
    .withMessage('Dígito verificador inválido — debe ser un número o la letra K'),
  body('pri_nom_usuario')
    .trim().notEmpty()
    .withMessage('El nombre es obligatorio'),
  body('pri_ape_usuario')
    .trim().notEmpty()
    .withMessage('El apellido es obligatorio'),
  body('correo_usuario')
    .isEmail().normalizeEmail()
    .withMessage('Correo electrónico inválido'),
  body('num_tel_usuario')
    .isInt({ min: 900_000_000, max: 999_999_999 })
    .withMessage('Teléfono inválido — debe tener 9 dígitos (ej: 912345678)'),
  body('password_usuario')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número'),
  body('fecha_nac_usuario')
    .isDate()
    .withMessage('Fecha de nacimiento inválida'),
  body('id_comuna')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Debes seleccionar una comuna válida'),
];

// ─── Validaciones de login (siempre por correo) ───────────────────────────────
const validacionesLogin = [
  body('correo_usuario')
    .isEmail().normalizeEmail()
    .withMessage('Ingresa un correo electrónico válido'),
  body('password_usuario')
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
];

// ─── POST /api/auth/register ──────────────────────────────────────────────────
async function register(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const lista = errores.array();
    return res.status(400).json({
      error: lista[0].msg,
      campo: lista[0].path,
      detalles: lista.map(e => ({ campo: e.path, mensaje: e.msg })),
    });
  }

  // Si no viene run_usuario (registro desde web), generar uno temporal único
  if (!req.body.run_usuario) {
    // Buscar el run_usuario mínimo disponible en el rango reservado para web (90000000+)
    const { rows } = await pool.query(
      `SELECT COALESCE(MAX(run_usuario), 90000000) + 1 AS next_run
       FROM USUARIO WHERE run_usuario >= 90000000`
    );
    req.body.run_usuario   = rows[0].next_run;
    req.body.dvrun_usuario = calcularDV(rows[0].next_run);
  }

  try {
    const resultado = await registrarUsuario(req.body);
    return res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
async function login(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const lista = errores.array();
    return res.status(400).json({
      error: lista[0].msg,
      campo: lista[0].path,
      detalles: lista.map(e => ({ campo: e.path, mensaje: e.msg })),
    });
  }

  try {
    const resultado = await autenticarUsuario(req.body);
    return res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/auth/exchange ──────────────────────────────────────────────────
async function exchange(req, res, next) {
  const { code } = req.body;

  if (!code || typeof code !== 'string' || code.trim() === '') {
    return res.status(400).json({ error: 'Código de intercambio requerido' });
  }

  const payload = consumeToken(code.trim());
  if (!payload) {
    return res.status(401).json({ error: 'Código inválido o expirado. Vuelve a iniciar sesión.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT
         u.run_usuario, u.dvrun_usuario,
         u.pri_nom_usuario, u.seg_nom_usuario,
         u.pri_ape_usuario, u.seg_ape_usuario,
         u.correo_usuario, u.num_tel_usuario,
         u.fecha_nac_usuario, u.fecha_reg_usuario,
         c.id_comuna, c.nombre_comuna,
         ci.nombre_ciudad,
         r.nombre_region,
         p.nombre_pais
       FROM USUARIO u
       LEFT JOIN DIRECCION d  ON d.USUARIO_run_usuario = u.run_usuario
       LEFT JOIN COMUNA c     ON c.id_comuna = d.COMUNA_id_comuna
       LEFT JOIN CIUDAD ci    ON ci.id_ciudad = c.CIUDAD_id_ciudad
       LEFT JOIN REGION r     ON r.id_region = ci.REGION_id_region
       LEFT JOIN PAIS p       ON p.id_pais = r.PAIS_id_pais
       WHERE u.run_usuario = $1
       LIMIT 1`,
      [payload.run_usuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = rows[0];
    delete usuario.password_usuario;

    // JWT expira en 1 hora (RNF-01)
    const jwt = firmarJWT({
      run_usuario:    usuario.run_usuario,
      correo_usuario: usuario.correo_usuario,
    });

    return res.status(200).json({ jwt, usuario });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, exchange, validacionesRegistro, validacionesLogin };
