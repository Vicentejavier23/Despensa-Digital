# 🥗 DespensaDigital

> *"Que nada se venza, que todo rinda"*

Aplicación para gestionar el inventario del hogar, con alertas de vencimiento, lista de compras automática y control de patologías alimentarias.

**Asignatura:** Taller de Programación — Duoc UC San Joaquín  
**Equipo:** Vicente Bueno · Daniel Lagos · Diego Olea  
**Profesor:** Jorge Niochet

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
Producto - DespensaDigital/
├── backend/          → API REST Express (puerto 3001)
├── web/              → App React/Vite (puerto 5173)
├── mobile/           → App Expo React Native
└── supabase/         → Schema SQL + migraciones
```

---

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta `supabase/schema.sql` completo
3. Copia la **Connection string** (Transaction Mode, puerto 6543) desde:  
   `Settings → Database → Connection string`

---

## 2. Configurar el backend

```bash
cd "Producto - DespensaDigital/backend"
cp .env.example .env
```

Edita `.env`:

```env
PORT=3001
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

Verifica: `GET http://localhost:3001/health` → `{ "status": "ok" }`

---

## 3. Configurar la web

```bash
cd "Producto - DespensaDigital/web"
cp .env.example .env   # VITE_API_URL queda vacío en desarrollo local
npm install
npm run dev            # http://localhost:5173
```

---

## 4. Configurar la app móvil (opcional)

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

## Endpoints principales

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | Registrar usuario |
| POST | `/api/auth/login` | ❌ | Iniciar sesión → exchange_token |
| POST | `/api/auth/exchange` | ❌ | Canjear token → JWT |
| GET | `/api/productos` | ✅ | Listar productos del usuario |
| GET | `/api/productos/metricas` | ✅ | Totales, vencidos, por vencer |
| POST | `/api/productos` | ✅ | Agregar producto |
| PUT | `/api/productos/:id` | ✅ | Editar producto |
| DELETE | `/api/productos/:id` | ✅ | Eliminar producto |
| GET | `/api/patologias` | ✅ | Listar patologías |
| POST | `/api/lista-compras/generar` | ✅ | Generar lista automática (stock bajo) |
| GET | `/api/alertas` | ✅ | Alertas de vencimiento y stock |
| GET | `/api/geo/paises` | ❌ | Países disponibles |

---

## Estado del proyecto

- [x] Análisis y diseño
- [x] Modelo Entidad-Relación
- [x] Schema PostgreSQL + datos geográficos Chile
- [x] Backend API REST (auth, productos, patologías, lista compras, alertas, geo)
- [x] Web frontend (login, registro, dashboard, inventario, patologías, lista compras, perfil)
- [x] App móvil (login, registro, flujo exchange → web)
- [ ] Pruebas automatizadas
- [ ] Despliegue en producción
