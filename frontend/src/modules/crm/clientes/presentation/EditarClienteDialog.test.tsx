// ─────────────────────────────────────────────────────────────────────────────
// ATDD — Story 2.4: Edit Client
// Test Level: Component (Vitest + React Testing Library)
// Phase: RED — all tests fail until implementation exists
//
// Acceptance Criteria covered:
//   AC1 — EditarClienteDialog renders inside a Dialog with title "Editar cliente",
//          all 4 fields pre-filled from defaultValues, autoFocus on Nombre
//   AC2 — Valid submit calls PUT /api/v1/clientes/{id}, closes modal,
//          invalidates both ['clientes'] and ['clientes', id] queries,
//          shows toast "Cliente actualizado correctamente"
//   AC3 — Empty required fields show inline errors; form NOT submitted to backend
//   AC4 — Clicking "Cancelar" or pressing Esc closes dialog without submitting
//   AC5 — 409 conflict shows "El NIT/RUC ya está registrado" below NIT field
//   AC6 — "Guardar" is disabled and shows "Guardando..." when isPending=true
//   AC7 — Accessibility: role="dialog", aria-labelledby, focus returns to trigger
//
// Required data-testid attributes (implementation must add these):
//   - data-testid="editar-cliente-dialog"     — dialog content wrapper
//   - data-testid="cliente-form"              — form element inside dialog
//   - data-testid="cliente-nombre-input"      — Nombre text input
//   - data-testid="cliente-nit-input"         — NIT/RUC text input
//   - data-testid="cliente-telefono-input"    — Teléfono text input
//   - data-testid="cliente-ciudad-input"      — Ciudad input
//   - data-testid="cliente-nombre-error"      — Nombre inline error paragraph
//   - data-testid="cliente-nit-error"         — NIT/RUC inline error paragraph
//   - data-testid="cliente-telefono-error"    — Teléfono inline error paragraph
//   - data-testid="cliente-ciudad-error"      — Ciudad inline error paragraph
//   - data-testid="guardar-btn"               — "Guardar" submit button
//   - data-testid="cancelar-btn"              — "Cancelar" button
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Module mock: useUpdateCliente hook ────────────────────────────────────────
vi.mock('../application/useUpdateCliente', () => ({
  useUpdateCliente: vi.fn(),
}))

import { useUpdateCliente } from '../application/useUpdateCliente'
import { EditarClienteDialog } from './EditarClienteDialog'

// ── Test wrapper ──────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

const DEFAULT_VALUES = {
  nombre: 'Empresa Existente',
  nit: '900111222-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
}

const CLIENTE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

function renderDialog(open: boolean, onClose = vi.fn()) {
  const qc = makeQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <EditarClienteDialog
        open={open}
        onClose={onClose}
        clienteId={CLIENTE_ID}
        defaultValues={DEFAULT_VALUES}
      />
    </QueryClientProvider>,
  )
}

// ── Shared mock helpers ───────────────────────────────────────────────────────

const mockUseUpdateCliente = useUpdateCliente as ReturnType<typeof vi.fn>

function mockIdle(mutateFn = vi.fn()) {
  mockUseUpdateCliente.mockReturnValue({
    mutate: mutateFn,
    isPending: false,
    isError: false,
    error: null,
  })
}

function mockPending() {
  mockUseUpdateCliente.mockReturnValue({
    mutate: vi.fn(),
    isPending: true,
    isError: false,
    error: null,
  })
}

function mockConflictError() {
  const error = Object.assign(new Error('Conflict'), {
    response: {
      status: 409,
      data: { detail: "El NIT/RUC '900111222-1' ya está registrado." },
    },
  })
  mockUseUpdateCliente.mockReturnValue({
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
// AC1 — Dialog renders with correct title and pre-filled fields
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — EditarClienteDialog renders form inside Dialog with pre-filled values', () => {
  it('renders nothing when open=false', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is rendered with open=false
    renderDialog(false)

    // THEN: No dialog content is visible
    expect(screen.queryByTestId('editar-cliente-dialog')).not.toBeInTheDocument()
  })

  it('renders the dialog content when open=true', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is rendered with open=true
    renderDialog(true)

    // THEN: Dialog content is visible
    expect(screen.getByTestId('editar-cliente-dialog')).toBeInTheDocument()
  })

  it('shows dialog title "Editar cliente"', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: Title "Editar cliente" is visible
    expect(screen.getByText('Editar cliente')).toBeInTheDocument()
  })

  it('renders the client form inside the dialog', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: ClienteForm is rendered inside the dialog
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument()
  })

  it('renders all 4 form fields when dialog is open', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: All 4 fields are visible
    expect(screen.getByTestId('cliente-nombre-input')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-nit-input')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-telefono-input')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-ciudad-input')).toBeInTheDocument()
  })

  it('pre-fills Nombre field with defaultValues.nombre', () => {
    // GIVEN: useUpdateCliente is idle, defaultValues provided
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: Nombre field shows pre-filled value
    expect(screen.getByTestId('cliente-nombre-input')).toHaveValue('Empresa Existente')
  })

  it('pre-fills NIT/RUC field with defaultValues.nit', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: NIT field shows pre-filled value
    expect(screen.getByTestId('cliente-nit-input')).toHaveValue('900111222-1')
  })

  it('pre-fills Teléfono field with defaultValues.telefono', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: Teléfono field shows pre-filled value
    expect(screen.getByTestId('cliente-telefono-input')).toHaveValue('3001234567')
  })

  it('pre-fills Ciudad field with defaultValues.ciudad', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: Ciudad field shows pre-filled value
    expect(screen.getByTestId('cliente-ciudad-input')).toHaveValue('Bogotá')
  })

  it('renders the "Guardar" and "Cancelar" buttons', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: Action buttons are visible
    expect(screen.getByTestId('guardar-btn')).toBeInTheDocument()
    expect(screen.getByTestId('cancelar-btn')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Valid submit calls useUpdateCliente mutate
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Valid form submission calls useUpdateCliente mutate', () => {
  it('calls mutate when all fields are filled and Guardar is clicked', async () => {
    // GIVEN: Dialog open with pre-filled values and spy on mutate
    const mutateSpy = vi.fn()
    mockIdle(mutateSpy)
    renderDialog(true)

    // WHEN: User clicks "Guardar" (fields already pre-filled)
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: mutate is called once
    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('calls mutate with the form field values', async () => {
    // GIVEN: Dialog open with pre-filled values
    const mutateSpy = vi.fn()
    mockIdle(mutateSpy)
    renderDialog(true)

    // WHEN: User clicks "Guardar"
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: mutate is called with the current field values
    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Empresa Existente',
          nit: '900111222-1',
          telefono: '3001234567',
          ciudad: 'Bogotá',
        }),
      )
    })
  })

  it('calls mutate with updated values when user modifies a field', async () => {
    // GIVEN: Dialog open with pre-filled values
    const mutateSpy = vi.fn()
    mockIdle(mutateSpy)
    renderDialog(true)

    // WHEN: User clears and updates Nombre field
    const nombreInput = screen.getByTestId('cliente-nombre-input')
    await userEvent.clear(nombreInput)
    await userEvent.type(nombreInput, 'Empresa Actualizada')
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: mutate is called with the updated Nombre
    await waitFor(() => {
      expect(mutateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Empresa Actualizada' }),
      )
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Inline validation errors on empty required fields
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Inline validation errors for empty required fields', () => {
  it('shows inline error below Nombre when cleared and submitted', async () => {
    // GIVEN: Dialog open, user clears Nombre
    mockIdle()
    renderDialog(true)

    // WHEN: User clears the Nombre field and clicks "Guardar"
    await userEvent.clear(screen.getByTestId('cliente-nombre-input'))
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: Nombre error is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-nombre-error')).toBeInTheDocument()
    })
  })

  it('shows inline error below NIT/RUC when cleared and submitted', async () => {
    // GIVEN: Dialog open, user clears NIT field
    mockIdle()
    renderDialog(true)

    // WHEN: User clears NIT field and clicks "Guardar"
    await userEvent.clear(screen.getByTestId('cliente-nit-input'))
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: NIT error is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-nit-error')).toBeInTheDocument()
    })
  })

  it('shows inline error below Teléfono when cleared and submitted', async () => {
    // GIVEN: Dialog open, user clears Teléfono
    mockIdle()
    renderDialog(true)

    // WHEN: User clears Teléfono field and clicks "Guardar"
    await userEvent.clear(screen.getByTestId('cliente-telefono-input'))
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: Teléfono error is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-telefono-error')).toBeInTheDocument()
    })
  })

  it('shows inline error below Ciudad when cleared and submitted', async () => {
    // GIVEN: Dialog open, user clears Ciudad
    mockIdle()
    renderDialog(true)

    // WHEN: User clears Ciudad field and clicks "Guardar"
    await userEvent.clear(screen.getByTestId('cliente-ciudad-input'))
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: Ciudad error is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-ciudad-error')).toBeInTheDocument()
    })
  })

  it('does NOT call mutate when required fields are cleared', async () => {
    // GIVEN: Dialog open with spy on mutate
    const mutateSpy = vi.fn()
    mockIdle(mutateSpy)
    renderDialog(true)

    // WHEN: User clears Nombre and clicks "Guardar"
    await userEvent.clear(screen.getByTestId('cliente-nombre-input'))
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: mutate was NOT called (validation blocked submission)
    expect(mutateSpy).not.toHaveBeenCalled()
  })

  it('error messages use "Este campo es requerido" text for empty Nombre', async () => {
    // GIVEN: Dialog open
    mockIdle()
    renderDialog(true)

    // WHEN: User clears Nombre and submits
    await userEvent.clear(screen.getByTestId('cliente-nombre-input'))
    await userEvent.click(screen.getByTestId('guardar-btn'))

    // THEN: Error text matches Zod schema message
    await waitFor(() => {
      const errorEl = screen.getByTestId('cliente-nombre-error')
      expect(errorEl).toHaveTextContent('Este campo es requerido')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Closing dialog without saving preserves original data
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — Cancel or Esc closes dialog without submitting', () => {
  it('calls onClose when "Cancelar" button is clicked', async () => {
    // GIVEN: Dialog is open with onClose spy
    mockIdle()
    const onCloseSpy = vi.fn()
    renderDialog(true, onCloseSpy)

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('cancelar-btn'))

    // THEN: onClose is called
    expect(onCloseSpy).toHaveBeenCalledTimes(1)
  })

  it('does NOT call mutate when "Cancelar" is clicked', async () => {
    // GIVEN: Dialog open with spy on mutate
    const mutateSpy = vi.fn()
    mockIdle(mutateSpy)
    renderDialog(true)

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('cancelar-btn'))

    // THEN: mutate was NOT called
    expect(mutateSpy).not.toHaveBeenCalled()
  })

  it('calls onClose when Esc key is pressed while dialog is open', async () => {
    // GIVEN: Dialog is open with onClose spy
    mockIdle()
    const onCloseSpy = vi.fn()
    renderDialog(true, onCloseSpy)

    // WHEN: User presses Escape
    await userEvent.keyboard('{Escape}')

    // THEN: onClose is called (dialog handles Esc natively)
    await waitFor(() => {
      expect(onCloseSpy).toHaveBeenCalled()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — 409 NIT conflict shows inline error on NIT field
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — 409 NIT conflict shows inline error on NIT field', () => {
  it('renders "El NIT/RUC ya está registrado" below NIT field when 409 error is set', async () => {
    // GIVEN: Hook returns isError=true with a 409 conflict error
    mockConflictError()
    renderDialog(true)

    // WHEN: The useEffect in ClienteForm fires due to isError+error state (edit mode)
    // THEN: The NIT error message appears below the NIT field
    await waitFor(() => {
      const nitError = screen.queryByTestId('cliente-nit-error')
      expect(nitError).toBeInTheDocument()
      expect(nitError).toHaveTextContent('El NIT/RUC ya está registrado')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — "Guardar" is disabled and shows "Guardando..." when isPending=true
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Guardar button loading state when isPending', () => {
  it('disables "Guardar" button when isPending is true', () => {
    // GIVEN: useUpdateCliente returns isPending=true
    mockPending()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: "Guardar" button is disabled
    expect(screen.getByTestId('guardar-btn')).toBeDisabled()
  })

  it('shows "Guardando..." text on the submit button when isPending is true', () => {
    // GIVEN: useUpdateCliente returns isPending=true
    mockPending()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: Button shows loading text
    expect(screen.getByTestId('guardar-btn')).toHaveTextContent('Guardando...')
  })

  it('"Guardar" button is enabled and shows "Guardar" text when idle', () => {
    // GIVEN: useUpdateCliente returns isPending=false
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: Button is enabled with normal text
    const btn = screen.getByTestId('guardar-btn')
    expect(btn).not.toBeDisabled()
    expect(btn).toHaveTextContent('Guardar')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Accessibility: role="dialog", aria-labelledby, focus
// ─────────────────────────────────────────────────────────────────────────────

describe('AC7 — Accessibility attributes on EditarClienteDialog', () => {
  it('dialog element has role="dialog"', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: Element with role="dialog" is present
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
  })

  it('dialog has aria-labelledby pointing to the dialog title', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: Dialog has aria-labelledby attribute
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby')
  })

  it('dialog title element id matches the aria-labelledby value', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is open
    renderDialog(true)

    // THEN: aria-labelledby value references the title element
    const dialog = screen.getByRole('dialog')
    const labelledById = dialog.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()

    // The element with that id should contain "Editar cliente"
    const titleEl = document.getElementById(labelledById!)
    expect(titleEl).toBeTruthy()
    expect(titleEl?.textContent).toContain('Editar cliente')
  })

  it('does not render dialog DOM when open=false (no hidden dialog in DOM)', () => {
    // GIVEN: useUpdateCliente is idle
    mockIdle()

    // WHEN: Dialog is closed
    renderDialog(false)

    // THEN: role="dialog" element is not in the DOM
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
