import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '../api/client';
import EmptyState from '../components/EmptyState';

interface AlertaProducto {
  id_producto:      number;
  nombre_producto:  string;
  marca_producto:   string;
  fecha_vencimiento: string;
  cantidad_unidad:  number;
  stock_minimo:     number;
  tipo_producto:    string;
  nombre_categoria: string | null;
  tipo_almacenaje:  string | null;
  dias_restantes:   number | null;
  tipo_alerta:      'VENCIMIENTO' | 'STOCK_BAJO';
}

interface AlertasData {
  configuracion: { dias_vencimiento: number; incluye_stock_bajo: boolean };
  total_alertas: number;
  por_vencer:    AlertaProducto[];
  stock_bajo:    AlertaProducto[];
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function Alertas() {
  const navigate = useNavigate();
  const [data,    setData]    = useState<AlertasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dias,    setDias]    = useState(7);
  const [error,   setError]   = useState('');

  const cargar = async (d: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await get<AlertasData>(`/api/alertas?dias=${d}`);
      setData(res);
    } catch {
      setError('No se pudieron cargar las alertas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(dias); }, []);

  const handleDias = (d: number) => {
    setDias(d);
    cargar(d);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease both' }}>

      {/* Encabezado */}
      <div style={s.header}>
        <div>
          <h1 style={s.titulo}>Alertas</h1>
          <p style={s.subtitulo}>
            {data ? `${data.total_alertas} alerta${data.total_alertas !== 1 ? 's' : ''} activa${data.total_alertas !== 1 ? 's' : ''}` : 'Cargando...'}
          </p>
        </div>
        {/* Selector de días */}
        <div style={s.diasSelector}>
          <span style={s.diasLabel}>Vencimiento próximos</span>
          <div style={s.diasBtns}>
            {[3, 5, 7, 14, 30].map(d => (
              <button
                key={d}
                style={{ ...s.diasBtn, ...(dias === d ? s.diasBtnActive : {}) }}
                onClick={() => handleDias(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={s.errorBox}>{error}</div>
      )}

      {loading ? (
        <SkeletonAlertas />
      ) : !data || data.total_alertas === 0 ? (
        <EmptyState
          emoji="✅"
          titulo="Sin alertas"
          descripcion="Tu despensa está al día. No hay productos próximos a vencer ni con stock bajo."
          accion={<button style={s.btnPrimary} onClick={() => navigate('/inventario')}>Ver inventario</button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Vencimiento */}
          {data.por_vencer.length > 0 && (
            <section>
              <div style={s.seccionHeader}>
                <div style={{ ...s.seccionDot, background: '#D97706' }} />
                <h2 style={s.seccionTitulo}>Próximos a vencer</h2>
                <span style={s.seccionCount}>{data.por_vencer.length}</span>
              </div>
              <div style={s.listaAlertas}>
                {data.por_vencer.map(p => (
                  <div key={p.id_producto} style={{ ...s.alertaCard, borderLeft: '4px solid #D97706' }}>
                    <div style={s.alertaCardTop}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.alertaNombre}>{p.nombre_producto}</div>
                        <div style={s.alertaMarca}>{p.marca_producto} · {p.tipo_producto}</div>
                      </div>
                      <span style={{ ...s.badge, background: '#FEF9C3', color: '#92400E' }}>
                        {p.dias_restantes === 0 ? 'Vence hoy' : `${p.dias_restantes}d`}
                      </span>
                    </div>
                    <div style={s.alertaCardBottom}>
                      <span style={s.alertaDetalle}>Vence el {formatFecha(p.fecha_vencimiento)}</span>
                      <span style={s.alertaDetalle}>Stock: {p.cantidad_unidad} unidades</span>
                      {p.tipo_almacenaje && <span style={s.alertaDetalle}>{p.tipo_almacenaje}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Stock bajo */}
          {data.stock_bajo.length > 0 && (
            <section>
              <div style={s.seccionHeader}>
                <div style={{ ...s.seccionDot, background: '#DC2626' }} />
                <h2 style={s.seccionTitulo}>Stock bajo</h2>
                <span style={s.seccionCount}>{data.stock_bajo.length}</span>
              </div>
              <div style={s.listaAlertas}>
                {data.stock_bajo.map(p => (
                  <div key={p.id_producto} style={{ ...s.alertaCard, borderLeft: '4px solid #DC2626' }}>
                    <div style={s.alertaCardTop}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.alertaNombre}>{p.nombre_producto}</div>
                        <div style={s.alertaMarca}>{p.marca_producto} · {p.tipo_producto}</div>
                      </div>
                      <span style={{ ...s.badge, background: '#FEE2E2', color: '#991B1B' }}>
                        {p.cantidad_unidad}/{p.stock_minimo}
                      </span>
                    </div>
                    <div style={s.alertaCardBottom}>
                      <span style={s.alertaDetalle}>Tiene {p.cantidad_unidad} unidad{p.cantidad_unidad !== 1 ? 'es' : ''} (mínimo: {p.stock_minimo})</span>
                      {p.tipo_almacenaje && <span style={s.alertaDetalle}>{p.tipo_almacenaje}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <button style={s.btnListaCompras} onClick={() => navigate('/lista-compras')}>
                Generar lista de compras
              </button>
            </section>
          )}

        </div>
      )}
    </div>
  );
}

function SkeletonAlertas() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ height: 80, background: '#E5E7EB', borderRadius: 12, animation: 'shimmer 1.5s infinite' }} />
      ))}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: '1.5rem',
  },
  titulo: {
    fontSize: 'var(--font-size-3xl)',
    fontWeight: 800,
    color: 'var(--color-text)',
    margin: 0,
  },
  subtitulo: {
    color: 'var(--color-text-muted)',
    marginTop: 4,
    fontSize: 'var(--font-size-sm)',
  },
  diasSelector: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  diasLabel: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  diasBtns: {
    display: 'flex',
    gap: 4,
  },
  diasBtn: {
    padding: '4px 10px',
    borderRadius: 20,
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-surface)',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    fontFamily: 'var(--font-base)',
  },
  diasBtnActive: {
    background: 'var(--color-primary-800)',
    color: '#fff',
    borderColor: 'var(--color-primary-800)',
  },
  errorBox: {
    background: '#FEF2F2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: 10,
    fontSize: 'var(--font-size-sm)',
    marginBottom: 16,
    border: '1px solid #FECACA',
  },
  seccionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  seccionDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
  },
  seccionTitulo: {
    fontSize: 'var(--font-size-base)',
    fontWeight: 700,
    color: 'var(--color-text)',
    margin: 0,
    flex: 1,
  },
  seccionCount: {
    background: 'var(--color-border)',
    color: 'var(--color-text-muted)',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 20,
  },
  listaAlertas: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  alertaCard: {
    background: 'var(--color-surface)',
    borderRadius: 10,
    padding: '12px 14px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  alertaCardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  alertaCardBottom: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px 12px',
  },
  alertaNombre: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 700,
    color: 'var(--color-text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  alertaMarca: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginTop: 1,
  },
  alertaDetalle: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
  },
  badge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 20,
    whiteSpace: 'nowrap',
    flexShrink: 0,
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
  btnListaCompras: {
    marginTop: 10,
    padding: '0.6rem 1.25rem',
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
