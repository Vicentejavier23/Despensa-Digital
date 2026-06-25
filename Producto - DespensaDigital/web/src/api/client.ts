// 1. Función base para limpiar rutas y ejecutar fetch
export async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
  // Limpieza segura de prefijos duplicados
  const cleanEndpoint = endpoint
    .replace(/^\/?api\//i, '')
    .replace(/^\/?api/i, '')
    .replace(/^\//, '');

  const url = `/api/${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Error en la petición: ${response.status}`);
  }

  return response.json();
}

// 2. Exportaciones individuales nombradas
export function get(endpoint: string, options?: RequestInit) {
  return request(endpoint, { ...options, method: 'GET' });
}

export function post(endpoint: string, data?: any, options?: RequestInit) {
  return request(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function put(endpoint: string, data?: any, options?: RequestInit) {
  return request(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function patch(endpoint: string, data?: any, options?: RequestInit) {
  return request(endpoint, {
    ...options,
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export function del(endpoint: string, options?: RequestInit) {
  return request(endpoint, { ...options, method: 'DELETE' });
}

// 3. Soporte para archivos que importen 'delete' de manera directa
export { del as delete };
