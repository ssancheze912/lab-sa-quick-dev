import { http, HttpResponse } from 'msw'
import type { Cliente } from '@/modules/crm/clientes/domain/Cliente'

export const seedClientes: Cliente[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Acme Corp',
    nit: '900123456-7',
    telefono: '+57 300 111 1111',
    ciudad: 'Cali',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Beta Distribuciones',
    nit: '800987654-3',
    telefono: '+57 301 222 2222',
    ciudad: 'Bogotá',
    createdAt: '2026-06-02T10:00:00Z',
    updatedAt: '2026-06-02T10:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Gamma Industrial',
    nit: '901234567-8',
    telefono: '+57 302 333 3333',
    ciudad: 'Medellín',
    createdAt: '2026-06-03T10:00:00Z',
    updatedAt: '2026-06-03T10:00:00Z',
  },
]

// Mutable seed so tests exercising create can observe list changes.
// `resetClienteState()` runs in setup.ts `afterEach` to isolate tests.
let currentClientes: Cliente[] = [...seedClientes]

export function resetClienteState() {
  currentClientes = [...seedClientes]
}

export const handlers = [
  http.get('*/api/v1/clientes', () => HttpResponse.json(currentClientes)),
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    const cliente = currentClientes.find((c) => c.id === params.id)
    if (!cliente) {
      return HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
          title: 'Cliente no encontrado',
          status: 404,
          detail: `No existe ningún cliente con id ${String(params.id)}.`,
          instance: `/api/v1/clientes/${String(params.id)}`,
        },
        { status: 404 },
      )
    }
    return HttpResponse.json(cliente)
  }),
  http.post('*/api/v1/clientes', async ({ request }) => {
    const body = (await request.json()) as {
      nombre?: string
      nit?: string
      telefono?: string
      ciudad?: string
    }

    // Duplicate NIT fast-path: matches uk_clientes_nit semantics.
    // Body shape mirrors ASP.NET's `Results.Problem(extensions: ...)`, which
    // FLATTENS the extensions dictionary into the response root (no nested
    // `extensions` key). Keeping the mock aligned prevents contract drift
    // between test doubles and the real backend.
    if (body.nit && currentClientes.some((c) => c.nit === body.nit)) {
      return HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.10',
          title: 'NIT/RUC duplicado',
          status: 409,
          detail: 'Ya existe un cliente con el NIT/RUC indicado.',
          instance: '/api/v1/clientes',
          field: 'nit',
        },
        { status: 409 },
      )
    }

    const now = new Date().toISOString()
    const created: Cliente = {
      id: crypto.randomUUID(),
      nombre: (body.nombre ?? '').trim(),
      nit: (body.nit ?? '').trim(),
      telefono: (body.telefono ?? '').trim(),
      ciudad: (body.ciudad ?? '').trim(),
      createdAt: now,
      updatedAt: now,
    }
    currentClientes = [created, ...currentClientes]
    return HttpResponse.json(created, {
      status: 201,
      headers: { Location: `/api/v1/clientes/${created.id}` },
    })
  }),
  http.put('*/api/v1/clientes/:id', async ({ params, request }) => {
    const id = String(params.id)
    const body = (await request.json()) as {
      nombre?: string
      nit?: string
      telefono?: string
      ciudad?: string
    }

    const existing = currentClientes.find((c) => c.id === id)
    if (!existing) {
      return HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5',
          title: 'Cliente no encontrado',
          status: 404,
          detail: `No existe ningún cliente con id ${id}.`,
          instance: `/api/v1/clientes/${id}`,
        },
        { status: 404 },
      )
    }

    // Duplicate NIT: only conflicts against a DIFFERENT cliente row.
    // Same NIT on the same row is allowed (matches uk_clientes_nit + Postgres
    // ON CONFLICT semantics — the row that "owns" the value is the one being
    // updated, so no violation).
    if (
      body.nit &&
      currentClientes.some((c) => c.id !== id && c.nit === body.nit)
    ) {
      return HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.10',
          title: 'NIT/RUC duplicado',
          status: 409,
          detail: 'Ya existe un cliente con el NIT/RUC indicado.',
          instance: `/api/v1/clientes/${id}`,
          field: 'nit',
        },
        { status: 409 },
      )
    }

    const now = new Date().toISOString()
    const updated: Cliente = {
      ...existing,
      nombre: (body.nombre ?? existing.nombre).trim(),
      nit: (body.nit ?? existing.nit).trim(),
      telefono: (body.telefono ?? existing.telefono).trim(),
      ciudad: (body.ciudad ?? existing.ciudad).trim(),
      // createdAt is IMMUTABLE audit — never overwritten (matches backend).
      createdAt: existing.createdAt,
      updatedAt: now,
    }
    currentClientes = currentClientes.map((c) => (c.id === id ? updated : c))
    return HttpResponse.json(updated, { status: 200 })
  }),
]
