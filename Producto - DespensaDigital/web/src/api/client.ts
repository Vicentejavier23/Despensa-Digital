
// Error de API con el código HTTP para poder mostrar mensajes amigables
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint
    .replace(/^\/?api\//i, '')
    .replace(/^\/?api/i, '')
    .replace(/^\//, '');
  const url = `/api/${cleanEndpoint}`;
  const token = sessionStorage.getItem('dd_jwt');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    // Intentar leer el mensaje que envía el backend (JSON { error/message } o texto)
    let serverMsg = '';
    try {
      const body = await response.clone().json();
      serverMsg = body?.error || body?.message || body?.mensaje || '';
    } catch {
      try { serverMsg = await response.text(); } catch { /* noop */ }
    }
    throw new ApiError(response.status, serverMsg || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function get<T = any>(endpoint: string, options?: RequestInit) {
  return request<T>(endpoint, { ...options, method: 'GET' });
}

export function post<T = any>(endpoint: string, data?: any, options?: RequestInit) {
  return request<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function put<T = any>(endpoint: string, data?: any, options?: RequestInit) {
  return request<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function patch<T = any>(endpoint: string, data?: any, options?: RequestInit) {
  return request<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function del<T = any>(endpoint: string, options?: RequestInit) {
  return request<T>(endpoint, { ...options, method: 'DELETE' });
}

export { del as delete };
