/**
 * Story 2.5: Delete Client
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level)
 * These tests INTENTIONALLY FAIL until implementation is complete.
 * "Eliminar" button and AlertDialog do NOT exist yet — all tests will fail.
 *
 * Acceptance Criteria covered:
 *   AC1 — Clicking "Eliminar" shows AlertDialog with "¿Eliminar este cliente?",
 *          "Confirmar" and "Cancelar" buttons
 *   AC2 — Clicking "Confirmar" calls useDeleteCliente.mutate with clienteId
 *   AC3 — Clicking "Cancelar" closes dialog without calling mutate
 *   AC2 — After successful deletion: navigates to /clientes
 *   AC2 — isPending disables the "Confirmar" button
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClienteDetailView } from './ClienteDetailView'
import type { Cliente } from '../domain/Cliente'

// Mock useCliente to provide the client data
vi.mock('../application/useCliente', () => ({
  useCliente: vi.fn(),
}))

// Mock useDeleteCliente — hook does not exist yet (RED phase)
vi.mock('../application/useDeleteCliente', () => ({
  useDeleteCliente: vi.fn(),
}))

// Mock useContactosPorCliente to control hasContacts scenario
vi.mock('../../contactos/application/useContactosPorCliente', () => ({
  useContactosPorCliente: vi.fn(),
}))

// Mock TanStack Router navigation
vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}))

import { useCliente } from '../application/useCliente'
import { useDeleteCliente } from '../application/useDeleteCliente'

const mockMutate = vi.fn()

const mockCliente: Cliente = {
  id: 'test-delete-id-123',
  nombre: 'Empresa A Eliminar SA',
  nit: '900999000-1',
  telefono: '3009990001',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Eliminar" button renders and opens confirmation dialog
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — AC1: Eliminar button and confirmation dialog', () => {
  beforeEach(() => {
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

    mockMutate.mockClear()
  })

  it('renders "Eliminar" button with data-testid="delete-cliente-button"', () => {
    // GIVEN: ClienteDetailView is mounted with a loaded client
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    // THEN: Eliminar button with correct testid is rendered (AC1)
    expect(screen.getByTestId('delete-cliente-button')).toBeInTheDocument()
  })

  it('opens confirmation dialog (alertdialog role) when "Eliminar" button is clicked', async () => {
    // GIVEN: ClienteDetailView is mounted
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    // WHEN: User clicks "Eliminar"
    await user.click(screen.getByTestId('delete-cliente-button'))

    // THEN: AlertDialog is visible (AC1)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('shows "¿Eliminar este cliente?" in the confirmation dialog title', async () => {
    // GIVEN: User opens the delete dialog
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    // THEN: Dialog title is "¿Eliminar este cliente?" (AC1)
    expect(screen.getByText('¿Eliminar este cliente?')).toBeInTheDocument()
  })

  it('shows "Confirmar" button with data-testid="delete-confirm-button" in the dialog', async () => {
    // GIVEN: Confirmation dialog is open
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))

    // THEN: "Confirmar" button with testid is in the dialog (AC1)
    expect(screen.getByTestId('delete-confirm-button')).toBeInTheDocument()
  })

  it('shows "Cancelar" button with data-testid="delete-cancel-button" in the dialog', async () => {
    // GIVEN: Confirmation dialog is open
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))

    // THEN: "Cancelar" button with testid is in the dialog (AC1)
    expect(screen.getByTestId('delete-cancel-button')).toBeInTheDocument()
  })

  it('does NOT show confirmation dialog before "Eliminar" is clicked', () => {
    // GIVEN: ClienteDetailView is mounted but Eliminar not clicked
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    // THEN: AlertDialog is not visible initially
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — "Confirmar" calls mutate and handles navigation
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — AC2: Confirmar triggers deletion and navigation', () => {
  beforeEach(() => {
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

    mockMutate.mockClear()
  })

  it('calls useDeleteCliente.mutate with clienteId when "Confirmar" is clicked', async () => {
    // GIVEN: Confirmation dialog is open
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    // WHEN: User clicks "Confirmar"
    await user.click(screen.getByTestId('delete-confirm-button'))

    // THEN: mutate is called with the clienteId (AC2)
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(mockCliente.id)
    })
  })

  it('calls mutate exactly once when "Confirmar" is clicked', async () => {
    // GIVEN: Confirmation dialog is open
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))

    // WHEN: User clicks "Confirmar"
    await user.click(screen.getByTestId('delete-confirm-button'))

    // THEN: mutate is called exactly once
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1)
    })
  })

  it('disables "Confirmar" button when isPending is true (AC2 — loading state)', () => {
    // GIVEN: useDeleteCliente is in pending state
    vi.mocked(useDeleteCliente).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
    } as unknown as ReturnType<typeof useDeleteCliente>)

    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    // Need to open dialog first via click
    // Note: dialog must already be open in pending state — test opens it then checks
    user.click(screen.getByTestId('delete-cliente-button'))

    // THEN: Confirmar button should be disabled when isPending
    // (Implementation must re-render dialog with disabled Confirmar on isPending=true)
    waitFor(() => {
      expect(screen.getByTestId('delete-confirm-button')).toBeDisabled()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — "Cancelar" closes dialog without calling mutate
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — AC3: Cancelar closes dialog without deleting', () => {
  beforeEach(() => {
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

    mockMutate.mockClear()
  })

  it('closes the confirmation dialog when "Cancelar" is clicked', async () => {
    // GIVEN: Confirmation dialog is open
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByTestId('delete-cancel-button'))

    // THEN: Dialog is no longer visible (AC3)
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })
  })

  it('does NOT call mutate when "Cancelar" is clicked', async () => {
    // GIVEN: Confirmation dialog is open
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByTestId('delete-cancel-button'))

    // THEN: mutate was NOT called — client record is unchanged (AC3)
    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('keeps the client detail content visible after "Cancelar"', async () => {
    // GIVEN: Dialog was opened and cancelled
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))
    await user.click(screen.getByTestId('delete-cancel-button'))

    // THEN: Client detail content is still rendered (AC3 — record unchanged)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument()
    })
  })

  it('allows re-opening the dialog after "Cancelar"', async () => {
    // GIVEN: User opened and cancelled the dialog
    const user = userEvent.setup()
    render(<ClienteDetailView clienteId={mockCliente.id} />)

    await user.click(screen.getByTestId('delete-cliente-button'))
    await user.click(screen.getByTestId('delete-cancel-button'))
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    // WHEN: User clicks "Eliminar" again
    await user.click(screen.getByTestId('delete-cliente-button'))

    // THEN: Dialog re-opens (AC3 — cancel does not lock the button)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
