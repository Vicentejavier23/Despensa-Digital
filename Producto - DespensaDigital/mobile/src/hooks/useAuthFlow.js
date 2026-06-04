/**
 * ============================================================
 * useAuthFlow.js — Hook de autenticación (App Móvil)
 * ============================================================
 * Proyecto  : DespensaDigital v2
 * Curso     : TPY1101 — Duoc UC
 *
 * Este hook encapsula todo el flujo de autenticación de la app móvil:
 *
 *  Login:
 *   1. Envía correo + contraseña al backend → recibe exchange_token
 *   2. Construye la URL: <webCallbackUrl>/auth/callback?code=<token>
 *   3. Abre esa URL en el navegador del sistema (Linking.openURL)
 *   4. La web completa el login y guarda el JWT
 *
 *  Registro:
 *   - Mismo flujo que login, pero primero crea la cuenta
 *
 * La URL base de la web se lee de app.config.js → extra.webCallbackUrl
 * Por defecto apunta a http://localhost:5173 (modo escritorio)
 * Para celular real: definir LOCAL_IP=<ip> al arrancar Expo
 * ============================================================
 */
import { useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { login, register } from '../api/authApi';

const WEB_CALLBACK_URL =
  Constants.expoConfig?.extra?.webCallbackUrl ?? 'http://localhost:5173';

/**
 * Hook que encapsula todo el flujo de autenticación mobile.
 * Login ahora usa CORREO ELECTRÓNICO en vez de RUT.
 */
export function useAuthFlow() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const limpiarError = useCallback(() => setError(null), []);

  // Solo construye la URL — RedirectingScreen se encarga de abrirla
  const redirigirAlNavegador = useCallback((exchange_token) => {
    return `${WEB_CALLBACK_URL}/auth/callback?code=${exchange_token}`;
  }, []);

  /**
   * Login por CORREO ELECTRÓNICO.
   * @param {string} correo_usuario
   * @param {string} password_usuario
   */
  const ejecutarLogin = useCallback(async (correo_usuario, password_usuario) => {
    setLoading(true);
    setError(null);
    try {
      const { exchange_token } = await login({ correo_usuario, password_usuario });
      return redirigirAlNavegador(exchange_token);
    } catch (err) {
      setError(err.message ?? 'Error al iniciar sesión. Intenta de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [redirigirAlNavegador]);

  /**
   * Registro — sin cambios en la firma, el payload ya incluye correo.
   */
  const ejecutarRegistro = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { exchange_token } = await register(payload);
      return redirigirAlNavegador(exchange_token);
    } catch (err) {
      setError(err.message ?? 'Error al crear la cuenta. Intenta de nuevo.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [redirigirAlNavegador]);

  return { loading, error, ejecutarLogin, ejecutarRegistro, limpiarError, redirigirAlNavegador };
}
