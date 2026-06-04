import React, { useEffect, useRef } from 'react';
import type { Producto } from '../types';
import SemaforoVencimiento from './SemaforoVencimiento';

interface Props {
  producto:    Producto | null;
  onCerrar:    () => void;
  onEliminar?: (id: number) => void;
  onEditar?:   (p: Producto) => void;  // nuevo: abrir formulario de edición
}

export default function ProductoModal({ producto, onCerrar, onEliminar, onEditar }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onCerrar]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!producto) return null;

  const filas: [string, React.ReactNode][] = [
    ['Marca',           producto.marca_producto],
    ['Código de barra', producto.cod_barra_producto ?? '—'],
    ['Categoría',       producto.nombre_categoria   ?? '—'],
    ['Tipo',            producto.tipo_producto],
    ['Almacenaje',      producto.tipo_almacenaje    ?? '—'],
    ['Cantidad',        `${producto.cantidad_unidad} unidades`],
    ...(producto.peso_gramos ? [['Peso',    `${producto.peso_gramos} g`]  as [string, React.ReactNode]] : []),
    ...(producto.mililitros  ? [['Volumen', `${producto.mililitros} ml`]  as [string, React.ReactNode]] : []),
    ['Vencimiento', (
      <span style={{ display:'flex', alignItems:'center', gap:8 }}>
        {new Date(producto.fecha_vencimiento).toLocaleDateString('es-CL')}
        <SemaforoVencimiento fechaVencimiento={producto.fecha_vencimiento} size="sm" />
      </span>
    )],
    ...(producto.fecha_apertura ? [['Apertura', new Date(producto.fecha_apertura).toLocaleDateString('es-CL')] as [string, React.ReactNode]] : []),
  ];

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onCerrar(); }}
      style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'fadeIn 0.2s ease both' }}
    >
      <div style={{ background:'var(--color-surface)', borderRadius:'var(--radius-xl)', width:'100%', maxWidth:480, boxShadow:'var(--shadow-lg)', overflow:'hidden', animation:'fadeIn 0.2s ease both' }}>
        {/* Header */}
        <div style={{ background:'var(--color-primary-900)', padding:'1.25rem 1.5rem', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
          <div>
            <h2 style={{ color:'#fff', fontSize:'var(--font-size-xl)', fontWeight:700, margin:0 }}>
              {producto.nombre_producto}
            </h2>
            <p style={{ color:'var(--color-primary-400)', fontSize:'var(--font-size-sm)', margin:'2px 0 0' }}>
              {producto.marca_producto}
            </p>
          </div>
          <button onClick={onCerrar} style={{ color:'rgba(255,255,255,0.7)', fontSize:'1.4rem', lineHeight:1, padding:'2px 6px', borderRadius:'var(--radius-sm)' }}>✕</button>
        </div>

        {/* Tabla de detalles */}
        <div style={{ padding:'1.25rem 1.5rem' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              {filas.map(([campo, valor]) => (
                <tr key={campo as string} style={{ borderBottom:'1px solid var(--color-border)' }}>
                  <td style={{ padding:'0.6rem 0', fontSize:'var(--font-size-sm)', color:'var(--color-text-muted)', fontWeight:600, width:'40%', verticalAlign:'top' }}>{campo}</td>
                  <td style={{ padding:'0.6rem 0', fontSize:'var(--font-size-sm)', color:'var(--color-text)', fontWeight:500 }}>{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Acciones */}
        <div style={{ padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', gap:8, borderTop:'1px solid var(--color-border)', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:8 }}>
            {onEliminar && (
              <button
                onClick={() => { onEliminar(producto.id_producto); onCerrar(); }}
                style={{ padding:'0.6rem 1.25rem', borderRadius:'var(--radius-md)', background:'#FEE2E2', color:'#991B1B', fontSize:'var(--font-size-sm)', fontWeight:700 }}
              >🗑 Eliminar</button>
            )}
            {onEditar && (
              <button
                onClick={() => onEditar(producto)}
                style={{ padding:'0.6rem 1.25rem', borderRadius:'var(--radius-md)', background:'#EFF6FF', color:'#1D4ED8', fontSize:'var(--font-size-sm)', fontWeight:700 }}
              >✏️ Editar</button>
            )}
          </div>
          <button
            onClick={onCerrar}
            style={{ padding:'0.6rem 1.5rem', borderRadius:'var(--radius-md)', background:'var(--color-primary-800)', color:'#fff', fontSize:'var(--font-size-sm)', fontWeight:700 }}
          >Cerrar</button>
        </div>
      </div>
    </div>
  );
}
