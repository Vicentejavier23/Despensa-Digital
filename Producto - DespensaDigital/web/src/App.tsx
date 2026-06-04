import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Páginas públicas
import AuthCallback from './pages/AuthCallback';
import LoginScreen from './pages/LoginScreen';

// Layout + rutas protegidas
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Patologias from './pages/Patologias';
import ListaCompras from './pages/ListaCompras';
import Perfil from './pages/Perfil';

/**
 * CORRECCIÓN: AuthProvider debe estar DENTRO de BrowserRouter para que
 * cualquier hook de react-router (useNavigate, useLocation) funcione
 * dentro del contexto si fuera necesario.
 * El AuthContext de este proyecto no usa useNavigate directamente,
 * pero mantener este orden es la práctica correcta y evita errores futuros.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/register" element={<LoginScreen />} />

          {/* Rutas protegidas: requieren JWT válido */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard"      element={<Dashboard />} />
              <Route path="/inventario"     element={<Inventario />} />
              <Route path="/patologias"     element={<Patologias />} />
              <Route path="/lista-compras"  element={<ListaCompras />} />
              <Route path="/perfil"         element={<Perfil />} />
            </Route>
          </Route>

          {/* Raíz: redirige a login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Catch-all: cualquier ruta desconocida va al login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
