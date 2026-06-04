import React from 'react';

interface Props {
  titulo: string;
  valor: number | string;
  emoji: string;
  color?: string;   // hex o CSS var
  subtitulo?: string;
  alerta?: boolean; // borde rojo si hay alertas
}

export default function MetricCard({ titulo, valor, emoji, color = 'var(--color-primary-800)', subtitulo, alerta }: Props) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem 1.5rem',
      boxShadow: 'var(--shadow-sm)',
      borderLeft: `4px solid ${alerta ? 'var(--color-danger)' : color}`,
      display: 'flex', alignItems: 'center', gap: '1rem',
      animation: 'fadeIn 0.3s ease both',
      transition: 'box-shadow var(--transition)',
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
    >
      {/* Ícono */}
      <div style={{
        width: 52, height: 52, borderRadius: 'var(--radius-md)',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.6rem', flexShrink: 0,
      }}>{emoji}</div>

      {/* Texto */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--font-size-3xl)', fontWeight: 800,
          color: alerta ? 'var(--color-danger)' : color,
          lineHeight: 1.1,
        }}>{valor}</div>
        <div style={{
          fontSize: 'var(--font-size-sm)', fontWeight: 600,
          color: 'var(--color-text)', marginTop: 2,
        }}>{titulo}</div>
        {subtitulo && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 1 }}>
            {subtitulo}
          </div>
        )}
      </div>
    </div>
  );
}
