/**
 * MSW 2 route handlers for PUT /api/v1/contactos/:id endpoint.
 * Story 3.4 — Edit Contact (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 */

import { http, HttpResponse } from 'msw';

const BASE = '/api/v1/contactos';

/** Returns 200 OK with the updated ContactoDto body. */
export function handlePutContactoSuccess(responseOverrides?: Partial<{
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  clienteId: string | null;
  createdAt: string;
  updatedAt: string;
}>) {
  return http.put(`${BASE}/:contactoId`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, string>;
    return HttpResponse.json(
      {
        id: params.contactoId as string,
        nombre: body.nombre ?? '',
        cargo: body.cargo ?? '',
        telefono: body.telefono ?? '',
        email: body.email ?? '',
        clienteId: null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-06-29T10:00:00Z',
        ...responseOverrides,
      },
      { status: 200 }
    );
  });
}

/** Returns 404 Not Found with Problem Details body. */
export function handlePutContactoNotFound() {
  return http.put(`${BASE}/:contactoId`, () =>
    HttpResponse.json(
      {
        status: 404,
        title: 'Not Found',
        detail: 'Contacto no encontrado',
      },
      { status: 404 }
    )
  );
}

/** Returns 400 Bad Request (validation error) with Problem Details body. */
export function handlePutContactoValidationError(errors?: Record<string, string[]>) {
  return http.put(`${BASE}/:contactoId`, () =>
    HttpResponse.json(
      {
        status: 400,
        title: 'Validation Error',
        errors: errors ?? {
          nombre: ['The Nombre field is required.'],
          cargo: ['The Cargo field is required.'],
          telefono: ['The Telefono field is required.'],
          email: ['The Email field is required.'],
        },
      },
      { status: 400 }
    )
  );
}

/** Returns HTTP 500 to simulate unexpected backend failure. */
export function handlePutContactoServerError() {
  return http.put(`${BASE}/:contactoId`, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}
