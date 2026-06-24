import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

function buildAuth(overrides = {}) {
  return {
    jwt: null, usuario: null, isAuthenticated: false,
    loading: false, iniciarSesion: vi.fn(), logout: vi.fn(),
    ...overrides,
  };
}

describe('ProtectedRoute — control de acceso', () => {
  test('redirige a /login si el usuario no está autenticado', () => {
    render(
      <AuthContext.Provider value={buildAuth()}>
        <MemoryRouter initialEntries={['/inventario']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/inventario" element={<div>Inventario</div>} />
            </Route>
            <Route path="/login" element={<div>Página de login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Página de login')).toBeInTheDocument();
    expect(screen.queryByText('Inventario')).not.toBeInTheDocument();
  });

  test('muestra el contenido protegido si el usuario está autenticado', () => {
    render(
      <AuthContext.Provider value={buildAuth({ isAuthenticated: true, jwt: 'jwt-valido' })}>
        <MemoryRouter initialEntries={['/inventario']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/inventario" element={<div>Inventario</div>} />
            </Route>
            <Route path="/login" element={<div>Página de login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
  });
});
