'use strict';
const { NODE_ENV } = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Siempre loguear en consola del servidor
  console.error('[ErrorHandler]', err.message || err);

  // Errores de validación de express-validator
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, detalles: err.detalles });
  }

  // Errores de PostgreSQL (err.code es string tipo '23505')
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        // Intentar dar un mensaje más específico según la constraint
        if (err.detail && err.detail.includes('correo')) {
          return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
        }
        return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
      case '23503': // foreign_key_violation
        return res.status(400).json({ error: 'La comuna seleccionada no es válida' });
      case '23514': // check_violation
        return res.status(400).json({ error: 'Valor fuera del rango permitido. Revisa el teléfono o la fecha.' });
      case '42P01': // tabla no existe
        return res.status(500).json({
          error: 'La base de datos no está configurada. Ejecuta el schema.sql en Supabase primero.',
        });
      default:
        // Cualquier otro error de PG: devolver código y mensaje real en development
        return res.status(500).json({
          error: NODE_ENV !== 'production'
            ? `Error de base de datos: ${err.message}`
            : 'Error interno del servidor.',
        });
    }
  }

  // Error con statusCode explícito (lanzado desde servicios con err.statusCode)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Error genérico
  return res.status(500).json({
    error: NODE_ENV !== 'production'
      ? (err.message || 'Error interno del servidor.')
      : 'Error interno del servidor.',
  });
}

module.exports = errorHandler;
