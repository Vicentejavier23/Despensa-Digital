import React, { useEffect, useState, useMemo } from 'react';
import { productosApi } from '../api/productosApi';
import { useDebounce } from '../hooks/useDebounce';
import { calcularEstadoVencimiento } from '../components/SemaforoVencimiento';
import SemaforoVencimiento from '../components/SemaforoVencimiento';
import ProductoModal from '../components/ProductoModal';
import ProductoFormModal from '../components/ProductoFormModal';
import EmptyState from '../components/EmptyState';
import type { Producto, FiltrosInventario, TipoProducto } from '../types';
import styles from './Inventario.module.css';

const TIPOS = ['', 'Alimento', 'Bebida', 'Lácteo', 'Congelado', 'Otro'];

const ESTADOS = [
  { value: '',        label: 'Todos'      },
  { value: 'ok',      label: '✅ Vigente'  },
  { value: 'proximo', label: '⚠️ Próximo'  },
  { value: 'vencido', label: '🚫 Vencido'  },
];

// Icono y color de fondo por tipo de producto
const TIPO_CONFIG: Record<TipoProducto | 'Otro', { icon: string; bg: string; color: string }> = {
  Alimento:  { icon: '🥫', bg: '#FFF7ED', color: '#C2410C' },
  Bebida:    { icon: '🧃', bg: '#EFF6FF', color: '#1D4ED8' },
  Lácteo:    { icon: '🥛', bg: '#F0FDF4', color: '#15803D' },
  Congelado: { icon: '🧊', bg: '#EEF2FF', color: '#4338CA' },
  Otro:      { icon: '📦', bg: '#F9FAFB', color: '#6B7280' },
};

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo as TipoProducto] ?? TIPO_CONFIG['Otro'];
}

export default function Inventario() {
  const [productos,     setProductos]     = useState<Producto[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filtros,       setFiltros]       = useState<FiltrosInventario>({ busqueda: '', tipo: '', estado: '' });
  const [productoSelec, setProductoSelec] = useState<Producto | null>(null);
  const [productoEdit,  setProductoEdit]  = useState<Producto | null | undefined>(undefined);
  const [toast,         setToast]         = useState('');

  const busquedaDebounced = useDebounce(filtros.busqueda, 350);

  const mostrarToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const cargarProductos = () => {
    setLoading(true);
    productosApi.listar()
      .then(data => setProductos(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarProductos(); }, []);

  const productosFiltrados = useMemo(() => {
    const q = busquedaDebounced.toLowerCase().trim();
    return productos.filter(p => {
      const matchBusq = !q ||
        p.nombre_producto.toLowerCase().includes(q) ||
        p.marca_producto.toLowerCase().includes(q) ||
        (p.cod_barra_producto?.includes(q) ?? false);
      const matchTipo   = !filtros.tipo   || p.tipo_producto === filtros.tipo;
      const matchEstado = !filtros.estado || calcularEstadoVencimiento(p.fecha_vencimiento) === filtros.estado;
      return matchBusq && matchTipo && matchEstado;
    });
  }, [productos, busquedaDebounced, filtros.tipo, filtros.estado]);

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await productosApi.eliminar(id);
      setProductos(prev => prev.filter(p => p.id_producto !== id));
      mostrarToast('Producto eliminado ✓');
    } catch { alert('No se pudo eliminar el producto.'); }
  };

  const handleGuardado = (prod: Producto) => {
    setProductos(prev => {
      const idx = prev.findIndex(p => p.id_producto === prod.id_producto);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = prod;
        return copia;
      }
      return [prod, ...prev];
    });
    mostrarToast(
      productoEdit
        ? `"${prod.nombre_producto}" actualizado ✓`
        : `"${prod.nombre_producto}" agregado ✓`
    );
  };

  const setFiltro = <K extends keyof FiltrosInventario>(k: K, v: FiltrosInventario[K]) =>
    setFiltros(prev => ({ ...prev, [k]: v }));

  const hayFiltros = !!(filtros.busqueda || filtros.tipo || filtros.estado);

  return (
    <div className={styles.inventarioContainer}>

      {/* ── Toast ── */}
      {toast && <div className={styles.inventarioToast}>{toast}</div>}

      {/* ── Modal detalle ── */}
      {productoSelec && (
        <ProductoModal
          producto={productoSelec}
          onCerrar={() => setProductoSelec(null)}
          onEliminar={handleEliminar}
          onEditar={(p) => { setProductoSelec(null); setProductoEdit(p); }}
        />
      )}

      {/* ── Modal formulario ── */}
      {productoEdit !== undefined && (
        <ProductoFormModal
          productoEditar={productoEdit}
          onCerrar={() => setProductoEdit(undefined)}
          onGuardado={handleGuardado}
        />
      )}

      {/* ── Encabezado ── */}
      <div className={styles.inventarioHeader}>
        <div className={styles.inventarioTitleGroup}>
          <h1>📦 Inventario</h1>
          <p>
            {hayFiltros
              ? `${productosFiltrados.length} de ${productos.length} productos`
              : `${productos.length} producto${productos.length !== 1 ? 's' : ''} en tu despensa`}
          </p>
        </div>
        <button
          onClick={() => setProductoEdit(null)}
          className={styles.inventarioBtnAgregar}
        >
          <span className={styles.btnIcon}>＋</span>
          Agregar producto
        </button>
      </div>

      {/* ── Barra de filtros ── */}
      <div className={styles.inventarioFiltros}>

        {/* Búsqueda */}
        <div className={styles.inventarioSearchWrapper}>
          <span className={styles.inventarioSearchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, marca o código..."
            value={filtros.busqueda}
            onChange={e => setFiltro('busqueda', e.target.value)}
            className={styles.inventarioSearchInput}
          />
          {filtros.busqueda && (
            <button onClick={() => setFiltro('busqueda', '')} className={styles.inventarioSearchClear}>✕</button>
          )}
        </div>

        {/* Tipo */}
        <div className={styles.selectWrapper}>
          <span className={styles.selectIcon}>🏷</span>
          <select
            value={filtros.tipo}
            onChange={e => setFiltro('tipo', e.target.value)}
            className={styles.inventarioSelect}
          >
            <option value="">Todos los tipos</option>
            {TIPOS.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Estado chips */}
        <div className={styles.inventarioEstadoFiltros}>
          {ESTADOS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFiltro('estado', value)}
              className={`${styles.inventarioChipBtn} ${filtros.estado === value ? styles.active : ''}`}
            >{label}</button>
          ))}
        </div>

        {/* Limpiar filtros */}
        {hayFiltros && (
          <button
            onClick={() => setFiltros({ busqueda: '', tipo: '', estado: '' })}
            className={styles.inventarioBtnLimpiar}
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* ── Grid de productos ── */}
      {loading ? (
        <SkeletonGrid />
      ) : productosFiltrados.length === 0 ? (
        <EmptyState
          emoji="🔍"
          titulo={hayFiltros ? 'Sin resultados' : 'Despensa vacía'}
          descripcion={
            hayFiltros
              ? 'No hay productos que coincidan con los filtros.'
              : 'Agrega tu primer producto con el botón "Agregar producto".'
          }
          accion={
            hayFiltros ? (
              <button onClick={() => setFiltros({ busqueda:'', tipo:'', estado:'' })} className={styles.inventarioBtnPrimary}>
                Limpiar filtros
              </button>
            ) : (
              <button onClick={() => setProductoEdit(null)} className={styles.inventarioBtnPrimary}>
                ＋ Agregar producto
              </button>
            )
          }
        />
      ) : (
        <div className={styles.inventarioGrid}>
          {productosFiltrados.map(p => {
            const cfg = getTipoConfig(p.tipo_producto);
            return (
              <div key={p.id_producto} className={styles.inventarioCardWrapper}>
                <button
                  onClick={() => setProductoSelec(p)}
                  className={styles.inventarioProductoCard}
                >
                  {/* Icono del tipo */}
                  <div
                    className={styles.inventarioCardIcono}
                    style={{ background: cfg.bg }}
                  >
                    <span className={styles.inventarioCardIconoEmoji}>{cfg.icon}</span>
                  </div>

                  {/* Nombre y marca */}
                  <div className={styles.inventarioCardInfo}>
                    <div className={styles.inventarioCardNombre}>{p.nombre_producto}</div>
                    <div className={styles.inventarioCardMarca}>{p.marca_producto}</div>
                  </div>

                  {/* Semáforo */}
                  <div className={styles.inventarioCardSemaforo}>
                    <SemaforoVencimiento fechaVencimiento={p.fecha_vencimiento} size="sm" />
                  </div>

                  {/* Chips + cantidad */}
                  <div className={styles.inventarioCardMeta}>
                    <span
                      className={styles.inventarioChip}
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {p.tipo_producto}
                    </span>
                    <span className={styles.inventarioCardCantidad}>× {p.cantidad_unidad}</span>
                  </div>

                  {/* Fecha vencimiento */}
                  <div className={styles.inventarioCardFecha}>
                    📅 Vence: {new Date(p.fecha_vencimiento).toLocaleDateString('es-CL')}
                  </div>
                </button>

                {/* Botones editar / eliminar — siempre visibles en mobile, hover en desktop */}
                <div className={styles.inventarioCardActions}>
                  <button
                    title="Editar producto"
                    onClick={e => { e.stopPropagation(); setProductoEdit(p); }}
                    className={`${styles.inventarioCardActionBtn} ${styles.edit}`}
                  >
                    ✏️ <span className={styles.actionLabel}>Editar</span>
                  </button>
                  <button
                    title="Eliminar producto"
                    onClick={e => { e.stopPropagation(); handleEliminar(p.id_producto); }}
                    className={`${styles.inventarioCardActionBtn} ${styles.danger}`}
                  >
                    🗑 <span className={styles.actionLabel}>Borrar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className={styles.inventarioGrid}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className={styles.inventarioSkeletonItem} />
      ))}
    </div>
  );
}
