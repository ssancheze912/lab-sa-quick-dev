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
