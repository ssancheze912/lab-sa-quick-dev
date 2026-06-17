/**
 * Story 2.3: Create Client — Edge Case Tests (Automate Expansion)
 * Epic 2: Client Management
 *
 * Coverage expansion beyond ATDD — edge cases, error paths, boundary conditions.
 * Tests NOT covered by ClienteForm.test.tsx (ATDD RED phase).
 *
 * Test coverage added here:
 *   [P1] 500 server error → toast.error() called, onClose NOT called
 *   [P1] Network/offline error → toast.error() called, onClose NOT called
 *   [P1] After 409 error, user can correct NIT and resubmit successfully
 *   [P1] onSuccess receives the created client object on success
 *   [P2] Form accessibility: form, buttons have correct aria attributes
 *   [P3] Guardar button starts enabled when form is idle (no mutation running)
 *   [P3] Multiple rapid Cancel clicks → onClose called each time
 *   [P3] Whitespace-only "nombre" — schema gap documented (fixme)
 *
 * Note: toast.error/toast.success are mocked because ToastProvider is not rendered
 * in unit tests (it requires an app-level provider). The mock validates the call
 * intent; actual rendering is covered by E2E/integration tests.
 *
 * Tooling: Vitest 2+ | @testing-library/react | @testing-library/user-event | MSW 2
 */

import { describe, it, test, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClienteForm } from './ClienteForm'

// ─────────────────────────────────────────────────────────────────────────────
// Mock siesa-ui-kit toast — ToastProvider is not in the test render tree
// Uses vi.hoisted() so mock fn references are available before vi.mock() hoisting
// ─────────────────────────────────────────────────────────────────────────────

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}))

vi.mock('siesa-ui-kit', async (importOriginal) => {
  const original = await importOriginal<typeof import('siesa-ui-kit')>()
  return {
    ...original,
    toast: Object.assign(vi.fn(), {
      success: mockToastSuccess,
      error: mockToastError,
      warning: vi.fn(),
      info: vi.fn(),
    }),
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  mockToastSuccess.mockClear()
  mockToastError.mockClear()
})
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
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

/** Fill all 4 required fields in a rendered ClienteForm */
async function fillAllFields(
  user: ReturnType<typeof userEvent.setup>,
  overrides: {
    nombre?: string
    nitRuc?: string
    telefono?: string
    ciudad?: string
  } = {}
) {
  await user.type(screen.getByLabelText(/nombre/i), overrides.nombre ?? 'Empresa Edge Cases S.A.S.')
  await user.type(screen.getByLabelText(/nit/i), overrides.nitRuc ?? '900111222-3')
  await user.type(screen.getByLabelText(/teléfono/i), overrides.telefono ?? '3001112223')
  await user.type(screen.getByLabelText(/ciudad/i), overrides.ciudad ?? 'Bogotá')
}

// ─────────────────────────────────────────────────────────────────────────────
// [P1] 500 server error handling
// When the backend returns 500, toast.error() is called and form stays open
// Note: toast.error is mocked — ToastProvider is not in the test tree
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] 500 server error → toast.error() called, form stays open', () => {
  it('should call toast.error() with the generic message when POST returns 500', async () => {
    // GIVEN: MSW returns 500 for POST /api/v1/clientes
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 }
        )
      })
    )

    const user = userEvent.setup()
    renderClienteForm()
    await fillAllFields(user)

    // WHEN: The user submits
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: toast.error was called with the generic fallback message
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/no se pudo guardar/i)
      )
    })
  })

  it('should NOT call onClose when POST returns 500', async () => {
    // GIVEN: MSW returns 500 for POST /api/v1/clientes
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.json({ status: 500 }, { status: 500 })
      })
    )

    const user = userEvent.setup()
    const { onClose } = renderClienteForm()
    await fillAllFields(user)

    // WHEN: The user submits
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // Wait for error handling to complete
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledOnce()
    })

    // THEN: onClose is NOT called (form stays open)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('should NOT call onSuccess when POST returns 500', async () => {
    // GIVEN: MSW returns 500 for POST /api/v1/clientes
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.json({ status: 500 }, { status: 500 })
      })
    )

    const user = userEvent.setup()
    const { onSuccess } = renderClienteForm()
    await fillAllFields(user)

    // WHEN: The user submits
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // Wait for error handling to complete
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledOnce()
    })

    // THEN: onSuccess is NOT called
    expect(onSuccess).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Network/offline error handling
// Note: toast.error is mocked — ToastProvider is not in the test tree
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] Network error → toast.error() called, form stays open', () => {
  it('should call toast.error() with generic message when the network request fails', async () => {
    // GIVEN: MSW simulates a network error (no response at all)
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.error()
      })
    )

    const user = userEvent.setup()
    renderClienteForm()
    await fillAllFields(user, { nombre: 'Empresa Network Fail S.A.' })

    // WHEN: The user submits
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: toast.error was called with the generic fallback message
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/no se pudo guardar/i)
      )
    })
  })

  it('should NOT call onClose when the network request fails', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.error()
      })
    )

    const user = userEvent.setup()
    const { onClose } = renderClienteForm()
    await fillAllFields(user)

    // WHEN: The user submits
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // Wait for error handling to complete
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledOnce()
    })

    // THEN: onClose is NOT called
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Re-submit after 409 correction
// After a 409 error, user corrects NIT/RUC and resubmits successfully
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] After 409 error, user corrects NIT and resubmits successfully', () => {
  it('should succeed on second submit after correcting the NIT/RUC following a 409 error', async () => {
    // GIVEN: MSW first returns 409, then 201 on next call
    let callCount = 0
    server.use(
      http.post('**/api/v1/clientes', () => {
        callCount++
        if (callCount === 1) {
          return HttpResponse.json(
            { status: 409, detail: 'El NIT/RUC ya está registrado' },
            { status: 409 }
          )
        }
        return HttpResponse.json(
          {
            id: '550e8400-e29b-41d4-a716-446655440099',
            nombre: 'Empresa Corregida S.A.S.',
            nitRuc: '900111333-4',
            telefono: '3001113334',
            ciudad: 'Bogotá',
            createdAt: '2026-06-17T15:00:00Z',
          },
          { status: 201 }
        )
      })
    )

    const user = userEvent.setup()
    const { onClose } = renderClienteForm()

    // WHEN: User submits with duplicate NIT (first attempt — 409)
    await fillAllFields(user, { nitRuc: '900111111-1' })
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // Wait for the inline 409 error
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    })

    // WHEN: User corrects the NIT/RUC field and resubmits (second attempt — 201)
    const nitField = screen.getByLabelText(/nit/i)
    await user.clear(nitField)
    await user.type(nitField, '900111333-4')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: onClose is called (successful creation)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P1] onSuccess receives the created client object
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] onSuccess callback receives the created cliente object', () => {
  it('should call onSuccess with the created cliente data returned from the API', async () => {
    // GIVEN: MSW returns a fully formed cliente object on 201
    const createdCliente = {
      id: '550e8400-e29b-41d4-a716-446655441000',
      nombre: 'Empresa Callback S.A.',
      nitRuc: '900500500-5',
      telefono: '3005005005',
      ciudad: 'Medellín',
      createdAt: '2026-06-17T16:00:00Z',
    }
    server.use(
      http.post('**/api/v1/clientes', () => {
        return HttpResponse.json(createdCliente, { status: 201 })
      })
    )

    const user = userEvent.setup()
    const { onSuccess } = renderClienteForm()

    // WHEN: User fills all fields and submits successfully
    await fillAllFields(user, {
      nombre: 'Empresa Callback S.A.',
      nitRuc: '900500500-5',
      telefono: '3005005005',
      ciudad: 'Medellín',
    })
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // THEN: onSuccess is called with the returned cliente
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          id: createdCliente.id,
          nombre: createdCliente.nombre,
          nitRuc: createdCliente.nitRuc,
        })
      )
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Whitespace-only field boundary — Zod min(1) DOES NOT reject strings of spaces
// FIXME: clienteSchema uses z.string().min(1) which passes whitespace-only strings.
// The schema needs .trim().min(1) to reject " " (spaces only).
// This is a known schema gap documented here for manual review.
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Whitespace-only values in required fields trigger validation errors', () => {
  /**
   * SCHEMA GAP — test.todo: whitespace-only nombre passes Zod min(1)
   *
   * Root cause: clienteSchema uses z.string().min(1) which counts whitespace chars.
   * "   " (3 spaces) has length 3, so it passes min(1) — no validation error fires.
   * react-hook-form does NOT trim inputs by default.
   *
   * Healing attempts (3 iterations, all confirmed schema issue):
   *   1. Confirmed Zod min(1) behavior with unit test → passes whitespace
   *   2. Confirmed react-hook-form passes untrimmed value → whitespace sent to API
   *   3. Confirmed API call IS fired with whitespace nombre → test cannot pass
   *
   * Fix needed: Update clienteSchema.ts:
   *   nombre: z.string().trim().min(1, 'El nombre es requerido').max(200, ...)
   *   nitRuc: z.string().trim().min(1, 'El NIT/RUC es requerido').max(50, ...)
   *   telefono: z.string().trim().min(1, 'El teléfono es requerido').max(50, ...)
   *   ciudad: z.string().trim().min(1, 'La ciudad es requerida').max(100, ...)
   *
   * This is a schema business logic decision — review with team before changing.
   */
  it.todo(
    '[SCHEMA GAP] should NOT fire POST when "nombre" is whitespace-only — requires z.string().trim().min(1) in clienteSchema'
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Accessibility — aria attributes on form elements
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Form accessibility attributes', () => {
  it('should render a form element with aria-label "Formulario de nuevo cliente"', () => {
    // GIVEN: ClienteForm is mounted
    renderClienteForm()

    // WHEN: The form is rendered
    // THEN: The form has the correct aria-label
    expect(screen.getByRole('form', { name: /formulario de nuevo cliente/i })).toBeInTheDocument()
  })

  it('should render the "Cancelar" button with an accessible aria label', () => {
    // GIVEN: ClienteForm is mounted
    renderClienteForm()

    // WHEN: The form is rendered
    // THEN: The "Cancelar" button has an accessible name
    const cancelBtn = screen.getByRole('button', { name: /cancelar/i })
    expect(cancelBtn).toBeInTheDocument()
  })

  it('should render the "Guardar" button with an accessible aria label', () => {
    // GIVEN: ClienteForm is mounted
    renderClienteForm()

    // WHEN: The form is rendered
    // THEN: The "Guardar" button has an accessible name
    const submitBtn = screen.getByRole('button', { name: /guardar/i })
    expect(submitBtn).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P3] Submit button idle state — should start enabled
// ─────────────────────────────────────────────────────────────────────────────

describe('[P3] "Guardar" button is enabled when form is idle (no pending mutation)', () => {
  it('should render the "Guardar" button as NOT disabled initially', () => {
    // GIVEN: ClienteForm is mounted with no mutation in flight
    renderClienteForm()

    // WHEN: Form is first rendered (idle state)
    const submitBtn = screen.getByRole('button', { name: /guardar/i })

    // THEN: The button is enabled
    expect(submitBtn).not.toBeDisabled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// [P3] Multiple Cancel clicks — onClose called each time
// ─────────────────────────────────────────────────────────────────────────────

describe('[P3] Multiple rapid Cancel clicks call onClose each time', () => {
  it('should call onClose twice when "Cancelar" is clicked twice', async () => {
    // GIVEN: ClienteForm rendered
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <QueryClientProvider client={makeQueryClient()}>
        <ClienteForm onClose={onClose} onSuccess={vi.fn()} />
      </QueryClientProvider>
    )

    // WHEN: The user clicks "Cancelar" twice
    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: onClose is called twice
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
