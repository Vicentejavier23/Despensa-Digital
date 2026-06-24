import { render, screen } from '@testing-library/react';
import MetricCard from '../components/MetricCard';

describe('MetricCard — renderizado de métricas', () => {
  test('muestra el título y el valor correctamente', () => {
    render(<MetricCard titulo="Productos" valor={5} emoji="📦" />);
    expect(screen.getByText('Productos')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('muestra el subtítulo cuando se provee', () => {
    render(<MetricCard titulo="Alertas" valor={2} emoji="⚠️" subtitulo="Requieren atención" />);
    expect(screen.getByText('Requieren atención')).toBeInTheDocument();
  });

  test('no muestra subtítulo cuando no se provee', () => {
    render(<MetricCard titulo="Total" valor={10} emoji="📊" />);
    expect(screen.queryByText('Requieren atención')).not.toBeInTheDocument();
  });
});
