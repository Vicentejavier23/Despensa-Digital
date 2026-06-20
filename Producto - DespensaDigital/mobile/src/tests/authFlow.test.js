jest.mock('expo-constants', () => ({
  expoConfig: { extra: { apiBaseUrl: 'http://localhost:3002', webCallbackUrl: 'http://localhost:5173' } },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

// Mockeamos fetch global para controlar las respuestas HTTP
global.fetch = jest.fn();

const { login, register } = require('../api/authApi');

function mockFetchResponse(status, body) {
  global.fetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authApi — login', () => {
  test('login exitoso retorna exchange_token y mobile_token', async () => {
    mockFetchResponse(200, {
      exchange_token: 'exchange-abc123',
      mobile_token:   'mobile-abc123',
    });

    const resultado = await login({
      correo_usuario:   'test@despensa.cl',
      password_usuario: 'Password123',
    });

    expect(resultado.exchange_token).toBe('exchange-abc123');
    expect(resultado.mobile_token).toBe('mobile-abc123');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('credenciales incorrectas — lanza error con mensaje genérico', async () => {
    mockFetchResponse(401, { error: 'Correo o contraseña incorrectos' });

    await expect(
      login({ correo_usuario: 'test@despensa.cl', password_usuario: 'wrongpass' })
    ).rejects.toThrow('Correo o contraseña incorrectos');
  });

  test('error de red (timeout / AbortError) — lanza error descriptivo', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    global.fetch.mockRejectedValueOnce(abortError);

    await expect(
      login({ correo_usuario: 'test@despensa.cl', password_usuario: 'Password123' })
    ).rejects.toThrow(/no responde|backend/i);
  });

  test('correo duplicado en registro — lanza error 409', async () => {
    mockFetchResponse(409, { error: 'El correo electrónico ya está registrado' });

    await expect(
      register({
        nombre_usuario:    'Test',
        apellido_usuario:  'Usuario',
        correo_usuario:    'existente@despensa.cl',
        password_usuario:  'Password123',
        num_tel_usuario:   912345678,
        fecha_nac_usuario: '2000-01-01',
      })
    ).rejects.toThrow('El correo electrónico ya está registrado');
  });
});

describe('authApi — register', () => {
  test('registro exitoso retorna exchange_token y mobile_token', async () => {
    mockFetchResponse(201, {
      exchange_token: 'exchange-reg',
      mobile_token:   'mobile-reg',
    });

    const resultado = await register({
      nombre_usuario:    'Nuevo',
      apellido_usuario:  'Usuario',
      correo_usuario:    'nuevo@despensa.cl',
      password_usuario:  'Password123',
      num_tel_usuario:   912345678,
      fecha_nac_usuario: '2000-01-01',
    });

    expect(resultado.exchange_token).toBeDefined();
    expect(resultado.mobile_token).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
