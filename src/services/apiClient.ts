// Cliente HTTP base para la API del backend

const API_URL = import.meta.env.VITE_API_URL as string;

if (!API_URL) {
  console.warn('[apiClient] VITE_API_URL no está definida. Las llamadas a la API fallarán.');
}

/**
 * Error personalizado que incluye el status HTTP y el body de la respuesta.
 */
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Error ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Wrapper de fetch que:
 * - Agrega la base URL automáticamente
 * - Serializa el body como JSON
 * - Parsea la respuesta como JSON
 * - Lanza ApiError si la respuesta no es 2xx
 */
export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
  } = {},
): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Intentar parsear la respuesta como JSON
  let data: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    throw new ApiError(response.status, data, typeof data === 'object' && data !== null && 'message' in data ? String((data as Record<string, unknown>).message) : `Error ${response.status}`);
  }

  return data as T;
}
