import Constants from 'expo-constants';
import { Platform } from 'react-native';

// En web siempre usa localhost (el proxy de Metro lo resuelve).
// En nativo usa la IP configurada en app.config.js (LOCAL_IP para celular/emulador).
const API_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:3001'
  : (Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:3001');

async function apiPost(endpoint, body) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const mensaje = data?.error ?? data?.message ?? 'Error desconocido del servidor';
    const err = new Error(mensaje);
    err.status = response.status;
    err.campo = data?.campo ?? null;
    err.detalles = data?.detalles ?? null;
    throw err;
  }

  return data;
}

/**
 * POST /api/auth/login
 * Ahora usa CORREO ELECTRÓNICO en lugar de RUT.
 * @param {{ correo_usuario: string, password_usuario: string }} credenciales
 * @returns {Promise<{ exchange_token: string }>}
 */
export async function login({ correo_usuario, password_usuario }) {
  return apiPost('/api/auth/login', { correo_usuario, password_usuario });
}

/**
 * POST /api/auth/register
 */
export async function register(payload) {
  return apiPost('/api/auth/register', payload);
}
