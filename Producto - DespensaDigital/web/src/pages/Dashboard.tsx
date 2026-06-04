import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productosApi } from '../api/productosApi';
import MetricCard from '../components/MetricCard';
import SemaforoVencimiento from '../components/SemaforoVencimiento';
import EmptyState from '../components/EmptyState';
import type { MetricasDashboard, Producto } from '../types';

export default function Dashboard() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [metricas, setMetricas] = useState<MetricasDashboard | null>(null);
  const [proximos, setProximos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [met, prods] = await Promise.all([
          productosApi.metricas(),
          productosApi.listar(),
        ]);
        if (cancelado) return;
        setMetricas(met);
        // Mostrar los 5 productos más próximos a vencer (que no estén vencidos)
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        const filtrados = prods
          .filter(p => new Date(p.fecha_vencimiento) >= hoy)
          .sort((a, b) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())
          .slice(0, 5);
        setProximos(filtrados);
      } catch {
        if (!cancelado) setError('No se pudieron cargar los datos del dashboard.');
      } finally {
        if (!cancelado) setLoading(false);
      }
    })();
    return () => { cancelado = true; };
  }, []);

  const saludo = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (loading) return <Skeleton />;

  if (error) return (
    <EmptyState emoji="⚠️" titulo="Error al cargar" descripcion={error}
      accion={<button onClick={() => window.location.reload()} style={btnStyle}>Reintentar</button>}
    />
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease both' }}>
      {/* Encabezado */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: 'var(--color-text)' }}>
          {saludo()}, {usuario?.pri_nom_usuario} 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
          Aquí tienes el resumen de tu despensa.
        </p>
      </div>

      {/* Métricas — 4 tarjetas */}
      <div style={gridMetricas}>
        <MetricCard
          titulo="Productos totales"
          valor={metricas?.total_productos ?? 0}
          emoji="📦"
          color="var(--color-primary-800)"
        />
        <MetricCard
          titulo="Próximos a vencer"
          valor={metricas?.proximos_vencer ?? 0}
          emoji="⏳"
          color="var(--color-warning)"
          subtitulo="En los próximos 7 días"
          alerta={(metricas?.proximos_vencer ?? 0) > 0}
        />
        <MetricCard
          titulo="Vencidos"
          valor={metricas?.vencidos ?? 0}
          emoji="🚫"
          color="var(--color-danger)"
          alerta={(metricas?.vencidos ?? 0) > 0}
        />
        <MetricCard
          titulo="Lista de compras"
          valor={metricas?.items_lista_pendiente ?? 0}
          emoji="🛒"
          color="var(--color-primary-600)"
          subtitulo="Items pendientes"
        />
      </div>

      {/* Próximos a vencer */}
      <div style={card}>
        <div style={cardHeader}>
          <h2 style={cardTitulo}>⏳ Próximos a vencer</h2>
          <button onClick={() => navigate('/inventario')} style={linkBtn}>
            Ver todos →
          </button>
        </div>

        {proximos.length === 0 ? (
          <EmptyState emoji="✅" titulo="¡Todo en orden!" descripcion="No hay productos próximos a vencer." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tabla}>
              <thead>
                <tr>
                  {['Producto', 'Marca', 'Cantidad', 'Vence'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proximos.map((p, i) => (
                  <tr key={p.id_producto}
                    style={{ background: i % 2 === 0 ? 'transparent' : 'var(--color-primary-50)' }}>
                    <td style={td}><strong>{p.nombre_producto}</strong></td>
                    <td style={td}>{p.marca_producto}</td>
                    <td style={td}>{p.cantidad_unidad}</td>
                    <td style={td}>
                      <SemaforoVencimiento fechaVencimiento={p.fecha_vencimiento} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Skeleton de carga ──────────────────────────────────────────
function Skeleton() {
  return (
    <div>
      <div style={{ height: 36, width: 280, background: '#E5E7EB', borderRadius: 8, marginBottom: 8 }} className="animate-pulse" />
      <div style={{ height: 20, width: 200, background: '#E5E7EB', borderRadius: 6, marginBottom: 28 }} className="animate-pulse" />
      <div style={gridMetricas}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 100, background: '#E5E7EB', borderRadius: 16 }} className="animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ── Estilos inline ─────────────────────────────────────────────
const gridMetricas: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '1rem',
  marginBottom: '1.75rem',
};
const card: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-lg)',
  padding: '1.25rem 1.5rem',
  boxShadow: 'var(--shadow-sm)',
};
const cardHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', marginBottom: '1rem',
};
const cardTitulo: React.CSSProperties = {
  fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text)',
};
const linkBtn: React.CSSProperties = {
  fontSize: 'var(--font-size-sm)', fontWeight: 600,
  color: 'var(--color-primary-700)',
};
const tabla: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse',
};
const th: React.CSSProperties = {
  textAlign: 'left', padding: '0.5rem 0.75rem',
  fontSize: 'var(--font-size-xs)', fontWeight: 700,
  color: 'var(--color-text-muted)', textTransform: 'uppercase',
  letterSpacing: '0.05em', borderBottom: '2px solid var(--color-border)',
};
const td: React.CSSProperties = {
  padding: '0.65rem 0.75rem',
  fontSize: 'var(--font-size-sm)', color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
};
const btnStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-md)',
  background: 'var(--color-primary-800)', color: '#fff',
  fontSize: 'var(--font-size-sm)', fontWeight: 700,
};
