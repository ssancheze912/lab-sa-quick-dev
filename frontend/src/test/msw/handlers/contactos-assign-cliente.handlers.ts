/**
 * MSW 2 route handlers for PUT /api/v1/contactos/:id/cliente endpoint.
 * Story 4.2 — Associate & Disassociate Contacts from Client (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 */

import { http, HttpResponse } from 'msw';

const BASE = '/api/v1/contactos';

/** Returns 200 OK with the updated ContactoDto after assigning a cliente. */
export function handleAssignClienteSuccess(overrides?: Partial<{
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
  clienteId: string | null;
  createdAt: string;
  updatedAt: string;
}>) {
  return http.put(`${BASE}/:contactoId/cliente`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, string | null>;
    return HttpResponse.json(
      {
        id: params.contactoId as string,
        nombre: 'Contacto Test 0001',
        cargo: 'Cargo 0001',
        telefono: '3100000001',
        email: 'contacto.test.0001@siesa.com',
        clienteId: body.clienteId ?? null,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-06-29T10:00:00Z',
        ...overrides,
      },
      { status: 200 }
    );
  });
}

/** Returns 404 Not Found with Problem Details when contacto does not exist. */
export function handleAssignClienteNotFound() {
  return http.put(`${BASE}/:contactoId/cliente`, () =>
    HttpResponse.json(
      {
        status: 404,
        title: 'Recurso no encontrado',
        detail: 'No existe un contacto con el ID proporcionado.',
      },
      { status: 404 }
    )
  );
}

/** Returns 400 Bad Request with Problem Details on validation failure. */
export function handleAssignClienteValidationError() {
  return http.put(`${BASE}/:contactoId/cliente`, () =>
    HttpResponse.json(
      {
        status: 400,
        title: 'Datos inválidos',
        detail: 'El identificador del contacto no es válido.',
      },
      { status: 400 }
    )
  );
}

/** Returns 500 to simulate unexpected backend failure. */
export function handleAssignClienteServerError() {
  return http.put(`${BASE}/:contactoId/cliente`, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}
