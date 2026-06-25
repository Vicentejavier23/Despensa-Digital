const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

function buildUrl(endpoint: string): string {
  const path = endpoint.replace(/^\/?api\//, '').replace(/^\/+/, '');
  if (BASE && BASE !== '/api') {
    // Absolute base (e.g. http://localhost:3001 or full Railway URL for local prod builds)
    return `${BASE}/api/${path}`;
  }
  // Relative /api/... — handled by Vite proxy in dev or Vercel rewrite in prod
  return `/api/${path}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const jwt = sessionStorage.getItem('dd_jwt');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

  const res = await fetch(buildUrl(endpoint), { ...options, headers });

  let data: any = {};
  try { data = await res.json(); } catch {}

  if (!res.ok) {
    const err = new Error(data?.error ?? 'Error del servidor');
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return data as T;
}

export const get   = <T>(url: string) => apiRequest<T>(url);
export const post  = <T>(url: string, body: unknown) => apiRequest<T>(url, { method: 'POST', body: JSON.stringify(body) });
export const put   = <T>(url: string, body: unknown) => apiRequest<T>(url, { method: 'PUT', body: JSON.stringify(body) });
export const patch = <T>(url: string, body: unknown) => apiRequest<T>(url, { method: 'PATCH', body: JSON.stringify(body) });
export const del   = <T>(url: string) => apiRequest<T>(url, { method: 'DELETE' });

export const client = { get, post, put, patch, delete: del };
