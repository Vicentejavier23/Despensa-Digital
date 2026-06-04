'use strict';
/**
 * ============================================================
 * auth.service.js — Lógica de negocio de autenticación
 * ============================================================
 * Proyecto  : DespensaDigital v2
 * Curso     : TPY1101 — Duoc UC
 *
 * Funciones exportadas:
 *  - registrarUsuario(datos)  → crea usuario en BD, retorna exchange_token
 *  - autenticarUsuario(datos) → valida correo+contraseña, retorna exchange_token
 *  - firmarJWT(payload)       → genera JWT firmado con expiración de 1 hora
 *
 * Flujo de autenticación:
 *  1. El cliente envía correo + contraseña al endpoint /api/auth/login
 *  2. Este servicio valida las credenciales con bcrypt
 *  3. Si son correctas, genera un exchange_token de un solo uso (5 min)
 *  4. El cliente web canjea ese token en /api/auth/exchange para obtener el JWT
 *
 * Seguridad:
 *  - Las contraseñas se almacenan como hash bcrypt con 12 rondas de sal
 *  - El JWT expira en 1 hora (RNF-01)
 *  - El exchange_token se destruye al primer uso (tokenStore)
 *  - El login nunca revela si el correo existe (mensaje genérico)
 * ============================================================
 */
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const pool   = require('../config/db');
const { JWT_SECRET } = require('../config/env');
const { validarRutChileno } = require('../utils/rutValidator');
const { setToken } = require('../utils/tokenStore');

const SALT_ROUNDS = 12;

function generarExchangeToken(usuarioPayload) {
  const token = crypto.randomBytes(32).toString('hex');
  setToken(token, usuarioPayload);
  return token;
}

// JWT expira en 1 hora (RNF-01)
function firmarJWT(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Registra un nuevo usuario.
 * Login posterior siempre por CORREO ELECTRÓNICO.
 */
async function registrarUsuario(datos) {
  const {
    run_usuario, dvrun_usuario, pri_nom_usuario, seg_nom_usuario,
    pri_ape_usuario, seg_ape_usuario, correo_usuario, num_tel_usuario,
    password_usuario, fecha_nac_usuario, id_comuna,
    calle_direccion, numero_direccion,
  } = datos;

  // 1. Validar RUT chileno (módulo 11)
  const { valido, mensaje } = validarRutChileno(run_usuario, dvrun_usuario);
  if (!valido) {
    const err = new Error(mensaje);
    err.statusCode = 400;
    throw err;
  }

  // 2. Unicidad de RUT
  const { rows: rutRows } = await pool.query(
    'SELECT run_usuario FROM USUARIO WHERE run_usuario = $1',
    [run_usuario]
  );
  if (rutRows.length > 0) {
    const err = new Error('El RUT ya está registrado en el sistema');
    err.statusCode = 409;
    throw err;
  }

  // 3. Unicidad de correo
  const { rows: correoRows } = await pool.query(
    'SELECT run_usuario FROM USUARIO WHERE LOWER(correo_usuario) = LOWER($1)',
    [correo_usuario]
  );
  if (correoRows.length > 0) {
    const err = new Error('El correo electrónico ya está registrado');
    err.statusCode = 409;
    throw err;
  }

  // 4. Validar comuna si se proporcionó
  if (id_comuna) {
    const { rows: comunaRows } = await pool.query(
      'SELECT id_comuna FROM COMUNA WHERE id_comuna = $1',
      [id_comuna]
    );
    if (comunaRows.length === 0) {
      const err = new Error('La comuna seleccionada no existe');
      err.statusCode = 400;
      throw err;
    }
  }

  // 5. Hash de contraseña
  const passwordHash = await bcrypt.hash(password_usuario, SALT_ROUNDS);

  // 6. Transacción: USUARIO + DIRECCION
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO USUARIO (
        run_usuario, dvrun_usuario, pri_nom_usuario, seg_nom_usuario,
        pri_ape_usuario, seg_ape_usuario, correo_usuario, num_tel_usuario,
        password_usuario, fecha_nac_usuario
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        run_usuario,
        dvrun_usuario.toUpperCase(),
        pri_nom_usuario.trim(),
        seg_nom_usuario || null,
        pri_ape_usuario.trim(),
        seg_ape_usuario || null,
        correo_usuario.toLowerCase(),
        num_tel_usuario,
        passwordHash,
        fecha_nac_usuario,
      ]
    );

    if (id_comuna) {
      await client.query(
        `INSERT INTO DIRECCION (calle_direccion, numero_direccion, COMUNA_id_comuna, USUARIO_run_usuario)
         VALUES ($1, $2, $3, $4)`,
        [calle_direccion || 'Sin calle', numero_direccion || 0, id_comuna, run_usuario]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const exchange_token = generarExchangeToken({
    run_usuario,
    correo_usuario: correo_usuario.toLowerCase(),
    pri_nom_usuario: pri_nom_usuario.trim(),
  });

  return { exchange_token };
}

/**
 * Autentica por CORREO ELECTRÓNICO + contraseña.
 * El RUT nunca se usa como credencial de acceso.
 */
async function autenticarUsuario({ correo_usuario, password_usuario }) {
  const { rows } = await pool.query(
    `SELECT run_usuario, dvrun_usuario, correo_usuario, password_usuario,
            pri_nom_usuario, seg_nom_usuario, pri_ape_usuario
     FROM USUARIO WHERE LOWER(correo_usuario) = LOWER($1)`,
    [correo_usuario]
  );

  // Mensaje genérico — no revelar si el correo existe
  const credencialesErr = new Error('Correo o contraseña incorrectos');
  credencialesErr.statusCode = 401;

  if (rows.length === 0) throw credencialesErr;

  const usuario = rows[0];
  const coincide = await bcrypt.compare(password_usuario, usuario.password_usuario);
  if (!coincide) throw credencialesErr;

  const exchange_token = generarExchangeToken({
    run_usuario:     usuario.run_usuario,
    correo_usuario:  usuario.correo_usuario,
    pri_nom_usuario: usuario.pri_nom_usuario,
  });

  return { exchange_token };
}

module.exports = { registrarUsuario, autenticarUsuario, firmarJWT };
