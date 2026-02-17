/**
 * Vercel serverless proxy: forwards /api/* to BACKEND_URL.
 * Set BACKEND_URL in Vercel (e.g. https://your-api.onrender.com) so login/auth work.
 */
export default async function handler(req, res) {
  const backend = process.env.BACKEND_URL || process.env.VITE_API_URL;
  if (!backend) {
    res.status(503).setHeader('Content-Type', 'application/json').end(
      JSON.stringify({ error: 'Backend not configured. Set BACKEND_URL in Vercel environment variables.' })
    );
    return;
  }
  const base = backend.replace(/\/$/, '');
  const pathSegments = req.query.path || [];
  const apiPath = '/api' + (pathSegments.length ? '/' + pathSegments.join('/') : '');
  const url = base + apiPath;
  const headers = {};
  ['authorization', 'content-type'].forEach((k) => {
    if (req.headers[k]) headers[k] = req.headers[k];
  });
  if (req.method !== 'GET' && req.method !== 'HEAD' && !headers['content-type']) headers['content-type'] = 'application/json';
  const fetchOpts = { method: req.method || 'GET', headers };
  if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.body) {
    fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }
  try {
    const r = await fetch(url, fetchOpts);
    const text = await r.text();
    res.status(r.status);
    const ct = r.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    res.end(text);
  } catch (e) {
    res.status(502).setHeader('Content-Type', 'application/json').end(
      JSON.stringify({ error: 'Backend unreachable', message: e.message })
    );
  }
}
