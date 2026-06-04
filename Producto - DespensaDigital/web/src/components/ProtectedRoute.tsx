import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg)',
      }}>
        <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '4px solid var(--color-primary-200)',
          borderTopColor: 'var(--color-primary-800)',
          display: 'inline-block',
          animation: '_spin 0.75s linear infinite',
        }} />
      </div>
    );
  }

  // Usuario no autenticado → va al login, NO al /auth/callback
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
