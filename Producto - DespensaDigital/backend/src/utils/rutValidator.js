'use strict';

/**
 * Calcula el dígito verificador de un RUT chileno.
 * @param {number} rut - Número del RUT sin dígito verificador
 * @returns {string} Dígito verificador ('0'-'9' o 'K')
 */
function calcularDV(rut) {
  let suma = 0;
  let multiplicador = 2;
  let n = rut;

  while (n > 0) {
    suma += (n % 10) * multiplicador;
    n = Math.floor(n / 10);
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = suma % 11;
  if (resto === 0) return '0';
  if (resto === 1) return 'K';
  return String(11 - resto);
}

/**
 * Valida un RUT chileno completo.
 * @param {number|string} run  - Número del RUT (sin puntos ni guión)
 * @param {string}        dv   - Dígito verificador
 * @returns {{ valido: boolean, mensaje: string }}
 */
function validarRutChileno(run, dv) {
  const n = parseInt(String(run).replace(/\./g, ''), 10);

  if (isNaN(n) || n < 1_000_000 || n > 99_999_999) {
    return { valido: false, mensaje: 'RUT inválido — debe tener entre 7 y 9 dígitos' };
  }

  const dvEsperado = calcularDV(n);
  const dvIngresado = String(dv).toUpperCase().trim();

  if (dvIngresado !== dvEsperado) {
    return {
      valido: false,
      mensaje: `Dígito verificador incorrecto (esperado: ${dvEsperado}, recibido: ${dvIngresado})`,
    };
  }

  return { valido: true, mensaje: 'RUT válido' };
}

module.exports = { calcularDV, validarRutChileno };
