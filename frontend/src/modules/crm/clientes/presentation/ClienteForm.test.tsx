/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * ClienteForm does NOT exist yet — all tests will fail with module-not-found.
 *
 * Acceptance Criteria covered:
 *   AC1 — Form renders all 4 required fields with Spanish labels
 *   AC2 — Valid submit calls mutate, closes form, success handled by parent
 *   AC3 — Empty field validation shows inline errors, mutate NOT called
 *   AC4 — Cancelar calls onClose without submitting
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ClienteForm does not exist yet — this import WILL FAIL (RED phase)
import { ClienteForm } from './ClienteForm'

// Mock useCreateCliente hook — does not exist yet (RED phase)
vi.mock('../application/useCreateCliente', () => ({
  useCreateCliente: vi.fn(),
}))

import { useCreateCliente } from '../application/useCreateCliente'

const mockMutate = vi.fn()
const mockOnClose = vi.fn()
const mockOnSuccess = vi.fn()

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Form renders all 4 required fields with Spanish labels
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — AC1: Required fields with Spanish labels', () => {
  beforeEach(() => {
    vi.mocked(useCreateCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreateCliente>)
  })

  it('renders the form element with data-testid="cliente-form"', () => {
    // GIVEN: ClienteForm is mounted
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: Form has required data-testid
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument()
  })

  it('renders Nombre field with Spanish label', () => {
    // GIVEN: ClienteForm is mounted
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: "Nombre" label is visible and associated with an input
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
  })

  it('renders NIT/RUC field with Spanish label', () => {
    // GIVEN: ClienteForm is mounted
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: "NIT" or "NIT/RUC" label is visible and associated with an input
    expect(screen.getByLabelText(/nit/i)).toBeInTheDocument()
  })

  it('renders Teléfono field with Spanish label', () => {
    // GIVEN: ClienteForm is mounted
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: "Teléfono" label is visible and associated with an input
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
  })

  it('renders Ciudad field with Spanish label', () => {
    // GIVEN: ClienteForm is mounted
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: "Ciudad" label is visible and associated with an input
    expect(screen.getByLabelText(/ciudad/i)).toBeInTheDocument()
  })

  it('renders "Guardar" submit button with data-testid="cliente-form-submit"', () => {
    // GIVEN: ClienteForm is mounted
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: Submit button is present
    expect(screen.getByTestId('cliente-form-submit')).toBeInTheDocument()
  })

  it('renders "Cancelar" button', () => {
    // GIVEN: ClienteForm is mounted
    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: Cancelar button is present
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Valid submit calls mutate with correct payload
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — AC2: Valid submission calls mutate with correct payload', () => {
  beforeEach(() => {
    vi.mocked(useCreateCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreateCliente>)
    mockMutate.mockClear()
  })

  it('calls mutate with all four required fields on valid submission', async () => {
    // GIVEN: Form is rendered with all hooks mocked
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} onSuccess={mockOnSuccess} />)

    // WHEN: User fills all required fields and submits
    await user.type(screen.getByLabelText(/nombre/i), 'Empresa ABC')
    await user.type(screen.getByLabelText(/nit/i), '900123456-1')
    await user.type(screen.getByLabelText(/teléfono/i), '3001234567')
    await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá')
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: mutate is called with correct payload
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        nombre: 'Empresa ABC',
        nit: '900123456-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      })
    })
  })

  it('disables submit button when isPending is true', () => {
    // GIVEN: Form is rendered while mutation is pending
    vi.mocked(useCreateCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
    } as unknown as ReturnType<typeof useCreateCliente>)

    render(<ClienteForm onClose={mockOnClose} />)

    // THEN: Submit button is disabled during pending state
    expect(screen.getByTestId('cliente-form-submit')).toBeDisabled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Empty required fields show inline errors, mutate NOT called
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — AC3: Inline validation errors on empty required fields', () => {
  beforeEach(() => {
    vi.mocked(useCreateCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreateCliente>)
    mockMutate.mockClear()
  })

  it('shows inline error for empty Nombre field when form is submitted', async () => {
    // GIVEN: Form is rendered with all other fields filled except Nombre
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/nit/i), '900123456-1')
    await user.type(screen.getByLabelText(/teléfono/i), '3001234567')
    await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá')

    // WHEN: User submits the form without Nombre
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: Inline error for Nombre is displayed
    await waitFor(() => {
      expect(screen.getByText(/nombre requerido/i)).toBeInTheDocument()
    })
  })

  it('shows inline error for empty NIT field when form is submitted', async () => {
    // GIVEN: Form is rendered with all other fields filled except NIT
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Test')
    await user.type(screen.getByLabelText(/teléfono/i), '3001234567')
    await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá')

    // WHEN: User submits the form without NIT
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: Inline error for NIT is displayed
    await waitFor(() => {
      expect(screen.getByText(/nit.*requerido/i)).toBeInTheDocument()
    })
  })

  it('shows inline error for empty Teléfono field when form is submitted', async () => {
    // GIVEN: Form is rendered with all other fields filled except Teléfono
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Test')
    await user.type(screen.getByLabelText(/nit/i), '900123456-1')
    await user.type(screen.getByLabelText(/ciudad/i), 'Bogotá')

    // WHEN: User submits the form without Teléfono
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: Inline error for Teléfono is displayed
    await waitFor(() => {
      expect(screen.getByText(/teléfono requerido/i)).toBeInTheDocument()
    })
  })

  it('shows inline error for empty Ciudad field when form is submitted', async () => {
    // GIVEN: Form is rendered with all other fields filled except Ciudad
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    await user.type(screen.getByLabelText(/nombre/i), 'Empresa Test')
    await user.type(screen.getByLabelText(/nit/i), '900123456-1')
    await user.type(screen.getByLabelText(/teléfono/i), '3001234567')

    // WHEN: User submits the form without Ciudad
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: Inline error for Ciudad is displayed
    await waitFor(() => {
      expect(screen.getByText(/ciudad requerida/i)).toBeInTheDocument()
    })
  })

  it('does NOT call mutate when all required fields are empty', async () => {
    // GIVEN: Form is rendered with no fields filled
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    // WHEN: User clicks submit without filling any field
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: mutate is NOT called (frontend validation prevents submission)
    await waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled()
    })
  })

  it('shows all 4 inline errors when form is submitted completely empty', async () => {
    // GIVEN: Form is rendered with no fields filled
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    // WHEN: User clicks submit with all fields empty
    await user.click(screen.getByTestId('cliente-form-submit'))

    // THEN: All 4 inline errors are visible
    await waitFor(() => {
      expect(screen.getByText(/nombre requerido/i)).toBeInTheDocument()
      expect(screen.getByText(/nit.*requerido/i)).toBeInTheDocument()
      expect(screen.getByText(/teléfono requerido/i)).toBeInTheDocument()
      expect(screen.getByText(/ciudad requerida/i)).toBeInTheDocument()
    })
  })

  it('calls onClose without calling mutate when "Cancelar" is clicked', async () => {
    // GIVEN: Form is rendered
    const user = userEvent.setup()
    render(<ClienteForm onClose={mockOnClose} />)

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    // THEN: onClose is called and mutate is NOT called
    expect(mockOnClose).toHaveBeenCalledOnce()
    expect(mockMutate).not.toHaveBeenCalled()
  })
})
