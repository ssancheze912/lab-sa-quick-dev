import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeleteClienteDialog } from '../DeleteClienteDialog'

vi.mock('../../application/useDeleteCliente', () => ({
  useDeleteCliente: vi.fn(),
}))

vi.mock('../../../../../shared/lib/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { useDeleteCliente } from '../../application/useDeleteCliente'
import { toast } from '../../../../../shared/lib/toastStore'

const mockUseDeleteCliente = useDeleteCliente as ReturnType<typeof vi.fn>
const mockToastSuccess = toast.success as ReturnType<typeof vi.fn>

const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440099'

/**
 * Component tests for DeleteClienteDialog — Story 2.5.
 * Covers AC1 (dialog shows), AC2 (confirm deletes), AC4 (cancel does not delete).
 */
describe('DeleteClienteDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnDeleted = vi.fn()

  const defaultMutate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDeleteCliente.mockReturnValue({
      mutate: defaultMutate,
      isPending: false,
    })
  })

  // ---------------------------------------------------------------------------
  // AC1: Dialog renders title and both buttons when open
  // ---------------------------------------------------------------------------
  it('renders dialog with title and Cancelar/Confirmar buttons when open', () => {
    render(
      <DeleteClienteDialog
        open={true}
        onClose={mockOnClose}
        clienteId={CLIENT_ID}
        hasContacts={false}
        onDeleted={mockOnDeleted}
      />
    )

    expect(screen.getByTestId('delete-cliente-dialog')).toBeInTheDocument()
    expect(screen.getByText('¿Eliminar este cliente?')).toBeInTheDocument()
    expect(screen.getByTestId('btn-cancelar-eliminar')).toBeInTheDocument()
    expect(screen.getByTestId('btn-confirmar-eliminar')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // AC4: Cancel button calls onClose without firing delete mutation
  // ---------------------------------------------------------------------------
  it('cancel button calls onClose and does not call mutate', () => {
    render(
      <DeleteClienteDialog
        open={true}
        onClose={mockOnClose}
        clienteId={CLIENT_ID}
        hasContacts={false}
        onDeleted={mockOnDeleted}
      />
    )

    fireEvent.click(screen.getByTestId('btn-cancelar-eliminar'))

    expect(mockOnClose).toHaveBeenCalledOnce()
    expect(defaultMutate).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // AC2: Confirm button calls mutate with clienteId
  // ---------------------------------------------------------------------------
  it('confirm button calls mutate with clienteId', () => {
    render(
      <DeleteClienteDialog
        open={true}
        onClose={mockOnClose}
        clienteId={CLIENT_ID}
        hasContacts={false}
        onDeleted={mockOnDeleted}
      />
    )

    fireEvent.click(screen.getByTestId('btn-confirmar-eliminar'))

    expect(defaultMutate).toHaveBeenCalledWith(CLIENT_ID, expect.any(Object))
  })

  // ---------------------------------------------------------------------------
  // AC2: Toast "Cliente eliminado correctamente" shown when hasContacts = false
  // ---------------------------------------------------------------------------
  it('shows "Cliente eliminado correctamente" toast when hasContacts is false', async () => {
    mockUseDeleteCliente.mockReturnValue({
      mutate: vi.fn((id, options) => { options.onSuccess() }),
      isPending: false,
    })

    render(
      <DeleteClienteDialog
        open={true}
        onClose={mockOnClose}
        clienteId={CLIENT_ID}
        hasContacts={false}
        onDeleted={mockOnDeleted}
      />
    )

    fireEvent.click(screen.getByTestId('btn-confirmar-eliminar'))

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Cliente eliminado correctamente')
    })
    expect(mockOnClose).toHaveBeenCalledOnce()
    expect(mockOnDeleted).toHaveBeenCalledOnce()
  })

  // ---------------------------------------------------------------------------
  // AC3: Toast with contact message shown when hasContacts = true
  // ---------------------------------------------------------------------------
  it('shows contact-unassignment toast when hasContacts is true', async () => {
    mockUseDeleteCliente.mockReturnValue({
      mutate: vi.fn((id, options) => { options.onSuccess() }),
      isPending: false,
    })

    render(
      <DeleteClienteDialog
        open={true}
        onClose={mockOnClose}
        clienteId={CLIENT_ID}
        hasContacts={true}
        onDeleted={mockOnDeleted}
      />
    )

    fireEvent.click(screen.getByTestId('btn-confirmar-eliminar'))

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.'
      )
    })
  })

  // ---------------------------------------------------------------------------
  // Loading state: confirm button shows "Eliminando..." and is disabled
  // ---------------------------------------------------------------------------
  it('shows "Eliminando..." and disables buttons while isPending is true', () => {
    mockUseDeleteCliente.mockReturnValue({
      mutate: defaultMutate,
      isPending: true,
    })

    render(
      <DeleteClienteDialog
        open={true}
        onClose={mockOnClose}
        clienteId={CLIENT_ID}
        hasContacts={false}
        onDeleted={mockOnDeleted}
      />
    )

    expect(screen.getByTestId('btn-confirmar-eliminar')).toHaveTextContent('Eliminando...')
    expect(screen.getByTestId('btn-confirmar-eliminar')).toBeDisabled()
    expect(screen.getByTestId('btn-cancelar-eliminar')).toBeDisabled()
  })

  // ---------------------------------------------------------------------------
  // ARIA accessibility: dialog has role="alertdialog" and aria-labelledby
  // ---------------------------------------------------------------------------
  it('dialog content has role="alertdialog" and aria-labelledby pointing to title', () => {
    render(
      <DeleteClienteDialog
        open={true}
        onClose={mockOnClose}
        clienteId={CLIENT_ID}
        hasContacts={false}
        onDeleted={mockOnDeleted}
      />
    )

    const dialog = screen.getByTestId('delete-cliente-dialog')
    expect(dialog).toHaveAttribute('role', 'alertdialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'delete-dialog-title')
  })
})
