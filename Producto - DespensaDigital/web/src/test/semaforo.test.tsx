import { render, screen } from '@testing-library/react';
import SemaforoVencimiento, { calcularEstadoVencimiento } from '../components/SemaforoVencimiento';

function fechaEnDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().split('T')[0];
}

describe('calcularEstadoVencimiento — lógica pura', () => {
  test('producto vencido (fecha pasada) → estado "vencido"', () => {
    expect(calcularEstadoVencimiento(fechaEnDias(-1))).toBe('vencido');
  });

  test('producto próximo a vencer (≤7 días) → estado "proximo"', () => {
    expect(calcularEstadoVencimiento(fechaEnDias(5))).toBe('proximo');
  });

  test('producto vigente (>7 días) → estado "ok"', () => {
    expect(calcularEstadoVencimiento(fechaEnDias(30))).toBe('ok');
  });
});

describe('SemaforoVencimiento — renderizado de etiquetas', () => {
  test('muestra etiqueta "Vencido" para producto vencido', () => {
    render(<SemaforoVencimiento fechaVencimiento={fechaEnDias(-1)} />);
    expect(screen.getByText('Vencido')).toBeInTheDocument();
  });

  test('muestra etiqueta "Próximo" para producto próximo a vencer', () => {
    render(<SemaforoVencimiento fechaVencimiento={fechaEnDias(3)} />);
    expect(screen.getByText('Próximo')).toBeInTheDocument();
  });

  test('muestra etiqueta "Vigente" para producto vigente', () => {
    render(<SemaforoVencimiento fechaVencimiento={fechaEnDias(30)} />);
    expect(screen.getByText('Vigente')).toBeInTheDocument();
  });
});
