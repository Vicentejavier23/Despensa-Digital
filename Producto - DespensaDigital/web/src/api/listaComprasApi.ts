import { client } from './client';
import type { ItemLista } from '../types';

export const listaComprasApi = {
  listar:       ()                                      => client.get<ItemLista[]>('/api/lista-compras'),
  agregar:      (id_producto: number, cantidad: number) =>
    client.post('/api/lista-compras', { id_producto, cantidad_producto: cantidad }),
  generar:      ()                                      => client.post('/api/lista-compras/generar', {}),
  toggleEstado: (id: number, estado: boolean)           =>
    client.patch(`/api/lista-compras/${id}`, { estado_lista: estado }),
  eliminar:     (id: number)                            => client.delete(`/api/lista-compras/${id}`),
};
