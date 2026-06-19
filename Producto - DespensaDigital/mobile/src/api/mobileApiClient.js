/**
 * mobileApiClient.js
 * Cliente HTTP autenticado para las pantallas nativas de DespensaDigital.
 * El JWT se pasa como parámetro en cada llamada (sin AsyncStorage).
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_BASE = Platform.OS === 'web'
  ? 'http://localhost:3001'
  : (Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:3001');

async function req(endpoint, jwt, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
  return data;
}

export const createApiClient = (jwt) => ({
  // Patologías
  getPatologias:     ()           => req('/api/patologias', jwt),
  crearPatologia:    (body)       => req('/api/patologias', jwt, { method:'POST', body: JSON.stringify(body) }),
  togglePatologia:   (id, activa) => req(`/api/patologias/${id}`, jwt, { method:'PATCH', body: JSON.stringify({ patologia_activa: activa }) }),
  eliminarPatologia: (id)         => req(`/api/patologias/${id}`, jwt, { method:'DELETE' }),

  // Lista de compras
  getLista:         ()                    => req('/api/lista-compras', jwt),
  generarLista:     ()                    => req('/api/lista-compras/generar', jwt, { method:'POST', body:'{}' }),
  agregarItem:      (id_producto, cant)   => req('/api/lista-compras', jwt, { method:'POST', body: JSON.stringify({ id_producto, cantidad_producto: cant }) }),
  toggleItem:       (id, estado)          => req(`/api/lista-compras/${id}`, jwt, { method:'PATCH', body: JSON.stringify({ estado_lista: estado }) }),
  eliminarItem:     (id)                  => req(`/api/lista-compras/${id}`, jwt, { method:'DELETE' }),

  // Productos (para selector en lista manual)
  getProductos:     ()                    => req('/api/productos', jwt),
});
