// tests/AuthCallback.test.tsx

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AuthCallback from '../pages/AuthCallback';

const mockAuth = {
  jwt: null, usuario: null, isAuthenticated: false,
  loading: false, iniciarSesion: vi.fn(), logout: vi.fn()
};

describe('AuthCallback — validación del parámetro ?code=', () => {
  test('Muestra error si el código tiene formato inválido (Open Redirect)', () => {
    render(
      <AuthContext.Provider value={mockAuth}>
        {/* Simulamos una URL con payload malicioso — hallazgo A-01 OWASP ZAP */}
        <MemoryRouter initialEntries={['/auth/callback?code=https%3A%2F%2Fevil.com']}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // El regex /^[a-f0-9]{64}$/i debe rechazar la URL maliciosa
    expect(
      screen.getByText('El código de autenticación tiene un formato inválido. Vuelve a iniciar sesión desde la app.')
    ).toBeInTheDocument();

    // El backend nunca debe ser llamado
    expect(mockAuth.iniciarSesion).not.toHaveBeenCalled();
  });
});