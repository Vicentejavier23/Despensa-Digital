'use strict';
/**
 * ============================================================
 * tokenStore.js — Almacén en memoria de exchange tokens
 * ============================================================
 * Proyecto  : DespensaDigital v2
 * Curso     : TPY1101 — Duoc UC
 *
 * El exchange_token es un token temporal de un solo uso que actúa
 * como "puente" entre la app móvil y la web:
 *
 *  App Móvil ──[exchange_token]──► Web ──[canjea por JWT]──► Dashboard
 *
 * Características:
 *  - Se genera con 32 bytes aleatorios (crypto.randomBytes)
 *  - Expira en 5 minutos
 *  - Se destruye inmediatamente al primer uso (no reutilizable)
 *  - Un proceso de limpieza automática elimina los tokens no usados
 *
 * Funciones exportadas:
 *  - setToken(token, payload)  → guarda el token con su TTL
 *  - consumeToken(token)       → lee y destruye el token; retorna payload o null
 * ============================================================
 */

// TTL de 5 minutos — suficiente para que el navegador cargue la web
const TTL_MS = 5 * 60 * 1000;

/** @type {Map<string, { id_usuario: number, correo_usuario: string, pri_nom_usuario: string, expiresAt: number }>} */
const store = new Map();

function setToken(token, payload) {
  store.set(token, { ...payload, expiresAt: Date.now() + TTL_MS });
}

/**
 * Lee y destruye el token en la misma operación (un solo uso).
 * Retorna el payload si es válido, null si no existe o expiró.
 */
function consumeToken(token) {
  const entry = store.get(token);
  if (!entry) return null;
  store.delete(token); // destrucción inmediata
  if (Date.now() > entry.expiresAt) return null;
  const { expiresAt, ...payload } = entry;
  return payload;
}

// Limpieza automática de tokens no usados
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.expiresAt) store.delete(key);
  }
}, 60 * 1000).unref();

module.exports = { setToken, consumeToken };
