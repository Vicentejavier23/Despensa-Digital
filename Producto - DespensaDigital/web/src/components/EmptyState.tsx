import React from 'react';

interface Props {
  emoji?: string;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}

export default function EmptyState({ emoji = '📭', titulo, descripcion, accion }: Props) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center',
      animation: 'fadeIn 0.3s ease both',
    }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem', lineHeight: 1 }}>{emoji}</div>
      <h3 style={{
        fontSize: 'var(--font-size-lg)', fontWeight: 700,
        color: 'var(--color-text)', marginBottom: '0.375rem',
      }}>{titulo}</h3>
      {descripcion && (
        <p style={{
          fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)',
          maxWidth: 320, lineHeight: 1.6, marginBottom: '1.25rem',
        }}>{descripcion}</p>
      )}
      {accion}
    </div>
  );
}
