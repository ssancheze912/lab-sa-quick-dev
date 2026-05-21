import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

/**
 * Component tests for DeleteClienteDialog — Story 2.5: Delete Client
 *
 * Tests are in RED phase — they define the expected behaviour BEFORE implementation.
 * Make these tests GREEN by:
 *   - Creating DeleteClienteDialog.tsx in the presentation folder
 *   - Using Radix UI Dialog with role="alertdialog" and aria-labelledby
 *   - Adding data-testid="delete-cliente-dialog" on DialogContent
 *   - Adding data-testid="btn-confirmar-eliminar" on the confirm button
 *   - Adding data-testid="btn-cancelar-eliminar" on the cancel button
 *   - Wiring the confirm button to call onConfirm prop
 *   - Wiring the cancel button to call onClose prop without triggering mutation
 *   - Showing loading state (disabled + "Eliminando...") while isPending is true
 *
 * Coverage:
 *   UNIT-C-FE-DCD-01  AC1   — Dialog renders with data-testid="delete-cliente-dialog" when open=true
 *   UNIT-C-FE-DCD-02  AC1   — Dialog contains question text "¿Eliminar este cliente?"
 *   UNIT-C-FE-DCD-03  AC1   — Dialog has "Confirmar" button (data-testid="btn-confirmar-eliminar")
 *   UNIT-C-FE-DCD-04  AC1   — Dialog has "Cancelar" button (data-testid="btn-cancelar-eliminar")
 *   UNIT-C-FE-DCD-05  AC4   — Clicking "Cancelar" calls onClose without calling onConfirm
 *   UNIT-C-FE-DCD-06  AC2   — Clicking "Confirmar" calls onConfirm with the clienteId
 *   UNIT-C-FE-DCD-07  AC2   — When isPending=true confirm button is disabled and shows "Eliminando..."
 *   UNIT-C-FE-DCD-08  AC1   — Dialog does not render (or is hidden) when open=false
 *   UNIT-C-FE-DCD-09  AC1   — Dialog has role="alertdialog" for accessibility (WCAG 2.1 AA)
 *   UNIT-C-FE-DCD-10  AC2   — When isPending=false confirm button is enabled
 */

// ---------------------------------------------------------------------------
// Mock: DeleteClienteDialog does not exist yet — tests will fail (RED phase)
// ---------------------------------------------------------------------------
// NOTE: Uncomment the import below once the component is implemented:
// import { DeleteClienteDialog } from '../DeleteClienteDialog'
//
// For the RED phase we define a minimal stub so the test file itself
// can be loaded. The stubs intentionally do NOT satisfy the test assertions.
// ---------------------------------------------------------------------------

const DeleteClienteDialogStub = (_props: {
  open: boolean
  onClose: () => void
  onConfirm: (clienteId: string) => void
  clienteId: string
  hasContacts: boolean
  isPending?: boolean
}) => null

// Use the stub during RED phase; replace with the real component when implementing
const DeleteClienteDialog = DeleteClienteDialogStub

// ---------------------------------------------------------------------------
// Component tests
// ---------------------------------------------------------------------------

describe('DeleteClienteDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    clienteId: '550e8400-e29b-41d4-a716-446655440001',
    hasContacts: false,
    isPending: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------------------------
  // UNIT-C-FE-DCD-01 (AC1)
  // Given DeleteClienteDialog is rendered with open=true
  // When the component mounts
  // Then the dialog container has data-testid="delete-cliente-dialog"
  // -------------------------------------------------------------------------
  it('UNIT-C-FE-DCD-01 — renders dialog with data-testid="delete-cliente-dialog" when open=true', () => {
    render(<DeleteClienteDialog {...defaultProps} />)

    // THEN — dialog is visible with the correct testid
    expect(screen.getByTestId('delete-cliente-dialog')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // UNIT-C-FE-DCD-02 (AC1)
  // Given the dialog is open
  // When the component mounts
  // Then the dialog body contains the Spanish confirmation question
  // -------------------------------------------------------------------------
  it('UNIT-C-FE-DCD-02 — dialog contains "¿Eliminar este cliente?" text', () => {
    render(<DeleteClienteDialog {...defaultProps} />)

    // THEN — the question text is present
    expect(screen.getByTestId('delete-cliente-dialog')).toHaveTextContent(/eliminar este cliente/i)
  })

  // -------------------------------------------------------------------------
  // UNIT-C-FE-DCD-03 (AC1)
  // Given the dialog is open
  // When the component mounts
  // Then the "Confirmar" button is rendered with the correct testid
  // -------------------------------------------------------------------------
  it('UNIT-C-FE-DCD-03 — renders "Confirmar" button with data-testid="btn-confirmar-eliminar"', () => {
    render(<DeleteClienteDialog {...defaultProps} />)

    // THEN — confirm button is present
    expect(screen.getByTestId('btn-confirmar-eliminar')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // UNIT-C-FE-DCD-04 (AC1)
  // Given the dialog is open
  // When the component mounts
  // Then the "Cancelar" button is rendered with the correct testid
  // -------------------------------------------------------------------------
  it('UNIT-C-FE-DCD-04 — renders "Cancelar" button with data-testid="btn-cancelar-eliminar"', () => {
    render(<DeleteClienteDialog {...defaultProps} />)

    // THEN — cancel button is present
    expect(screen.getByTestId('btn-cancelar-eliminar')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // UNIT-C-FE-DCD-05 (AC4)
  // Given the dialog is open
  // When the user clicks "Cancelar"
  // Then onClose is called exactly once
  //   AND onConfirm is NOT called
  // -------------------------------------------------------------------------
  it('UNIT-C-FE-DCD-05 — clicking "Cancelar" calls onClose without calling onConfirm', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(
      <DeleteClienteDialog
        {...defaultProps}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    // WHEN — user clicks "Cancelar"
    fireEvent.click(screen.getByTestId('btn-cancelar-eliminar'))

    // THEN — onClose called once
    expect(onClose).toHaveBeenCalledTimes(1)

    // AND — onConfirm is NOT triggered
    expect(onConfirm).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // UNIT-C-FE-DCD-06 (AC2)
  // Given the dialog is open and isPending=false
  // When the user clicks "Confirmar"
  // Then onConfirm is called with the clienteId
  //   AND onClose is NOT immediately called by the dialog itself
  // -------------------------------------------------------------------------
  it('UNIT-C-FE-DCD-06 — clicking "Confirmar" calls onConfirm with the correct clienteId', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    const clienteId = '550e8400-e29b-41d4-a716-446655440001'

    render(
      <DeleteClienteDialog
        {...defaultProps}
        clienteId={clienteId}
        onClose={onClose}
        onConfirm={onConfirm}
        isPending={false}
      />
    )

    // WHEN — user clicks "Confirmar"
    fireEvent.click(screen.getByTestId('btn-confirmar-eliminar'))

    // THEN — onConfirm called with the clienteId
    expect(onConfirm).toHaveBeenCalledWith(clienteId)
  })

  // -------------------------------------------------------------------------
  // UNIT-C-FE-DCD-07 (AC2)
  // Given the dialog is open and isPending=true (deletion in progress)
  // When the component renders
  // Then the "Confirmar" button is disabled
  //   AND the button label changes to "Eliminando..."
  // -------------------------------------------------------------------------
  it('UNIT-C-FE-DCD-07 — when isPending=true, confirm button is disabled and shows "Eliminando..."', () => {
    render(<DeleteClienteDialog {...defaultProps} isPending={true} />)

    const confirmBtn = screen.getByTestId('btn-confirmar-eliminar')

    // THEN — button is disabled during pending state
    expect(confirmBtn).toBeDisabled()

    // AND — button label reflects loading state
    expect(confirmBtn).toHaveTextContent(/eliminando/i)
  })

  // -------------------------------------------------------------------------
  // UNIT-C-FE-DCD-08 (AC1)
  // Given DeleteClienteDialog is rendered with open=false
  // When the component mounts
  // Then the dialog is not visible (not in the DOM or has hidden state)
  // -------------------------------------------------------------------------
  it('UNIT-C-FE-DCD-08 — dialog is not rendered or is hidden when open=false', () => {
    render(<DeleteClienteDialog {...defaultProps} open={false} />)

    // THEN — dialog is absent from the DOM
    expect(screen.queryByTestId('delete-cliente-dialog')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // UNIT-C-FE-DCD-09 (AC1)
  // Given the dialog is open
  // When the component mounts
  // Then the dialog root has role="alertdialog" for WCAG 2.1 AA accessibility
  // -------------------------------------------------------------------------
  it('UNIT-C-FE-DCD-09 — dialog has role="alertdialog" for WCAG 2.1 AA compliance', () => {
    render(<DeleteClienteDialog {...defaultProps} />)

    // THEN — dialog uses alertdialog role (required for destructive action confirmations)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // UNIT-C-FE-DCD-10 (AC2)
  // Given the dialog is open and isPending=false (default)
  // When the component mounts
  // Then the "Confirmar" button is enabled and ready for interaction
  // -------------------------------------------------------------------------
  it('UNIT-C-FE-DCD-10 — when isPending=false, confirm button is enabled', () => {
    render(<DeleteClienteDialog {...defaultProps} isPending={false} />)

    const confirmBtn = screen.getByTestId('btn-confirmar-eliminar')

    // THEN — button is enabled (not disabled)
    expect(confirmBtn).not.toBeDisabled()
  })
})
