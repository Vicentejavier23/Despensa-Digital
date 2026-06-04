import { get, post, patch, del } from './client';
import type { Patologia } from '../types';

export const patologiasApi = {
  listar: () =>
    get<Patologia[]>('/api/patologias'),

  crear: (data: Omit<Patologia, 'id_patologias'>) =>
    post<Patologia>('/api/patologias', data),

  // CORRECCIÓN: El endpoint es PATCH /api/patologias/:id (no /toggle)
  toggleActiva: (id: number, activa: boolean) =>
    patch<Patologia>(`/api/patologias/${id}`, { patologia_activa: activa }),

  actualizar: (id: number, data: Partial<Patologia>) =>
    patch<Patologia>(`/api/patologias/${id}`, data),

  eliminar: (id: number) =>
    del<{ mensaje: string }>(`/api/patologias/${id}`),
};
