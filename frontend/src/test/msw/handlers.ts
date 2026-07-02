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

export const handlers = [
  http.get('*/api/v1/clientes', () => HttpResponse.json(seedClientes)),
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    const cliente = seedClientes.find((c) => c.id === params.id)
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
]
