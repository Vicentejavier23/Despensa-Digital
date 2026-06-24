// tests/LoginScreen.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../pages/LoginScreen';

const mockAuth = {
  jwt: null, usuario: null, isAuthenticated: false,
  loading: false, iniciarSesion: vi.fn(), logout: vi.fn()
};

describe('LoginScreen — validación de formulario', () => {
  test('Muestra error si se intenta ingresar con campos vacíos', async () => {
    render(
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter>
          <LoginScreen />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Hacer clic en Ingresar sin llenar nada
    fireEvent.click(screen.getByText('Ingresar →'));

    // Debe mostrar el error de correo obligatorio
    expect(
      await screen.findByText('El correo electrónico es obligatorio', { exact: false })
    ).toBeInTheDocument();
  });
});