# Matriz de Trazabilidad — DespensaDigital
**Proyecto:** DespensaDigital v2  
**Curso:** TPY1101 — Taller Aplicado de Programación  
**Institución:** Duoc UC  
**Evaluación:** Parcial N°3  

---

## ¿Qué es la Matriz de Trazabilidad?

La Matriz de Trazabilidad vincula cada **requisito del sistema** con los **casos de prueba** que lo verifican. Permite demostrar que toda funcionalidad solicitada está cubierta por pruebas automatizadas.

---

## Requisitos del Sistema

Los requisitos se derivan de las evaluaciones parciales (EP1 y EP2) y de los criterios solicitados en EP3.

| ID Requisito | Descripción del Requisito | Tipo | Origen |
|---|---|---|---|
| RF-001 | El sistema debe estar disponible y responder a peticiones de salud | Funcional | EP1 — Infraestructura |
| RF-002 | El sistema debe aplicar headers de seguridad HTTP | No Funcional | EP3 — Mejoras de seguridad |
| RF-003 | El sistema debe manejar rutas no encontradas con mensaje claro | Funcional | EP1 |
| RF-004 | El usuario debe poder registrarse con: nombre, apellido, correo, contraseña, teléfono, fecha nacimiento | Funcional | EP1 |
| RF-005 | El sistema debe validar el formato del correo electrónico | Funcional | EP1 |
| RF-006 | La contraseña debe tener al menos una mayúscula | Funcional | EP1 |
| RF-007 | El teléfono debe estar en formato chileno válido (9 dígitos, prefijo 9) | Funcional | EP1 |
| RF-008 | No deben registrarse dos cuentas con el mismo correo | Funcional | EP1 |
| RF-009 | El usuario debe poder iniciar sesión con correo y contraseña | Funcional | EP1 |
| RF-010 | El sistema no debe revelar si un correo existe al mostrar error de login | No Funcional | OWASP A07 — Seguridad |
| RF-011 | Un login exitoso debe generar un `exchange_token` y un `mobile_token` | Funcional | EP2 — Flujo de autenticación |
| RF-012 | El `exchange_token` debe poder canjearse por un JWT de sesión web | Funcional | EP2 |
| RF-013 | Las rutas protegidas deben requerir JWT válido en header Authorization | Funcional | EP1 |
| RF-014 | Los JWT expirados deben ser rechazados con mensaje de sesión expirada | Funcional | EP1 |
| RF-015 | Los JWT con firma inválida deben ser rechazados | Funcional | EP1 |
| RF-016 | El usuario debe poder listar su inventario de productos | Funcional | EP2 |
| RF-017 | El inventario debe poder filtrarse por nombre | Funcional | EP2 |
| RF-018 | El sistema debe mostrar métricas del inventario (total, próximos a vencer, vencidos) | Funcional | EP2 |
| RF-019 | El usuario debe poder agregar productos al inventario | Funcional | EP2 |
| RF-020 | El tipo de producto debe ser de una lista válida | Funcional | EP2 |
| RF-021 | El usuario debe poder obtener un producto por su ID | Funcional | EP2 |
| RF-022 | El usuario debe poder eliminar un producto de su inventario | Funcional | EP2 |
| RF-023 | El sistema debe alertar sobre productos próximos a vencer | Funcional | EP2 |
| RF-024 | El sistema debe alertar sobre productos con stock bajo | Funcional | EP2 |
| RF-025 | El parámetro `?dias` de alertas debe estar en el rango 1-30 | Funcional | EP2 |
| RF-026 | El sistema debe proteger contra ataques de fuerza bruta en login | No Funcional | EP3 — Seguridad |
| RF-027 | El sistema debe proteger contra creación masiva de cuentas | No Funcional | EP3 — Seguridad |

---

## Matriz de Trazabilidad

| ID Requisito | Descripción resumida | CP que lo cubre | Archivo de prueba | Estado |
|---|---|---|---|---|
| RF-001 | Disponibilidad del servidor | CP-001 | health.test.js | ✅ Cubierto |
| RF-002 | Headers de seguridad HTTP | CP-002 | health.test.js | ✅ Cubierto |
| RF-003 | Ruta inexistente → 404 | CP-003 | health.test.js | ✅ Cubierto |
| RF-004 | Registro de usuario | CP-005 | auth.test.js | ✅ Cubierto |
| RF-005 | Validación formato correo | CP-004b | auth.test.js | ✅ Cubierto |
| RF-006 | Contraseña con mayúscula | CP-004c | auth.test.js | ✅ Cubierto |
| RF-007 | Teléfono formato válido | CP-004d | auth.test.js | ✅ Cubierto |
| RF-008 | Correo duplicado → 409 | CP-006 | auth.test.js | ✅ Cubierto |
| RF-009 | Login con correo y contraseña | CP-009 | auth.test.js | ✅ Cubierto |
| RF-010 | Mensaje genérico en error de login | CP-008a, CP-008b | auth.test.js | ✅ Cubierto |
| RF-011 | Login exitoso → exchange_token + mobile_token | CP-009 | auth.test.js | ✅ Cubierto |
| RF-012 | Exchange token → JWT de sesión | CP-010b | auth.test.js | ✅ Cubierto |
| RF-013 | Ruta protegida requiere JWT | CP-011 | middleware.test.js | ✅ Cubierto |
| RF-014 | JWT expirado → 401 | CP-012b | middleware.test.js | ✅ Cubierto |
| RF-015 | JWT firma inválida → 401 | CP-012a | middleware.test.js | ✅ Cubierto |
| RF-016 | Listar inventario | CP-014a, CP-014b | productos.test.js | ✅ Cubierto |
| RF-017 | Filtrar inventario por nombre | CP-014c | productos.test.js | ✅ Cubierto |
| RF-018 | Métricas del inventario | CP-015 | productos.test.js | ✅ Cubierto |
| RF-019 | Agregar producto | CP-016c | productos.test.js | ✅ Cubierto |
| RF-020 | Tipo de producto válido | CP-016b | productos.test.js | ✅ Cubierto |
| RF-021 | Obtener producto por ID | CP-017c | productos.test.js | ✅ Cubierto |
| RF-022 | Eliminar producto | CP-018b | productos.test.js | ✅ Cubierto |
| RF-023 | Alerta vencimiento | CP-021a | alertas.test.js | ✅ Cubierto |
| RF-024 | Alerta stock bajo | CP-021a | alertas.test.js | ✅ Cubierto |
| RF-025 | Parámetro dias en rango 1-30 | CP-020a, CP-020b | alertas.test.js | ✅ Cubierto |
| RF-026 | Rate limit en login | CP-008 (rate limiter desactivado en test env, funciona en producción) | — | ✅ Implementado |
| RF-027 | Rate limit en registro | CP-006 (rate limiter desactivado en test env, funciona en producción) | — | ✅ Implementado |

---

## Cobertura General

| Métrica | Valor |
|---|---|
| Total de requisitos | 27 |
| Requisitos cubiertos por pruebas automatizadas | 25 |
| Requisitos cubiertos por implementación (sin prueba directa) | 2 (RF-026, RF-027) |
| Total de casos de prueba (CP) | 42 |
| Casos de prueba aprobados | 42 |
| Porcentaje de requisitos cubiertos | 100% |

---

## Notas sobre RF-026 y RF-027

Los rate limiters (protección contra fuerza bruta) están implementados en `auth.routes.js` usando `express-rate-limit`, pero se **desactivan intencionalmente** cuando `NODE_ENV === 'test'`. Esto evita que las pruebas interfieran entre sí al compartir el mismo conteo de peticiones en memoria.

Para verificar el comportamiento de rate limiting manualmente:

```bash
# Iniciar el servidor en modo desarrollo
npm run dev

# Simular múltiples intentos de login (Linux/Mac)
for i in {1..11}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"correo_usuario":"test@test.cl","password_usuario":"test"}' \
    -w "\nHTTP: %{http_code}\n"
done
# El intento 11 recibirá HTTP 429 (Too Many Requests)
```
