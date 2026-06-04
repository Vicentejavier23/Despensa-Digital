'use strict';
const { Pool } = require('pg');
const { DATABASE_URL } = require('./env');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // requerido por Supabase Pooler (puerto 6543) en todos los entornos
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Error en cliente inactivo:', err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('[DB] ❌ No se pudo conectar a Supabase:', err.message);
    console.error('[DB] Revisa DATABASE_URL en backend/.env');
    process.exit(1);
  }
  release();
  console.log('[DB] ✅ Conectado a Supabase PostgreSQL');
});

module.exports = pool;
