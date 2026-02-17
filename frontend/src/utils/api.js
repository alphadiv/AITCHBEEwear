/**
 * API base URL for backend. In dev (Vite proxy) leave empty.
 * In production set VITE_API_URL to your backend URL (e.g. https://your-api.onrender.com).
 */
export function getApiBase() {
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
}

/** Full URL for backend-served assets (e.g. /uploads/xxx). Use for img src in production. */
export function getAssetUrl(path) {
  if (!path || typeof path !== 'string') return path;
  if (path.startsWith('/uploads/')) return getApiBase() + path;
  return path;
}

/** Safe JSON parse from Response; avoids "Unexpected end of JSON input" on 405/HTML. */
export async function safeJson(res) {
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json') || !text.trim()) {
    if (text.trimStart().startsWith('<')) {
      throw new Error('API not reachable. Set VITE_API_URL to your backend URL in production.');
    }
    throw new Error('Invalid server response');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid server response');
  }
}
