const { validarEmail, validarPassword, validarTelefono, validarEdadMinima } = require('../utils/validators');

describe('validators — validarEmail', () => {
  test('acepta correo válido', () => {
    expect(validarEmail('usuario@gmail.com').valido).toBe(true);
  });

  test('rechaza correo sin @', () => {
    expect(validarEmail('no-es-correo').valido).toBe(false);
  });

  test('rechaza correo sin dominio', () => {
    expect(validarEmail('usuario@').valido).toBe(false);
  });
});

describe('validators — validarPassword', () => {
  test('acepta contraseña válida', () => {
    const r = validarPassword('Password123');
    expect(r.valido).toBe(true);
  });

  test('rechaza contraseña sin mayúscula', () => {
    const r = validarPassword('sinmayuscula1');
    expect(r.valido).toBe(false);
    expect(r.mensaje).toMatch(/mayúscula/i);
  });

  test('rechaza contraseña menor a 8 caracteres', () => {
    const r = validarPassword('Ab1');
    expect(r.valido).toBe(false);
    expect(r.mensaje).toMatch(/8/);
  });

  test('rechaza contraseña sin número', () => {
    const r = validarPassword('SinNumero');
    expect(r.valido).toBe(false);
    expect(r.mensaje).toMatch(/número/i);
  });
});

describe('validators — validarTelefono', () => {
  test('acepta teléfono chileno válido', () => {
    expect(validarTelefono('912345678').valido).toBe(true);
  });

  test('rechaza teléfono con menos de 9 dígitos', () => {
    const r = validarTelefono('12345');
    expect(r.valido).toBe(false);
  });

  test('rechaza teléfono que no comienza con 9', () => {
    const r = validarTelefono('812345678');
    expect(r.valido).toBe(false);
  });
});

describe('validators — validarEdadMinima', () => {
  test('acepta usuario mayor de 13 años', () => {
    const r = validarEdadMinima('2000-01-01');
    expect(r.valido).toBe(true);
  });

  test('rechaza usuario menor de 13 años', () => {
    const hoy = new Date();
    const fechaJoven = `${hoy.getFullYear() - 10}-01-01`;
    const r = validarEdadMinima(fechaJoven);
    expect(r.valido).toBe(false);
    expect(r.mensaje).toMatch(/13/);
  });

  test('rechaza fecha vacía', () => {
    const r = validarEdadMinima('');
    expect(r.valido).toBe(false);
  });
});
