'use strict';
const { Router } = require('express');
const {
  register, login, exchange,
  validacionesRegistro, validacionesLogin,
} = require('./auth.controller');

const router = Router();

/**
 * POST /api/auth/register
 * Crea un nuevo usuario. Login posterior por correo.
 */
router.post('/register', validacionesRegistro, register);

/**
 * POST /api/auth/login
 * Autenticación por CORREO ELECTRÓNICO + contraseña.
 * Devuelve un exchange_token de un solo uso (válido 30 s).
 */
router.post('/login', validacionesLogin, login);

/**
 * POST /api/auth/exchange
 * Canjea el exchange_token por JWT de 24h + datos del usuario.
 */
router.post('/exchange', exchange);

module.exports = router;
