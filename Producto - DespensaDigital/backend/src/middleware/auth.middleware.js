'use strict';
/**
 * ============================================================
 * auth.middleware.js — Middleware de verificación JWT
 * ============================================================
 * Proyecto  : DespensaDigital v2
 * Curso     : TPY1101 — Duoc UC
 *
 * Uso:
 *  Aplicar este middleware a cualquier ruta que requiera autenticación.
 *  Ejemplo: router.get('/productos', verificarJWT, handler)
 *
 * Funcionamiento:
 *  1. Lee el header: Authorization: Bearer <token>
 *  2. Verifica la firma del JWT con JWT_SECRET
 *  3. Si es válido: adjunta req.usuario = { run_usuario, correo_usuario, iat, exp }
 *  4. Si es inválido o expirado: responde 401 con mensaje de error
 *
 * El JWT expira en 1 hora. Cuando expira, el usuario debe volver
 * a iniciar sesión desde la app móvil para obtener un token nuevo.
 * ============================================================
 */
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

/**
 * Middleware de verificación de JWT.
 * Extrae el token del header Authorization: Bearer <token>
 * Si es válido, adjunta el payload decodificado a req.usuario.
 * Si no, responde 401.
 */
function verificarJWT(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded; // { run_usuario, correo_usuario, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Por favor inicia sesión de nuevo.' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { verificarJWT };
