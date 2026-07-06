/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase
 * Split out of `ClienteForm.edit.test.tsx` by the TEA test-quality review
 * (test-review-2-4-edit-client.md) to keep both files under the project's 300-line-per-file
 * standard — same rationale Story 2.3's code-review round used to split out
 * `clienteSchema.test.ts`. This file covers PUT-submission *outcomes* (success, 409 conflict,
 * 500/network error); form-level behavior (pre-fill, validation blocking, cancel, re-baseline)
 * stays in `ClienteForm.edit.test.tsx`.
 *
 * Acceptance Criteria covered in this file:
 *   AC2 — Valid submit calls PUT, shows success toast, closes dialog, sends full form values
 *   (409 duplicate-NIT handling and generic-failure handling are shared with create — AC #2's
 *   Dev Notes — verified here too)
 *
 * Network-first pattern (network-first.md): every test registers its MSW handler via
 * `server.use(...)` BEFORE interacting with the form, since the mutation fires
 * `PUT /api/v1/clientes/{id}` on submit.
 */

import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { Toaster } from 'sonner'
import { server } from '@/test/msw/server'
import { createCliente } from '@/test/factories/cliente.factory'
import { ClienteForm } from './ClienteForm'

const CLIENTE_BY_ID_ENDPOINT = '*/api/v1/clientes/:id'

function renderClienteFormEdit(
  cliente = createCliente(),
  onOpenChange: (open: boolean) => void = () => {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return {
    cliente,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <ClienteForm open onOpenChange={onOpenChange} cliente={cliente} />
      </QueryClientProvider>,
    ),
  }
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AC2 — valid submission updates the client and closes the dialog', () => {
  test('[P0] calls onOpenChange(false) after a successful PUT /api/v1/clientes/{id}', async () => {
    // GIVEN the backend accepts the update request
    const cliente = createCliente()
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json({ ...cliente, ciudad: 'Medellín' }, { status: 200 }),
      ),
    )
    let dialogClosed = false
    renderClienteFormEdit(cliente, (open) => {
      if (!open) dialogClosed = true
    })

    // WHEN the user modifies Ciudad and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Medellín' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN the dialog closes
    await waitFor(() => expect(dialogClosed).toBe(true))
  })

  test('[P0] shows the success toast "Cliente actualizado correctamente" after a successful PUT', async () => {
    // GIVEN the backend accepts the update request
    const cliente = createCliente()
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json({ ...cliente, ciudad: 'Medellín' }, { status: 200 }),
      ),
    )
    renderClienteFormEdit(cliente)

    // WHEN the user modifies Ciudad and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Medellín' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN the exact Spanish success toast copy is rendered
    await waitFor(() => {
      expect(screen.getByText('Cliente actualizado correctamente')).toBeInTheDocument()
    })
  })

  test('[P1] sends the full current form values (all four fields) in the PUT body', async () => {
    // GIVEN the backend accepts the update request and records the submitted body
    const cliente = createCliente({ nombre: 'Acme Corp', nit: '900123456', telefono: '3001234567', ciudad: 'Bogotá' })
    let receivedBody: Record<string, unknown> | null = null
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...cliente, ciudad: 'Medellín' }, { status: 200 })
      }),
    )
    renderClienteFormEdit(cliente)

    // WHEN the user modifies only Ciudad and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Medellín' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN the request body carries the full current form values, not just the changed field
    await waitFor(() => expect(receivedBody).not.toBeNull())
    expect(receivedBody).toMatchObject({
      nombre: 'Acme Corp',
      nit: '900123456',
      telefono: '3001234567',
      ciudad: 'Medellín',
    })
  })
})

describe('AC2 Dev Notes — duplicate NIT (409) shares create\'s inline field error', () => {
  test('[P1] shows "El NIT/RUC ya está registrado" next to the NIT field on a 409 response', async () => {
    // GIVEN the backend rejects the update request with 409 Conflict (edited NIT collides
    // with another client)
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json({ detail: 'El NIT/RUC ya está registrado.' }, { status: 409 }),
      ),
    )
    renderClienteFormEdit()

    // WHEN the user modifies NIT to a colliding value and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/nit/i), { target: { value: '900999999' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN the exact inline error text renders
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    })
  })

  test('[P1] keeps the dialog open on a 409 response', async () => {
    // GIVEN the backend rejects the update request with 409 Conflict
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json({ detail: 'El NIT/RUC ya está registrado.' }, { status: 409 }),
      ),
    )
    let dialogClosed = false
    renderClienteFormEdit(createCliente(), (open) => {
      if (!open) dialogClosed = true
    })

    // WHEN the user modifies NIT to a colliding value and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/nit/i), { target: { value: '900999999' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await screen.findByText('El NIT/RUC ya está registrado')

    // THEN the dialog was never told to close
    expect(dialogClosed).toBe(false)
  })
})

describe('AC2 Dev Notes — generic failure handling on PUT (NFR6, shared with create)', () => {
  test('[P2] renders a generic safe message when PUT fails with 500', async () => {
    // GIVEN the backend fails unexpectedly (not a 409 conflict)
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json({ detail: 'NpgsqlException: connection refused' }, { status: 500 }),
      ),
    )
    renderClienteFormEdit()

    // WHEN the user modifies a field and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Medellín' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN the generic, safe fallback message renders (same root-error path as create)
    await waitFor(() => {
      expect(screen.getByText('No se pudo guardar. Intenta de nuevo.')).toBeInTheDocument()
    })
  })

  test('[P2] never renders the raw backend error/exception message on a 500 (NFR6)', async () => {
    // GIVEN the backend fails with a technical, exception-shaped payload
    const technicalMarker = 'NpgsqlException: connection refused at 10.0.0.5:5432'
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () =>
        HttpResponse.json({ detail: technicalMarker }, { status: 500 }),
      ),
    )
    renderClienteFormEdit()

    // WHEN the user modifies a field and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Medellín' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => {
      expect(screen.getByText('No se pudo guardar. Intenta de nuevo.')).toBeInTheDocument()
    })

    // THEN the raw technical error text is never rendered to the user
    expect(screen.queryByText(technicalMarker)).not.toBeInTheDocument()
  })

  test('[P2] renders the generic safe message on a network error with no HTTP response at all', async () => {
    // GIVEN the request fails at the network layer (no response object, unlike a 500 — this
    // is the same code path a client-deleted-concurrently 404 falls into, per Dev Notes)
    server.use(http.put(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.error()))
    renderClienteFormEdit()

    // WHEN the user modifies a field and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Medellín' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN the generic, safe fallback message renders — never a raw network/axios error
    await waitFor(() => {
      expect(screen.getByText('No se pudo guardar. Intenta de nuevo.')).toBeInTheDocument()
    })
  })

  test('[P2] keeps the dialog open when PUT fails with 500', async () => {
    // GIVEN the backend fails unexpectedly
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () => HttpResponse.json({ detail: 'boom' }, { status: 500 })),
    )
    let dialogClosed = false
    renderClienteFormEdit(createCliente(), (open) => {
      if (!open) dialogClosed = true
    })

    // WHEN the user modifies a field and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Medellín' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await screen.findByText('No se pudo guardar. Intenta de nuevo.')

    // THEN onOpenChange(false) was never called — the dialog remains open for retry
    expect(dialogClosed).toBe(false)
  })
})
