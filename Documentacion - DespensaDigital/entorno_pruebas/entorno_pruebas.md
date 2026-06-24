# Entorno de Pruebas — DespensaDigital
**Proyecto:** DespensaDigital v2  
**Curso:** TPY1101 — Taller Aplicado de Programación  
**Institución:** Duoc UC

---

## 1. Descripción del Entorno

El entorno de pruebas de DespensaDigital está diseñado para replicar el comportamiento del servidor de producción sin requerir una conexión real a la base de datos Supabase. Esto permite que las pruebas sean rápidas, deterministas y ejecutables en cualquier máquina de desarrollo.

| Componente | Desarrollo / Producción | Pruebas |
|---|---|---|
| Base de datos | Supabase PostgreSQL (nube) | Mock de Jest (en memoria) |
| Servidor | Puerto 3001 activo | Supertest (sin puerto real) |
| Variables de entorno | `.env` con credenciales reales | `src/tests/setup.js` con valores de prueba |
| Rate limiting | Activo (10 req / 15 min) | Desactivado (`NODE_ENV=test`) |
| JWT Secret | Secreto real en `.env` | Clave de prueba fija |

---

## 2. Herramientas Utilizadas

| Herramienta | Versión | Propósito |
|---|---|---|
| **Jest** | 29.7.x | Framework principal de testing |
| **Supertest** | 6.3.x | Peticiones HTTP a la app Express sin servidor real |
| **bcryptjs** | 2.4.x | Generación de hashes de prueba para tests de login |
| **jsonwebtoken** | 9.0.x | Generación de tokens JWT válidos para tests protegidos |

---

## 3. Configuración del Entorno de Pruebas

### 3.1 Variables de entorno (`src/tests/setup.js`)

```js
process.env.DATABASE_URL  = 'postgres://test:test@localhost:5432/despensa_test';
process.env.JWT_SECRET    = 'clave-secreta-para-tests-despensa-digital-2024';
process.env.CORS_ORIGIN   = 'http://localhost:5173';
process.env.NODE_ENV      = 'test';
process.env.PORT          = '3001';
```

### 3.2 Configuración de Jest (`package.json`)

```json
"jest": {
  "testEnvironment": "node",
  "setupFiles": ["./src/tests/setup.js"],
  "testMatch": ["**/tests/**/*.test.js"],
  "testTimeout": 15000
}
```

### 3.3 Mock de la base de datos

Cada archivo de test intercepta el módulo `config/db` antes de que cargue, evitando cualquier conexión real:

```js
jest.mock('../config/db', () => ({
  query:   jest.fn(),
  connect: jest.fn(() => Promise.resolve(mockClient)),
  on:      jest.fn(),
}));
```

---

## 4. Instalación del Entorno de Pruebas

### Requisitos previos
- Node.js >= 18.0.0
- npm >= 9.0.0

### Pasos de instalación

```bash
# 1. Ir a la carpeta del backend
cd "Producto - DespensaDigital/backend"

# 2. Instalar todas las dependencias (incluye Jest y Supertest)
npm install

# 3. Ejecutar los tests
npm test

# 4. Ver tests con detalle
npm run test:verbose

# 5. Ver cobertura de código
npm run test:coverage
```

---

## 5. Estructura de Archivos de Prueba

```
backend/src/tests/
├── setup.js          ← Variables de entorno (carga antes de todo)
├── health.test.js    ← CP-001 a CP-003: servidor y headers
├── auth.test.js      ← CP-004 a CP-010: registro, login, exchange
├── middleware.test.js ← CP-011 a CP-013: validación JWT
├── productos.test.js ← CP-014 a CP-018: CRUD inventario
└── alertas.test.js   ← CP-019 a CP-022: sistema de alertas
```

---

## 6. Copia de Seguridad de la Base de Datos de Prueba

Para ejecutar pruebas contra la base de datos real de Supabase (pruebas de integración), se puede exportar el esquema y datos de prueba:

```bash
# Exportar esquema desde Supabase (requiere psql y credenciales en .env)
pg_dump --schema-only --no-owner -d $DATABASE_URL > backup_esquema_pruebas.sql

# Exportar datos de prueba (solo tablas necesarias)
pg_dump --data-only --table=USUARIO --table=PRODUCTO -d $DATABASE_URL > backup_datos_pruebas.sql
```

El archivo `supabase/schema.sql` en el repositorio contiene el esquema completo y datos de prueba pre-cargados (usuarios de prueba, datos geográficos de Chile).

---

## 7. Verificación del Entorno

Comandos para verificar que el entorno esté correctamente configurado:

```bash
# Verificar Node.js
node --version   # debe ser >= 18.0.0

# Verificar que Jest está instalado
npx jest --version   # debe ser 29.x.x

# Verificar que el backend arranca (requiere .env configurado)
npm run dev

# Verificar health check
curl http://localhost:3001/health
```

---

## 8. Diferencias entre Entorno de Pruebas y Producción

| Aspecto | Producción | Pruebas |
|---|---|---|
| Base de datos | PostgreSQL en Supabase | Mock en memoria (Jest) |
| Autenticación JWT | Secret real (32+ chars) | Secret fijo de prueba |
| Rate Limiting | Activo (brute force protection) | Desactivado |
| Logs de error | Solo timestamp + mensaje | Full stack trace |
| HTTPS | Supabase SSL requerido | HTTP local |
| Variables sensibles | `.env` no versionado | `setup.js` en repositorio |
