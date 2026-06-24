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

// In-memory store for ATDD test data
const now0 = new Date().toISOString();
const clientesStore = new Map([
  ['11111111-1111-1111-1111-111111111111', { id: '11111111-1111-1111-1111-111111111111', nombre: 'Empresa Alpha SA', nit: '900123456', telefono: '3001234567', ciudad: 'Bogotá', createdAt: now0, updatedAt: now0 }],
  ['22222222-2222-2222-2222-222222222222', { id: '22222222-2222-2222-2222-222222222222', nombre: 'Beta Industries Ltda', nit: '800987654', telefono: '3109876543', ciudad: 'Medellín', createdAt: now0, updatedAt: now0 }],
  ['33333333-3333-3333-3333-333333333333', { id: '33333333-3333-3333-3333-333333333333', nombre: 'Gamma Servicios SAS', nit: '700456789', telefono: '3204567890', ciudad: 'Cali', createdAt: now0, updatedAt: now0 }],
]);

const now1 = new Date().toISOString();
const contactosStore = new Map([
  ['aaaaaaaa-0000-0000-0000-000000000001', { id: 'aaaaaaaa-0000-0000-0000-000000000001', nombre: 'Ana García', cargo: 'Gerente Comercial', email: 'ana.garcia@empresa.com', telefono: '3001112233', clienteId: null, createdAt: now1, updatedAt: now1 }],
  ['aaaaaaaa-0000-0000-0000-000000000002', { id: 'aaaaaaaa-0000-0000-0000-000000000002', nombre: 'Carlos López', cargo: 'Director Técnico', email: 'carlos.lopez@beta.com', telefono: '3104445566', clienteId: null, createdAt: now1, updatedAt: now1 }],
  ['aaaaaaaa-0000-0000-0000-000000000003', { id: 'aaaaaaaa-0000-0000-0000-000000000003', nombre: 'María Rodríguez', cargo: 'Analista', email: 'maria.rodriguez@gamma.com', telefono: '3207778899', clienteId: null, createdAt: now1, updatedAt: now1 }],
]);

let idCounter = 0;
function newGuid() {
  idCounter++;
  return `aaaaaaaa-bbbb-cccc-dddd-${String(idCounter).padStart(12, '0')}`;
}

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
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([...clientesStore.values()]));
    return;
  }

  // POST /api/v1/clientes — create client (Stories 2.1, 2.3)
  if (method === 'POST' && url === '/api/v1/clientes') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        // 400 validation: required fields
        const missing = ['nombre', 'nit', 'telefono', 'ciudad'].filter(f => !payload[f]);
        if (missing.length > 0) {
          res.writeHead(400, { 'Content-Type': 'application/problem+json' });
          res.end(JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Validation failed',
            status: 400,
            errors: Object.fromEntries(missing.map(f => [f, [`The ${f} field is required.`]])),
          }));
          return;
        }
        // 409 conflict: duplicate NIT
        const duplicate = [...clientesStore.values()].find(c => c.nit === payload.nit);
        if (duplicate) {
          res.writeHead(409, { 'Content-Type': 'application/problem+json' });
          res.end(JSON.stringify({
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflict',
            status: 409,
            detail: 'El NIT/RUC ya está registrado.',
          }));
          return;
        }
        const now = new Date().toISOString();
        const newCliente = {
          id: newGuid(),
          nombre: payload.nombre,
          nit: payload.nit,
          telefono: payload.telefono,
          ciudad: payload.ciudad,
          createdAt: now,
          updatedAt: now,
        };
        clientesStore.set(newCliente.id, newCliente);
        res.writeHead(201, { 'Content-Type': 'application/json', 'Location': `/api/v1/clientes/${newCliente.id}` });
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
    const cliente = clientesStore.get(id);
    if (cliente) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cliente));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/problem+json' });
      res.end(JSON.stringify({
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Not Found',
        status: 404,
        detail: `Cliente con id '${id}' no fue encontrado.`,
      }));
    }
    return;
  }

  // PUT /api/v1/clientes/:id — update client (Story 2.4)
  if (method === 'PUT' && url.match(/^\/api\/v1\/clientes\/[^/]+$/)) {
    const id = url.split('/').pop();
    // 400 for invalid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id ?? '')) {
      res.writeHead(400, { 'Content-Type': 'application/problem+json' });
      res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Bad Request', status: 400, detail: `'${id}' is not a valid GUID.` }));
      return;
    }
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const existing = clientesStore.get(id);
        if (!existing) {
          res.writeHead(404, { 'Content-Type': 'application/problem+json' });
          res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Not Found', status: 404, detail: `Cliente con id '${id}' no fue encontrado.` }));
          return;
        }
        // 400 validation
        const missing = ['nombre', 'nit', 'telefono', 'ciudad'].filter(f => !payload[f]);
        if (missing.length > 0) {
          res.writeHead(400, { 'Content-Type': 'application/problem+json' });
          res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Validation failed', status: 400, errors: Object.fromEntries(missing.map(f => [f, [`The ${f} field is required.`]])) }));
          return;
        }
        // 409 conflict: duplicate NIT (excluding self)
        const duplicate = [...clientesStore.values()].find(c => c.nit === payload.nit && c.id !== id);
        if (duplicate) {
          res.writeHead(409, { 'Content-Type': 'application/problem+json' });
          res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado.' }));
          return;
        }
        const updated = { ...existing, nombre: payload.nombre, nit: payload.nit, telefono: payload.telefono, ciudad: payload.ciudad, updatedAt: new Date().toISOString() };
        clientesStore.set(id, updated);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updated));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ title: 'Bad Request', status: 400 }));
      }
    });
    return;
  }

  // DELETE /api/v1/clientes/:id — cleanup for API contract tests
  if (method === 'DELETE' && url.startsWith('/api/v1/clientes/')) {
    const id = url.split('/').pop();
    clientesStore.delete(id);
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Contactos endpoints (Story 3.x) ──────────────────────────────────────

  // GET /api/v1/contactos — contact list (Story 3.1)
  if (method === 'GET' && url === '/api/v1/contactos') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([...contactosStore.values()]));
    return;
  }

  // GET /api/v1/contactos/:id — contact detail (Story 3.2)
  if (method === 'GET' && url.match(/^\/api\/v1\/contactos\/[^/]+$/)) {
    const id = url.split('/').pop();
    const contacto = contactosStore.get(id);
    if (contacto) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(contacto));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/problem+json' });
      res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Not Found', status: 404, detail: `Contacto con id '${id}' no fue encontrado.` }));
    }
    return;
  }

  // POST /api/v1/contactos — create contact (Story 3.3)
  if (method === 'POST' && url === '/api/v1/contactos') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const missing = ['nombre', 'cargo', 'email'].filter(f => !payload[f]);
        if (missing.length > 0) {
          res.writeHead(400, { 'Content-Type': 'application/problem+json' });
          res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Validation failed', status: 400, errors: Object.fromEntries(missing.map(f => [f, [`The ${f} field is required.`]])) }));
          return;
        }
        const duplicate = [...contactosStore.values()].find(c => c.email === payload.email);
        if (duplicate) {
          res.writeHead(409, { 'Content-Type': 'application/problem+json' });
          res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Conflict', status: 409, detail: 'El email ya está registrado.' }));
          return;
        }
        const now = new Date().toISOString();
        const newContacto = { id: newGuid(), nombre: payload.nombre, cargo: payload.cargo, email: payload.email, telefono: payload.telefono || null, clienteId: payload.clienteId || null, createdAt: now, updatedAt: now };
        contactosStore.set(newContacto.id, newContacto);
        res.writeHead(201, { 'Content-Type': 'application/json', 'Location': `/api/v1/contactos/${newContacto.id}` });
        res.end(JSON.stringify(newContacto));
      } catch { res.writeHead(400); res.end(); }
    });
    return;
  }

  // PUT /api/v1/contactos/:id — update contact (Story 3.4)
  if (method === 'PUT' && url.match(/^\/api\/v1\/contactos\/[^/]+$/)) {
    const id = url.split('/').pop();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id ?? '')) {
      res.writeHead(400, { 'Content-Type': 'application/problem+json' });
      res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Bad Request', status: 400, detail: `'${id}' is not a valid GUID.` }));
      return;
    }
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const existing = contactosStore.get(id);
        if (!existing) {
          res.writeHead(404, { 'Content-Type': 'application/problem+json' });
          res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Not Found', status: 404, detail: `Contacto con id '${id}' no fue encontrado.` }));
          return;
        }
        const missing = ['nombre', 'cargo', 'email'].filter(f => !payload[f]);
        if (missing.length > 0) {
          res.writeHead(400, { 'Content-Type': 'application/problem+json' });
          res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Validation failed', status: 400, errors: Object.fromEntries(missing.map(f => [f, [`The ${f} field is required.`]])) }));
          return;
        }
        const duplicate = [...contactosStore.values()].find(c => c.email === payload.email && c.id !== id);
        if (duplicate) {
          res.writeHead(409, { 'Content-Type': 'application/problem+json' });
          res.end(JSON.stringify({ type: 'https://tools.ietf.org/html/rfc7807', title: 'Conflict', status: 409, detail: 'El email ya está registrado.' }));
          return;
        }
        const updated = { ...existing, nombre: payload.nombre, cargo: payload.cargo, email: payload.email, telefono: payload.telefono ?? existing.telefono, updatedAt: new Date().toISOString() };
        contactosStore.set(id, updated);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updated));
      } catch { res.writeHead(400); res.end(); }
    });
    return;
  }

  // DELETE /api/v1/contactos/:id — delete contact (Story 3.5)
  if (method === 'DELETE' && url.startsWith('/api/v1/contactos/')) {
    const id = url.split('/').pop();
    contactosStore.delete(id);
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
