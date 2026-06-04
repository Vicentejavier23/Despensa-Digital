'use strict';
require('dotenv').config();

/**
 * Valida que todas las variables de entorno críticas estén definidas.
 * Si falta alguna, el proceso termina con un error claro en lugar de fallar
 * silenciosamente más tarde.
 */
const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[ENV] ❌ Variables de entorno faltantes: ${missing.join(', ')}\n` +
    `Copia .env.example a .env y rellena los valores.`
  );
  process.exit(1);
}

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 3001,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
