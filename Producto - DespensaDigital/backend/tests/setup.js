'use strict';
/**
 * setup.js — Configuración compartida para todos los tests
 * Genera un JWT válido para pruebas de rutas protegidas.
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Usuario ficticio de prueba (no necesita existir en BD para pruebas de middleware)
const TEST_USER = {
  id_usuario: 999999,
  correo_usuario: 'test@despensadigital.cl',
};

function generarTokenValido() {
  return jwt.sign(TEST_USER, JWT_SECRET, { expiresIn: '1h' });
}

function generarTokenExpirado() {
  return jwt.sign(TEST_USER, JWT_SECRET, { expiresIn: '-1s' });
}

function generarTokenFirmaInvalida() {
  return jwt.sign(TEST_USER, 'secreto-incorrecto', { expiresIn: '1h' });
}

module.exports = { generarTokenValido, generarTokenExpirado, generarTokenFirmaInvalida, TEST_USER };
