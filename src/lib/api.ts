const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000/api';

const TOKEN_KEY = 'sijuknis_auth_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** fetch() wrapper that attaches the JWT and resolves against API_BASE. */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export { API_BASE };

/**
 * Consume a Server-Sent Events stream via fetch()+ReadableStream (not EventSource),
 * so an AbortController can cancel it mid-flight. Direct port of silebah's
 * streamSSE() (frontend/templates/analisis.html).
 */
export async function streamSSE(
  path: string,
  handlers: {
    onStart?: (data: any) => void;
    onLog?: (data: any) => void;
    onResult?: (data: any) => void;
    onCancel?: (data: any) => void;
    onError?: (message: string) => void;
  },
  signal?: AbortSignal
): Promise<void> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { headers, signal });
  if (!res.body) {
    handlers.onError?.('Tidak ada respons dari server.');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let currentEvent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const t = line.trimEnd();
      if (t.startsWith('event:')) {
        currentEvent = t.slice(6).trim();
      } else if (t.startsWith('data:')) {
        let data: any;
        try {
          data = JSON.parse(t.slice(5).trim());
        } catch {
          continue;
        }
        if (currentEvent === 'start') handlers.onStart?.(data);
        else if (currentEvent === 'log') handlers.onLog?.(data);
        else if (currentEvent === 'result') handlers.onResult?.(data);
        else if (currentEvent === 'cancelled') handlers.onCancel?.(data);
        else if (currentEvent === 'error') handlers.onError?.(data.error || data.message || JSON.stringify(data));
      }
    }
  }
}
