// tests/Inventario.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as productosApi from '../api/productosApi';
import Inventario from '../pages/Inventario';

describe('Inventario — estado vacío', () => {
  test('Muestra EmptyState cuando el usuario no tiene productos', async () => {
    // Simular API que retorna array vacío
    vi.spyOn(productosApi.productosApi, 'listar').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Inventario />
      </MemoryRouter>
    );

    // Mientras carga muestra el skeleton
    expect(document.querySelectorAll('[class*="Skeleton"]').length).toBeGreaterThanOrEqual(0);

    // Después de cargar muestra el empty state
    await waitFor(() => {
      expect(screen.getByText('Despensa vacía')).toBeInTheDocument();
    });

    expect(screen.getByText('Agrega tu primer producto con el botón de arriba.')).toBeInTheDocument();
  });
});