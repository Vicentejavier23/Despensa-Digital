import React, { useEffect, useState } from 'react';
import { listaComprasApi } from '../api/listaComprasApi';
import { productosApi }    from '../api/productosApi';
import EmptyState from '../components/EmptyState';
import type { ItemLista, Producto } from '../types';

export default function ListaCompras() {
  const [items, setItems]           = useState<ItemLista[]>([]);
  const [productos, setProductos]   = useState<Producto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [toggling, setToggling]     = useState<Set<number>>(new Set());
  const [generando, setGenerando]   = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [selProd, setSelProd]       = useState('');
  const [cantidad, setCantidad]     = useState('1');
  const [agregando, setAgregando]   = useState(false);
  const [banner, setBanner]         = useState<{ msg: string; tipo: 'ok' | 'warn' } | null>(null);

  useEffect(() => {
    Promise.all([
      listaComprasApi.listar(),
      productosApi.listar(),
    ])
      .then(([lista, prods]) => { setItems(lista); setProductos(prods); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function mostrarBanner(msg: string, tipo: 'ok' | 'warn' = 'ok') {
    setBanner({ msg, tipo });
    setTimeout(() => setBanner(null), 4000);
  }

  // ── Generar automáticamente (RF-09) ────────────────────────
  async function handleGenerar() {
    setGenerando(true);
    try {
      const res: any = await listaComprasApi.generar();
      if (res.insertados === 0) {
        mostrarBanner('✅ Todos los productos tienen stock suficiente. No se agregaron items.', 'warn');
      } else {
        const nuevos = res.items.map((it: any) => ({
          ...it,
          marca_producto: '',
          cantidad_unidad: 0,
          stock_minimo: 0,
          estado_lista: false,
        }));
        setItems(prev => [...nuevos, ...prev]);
        mostrarBanner(`🤖 ${res.insertados} producto(s) agregados automáticamente por stock bajo.`);
      }
    } catch { mostrarBanner('Error al generar la lista. Intenta de nuevo.', 'warn'); }
    finally { setGenerando(false); }
    // Recargar para tener datos completos
    listaComprasApi.listar().then(setItems).catch(() => {});
  }

  // ── Agregar manual ──────────────────────────────────────────
  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault();
    if (!selProd) return;
    const cant = parseInt(cantidad, 10);
    if (isNaN(cant) || cant < 1) return;
    setAgregando(true);
    try {
      await listaComprasApi.agregar(parseInt(selProd, 10), cant);
      await listaComprasApi.listar().then(setItems);
      setSelProd(''); setCantidad('1'); setMostrarForm(false);
      mostrarBanner('✅ Producto agregado a la lista.');
    } catch { mostrarBanner('No se pudo agregar. Intenta de nuevo.', 'warn'); }
    finally { setAgregando(false); }
  }

  // ── Toggle ──────────────────────────────────────────────────
  async function handleToggle(id: number, estadoActual: boolean) {
    if (toggling.has(id)) return;
    setItems(prev => prev.map(it => it.id_lista === id ? { ...it, estado_lista: !estadoActual } : it));
    setToggling(prev => new Set(prev).add(id));
    try {
      await listaComprasApi.toggleEstado(id, !estadoActual);
    } catch {
      setItems(prev => prev.map(it => it.id_lista === id ? { ...it, estado_lista: estadoActual } : it));
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
      {/* ── Encabezado ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={pageTitle}>🛒 Lista de compras</h1>
          <p style={pageSubtitle}>
            {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''} · {comprados.length} comprado{comprados.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          <button
            onClick={handleGenerar}
            disabled={generando}
            style={{ padding:'0.55rem 1rem', borderRadius:'var(--radius-md)', background:'#EFF6FF', color:'#1D4ED8', fontWeight:700, fontSize:'var(--font-size-sm)', transition:'all var(--transition)', opacity:generando ? 0.7:1 }}
          >
            {generando ? '⏳ Generando…' : '🤖 Generar automáticamente'}
          </button>
          <button
            onClick={() => setMostrarForm(v => !v)}
            style={{ padding:'0.55rem 1rem', borderRadius:'var(--radius-md)', background:mostrarForm ? '#F3F4F6':'var(--color-primary-600)', color:mostrarForm ? 'var(--color-text)':'#fff', fontWeight:700, fontSize:'var(--font-size-sm)', transition:'all var(--transition)' }}
          >
            {mostrarForm ? '✕ Cancelar' : '+ Agregar producto'}
          </button>
          {comprados.length > 0 && (
            <button onClick={handleLimpiarComprados} style={btnDanger}>🗑 Limpiar comprados</button>
          )}
        </div>
      </div>

      {/* ── Banner feedback ── */}
      {banner && (
        <div style={{
          padding:'0.75rem 1rem', borderRadius:'var(--radius-md)', marginBottom:'1rem',
          background: banner.tipo === 'ok' ? '#F0FDF4' : '#FFFBEB',
          color:       banner.tipo === 'ok' ? '#166534'  : '#92400E',
          border:`1px solid ${banner.tipo === 'ok' ? '#BBF7D0' : '#FDE68A'}`,
          fontSize:'var(--font-size-sm)', fontWeight:600,
          animation:'fadeIn 0.2s ease both',
        }}>
          {banner.msg}
        </div>
      )}

      {/* ── Formulario agregar manual ── */}
      {mostrarForm && (
        <div style={{
          background:'var(--color-surface)', borderRadius:'var(--radius-lg)',
          padding:'1.25rem', boxShadow:'var(--shadow-sm)', marginBottom:'1.25rem',
          border:'1.5px solid var(--color-primary-600)', animation:'fadeIn 0.2s ease both',
        }}>
          <form onSubmit={handleAgregar} style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'flex-end' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4, flex:2, minWidth:200 }}>
              <label style={labelStyle}>Producto *</label>
              <select
                value={selProd}
                onChange={e => setSelProd(e.target.value)}
                style={inputStyle}
                disabled={agregando}
                required
              >
                <option value="">— Selecciona un producto —</option>
                {productos.map(p => (
                  <option key={p.id_producto} value={p.id_producto}>
                    {p.nombre_producto} {p.marca_producto !== 'Sin marca' ? `· ${p.marca_producto}` : ''} (stock: {p.cantidad_unidad})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, width:100 }}>
              <label style={labelStyle}>Cantidad</label>
              <input
                type="number" min="1" value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                style={inputStyle} disabled={agregando}
              />
            </div>
            <button
              type="submit" disabled={agregando || !selProd}
              style={{ padding:'0.5rem 1.25rem', borderRadius:'var(--radius-md)', background:'var(--color-primary-600)', color:'#fff', fontWeight:700, fontSize:'var(--font-size-sm)', opacity:agregando || !selProd ? 0.6 : 1, height:38 }}
            >
              {agregando ? 'Agregando…' : 'Agregar'}
            </button>
          </form>
          {productos.length === 0 && (
            <p style={{ color:'var(--color-text-muted)', fontSize:'var(--font-size-xs)', marginTop:'0.5rem' }}>
              No tienes productos en el inventario. Agrega productos primero.
            </p>
          )}
        </div>
      )}

      {/* ── Lista ── */}
      {items.length === 0 ? (
        <EmptyState
          emoji="🛒"
          titulo="Lista vacía"
          descripcion="Usa '🤖 Generar automáticamente' para detectar productos con stock bajo, o agrega items manualmente."
        />
      ) : (
        <>
          {pendientes.length > 0 && (
            <Seccion titulo="Por comprar" items={pendientes} onToggle={handleToggle} onEliminar={handleEliminar} toggling={toggling} />
          )}
          {comprados.length > 0 && (
            <Seccion titulo="Comprados ✓" items={comprados} onToggle={handleToggle} onEliminar={handleEliminar} toggling={toggling} dimmed />
          )}
        </>
      )}
    </div>
  );
}

// ── Subcomponentes ─────────────────────────────────────────────
interface SeccionProps {
  titulo: string; items: ItemLista[];
  onToggle: (id: number, actual: boolean) => void;
  onEliminar: (id: number) => void;
  toggling: Set<number>; dimmed?: boolean;
}

function Seccion({ titulo, items, onToggle, onEliminar, toggling, dimmed }: SeccionProps) {
  return (
    <div style={{ marginBottom:'1.5rem' }}>
      <h2 style={{ fontWeight:700, color:'var(--color-text-muted)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em', fontSize:'var(--font-size-xs)' }}>
        {titulo}
      </h2>
      <div style={{ background:'var(--color-surface)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow-sm)', overflow:'hidden' }}>
        {items.map((item, idx) => (
          <ItemRow key={item.id_lista} item={item} onToggle={onToggle} onEliminar={onEliminar} toggling={toggling} dimmed={dimmed} isLast={idx === items.length - 1} />
        ))}
      </div>
    </div>
  );
}

interface ItemRowProps {
  item: ItemLista; onToggle: (id: number, actual: boolean) => void;
  onEliminar: (id: number) => void; toggling: Set<number>; dimmed?: boolean; isLast: boolean;
}

function ItemRow({ item, onToggle, onEliminar, toggling, dimmed, isLast }: ItemRowProps) {
  const isToggling = toggling.has(item.id_lista);
  const comprado = item.estado_lista;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.875rem 1.125rem', borderBottom:isLast ? 'none' : '1px solid var(--color-border)', opacity:dimmed ? 0.6:1, transition:'opacity 0.2s ease', animation:'fadeIn 0.2s ease both' }}>
      <button
        onClick={() => onToggle(item.id_lista, comprado)} disabled={isToggling}
        style={{ width:22, height:22, borderRadius:6, flexShrink:0, border:`2px solid ${comprado ? 'var(--color-primary-600)' : 'var(--color-border)'}`, background:comprado ? 'var(--color-primary-600)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s ease', cursor:isToggling ? 'wait' : 'pointer' }}
      >
        {comprado && <span style={{ color:'#fff', fontSize:'0.75rem', fontWeight:700 }}>✓</span>}
      </button>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ position:'relative', display:'inline-block', maxWidth:'100%' }}>
          <span style={{ fontSize:'var(--font-size-sm)', fontWeight:700, color:comprado ? 'var(--color-text-muted)':'var(--color-text)', transition:'color 0.2s ease', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'block' }}>
            {item.nombre_producto}
          </span>
          <span style={{ position:'absolute', top:'50%', left:0, height:2, background:'var(--color-text-muted)', borderRadius:'var(--radius-full)', width:comprado ? '100%':'0%', transition:'width 0.3s ease' }} />
        </div>
        <div style={{ display:'flex', gap:8, marginTop:3, flexWrap:'wrap' }}>
          {item.marca_producto && <span style={{ fontSize:'var(--font-size-xs)', color:'var(--color-text-muted)' }}>{item.marca_producto}</span>}
          <span style={{ fontSize:'var(--font-size-xs)', color:'var(--color-text-muted)' }}>×{item.cantidad_producto}</span>
          <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'1px 6px', borderRadius:'var(--radius-full)', background:item.tipo_lista === 'AUTOMATICA' ? '#DBEAFE':'#F3F4F6', color:item.tipo_lista === 'AUTOMATICA' ? '#1E40AF':'#6B7280' }}>
            {item.tipo_lista === 'AUTOMATICA' ? '🤖 Auto' : 'Manual'}
          </span>
        </div>
      </div>
      <button
        onClick={() => onEliminar(item.id_lista)}
        style={{ color:'#D1D5DB', fontSize:'0.9rem', padding:4, transition:'color var(--transition)', flexShrink:0 }}
        onMouseEnter={e => (e.currentTarget.style.color='#EF4444')}
        onMouseLeave={e => (e.currentTarget.style.color='#D1D5DB')}
        title="Quitar de la lista"
      >✕</button>
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <div style={{ height:36, width:220, background:'#E5E7EB', borderRadius:8, marginBottom:8 }} />
      {[...Array(5)].map((_,i) => <div key={i} style={{ height:64, background:'#E5E7EB', borderRadius:12, marginBottom:8 }} />)}
    </div>
  );
}

const pageTitle: React.CSSProperties    = { fontSize:'var(--font-size-3xl)', fontWeight:800, color:'var(--color-text)' };
const pageSubtitle: React.CSSProperties = { color:'var(--color-text-muted)', marginTop:4, fontSize:'var(--font-size-sm)' };
const btnDanger: React.CSSProperties   = { padding:'0.55rem 1rem', borderRadius:'var(--radius-md)', background:'#FEE2E2', color:'#991B1B', fontSize:'var(--font-size-sm)', fontWeight:700, transition:'background var(--transition)' };
const labelStyle: React.CSSProperties  = { fontSize:'var(--font-size-sm)', fontWeight:600, color:'var(--color-text)' };
const inputStyle: React.CSSProperties  = { padding:'0.5rem 0.75rem', borderRadius:'var(--radius-md)', border:'1.5px solid var(--color-border)', fontSize:'var(--font-size-sm)', color:'var(--color-text)', background:'var(--color-bg)', width:'100%', boxSizing:'border-box' as const };
