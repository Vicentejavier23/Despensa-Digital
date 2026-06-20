/**
 * ============================================================
 * useAuthFlow.js â€” Hook de autenticaciÃ³n (App MÃ³vil)
 * ============================================================
 * Proyecto  : DespensaDigital v2
 * Curso     : TPY1101 â€” Duoc UC
 *
 * Flujo de autenticaciÃ³n:
 *
 *  Login:
 *   1. EnvÃ­a correo + contraseÃ±a al backend â†’ recibe exchange_token + mobile_token
 *   2. Usa mobile_token para obtener JWT + datos del usuario (queda en la app)
 *   3. Retorna { callbackUrl, jwt, usuario } para navegar a MainScreen
 *      y tambiÃ©n abre el navegador web con el exchange_token
 *
 *  Registro:
 *   - Mismo flujo que login pero crea la cuenta primero.
 *
 * De esta forma la app mÃ³vil tiene su propia sesiÃ³n autenticada
 * (para PatologÃ­as y Lista de compras) sin depender del navegador.
 * ============================================================
 */
import { useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { login, register } from '../api/authApi';

const WEB_CALLBACK_URL =
  Constants.expoConfig?.extra?.webCallbackUrl ?? 'http://localhost:5173';

const API_BASE = Platform.OS === 'web'
  ? 'http://localhost:3002'
  : (Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:3002');

/** Canjea un token de exchange por JWT + usuario */
async function exchangeToken(token) {
  const res = await fetch(`${API_BASE}/api/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'Error al autenticar');
  return data; // { jwt, usuario }
}

export function useAuthFlow() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const limpiarError = useCallback(() => setError(null), []);

  const redirigirAlNavegador = useCallback((exchange_token) => {
    return `${WEB_CALLBACK_URL}/auth/callback?code=${exchange_token}`;
  }, []);

  /**
   * Login por CORREO ELECTRÃ“NICO.
   * Retorna { callbackUrl, jwt, usuario } o null si falla.
   */
  const ejecutarLogin = useCallback(async (correo_usuario, password_usuario) => {
    setLoading(true); setError(null);
    try {
      const { exchange_token, mobile_token } = await login({ correo_usuario, password_usuario });
      // mobile_token â†’ JWT para uso dentro de la app
      const { jwt, usuario } = await exchangeToken(mobile_token);
      // exchange_token â†’ URL para abrir la versiÃ³n web
      const callbackUrl = redirigirAlNavegador(exchange_token);
      return { callbackUrl, jwt, usuario };
    } catch (err) {
      setError(err.message ?? 'Error al iniciar sesiÃ³n. Intenta de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [redirigirAlNavegador]);

  /**
   * Registro.
   * Retorna { callbackUrl, jwt, usuario } o null si falla.
   */
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

