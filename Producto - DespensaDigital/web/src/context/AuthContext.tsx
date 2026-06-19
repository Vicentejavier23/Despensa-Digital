/**
 * ============================================================
 * AuthContext.tsx — Contexto global de autenticación (Web)
 * ============================================================
 * Proyecto  : DespensaDigital v2
 * Curso     : TPY1101 — Duoc UC
 *
 * Responsabilidad:
 *  Mantiene el estado de sesión del usuario en toda la aplicación web.
 *  El JWT y los datos del usuario se persisten en sessionStorage,
 *  lo que significa que la sesión se limpia al cerrar el navegador.
 *
 * Cómo se obtiene el JWT:
 *  1. La app móvil hace login y obtiene un exchange_token del backend
 *  2. La móvil abre el navegador en /auth/callback?code=<exchange_token>
 *  3. AuthCallback.tsx canjea ese código por el JWT real
 *  4. Llama a iniciarSesion(jwt, usuario) de este contexto
 *  5. Desde ese momento, todas las peticiones incluyen el JWT automáticamente
 *
 * Hooks exportados:
 *  - useAuth() → { jwt, usuario, isAuthenticated, loading, iniciarSesion, logout }
 * ============================================================
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Usuario } from '../types';

interface AuthContextValue {
  jwt:             string | null;
  usuario:         Usuario | null;
  isAuthenticated: boolean;
  loading:         boolean;
  iniciarSesion:   (jwt: string, usuario: Usuario) => void;
  logout:          () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const JWT_KEY     = 'dd_jwt';
const USUARIO_KEY = 'dd_usuario';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [jwt,     setJwt]     = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  // Recargar sesión desde sessionStorage al montar
  useEffect(() => {
    try {
      const storedJwt     = sessionStorage.getItem(JWT_KEY);
      const storedUsuario = sessionStorage.getItem(USUARIO_KEY);

      if (storedJwt && storedUsuario) {
        // Verificar que el JWT no esté expirado (sin llamar al backend)
        const payload = JSON.parse(atob(storedJwt.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setJwt(storedJwt);
          setUsuario(JSON.parse(storedUsuario));
        } else {
          // JWT expirado → limpiar
          sessionStorage.removeItem(JWT_KEY);
          sessionStorage.removeItem(USUARIO_KEY);
        }
      }
    } catch {
      // sessionStorage corrupto → ignorar
    } finally {
      setLoading(false);
    }
  }, []);

  const iniciarSesion = useCallback((nuevoJwt: string, nuevoUsuario: Usuario) => {
    sessionStorage.setItem(JWT_KEY,     nuevoJwt);
    sessionStorage.setItem(USUARIO_KEY, JSON.stringify(nuevoUsuario));
    setJwt(nuevoJwt);
    setUsuario(nuevoUsuario);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(JWT_KEY);
    sessionStorage.removeItem(USUARIO_KEY);
    setJwt(null);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      jwt,
      usuario,
      isAuthenticated: !!jwt,
      loading,
      iniciarSesion,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
