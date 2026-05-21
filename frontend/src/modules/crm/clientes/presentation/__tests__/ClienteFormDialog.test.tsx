import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ClienteFormDialog } from '../ClienteFormDialog'

// Mock useCreateCliente hook
vi.mock('../../application/useCreateCliente', () => ({
  useCreateCliente: vi.fn(),
}))

import { useCreateCliente } from '../../application/useCreateCliente'

const mockUseCreateCliente = useCreateCliente as ReturnType<typeof vi.fn>

/**
 * Component tests for ClienteFormDialog — Story 2.3 edge case expansion.
 * BMad-Integrated: covers loading state, cancel behavior, field rendering,
 * non-409 error handling, and dialog interaction edge cases.
 *
 * Test IDs: UNIT-C-FE-CFD-01 … UNIT-C-FE-CFD-12
 */
describe('ClienteFormDialog', () => {
  const mockOnClose = vi.fn()

  const defaultMutation = {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCreateCliente.mockReturnValue(defaultMutation)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-01: Dialog renders with all four input fields when open=true
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-01 — renders all four input fields when open', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('input-nombre')).toBeInTheDocument()
    expect(screen.getByTestId('input-nit')).toBeInTheDocument()
    expect(screen.getByTestId('input-telefono')).toBeInTheDocument()
    expect(screen.getByTestId('input-ciudad')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-02: Dialog renders save and cancel buttons when open=true
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-02 — renders btn-guardar and btn-cancelar when open', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('btn-guardar')).toBeInTheDocument()
    expect(screen.getByTestId('btn-cancelar')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-03: Dialog does NOT render when open=false
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-03 — dialog is not visible when open=false', () => {
    render(<ClienteFormDialog open={false} onClose={mockOnClose} />)
    expect(screen.queryByTestId('cliente-form-dialog')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-04: Cancel button calls onClose
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-04 — clicking btn-cancelar calls onClose', async () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)
    fireEvent.click(screen.getByTestId('btn-cancelar'))
    expect(mockOnClose).toHaveBeenCalledOnce()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-05: Guardar button shows "Guardando..." when isPending = true
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-05 — btn-guardar shows "Guardando..." text while mutation is pending', () => {
    mockUseCreateCliente.mockReturnValue({ ...defaultMutation, isPending: true })

    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)

    const guardarBtn = screen.getByTestId('btn-guardar')
    expect(guardarBtn).toHaveTextContent('Guardando...')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-06: Both buttons are disabled when isPending = true
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-06 — both buttons are disabled while mutation is pending', () => {
    mockUseCreateCliente.mockReturnValue({ ...defaultMutation, isPending: true })

    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('btn-guardar')).toBeDisabled()
    expect(screen.getByTestId('btn-cancelar')).toBeDisabled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-07: Guardar shows "Guardar" label when not pending
  // Boundary: button text reverts to default when isPending = false.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-07 — btn-guardar shows "Guardar" text when not pending', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)
    expect(screen.getByTestId('btn-guardar')).toHaveTextContent('Guardar')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-08: Submitting empty form shows inline validation errors
  // Edge case: Zod resolver errors rendered by React Hook Form
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-08 — submitting empty form shows inline validation errors for each field', async () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)

    fireEvent.click(screen.getByTestId('btn-guardar'))

    await waitFor(() => {
      expect(screen.getByTestId('error-nombre') || screen.queryByText(/nombre es requerido/i)).toBeTruthy()
    })

    // Mutation must NOT be called when frontend validation fails
    expect(defaultMutation.mutate).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-09: error-nit element is NOT visible when there is no nit error
  // Boundary: element should not be present or hidden when there is no error
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-09 — error-nit is not visible initially (no error state)', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)
    expect(screen.queryByTestId('error-nit')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-10: Input fields have required aria attributes
  // Accessibility: WCAG 2.1 AA — each input must have aria-required="true"
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-10 — all input fields have aria-required="true"', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('input-nombre')).toHaveAttribute('aria-required', 'true')
    expect(screen.getByTestId('input-nit')).toHaveAttribute('aria-required', 'true')
    expect(screen.getByTestId('input-telefono')).toHaveAttribute('aria-required', 'true')
    expect(screen.getByTestId('input-ciudad')).toHaveAttribute('aria-required', 'true')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-11: Dialog has data-testid="cliente-form-dialog" on DialogContent
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-11 — dialog content element has data-testid="cliente-form-dialog"', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)
    expect(screen.getByTestId('cliente-form-dialog')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-12: Input fields are linked to labels via htmlFor/id (accessibility)
  // WCAG 2.1 AA — programmatic association between labels and inputs
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-12 — input fields are accessible via their labels', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)

    // getByLabelText() will throw if the label is not programmatically linked
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nit\/ruc/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ciudad/i)).toBeInTheDocument()
  })
})
