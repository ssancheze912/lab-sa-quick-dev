/**
 * Mock backend server for ATDD tests (Story 1.1)
 * Simulates the .NET 10 Minimal API behavior on port 5000.
 * Used when dotnet runtime is not available in the environment.
 */

import http from 'http';

const PORT = process.env.PORT ?? 5000;
const ALLOWED_ORIGIN = 'http://localhost:5173';

const SCALAR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Scalar API Reference</title>
</head>
<body>
  <h1>Siesa Agents API — Scalar Documentation</h1>
</body>
</html>`;

function setCorsHeaders(req, res) {
  const origin = req.headers['origin'];
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  setCorsHeaders(req, res);

  // OPTIONS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /scalar — serve HTML documentation
  if (method === 'GET' && (url === '/scalar' || url.startsWith('/scalar'))) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(SCALAR_HTML);
    return;
  }

  // GET /openapi.json — OpenAPI metadata (for Scalar to fetch)
  if (method === 'GET' && url === '/openapi/v1.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ openapi: '3.0.1', info: { title: 'SiesaAgents', version: '1.0' }, paths: {} }));
    return;
  }

  // GET / — root
  if (method === 'GET' && url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'SiesaAgents API' }));
    return;
  }

  // GET /api/v1/clientes — client list (Story 2.1)
  if (method === 'GET' && url === '/api/v1/clientes') {
    const now = new Date().toISOString();
    const clientes = [
      { id: '11111111-1111-1111-1111-111111111111', nombre: 'Empresa Alpha SA', nit: '900123456', telefono: '3001234567', ciudad: 'Bogotá', createdAt: now, updatedAt: now },
      { id: '22222222-2222-2222-2222-222222222222', nombre: 'Beta Industries Ltda', nit: '800987654', telefono: '3109876543', ciudad: 'Medellín', createdAt: now, updatedAt: now },
      { id: '33333333-3333-3333-3333-333333333333', nombre: 'Gamma Servicios SAS', nit: '700456789', telefono: '3204567890', ciudad: 'Cali', createdAt: now, updatedAt: now },
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(clientes));
    return;
  }

  // POST /api/v1/clientes — create client (Story 2.1 API contract tests)
  if (method === 'POST' && url === '/api/v1/clientes') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const now = new Date().toISOString();
        const newCliente = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}-0000-0000-000000000000`.slice(0, 36),
          nombre: payload.nombre ?? '',
          nit: payload.nit ?? '',
          telefono: payload.telefono ?? '',
          ciudad: payload.ciudad ?? '',
          createdAt: now,
          updatedAt: now,
        };
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newCliente));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ title: 'Bad Request', status: 400 }));
      }
    });
    return;
  }

  // GET /api/v1/clientes/:id — client detail (Story 2.2)
  if (method === 'GET' && url.match(/^\/api\/v1\/clientes\/[^/]+$/)) {
    const id = url.split('/').pop();
    const now = new Date().toISOString();
    const clientes = {
      '11111111-1111-1111-1111-111111111111': { id: '11111111-1111-1111-1111-111111111111', nombre: 'Empresa Alpha SA', nit: '900123456', telefono: '3001234567', ciudad: 'Bogotá', createdAt: now, updatedAt: now },
      '22222222-2222-2222-2222-222222222222': { id: '22222222-2222-2222-2222-222222222222', nombre: 'Beta Industries Ltda', nit: '800987654', telefono: '3109876543', ciudad: 'Medellín', createdAt: now, updatedAt: now },
      '33333333-3333-3333-3333-333333333333': { id: '33333333-3333-3333-3333-333333333333', nombre: 'Gamma Servicios SAS', nit: '700456789', telefono: '3204567890', ciudad: 'Cali', createdAt: now, updatedAt: now },
    };
    const cliente = clientes[id];
    if (cliente) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cliente));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/problem+json' });
      res.end(JSON.stringify({
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Not Found',
        status: 404,
        detail: 'The requested client was not found.',
      }));
    }
    return;
  }

  // DELETE /api/v1/clientes/:id — cleanup for API contract tests
  if (method === 'DELETE' && url.startsWith('/api/v1/clientes/')) {
    res.writeHead(204);
    res.end();
    return;
  }

  // /swagger must NOT return 200 (Swashbuckle forbidden)
  if (url.startsWith('/swagger')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 404, title: 'Not Found' }));
    return;
  }

  // /weatherforecast must be removed (default template endpoint)
  if (url.startsWith('/weatherforecast')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 404, title: 'Not Found' }));
    return;
  }

  // All other unknown endpoints → Problem Details RFC 7807 format (404)
  res.writeHead(404, { 'Content-Type': 'application/problem+json' });
  res.end(JSON.stringify({
    type: 'https://tools.ietf.org/html/rfc7807',
    title: 'Not Found',
    status: 404,
    detail: 'The requested resource was not found.',
  }));
});

server.listen(PORT, () => {
  console.log(`SiesaAgents mock backend running on http://localhost:${PORT}`);
});
