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
  const hoy   = new Date(); hoy.setHours(0,0,0,0);
  const vence = new Date(fecha); vence.setHours(0,0,0,0);
  return Math.round((vence.getTime() - hoy.getTime()) / 86400000);
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

function labelDias(dias: number) {
  if (dias < 0)  return `Venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
  if (dias === 0) return 'Vence hoy';
  return `Vence en ${dias} día${dias !== 1 ? 's' : ''}`;
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const navigate    = useNavigate();

  const [metricas,  setMetricas]  = useState<Metricas | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [alertas,   setAlertas]   = useState<Alertas | null>(null);
  const [loading,   setLoading]   = useState(true);

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
      } catch { /* silenciar */ }
      finally { if (!cancelado) setLoading(false); }
    })();
    return () => { cancelado = true; };
  }, []);

  if (loading) return <SkeletonDashboard />;

  const vencidos = productos.filter(p => calcularEstadoVencimiento(p.fecha_vencimiento) === 'vencido');
  const proximos = productos.filter(p => calcularEstadoVencimiento(p.fecha_vencimiento) === 'proximo');
  const vigentes = productos.filter(p => calcularEstadoVencimiento(p.fecha_vencimiento) === 'ok');
  // Ordenados: vencidos primero, luego próximos, luego vigentes
  const productosOrdenados = [...vencidos, ...proximos, ...vigentes];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease both' }}>

      {/* Encabezado */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-text)', margin: 0 }}>
          {saludo()}, {usuario?.pri_nom_usuario}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 6, fontSize: 'var(--font-size-sm)' }}>
          Resumen de tu despensa
        </p>
      </div>

      {/* Métricas */}
      <div style={s.gridMetricas}>
        <StatCard label="Total productos"    valor={metricas?.total_productos ?? productos.length}        color="#2D6A4F" onClick={() => navigate('/inventario')} />
        <StatCard label="Próximos a vencer"  valor={metricas?.proximos_vencer ?? proximos.length}         color="#D97706" alerta={(metricas?.proximos_vencer ?? proximos.length) > 0} sub="Próximos 7 días" onClick={() => navigate('/alertas')} />
        <StatCard label="Vencidos"           valor={metricas?.vencidos ?? vencidos.length}                color="#DC2626" alerta={(metricas?.vencidos ?? vencidos.length) > 0} onClick={() => navigate('/inventario')} />
        <StatCard label="Alertas activas"    valor={alertas?.total_alertas ?? 0}                          color="#7C3AED" alerta={(alertas?.total_alertas ?? 0) > 0} onClick={() => navigate('/alertas')} />
      </div>

      {/* Dos columnas */}
      <div style={s.grid2col}>

        {/* Tu despensa — TODOS los productos con scroll */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h2 style={s.cardTitle}>Tu despensa</h2>
              <p style={s.cardSub}>{productos.length} producto{productos.length !== 1 ? 's' : ''}</p>
            </div>
            <button style={s.verTodos} onClick={() => navigate('/inventario')}>Ver inventario</button>
          </div>

          {productosOrdenados.length === 0 ? (
            <EmptyState emoji="📦" titulo="Despensa vacía"
              descripcion="Agrega productos en el inventario."
              accion={<button style={s.btnPrimary} onClick={() => navigate('/inventario')}>Ir al inventario</button>}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
              {productosOrdenados.map(p => {
                const est   = calcularEstadoVencimiento(p.fecha_vencimiento);
                const dias  = diasRestantes(p.fecha_vencimiento);
                const color = est === 'vencido' ? '#DC2626' : est === 'proximo' ? '#D97706' : '#15803D';
                const bg    = est === 'vencido' ? '#FEF2F2' : est === 'proximo' ? '#FFFBEB' : '#F0FDF4';
                return (
                  <div
                    key={p.id_producto}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: bg, borderLeft: `3px solid ${color}` }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.nombre_producto}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                        {p.marca_producto} · stock: {p.cantidad_unidad}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                        {labelDias(dias)}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', marginTop: 1 }}>
                        {formatFecha(p.fecha_vencimiento)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alertas rápidas */}
        <div style={s.card}>
          <div style={s.cardHead}>
            <div>
              <h2 style={s.cardTitle}>Alertas</h2>
              <p style={s.cardSub}>
                {alertas ? `${alertas.total_alertas} alerta${alertas.total_alertas !== 1 ? 's' : ''} activa${alertas.total_alertas !== 1 ? 's' : ''}` : '—'}
              </p>
            </div>
            <button style={s.verTodos} onClick={() => navigate('/alertas')}>Ver todas</button>
          </div>

          {!alertas || alertas.total_alertas === 0 ? (
            <EmptyState emoji="✅" titulo="Sin alertas" descripcion="Tu despensa está al día." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
              {alertas.por_vencer.map((a: any) => (
                <AlertaRow
                  key={`v-${a.id_producto}`}
                  nombre={a.nombre_producto}
                  detalle={a.dias_restantes < 0
                    ? `Venció hace ${Math.abs(a.dias_restantes)} días`
                    : a.dias_restantes === 0 ? 'Vence hoy'
                    : `Vence en ${a.dias_restantes} días`}
                  tipo="vencimiento"
                  urgente={a.dias_restantes <= 0}
                />
              ))}
              {alertas.stock_bajo.map((a: any) => (
                <AlertaRow
                  key={`s-${a.id_producto}`}
                  nombre={a.nombre_producto}
                  detalle={`Stock: ${a.cantidad_unidad} (mín. ${a.stock_minimo})`}
                  tipo="stock"
                  urgente={a.cantidad_unidad === 0}
                />
              ))}
            </div>
          )}
        </div>

      </div>



    </div>
  );
}

// ── Componentes internos ─────────────────────────────────────────
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

function AlertaRow({ nombre, detalle, tipo, urgente }: {
  nombre: string; detalle: string; tipo: 'vencimiento' | 'stock'; urgente?: boolean;
}) {
  const color  = urgente ? '#DC2626' : tipo === 'vencimiento' ? '#D97706' : '#DC2626';
  const bg     = urgente ? '#FEF2F2' : tipo === 'vencimiento' ? '#FFFBEB' : '#FEF2F2';
  const badge  = tipo === 'vencimiento' ? (urgente ? 'VENCIDO' : 'VENCE') : 'STOCK';
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 10px', borderRadius: 8, background: bg, borderLeft: `3px solid ${color}`, alignItems: 'center' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {nombre}
        </div>
        <div style={{ fontSize: '0.65rem', color, marginTop: 1 }}>{detalle}</div>
      </div>
      <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: color, color: '#fff', flexShrink: 0 }}>
        {badge}
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
        <div style={{ height: 380, background: '#E5E7EB', borderRadius: 16 }} />
        <div style={{ height: 380, background: '#E5E7EB', borderRadius: 16 }} />
      </div>
    </div>
  );
}

// ── Estilos ──────────────────────────────────────────────────────
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
    alignItems: 'flex-start',
    marginBottom: '0.875rem',
  },
  cardTitle: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 700,
    color: 'var(--color-text)',
    margin: 0,
  },
  cardSub: {
    fontSize: '0.68rem',
    color: 'var(--color-text-muted)',
    margin: '3px 0 0 0',
  },
  verTodos: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    color: 'var(--color-primary-700)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    whiteSpace: 'nowrap',
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
    fontFamily: 'var(--font-base)',
  },
};
