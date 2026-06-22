# DespensaDigital

> *"Que nada se venza, que todo rinda"*

Aplicación fullstack para gestionar el inventario del hogar: alertas de vencimiento, lista de compras automática y control de patologías alimentarias.

**Asignatura:** Taller de Programación — Duoc UC San Joaquín  
**Equipo:** Vicente Bueno · Daniel Lagos · Diego Olea  
**Profesor:** Jorge Niochet

---

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Inicio rápido](#inicio-rápido)
  - [1. Supabase](#1-configurar-supabase)
  - [2. Backend](#2-configurar-el-backend)
  - [3. Web](#3-configurar-la-web)
  - [4. Mobile](#4-configurar-la-app-móvil)
- [Usuarios de prueba](#usuarios-de-prueba)
- [API Reference](#api-reference)
- [Documentación](#documentación)
- [Estado del proyecto](#estado-del-proyecto)

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Web frontend | React 18 + TypeScript + Vite |
| Mobile | React Native (Expo) |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL vía Supabase |
| Auth | JWT + exchange token de un solo uso |

---

## Estructura del proyecto

```
Despensa-Digital/
├── Producto - DespensaDigital/
│   ├── backend/          → API REST Express (puerto 3002)
│   ├── web/              → App React/Vite (puerto 5173)
│   ├── mobile/           → App Expo React Native
│   └── supabase/         → Schema SQL + migraciones
├── Documentacion - DespensaDigital/
│   ├── Diagramas/        → Diagramas de arquitectura y MER
│   ├── Mockup/           → Mockups de la interfaz
│   ├── plan_pruebas/     → Plan de pruebas y evidencia
│   └── ...
└── Gestion - DespensaDigital/
    └── CartaGantt_DespensaDigital_final_2026.xlsx
```

---

## Inicio rápido

### 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta `supabase/schema.sql` completo
3. Copia la **Connection string** (Transaction Mode, puerto 6543) desde:  
   `Settings → Database → Connection string`

---

### 2. Configurar el backend

```bash
cd "Producto - DespensaDigital/backend"
cp .env.example .env
```

Edita `.env`:

```env
PORT=3002
NODE_ENV=development

# Supabase → Settings → Database → Connection string (puerto 6543)
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=pon_aqui_un_secreto_de_minimo_32_caracteres

CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081
```

```bash
npm install
npm run dev        # nodemon — recarga automática
```

Verifica: `GET http://localhost:3002/health` → `{ "status": "ok" }`

---

### 3. Configurar la web

```bash
cd "Producto - DespensaDigital/web"
cp .env.example .env   # VITE_API_URL queda vacío en desarrollo local
npm install
npm run dev            # http://localhost:5173
```

---

### 4. Configurar la app móvil

```bash
cd "Producto - DespensaDigital/mobile"
cp .env.example .env
npm install
npx expo start
```

Para probar en celular físico en la misma red:

```bash
LOCAL_IP=192.168.x.x npx expo start
```

---

## Usuarios de prueba

| Correo | Contraseña | Descripción |
|--------|-----------|-------------|
| `test@despensa.cl` | `Password123` | Usuario con productos de prueba (incluye vencidos y próximos a vencer) |
| `admin@despensa.cl` | `Admin2024!` | Usuario administrador vacío |

> Los usuarios se crean automáticamente al ejecutar el `schema.sql`.

---

## API Reference

### Autenticación

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| POST | `/api/auth/register` | — | Registrar usuario |
| POST | `/api/auth/login` | — | Iniciar sesión → exchange_token |
| POST | `/api/auth/exchange` | — | Canjear token → JWT |

### Productos

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/productos` | JWT | Listar productos del usuario |
| GET | `/api/productos/metricas` | JWT | Totales, vencidos, por vencer |
| POST | `/api/productos` | JWT | Agregar producto |
| PUT | `/api/productos/:id` | JWT | Editar producto |
| DELETE | `/api/productos/:id` | JWT | Eliminar producto |

### Otros

| Método | Ruta | Auth | Descripción |
|--------|------|:----:|-------------|
| GET | `/api/patologias` | JWT | Listar patologías |
| POST | `/api/lista-compras/generar` | JWT | Generar lista automática (stock bajo) |
| GET | `/api/alertas` | JWT | Alertas de vencimiento y stock |
| GET | `/api/geo/paises` | — | Países disponibles |

---

## Documentación

La documentación del proyecto se encuentra en `Documentacion - DespensaDigital/`:

- **Diagramas** — Arquitectura del sistema y modelo entidad-relación
- **Mockup** — Diseños de la interfaz de usuario
- **plan_pruebas** — Plan de pruebas completo con evidencia
- **matriz_trazabilidad** — Trazabilidad de requisitos
- **MER_DESPENSA_FINAL** — Modelo entidad-relación final

La planificación y gestión del proyecto está en `Gestion - DespensaDigital/`:

- **CartaGantt_DespensaDigital_final_2026.xlsx** — Carta Gantt del proyecto

---

## Estado del proyecto

- [x] Análisis y diseño
- [x] Modelo Entidad-Relación
- [x] Schema PostgreSQL + datos geográficos Chile
- [x] Backend API REST (auth, productos, patologías, lista compras, alertas, geo)
- [x] Web frontend (login, registro, dashboard, inventario, patologías, lista compras, perfil)
- [x] App móvil (login, registro, flujo exchange → web)
- [x] Plan de pruebas y tests unitarios
- [x] Diagramas de arquitectura y evidencia
- [ ] Despliegue en producción
