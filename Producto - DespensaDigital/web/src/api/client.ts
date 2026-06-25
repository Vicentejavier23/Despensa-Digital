
export async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint
    .replace(/^\/?api\//i, '')
    .replace(/^\/?api/i, '')
    .replace(/^\//, '');
  const url = `/api/${cleanEndpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.status}`);
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