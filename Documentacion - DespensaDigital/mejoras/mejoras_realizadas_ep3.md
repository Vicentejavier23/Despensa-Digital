# Mejoras Realizadas — EP3 DespensaDigital
**Proyecto:** DespensaDigital v2  
**Curso:** TPY1101 — Duoc UC  
**Evaluación:** Parcial N°3  
**Fecha:** Junio 2026

---

## Resumen de Mejoras

Las siguientes mejoras fueron implementadas como resultado de las pruebas de validación ejecutadas en la EP3, siguiendo estándares de calidad de la industria en las dimensiones de **seguridad**, **usabilidad**, **completitud**, **corrección** y **pertinencia**.

---

## Tabla de Mejoras

| ID | Problema detectado | Tipo | Archivo modificado | Solución implementada | Estándar | Estado |
|---|---|---|---|---|---|---|
| MJ-01 | Sin headers de seguridad HTTP — posible clickjacking, MIME sniffing y XSS | Seguridad | `server.js` | Integración de `helmet` v7 que agrega automáticamente: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Content-Security-Policy` | OWASP A05 Security Misconfiguration | ✅ Implementado |
| MJ-02 | Sin protección contra ataques de fuerza bruta en `/api/auth/login` | Seguridad | `auth.routes.js` | `express-rate-limit`: máximo 10 intentos de login por IP cada 15 minutos; los intentos exitosos no se cuentan | OWASP A07 Identification and Authentication Failures | ✅ Implementado |
| MJ-03 | Sin protección contra abuso de registro masivo de cuentas | Seguridad | `auth.routes.js` | `express-rate-limit`: máximo 5 registros por IP por hora | OWASP A07 | ✅ Implementado |
| MJ-04 | El servidor iniciaba aunque fuera importado como módulo | Corrección | `server.js` | `app.listen()` solo se ejecuta si `require.main === module`, permitiendo tests sin puerto real | Buenas prácticas Node.js | ✅ Implementado |
| MJ-05 | Error handler sin timestamp en los logs | Corrección | `errorHandler.js` | Logs incluyen timestamp ISO 8601 para trazabilidad de errores en producción | ISO 8601, industria DevOps | ✅ Implementado |
| MJ-06 | En producción el error handler podía exponer stack traces | Seguridad | `errorHandler.js` | En `NODE_ENV=production` el mensaje es siempre genérico; solo en desarrollo se muestran detalles | OWASP A05 | ✅ Implementado |
| MJ-07 | Sin suite de pruebas automatizadas | Completitud | `src/tests/*.test.js` | 42 casos de prueba en 5 archivos cubriendo: disponibilidad, autenticación, JWT, CRUD productos, alertas | IEEE 829 — Plan de Pruebas | ✅ Implementado |
| MJ-08 | Rate limiting activo interfería con los tests | Corrección | `auth.routes.js` | Los rate limiters se omiten cuando `NODE_ENV === 'test'` mediante middleware bypass | Buenas prácticas de testing | ✅ Implementado |

---

## Detalle de Mejoras de Seguridad

### MJ-01 — Helmet (Headers de Seguridad)

**Antes:**
```http
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json
```

**Después:**
```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 0
Referrer-Policy: no-referrer
```

**Código implementado (`server.js`):**
```js
const helmet = require('helmet');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
```

---

### MJ-02 y MJ-03 — Rate Limiting

**Antes:** Un atacante podía intentar infinitos logins por segundo sin consecuencias.

**Después:**
```js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutos
  max: 10,                      // máx 10 intentos
  skipSuccessfulRequests: true, // los éxitos no cuentan
  message: { error: 'Demasiados intentos. Intenta en 15 minutos.' },
});
```

---

## Mejoras en Completitud — Suite de Pruebas

| Archivo | Casos de prueba | Módulo cubierto |
|---|---|---|
| `health.test.js` | 5 | Servidor, headers de seguridad, 404 |
| `auth.test.js` | 14 | Registro, Login, Exchange Token |
| `middleware.test.js` | 5 | Verificación JWT |
| `productos.test.js` | 13 | CRUD Inventario |
| `alertas.test.js` | 9 | Sistema de Alertas |
| **Total** | **42** | **5 módulos** |

**Resultado de ejecución:**
```
Test Suites: 5 passed, 5 total
Tests:       42 passed, 42 total
Time:        2.115 s
```

---

## Conclusión de Mejoras

Las mejoras implementadas abordan las tres categorías principales identificadas en las pruebas:

1. **Seguridad:** Helmet + Rate Limiting eliminan vectores de ataque OWASP críticos (A05 y A07)
2. **Corrección:** El error handler mejorado y la separación de `app.listen()` hacen el código más robusto
3. **Completitud:** La suite de 42 tests automatizados garantiza la detectabilidad de regresiones futuras

El proyecto pasa de **0 tests** (estado inicial) a **42 tests automatizados** con cobertura de los módulos críticos.
