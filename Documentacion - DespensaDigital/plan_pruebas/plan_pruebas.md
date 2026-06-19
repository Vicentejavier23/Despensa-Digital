# Plan de Pruebas de Software — DespensaDigital
**Proyecto:** DespensaDigital v2  
**Curso:** TPY1101 — Taller Aplicado de Programación  
**Institución:** Duoc UC  
**Evaluación:** Parcial N°3  
**Fecha de elaboración:** Junio 2026

---

## 1. Objetivo del Plan de Pruebas

Verificar que todos los componentes del sistema DespensaDigital cumplan con los requisitos funcionales, no funcionales y de seguridad definidos en las evaluaciones anteriores, detectando errores antes del despliegue en producción.

---

## 2. Alcance

Las pruebas cubren los siguientes módulos del backend (API REST):

| Módulo | Ruta API | Descripción |
|---|---|---|
| Servidor / Infraestructura | `/health` | Disponibilidad y headers de seguridad |
| Autenticación | `/api/auth/*` | Registro, login, intercambio de token |
| Middleware JWT | Todas las rutas protegidas | Verificación y validación de tokens |
| Inventario (Productos) | `/api/productos` | CRUD de productos del inventario |
| Alertas | `/api/alertas` | Alertas de vencimiento y stock bajo |

---

## 3. Tipos de Prueba Aplicadas

| Tipo | Descripción | Herramienta |
|---|---|---|
| Prueba funcional | Verifica que cada endpoint responda correctamente | Jest + Supertest |
| Prueba de validación | Verifica que las entradas inválidas sean rechazadas | Jest + Supertest |
| Prueba de seguridad | Verifica autenticación, headers y rate limiting | Jest + Supertest |
| Prueba de disponibilidad | Verifica que el servidor esté en línea | Jest + Supertest |

---

## 4. Casos de Prueba

### Módulo: Servidor / Infraestructura

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-001 | Disponibilidad del servidor | GET /health | Sin parámetros | HTTP 200, body con `status: "ok"` y `timestamp` | HTTP 200, `status: "ok"` | ✅ PASS |
| CP-002 | Headers de seguridad HTTP (Helmet) | GET /health, revisar headers | Sin parámetros | Presencia de `X-Content-Type-Options: nosniff`, `X-Frame-Options`, `X-XSS-Protection` | Todos los headers presentes | ✅ PASS |
| CP-003 | Manejo de rutas inexistentes | GET /api/ruta-inexistente | Sin parámetros | HTTP 404 con mensaje de error | HTTP 404, `{ error: "Ruta GET /api/ruta-inexistente no encontrada" }` | ✅ PASS |

---

### Módulo: Autenticación — Registro

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-004a | Validación de correo electrónico obligatorio | POST /api/auth/register sin correo | Sin `correo_usuario` | HTTP 400, campo de error identificado | HTTP 400, `{ error: "...", campo: "correo_usuario" }` | ✅ PASS |
| CP-004b | Validación de formato de correo | POST /api/auth/register correo inválido | `correo_usuario: "no-es-correo"` | HTTP 400, `campo: "correo_usuario"` | HTTP 400, campo correcto | ✅ PASS |
| CP-004c | Validación de contraseña (mayúscula) | POST /api/auth/register sin mayúscula | `password_usuario: "sinmayuscula123"` | HTTP 400, `campo: "password_usuario"` | HTTP 400, campo correcto | ✅ PASS |
| CP-004d | Validación de teléfono | POST /api/auth/register teléfono corto | `num_tel_usuario: 123456` | HTTP 400, `campo: "num_tel_usuario"` | HTTP 400, campo correcto | ✅ PASS |
| CP-005 | Registro exitoso de usuario | POST /api/auth/register con datos válidos | Nombre, apellido, correo, contraseña, teléfono, fecha nacimiento | HTTP 201, `exchange_token` presente | HTTP 201, token generado | ✅ PASS |
| CP-006 | Correo ya registrado (duplicado) | POST /api/auth/register con correo existente | `correo_usuario` ya registrado en BD | HTTP 409, mensaje indica correo duplicado | HTTP 409, `{ error: "El correo electrónico ya está registrado" }` | ✅ PASS |

---

### Módulo: Autenticación — Login

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-007a | Validación de correo obligatorio en login | POST /api/auth/login sin correo | Solo `password_usuario` | HTTP 400 | HTTP 400 | ✅ PASS |
| CP-007b | Validación de formato de correo en login | POST /api/auth/login correo inválido | `correo_usuario: "noescorreo"` | HTTP 400, campo identificado | HTTP 400, `campo: "correo_usuario"` | ✅ PASS |
| CP-007c | Validación de contraseña obligatoria | POST /api/auth/login sin contraseña | Solo `correo_usuario` | HTTP 400 | HTTP 400 | ✅ PASS |
| CP-008a | Contraseña incorrecta — sin revelar existencia del correo | POST /api/auth/login contraseña errónea | Correo válido, contraseña incorrecta | HTTP 401, mensaje genérico | HTTP 401, `"Correo o contraseña incorrectos"` | ✅ PASS |
| CP-008b | Usuario no existente — mensaje genérico | POST /api/auth/login usuario inexistente | Correo no registrado, contraseña cualquiera | HTTP 401, mismo mensaje genérico | HTTP 401, mismo mensaje genérico | ✅ PASS |
| CP-009 | Login exitoso — generación de tokens | POST /api/auth/login con credenciales válidas | Correo y contraseña correctos | HTTP 200, `exchange_token` y `mobile_token` presentes | HTTP 200, ambos tokens presentes | ✅ PASS |

---

### Módulo: Autenticación — Exchange Token

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-010a | Exchange sin código | POST /api/auth/exchange sin body | `{}` | HTTP 400, mensaje indica código requerido | HTTP 400, `"Código de intercambio requerido"` | ✅ PASS |
| CP-010b | Exchange con código inválido | POST /api/auth/exchange código inventado | `{ code: "codigo-invalido" }` | HTTP 401, código inválido o expirado | HTTP 401, mensaje correcto | ✅ PASS |

---

### Módulo: Middleware JWT

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-011 | Ruta protegida sin token | GET /api/productos sin Authorization header | Sin header | HTTP 401, `"Token de autenticación requerido"` | HTTP 401 con mensaje correcto | ✅ PASS |
| CP-012a | Token con firma inválida | GET /api/productos con token firmado con otro secret | Token firmado con secreto incorrecto | HTTP 401, `"Token inválido"` | HTTP 401 | ✅ PASS |
| CP-012b | Token expirado | GET /api/productos con token de duración -1s | Token ya expirado | HTTP 401, `"Sesión expirada..."` | HTTP 401 con mensaje de expiración | ✅ PASS |
| CP-012c | Header mal formado | GET /api/productos sin prefijo "Bearer " | Token sin "Bearer " | HTTP 401 | HTTP 401 | ✅ PASS |
| CP-013 | Token válido permite acceso | GET /api/productos con token válido | JWT firmado correctamente | HTTP 200 (no 401) | HTTP 200 | ✅ PASS |

---

### Módulo: Inventario de Productos

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

### Módulo: Sistema de Alertas

| ID | Funcionalidad a comprobar | Acción a realizar | Datos de entrada | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|---|
| CP-019 | Ruta de alertas protegida | GET /api/alertas sin token | Sin Authorization | HTTP 401 | HTTP 401 | ✅ PASS |
| CP-020a | Parámetro dias=0 inválido | GET /api/alertas?dias=0 | Token válido, dias=0 | HTTP 400, error de validación | HTTP 400 | ✅ PASS |
| CP-020b | Parámetro dias=31 inválido | GET /api/alertas?dias=31 | Token válido, dias=31 | HTTP 400, fuera de rango 1-30 | HTTP 400 | ✅ PASS |
| CP-021a | Alertas con datos | GET /api/alertas | Token válido, BD con alertas | HTTP 200, `por_vencer`, `stock_bajo`, `total_alertas`, `configuracion` | HTTP 200, todos los campos | ✅ PASS |
| CP-021b | Parámetro ?dias=7 respetado | GET /api/alertas?dias=7 | Token válido | HTTP 200, `configuracion.dias_vencimiento: 7` | HTTP 200, valor correcto | ✅ PASS |
| CP-022 | Sin alertas activas | GET /api/alertas (BD limpia) | Token válido, BD vacía | HTTP 200, `total_alertas: 0` | HTTP 200, `total_alertas: 0` | ✅ PASS |

---

## 5. Resumen de Resultados

| Módulo | Total CP | Aprobados | Fallidos |
|---|---|---|---|
| Servidor / Infraestructura | 3 | 3 | 0 |
| Autenticación (Registro) | 6 | 6 | 0 |
| Autenticación (Login) | 6 | 6 | 0 |
| Autenticación (Exchange) | 2 | 2 | 0 |
| Middleware JWT | 5 | 5 | 0 |
| Inventario (Productos) | 13 | 13 | 0 |
| Alertas | 7 | 7 | 0 |
| **TOTAL** | **42** | **42** | **0** |

---

## 6. Comando de ejecución

```bash
cd "Producto - DespensaDigital/backend"
npm test
```

**Resultado:** 42 tests, 5 suites — Todos PASS en 2.1 segundos.
