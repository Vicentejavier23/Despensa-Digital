import { useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { login, register } from '../api/authApi';

const WEB_CALLBACK_URL =
  Constants.expoConfig?.extra?.webCallbackUrl ?? 'http://localhost:5173';

const API_BASE = Platform.OS === 'web'
  ? 'http://localhost:3002'
  : (Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:3002');

const TIMEOUT_MS = 10000;

async function exchangeToken(token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${API_BASE}/api/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: token }),
      signal: controller.signal,
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      throw new Error('El servidor no responde. Verifica que el backend este corriendo.');
    }
    throw new Error('No se pudo conectar al servidor.');
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Error al autenticar');
  return data;
}

export function useAuthFlow() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const limpiarError = useCallback(() => setError(null), []);

  const redirigirAlNavegador = useCallback((exchange_token) => {
    return `${WEB_CALLBACK_URL}/auth/callback?code=${exchange_token}`;
  }, []);

  const ejecutarLogin = useCallback(async (correo_usuario, password_usuario) => {
    setLoading(true); setError(null);
    try {
      const { exchange_token, mobile_token } = await login({ correo_usuario, password_usuario });
      const { jwt, usuario } = await exchangeToken(mobile_token);
      const callbackUrl = redirigirAlNavegador(exchange_token);
      return { callbackUrl, jwt, usuario };
    } catch (err) {
      setError(err.message ?? 'Error al iniciar sesion. Intenta de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [redirigirAlNavegador]);

  const ejecutarRegistro = useCallback(async (payload) => {
    setLoading(true); setError(null);
    try {
      const { exchange_token, mobile_token } = await register(payload);
      const { jwt, usuario } = await exchangeToken(mobile_token);
      const callbackUrl = redirigirAlNavegador(exchange_token);
      return { callbackUrl, jwt, usuario };
    } catch (err) {
      setError(err.message ?? 'Error al crear la cuenta. Intenta de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [redirigirAlNavegador]);

  return { loading, error, ejecutarLogin, ejecutarRegistro, limpiarError, redirigirAlNavegador };
}
