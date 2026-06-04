'use strict';
/**
 * ============================================================
 * server.js — Punto de entrada del servidor Express
 * ============================================================
 * Proyecto  : DespensaDigital v2
 * Curso     : TPY1101 — Duoc UC
 *
 * Responsabilidades:
 *  - Configura CORS para permitir peticiones desde la web (5173)
 *    y la app móvil web (8081)
 *  - Registra todas las rutas de la API bajo el prefijo /api
 *  - Expone un endpoint /health para verificar que el servidor esté vivo
 *
 * Puerto por defecto: 3001 (configurable en backend/.env → PORT)
 * ============================================================
 */

const { PORT, CORS_ORIGIN } = require('./config/env');
const express = require('express');
const cors    = require('cors');

const authRoutes         = require('./auth/auth.routes');
const geoRoutes          = require('./geo/geo.routes');
const productosRoutes    = require('./productos/productos.routes');
const patologiasRoutes   = require('./patologias/patologias.routes');
const listaComprasRoutes = require('./lista-compras/lista-compras.routes');
const alertasRoutes      = require('./alertas/alertas.routes');
const errorHandler       = require('./middleware/errorHandler');

const app = express();

// Permite múltiples orígenes separados por coma en CORS_ORIGIN
// Ej: http://localhost:5173,http://localhost:8081
const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origen no permitido → ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', servicio: 'DespensaDigital API v2', timestamp: new Date().toISOString() });
});

app.use('/api/auth',          authRoutes);
app.use('/api/geo',           geoRoutes);
app.use('/api/productos',     productosRoutes);
app.use('/api/patologias',    patologiasRoutes);
app.use('/api/lista-compras', listaComprasRoutes);
app.use('/api/alertas',       alertasRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] ✅ DespensaDigital API v2 corriendo`);
  console.log(`[Server] 📡 Local:  http://localhost:${PORT}`);
  console.log(`[Server] 📱 Red:    http://<TU_IP>:${PORT}`);
  console.log(`[Server] 🌐 CORS -> ${CORS_ORIGIN}`);
});

module.exports = app;
