/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until `ClienteForm` gains edit-mode support (the
 * optional `cliente` prop, `isEditMode`, the "Editar cliente" title, and `useUpdateCliente`
 * wiring) per Story 2.4 Task 5. Today the whole file fails to typecheck/compile because
 * `ClienteFormProps` has no `cliente` prop yet — this is the expected RED state (missing
 * implementation, not a test bug), consistent with the project's established ATDD convention
 * (see `ClienteForm.test.tsx`, Story 2.3).
 *
 * New file rather than growing the already-large `ClienteForm.test.tsx` — same rationale
 * Story 2.3's code-review round used to split out `clienteSchema.test.ts` (Story 2.4 Task 6's
 * explicit instruction). This file itself was later split in two by the TEA test-quality
 * review (test-review-2-4-edit-client.md) to stay under the project's 300-line-per-file
 * standard: form-level behavior (pre-fill, validation blocking, cancel, re-baseline) stays
 * here; PUT submission-outcome coverage (success/409/500/network-error) moved to
 * `ClienteForm.edit.submit.test.tsx`.
 *
 * Acceptance Criteria covered in this file:
 *   AC1 — Edit dialog opens pre-filled with the client's current Nombre/NIT/Teléfono/Ciudad,
 *         titled "Editar cliente"
 *   AC3 — Clearing a required field blocks submission with an inline "requerido" error, no
 *         PUT is ever sent, dialog stays open
 *   AC4 — Cancelar discards changes: no PUT is ever sent, dialog closes
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

describe('AC1 — the edit dialog opens pre-filled with the client\'s current values', () => {
  test('[P0] pre-fills Nombre with the client\'s current value', () => {
    // GIVEN a client fixture with a known Nombre
    const cliente = createCliente({ nombre: 'Acme Corp' })

    // WHEN ClienteForm is rendered open, in edit mode, for that client
    renderClienteFormEdit(cliente)

    // THEN the Nombre field is pre-filled with the client's current value
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Acme Corp')
  })

  test('[P0] pre-fills NIT/RUC with the client\'s current value', () => {
    // GIVEN a client fixture with a known NIT
    const cliente = createCliente({ nit: '900123456' })

    // WHEN ClienteForm is rendered open, in edit mode, for that client
    renderClienteFormEdit(cliente)

    // THEN the NIT/RUC field is pre-filled with the client's current value
    expect(screen.getByLabelText(/nit/i)).toHaveValue('900123456')
  })

  test('[P0] pre-fills Teléfono with the client\'s current value', () => {
    // GIVEN a client fixture with a known Teléfono
    const cliente = createCliente({ telefono: '3001234567' })

    // WHEN ClienteForm is rendered open, in edit mode, for that client
    renderClienteFormEdit(cliente)

    // THEN the Teléfono field is pre-filled with the client's current value
    expect(screen.getByLabelText(/teléfono/i)).toHaveValue('3001234567')
  })

  test('[P0] pre-fills Ciudad with the client\'s current value', () => {
    // GIVEN a client fixture with a known Ciudad
    const cliente = createCliente({ ciudad: 'Cartagena' })

    // WHEN ClienteForm is rendered open, in edit mode, for that client
    renderClienteFormEdit(cliente)

    // THEN the Ciudad field is pre-filled with the client's current value
    expect(screen.getByLabelText(/ciudad/i)).toHaveValue('Cartagena')
  })

  test('[P0] renders the dialog title as "Editar cliente"', () => {
    // GIVEN a client fixture
    // WHEN ClienteForm is rendered open, in edit mode
    renderClienteFormEdit()

    // THEN the dialog title reads "Editar cliente", not "Nuevo cliente"
    expect(screen.getByText('Editar cliente')).toBeInTheDocument()
  })
})

describe('AC3 — clearing a required field blocks submission with an inline error', () => {
  test('[P0] shows an inline "requerido" message when Nombre is cleared and Guardar is clicked', async () => {
    // GIVEN the edit dialog is open, pre-filled with the client's current values
    renderClienteFormEdit()

    // WHEN the user clears Nombre and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN an inline "requerido" message appears next to the empty field
    await waitFor(() => {
      expect(screen.getByText(/requerido/i)).toBeInTheDocument()
    })
  })

  test('[P0] never sends PUT /api/v1/clientes/{id} when Nombre is cleared', async () => {
    // GIVEN a request counter on the update endpoint and the edit dialog open
    let requestCount = 0
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () => {
        requestCount += 1
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    renderClienteFormEdit()

    // WHEN the user clears Nombre and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(screen.getByText(/requerido/i)).toBeInTheDocument())

    // THEN the client-side Zod validation blocked the network call entirely
    expect(requestCount).toBe(0)
  })

  test('[P0] keeps the dialog open when Nombre is cleared and Guardar is clicked', async () => {
    // GIVEN the edit dialog is open
    let dialogClosed = false
    renderClienteFormEdit(createCliente(), (open) => {
      if (!open) dialogClosed = true
    })

    // WHEN the user clears Nombre and clicks "Guardar"
    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(screen.getByText(/requerido/i)).toBeInTheDocument())

    // THEN onOpenChange(false) was never called — the dialog remains open
    expect(dialogClosed).toBe(false)
  })
})

describe('AC4 — Cancelar discards changes without submitting', () => {
  test('[P0] calls onOpenChange(false) and never sends a PUT when Cancelar is clicked', async () => {
    // GIVEN a request counter on the update endpoint and the edit dialog open
    let requestCount = 0
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () => {
        requestCount += 1
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    let dialogClosed = false
    renderClienteFormEdit(createCliente(), (open) => {
      if (!open) dialogClosed = true
    })

    // WHEN the user modifies a field and clicks "Cancelar" instead of "Guardar"
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Medellín' } })
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN the dialog is told to close and no network request was ever made
    await waitFor(() => expect(dialogClosed).toBe(true))
    expect(requestCount).toBe(0)
  })

  test('[P1] resets fields back to the client\'s original values when Cancelar is clicked', async () => {
    // GIVEN the edit dialog is open, pre-filled with the client's original Ciudad
    const cliente = createCliente({ ciudad: 'Bogotá' })
    renderClienteFormEdit(cliente)

    // WHEN the user modifies Ciudad and clicks "Cancelar"
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Medellín' } })
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN the field reverts to the client's original value, not blank — the backend and the
    // originally-loaded data remain completely unchanged (AC #4)
    await waitFor(() => {
      expect(screen.getByLabelText(/ciudad/i)).toHaveValue('Bogotá')
    })
  })

  test('[P1] never sends a PUT when the dialog is closed via Escape (AC #4 alternate close path)', async () => {
    // GIVEN a request counter on the update endpoint and the edit dialog open — AC #4
    // explicitly covers "Cancelar (or closes the dialog via Escape/overlay)"
    let requestCount = 0
    server.use(
      http.put(CLIENTE_BY_ID_ENDPOINT, () => {
        requestCount += 1
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    let dialogClosed = false
    renderClienteFormEdit(createCliente(), (open) => {
      if (!open) dialogClosed = true
    })

    // WHEN the user modifies a field, then presses Escape instead of clicking "Guardar"
    fireEvent.change(screen.getByLabelText(/ciudad/i), { target: { value: 'Medellín' } })
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' })

    // THEN the dialog is told to close and no network request was ever made
    await waitFor(() => expect(dialogClosed).toBe(true))
    expect(requestCount).toBe(0)
  })
})

describe('Re-baseline when the cliente prop changes (useEffect dependency on [open, cliente])', () => {
  test('[P1] pre-fills with the new client\'s values, not the previous client\'s, when cliente changes while open', () => {
    // GIVEN the edit dialog is open for one client
    const clienteA = createCliente({ nombre: 'Acme Corp', ciudad: 'Bogotá' })
    const { rerender, queryClient } = renderClienteFormEdit(clienteA)
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Acme Corp')

    // WHEN the cliente prop switches to a different client while the dialog stays open
    // (e.g. the parent re-renders with a freshly-selected client)
    const clienteB = createCliente({ nombre: 'Beta SAS', ciudad: 'Cali' })
    rerender(
      <QueryClientProvider client={queryClient}>
        <ClienteForm open onOpenChange={() => {}} cliente={clienteB} />
      </QueryClientProvider>,
    )

    // THEN the form re-baselines to the new client's values, not the stale previous ones
    expect(screen.getByLabelText(/nombre/i)).toHaveValue('Beta SAS')
    expect(screen.getByLabelText(/ciudad/i)).toHaveValue('Cali')
  })
})
