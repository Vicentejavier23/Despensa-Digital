/**
 * geoApi.js — API geográfica para la app móvil.
 *
 * NOTA: Desde v4 el formulario de registro en la app móvil NO solicita
 * datos de ubicación (se completan en la app web).
 * Este módulo se mantiene por compatibilidad futura o si se requiere
 * mostrar datos de ubicación al usuario autenticado.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:3001'
  : (Constants.expoConfig?.extra?.apiBaseUrl ?? 'http://localhost:3001');

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!res.ok) throw new Error(`Error ${res.status} al cargar ${endpoint}`);
  return res.json();
}

export const getPaises   = ()           => apiGet('/api/geo/paises');
export const getRegiones = (id_pais)    => apiGet(`/api/geo/regiones?id_pais=${id_pais}`);
export const getCiudades = (id_region)  => apiGet(`/api/geo/ciudades?id_region=${id_region}`);
export const getComunas  = (id_ciudad)  => apiGet(`/api/geo/comunas?id_ciudad=${id_ciudad}`);
