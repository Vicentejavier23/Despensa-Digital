-- =============================================================
-- DespensaDigital — Schema v2
-- Login por CORREO ELECTRÓNICO
-- JWT expira en 1 hora (RNF-01)
-- Tabla PATOLOGIAS incluida
-- Nombres de tablas unificados
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Geografía ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS PAIS (
  id_pais       SERIAL       PRIMARY KEY,
  nombre_pais   VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS REGION (
  id_region     SERIAL       PRIMARY KEY,
  nombre_region VARCHAR(150) NOT NULL,
  PAIS_id_pais  INT          NOT NULL REFERENCES PAIS(id_pais) ON DELETE CASCADE,
  UNIQUE(nombre_region, PAIS_id_pais)
);

CREATE TABLE IF NOT EXISTS CIUDAD (
  id_ciudad        SERIAL       PRIMARY KEY,
  nombre_ciudad    VARCHAR(150) NOT NULL,
  REGION_id_region INT          NOT NULL REFERENCES REGION(id_region) ON DELETE CASCADE,
  UNIQUE(nombre_ciudad, REGION_id_region)
);

CREATE TABLE IF NOT EXISTS COMUNA (
  id_comuna        SERIAL       PRIMARY KEY,
  nombre_comuna    VARCHAR(150) NOT NULL,
  CIUDAD_id_ciudad INT          NOT NULL REFERENCES CIUDAD(id_ciudad) ON DELETE CASCADE,
  UNIQUE(nombre_comuna, CIUDAD_id_ciudad)
);

-- ─── Usuario ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS USUARIO (
  run_usuario       BIGINT       PRIMARY KEY CHECK (run_usuario BETWEEN 1000000 AND 99999999),
  dvrun_usuario     CHAR(1)      NOT NULL CHECK (dvrun_usuario ~ '^[0-9K]$'),
  pri_nom_usuario   VARCHAR(80)  NOT NULL,
  seg_nom_usuario   VARCHAR(80),
  pri_ape_usuario   VARCHAR(80)  NOT NULL,
  seg_ape_usuario   VARCHAR(80),
  correo_usuario    VARCHAR(200) NOT NULL UNIQUE,
  num_tel_usuario   BIGINT       NOT NULL CHECK (num_tel_usuario BETWEEN 900000000 AND 9999999999),
  password_usuario  TEXT         NOT NULL,
  fecha_nac_usuario DATE         NOT NULL,
  fecha_reg_usuario TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_correo
  ON USUARIO (LOWER(correo_usuario));

-- ─── Dirección ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DIRECCION (
  id_direccion          SERIAL  PRIMARY KEY,
  calle_direccion       VARCHAR(200) NOT NULL DEFAULT 'Sin calle',
  numero_direccion      INT          NOT NULL DEFAULT 0,
  COMUNA_id_comuna      INT          REFERENCES COMUNA(id_comuna) ON DELETE SET NULL,
  USUARIO_run_usuario   BIGINT       NOT NULL REFERENCES USUARIO(run_usuario) ON DELETE CASCADE,
  UNIQUE(USUARIO_run_usuario)
);

-- ─── Categoría de producto ────────────────────────────────────
CREATE TABLE IF NOT EXISTS CATEGORIA_PRODUCTO (
  id_categoria     SERIAL       PRIMARY KEY,
  nombre_categoria VARCHAR(100) NOT NULL UNIQUE
);

-- ─── Tipo de almacenaje ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS TIPO_ALMACENAJE (
  id_almacenaje   SERIAL      PRIMARY KEY,
  tipo_almacenaje VARCHAR(80) NOT NULL UNIQUE
);

-- ─── Producto ─────────────────────────────────────────────────
-- Nombre unificado: PRODUCTO (no PRODUCTOS_DESPENSA)
CREATE TABLE IF NOT EXISTS PRODUCTO (
  id_producto              SERIAL       PRIMARY KEY,
  nombre_producto          VARCHAR(200) NOT NULL,
  marca_producto           VARCHAR(150) NOT NULL DEFAULT 'Sin marca',
  cod_barra_producto       VARCHAR(50),
  fecha_vencimiento        DATE         NOT NULL,
  cantidad_unidad          INT          NOT NULL DEFAULT 1 CHECK (cantidad_unidad >= 0),
  stock_minimo             INT          NOT NULL DEFAULT 2  CHECK (stock_minimo >= 0),
  tipo_producto            VARCHAR(50)  NOT NULL
    CHECK (tipo_producto IN ('Alimento','Bebida','Lácteo','Congelado','Otro')),
  peso_gramos              INT          CHECK (peso_gramos > 0),
  mililitros               INT          CHECK (mililitros > 0),
  fecha_apertura           DATE,
  CATEGORIA_id_categoria   INT          REFERENCES CATEGORIA_PRODUCTO(id_categoria) ON DELETE SET NULL,
  TIPO_ALMACENAJE_id       INT          REFERENCES TIPO_ALMACENAJE(id_almacenaje)   ON DELETE SET NULL,
  USUARIO_run_usuario      BIGINT       NOT NULL REFERENCES USUARIO(run_usuario)     ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_producto_usuario      ON PRODUCTO (USUARIO_run_usuario);
CREATE INDEX IF NOT EXISTS idx_producto_vencimiento  ON PRODUCTO (fecha_vencimiento);

-- ─── Patología ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS PATOLOGIAS (
  id_patologias       SERIAL       PRIMARY KEY,
  nombre_patologia    VARCHAR(200) NOT NULL,
  tipo_patologia      VARCHAR(80)  NOT NULL
    CHECK (tipo_patologia IN ('Crónica','Alérgica','Intolerancia','Otra')),
  fecha_diagnostico   DATE,
  patologia_activa    BOOLEAN      NOT NULL DEFAULT TRUE,
  USUARIO_run_usuario BIGINT       NOT NULL REFERENCES USUARIO(run_usuario) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_patologia_usuario ON PATOLOGIAS (USUARIO_run_usuario);

-- ─── Lista de compras ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS LISTA_COMPRAS (
  id_lista             SERIAL      PRIMARY KEY,
  fecha_lista          DATE        NOT NULL DEFAULT CURRENT_DATE,
  estado_lista         BOOLEAN     NOT NULL DEFAULT FALSE,
  cantidad_producto    INT         NOT NULL DEFAULT 1 CHECK (cantidad_producto > 0),
  tipo_lista           VARCHAR(20) NOT NULL DEFAULT 'MANUAL'
    CHECK (tipo_lista IN ('AUTOMATICA','MANUAL')),
  PRODUCTO_id_producto INT         NOT NULL REFERENCES PRODUCTO(id_producto) ON DELETE CASCADE,
  USUARIO_run_usuario  BIGINT      NOT NULL REFERENCES USUARIO(run_usuario)  ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lista_usuario ON LISTA_COMPRAS (USUARIO_run_usuario);

-- ─── Datos geográficos iniciales (Chile) ──────────────────────
INSERT INTO PAIS (nombre_pais) VALUES
  ('Chile'),('Argentina'),('Perú'),('Colombia'),('México')
ON CONFLICT DO NOTHING;

WITH p AS (SELECT id_pais FROM PAIS WHERE nombre_pais = 'Chile')
INSERT INTO REGION (nombre_region, PAIS_id_pais)
SELECT r, p.id_pais FROM p, (VALUES
  ('Arica y Parinacota'),('Tarapacá'),('Antofagasta'),('Atacama'),
  ('Coquimbo'),('Valparaíso'),('Metropolitana de Santiago'),
  ('O''Higgins'),('Maule'),('Ñuble'),('Biobío'),('La Araucanía'),
  ('Los Ríos'),('Los Lagos'),('Aysén'),('Magallanes')
) AS t(r)
ON CONFLICT DO NOTHING;

WITH r AS (SELECT id_region FROM REGION WHERE nombre_region='Metropolitana de Santiago' LIMIT 1)
INSERT INTO CIUDAD (nombre_ciudad, REGION_id_region)
SELECT c, r.id_region FROM r, (VALUES
  ('Santiago')
) AS t(c)
ON CONFLICT DO NOTHING;

-- Todas las comunas del Gran Santiago bajo la ciudad Santiago
WITH ci AS (SELECT id_ciudad FROM CIUDAD WHERE nombre_ciudad='Santiago' LIMIT 1)
INSERT INTO COMUNA (nombre_comuna, CIUDAD_id_ciudad)
SELECT c, ci.id_ciudad FROM ci, (VALUES
  ('Santiago Centro'),('Providencia'),('Ñuñoa'),('La Reina'),
  ('Vitacura'),('Las Condes'),('Lo Barnechea'),('Huechuraba'),
  ('Recoleta'),('Independencia'),('Conchalí'),('Quilicura'),
  ('Pudahuel'),('Cerro Navia'),('Lo Prado'),('Estación Central'),
  ('Maipú'),('Cerrillos'),('Pedro Aguirre Cerda'),('San Miguel'),
  ('La Cisterna'),('El Bosque'),('San Ramón'),('Lo Espejo'),
  ('La Granja'),('La Pintana'),('San Joaquín'),('Macul'),
  ('Peñalolén'),('La Florida'),('Puente Alto'),('San Bernardo'),
  ('El Monte'),('Talagante'),('Calera de Tango'),('Pirque'),
  ('San José de Maipo')
) AS t(c)
ON CONFLICT DO NOTHING;

WITH r AS (SELECT id_region FROM REGION WHERE nombre_region='Valparaíso' LIMIT 1)
INSERT INTO CIUDAD (nombre_ciudad, REGION_id_region)
SELECT c, r.id_region FROM r, (VALUES ('Valparaíso'),('Viña del Mar'),('Quillota')) AS t(c)
ON CONFLICT DO NOTHING;

WITH ci AS (SELECT id_ciudad FROM CIUDAD WHERE nombre_ciudad='Valparaíso' LIMIT 1)
INSERT INTO COMUNA (nombre_comuna, CIUDAD_id_ciudad)
SELECT c, ci.id_ciudad FROM ci, (VALUES
  ('Valparaíso'),('Viña del Mar'),('Concón'),('Quilpué'),('Villa Alemana')
) AS t(c)
ON CONFLICT DO NOTHING;

WITH r AS (SELECT id_region FROM REGION WHERE nombre_region='Biobío' LIMIT 1)
INSERT INTO CIUDAD (nombre_ciudad, REGION_id_region)
SELECT c, r.id_region FROM r, (VALUES ('Concepción'),('Los Ángeles'),('Chillán')) AS t(c)
ON CONFLICT DO NOTHING;

WITH ci AS (SELECT id_ciudad FROM CIUDAD WHERE nombre_ciudad='Concepción' LIMIT 1)
INSERT INTO COMUNA (nombre_comuna, CIUDAD_id_ciudad)
SELECT c, ci.id_ciudad FROM ci, (VALUES
  ('Concepción'),('Talcahuano'),('Hualpén'),('San Pedro de la Paz'),('Chiguayante'),('Penco')
) AS t(c)
ON CONFLICT DO NOTHING;

-- ─── Catálogos ────────────────────────────────────────────────
INSERT INTO CATEGORIA_PRODUCTO (nombre_categoria) VALUES
  ('Lácteos'),('Carnes y embutidos'),('Frutas'),('Verduras'),
  ('Granos y cereales'),('Bebidas'),('Limpieza'),('Higiene personal'),
  ('Congelados'),('Snacks'),('Condimentos y salsas'),('Panadería'),('Otros')
ON CONFLICT DO NOTHING;

INSERT INTO TIPO_ALMACENAJE (tipo_almacenaje) VALUES
  ('Despensa'),('Refrigerador'),('Congelador'),('Bodega'),('Alacena'),('Baño')
ON CONFLICT DO NOTHING;

-- ─── Usuarios de prueba ───────────────────────────────────────
-- Usuario 1: test@despensa.cl / Password123
INSERT INTO USUARIO (
  run_usuario, dvrun_usuario, pri_nom_usuario, pri_ape_usuario,
  correo_usuario, num_tel_usuario, password_usuario, fecha_nac_usuario
) VALUES (
  12345678, '9', 'Test', 'Usuario',
  'test@despensa.cl', 912345678,
  '$2b$12$4AU0cqJOrAt/3knJRhfVh.s5YPVtA2.X5P.jg3641ttX.XD62G6py',
  '1990-01-01'
) ON CONFLICT DO NOTHING;

-- Dirección del usuario 1 (Santiago Centro)
WITH u AS (SELECT 12345678 AS run), c AS (SELECT id_comuna FROM COMUNA WHERE nombre_comuna = 'Santiago Centro' LIMIT 1)
INSERT INTO DIRECCION (calle_direccion, numero_direccion, COMUNA_id_comuna, USUARIO_run_usuario)
SELECT 'Av. Libertador', 1234, c.id_comuna, u.run FROM u, c
ON CONFLICT DO NOTHING;

-- Usuario 2: admin@despensa.cl / Admin2024!
INSERT INTO USUARIO (
  run_usuario, dvrun_usuario, pri_nom_usuario, pri_ape_usuario,
  correo_usuario, num_tel_usuario, password_usuario, fecha_nac_usuario
) VALUES (
  11111111, '1', 'Admin', 'DespensaDigital',
  'admin@despensa.cl', 998765432,
  '$2b$12$x7jBGCLruw.Yp0grYKrowuqNoCrj8aLhR.K.R7x0x/XYHd9zCXnB2',
  '1995-06-15'
) ON CONFLICT DO NOTHING;

-- Dirección del usuario 2 (Providencia)
WITH u AS (SELECT 11111111 AS run), c AS (SELECT id_comuna FROM COMUNA WHERE nombre_comuna = 'Providencia' LIMIT 1)
INSERT INTO DIRECCION (calle_direccion, numero_direccion, COMUNA_id_comuna, USUARIO_run_usuario)
SELECT 'Av. Providencia', 560, c.id_comuna, u.run FROM u, c
ON CONFLICT DO NOTHING;

-- Productos de prueba para test@despensa.cl
WITH u AS (SELECT 12345678 AS run),
     cat_lacteo    AS (SELECT id_categoria FROM CATEGORIA_PRODUCTO WHERE nombre_categoria = 'Lácteos'           LIMIT 1),
     cat_fruta     AS (SELECT id_categoria FROM CATEGORIA_PRODUCTO WHERE nombre_categoria = 'Frutas'            LIMIT 1),
     cat_cereal    AS (SELECT id_categoria FROM CATEGORIA_PRODUCTO WHERE nombre_categoria = 'Granos y cereales' LIMIT 1),
     alm_refrig    AS (SELECT id_almacenaje FROM TIPO_ALMACENAJE WHERE tipo_almacenaje = 'Refrigerador' LIMIT 1),
     alm_despensa  AS (SELECT id_almacenaje FROM TIPO_ALMACENAJE WHERE tipo_almacenaje = 'Despensa'    LIMIT 1)
INSERT INTO PRODUCTO (
  nombre_producto, marca_producto, fecha_vencimiento,
  cantidad_unidad, stock_minimo, tipo_producto,
  CATEGORIA_id_categoria, TIPO_ALMACENAJE_id, USUARIO_run_usuario
)
SELECT nombre, marca, vence, cant, stock, tipo, cat, alm, (SELECT run FROM u)
FROM (VALUES
  ('Leche entera',     'Soprole',   CURRENT_DATE + 5,   2, 2, 'Lácteo',    (SELECT id_categoria FROM cat_lacteo),   (SELECT id_almacenaje FROM alm_refrig)),
  ('Yogur natural',    'Nestlé',    CURRENT_DATE + 3,   3, 2, 'Lácteo',    (SELECT id_categoria FROM cat_lacteo),   (SELECT id_almacenaje FROM alm_refrig)),
  ('Manzanas Fuji',    'Sin marca', CURRENT_DATE + 10,  6, 4, 'Alimento',  (SELECT id_categoria FROM cat_fruta),    (SELECT id_almacenaje FROM alm_refrig)),
  ('Arroz largo',      'Tucapel',   CURRENT_DATE + 180, 1, 2, 'Alimento',  (SELECT id_categoria FROM cat_cereal),   (SELECT id_almacenaje FROM alm_despensa)),
  ('Jugo naranja',     'Watts',     CURRENT_DATE - 2,   1, 2, 'Bebida',    NULL,                                    (SELECT id_almacenaje FROM alm_refrig)),
  ('Avena integral',   'Quaker',    CURRENT_DATE + 90,  2, 1, 'Alimento',  (SELECT id_categoria FROM cat_cereal),   (SELECT id_almacenaje FROM alm_despensa))
) AS t(nombre, marca, vence, cant, stock, tipo, cat, alm)
ON CONFLICT DO NOTHING;
