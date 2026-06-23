const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/**
 * Cliente HTTP base para todas las llamadas al backend.
 * Inyecta automáticamente el JWT de sessionStorage en el header Authorization.
 * Lanza un Error con el mensaje del servidor si el status no es 2xx.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const jwt = sessionStorage.getItem('dd_jwt');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data?.error ?? 'Error del servidor');
    (err as Error & { status: number }).status = res.status;
    throw err;
  }

  return data as T;
}

export const get  = <T>(url: string) => apiRequest<T>(url);
export const post = <T>(url: string, body: unknown) =>
  apiRequest<T>(url, { method: 'POST', body: JSON.stringify(body) });
export const put  = <T>(url: string, body: unknown) =>
  apiRequest<T>(url, { method: 'PUT', body: JSON.stringify(body) });
export const patch = <T>(url: string, body: unknown) =>
  apiRequest<T>(url, { method: 'PATCH', body: JSON.stringify(body) });
export const del  = <T>(url: string) =>
  apiRequest<T>(url, { method: 'DELETE' });

export const client = { get, post, put, patch, delete: del };
