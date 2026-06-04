-- =============================================================
-- Migración: Corregir lista_compras para referenciar tabla PRODUCTO
-- Problema: lista_compras.productos_despensa_id_producto referenciaba
--           la tabla antigua productos_despensa en vez de producto.
-- =============================================================

BEGIN;

-- 1. Eliminar el FK constraint antiguo
ALTER TABLE lista_compras DROP CONSTRAINT IF EXISTS fk_lista_producto;

-- 2. Renombrar la columna al nombre correcto
ALTER TABLE lista_compras
  RENAME COLUMN productos_despensa_id_producto TO producto_id_producto;

-- 3. Agregar el FK correcto apuntando a la tabla PRODUCTO actual
ALTER TABLE lista_compras
  ADD CONSTRAINT fk_lista_producto
  FOREIGN KEY (producto_id_producto)
  REFERENCES producto(id_producto)
  ON DELETE CASCADE;

COMMIT;

-- Verificar resultado
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lista_compras'
ORDER BY ordinal_position;
