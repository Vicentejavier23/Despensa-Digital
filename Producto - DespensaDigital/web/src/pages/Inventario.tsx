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
  { value: '',        label: 'Todos'   },
  { value: 'ok',      label: 'Vigente' },
  { value: 'proximo', label: 'Próximo' },
  { value: 'vencido', label: 'Vencido' },
];

const TIPO_CONFIG: Record<TipoProducto | 'Otro', { bg: string; color: string; dot: string }> = {
  Alimento:  { bg: '#FFF7ED', color: '#C2410C', dot: '#FB923C' },
  Bebida:    { bg: '#EFF6FF', color: '#1D4ED8', dot: '#60A5FA' },
  Lácteo:    { bg: '#F0FDF4', color: '#15803D', dot: '#4ADE80' },
  Congelado: { bg: '#EEF2FF', color: '#4338CA', dot: '#818CF8' },
  Otro:      { bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
};

function getTipoConfig(tipo: string) {
  return TIPO_CONFIG[tipo as TipoProducto] ?? TIPO_CONFIG['Otro'];
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Inventario() {
  const [productos,     setProductos]     = useState<Producto[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filtros,       setFiltros]       = useState<FiltrosInventario>({ busqueda: '', tipo: '', estado: '' });
  const [productoSelec, setProductoSelec] = useState<Producto | null>(null);
  const [productoEdit,  setProductoEdit]  = useState<Producto | null | undefined>(undefined);
  const [toast,         setToast]         = useState('');
  const [eliminando,    setEliminando]    = useState<number | null>(null);

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
      const matchBusq   = !q || p.nombre_producto.toLowerCase().includes(q) || p.marca_producto.toLowerCase().includes(q);
      const matchTipo   = !filtros.tipo   || p.tipo_producto === filtros.tipo;
      const matchEstado = !filtros.estado || calcularEstadoVencimiento(p.fecha_vencimiento) === filtros.estado;
      return matchBusq && matchTipo && matchEstado;
    });
  }, [productos, busquedaDebounced, filtros.tipo, filtros.estado]);

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Eliminar este producto del inventario?')) return;
    setEliminando(id);
    try {
      await productosApi.eliminar(id);
      setProductos(prev => prev.filter(p => p.id_producto !== id));
      mostrarToast('Producto eliminado');
    } catch {
      alert('No se pudo eliminar el producto.');
    } finally {
      setEliminando(null);
    }
  };

  const handleGuardado = (prod: Producto) => {
    setProductos(prev => {
      const idx = prev.findIndex(p => p.id_producto === prod.id_producto);
      if (idx >= 0) { const c = [...prev]; c[idx] = prod; return c; }
      return [prod, ...prev];
    });
    mostrarToast(productoEdit ? `"${prod.nombre_producto}" actualizado` : `"${prod.nombre_producto}" agregado`);
  };

  const setFiltro = <K extends keyof FiltrosInventario>(k: K, v: FiltrosInventario[K]) =>
    setFiltros(prev => ({ ...prev, [k]: v }));

  const hayFiltros = !!(filtros.busqueda || filtros.tipo || filtros.estado);

  return (
    <div className={styles.inventarioContainer}>

      {/* Toast */}
      {toast && <div className={styles.inventarioToast}>{toast}</div>}

      {/* Modal detalle */}
      {productoSelec && (
        <ProductoModal
          producto={productoSelec}
          onCerrar={() => setProductoSelec(null)}
          onEliminar={handleEliminar}
          onEditar={(p) => { setProductoSelec(null); setProductoEdit(p); }}
        />
      )}

      {/* Modal formulario */}
      {productoEdit !== undefined && (
        <ProductoFormModal
          productoEditar={productoEdit}
          onCerrar={() => setProductoEdit(undefined)}
          onGuardado={handleGuardado}
        />
      )}

      {/* Encabezado */}
      <div className={styles.inventarioHeader}>
        <div className={styles.inventarioTitleGroup}>
          <h1>Inventario</h1>
          <p>
            {hayFiltros
              ? `${productosFiltrados.length} de ${productos.length} productos`
              : `${productos.length} producto${productos.length !== 1 ? 's' : ''} en tu despensa`}
          </p>
        </div>
        <button onClick={() => setProductoEdit(null)} className={styles.inventarioBtnAgregar}>
          + Agregar producto
        </button>
      </div>

      {/* Filtros */}
      <div className={styles.inventarioFiltros}>
        <div className={styles.inventarioSearchWrapper}>
          <input
            type="text"
            placeholder="Buscar por nombre o marca..."
            value={filtros.busqueda}
            onChange={e => setFiltro('busqueda', e.target.value)}
            className={styles.inventarioSearchInput}
          />
          {filtros.busqueda && (
            <button onClick={() => setFiltro('busqueda', '')} className={styles.inventarioSearchClear}>✕</button>
          )}
        </div>

        <select
          value={filtros.tipo}
          onChange={e => setFiltro('tipo', e.target.value)}
          className={styles.inventarioSelect}
        >
          <option value="">Todos los tipos</option>
          {TIPOS.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div className={styles.inventarioEstadoFiltros}>
          {ESTADOS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFiltro('estado', value)}
              className={`${styles.inventarioChipBtn} ${filtros.estado === value ? styles.active : ''}`}
            >{label}</button>
          ))}
        </div>

        {hayFiltros && (
          <button onClick={() => setFiltros({ busqueda: '', tipo: '', estado: '' })} className={styles.inventarioBtnLimpiar}>
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : productosFiltrados.length === 0 ? (
        <EmptyState
          emoji="📦"
          titulo={hayFiltros ? 'Sin resultados' : 'Despensa vacía'}
          descripcion={
            hayFiltros
              ? 'No hay productos que coincidan con los filtros.'
              : 'Agrega tu primer producto con el botón de arriba.'
          }
          accion={
            hayFiltros ? (
              <button onClick={() => setFiltros({ busqueda: '', tipo: '', estado: '' })} className={styles.inventarioBtnPrimary}>
                Limpiar filtros
              </button>
            ) : (
              <button onClick={() => setProductoEdit(null)} className={styles.inventarioBtnPrimary}>
                + Agregar producto
              </button>
            )
          }
        />
      ) : (
        <div className={styles.inventarioGrid}>
          {productosFiltrados.map(p => {
            const cfg   = getTipoConfig(p.tipo_producto);
            const estado = calcularEstadoVencimiento(p.fecha_vencimiento);
            return (
              <div key={p.id_producto} className={styles.inventarioCard}>

                {/* Franja de color por tipo */}
                <div className={styles.inventarioCardStripe} style={{ background: cfg.dot }} />

                {/* Cuerpo clickeable → abre detalle */}
                <button
                  className={styles.inventarioCardBody}
                  onClick={() => setProductoSelec(p)}
                >
                  {/* Badge de tipo */}
                  <span className={styles.inventarioCardTipoBadge} style={{ background: cfg.bg, color: cfg.color }}>
                    {p.tipo_producto}
                  </span>

                  {/* Nombre y marca */}
                  <div className={styles.inventarioCardNombre}>{p.nombre_producto}</div>
                  <div className={styles.inventarioCardMarca}>{p.marca_producto}</div>

                  {/* Cantidad */}
                  <div className={styles.inventarioCardCantidad}>
                    <span className={styles.cantidadLabel}>Stock</span>
                    <span className={styles.cantidadValor}>{p.cantidad_unidad}</span>
                  </div>

                  {/* Fecha vencimiento con semáforo */}
                  <div className={`${styles.inventarioCardVence} ${styles[estado]}`}>
                    <SemaforoVencimiento fechaVencimiento={p.fecha_vencimiento} size="sm" />
                    <span>{formatFecha(p.fecha_vencimiento)}</span>
                  </div>
                </button>

                {/* Botones acción — siempre visibles */}
                <div className={styles.inventarioCardFooter}>
                  <button
                    className={styles.btnEditar}
                    onClick={() => setProductoEdit(p)}
                    disabled={eliminando === p.id_producto}
                  >
                    Editar
                  </button>
                  <button
                    className={styles.btnEliminar}
                    onClick={() => handleEliminar(p.id_producto)}
                    disabled={eliminando === p.id_producto}
                  >
                    {eliminando === p.id_producto ? '...' : 'Eliminar'}
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
