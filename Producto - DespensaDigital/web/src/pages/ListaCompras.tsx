import React, { useEffect, useState } from 'react';
import { listaComprasApi } from '../api/listaComprasApi';
import EmptyState from '../components/EmptyState';
import type { ItemLista } from '../types';

export default function ListaCompras() {
  const [items, setItems] = useState<ItemLista[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<Set<number>>(new Set());

  useEffect(() => {
    listaComprasApi.listar()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /**
   * Toggle con animación de tachado:
   * El estado visual cambia instantáneamente (optimistic).
   * La línea de tachado se anima via CSS transition.
   */
  async function handleToggle(id: number, estadoActual: boolean) {
    if (toggling.has(id)) return;

    // Optimistic: cambio inmediato
    setItems(prev =>
      prev.map(it => it.id_lista === id ? { ...it, estado_lista: !estadoActual } : it)
    );
    setToggling(prev => new Set(prev).add(id));

    try {
      await listaComprasApi.toggleEstado(id, !estadoActual);
    } catch {
      // Revertir
      setItems(prev =>
        prev.map(it => it.id_lista === id ? { ...it, estado_lista: estadoActual } : it)
      );
      alert('No se pudo actualizar el item.');
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  async function handleEliminar(id: number) {
    try {
      await listaComprasApi.eliminar(id);
      setItems(prev => prev.filter(it => it.id_lista !== id));
    } catch { alert('No se pudo eliminar el item.'); }
  }

  async function handleLimpiarComprados() {
    const comprados = items.filter(it => it.estado_lista);
    if (comprados.length === 0) return;
    if (!confirm(`¿Eliminar ${comprados.length} items comprados?`)) return;
    try {
      await Promise.all(comprados.map(it => listaComprasApi.eliminar(it.id_lista)));
      setItems(prev => prev.filter(it => !it.estado_lista));
    } catch { alert('No se pudo limpiar la lista.'); }
  }

  const pendientes = items.filter(it => !it.estado_lista);
  const comprados  = items.filter(it =>  it.estado_lista);

  if (loading) return <Skeleton />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease both' }}>
      {/* Encabezado */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.75rem', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={pageTitle}>🛒 Lista de compras</h1>
          <p style={pageSubtitle}>
            {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''} · {comprados.length} comprado{comprados.length !== 1 ? 's' : ''}
          </p>
        </div>
        {comprados.length > 0 && (
          <button onClick={handleLimpiarComprados} style={btnDanger}>
            🗑 Limpiar comprados
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          emoji="🛒"
          titulo="Lista vacía"
          descripcion="No tienes productos en tu lista. Agrégalos cuando un producto esté por vencer o agotarse."
        />
      ) : (
        <>
          {/* ── Pendientes ── */}
          {pendientes.length > 0 && (
            <Seccion titulo="Por comprar" items={pendientes}
              onToggle={handleToggle} onEliminar={handleEliminar} toggling={toggling} />
          )}

          {/* ── Comprados ── */}
          {comprados.length > 0 && (
            <Seccion titulo="Comprados ✓" items={comprados}
              onToggle={handleToggle} onEliminar={handleEliminar} toggling={toggling} dimmed />
          )}
        </>
      )}
    </div>
  );
}

// ── Subcomponente sección ──────────────────────────────────────
interface SeccionProps {
  titulo: string;
  items: ItemLista[];
  onToggle: (id: number, actual: boolean) => void;
  onEliminar: (id: number) => void;
  toggling: Set<number>;
  dimmed?: boolean;
}

function Seccion({ titulo, items, onToggle, onEliminar, toggling, dimmed }: SeccionProps) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{
        fontWeight: 700,
        color: 'var(--color-text-muted)', marginBottom: '0.75rem',
        textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 'var(--font-size-xs)',
      }}>{titulo}</h2>

      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        {items.map((item, idx) => (
          <ItemRow
            key={item.id_lista}
            item={item}
            onToggle={onToggle}
            onEliminar={onEliminar}
            toggling={toggling}
            dimmed={dimmed}
            isLast={idx === items.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// ── Fila individual ────────────────────────────────────────────
interface ItemRowProps {
  item: ItemLista;
  onToggle: (id: number, actual: boolean) => void;
  onEliminar: (id: number) => void;
  toggling: Set<number>;
  dimmed?: boolean;
  isLast: boolean;
}

function ItemRow({ item, onToggle, onEliminar, toggling, dimmed, isLast }: ItemRowProps) {
  const isToggling = toggling.has(item.id_lista);
  const comprado = item.estado_lista;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '0.875rem 1.125rem',
      borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
      opacity: dimmed ? 0.6 : 1,
      transition: 'opacity 0.2s ease',
      animation: 'fadeIn 0.2s ease both',
    }}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id_lista, comprado)}
        disabled={isToggling}
        style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          border: `2px solid ${comprado ? 'var(--color-primary-600)' : 'var(--color-border)'}`,
          background: comprado ? 'var(--color-primary-600)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease', cursor: isToggling ? 'wait' : 'pointer',
        }}
      >
        {comprado && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
      </button>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Nombre con animación de tachado */}
        <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
          <span style={{
            fontSize: 'var(--font-size-sm)', fontWeight: 700,
            color: comprado ? 'var(--color-text-muted)' : 'var(--color-text)',
            transition: 'color 0.2s ease',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            display: 'block',
          }}>
            {item.nombre_producto}
          </span>
          {/* Línea de tachado animada */}
          <span style={{
            position: 'absolute', top: '50%', left: 0, height: 2,
            background: 'var(--color-text-muted)',
            borderRadius: 'var(--radius-full)',
            width: comprado ? '100%' : '0%',
            transition: 'width 0.3s ease',
          }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            {item.marca_producto}
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-light)' }}>·</span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            ×{item.cantidad_producto}
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px',
            borderRadius: 'var(--radius-full)',
            background: item.tipo_lista === 'AUTOMATICA' ? '#DBEAFE' : '#F3F4F6',
            color: item.tipo_lista === 'AUTOMATICA' ? '#1E40AF' : '#6B7280',
          }}>
            {item.tipo_lista === 'AUTOMATICA' ? '🤖 Auto' : 'Manual'}
          </span>
        </div>
      </div>

      {/* Eliminar */}
      <button
        onClick={() => onEliminar(item.id_lista)}
        style={{ color: '#D1D5DB', fontSize: '0.9rem', padding: 4, transition: 'color var(--transition)', flexShrink: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
        onMouseLeave={e => (e.currentTarget.style.color = '#D1D5DB')}
        title="Quitar de la lista"
      >✕</button>
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <div style={{ height:36, width:220, background:'#E5E7EB', borderRadius:8, marginBottom:8 }} className="animate-pulse" />
      {[...Array(5)].map((_,i) => (
        <div key={i} style={{ height:64, background:'#E5E7EB', borderRadius:12, marginBottom:8 }} className="animate-pulse" />
      ))}
    </div>
  );
}

const pageTitle: React.CSSProperties = { fontSize:'var(--font-size-3xl)', fontWeight:800, color:'var(--color-text)' };
const pageSubtitle: React.CSSProperties = { color:'var(--color-text-muted)', marginTop:4, fontSize:'var(--font-size-sm)' };
const btnDanger: React.CSSProperties = { padding:'0.5rem 1rem', borderRadius:'var(--radius-md)', background:'#FEE2E2', color:'#991B1B', fontSize:'var(--font-size-sm)', fontWeight:700, transition:'background var(--transition)' };
