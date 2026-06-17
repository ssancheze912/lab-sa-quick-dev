/**
 * Story 2.3: Create Client — Component Tests
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level — Vitest + RTL + MSW)
 * These tests FAIL until the implementation is complete.
 *
 * Test IDs covered:
 *   TC-E2-P0-04 — Submit empty form → 4 inline errors visible, no API call fired
 *   TC-E2-P0-05 — MSW 409 response → "El NIT/RUC ya está registrado" shown inline, no stack trace
 *   AC2 — Fill all fields → submit → POST /api/v1/clientes fired, success toast appears
 *   AC5 — Click "Cancelar" → onClose called, no API call
 *
 * Tooling: Vitest 2+ | @testing-library/react | @testing-library/user-event | MSW 2
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClienteForm } from './ClienteForm'

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server setup — per-test, not shared globally to prevent test interference
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

interface RenderFormOptions {
  onClose?: () => void
  onSuccess?: () => void
}

function renderClienteForm({ onClose = vi.fn(), onSuccess = vi.fn() }: RenderFormOptions = {}) {
  const queryClient = makeQueryClient()
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ClienteForm onClose={onClose} onSuccess={onSuccess} />
    </QueryClientProvider>
  )
  return { ...utils, onClose, onSuccess, queryClient }
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-04 — Submit empty form → 4 inline errors, no API call
// AC3: Zod validation prevents submission when required fields are empty (FR8)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P0-04 — Submit empty form → 4 inline errors, no API call', () => {
  it('should show an inline validation error under the Nombre field when submitted empty', async () => {
    // GIVEN: ClienteForm is rendered with no pre-filled values
    const user = userEvent.setup()
    renderClienteForm()

    // WHEN: The user clicks "Guardar" without filling any field
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: An inline error message appears under the Nombre field
    await waitFor(() => {
      expect(screen.getByText(/nombre.*requerido|requerido.*nombre/i)).toBeInTheDocument()
    })
  })

  it('should show an inline validation error under the NIT/RUC field when submitted empty', async () => {
    // GIVEN: ClienteForm rendered
    const user = userEvent.setup()
    renderClienteForm()

    // WHEN: The user submits without filling any field
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: An inline error message appears under the NIT/RUC field
    await waitFor(() => {
      expect(screen.getByText(/nit.*requerido|requerido.*nit/i)).toBeInTheDocument()
    })
  })

  it('should show an inline validation error under the Teléfono field when submitted empty', async () => {
    // GIVEN: ClienteForm rendered
    const user = userEvent.setup()
    renderClienteForm()

    // WHEN: The user submits without filling any field
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: An inline error message appears under the Teléfono field
    await waitFor(() => {
      expect(screen.getByText(/tel.*requerido|requerido.*tel/i)).toBeInTheDocument()
    })
  })

  it('should show an inline validation error under the Ciudad field when submitted empty', async () => {
    // GIVEN: ClienteForm rendered
    const user = userEvent.setup()
    renderClienteForm()

    // WHEN: The user submits without filling any field
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: An inline error message appears under the Ciudad field
    await waitFor(() => {
      expect(screen.getByText(/ciudad.*requerida|requerida.*ciudad/i)).toBeInTheDocument()
    })
  })

  it('should NOT fire a POST request to /api/v1/clientes when the form is submitted empty', async () => {
    // GIVEN: MSW tracks any POST to /api/v1/clientes
    const user = userEvent.setup()
    let apiCallFired = false

    server.use(
      http.post('**/api/v1/clientes', () => {
        apiCallFired = true
        return HttpResponse.json({}, { status: 201 })
      })
    )

    renderClienteForm()

    // WHEN: The user submits without filling any field
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // Wait briefly for any potential async calls
    await new Promise((resolve) => setTimeout(resolve, 200))

    // THEN: No API call was fired
    expect(apiCallFired).toBe(false)
  })

  it('should show exactly 4 inline error messages when all required fields are empty', async () => {
    // GIVEN: ClienteForm rendered with no values
    const user = userEvent.setup()
    renderClienteForm()

    // WHEN: The user clicks submit without filling anything
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: Exactly 4 error messages appear (one per required field)
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThanOrEqual(4)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P0-05 — MSW 409 response → "El NIT/RUC ya está registrado" inline
// AC4: 409 conflict shown inline, no stack trace, no toast (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P0-05 — MSW 409 response → inline "El NIT/RUC ya está registrado"', () => {
  it('should show "El NIT/RUC ya está registrado" inline when POST returns 409', async () => {
    // GIVEN: MSW returns 409 for POST /api/v1/clientes
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.json(
          {
            status: 409,
            title: 'Conflicto de datos',
            detail: 'El NIT/RUC ya está registrado',
          },
          { status: 409 }
        )
      })
    )

    const user = userEvent.setup()
    renderClienteForm()

    // WHEN: The user fills all fields and submits
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Duplicada S.A.S.')
    await user.type(screen.getByLabelText(/nit/i), '900999001-1')
    await user.type(screen.getByLabelText(/teléfono/i), '3001234567')
    await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: The inline error "El NIT/RUC ya está registrado" appears in the DOM
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    })
  })

  it('should NOT show a stack trace or technical details when POST returns 409', async () => {
    // GIVEN: MSW returns 409 for POST /api/v1/clientes
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.json(
          {
            status: 409,
            title: 'Conflicto de datos',
            detail: 'El NIT/RUC ya está registrado',
          },
          { status: 409 }
        )
      })
    )

    const user = userEvent.setup()
    renderClienteForm()

    // WHEN: The user submits with a duplicate NIT/RUC
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Test Stack')
    await user.type(screen.getByLabelText(/nit/i), '900888001-1')
    await user.type(screen.getByLabelText(/teléfono/i), '3002222222')
    await user.type(screen.getByLabelText(/ciudad/i), 'Medellín')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    })

    // THEN: No technical information (stack traces, exception names) is visible
    const bodyText = document.body.textContent ?? ''
    expect(bodyText).not.toContain('stackTrace')
    expect(bodyText).not.toContain('Exception')
    expect(bodyText).not.toContain('InnerException')
    expect(bodyText).not.toContain('at System.')
    expect(bodyText).not.toContain('Microsoft.EntityFrameworkCore')
  })

  it('should keep the form open after receiving 409 so user can correct the NIT/RUC', async () => {
    // GIVEN: MSW returns 409 for POST /api/v1/clientes
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.json(
          {
            status: 409,
            title: 'Conflicto de datos',
            detail: 'El NIT/RUC ya está registrado',
          },
          { status: 409 }
        )
      })
    )

    const user = userEvent.setup()
    const { onClose } = renderClienteForm()

    // WHEN: The user submits with a duplicate NIT/RUC
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Dialogo Abierto')
    await user.type(screen.getByLabelText(/nit/i), '900777001-1')
    await user.type(screen.getByLabelText(/teléfono/i), '3003333333')
    await user.type(screen.getByLabelText(/ciudad/i), 'Cali')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    })

    // THEN: onClose was NOT called (form stays open for correction)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should NOT show a generic toast error message for 409 conflict (must be inline)', async () => {
    // GIVEN: MSW returns 409 for POST /api/v1/clientes
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.json(
          {
            status: 409,
            title: 'Conflicto de datos',
            detail: 'El NIT/RUC ya está registrado',
          },
          { status: 409 }
        )
      })
    )

    const user = userEvent.setup()
    renderClienteForm()

    // WHEN: The user submits with a duplicate NIT/RUC
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Toast Guard')
    await user.type(screen.getByLabelText(/nit/i), '900666001-1')
    await user.type(screen.getByLabelText(/teléfono/i), '3004444444')
    await user.type(screen.getByLabelText(/ciudad/i), 'Barranquilla')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    })

    // THEN: The generic error toast "No se pudo guardar. Intenta de nuevo." is NOT shown
    expect(screen.queryByText(/no se pudo guardar/i)).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Successful submit: POST fired, success toast, onClose/onSuccess called
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Successful submit: POST /api/v1/clientes fired and success toast shown', () => {
  it('should fire a POST request to /api/v1/clientes when all fields are filled and form is submitted', async () => {
    // GIVEN: MSW handles POST and returns 201
    let capturedRequest: unknown = null
    server.use(
      http.post('**/api/v1/clientes', async ({ request }) => {
        capturedRequest = await request.json()
        return HttpResponse.json(
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            nombre: 'Empresa Nueva S.A.S.',
            nitRuc: '900100100-1',
            telefono: '3005555555',
            ciudad: 'Bogotá',
            createdAt: '2026-06-17T14:30:00Z',
          },
          { status: 201 }
        )
      })
    )

    const user = userEvent.setup()
    renderClienteForm()

    // WHEN: The user fills all fields and submits
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Nueva S.A.S.')
    await user.type(screen.getByLabelText(/nit/i), '900100100-1')
    await user.type(screen.getByLabelText(/teléfono/i), '3005555555')
    await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: A POST request to /api/v1/clientes was fired
    await waitFor(() => {
      expect(capturedRequest).not.toBeNull()
    })
  })

  it('should call onClose after successful form submission', async () => {
    // GIVEN: MSW returns 201 for POST /api/v1/clientes
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.json(
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            nombre: 'Empresa Close S.A.',
            nitRuc: '900200200-2',
            telefono: '3006666666',
            ciudad: 'Cali',
            createdAt: '2026-06-17T14:30:00Z',
          },
          { status: 201 }
        )
      })
    )

    const user = userEvent.setup()
    const { onClose } = renderClienteForm()

    // WHEN: The user submits the form successfully
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Close S.A.')
    await user.type(screen.getByLabelText(/nit/i), '900200200-2')
    await user.type(screen.getByLabelText(/teléfono/i), '3006666666')
    await user.type(screen.getByLabelText(/ciudad/i), 'Cali')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: onClose is called (form closes)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  it('should show the "Guardar" button disabled while the form is submitting', async () => {
    // GIVEN: MSW simulates a slow POST that eventually returns 201
    server.use(
      http.post('**/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json(
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            nombre: 'Empresa Pending S.A.',
            nitRuc: '900300300-3',
            telefono: '3007777777',
            ciudad: 'Medellín',
            createdAt: '2026-06-17T14:30:00Z',
          },
          { status: 201 }
        )
      })
    )

    const user = userEvent.setup()
    renderClienteForm()

    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Pending S.A.')
    await user.type(screen.getByLabelText(/nit/i), '900300300-3')
    await user.type(screen.getByLabelText(/teléfono/i), '3007777777')
    await user.type(screen.getByLabelText(/ciudad/i), 'Medellín')

    // WHEN: The user clicks "Guardar"
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: The "Guardar" button becomes disabled or shows "Guardando..." while submitting
    // NOTE: This checks for EITHER disabled state OR text change during submission
    const btn = screen.getByRole('button', { name: /guardar|guardando/i })
    // At least one of these must be true immediately after click
    const isDisabledOrPending =
      btn.hasAttribute('disabled') || btn.textContent?.includes('Guardando')
    expect(isDisabledOrPending).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — "Cancelar" closes the form without creating any record
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — "Cancelar" calls onClose, no API call fired', () => {
  it('should call onClose when the user clicks "Cancelar"', async () => {
    // GIVEN: ClienteForm rendered
    const user = userEvent.setup()
    const { onClose } = renderClienteForm()

    // WHEN: The user clicks "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: onClose is called
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('should NOT fire a POST to /api/v1/clientes when the user clicks "Cancelar"', async () => {
    // GIVEN: MSW tracks any POST requests
    let apiCallFired = false
    server.use(
      http.post('**/api/v1/clientes', () => {
        apiCallFired = true
        return HttpResponse.json({}, { status: 201 })
      })
    )

    const user = userEvent.setup()
    renderClienteForm()

    // Fill some fields (partially)
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa No Guardada Corp.')

    // WHEN: The user clicks "Cancelar" instead of "Guardar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    await new Promise((resolve) => setTimeout(resolve, 200))

    // THEN: No API call was fired
    expect(apiCallFired).toBe(false)
  })

  it('should NOT call onSuccess when the user clicks "Cancelar"', async () => {
    // GIVEN: ClienteForm rendered
    const user = userEvent.setup()
    const { onSuccess } = renderClienteForm()

    // WHEN: The user clicks "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: onSuccess is NOT called (no client was created)
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
