const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function getStoredToken(): string | null {
  try {
    // Primero intentar del backup directo
    const directToken = localStorage.getItem('auth-token');
    if (directToken) return directToken;
    
    // Sino, buscar en el persist de Zustand
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Zustand persist stores { state, version }
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, options: { method?: HttpMethod; body?: any; headers?: Record<string, string> } = {}): Promise<T> {
  const token = getStoredToken();
  const method = options.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('[API] No token found in storage');
  }

  const url = `${BASE_URL}${path}`;
  console.log(`[API] ${method} ${url}`, token ? '(with auth)' : '(no auth)');

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401) {
      console.error('[API] 401 Unauthorized - Token might be invalid or expired');
      // Limpiar auth store si el token es inválido
      const authState = localStorage.getItem('auth-storage');
      if (authState) {
        console.log('[API] Clearing invalid auth state');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    const msg = await res.text().catch(() => 'Request failed');
    throw new Error(msg || `HTTP ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  // @ts-expect-error
  return undefined as T;
}


