/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * ClienteForm edit mode does NOT exist yet — all tests will fail.
 *
 * Acceptance Criteria covered:
 *   AC1 — Form opens pre-filled with all current client values (FR6)
 *   AC2 — Valid submit calls useUpdateCliente.mutate with correct payload
 *   AC3 — Clearing a required field shows inline error, mutate NOT called (FR8)
 *   AC4 — "Cancelar" calls onClose without calling mutate
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ClienteForm does not yet support edit mode — this WILL FAIL (RED phase)
import { ClienteForm } from './ClienteForm'

// Mock useUpdateCliente — hook does not exist yet (RED phase)
vi.mock('../application/useUpdateCliente', () => ({
  useUpdateCliente: vi.fn(),
}))

import { useUpdateCliente } from '../application/useUpdateCliente'

const mockMutate = vi.fn()
const mockOnClose = vi.fn()
const mockOnSuccess = vi.fn()

const CLIENTE_ID = '00000000-0000-0000-0000-000000000002'

const initialValues = {
  id: CLIENTE_ID,
  nombre: 'Empresa Original SA',
  nit: '900111222-1',
  telefono: '3001112222',
  ciudad: 'Medellín',
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Form renders pre-filled with initial values (edit mode)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — AC1: Form pre-filled with current values', () => {
  beforeEach(() => {
    vi.mocked(useUpdateCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateCliente>)
    mockMutate.mockClear()
    mockOnClose.mockClear()
  })

  it('renders the form with data-testid="cliente-form" in edit mode', () => {
    // GIVEN: ClienteForm is mounted in edit mode with initialValues
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN: Form element is present
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument()
  })

  it('pre-fills Nombre input with initialValues.nombre', () => {
    // GIVEN: ClienteForm is mounted in edit mode
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN: Nombre input has the initial value (AC1 — FR6)
    const nombreInput = screen.getByLabelText(/nombre/i) as HTMLInputElement
    expect(nombreInput.value).toBe(initialValues.nombre)
  })

  it('pre-fills NIT/RUC input with initialValues.nit', () => {
    // GIVEN: ClienteForm is mounted in edit mode
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN: NIT input has the initial value
    const nitInput = screen.getByLabelText(/nit/i) as HTMLInputElement
    expect(nitInput.value).toBe(initialValues.nit)
  })

  it('pre-fills Teléfono input with initialValues.telefono', () => {
    // GIVEN: ClienteForm is mounted in edit mode
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN: Teléfono input has the initial value
    const telefonoInput = screen.getByLabelText(/teléfono/i) as HTMLInputElement
    expect(telefonoInput.value).toBe(initialValues.telefono)
  })

  it('pre-fills Ciudad input with initialValues.ciudad', () => {
    // GIVEN: ClienteForm is mounted in edit mode
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN: Ciudad input has the initial value
    const ciudadInput = screen.getByLabelText(/ciudad/i) as HTMLInputElement
    expect(ciudadInput.value).toBe(initialValues.ciudad)
  })

  it('renders submit button with data-testid="cliente-form-submit"', () => {
    // GIVEN: ClienteForm is mounted in edit mode
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN: Submit button is present
    expect(screen.getByTestId('cliente-form-submit')).toBeInTheDocument()
  })

  it('renders "Cancelar" button', () => {
    // GIVEN: ClienteForm is mounted in edit mode
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN: Cancelar button is present
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Valid submit calls useUpdateCliente.mutate with correct payload
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — AC2: Valid submission calls mutate with updated payload', () => {
  beforeEach(() => {
    vi.mocked(useUpdateCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateCliente>)
    mockMutate.mockClear()
    mockOnClose.mockClear()
  })

  it('calls useUpdateCliente.mutate with modified payload including id on valid submission', async () => {
    // GIVEN: Form is in edit mode with pre-filled values
    const user = userEvent.setup()
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN: User modifies nombre and submits
    const nombreInput = screen.getByLabelText(/nombre/i)
    await user.clear(nombreInput)
    await user.type(nombreInput, 'Empresa Actualizada SAS')
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: mutate is called with the correct payload including the client id (AC2)
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        id: CLIENTE_ID,
        nombre: 'Empresa Actualizada SAS',
        nit: initialValues.nit,
        telefono: initialValues.telefono,
        ciudad: initialValues.ciudad,
      })
    })
  })

  it('calls useUpdateCliente.mutate with all four fields present on valid submission', async () => {
    // GIVEN: Form is in edit mode, user modifies ciudad
    const user = userEvent.setup()
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const ciudadInput = screen.getByLabelText(/ciudad/i)
    await user.clear(ciudadInput)
    await user.type(ciudadInput, 'Cali')

    // WHEN: User submits
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: All four fields are present in the mutate call
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: expect.any(String),
          nit: expect.any(String),
          telefono: expect.any(String),
          ciudad: 'Cali',
        })
      )
    })
  })

  it('disables submit button when isPending is true', () => {
    // GIVEN: Form is rendered while mutation is pending
    vi.mocked(useUpdateCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateCliente>)

    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN: Submit button is disabled while pending (AC2 — loading state)
    expect(screen.getByTestId('cliente-form-submit')).toBeDisabled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Clearing a required field shows inline error and blocks submit
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — AC3: Inline validation errors on cleared required fields', () => {
  beforeEach(() => {
    vi.mocked(useUpdateCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateCliente>)
    mockMutate.mockClear()
    mockOnClose.mockClear()
  })

  it('shows inline error for Nombre when cleared and submitted', async () => {
    // GIVEN: Form is in edit mode with pre-filled values
    const user = userEvent.setup()
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN: User clears Nombre and submits
    await user.clear(screen.getByLabelText(/nombre/i))
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: Inline error for Nombre is shown (AC3 — FR8)
    await waitFor(() => {
      expect(screen.getByText(/nombre requerido/i)).toBeInTheDocument()
    })
  })

  it('shows inline error for NIT when cleared and submitted', async () => {
    // GIVEN: Form is in edit mode
    const user = userEvent.setup()
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN: User clears NIT and submits
    await user.clear(screen.getByLabelText(/nit/i))
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: Inline error for NIT is shown
    await waitFor(() => {
      expect(screen.getByText(/nit.*requerido/i)).toBeInTheDocument()
    })
  })

  it('shows inline error for Teléfono when cleared and submitted', async () => {
    // GIVEN: Form is in edit mode
    const user = userEvent.setup()
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN: User clears Teléfono and submits
    await user.clear(screen.getByLabelText(/teléfono/i))
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: Inline error for Teléfono is shown
    await waitFor(() => {
      expect(screen.getByText(/teléfono requerido/i)).toBeInTheDocument()
    })
  })

  it('shows inline error for Ciudad when cleared and submitted', async () => {
    // GIVEN: Form is in edit mode
    const user = userEvent.setup()
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN: User clears Ciudad and submits
    await user.clear(screen.getByLabelText(/ciudad/i))
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: Inline error for Ciudad is shown
    await waitFor(() => {
      expect(screen.getByText(/ciudad requerida/i)).toBeInTheDocument()
    })
  })

  it('does NOT call mutate when a required field is cleared and form is submitted', async () => {
    // GIVEN: Form is in edit mode, user clears Nombre
    const user = userEvent.setup()
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    await user.clear(screen.getByLabelText(/nombre/i))

    // WHEN: User submits
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: mutate was NOT called (frontend validation blocks submission — AC3)
    await waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — "Cancelar" closes form without saving changes
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — AC4: Cancelar closes without saving', () => {
  beforeEach(() => {
    vi.mocked(useUpdateCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateCliente>)
    mockMutate.mockClear()
    mockOnClose.mockClear()
  })

  it('calls onClose when "Cancelar" is clicked', async () => {
    // GIVEN: Form is in edit mode
    const user = userEvent.setup()
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: onClose is called (form closes — AC4)
    expect(mockOnClose).toHaveBeenCalledOnce()
  })

  it('does NOT call mutate when "Cancelar" is clicked', async () => {
    // GIVEN: Form is in edit mode, user has modified a field but not submitted
    const user = userEvent.setup()
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // User types but does NOT submit
    await user.clear(screen.getByLabelText(/nombre/i))
    await user.type(screen.getByLabelText(/nombre/i), 'Nombre No Guardado')

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: mutate was NOT called — original data is preserved (AC4)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('calls onClose exactly once when "Cancelar" is clicked', async () => {
    // GIVEN: Form is in edit mode
    const user = userEvent.setup()
    render(
      <ClienteForm
        mode="edit"
        initialValues={initialValues}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: onClose called exactly once (no double-close)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
