import { get, post, put, del } from './client';
import type { Producto, MetricasDashboard } from '../types';

export const productosApi = {
  listar: () =>
    get<Producto[]>('/api/productos'),

  crear: (data: Omit<Producto, 'id_producto'>) =>
    post<Producto>('/api/productos', data),

  actualizar: (id: number, data: Partial<Producto>) =>
    put<Producto>(`/api/productos/${id}`, data),

  eliminar: (id: number) =>
    del<{ mensaje: string }>(`/api/productos/${id}`),

  metricas: () =>
    get<MetricasDashboard>('/api/productos/metricas'),
};
