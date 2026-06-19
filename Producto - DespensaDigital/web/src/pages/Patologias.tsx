import React, { useEffect, useState } from 'react';
import { patologiasApi } from '../api/patologiasApi';
import EmptyState from '../components/EmptyState';
import type { Patologia } from '../types';

const TIPOS = ['Crónica', 'Alérgica', 'Intolerancia', 'Otra'] as const;

const TIPO_COLORES: Record<string, { bg: string; color: string }> = {
  'Crónica':      { bg: '#FEE2E2', color: '#991B1B' },
  'Alérgica':     { bg: '#FEF9C3', color: '#92400E' },
  'Intolerancia': { bg: '#DBEAFE', color: '#1E40AF' },
  'Otra':         { bg: '#F3E8FF', color: '#6B21A8' },
};

const FORM_INICIAL = { nombre_patologia: '', tipo_patologia: 'Crónica', fecha_diagnostico: '' };

export default function Patologias() {
  const [patologias, setPatologias]   = useState<Patologia[]>([]);
  const [loading, setLoading]         = useState(true);
  const [toggling, setToggling]       = useState<Set<number>>(new Set());
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm]               = useState(FORM_INICIAL);
  const [guardando, setGuardando]     = useState(false);
  const [errForm, setErrForm]         = useState('');

  useEffect(() => {
    patologiasApi.listar()
      .then(setPatologias)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre_patologia.trim()) { setErrForm('El nombre es obligatorio'); return; }
    setGuardando(true); setErrForm('');
    try {
      const nueva = await patologiasApi.crear({
        nombre_patologia:  form.nombre_patologia.trim(),
        tipo_patologia:    form.tipo_patologia,
        fecha_diagnostico: form.fecha_diagnostico || undefined,
        patologia_activa:  true,
        USUARIO_id_usuario: 0, // el backend lo toma del JWT
      } as any);
      setPatologias(prev => [nueva, ...prev]);
      setForm(FORM_INICIAL);
      setMostrarForm(false);
    } catch { setErrForm('No se pudo guardar. Intenta de nuevo.'); }
    finally { setGuardando(false); }
  }

  async function handleToggle(id: number, activaActual: boolean) {
    if (toggling.has(id)) return;
    setPatologias(prev => prev.map(p => p.id_patologias === id ? { ...p, patologia_activa: !activaActual } : p));
    setToggling(prev => new Set(prev).add(id));
    try {
      await patologiasApi.toggleActiva(id, !activaActual);
    } catch {
      setPatologias(prev => prev.map(p => p.id_patologias === id ? { ...p, patologia_activa: activaActual } : p));
      alert('No se pudo actualizar la patología. Intenta de nuevo.');
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Eliminar esta patología?')) return;
    try {
      await patologiasApi.eliminar(id);
      setPatologias(prev => prev.filter(p => p.id_patologias !== id));
    } catch { alert('No se pudo eliminar.'); }
  }

  const activas   = patologias.filter(p => p.patologia_activa);
  const inactivas = patologias.filter(p => !p.patologia_activa);

  if (loading) return <Skeleton />;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease both' }}>
      {/* ── Encabezado ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.75rem', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={pageTitle}>🩺 Patologías</h1>
          <p style={pageSubtitle}>Gestiona tus condiciones de salud para recibir alertas personalizadas.</p>
        </div>
        <button
          onClick={() => { setMostrarForm(v => !v); setErrForm(''); }}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            background: mostrarForm ? '#F3F4F6' : 'var(--color-primary-600)',
            color: mostrarForm ? 'var(--color-text)' : '#fff',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            transition: 'all var(--transition)',
          }}
        >
          {mostrarForm ? '✕ Cancelar' : '+ Nueva patología'}
        </button>
      </div>

      {/* ── Formulario nueva patología ── */}
      {mostrarForm && (
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1.75rem',
          border: '1.5px solid var(--color-primary-600)',
          animation: 'fadeIn 0.2s ease both',
        }}>
          <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-text)' }}>
            Nueva patología
          </h2>
          <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Nombre */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={labelStyle}>Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: Diabetes tipo 2"
                  value={form.nombre_patologia}
                  onChange={e => setForm(f => ({ ...f, nombre_patologia: e.target.value }))}
                  style={inputStyle}
                  disabled={guardando}
                  autoFocus
                />
              </div>
              {/* Tipo */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={labelStyle}>Tipo *</label>
                <select
                  value={form.tipo_patologia}
                  onChange={e => setForm(f => ({ ...f, tipo_patologia: e.target.value }))}
                  style={inputStyle}
                  disabled={guardando}
                >
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {/* Fecha diagnóstico */}
            <div style={{ display:'flex', flexDirection:'column', gap:4, maxWidth:280 }}>
              <label style={labelStyle}>Fecha de diagnóstico <span style={{ color:'var(--color-text-muted)' }}>(opcional)</span></label>
              <input
                type="date"
                value={form.fecha_diagnostico}
                onChange={e => setForm(f => ({ ...f, fecha_diagnostico: e.target.value }))}
                style={inputStyle}
                disabled={guardando}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {errForm && (
              <p style={{ color: '#DC2626', fontSize: 'var(--font-size-sm)', margin: 0 }}>⚠ {errForm}</p>
            )}
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button
                type="button"
                onClick={() => { setMostrarForm(false); setForm(FORM_INICIAL); setErrForm(''); }}
                style={{ padding:'0.5rem 1rem', borderRadius:'var(--radius-md)', background:'#F3F4F6', color:'var(--color-text)', fontWeight:600, fontSize:'var(--font-size-sm)' }}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{ padding:'0.5rem 1.25rem', borderRadius:'var(--radius-md)', background:'var(--color-primary-600)', color:'#fff', fontWeight:700, fontSize:'var(--font-size-sm)', opacity: guardando ? 0.7 : 1 }}
                disabled={guardando}
              >
                {guardando ? 'Guardando…' : 'Guardar patología'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Lista ── */}
      {patologias.length === 0 ? (
        <EmptyState
          emoji="🩺"
          titulo="Sin patologías registradas"
          descripcion="No tienes condiciones de salud registradas. Usa el botón '+ Nueva patología' para agregar una."
        />
      ) : (
        <>
          <Grupo titulo="Activas" items={activas} onToggle={handleToggle} onEliminar={handleEliminar} toggling={toggling} emptyMsg="No tienes patologías activas." />
          <Grupo titulo="Inactivas / Resueltas" items={inactivas} onToggle={handleToggle} onEliminar={handleEliminar} toggling={toggling} emptyMsg="No tienes patologías inactivas." dimmed />
        </>
      )}
    </div>
  );
}

// ── Subcomponentes ────────────────────────────────────────────
interface GrupoProps {
  titulo: string; items: Patologia[];
  onToggle: (id: number, actual: boolean) => void;
  onEliminar: (id: number) => void;
  toggling: Set<number>; emptyMsg: string; dimmed?: boolean;
}

function Grupo({ titulo, items, onToggle, onEliminar, toggling, emptyMsg, dimmed }: GrupoProps) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize:'var(--font-size-lg)', fontWeight:700, color:'var(--color-text)', marginBottom:'1rem' }}>
        {titulo}
        <span style={{ marginLeft:8, fontSize:'var(--font-size-sm)', fontWeight:600, color:'var(--color-text-muted)' }}>
          ({items.length})
        </span>
      </h2>
      {items.length === 0 ? (
        <p style={{ color:'var(--color-text-muted)', fontSize:'var(--font-size-sm)', padding:'0.75rem 0' }}>{emptyMsg}</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {items.map(p => {
            const colores = TIPO_COLORES[p.tipo_patologia] ?? TIPO_COLORES['Otra'];
            const isToggling = toggling.has(p.id_patologias);
            return (
              <div key={p.id_patologias} style={{
                background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                padding: '1rem 1.25rem', boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'center', gap: '1rem',
                opacity: dimmed ? 0.65 : 1, transition: 'opacity var(--transition)',
                animation: 'fadeIn 0.25s ease both',
              }}>
                <span style={{ padding:'4px 10px', borderRadius:'var(--radius-full)', background:colores.bg, color:colores.color, fontSize:'var(--font-size-xs)', fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}>
                  {p.tipo_patologia}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'var(--font-size-sm)', color:'var(--color-text)' }}>{p.nombre_patologia}</div>
                  {p.fecha_diagnostico && (
                    <div style={{ fontSize:'var(--font-size-xs)', color:'var(--color-text-muted)', marginTop:2 }}>
                      Diagnóstico: {new Date(p.fecha_diagnostico).toLocaleDateString('es-CL')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onToggle(p.id_patologias, p.patologia_activa)}
                  disabled={isToggling}
                  title={p.patologia_activa ? 'Marcar como inactiva' : 'Marcar como activa'}
                  style={{ width:44, height:24, borderRadius:'var(--radius-full)', background:p.patologia_activa ? 'var(--color-primary-600)' : '#D1D5DB', position:'relative', flexShrink:0, cursor:isToggling ? 'wait' : 'pointer', transition:'background 0.2s ease', opacity:isToggling ? 0.6 : 1 }}
                >
                  <span style={{ position:'absolute', top:3, left:p.patologia_activa ? 'calc(100% - 21px)' : 3, width:18, height:18, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', transition:'left 0.2s ease' }} />
                </button>
                <button
                  onClick={() => onEliminar(p.id_patologias)}
                  style={{ color:'#9CA3AF', fontSize:'1rem', padding:4, transition:'color var(--transition)' }}
                  onMouseEnter={e => (e.currentTarget.style.color='#EF4444')}
                  onMouseLeave={e => (e.currentTarget.style.color='#9CA3AF')}
                  title="Eliminar"
                >🗑</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <div style={{ height:36, width:200, background:'#E5E7EB', borderRadius:8, marginBottom:8 }} />
      {[...Array(3)].map((_,i) => <div key={i} style={{ height:70, background:'#E5E7EB', borderRadius:16, marginBottom:12 }} />)}
    </div>
  );
}

const pageTitle: React.CSSProperties   = { fontSize:'var(--font-size-3xl)', fontWeight:800, color:'var(--color-text)' };
const pageSubtitle: React.CSSProperties = { color:'var(--color-text-muted)', marginTop:4, fontSize:'var(--font-size-sm)' };
const labelStyle: React.CSSProperties  = { fontSize:'var(--font-size-sm)', fontWeight:600, color:'var(--color-text)' };
const inputStyle: React.CSSProperties  = { padding:'0.5rem 0.75rem', borderRadius:'var(--radius-md)', border:'1.5px solid var(--color-border)', fontSize:'var(--font-size-sm)', color:'var(--color-text)', background:'var(--color-bg)', width:'100%', boxSizing:'border-box' as const };
