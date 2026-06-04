export function validarEmail(email) {
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return { valido: regex.test(email.trim()) };
}

export function validarPassword(password) {
  if (!password || password.length < 8) {
    return { valido: false, mensaje: 'Mínimo 8 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valido: false, mensaje: 'Debe incluir al menos una mayúscula' };
  }
  if (!/[0-9]/.test(password)) {
    return { valido: false, mensaje: 'Debe incluir al menos un número' };
  }
  return { valido: true, mensaje: '' };
}

export function validarEdadMinima(fechaNacimiento, edadMinima = 13) {
  if (!fechaNacimiento) {
    return { valido: false, mensaje: 'La fecha de nacimiento es requerida' };
  }

  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) {
    return { valido: false, mensaje: 'Fecha de nacimiento inválida' };
  }

  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNac = nacimiento.getMonth();
  if (mesActual < mesNac || (mesActual === mesNac && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  if (edad < edadMinima) {
    return { valido: false, mensaje: `Debes tener al menos ${edadMinima} años para registrarte` };
  }

  return { valido: true, mensaje: '' };
}

export function validarTelefono(telefono) {
  const tel = String(telefono).replace(/\s/g, '');
  if (!/^9[0-9]{8}$/.test(tel)) {
    return { valido: false, mensaje: 'El teléfono debe tener 9 dígitos y comenzar con 9' };
  }
  return { valido: true, mensaje: '' };
}
