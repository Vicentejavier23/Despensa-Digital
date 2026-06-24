# Como ejecutar el proyecto

Esta guia es para cualquier integrante del equipo (o el profesor) que clone el repositorio y quiera correr el proyecto en su computador.

---

## Lo que necesitas pedir al equipo antes de empezar

El proyecto se conecta a una base de datos en la nube (Supabase). Sin las credenciales no podras levantar el backend. Pide al equipo los siguientes datos:

| Dato | Para que sirve |
|---|---|
| `DATABASE_URL` | Conectarse a la base de datos PostgreSQL en Supabase |
| `JWT_SECRET` | Firmar y verificar los tokens de sesion |

Con esos dos valores podras completar el archivo `.env` del backend que se explica mas abajo.

---

## Requisitos previos

Antes de correr cualquier cosa asegurate de tener instalado:

- Node.js 18 o superior — [nodejs.org](https://nodejs.org)
- npm (viene incluido con Node.js)
- Expo Go en tu celular — solo si vas a probar la app movil

Verifica que tengas Node instalado correctamente:

```bash
node -v
npm -v
```

---

## Orden de arranque

Debes levantar los servicios en este orden:

```
1. Backend  (obligatorio, el resto depende de el)
2. Web      (para usar la aplicacion en el navegador)
3. Mobile   (opcional, solo si vas a probar en celular)
```

---

## 1. Backend

```bash
cd "Producto - DespensaDigital/backend"
npm install
cp .env.example .env
```

Abre el archivo `.env` que acabas de crear y reemplaza los valores:

```env
DATABASE_URL=<pedir al equipo>
JWT_SECRET=<pedir al equipo>
```

El resto de los valores del `.env` puedes dejarlos como estan para desarrollo local.

Levanta el servidor:

```bash
npm run dev
```

Si todo esta bien veras en la consola algo como:

```
Servidor corriendo en puerto 3001
Base de datos conectada
```

Puedes verificarlo abriendo en el navegador: `http://localhost:3001/health`
Debe responder: `{ "status": "ok" }`

> El backend debe seguir corriendo en esta terminal. No la cierres.

---

## 2. Web

Abre una terminal nueva y ejecuta:

```bash
cd "Producto - DespensaDigital/web"
npm install
cp .env.example .env
```

El archivo `.env` de la web puedes dejarlo con `VITE_API_URL` vacio para desarrollo local, el proxy de Vite se encarga de redirigir las llamadas al backend automaticamente.

Levanta la aplicacion:

```bash
npm run dev
```

Abre el navegador en: `http://localhost:5173`

---

## 3. Mobile (opcional)

Si quieres probar la app en tu celular, abre una tercera terminal:

```bash
cd "Producto - DespensaDigital/mobile"
npm install
cp .env.example .env
```

Necesitas saber la IP de tu computador en la red local. Ejecuta en otra terminal:

- Windows: `ipconfig` — busca "Direccion IPv4"
- Mac/Linux: `ifconfig` — busca la IP de tu interfaz de red

Edita el `.env` del mobile y reemplaza `TU_IP_AQUI` con esa IP:

```env
API_BASE_URL=http://192.168.X.X:3001
WEB_CALLBACK_URL=http://192.168.X.X:5173
```

> Usa la IP real de tu PC, nunca escribas "localhost" ahi porque el celular no puede resolverlo.

Levanta Expo:

```bash
npx expo start
```

Escanea el codigo QR con la app Expo Go desde tu celular.

---

## Usuarios de prueba

Una vez que el proyecto este corriendo puedes iniciar sesion con estos usuarios que ya existen en la base de datos:

| Correo | Contrasena | Descripcion |
|---|---|---|
| `test@despensa.cl` | `Password123` | Usuario con productos de prueba |
| `admin@despensa.cl` | `Admin2024!` | Usuario administrador |

---

## Problemas comunes

**El backend no conecta a la base de datos**
Revisa que el `DATABASE_URL` en `backend/.env` sea exactamente el que te paso el equipo, sin espacios ni caracteres extra.

**La web muestra error de conexion**
Asegurate de que el backend este corriendo en el puerto 3001 antes de abrir la web.

**La app movil no carga**
Verifica que el celular y el computador esten conectados a la misma red Wi-Fi, y que la IP en `mobile/.env` sea la correcta.

**Puerto 3001 ya en uso**
Otro proceso esta usando ese puerto. En Windows puedes cerrarlo con:
```bash
netstat -ano | findstr :3001
taskkill /PID <numero_pid> /F
```
