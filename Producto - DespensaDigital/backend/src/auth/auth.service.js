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
 *
 * Identidad de usuario: id_usuario (autoincremental, generado por la BD).
 * El sistema ya no usa RUT ni dígito verificador en ninguna parte.
 * ============================================================
 */
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const pool   = require('../config/db');
const { JWT_SECRET } = require('../config/env');
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
    pri_nom_usuario, seg_nom_usuario,
    pri_ape_usuario, seg_ape_usuario, correo_usuario, num_tel_usuario,
    password_usuario, fecha_nac_usuario, id_comuna,
    calle_direccion, numero_direccion,
  } = datos;

  // 1. Unicidad de correo
  const { rows: correoRows } = await pool.query(
    'SELECT id_usuario FROM USUARIO WHERE LOWER(correo_usuario) = LOWER($1)',
    [correo_usuario]
  );
  if (correoRows.length > 0) {
    const err = new Error('El correo electrónico ya está registrado');
    err.statusCode = 409;
    throw err;
  }

  // 2. Validar comuna si se proporcionó
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

  // 3. Hash de contraseña
  const passwordHash = await bcrypt.hash(password_usuario, SALT_ROUNDS);

  // 4. Transacción: USUARIO + DIRECCION
  const client = await pool.connect();
  let nuevoUsuario;
  try {
    await client.query('BEGIN');

    const { rows: insertados } = await client.query(
      `INSERT INTO USUARIO (
        pri_nom_usuario, seg_nom_usuario,
        pri_ape_usuario, seg_ape_usuario, correo_usuario, num_tel_usuario,
        password_usuario, fecha_nac_usuario
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id_usuario`,
      [
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
    nuevoUsuario = insertados[0];

    if (id_comuna) {
      await client.query(
        `INSERT INTO DIRECCION (calle_direccion, numero_direccion, COMUNA_id_comuna, USUARIO_id_usuario)
         VALUES ($1, $2, $3, $4)`,
        [calle_direccion || 'Sin calle', numero_direccion || 0, id_comuna, nuevoUsuario.id_usuario]
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
    id_usuario:      nuevoUsuario.id_usuario,
    correo_usuario:  correo_usuario.toLowerCase(),
    pri_nom_usuario: pri_nom_usuario.trim(),
  });

  return { exchange_token };
}

/**
 * Autentica por CORREO ELECTRÓNICO + contraseña.
 */
async function autenticarUsuario({ correo_usuario, password_usuario }) {
  const { rows } = await pool.query(
    `SELECT id_usuario, correo_usuario, password_usuario,
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
    id_usuario:      usuario.id_usuario,
    correo_usuario:  usuario.correo_usuario,
    pri_nom_usuario: usuario.pri_nom_usuario,
  });

  return { exchange_token };
}

module.exports = { registrarUsuario, autenticarUsuario, firmarJWT };
