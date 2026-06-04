import React from 'react';
import type { EstadoVencimiento } from '../types';

interface Props {
  fechaVencimiento: string; // ISO YYYY-MM-DD
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Calcula el estado de vencimiento de un producto:
 *  - 'vencido'  → rojo   (fecha pasada)
 *  - 'proximo'  → ámbar  (vence en 1-7 días)
 *  - 'ok'       → verde  (más de 7 días)
 */
export function calcularEstadoVencimiento(fechaISO: string): EstadoVencimiento {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaISO);
  vence.setHours(0, 0, 0, 0);
  const diffDias = Math.floor((vence.getTime() - hoy.getTime()) / 86_400_000);

  if (diffDias < 0)  return 'vencido';
  if (diffDias <= 7) return 'proximo';
  return 'ok';
}

const CONFIG: Record<EstadoVencimiento, { bg: string; color: string; dot: string; label: string }> = {
  ok:      { bg: '#DCFCE7', color: '#15803D', dot: '#22C55E', label: 'Vigente'  },
  proximo: { bg: '#FEF9C3', color: '#92400E', dot: '#F59E0B', label: 'Próximo'  },
  vencido: { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444', label: 'Vencido'  },
};

export default function SemaforoVencimiento({ fechaVencimiento, showLabel = true, size = 'md' }: Props) {
  const estado = calcularEstadoVencimiento(fechaVencimiento);
  const { bg, color, dot, label } = CONFIG[estado];
  const padding = size === 'sm' ? '2px 8px' : '4px 10px';
  const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      backgroundColor: bg, color,
      borderRadius: 'var(--radius-full)',
      padding, fontSize, fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: dot, flexShrink: 0 }} />
      {showLabel && label}
    </span>
  );
}
