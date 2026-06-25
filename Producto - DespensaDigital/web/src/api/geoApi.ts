import type { Pais, Region, Ciudad, Comuna } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

async function geoFetch<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error('Error al cargar datos geográficos');
  return res.json() as Promise<T>;
}

export const getPaises   = ()                  => geoFetch<Pais[]>('/api/geo/paises');
export const getRegiones = (id_pais: number)   => geoFetch<Region[]>(`/api/geo/regiones?id_pais=${id_pais}`);
export const getCiudades = (id_region: number) => geoFetch<Ciudad[]>(`/api/geo/ciudades?id_region=${id_region}`);
export const getComunas  = (id_ciudad: number) => geoFetch<Comuna[]>(`/api/geo/comunas?id_ciudad=${id_ciudad}`);