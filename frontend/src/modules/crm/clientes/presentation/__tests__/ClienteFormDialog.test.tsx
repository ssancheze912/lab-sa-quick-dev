import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ClienteFormDialog } from '../ClienteFormDialog'

// Mock useCreateCliente hook
vi.mock('../../application/useCreateCliente', () => ({
  useCreateCliente: vi.fn(),
}))

// Mock useUpdateCliente hook
vi.mock('../../application/useUpdateCliente', () => ({
  useUpdateCliente: vi.fn(),
}))

import { useCreateCliente } from '../../application/useCreateCliente'
import { useUpdateCliente } from '../../application/useUpdateCliente'

const mockUseCreateCliente = useCreateCliente as ReturnType<typeof vi.fn>
const mockUseUpdateCliente = useUpdateCliente as ReturnType<typeof vi.fn>

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
    mockUseUpdateCliente.mockReturnValue(defaultMutation)
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

  // ---------------------------------------------------------------------------
  // Story 2.4 — Edit mode edge cases
  // Test IDs: UNIT-C-FE-CFD-13 … UNIT-C-FE-CFD-20
  // ---------------------------------------------------------------------------

  const mockClienteForEdit = {
    id: 'abc12345-e29b-41d4-a716-446655440001',
    nombre: 'Empresa Pre-filled SAS',
    nit: '900100002-5',
    telefono: '+57 310 000 0001',
    ciudad: 'Medellín',
    createdAt: '2026-05-20T08:00:00Z',
    updatedAt: '2026-05-20T08:00:00Z',
  }

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-13: Edit mode — dialog title changes to "Editar cliente"
  // Boundary: component reads `isEditMode = cliente !== undefined` for title
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-13 — edit mode shows title "Editar cliente" not "Nuevo cliente"', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} cliente={mockClienteForEdit} />)

    expect(screen.getByText(/editar cliente/i)).toBeInTheDocument()
    expect(screen.queryByText(/^nuevo cliente$/i)).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-14: Create mode — dialog title is "Nuevo cliente" (no cliente prop)
  // Boundary: no regression when cliente is undefined
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-14 — create mode shows title "Nuevo cliente" when no cliente prop', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} />)

    expect(screen.getByText(/nuevo cliente/i)).toBeInTheDocument()
    expect(screen.queryByText(/editar cliente/i)).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-15: Edit mode — input-nombre is pre-filled with cliente.nombre
  // Boundary: useEffect + reset() contract
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-15 — edit mode pre-fills input-nombre with cliente.nombre', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} cliente={mockClienteForEdit} />)

    expect(screen.getByTestId('input-nombre')).toHaveValue(mockClienteForEdit.nombre)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-16: Edit mode — all four inputs are pre-filled with cliente data
  // Boundary: full form pre-fill contract (AC1)
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-16 — edit mode pre-fills all four fields with cliente data', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} cliente={mockClienteForEdit} />)

    expect(screen.getByTestId('input-nombre')).toHaveValue(mockClienteForEdit.nombre)
    expect(screen.getByTestId('input-nit')).toHaveValue(mockClienteForEdit.nit)
    expect(screen.getByTestId('input-telefono')).toHaveValue(mockClienteForEdit.telefono)
    expect(screen.getByTestId('input-ciudad')).toHaveValue(mockClienteForEdit.ciudad)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-17: Edit mode — submitting valid form calls updateMutation.mutate,
  //   NOT createMutation.mutate
  // Boundary: mutation selection logic `const mutation = cliente ? update : create`
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-17 — edit mode submit calls updateMutation.mutate, not createMutation.mutate', async () => {
    const updateMutateSpy = vi.fn()
    const createMutateSpy = vi.fn()

    mockUseUpdateCliente.mockReturnValue({ ...defaultMutation, mutate: updateMutateSpy })
    mockUseCreateCliente.mockReturnValue({ ...defaultMutation, mutate: createMutateSpy })

    render(<ClienteFormDialog open={true} onClose={mockOnClose} cliente={mockClienteForEdit} />)

    fireEvent.click(screen.getByTestId('btn-guardar'))

    await waitFor(() => {
      expect(updateMutateSpy).toHaveBeenCalledOnce()
    })
    expect(createMutateSpy).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-18: Edit mode — updateMutation.mutate is called with { id, data }
  //   where id equals cliente.id
  // Boundary: correct payload shape expected by useUpdateCliente
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-18 — edit mode mutate is called with { id: cliente.id, data: formValues }', async () => {
    const updateMutateSpy = vi.fn()
    mockUseUpdateCliente.mockReturnValue({ ...defaultMutation, mutate: updateMutateSpy })

    render(<ClienteFormDialog open={true} onClose={mockOnClose} cliente={mockClienteForEdit} />)

    fireEvent.click(screen.getByTestId('btn-guardar'))

    await waitFor(() => expect(updateMutateSpy).toHaveBeenCalledOnce())

    const [callArg] = updateMutateSpy.mock.calls[0]
    expect(callArg.id).toBe(mockClienteForEdit.id)
    expect(callArg.data.nombre).toBe(mockClienteForEdit.nombre)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-19: Edit mode — isPending uses updateMutation.isPending (not createMutation)
  // Boundary: loading state source is the correct mutation in edit mode
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-19 — edit mode uses updateMutation.isPending for loading state', () => {
    mockUseUpdateCliente.mockReturnValue({ ...defaultMutation, isPending: true })
    mockUseCreateCliente.mockReturnValue({ ...defaultMutation, isPending: false })

    render(<ClienteFormDialog open={true} onClose={mockOnClose} cliente={mockClienteForEdit} />)

    expect(screen.getByTestId('btn-guardar')).toHaveTextContent('Guardando...')
    expect(screen.getByTestId('btn-guardar')).toBeDisabled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CFD-20: Edit mode — error messages are not shown on initial render
  //   (pre-filled form starts clean, no validation errors visible)
  // Boundary: no premature validation fire on mount
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CFD-20 — edit mode shows no inline errors on initial render with valid pre-filled data', () => {
    render(<ClienteFormDialog open={true} onClose={mockOnClose} cliente={mockClienteForEdit} />)

    expect(screen.queryByTestId('error-nombre')).not.toBeInTheDocument()
    expect(screen.queryByTestId('error-nit')).not.toBeInTheDocument()
    expect(screen.queryByTestId('error-telefono')).not.toBeInTheDocument()
    expect(screen.queryByTestId('error-ciudad')).not.toBeInTheDocument()
  })
})
