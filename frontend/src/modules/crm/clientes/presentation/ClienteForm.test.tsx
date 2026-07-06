/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until `ClienteForm` (and its supporting
 * `clienteSchema`, `useCreateCliente`) are implemented per Story 2.3 Tasks 3-5. Today the
 * whole file fails to compile because none of those modules exist yet — this is the
 * expected RED state (missing implementation, not a test bug), consistent with the
 * project's established ATDD convention (see `ClienteListView.test.tsx`,
 * `ClienteDetailView.test.tsx`).
 *
 * Acceptance Criteria covered:
 *   AC1 — Dialog opens with four labeled, required fields (covered indirectly here; the
 *         "Nuevo cliente" trigger itself is covered in `ClienteListView.test.tsx`)
 *   AC2 — Valid submit calls POST, shows success toast, closes dialog, list refetches
 *   AC3 — Empty required fields show inline "requerido" errors, no POST fires, dialog stays open
 *   AC4 — 409 duplicate-NIT response shows an inline field error next to NIT, dialog stays open
 *
 * Network-first pattern (network-first.md): every test registers its MSW handler via
 * `server.use(...)` BEFORE interacting with the form, since the mutation fires
 * `POST /api/v1/clientes` on submit.
 */

import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { Toaster } from 'sonner'
import { server } from '@/test/msw/server'
import { ClienteForm } from './ClienteForm'

const CLIENTES_ENDPOINT = '*/api/v1/clientes'

function renderClienteForm(onOpenChange: (open: boolean) => void = () => {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <ClienteForm open onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    ),
  }
}

async function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Acme Corp' } })
  fireEvent.change(screen.getByLabelText(/nit/i), { target: { value: '900123456' } })
  fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '3001234567' } })
  fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Bogotá' } })
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('AC1 — the dialog renders four labeled required fields', () => {
  test('[P0] renders Nombre, NIT/RUC, Teléfono and Ciudad fields when open is true', () => {
    // GIVEN: ClienteForm is rendered with open=true
    renderClienteForm()

    // WHEN: the form is inspected

    // THEN: all four accessible-labeled fields are present
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nit/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ciudad/i)).toBeInTheDocument()
  })
})

describe('AC3 — empty required fields block submission with inline errors', () => {
  test('[P0] shows four inline "requerido" messages when Guardar is clicked with all fields empty', async () => {
    // GIVEN: the dialog is open with all fields empty
    renderClienteForm()

    // WHEN: the user clicks "Guardar" without filling any field
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: four inline "requerido" messages appear (one per field)
    await waitFor(() => {
      expect(screen.getAllByText(/requerido/i)).toHaveLength(4)
    })
  })

  test('[P0] never sends POST /api/v1/clientes when required fields are empty', async () => {
    // GIVEN: a request counter on the create endpoint and the dialog open with empty fields
    let requestCount = 0
    server.use(
      http.post(CLIENTES_ENDPOINT, () => {
        requestCount += 1
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    renderClienteForm()

    // WHEN: the user clicks "Guardar" without filling any field
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(screen.getAllByText(/requerido/i)).toHaveLength(4))

    // THEN: the client-side Zod validation blocked the network call entirely
    expect(requestCount).toBe(0)
  })

  test('[P0] keeps the dialog open when required fields are empty', async () => {
    // GIVEN: the dialog is open with all fields empty
    let dialogClosed = false
    renderClienteForm((open) => {
      if (!open) dialogClosed = true
    })

    // WHEN: the user clicks "Guardar" without filling any field
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(screen.getAllByText(/requerido/i)).toHaveLength(4))

    // THEN: onOpenChange(false) was never called — the dialog remains open
    expect(dialogClosed).toBe(false)
  })
})

describe('AC2 — valid submission creates the client and closes the dialog', () => {
  test('[P0] calls onOpenChange(false) after a successful POST /api/v1/clientes', async () => {
    // GIVEN: the backend accepts the create request
    server.use(
      http.post(CLIENTES_ENDPOINT, () =>
        HttpResponse.json(
          { id: 'new-id', nombre: 'Acme Corp', nit: '900123456', telefono: '3001234567', ciudad: 'Bogotá' },
          { status: 201 },
        ),
      ),
    )
    let dialogClosed = false
    renderClienteForm((open) => {
      if (!open) dialogClosed = true
    })

    // WHEN: the user fills all fields with valid data and clicks "Guardar"
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: the dialog closes
    await waitFor(() => expect(dialogClosed).toBe(true))
  })

  test('[P0] shows the success toast "Cliente creado correctamente" after a successful POST', async () => {
    // GIVEN: the backend accepts the create request
    server.use(
      http.post(CLIENTES_ENDPOINT, () =>
        HttpResponse.json(
          { id: 'new-id', nombre: 'Acme Corp', nit: '900123456', telefono: '3001234567', ciudad: 'Bogotá' },
          { status: 201 },
        ),
      ),
    )
    renderClienteForm()

    // WHEN: the user fills all fields with valid data and clicks "Guardar"
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: the exact Spanish success toast copy is rendered
    await waitFor(() => {
      expect(screen.getByText('Cliente creado correctamente')).toBeInTheDocument()
    })
  })

  test('[P1] invalidates the clientes query cache after a successful POST (FR27)', async () => {
    // GIVEN: the backend accepts the create request and the clientes list is already cached
    server.use(
      http.post(CLIENTES_ENDPOINT, () =>
        HttpResponse.json(
          { id: 'new-id', nombre: 'Acme Corp', nit: '900123456', telefono: '3001234567', ciudad: 'Bogotá' },
          { status: 201 },
        ),
      ),
    )
    const { queryClient } = renderClienteForm()
    queryClient.setQueryData(['clientes'], [])

    // WHEN: the user fills all fields with valid data and clicks "Guardar"
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: the ['clientes'] query is marked invalid, triggering ClienteListView's refetch
    await waitFor(() => {
      const state = queryClient.getQueryState(['clientes'])
      expect(state?.isInvalidated).toBe(true)
    })
  })
})

describe('AC4 — duplicate NIT (409) shows an inline field error and keeps the dialog open', () => {
  test('[P0] shows "El NIT/RUC ya está registrado" next to the NIT field on a 409 response', async () => {
    // GIVEN: the backend rejects the create request with 409 Conflict
    server.use(
      http.post(CLIENTES_ENDPOINT, () =>
        HttpResponse.json({ detail: 'El NIT/RUC ya está registrado.' }, { status: 409 }),
      ),
    )
    renderClienteForm()

    // WHEN: the user fills all fields with valid data (including a NIT that already exists)
    // and clicks "Guardar"
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: the exact inline error text renders
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    })
  })

  test('[P0] keeps the dialog open on a 409 response (onOpenChange never called with false)', async () => {
    // GIVEN: the backend rejects the create request with 409 Conflict
    server.use(
      http.post(CLIENTES_ENDPOINT, () =>
        HttpResponse.json({ detail: 'El NIT/RUC ya está registrado.' }, { status: 409 }),
      ),
    )
    let dialogClosed = false
    renderClienteForm((open) => {
      if (!open) dialogClosed = true
    })

    // WHEN: the user fills all fields with valid data and clicks "Guardar"
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await screen.findByText('El NIT/RUC ya está registrado')

    // THEN: the dialog was never told to close
    expect(dialogClosed).toBe(false)
  })
})

describe('Non-409 failures render a safe, generic message (NFR6)', () => {
  test('[P2] renders a generic safe message when POST fails with 500', async () => {
    // GIVEN: the backend fails with an unexpected 500
    server.use(
      http.post(CLIENTES_ENDPOINT, () =>
        HttpResponse.json({ detail: 'NpgsqlException: connection refused' }, { status: 500 }),
      ),
    )
    renderClienteForm()

    // WHEN: the user fills all fields with valid data and clicks "Guardar"
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: a generic, safe error message is rendered via role="alert"
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  test('[P2] never renders the raw backend error/exception message on a 500 (NFR6)', async () => {
    // GIVEN: the backend fails with a technical, exception-shaped payload
    const technicalMarker = 'NpgsqlException: connection refused at 10.0.0.5:5432'
    server.use(
      http.post(CLIENTES_ENDPOINT, () => HttpResponse.json({ detail: technicalMarker }, { status: 500 })),
    )
    renderClienteForm()

    // WHEN: the user fills all fields with valid data and clicks "Guardar"
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())

    // THEN: the raw technical error text is never rendered to the user
    expect(screen.queryByText(technicalMarker)).not.toBeInTheDocument()
  })

  test('[P2] renders the generic safe message on a network error with no HTTP response at all', async () => {
    // GIVEN: the request fails at the network layer (no response object, unlike a 500)
    server.use(http.post(CLIENTES_ENDPOINT, () => HttpResponse.error()))
    renderClienteForm()

    // WHEN: the user fills all fields with valid data and clicks "Guardar"
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: the same generic, safe error path renders (isAxiosError without error.response
    // must not throw or leave the form in a broken/uncaught state)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})

describe('AC3 edge case — partial validation only flags the fields left empty', () => {
  test('[P1] shows exactly one inline "requerido" message when only Ciudad is left empty', async () => {
    // GIVEN: the dialog is open with three of the four fields filled in
    renderClienteForm()
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: 'Acme Corp' } })
    fireEvent.change(screen.getByLabelText(/nit/i), { target: { value: '900123456' } })
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '3001234567' } })

    // WHEN: the user clicks "Guardar" with only Ciudad left empty
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: exactly one inline "requerido" message appears — filled fields are not
    // incorrectly flagged as errors too
    await waitFor(() => {
      expect(screen.getAllByText(/requerido/i)).toHaveLength(1)
    })
  })

  test('[P2] treats whitespace-only values the same as empty values (Zod .trim())', async () => {
    // GIVEN: the dialog is open with all four fields filled with whitespace only
    renderClienteForm()
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText(/nit/i), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText(/teléfono/i), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: '   ' } })

    // WHEN: the user clicks "Guardar"
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: all four fields are blocked as if they were empty
    await waitFor(() => {
      expect(screen.getAllByText(/requerido/i)).toHaveLength(4)
    })
  })
})

describe('Cancelar closes the dialog without submitting or persisting data', () => {
  test('[P1] calls onOpenChange(false) and never sends a POST when Cancelar is clicked', async () => {
    // GIVEN: a request counter on the create endpoint and the dialog open with valid data
    let requestCount = 0
    server.use(
      http.post(CLIENTES_ENDPOINT, () => {
        requestCount += 1
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    let dialogClosed = false
    renderClienteForm((open) => {
      if (!open) dialogClosed = true
    })
    await fillValidForm()

    // WHEN: the user clicks "Cancelar" instead of "Guardar"
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: the dialog is told to close and no network request was ever made
    await waitFor(() => expect(dialogClosed).toBe(true))
    expect(requestCount).toBe(0)
  })

  test('[P2] resets filled-in field values back to blank when Cancelar is clicked', async () => {
    // GIVEN: the dialog is open with data typed into every field
    renderClienteForm()
    await fillValidForm()

    // WHEN: the user clicks "Cancelar"
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: the form fields are reset to blank, so a future re-open never leaks stale data
    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toHaveValue('')
      expect(screen.getByLabelText(/nit/i)).toHaveValue('')
      expect(screen.getByLabelText(/teléfono/i)).toHaveValue('')
      expect(screen.getByLabelText(/ciudad/i)).toHaveValue('')
    })
  })
})

describe('Guardar button reflects the in-flight mutation state', () => {
  test('[P2] disables Guardar while the create request is pending, then re-enables it', async () => {
    // GIVEN: a create request that only resolves once the test explicitly releases it
    let releaseResponse: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    server.use(
      http.post(CLIENTES_ENDPOINT, async () => {
        await pending
        return HttpResponse.json(
          { id: 'new-id', nombre: 'Acme Corp', nit: '900123456', telefono: '3001234567', ciudad: 'Bogotá' },
          { status: 201 },
        )
      }),
    )
    renderClienteForm()
    await fillValidForm()

    // WHEN: the user clicks "Guardar" while the request is still in flight
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: the button becomes disabled to prevent duplicate submissions
    await waitFor(() => expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled())

    // WHEN: the request finally resolves
    releaseResponse()

    // THEN: the button is re-enabled again (mutation settled)
    await waitFor(() => expect(screen.getByRole('button', { name: /guardar/i })).not.toBeDisabled())
  })
})
