/**
 * MSW 2 route handlers for POST /api/v1/contactos endpoint.
 * Story 3.3 — Create Contact (ATDD RED phase)
 *
 * These handlers are imported into individual tests as needed.
 */

import { http, HttpResponse } from 'msw';
import type { ContactoTestData } from '../../factories/contacto.factory';

const BASE = '/api/v1/contactos';

/** Returns 201 Created with a ContactoDto body. */
export function handlePostContactoSuccess(responseBody?: Partial<ContactoTestData>) {
  return http.post(BASE, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    return HttpResponse.json(
      {
        id: '00000000-0000-0000-0000-000000000099',
        nombre: body.nombre ?? '',
        cargo: body.cargo ?? '',
        telefono: body.telefono ?? '',
        email: body.email ?? '',
        clienteId: null,
        createdAt: '2026-06-29T10:00:00Z',
        ...responseBody,
      },
      { status: 201 }
    );
  });
}

/** Returns 400 Bad Request (validation error) with Problem Details body. */
export function handlePostContactoValidationError(errors?: Record<string, string[]>) {
  return http.post(BASE, () =>
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

/** Returns 400 specifically for invalid email format. */
export function handlePostContactoEmailValidationError() {
  return http.post(BASE, () =>
    HttpResponse.json(
      {
        status: 400,
        title: 'Validation Error',
        errors: {
          email: ["'Email' is not a valid email address."],
        },
      },
      { status: 400 }
    )
  );
}

/** Returns HTTP 500 to simulate unexpected backend failure. */
export function handlePostContactoServerError() {
  return http.post(BASE, () =>
    HttpResponse.json(
      { status: 500, title: 'Internal Server Error' },
      { status: 500 }
    )
  );
}
