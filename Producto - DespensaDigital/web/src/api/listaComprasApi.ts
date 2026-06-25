import { get, post, patch, del } from './client';
import type { ItemLista } from '../types';

export const listaComprasApi = {
  listar:       ()                                      => get<ItemLista[]>('/api/lista-compras'),
  agregar:      (id_producto: number, cantidad: number) =>
    post('/api/lista-compras', { id_producto, cantidad_producto: cantidad }),
  generar:      ()                                      => post('/api/lista-compras/generar', {}),
  toggleEstado: (id: number, estado: boolean)           =>
    patch(`/api/lista-compras/${id}`, { estado_lista: estado }),
  eliminar:     (id: number)                            => del(`/api/lista-compras/${id}`),
};