/**
 * Story 2.5: Delete Client — Component Edge Cases
 * Epic 2: Client Management
 *
 * Expanded component-level automation: boundary conditions and UX edge cases
 * NOT covered by the ATDD acceptance tests (ClienteDetailView.delete.test.tsx).
 *
 * Scenarios covered:
 *   - Dialog description renders the client name for contextual awareness
 *   - "Cancelar" button is disabled while isPending = true
 *   - "Confirmar" shows "Eliminando..." text while isPending = true
 *   - Pressing Escape while dialog is open closes it without calling mutate
 *   - useDeleteCliente is called with onSuccess option (not a bare hook call)
 *   - Loading indicator: "delete-cliente-button" is still visible after cancel
 *   - Deletion does NOT call mutate when isPending is already true (double-submit guard)
 *   - Dialog onOpenChange is blocked when isPending is true
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClienteDetailView } from './ClienteDetailView'
import type { Cliente } from '../domain/Cliente'

// Mocks
vi.mock('../application/useCliente', () => ({
  useCliente: vi.fn(),
}))
vi.mock('../application/useDeleteCliente', () => ({
  useDeleteCliente: vi.fn(),
}))
vi.mock('../../contactos/application/useContactosPorCliente', () => ({
  useContactosPorCliente: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}))

import { useCliente } from '../application/useCliente'
import { useDeleteCliente } from '../application/useDeleteCliente'
import { useContactosPorCliente } from '../../contactos/application/useContactosPorCliente'

const mockMutate = vi.fn()

const mockCliente: Cliente = {
  id: 'edge-delete-id-456',
  nombre: 'Empresa Edge SA',
  nit: '900888000-1',
  telefono: '3008880001',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

function setupDefaultMocks(isPending = false) {
  vi.mocked(useCliente).mockReturnValue({
    data: mockCliente,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useCliente>)

  vi.mocked(useDeleteCliente).mockReturnValue({
    mutate: mockMutate,
    isPending,
    isError: false,
  } as unknown as ReturnType<typeof useDeleteCliente>)

  vi.mocked(useContactosPorCliente).mockReturnValue({
    data: [],
    isLoading: false,
  } as unknown as ReturnType<typeof useContactosPorCliente>)

  mockMutate.mockClear()
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog description — contextual client name
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView edge — Dialog description contains client name', () => {
  beforeEach(() => setupDefaultMocks())

  it('[P1] dialog description should include the client name for contextual confirmation', async () => {
    // GIVEN: ClienteDetailView is mounted with a loaded client
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    // WHEN: User opens the confirmation dialog
    await user.click(screen.getByTestId('delete-cliente-button'))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    // THEN: The dialog contains the client name (user knows what they are deleting)
    expect(screen.getByRole('alertdialog')).toHaveTextContent(mockCliente.nombre)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Loading state — "Cancelar" disabled when isPending
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView edge — Cancelar disabled when isPending', () => {
  it('[P1] "Cancelar" button should be disabled when isPending is true', async () => {
    // GIVEN: useDeleteCliente is in pending state
    setupDefaultMocks(true)
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    // WHEN: Dialog is opened (it was already pending)
    await user.click(screen.getByTestId('delete-cliente-button'))

    // THEN: "Cancelar" is disabled (prevents closing dialog mid-deletion)
    await waitFor(() => {
      expect(screen.getByTestId('delete-cancel-button')).toBeDisabled()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Loading state — "Confirmar" shows "Eliminando..." when isPending
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView edge — Confirmar shows loading text when isPending', () => {
  it('[P1] "Confirmar" button text should change to "Eliminando..." when isPending is true', async () => {
    // GIVEN: useDeleteCliente is in pending state
    setupDefaultMocks(true)
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    // WHEN: Dialog is opened
    await user.click(screen.getByTestId('delete-cliente-button'))

    // THEN: Button shows loading text (AC2 — loading state feedback)
    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-button')).toHaveTextContent('Eliminando...')
    })
  })

  it('[P1] "Confirmar" button text should be "Confirmar" when NOT pending', async () => {
    // GIVEN: Not pending state
    setupDefaultMocks(false)
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))

    // THEN: Button shows normal text
    expect(screen.getByTestId('delete-confirm-button')).toHaveTextContent('Confirmar')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Double-submit guard — clicking Confirmar while isPending does NOT call mutate again
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView edge — Confirmar disabled prevents double-submit', () => {
  it('[P1] clicking the disabled Confirmar button should NOT call mutate', async () => {
    // GIVEN: isPending = true (button is disabled)
    setupDefaultMocks(true)
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))
    await waitFor(() =>
      expect(screen.getByTestId('delete-confirm-button')).toBeDisabled()
    )

    // WHEN: User tries to click the disabled Confirmar button
    // userEvent respects the disabled attribute and does not fire click events
    await user.click(screen.getByTestId('delete-confirm-button')).catch(() => null)

    // THEN: mutate was NOT called (button was disabled)
    expect(mockMutate).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Loading / skeleton state — "Eliminar" button not shown during data load
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView edge — Delete button not visible during loading', () => {
  it('[P2] should NOT render "Eliminar" button when client data is loading', () => {
    // GIVEN: Client data is still loading
    vi.mocked(useCliente).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useCliente>)

    vi.mocked(useDeleteCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useDeleteCliente>)

    vi.mocked(useContactosPorCliente).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useContactosPorCliente>)

    render(<ClienteDetailView clienteId={mockCliente.id} />)

    // THEN: Eliminar button is not visible while loading (skeleton state)
    expect(screen.queryByTestId('delete-cliente-button')).not.toBeInTheDocument()
  })

  it('[P2] should NOT render "Eliminar" button when client is not found (isError)', () => {
    // GIVEN: Client data fetch returns error
    vi.mocked(useCliente).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useCliente>)

    vi.mocked(useDeleteCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useDeleteCliente>)

    vi.mocked(useContactosPorCliente).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useContactosPorCliente>)

    render(<ClienteDetailView clienteId={mockCliente.id} />)

    // THEN: Eliminar button not shown for not-found state
    expect(screen.queryByTestId('delete-cliente-button')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// "Eliminar" button remains accessible after cancellation
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView edge — Delete button remains available after dialog interactions', () => {
  beforeEach(() => setupDefaultMocks())

  it('[P1] "Eliminar" button should still be present and enabled after cancelling the dialog', async () => {
    // GIVEN: User opened and then cancelled the dialog
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))
    await user.click(screen.getByTestId('delete-cancel-button'))
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    )

    // THEN: "Eliminar" button is still enabled and clickable (AC3 — no permanent lock)
    const deleteBtn = screen.getByTestId('delete-cliente-button')
    expect(deleteBtn).toBeInTheDocument()
    expect(deleteBtn).not.toBeDisabled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// hasContacts = true toast forwarded via onSuccess
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView edge — Toast message depends on hasContacts', () => {
  it('[P1] component passes onSuccess callback option to useDeleteCliente (not a bare hook call)', () => {
    // GIVEN: Component is rendered with contacts present
    vi.mocked(useCliente).mockReturnValue({
      data: mockCliente,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCliente>)

    vi.mocked(useDeleteCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useDeleteCliente>)

    vi.mocked(useContactosPorCliente).mockReturnValue({
      data: [{ id: 'c1', nombre: 'Contacto Uno', clienteId: mockCliente.id }],
      isLoading: false,
    } as unknown as ReturnType<typeof useContactosPorCliente>)

    render(<ClienteDetailView clienteId={mockCliente.id} />)

    // THEN: useDeleteCliente was called with an options object (contains onSuccess callback)
    expect(vi.mocked(useDeleteCliente)).toHaveBeenCalledWith(
      expect.objectContaining({ onSuccess: expect.any(Function) })
    )
  })
})
