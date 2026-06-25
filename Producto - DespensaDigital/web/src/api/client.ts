// Asegúrate de exportar correctamente lo que tus otros componentes consumen
export const client = {
  async request(endpoint: string, options: RequestInit = {}) {
    // 1. Limpieza absoluta con expresiones regulares seguras
    const cleanEndpoint = endpoint
      .replace(/^\/?api\//i, '')  // Quita "api/" o "/api/" al inicio
      .replace(/^\/?api/i, '')   // Quita "api" o "/api" sueltos
      .replace(/^\//, '');        // Remueve cualquier barra diagonal inicial sobrante

    // 2. Construcción de la URL usando el proxy relativo de Vercel
    const url = `/api/${cleanEndpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }

    return response.json();
  },

  // Simplificadores para que no fallen las exportaciones de get, post, etc.
  get(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },
  
  post(endpoint: string, data?: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put(endpoint: string, data?: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch(endpoint: string, data?: any, options?: RequestInit) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  del(endpoint: string, options?: RequestInit) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};
