'use strict';
const { NODE_ENV } = require('../config/env');

/**
 * Manejador global de errores para Express.
 * Debe registrarse DESPUÉS de todas las rutas en server.js.
 *
 * Nunca expone stack traces en producción.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Errores de validación de express-validator (pasados como next(err) desde el controller)
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, detalles: err.detalles });
  }

  // Errores de constraint de PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({ error: 'Registro duplicado: el valor ya existe.' });
      case '23503': // foreign_key_violation
        return res.status(400).json({ error: 'Referencia inválida: el recurso relacionado no existe.' });
      case '23514': // check_violation
        return res.status(400).json({ error: 'Valor fuera del rango permitido.' });
      default:
        break;
    }
  }

  // Error con statusCode explícito (lanzado desde servicios)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Error genérico — nunca exponer detalles internos en producción
  console.error('[ErrorHandler]', err);

  return res.status(500).json({
    error: 'Error interno del servidor.',
    ...(NODE_ENV !== 'production' && { detalle: err.message }),
  });
}

module.exports = errorHandler;
