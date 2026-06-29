/**
 * MSW 2 route handlers for POST /api/v1/clientes endpoint.
 * Story 2.3 — Create Client (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 */

import { http, HttpResponse } from 'msw';
import type { ClienteTestData } from '../../factories/cliente.factory';

const BASE = '/api/v1/clientes';

/** Returns 201 Created with a ClienteDto body. */
export function handlePostClienteSuccess(responseBody?: Partial<ClienteTestData>) {
  return http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    return HttpResponse.json(
      {
        id: '00000000-0000-0000-0000-000000000099',
        nombre: body.nombre ?? '',
        nit: body.nit ?? '',
        telefono: body.telefono ?? '',
        ciudad: body.ciudad ?? '',
        createdAt: '2026-06-29T10:00:00Z',
        ...responseBody,
      },
      { status: 201 }
    );
  });
}

/** Returns 409 Conflict (duplicate NIT) with Problem Details body. */
export function handlePostClienteConflict() {
  return http.post(BASE, () =>
    HttpResponse.json(
      {
        status: 409,
        title: 'Conflict',
        detail: 'El NIT/RUC ya está registrado',
      },
      { status: 409 }
    )
  );
}

/** Returns 400 Bad Request (validation error) with Problem Details body. */
export function handlePostClienteValidationError() {
  return http.post(BASE, () =>
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
export function handlePostClienteServerError() {
  return http.post(BASE, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}
