// 1. La función base que limpia rutas y ejecuta el fetch
export async function request(endpoint: string, options: RequestInit = {}) {
  const cleanEndpoint = endpoint
    .replace(/^\/?api\//i, '')  // Quita "/api/" o "api/" al inicio
    .replace(/^\/?api/i, '')   // Quita "/api" o "api" sueltos
    .replace(/^\///, '');        // Quita barras iniciales sobrantes

  const url = `/api/${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
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

// 2. Exportaciones individuales nombradas (para patologiasApi, productosApi, etc.)
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

// 3. Mapeo extra para dar soporte a quien busque 'delete' directamente
export { del as delete };
