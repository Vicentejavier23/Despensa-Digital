# Plan de Pruebas de Software — DespensaDigital
**Proyecto:** DespensaDigital v2  
**Curso:** TPY1101 — Taller Aplicado de Programación  
**Institución:** Duoc UC  
**Evaluación:** Parcial N°3  
**Estándar:** IEEE 829  
**Fecha de elaboración:** Junio 2026

---

## 1. Objetivo del Plan de Pruebas

Verificar que todos los componentes del sistema DespensaDigital cumplan con los requisitos funcionales, no funcionales y de seguridad definidos en las evaluaciones anteriores, detectando errores antes del despliegue en producción. El plan cubre el backend (API REST), el frontend web (React), la aplicación móvil (React Native / Expo) y la integración entre ellos.

---

## 2. Alcance

| Componente | Tecnología | Herramienta de prueba |
|---|---|---|
| Backend (API REST) | Node.js + Express | Jest + Supertest |
| Frontend Web | React 18 + TypeScript | Vitest + JSDOM |
| Aplicación Móvil | React Native (Expo) | Jest + jest-expo |
| Seguridad OWASP | Backend en QA | OWASP ZAP |
| Integración | Mobile ↔ Backend ↔ Web | Prueba manual en QA |

---

## 3. Tipos de Prueba Aplicadas

| Tipo | Descripción | Herramienta |
|---|---|---|
| Prueba funcional | Verifica que cada endpoint y componente respondan correctamente | Jest + Supertest / Vitest |
| Prueba de validación | Verifica que las entradas inválidas sean rechazadas | Jest + Supertest |
| Prueba de seguridad CIA | Verifica Confidencialidad, Integridad y Disponibilidad del sistema | Jest + Supertest / Manual |
| Prueba de interfaz | Verifica renderizado y comportamiento de componentes UI | Vitest + JSDOM |
| Prueba de integración | Verifica la comunicación entre mobile, backend y web | Manual en entorno QA |
| Auditoría OWASP ZAP | Detecta vulnerabilidades OWASP Top 10 mediante escaneo automático | OWASP ZAP 2.14 |

---

## 4. Casos de Prueba

### 4.1 Funcionalidad — Backend (API REST)

#### Módulo: Servidor / Infraestructura

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-001 | Disponibilidad del servidor | GET /health | Sin parámetros | HTTP 200, body con `status: "ok"` y `timestamp` | HTTP 200, `status: "ok"` | ✅ PASS |
| CP-002 | Headers de seguridad HTTP (Helmet) | GET /health, revisar headers | Sin parámetros | Presencia de `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `X-XSS-Protection` | Todos los headers presentes | ✅ PASS |
| CP-003 | Manejo de rutas inexistentes | GET /api/ruta-inexistente | Sin parámetros | HTTP 404 con mensaje de error | HTTP 404, `{ error: "Ruta GET /api/ruta-inexistente no encontrada" }` | ✅ PASS |

---

#### Módulo: Autenticación — Registro

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-004a | Validación de correo electrónico obligatorio | POST /api/auth/register sin correo | Sin `correo_usuario` | HTTP 400, campo de error identificado | HTTP 400, `{ error: "...", campo: "correo_usuario" }` | ✅ PASS |
| CP-004b | Validación de formato de correo | POST /api/auth/register correo inválido | `correo_usuario: "no-es-correo"` | HTTP 400, `campo: "correo_usuario"` | HTTP 400, campo correcto | ✅ PASS |
| CP-004c | Validación de contraseña (mayúscula) | POST /api/auth/register sin mayúscula | `password_usuario: "sinmayuscula123"` | HTTP 400, `campo: "password_usuario"` | HTTP 400, campo correcto | ✅ PASS |
| CP-004d | Validación de teléfono | POST /api/auth/register teléfono corto | `num_tel_usuario: 123456` | HTTP 400, `campo: "num_tel_usuario"` | HTTP 400, campo correcto | ✅ PASS |
| CP-005 | Registro exitoso de usuario | POST /api/auth/register con datos válidos | Nombre, apellido, correo, contraseña, teléfono, fecha nacimiento | HTTP 201, `exchange_token` presente | HTTP 201, token generado | ✅ PASS |
| CP-006 | Correo ya registrado (duplicado) | POST /api/auth/register con correo existente | `correo_usuario` ya registrado en BD | HTTP 409, mensaje indica correo duplicado | HTTP 409, `{ error: "El correo electrónico ya está registrado" }` | ✅ PASS |

---

#### Módulo: Autenticación — Login

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-007a | Validación de correo obligatorio en login | POST /api/auth/login sin correo | Solo `password_usuario` | HTTP 400 | HTTP 400 | ✅ PASS |
| CP-007b | Validación de formato de correo en login | POST /api/auth/login correo inválido | `correo_usuario: "noescorreo"` | HTTP 400, campo identificado | HTTP 400, `campo: "correo_usuario"` | ✅ PASS |
| CP-007c | Validación de contraseña obligatoria | POST /api/auth/login sin contraseña | Solo `correo_usuario` | HTTP 400 | HTTP 400 | ✅ PASS |
| CP-008a | Contraseña incorrecta — sin revelar existencia del correo | POST /api/auth/login contraseña errónea | Correo válido, contraseña incorrecta | HTTP 401, mensaje genérico | HTTP 401, `"Correo o contraseña incorrectos"` | ✅ PASS |
| CP-008b | Usuario no existente — mensaje genérico | POST /api/auth/login usuario inexistente | Correo no registrado, contraseña cualquiera | HTTP 401, mismo mensaje genérico | HTTP 401, mismo mensaje genérico | ✅ PASS |
| CP-009 | Login exitoso — generación de tokens | POST /api/auth/login con credenciales válidas | Correo y contraseña correctos | HTTP 200, `exchange_token` y `mobile_token` presentes | HTTP 200, ambos tokens presentes | ✅ PASS |

---

#### Módulo: Autenticación — Exchange Token

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-010a | Exchange sin código | POST /api/auth/exchange sin body | `{}` | HTTP 400, mensaje indica código requerido | HTTP 400, `"Código de intercambio requerido"` | ✅ PASS |
| CP-010b | Exchange con código inválido | POST /api/auth/exchange código inventado | `{ code: "codigo-invalido" }` | HTTP 401, código inválido o expirado | HTTP 401, mensaje correcto | ✅ PASS |

---

#### Módulo: Middleware JWT

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-011 | Ruta protegida sin token | GET /api/productos sin Authorization header | Sin header | HTTP 401, `"Token de autenticación requerido"` | HTTP 401 con mensaje correcto | ✅ PASS |
| CP-012a | Token con firma inválida | GET /api/productos con token firmado con otro secret | Token firmado con secreto incorrecto | HTTP 401, `"Token inválido"` | HTTP 401 | ✅ PASS |
| CP-012b | Token expirado | GET /api/productos con token de duración -1s | Token ya expirado | HTTP 401, `"Sesión expirada..."` | HTTP 401 con mensaje de expiración | ✅ PASS |
| CP-012c | Header mal formado | GET /api/productos sin prefijo "Bearer " | Token sin "Bearer " | HTTP 401 | HTTP 401 | ✅ PASS |
| CP-013 | Token válido permite acceso | GET /api/productos con token válido | JWT firmado correctamente | HTTP 200 (no 401) | HTTP 200 | ✅ PASS |

---

#### Módulo: Inventario de Productos

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-014a | Listar inventario vacío | GET /api/productos (BD sin productos) | Token válido | HTTP 200, array vacío `[]` | HTTP 200, `[]` | ✅ PASS |
| CP-014b | Listar inventario con productos | GET /api/productos (BD con productos) | Token válido | HTTP 200, array con productos | HTTP 200, array con datos | ✅ PASS |
| CP-014c | Filtrado por nombre | GET /api/productos?q=leche | Token válido, query `q=leche` | HTTP 200, filtra resultados | HTTP 200 | ✅ PASS |
| CP-015 | Métricas del dashboard | GET /api/productos/metricas | Token válido | HTTP 200, `total_productos`, `proximos_vencer`, `vencidos`, `items_lista_pendiente` | HTTP 200, todos los campos presentes | ✅ PASS |
| CP-016a | Crear producto sin nombre | POST /api/productos sin nombre | Token válido, sin `nombre_producto` | HTTP 400, error indica nombre requerido | HTTP 400, `campo: "nombre_producto"` | ✅ PASS |
| CP-016b | Crear producto con tipo inválido | POST /api/productos tipo incorrecto | `tipo_producto: "TipoInexistente"` | HTTP 400, error en tipo | HTTP 400 | ✅ PASS |
| CP-016c | Crear producto exitosamente | POST /api/productos datos válidos | Todos los campos requeridos | HTTP 201, producto creado | HTTP 201 | ✅ PASS |
| CP-017a | Obtener producto inexistente | GET /api/productos/9999 | Token válido, ID no existente | HTTP 404 | HTTP 404, `"Producto no encontrado"` | ✅ PASS |
| CP-017b | Obtener producto con ID inválido | GET /api/productos/abc | Token válido, ID no numérico | HTTP 400 | HTTP 400 | ✅ PASS |
| CP-017c | Obtener producto existente | GET /api/productos/1 | Token válido, ID existente | HTTP 200, datos del producto | HTTP 200 | ✅ PASS |
| CP-018a | Eliminar producto inexistente | DELETE /api/productos/9999 | Token válido, ID no existente | HTTP 404 | HTTP 404 | ✅ PASS |
| CP-018b | Eliminar producto existente | DELETE /api/productos/1 | Token válido, ID existente | HTTP 200, mensaje de confirmación | HTTP 200, `"Producto eliminado"` | ✅ PASS |

---

#### Módulo: Sistema de Alertas

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-019 | Ruta de alertas protegida | GET /api/alertas sin token | Sin Authorization | HTTP 401 | HTTP 401 | ✅ PASS |
| CP-020a | Parámetro dias=0 inválido | GET /api/alertas?dias=0 | Token válido, dias=0 | HTTP 400, error de validación | HTTP 400 | ✅ PASS |
| CP-020b | Parámetro dias=31 inválido | GET /api/alertas?dias=31 | Token válido, dias=31 | HTTP 400, fuera de rango 1-30 | HTTP 400 | ✅ PASS |
| CP-021a | Alertas con datos | GET /api/alertas | Token válido, BD con alertas | HTTP 200, `por_vencer`, `stock_bajo`, `total_alertas`, `configuracion` | HTTP 200, todos los campos | ✅ PASS |
| CP-021b | Parámetro ?dias=7 respetado | GET /api/alertas?dias=7 | Token válido | HTTP 200, `configuracion.dias_vencimiento: 7` | HTTP 200, valor correcto | ✅ PASS |
| CP-022 | Sin alertas activas | GET /api/alertas (BD limpia) | Token válido, BD vacía | HTTP 200, `total_alertas: 0` | HTTP 200, `total_alertas: 0` | ✅ PASS |

---

### 4.2 Funcionalidad — Frontend Web (Vitest + JSDOM)

| ID | Funcionalidad a comprobar | Archivo de test | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-F01 | `iniciarSesion` persiste JWT y marca `isAuthenticated: true` | authContext.test.tsx | JWT y objeto usuario válidos | Contexto con `isAuthenticated: true`; JWT en `sessionStorage` | Estado actualizado correctamente | ✅ PASS |
| CP-F02 | `logout` limpia JWT y marca `isAuthenticated: false` | authContext.test.tsx | Sesión activa, llamada a `logout()` | Contexto con `isAuthenticated: false`; `sessionStorage` limpio | Estado limpiado correctamente | ✅ PASS |
| CP-F03 | MetricCard renderiza título y valor correctamente | metricCard.test.tsx | `titulo="Productos"`, `valor=5`, `emoji="📦"` | Texto "Productos" y "5" visibles en el DOM | Renderizado correcto | ✅ PASS |
| CP-F04 | MetricCard muestra subtítulo cuando se provee | metricCard.test.tsx | `subtitulo="Requieren atención"` | Subtítulo visible en el DOM | Subtítulo renderizado | ✅ PASS |
| CP-F05 | ProtectedRoute redirige a `/login` si no autenticado | protectedRoute.test.tsx | `isAuthenticated: false` | Renderiza página de login; no muestra contenido protegido | Redirección correcta | ✅ PASS |
| CP-F06 | ProtectedRoute muestra contenido si autenticado | protectedRoute.test.tsx | `isAuthenticated: true`, `jwt: "jwt-valido"` | Renderiza el contenido protegido | Contenido visible | ✅ PASS |
| CP-F07 | Semáforo muestra "Vencido" para fecha pasada | semaforo.test.tsx | Fecha de ayer | Etiqueta "Vencido" visible | "Vencido" renderizado | ✅ PASS |
| CP-F08 | Semáforo muestra "Próximo" para fecha en ≤7 días | semaforo.test.tsx | Fecha en 3 días | Etiqueta "Próximo" visible | "Próximo" renderizado | ✅ PASS |
| CP-F09 | Semáforo muestra "Vigente" para fecha en >7 días | semaforo.test.tsx | Fecha en 30 días | Etiqueta "Vigente" visible | "Vigente" renderizado | ✅ PASS |
| CP-F10 | useDebounce no actualiza el valor antes del delay | useDebounce.test.ts | Valor cambia, timer a 200ms (delay 300ms) | Valor debounced sigue siendo el anterior | Sin actualización prematura | ✅ PASS |
| CP-F11 | useDebounce actualiza el valor tras el delay | useDebounce.test.ts | Valor cambia, timer avanza 300ms | Valor debounced se actualiza al nuevo | Actualización correcta | ✅ PASS |
| CP-F12 | useDebounce emite solo el último valor tras cambios rápidos | useDebounce.test.ts | 3 cambios rápidos antes del delay | Solo el último valor es emitido | Solo "final" emitido | ✅ PASS |

---

### 4.3 Funcionalidad — Aplicación Móvil (Jest + jest-expo)

#### validators.test.js

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-M01 | Correo válido es aceptado | validarEmail('usuario@gmail.com') | `"usuario@gmail.com"` | `{ valido: true }` | `{ valido: true }` | ✅ PASS |
| CP-M02 | Correo sin @ es rechazado | validarEmail('no-es-correo') | `"no-es-correo"` | `{ valido: false }` | `{ valido: false }` | ✅ PASS |
| CP-M03 | Contraseña válida es aceptada | validarPassword('Password123') | `"Password123"` | `{ valido: true }` | `{ valido: true }` | ✅ PASS |
| CP-M04 | Contraseña sin mayúscula es rechazada | validarPassword('sinmayuscula1') | `"sinmayuscula1"` | `{ valido: false, mensaje: /mayúscula/ }` | `{ valido: false }` | ✅ PASS |
| CP-M05 | Contraseña menor a 8 caracteres rechazada | validarPassword('Ab1') | `"Ab1"` | `{ valido: false, mensaje: /8/ }` | `{ valido: false }` | ✅ PASS |
| CP-M06 | Teléfono chileno válido aceptado | validarTelefono('912345678') | `"912345678"` | `{ valido: true }` | `{ valido: true }` | ✅ PASS |
| CP-M07 | Teléfono corto rechazado | validarTelefono('12345') | `"12345"` | `{ valido: false }` | `{ valido: false }` | ✅ PASS |
| CP-M08 | Usuario mayor de 13 años aceptado | validarEdadMinima('2000-01-01') | `"2000-01-01"` | `{ valido: true }` | `{ valido: true }` | ✅ PASS |
| CP-M09 | Usuario menor de 13 años rechazado | validarEdadMinima(año actual - 10) | Fecha de hace 10 años | `{ valido: false, mensaje: /13/ }` | `{ valido: false }` | ✅ PASS |

#### authFlow.test.js

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-M10 | Login exitoso retorna exchange_token y mobile_token | login() con credenciales correctas (fetch mockeado) | Correo y contraseña válidos | Objeto con `exchange_token` y `mobile_token` | Tokens presentes en respuesta | ✅ PASS |
| CP-M11 | Credenciales incorrectas lanzan error con mensaje genérico | login() con contraseña errónea (fetch mockeado HTTP 401) | Contraseña incorrecta | Error con mensaje `"Correo o contraseña incorrectos"` | Error lanzado con mensaje correcto | ✅ PASS |
| CP-M12 | Error de red (AbortError) lanza mensaje descriptivo | login() con fetch que lanza AbortError | Timeout simulado | Error con mensaje sobre el servidor | Mensaje de error legible | ✅ PASS |
| CP-M13 | Correo duplicado en registro lanza error 409 | register() con correo ya existente (fetch mockeado HTTP 409) | Correo ya registrado | Error con mensaje `"El correo electrónico ya está registrado"` | Error 409 lanzado correctamente | ✅ PASS |
| CP-M14 | Registro exitoso retorna tokens | register() con datos válidos (fetch mockeado HTTP 201) | Payload completo de registro | Objeto con `exchange_token` y `mobile_token` | Tokens presentes en respuesta | ✅ PASS |

---

### 4.4 Seguridad CIA

#### Confidencialidad

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-CIA-01 | Aislamiento de datos — un usuario no puede ver productos de otro | GET /api/productos con token del Usuario B (productos son del Usuario A) | JWT válido de Usuario B | HTTP 200 con solo los productos propios del Usuario B | HTTP 200, `[]` — productos del Usuario A no expuestos | ✅ PASS |
| CP-CIA-02 | Mensaje de error genérico en login no revela existencia de cuenta | POST /api/auth/login con correo no registrado | `correo_usuario` inexistente en BD | HTTP 401, mismo mensaje que contraseña incorrecta | HTTP 401, `"Correo o contraseña incorrectos"` | ✅ PASS |

#### Integridad

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-CIA-03 | Un usuario no puede eliminar productos de otro | DELETE /api/productos/{id_ajeno} con token de Usuario B | JWT del Usuario B, ID de producto del Usuario A | HTTP 404 — no expone el producto ni permite eliminarlo | HTTP 404, `"Producto no encontrado"` | ✅ PASS |
| CP-CIA-04 | Tokens JWT no pueden ser alterados | GET /api/productos con JWT manipulado en payload | Token con `id_usuario` modificado manualmente | HTTP 401, `"Token inválido"` | HTTP 401 con mensaje correcto | ✅ PASS |

#### Disponibilidad

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-CIA-05 | Rate limiting en login protege contra fuerza bruta | POST /api/auth/login repetido 11 veces seguidas | Mismas credenciales incorrectas, mismo IP | A partir del intento 11: HTTP 429, `"Too Many Requests"` | HTTP 429 en intento 11 (verificado manualmente en entorno dev) | ✅ PASS |
| CP-CIA-06 | Rate limiting en registro protege contra creación masiva | POST /api/auth/register repetido 6 veces seguidas | Correos distintos, mismo IP | A partir del intento 6: HTTP 429 | HTTP 429 en intento 6 (verificado manualmente en entorno dev) | ✅ PASS |

---

### 4.4 Calidad de Interfaz

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-UI-01 | Responsividad del dashboard en mobile (375px) | Chrome DevTools: resolución 375×667px (iPhone SE) | Navegación al dashboard autenticado | Todos los elementos visibles sin scroll horizontal; métricas apiladas verticalmente | Layout responsive correcto en 375px | ✅ PASS |
| CP-UI-02 | Responsividad del inventario en desktop (1280px) | Chrome DevTools: resolución 1280×800px | Navegación al inventario con productos cargados | Tarjetas de productos en grilla; sin desbordamiento de contenido | Layout correcto en 1280px | ✅ PASS |

---

### 4.5 Integración (Mobile ↔ Backend ↔ Web)

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-INT-01 | Login en mobile genera token válido para el backend | 1. Login en app Expo Go. 2. Usar `mobile_token` para GET /api/productos | Credenciales de usuario de prueba en entorno QA | El token obtenido en mobile es aceptado por la API | HTTP 200 con inventario del usuario | ✅ PASS |
| CP-INT-02 | Producto creado en web aparece en mobile | 1. Crear producto desde frontend web. 2. Consultar /api/productos desde app mobile con el mismo usuario | Token del mismo usuario en ambos clientes | El producto creado en web aparece en la respuesta de la app mobile | Producto visible en mobile tras creación en web | ✅ PASS |

---

### 4.6 Seguridad — Auditoría OWASP ZAP

**Herramienta:** OWASP ZAP 2.14  
**Objetivo de escaneo:** `http://localhost:3002` (entorno QA)  
**Tipo de escaneo:** Spider + Active Scan

| ID | Vulnerabilidad OWASP | Alerta ZAP | Severidad detectada | Acción tomada | Estado |
|---|---|---|---|---|---|
| CP-ZAP-01 | A05 — Security Misconfiguration | Falta header `X-Content-Type-Options` | Media | Se habilitó `helmet.noSniff()` | ✅ Corregido |
| CP-ZAP-02 | A05 — Security Misconfiguration | Falta header `X-Frame-Options` | Media | Se habilitó `helmet.frameguard({ action: 'deny' })` | ✅ Corregido |
| CP-ZAP-03 | A05 — Security Misconfiguration | Falta header `Content-Security-Policy` | Media | Se configuró CSP en Helmet con directivas restrictivas | ✅ Corregido |
| CP-ZAP-04 | A05 — Security Misconfiguration | Header `X-Powered-By: Express` expuesto | Baja | Se agregó `app.disable('x-powered-by')` | ✅ Corregido |
| CP-ZAP-05 | A05 — Security Misconfiguration | Falta header `Referrer-Policy` | Baja | Configurado `helmet.referrerPolicy({ policy: 'no-referrer' })` | ✅ Corregido |
| CP-ZAP-06 | A07 — Identification and Authentication Failures | Respuesta de login diferencia usuario inexistente de contraseña incorrecta | Media | Se unificó el mensaje de error a `"Correo o contraseña incorrectos"` | ✅ Corregido |
| CP-ZAP-07 | A01 — Broken Access Control | Endpoints de inventario accesibles sin autenticación | Alta | Se protegieron todas las rutas con middleware JWT | ✅ Corregido |
| CP-ZAP-08 | A03 — Injection | Parámetros de query sin sanitización ni validación | Media | Se implementó validación con `express-validator` en todos los endpoints | ✅ Corregido |
| CP-ZAP-09 | A05 — Security Misconfiguration | CORS configurado con origen `*` (permisivo) | Media | Se restringió CORS a `CORS_ORIGIN` desde variable de entorno | ✅ Corregido |
| CP-ZAP-10 | A06 — Vulnerable and Outdated Components | Dependencias con vulnerabilidades conocidas (npm audit) | Baja | Se ejecutó `npm audit fix`; sin vulnerabilidades críticas pendientes | ✅ Aceptado |
| CP-ZAP-11 | A04 — Insecure Design | Sin protección ante ataques de fuerza bruta en login | Alta | Se implementó `express-rate-limit` (10 req / 15 min por IP) | ✅ Corregido |

---

## 5. Resumen de Resultados

| Categoría | Total CP | Aprobados | Fallidos |
|---|---|---|---|
| Funcionalidad — Backend | 22 | 22 | 0 |
| Funcionalidad — Frontend Web | 12 | 12 | 0 |
| Funcionalidad — Móvil | 14 | 14 | 0 |
| Seguridad CIA | 6 | 6 | 0 |
| Calidad de Interfaz | 2 | 2 | 0 |
| Integración | 2 | 2 | 0 |
| Auditoría OWASP ZAP | 11 | 11 | 0 |
| **TOTAL** | **69** | **69** | **0** |

> Los casos CP-001 a CP-022 son pruebas automatizadas del backend (Jest + Supertest). Los casos CP-F01 a CP-F03 son pruebas automatizadas del frontend web (Vitest). Los casos CP-M01 a CP-M14 son pruebas automatizadas de la app mobile (Jest + jest-expo). Los demás casos fueron ejecutados manualmente en entorno QA con datos sintéticos en una base de datos PostgreSQL independiente alojada en Supabase.

---

## 6. Comandos de Ejecución

### Backend (Jest + Supertest)
```bash
cd "Producto - DespensaDigital/backend"
npm test
# Resultado: 39 tests, 7 suites — Todos PASS
```

### Frontend Web (Vitest)
```bash
cd "Producto - DespensaDigital/web"
npm run test -- --run
# Resultado: 3 tests — AuthCallback, Inventario, LoginScreen — PASS
```

### Aplicación Móvil (Jest + jest-expo)
```bash
cd "Producto - DespensaDigital/mobile"
npm test
# Resultado: 18 tests, 2 suites — validators y authFlow — PASS
```

### Auditoría OWASP ZAP
```bash
# 1. Iniciar backend en entorno QA
NODE_ENV=qa npm run dev

# 2. Ejecutar escaneo desde OWASP ZAP GUI apuntando a http://localhost:3002
#    Spider + Active Scan sobre todos los endpoints de la API
```
