import { render, act } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

function HelperComponent({ onRender }: { onRender: (ctx: ReturnType<typeof useAuth>) => void }) {
  const ctx = useAuth();
  onRender(ctx);
  return null;
}

describe('AuthContext — sesión de usuario', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('iniciarSesion persiste jwt y marca isAuthenticated en true', () => {
    let ctx!: ReturnType<typeof useAuth>;

    render(
      <AuthProvider>
        <HelperComponent onRender={(c) => { ctx = c; }} />
      </AuthProvider>
    );

    act(() => {
      ctx.iniciarSesion('jwt-de-prueba', {
        id_usuario: 1, nombre_usuario: 'Test', correo_usuario: 'test@despensa.cl',
        apellido_usuario: '', num_tel_usuario: 0, fecha_nac_usuario: '',
      });
    });

    expect(ctx.isAuthenticated).toBe(true);
    expect(ctx.jwt).toBe('jwt-de-prueba');
    expect(sessionStorage.getItem('dd_jwt')).toBe('jwt-de-prueba');
  });

  test('logout limpia jwt y marca isAuthenticated en false', () => {
    let ctx!: ReturnType<typeof useAuth>;

    render(
      <AuthProvider>
        <HelperComponent onRender={(c) => { ctx = c; }} />
      </AuthProvider>
    );

    act(() => {
      ctx.iniciarSesion('jwt-de-prueba', {
        id_usuario: 1, nombre_usuario: 'Test', correo_usuario: 'test@despensa.cl',
        apellido_usuario: '', num_tel_usuario: 0, fecha_nac_usuario: '',
      });
    });

    act(() => {
      ctx.logout();
    });

    expect(ctx.isAuthenticated).toBe(false);
    expect(ctx.jwt).toBeNull();
    expect(sessionStorage.getItem('dd_jwt')).toBeNull();
  });
});
