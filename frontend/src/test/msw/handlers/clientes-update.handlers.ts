/**
 * MSW 2 route handlers for PUT /api/v1/clientes/:id endpoint.
 * Story 2.4 — Edit Client (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 */

import { http, HttpResponse } from 'msw';
import type { ClienteTestData } from '../../factories/cliente.factory';

const BASE = '/api/v1/clientes';

/** Returns 200 OK with the updated ClienteDto body. */
export function handlePutClienteSuccess(responseOverrides?: Partial<ClienteTestData>) {
  return http.put(`${BASE}/:clienteId`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, string>;
    return HttpResponse.json(
      {
        id: params.clienteId as string,
        nombre: body.nombre ?? '',
        nit: body.nit ?? '',
        telefono: body.telefono ?? '',
        ciudad: body.ciudad ?? '',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-06-29T10:00:00Z',
        ...responseOverrides,
      },
      { status: 200 }
    );
  });
}

/** Returns 404 Not Found with Problem Details body. */
export function handlePutClienteNotFound() {
  return http.put(`${BASE}/:clienteId`, () =>
    HttpResponse.json(
      {
        status: 404,
        title: 'Not Found',
        detail: 'Cliente no encontrado',
      },
      { status: 404 }
    )
  );
}

/** Returns 400 Bad Request (validation error) with Problem Details body. */
export function handlePutClienteValidationError() {
  return http.put(`${BASE}/:clienteId`, () =>
    HttpResponse.json(
      {
        status: 400,
        title: 'Validation Error',
        errors: {
          nombre: ['The Nombre field is required.'],
          nit: ['The Nit field is required.'],
          telefono: ['The Telefono field is required.'],
          ciudad: ['The Ciudad field is required.'],
        },
      },
      { status: 400 }
    )
  );
}

/** Returns HTTP 500 to simulate unexpected backend failure. */
export function handlePutClienteServerError() {
  return http.put(`${BASE}/:clienteId`, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}
