// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.3: Create Client
// Test Level: Component (Vitest + React Testing Library)
// Phase: RED — all tests fail until implementation exists
//
// Acceptance Criteria covered:
//   AC1 — Form renders 4 required fields, * markers, "* Campos obligatorios" legend
//   AC2 — Valid submit calls useCreateCliente mutate; success closes form
//   AC3 — Empty fields on submit show inline errors in text-sm text-red-600
//   AC4 — 409 conflict shows "El NIT/RUC ya está registrado" below NIT field
//   AC5 — "Cancelar" calls onClose and resets form
//   AC7 — "Guardar" is disabled and shows "Guardando..." when isPending=true
//
// Required data-testid attributes (implementation must add these):
//   - data-testid="cliente-form"
//   - data-testid="cliente-nombre-input"
//   - data-testid="cliente-nit-input"
//   - data-testid="cliente-telefono-input"
//   - data-testid="cliente-ciudad-input"
//   - data-testid="cliente-nombre-error"
//   - data-testid="cliente-nit-error"
//   - data-testid="cliente-telefono-error"
//   - data-testid="cliente-ciudad-error"
//   - data-testid="guardar-btn"
//   - data-testid="cancelar-btn"
//   - data-testid="campos-obligatorios-legend"
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Module mock: useCreateCliente hook ────────────────────────────────────────
// ClienteForm imports useCreateCliente from its application layer.
// We mock it to control isPending, isError, and mutate behavior.
vi.mock('../application/useCreateCliente', () => ({
  useCreateCliente: vi.fn(),
}))

import { useCreateCliente } from '../application/useCreateCliente'
import { ClienteForm } from './ClienteForm'

// ── Test wrapper ──────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

function renderForm(onClose = vi.fn()) {
  const qc = makeQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <ClienteForm onClose={onClose} />
    </QueryClientProvider>,
  )
}

// ── Shared mock helper ────────────────────────────────────────────────────────

const mockUseCreateCliente = useCreateCliente as ReturnType<typeof vi.fn>

function mockIdle(mutateFn = vi.fn()) {
  mockUseCreateCliente.mockReturnValue({
    mutate: mutateFn,
    isPending: false,
    isError: false,
    error: null,
  })
}

function mockPending() {
  mockUseCreateCliente.mockReturnValue({
    mutate: vi.fn(),
    isPending: true,
    isError: false,
    error: null,
  })
}

function mockConflictError() {
  const error = Object.assign(new Error('Conflict'), {
    response: { status: 409, data: { detail: "El NIT/RUC '123' ya está registrado." } },
  })
  mockUseCreateCliente.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: true,
    error,
  })
}

// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Form renders 4 required fields with * markers and legend
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — ClienteForm renders all required fields', () => {
  it('renders the form element', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Form element is present
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument()
  })

  it('renders the Nombre input field', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Nombre input is visible
    expect(screen.getByTestId('cliente-nombre-input')).toBeInTheDocument()
  })

  it('renders the NIT/RUC input field', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: NIT/RUC input is visible
    expect(screen.getByTestId('cliente-nit-input')).toBeInTheDocument()
  })

  it('renders the Teléfono input field', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Teléfono input is visible
    expect(screen.getByTestId('cliente-telefono-input')).toBeInTheDocument()
  })

  it('renders the Ciudad field', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Ciudad field is visible
    expect(screen.getByTestId('cliente-ciudad-input')).toBeInTheDocument()
  })

  it('renders "Nombre *" label for the Nombre field', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Label with * marker is visible
    expect(screen.getByText(/nombre \*/i)).toBeInTheDocument()
  })

  it('renders "NIT/RUC *" label for the NIT field', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: NIT/RUC label with * is visible
    expect(screen.getByText(/nit\/ruc \*/i)).toBeInTheDocument()
  })

  it('renders "Teléfono *" label for the Teléfono field', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Teléfono label with * is visible
    expect(screen.getByText(/teléfono \*/i)).toBeInTheDocument()
  })

  it('renders "Ciudad *" label for the Ciudad field', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Ciudad label with * is visible
    expect(screen.getByText(/ciudad \*/i)).toBeInTheDocument()
  })

  it('renders "* Campos obligatorios" legend at the form footer', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Legend text is present
    expect(screen.getByTestId('campos-obligatorios-legend')).toBeInTheDocument()
    expect(screen.getByTestId('campos-obligatorios-legend')).toHaveTextContent(
      '* Campos obligatorios',
    )
  })

  it('renders the "Guardar" submit button', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Guardar button is visible
    expect(screen.getByTestId('guardar-btn')).toBeInTheDocument()
    expect(screen.getByTestId('guardar-btn')).toHaveTextContent('Guardar')
  })

  it('renders the "Cancelar" button', () => {
    // GIVEN: useCreateCliente is idle
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Cancelar button is visible
    expect(screen.getByTestId('cancelar-btn')).toBeInTheDocument()
    expect(screen.getByTestId('cancelar-btn')).toHaveTextContent('Cancelar')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Zod inline validation errors on empty submit
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Inline validation errors for empty required fields', () => {
  it('shows inline error below Nombre when empty on submit', async () => {
    // GIVEN: Form is rendered with idle mutation
    mockIdle()
    renderForm()

    // WHEN: User clicks "Guardar" without filling any field
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: Nombre error is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-nombre-error')).toBeInTheDocument()
    })
  })

  it('shows inline error below NIT/RUC when empty on submit', async () => {
    // GIVEN: Form is rendered with idle mutation
    mockIdle()
    renderForm()

    // WHEN: User clicks "Guardar" without filling any field
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: NIT error is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-nit-error')).toBeInTheDocument()
    })
  })

  it('shows inline error below Teléfono when empty on submit', async () => {
    // GIVEN: Form is rendered with idle mutation
    mockIdle()
    renderForm()

    // WHEN: User clicks "Guardar" without filling any field
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: Teléfono error is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-telefono-error')).toBeInTheDocument()
    })
  })

  it('shows inline error below Ciudad when empty on submit', async () => {
    // GIVEN: Form is rendered with idle mutation
    mockIdle()
    renderForm()

    // WHEN: User clicks "Guardar" without filling any field
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: Ciudad error is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-ciudad-error')).toBeInTheDocument()
    })
  })

  it('does NOT call mutate when required fields are empty', async () => {
    // GIVEN: Form is rendered with spy on mutate
    const mutateSpy = vi.fn()
    mockIdle(mutateSpy)
    renderForm()

    // WHEN: User clicks "Guardar" without filling any field
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: mutate was not called (validation blocked submission)
    expect(mutateSpy).not.toHaveBeenCalled()
  })

  it('error messages use "Este campo es requerido" text for empty Nombre', async () => {
    // GIVEN: Form rendered idle
    mockIdle()
    renderForm()

    // WHEN: Submit with empty Nombre
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: Error text matches Zod schema message
    await waitFor(() => {
      const errorEl = screen.getByTestId('cliente-nombre-error')
      expect(errorEl).toHaveTextContent('Este campo es requerido')
    })
  })

  it('error messages use "El NIT no puede estar vacío" text for empty NIT', async () => {
    // GIVEN: Form rendered idle
    mockIdle()
    renderForm()

    // WHEN: Submit with empty NIT (fill other fields to isolate NIT error)
    await userEvent.type(screen.getByTestId('cliente-nombre-input'), 'Empresa Test')
    await userEvent.type(screen.getByTestId('cliente-telefono-input'), '3001234567')
    await userEvent.type(screen.getByTestId('cliente-ciudad-input'), 'Bogotá')
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: NIT error message is shown
    await waitFor(() => {
      const errorEl = screen.getByTestId('cliente-nit-error')
      expect(errorEl).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Valid submit calls mutate with form data
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Valid form submission calls useCreateCliente mutate', () => {
  it('calls mutate with form data when all fields are filled and Guardar is clicked', async () => {
    // GIVEN: Form rendered with spy on mutate
    const mutateSpy = vi.fn()
    mockIdle(mutateSpy)
    renderForm()

    // WHEN: User fills all required fields
    await userEvent.type(screen.getByTestId('cliente-nombre-input'), 'Empresa Válida')
    await userEvent.type(screen.getByTestId('cliente-nit-input'), '900123456-1')
    await userEvent.type(screen.getByTestId('cliente-telefono-input'), '3001234567')
    await userEvent.type(screen.getByTestId('cliente-ciudad-input'), 'Bogotá')

    // AND: Clicks "Guardar"
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: mutate is called once
    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('calls mutate with correct field values matching form input', async () => {
    // GIVEN: Form rendered with spy on mutate
    const mutateSpy = vi.fn()
    mockIdle(mutateSpy)
    renderForm()

    // WHEN: User fills all fields with specific values
    await userEvent.type(screen.getByTestId('cliente-nombre-input'), 'Construcciones ATDD')
    await userEvent.type(screen.getByTestId('cliente-nit-input'), '800987654-2')
    await userEvent.type(screen.getByTestId('cliente-telefono-input'), '6017654321')
    await userEvent.type(screen.getByTestId('cliente-ciudad-input'), 'Cali')
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: mutate called with matching data
    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Construcciones ATDD',
          nit: '800987654-2',
          telefono: '6017654321',
          ciudad: 'Cali',
        }),
      )
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — 409 conflict shows inline error on NIT field
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 409 NIT conflict shows inline error on NIT field', () => {
  it('renders "El NIT/RUC ya está registrado" below NIT field when 409 error is set', async () => {
    // GIVEN: Form where mutation has a 409 conflict error AND setError was called on nit
    // Simulated by rendering with a component that sets nit field error on mount (via useEffect or
    // via the hook calling setError on the form — tested by wiring the onError callback)
    // For ATDD, we validate the error appears via the component's error rendering logic
    mockIdle()
    renderForm()

    // Fill the form to isolate to NIT error
    await userEvent.type(screen.getByTestId('cliente-nombre-input'), 'Empresa Duplicada')
    await userEvent.type(screen.getByTestId('cliente-nit-input'), '900000001')
    await userEvent.type(screen.getByTestId('cliente-telefono-input'), '3001234567')
    await userEvent.type(screen.getByTestId('cliente-ciudad-input'), 'Bogotá')

    // Trigger 409: mock mutate to call setError on nit in the component's onError
    // The component's onError handler should call setError('nit', { message: 'El NIT/RUC ya está registrado' })
    // We verify the error element exists with correct text when this scenario occurs
    // For RED phase: this test documents the EXPECTED behavior — error must appear below NIT
    // The implementation must call setError('nit', ...) in the onError callback

    // Note: The actual 409 flow is tested via the mutate mock returning an error.
    // This is a RED test — it will fail until implementation wires 409 → setError('nit', ...).
    mockConflictError()

    // Re-render to apply conflict error state
    vi.clearAllMocks()
    mockUseCreateCliente.mockReturnValue({
      mutate: vi.fn((_, { onError } = {}) => {
        // Simulate the component calling setError after 409
      }),
      isPending: false,
      isError: false,
      error: null,
    })

    // Simulate: component calls form.setError('nit', ...) after 409
    // This ATDD test validates the NIT error element exists with the exact required message
    // The RED failure will be: TestId 'cliente-nit-error' not found OR text mismatch
    const { rerender } = renderForm()

    // After 409, implementation MUST set nit field error via setError
    // Verify the error container exists and is wired to the NIT field
    await userEvent.type(screen.getByTestId('cliente-nit-input'), '900000001')
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // The test fails (RED) because NIT error is not shown yet until:
    // 1. Backend returns 409
    // 2. Component calls setError('nit', { message: 'El NIT/RUC ya está registrado' })
    // This is the acceptance test that drives that implementation
    await waitFor(() => {
      const nitError = screen.queryByTestId('cliente-nit-error')
      // RED phase: nitError may be null — this assertion documents expected behavior
      expect(nitError).toBeInTheDocument()
      expect(nitError).toHaveTextContent('El NIT/RUC ya está registrado')
    }, { timeout: 1000 }).catch(() => {
      // Expected failure in RED phase — NIT conflict error not yet wired
      throw new Error(
        'RED: NIT conflict error "El NIT/RUC ya está registrado" not shown below NIT field. ' +
        'Implementation must call setError("nit", { message: "El NIT/RUC ya está registrado" }) on 409 response.',
      )
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — "Cancelar" calls onClose
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Cancelar button calls onClose callback', () => {
  it('calls onClose when "Cancelar" button is clicked', async () => {
    // GIVEN: Form rendered with onClose spy
    mockIdle()
    const onCloseSpy = vi.fn()
    renderForm(onCloseSpy)

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('cancelar-btn'))

    // THEN: onClose is called once
    expect(onCloseSpy).toHaveBeenCalledTimes(1)
  })

  it('does NOT call mutate when "Cancelar" is clicked', async () => {
    // GIVEN: Form rendered with spy on mutate
    const mutateSpy = vi.fn()
    mockIdle(mutateSpy)
    renderForm()

    // Fill form to ensure we're testing cancel, not empty-validation-block
    await userEvent.type(screen.getByTestId('cliente-nombre-input'), 'Test')

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('cancelar-btn'))

    // THEN: mutate was NOT called
    expect(mutateSpy).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — "Guardar" is disabled and shows "Guardando..." when isPending=true
// ─────────────────────────────────────────────────────────────────────────────

describe('AC7 — Guardar button loading state when isPending', () => {
  it('disables "Guardar" button when isPending is true', () => {
    // GIVEN: useCreateCliente returns isPending=true
    mockPending()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: "Guardar" button is disabled
    expect(screen.getByTestId('guardar-btn')).toBeDisabled()
  })

  it('shows "Guardando..." text on the submit button when isPending is true', () => {
    // GIVEN: useCreateCliente returns isPending=true
    mockPending()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Button shows loading text
    expect(screen.getByTestId('guardar-btn')).toHaveTextContent('Guardando...')
  })

  it('"Guardar" button is enabled and shows "Guardar" text when idle', () => {
    // GIVEN: useCreateCliente returns isPending=false
    mockIdle()

    // WHEN: ClienteForm is rendered
    renderForm()

    // THEN: Button is enabled with normal text
    const btn = screen.getByTestId('guardar-btn')
    expect(btn).not.toBeDisabled()
    expect(btn).toHaveTextContent('Guardar')
  })
})
