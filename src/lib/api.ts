const API_URL_FALLBACK = 'http://localhost:8085/api/v1';

export const getBaseUrl = (): string => import.meta.env.API_URL || API_URL_FALLBACK;

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

interface FetchOptions extends RequestInit {
  timeout?: number;
  /** Bearer token; sent as `Authorization: Bearer <token>`. */
  token?: string;
}

async function fetchApi<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { timeout = 10000, token, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || `Error ${response.status}`,
        ...data,
      };
    }

    return { data };
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      return { error: 'Tiempo de espera agotado' };
    }

    return { error: err.message || 'Error de conexión' };
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),
};