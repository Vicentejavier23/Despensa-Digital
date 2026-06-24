import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:3002'
  : (Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:3002');

const TIMEOUT_MS = 10000; // 10 segundos

async function apiPost(endpoint, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      throw new Error('El servidor no responde. Verifica que el backend esté corriendo y que estés en la misma red Wi-Fi.');
    }
    throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
  } finally {
    clearTimeout(timer);
  }

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

export async function login({ correo_usuario, password_usuario }) {
  return apiPost('/api/auth/login', { correo_usuario, password_usuario });
}

export async function register(payload) {
  return apiPost('/api/auth/register', payload);
}
