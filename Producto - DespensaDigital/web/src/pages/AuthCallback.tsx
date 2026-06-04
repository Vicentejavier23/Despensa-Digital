/**
 * ============================================================
 * AuthCallback.tsx — Página de callback JWT (Web)
 * ============================================================
 * Proyecto  : DespensaDigital v2
 * Curso     : TPY1101 — Duoc UC
 *
 * Esta página es el "puente" entre la app móvil y la web.
 *
 * Flujo completo:
 *  1. El usuario hace login en la app móvil
 *  2. La móvil abre el navegador en: /auth/callback?code=<exchange_token>
 *  3. Esta página lee el parámetro "code" de la URL
 *  4. Hace POST /api/auth/exchange con ese código
 *  5. El backend lo canjea por un JWT real + datos del usuario
 *  6. Llama a iniciarSesion() del AuthContext para guardar la sesión
 *  7. Redirige automáticamente al /dashboard
 *
 * Si el código es inválido o ya fue usado, muestra un error
 * y pide al usuario volver a la app móvil.
 * ============================================================
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Ruta: /auth/callback
 * Recibe ?code=<exchange_token> enviado por la app móvil.
 * Llama a POST /api/auth/exchange, obtiene JWT + usuario y redirige al dashboard.
 *
 * CORRECCIONES:
 * 1. Usa ruta relativa /api/auth/exchange (funciona con el proxy de Vite en dev
 *    y con VITE_API_URL vacío en producción con mismo dominio, o lo toma de env).
 * 2. useRef para evitar doble ejecución en StrictMode.
 * 3. Validación explícita del code vacío.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const ejecutado = useRef(false); // Evita doble ejecución en React StrictMode

  const [estado, setEstado] = useState<'procesando' | 'error'>('procesando');
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    // Protección contra doble ejecución en React.StrictMode (desarrollo)
    if (ejecutado.current) return;
    ejecutado.current = true;

    const code = searchParams.get('code');

    if (!code || code.trim() === '') {
      setEstado('error');
      setMensajeError('No se recibió un código de autenticación válido. Vuelve a iniciar sesión desde la app.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (!res.ok || !data.jwt) {
          throw new Error(data.error ?? 'Token inválido o expirado');
        }

        iniciarSesion(data.jwt, data.usuario);
        navigate('/dashboard', { replace: true });

      } catch (err: unknown) {
        setEstado('error');
        setMensajeError(
          err instanceof Error ? err.message : 'Error al procesar la autenticación'
        );
      }
    })();
  // Solo se ejecuta al montar — searchParams no puede cambiar el código
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Estado: Error ── */
  if (estado === 'error') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconError}>✗</div>
          <h2 style={styles.titulo}>Error de autenticación</h2>
          <p style={styles.descripcion}>{mensajeError}</p>
          <p style={styles.hint}>
            Vuelve a la app móvil e intenta iniciar sesión de nuevo.
          </p>
        </div>
      </div>
    );
  }

  /* ── Estado: Procesando ── */
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🥗</div>
        <h2 style={styles.titulo}>Iniciando sesión...</h2>
        <p style={styles.descripcion}>
          Verificando tu identidad. Serás redirigido en un momento.
        </p>
        <div style={styles.spinnerWrapper}>
          <SpinnerCSS />
        </div>
      </div>
    </div>
  );
}

/* Spinner en CSS puro — no depende de Tailwind ni librerías */
function SpinnerCSS() {
  return (
    <>
      <style>{`
        @keyframes dd-spin { to { transform: rotate(360deg); } }
        .dd-spinner {
          width: 36px; height: 36px; border-radius: 50%;
          border: 4px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          animation: dd-spin 0.75s linear infinite;
          display: inline-block;
        }
      `}</style>
      <span className="dd-spinner" />
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'var(--color-primary-800)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: 'var(--radius-xl)',
    padding: '2.5rem',
    textAlign: 'center',
    maxWidth: 400,
    width: '100%',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  logo: { fontSize: '3rem', marginBottom: '1rem' },
  iconError: {
    fontSize: '2.5rem', color: '#FCA5A5',
    marginBottom: '0.75rem', fontWeight: 700,
  },
  titulo: {
    color: '#fff', fontSize: 'var(--font-size-2xl)',
    fontWeight: 700, marginBottom: '0.5rem',
  },
  descripcion: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 'var(--font-size-sm)', marginBottom: '1rem',
  },
  hint: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 'var(--font-size-xs)',
    marginTop: '0.5rem',
  },
  spinnerWrapper: {
    display: 'flex', justifyContent: 'center', marginTop: '1.5rem',
  },
};
