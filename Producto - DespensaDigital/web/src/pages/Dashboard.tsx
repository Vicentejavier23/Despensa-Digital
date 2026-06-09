import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productosApi } from '../api/productosApi';
import { get } from '../api/client';
import { calcularEstadoVencimiento } from '../components/SemaforoVencimiento';
import EmptyState from '../components/EmptyState';
import type { Producto } from '../types';

interface Metricas {
  total_productos:       number;
  proximos_vencer:       number;
  vencidos:              number;
  items_lista_pendiente: number;
}

interface Alertas {
  total_alertas: number;
  por_vencer:    any[];
  stock_bajo:    any[];
}

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function diasRestantes(fecha: string) {
  const hoy  = new Date(); hoy.setHours(0,0,0,0);
  const vence = new Date(fecha); vence.setHours(0,0,0,0);
  return Math.round((vence.getTime() - hoy.getTime()) / 86400000);
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [alertas,  setAlertas]  = useState<Alertas | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [met, prods, alerts] = await Promise.all([
          productosApi.metricas(),
          productosApi.listar(),
          get<Alertas>('/api/alertas?dias=7'),
        ]);
        if (cancelado) return;
        setMetricas(met as Metricas);
        setProductos(prods);
        setAlertas(alerts);
      } catch {
        // silenciar — cada sección muestra su propio estado vacío
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  if (loading) return <SkeletonDashboard />;

  const vencidos  = productos.filter(p => calcularEstadoVencimiento(p.fecha_vencimiento) === 'vencido');
  const proximos  = productos.filter(p => calcularEstadoVencimiento(p.fecha_vencimiento) === 'proximo');
  const vigentes  = productos.filter(p => calcularEstadoVencimiento(p.fecha_vencimiento) === 'ok');
  // Todos los productos ordenados: primero vencidos, luego próximos, luego vigentes
  const productosOrdenados = [...vencidos, ...proximos, ...vigentes].slice(0, 6);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease both' }}>

      {/* ── Encabezado ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
          {saludo()}, {usuario?.pri_nom_usuario}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 6 }}>
          Aquí tienes el resumen de tu despensa
        </p>
      </div>

      {/* ── Métricas ────────────────────────────────────────────── */}
      <div style={s.gridMetricas}>
        <StatCard
          label="Total productos"
          valor={metricas?.total_productos ?? productos.length}
          color="#2D6A4F"
          onClick={() => navigate('/inventario')}
        />
        <StatCard
          label="Próximos a vencer"
          valor={metricas?.proximos_vencer ?? proximos.length}
          color="#D97706"
          alerta={(metricas?.proximos_vencer ?? proximos.length) > 0}
          sub="Próximos 7 días"
          onClick={() => navigate('/alertas')}
        />
        <StatCard
          label="Vencidos"
          valor={metricas?.vencidos ?? vencidos.length}
          color="#DC2626"
          alerta={(metricas?.vencidos ?? vencidos.length) > 0}
          onClick={() => navigate('/inventario')}
        />
        <StatCard
          label="Alertas activas"
          valor={alertas?.total_alertas ?? 0}
          color="#7C3AED"
          alerta={(alertas?.total_alertas ?? 0) > 0}
          onClick={() => navigate('/alertas')}
        />
      </div>

      {/* ── Dos columnas ────────────────────────────────────────── */}
      <div style={s.grid2col}>

        {/* Productos de tu despensa */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>Tu despensa</h2>
            <button style={s.verTodos} onClick={() => navigate('/inventario')}>Ver todos</button>
          </div>

          {productosOrdenados.length === 0 ? (
            <EmptyState emoji="📦" titulo="Despensa vacía"
              descripcion="Agrega productos en el inventario."
              accion={<button style={s.btnPrimary} onClick={() => navigate('/inventario')}>Ir al inventario</button>}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {productosOrdenados.map(p => {
                const est   = calcularEstadoVencimiento(p.fecha_vencimiento);
                const dias  = diasRestantes(p.fecha_vencimiento);
                const color = est === 'vencido' ? '#DC2626' : est === 'proximo' ? '#D97706' : '#15803D';
                const bg    = est === 'vencido' ? '#FEF2F2' : est === 'proximo' ? '#FFFBEB' : '#F0FDF4';
                const label = est === 'vencido'
                  ? `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`
                  : dias === 0 ? 'Vence hoy'
                  : `Vence en ${dias} día${dias !== 1 ? 's' : ''}`;
                return (
                  <div key={p.id_producto} style={{ ...s.productoRow, borderLeft: `3px solid ${color}`, background: bg }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.productoNombre}>{p.nombre_producto}</div>
                      <div style={s.productoMarca}>{p.marca_producto} · ×{p.cantidad_unidad}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color, whiteSpace: 'nowrap' }}>{label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 1 }}>{formatFecha(p.fecha_vencimiento)}</div>
                    </div>
                  </div>
                );
              })}
              {productos.length > 6 && (
                <button style={s.verMas} onClick={() => navigate('/inventario')}>
                  + {productos.length - 6} productos más
                </button>
              )}
            </div>
          )}
        </div>

        {/* Panel de alertas rápidas */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <h2 style={s.cardTitle}>Alertas</h2>
            <button style={s.verTodos} onClick={() => navigate('/alertas')}>Ver todas</button>
          </div>

          {!alertas || alertas.total_alertas === 0 ? (
            <EmptyState emoji="✅" titulo="Sin alertas" descripcion="Tu despensa está al día." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertas.por_vencer.slice(0, 3).map((a: any) => (
                <AlertaRow
                  key={`v-${a.id_producto}`}
                  nombre={a.nombre_producto}
                  detalle={`Vence el ${formatFecha(a.fecha_vencimiento)}`}
                  tipo="vencimiento"
                />
              ))}
              {alertas.stock_bajo.slice(0, 3).map((a: any) => (
                <AlertaRow
                  key={`s-${a.id_producto}`}
                  nombre={a.nombre_producto}
                  detalle={`Stock: ${a.cantidad_unidad} (mín. ${a.stock_minimo})`}
                  tipo="stock"
                />
              ))}
              {alertas.total_alertas > 6 && (
                <button style={s.verMas} onClick={() => navigate('/alertas')}>
                  + {alertas.total_alertas - 6} alertas más
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* ── Acceso rápido ───────────────────────────────────────── */}
      <div style={s.accesosGrid}>
        {[
          { label: 'Lista de compras', ruta: '/lista-compras', color: '#2D6A4F' },
          { label: 'Patologías',       ruta: '/patologias',    color: '#7C3AED' },
          { label: 'Mi perfil',        ruta: '/perfil',        color: '#0369A1' },
        ].map(a => (
          <button key={a.ruta} style={{ ...s.accesoBtn, borderTop: `3px solid ${a.color}` }} onClick={() => navigate(a.ruta)}>
            {a.label}
          </button>
        ))}
      </div>

    </div>
  );
}

// ── Componentes internos ───────────────────────────────────────
function StatCard({ label, valor, color, alerta, sub, onClick }: {
  label: string; valor: number; color: string; alerta?: boolean; sub?: string; onClick?: () => void;
}) {
  return (
    <button style={{ ...s.statCard, borderTop: `4px solid ${color}`, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      {alerta && valor > 0 && <span style={{ ...s.alertaDot, background: color }} />}
      <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color, lineHeight: 1 }}>{valor}</div>
      <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{sub}</div>}
    </button>
  );
}

function AlertaRow({ nombre, detalle, tipo }: { nombre: string; detalle: string; tipo: 'vencimiento' | 'stock' }) {
  const color = tipo === 'vencimiento' ? '#D97706' : '#DC2626';
  const bg    = tipo === 'vencimiento' ? '#FFFBEB'  : '#FEF2F2';
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 8, background: bg, borderLeft: `3px solid ${color}`, alignItems: 'center' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</div>
        <div style={{ fontSize: '0.65rem', color, marginTop: 1 }}>{detalle}</div>
      </div>
      <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: color, color: '#fff', flexShrink: 0 }}>
        {tipo === 'vencimiento' ? 'VENCE' : 'STOCK'}
      </span>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div>
      <div style={{ height: 36, width: 260, background: '#E5E7EB', borderRadius: 8, marginBottom: 8 }} />
      <div style={{ height: 18, width: 200, background: '#E5E7EB', borderRadius: 6, marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ height: 90, background: '#E5E7EB', borderRadius: 12 }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ height: 300, background: '#E5E7EB', borderRadius: 16 }} />
        <div style={{ height: 300, background: '#E5E7EB', borderRadius: 16 }} />
      </div>
    </div>
  );
}

// ── Estilos ────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  gridMetricas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '0.875rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    position: 'relative',
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem',
    boxShadow: 'var(--shadow-sm)',
    textAlign: 'left',
    border: '1.5px solid var(--color-border)',
    transition: 'box-shadow 150ms, transform 150ms',
    fontFamily: 'var(--font-base)',
  },
  alertaDot: {
    position: 'absolute',
    top: 10, right: 10,
    width: 8, height: 8,
    borderRadius: '50%',
  },
  grid2col: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  card: {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.25rem',
    boxShadow: 'var(--shadow-sm)',
    border: '1.5px solid var(--color-border)',
  },
  cardHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  cardTitle: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 700,
    color: 'var(--color-text)',
    margin: 0,
  },
  verTodos: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    color: 'var(--color-primary-700)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  productoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 8,
  },
  productoNombre: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 700,
    color: 'var(--color-text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  productoMarca: {
    fontSize: '0.65rem',
    color: 'var(--color-text-muted)',
    marginTop: 1,
  },
  verMas: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    color: 'var(--color-primary-700)',
    background: 'var(--color-primary-50)',
    border: 'none',
    borderRadius: 8,
    padding: '6px 12px',
    cursor: 'pointer',
    textAlign: 'center',
    width: '100%',
    fontFamily: 'var(--font-base)',
  },
  accesosGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  accesoBtn: {
    background: 'var(--color-surface)',
    border: '1.5px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    padding: '0.875rem 1rem',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 700,
    color: 'var(--color-text)',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'var(--font-base)',
    transition: 'box-shadow 150ms',
  },
  btnPrimary: {
    padding: '0.5rem 1.25rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-primary-800)',
    color: '#fff',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
};
