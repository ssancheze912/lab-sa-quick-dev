import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ClienteListPanel } from '../ClienteListPanel'
import type { Cliente } from '../../domain/Cliente'

// Mock the useClientes hook to control data/loading/error states
vi.mock('../../application/useClientes', () => ({
  useClientes: vi.fn(),
}))

import { useClientes } from '../../application/useClientes'

const mockUseClientes = useClientes as ReturnType<typeof vi.fn>

const mockClientes: Cliente[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    nombre: 'Empresa Alpha SAS',
    nit: '900100001-0',
    telefono: '+57 1 234 5678',
    ciudad: 'Bogotá',
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-05-20T10:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    nombre: 'Constructora Beta Ltda',
    nit: '900100002-1',
    telefono: '+57 2 345 6789',
    ciudad: 'Medellín',
    createdAt: '2026-05-20T11:00:00Z',
    updatedAt: '2026-05-20T11:00:00Z',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    nombre: 'Distribuidora Gamma',
    nit: '800123456-7',
    telefono: '+57 3 456 7890',
    ciudad: 'Cali',
    createdAt: '2026-05-20T12:00:00Z',
    updatedAt: '2026-05-20T12:00:00Z',
  },
]

/**
 * Component tests for ClienteListPanel — Story 2.1 edge case expansion.
 *
 * Test IDs: UNIT-C-FE-CLP-01 … UNIT-C-FE-CLP-16
 */
describe('ClienteListPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-01: Renders the list panel container with correct data-testid
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-01 — renders with data-testid="clientes-list-panel"', () => {
    mockUseClientes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-02: Renders search input with correct placeholder
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-02 — renders search input with placeholder text', () => {
    mockUseClientes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    expect(
      screen.getByPlaceholderText(/buscar cliente por nombre o nit/i)
    ).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-03: Search input has aria-label for accessibility
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-03 — search input has aria-label="Buscar clientes"', () => {
    mockUseClientes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    expect(screen.getByLabelText('Buscar clientes')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-04: Renders all clients when loaded successfully
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-04 — renders all clients when data loads successfully', () => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    expect(screen.getByText('Empresa Alpha SAS')).toBeInTheDocument()
    expect(screen.getByText('Constructora Beta Ltda')).toBeInTheDocument()
    expect(screen.getByText('Distribuidora Gamma')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-05: Shows EmptyState when data is an empty array
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-05 — shows EmptyState when data is empty array', () => {
    mockUseClientes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-06: Shows ErrorPanel when isError=true
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-06 — shows ErrorPanel when isError is true', () => {
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-07: ErrorPanel has Reintentar button that calls refetch
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-07 — clicking Reintentar calls refetch', () => {
    const mockRefetch = vi.fn()
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    })

    render(<ClienteListPanel />)

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-08: Loading state shows skeleton, no client items, no error
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-08 — during loading, ErrorPanel and EmptyState are not visible', () => {
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-09: Filtering by nombre hides non-matching items
  // Boundary: useMemo client-side filter by nombre (case insensitive)
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-09 — typing in search filters list by nombre', async () => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    const searchInput = screen.getByLabelText('Buscar clientes')
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SAS')).toBeInTheDocument()
      expect(screen.queryByText('Constructora Beta Ltda')).not.toBeInTheDocument()
      expect(screen.queryByText('Distribuidora Gamma')).not.toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-10: Filtering by NIT hides non-matching items
  // Boundary: useMemo client-side filter by nit field
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-10 — typing NIT in search filters list by nit', async () => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    const searchInput = screen.getByLabelText('Buscar clientes')
    fireEvent.change(searchInput, { target: { value: '800123456' } })

    await waitFor(() => {
      expect(screen.getByText('Distribuidora Gamma')).toBeInTheDocument()
      expect(screen.queryByText('Empresa Alpha SAS')).not.toBeInTheDocument()
      expect(screen.queryByText('Constructora Beta Ltda')).not.toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-11: Search is case-insensitive
  // Boundary: toLowerCase() on both sides in the filter
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-11 — search is case-insensitive', async () => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    const searchInput = screen.getByLabelText('Buscar clientes')
    fireEvent.change(searchInput, { target: { value: 'CONSTRUCTORA' } })

    await waitFor(() => {
      expect(screen.getByText('Constructora Beta Ltda')).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-12: Clearing search restores all clients
  // Boundary: setting searchQuery back to '' returns to full list
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-12 — clearing search input restores all clients', async () => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    const searchInput = screen.getByLabelText('Buscar clientes')
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })

    await waitFor(() => {
      expect(screen.queryByText('Constructora Beta Ltda')).not.toBeInTheDocument()
    })

    fireEvent.change(searchInput, { target: { value: '' } })

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SAS')).toBeInTheDocument()
      expect(screen.getByText('Constructora Beta Ltda')).toBeInTheDocument()
      expect(screen.getByText('Distribuidora Gamma')).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-13: Search with whitespace-only string shows all clients
  // Boundary: searchQuery.trim() returns '' → full list shown
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-13 — whitespace-only search term shows all clients', async () => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    const searchInput = screen.getByLabelText('Buscar clientes')
    fireEvent.change(searchInput, { target: { value: '   ' } })

    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SAS')).toBeInTheDocument()
      expect(screen.getByText('Constructora Beta Ltda')).toBeInTheDocument()
      expect(screen.getByText('Distribuidora Gamma')).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-14: No-match search shows EmptyState
  // Boundary: filter returns [] → same empty state shown as when DB is empty
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-14 — search with no results shows EmptyState', async () => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    const searchInput = screen.getByLabelText('Buscar clientes')
    fireEvent.change(searchInput, { target: { value: 'ZZZNOMATCH999' } })

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-15: ErrorPanel and EmptyState are mutually exclusive
  // Error path: when isError=true, EmptyState must NOT be shown
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-15 — ErrorPanel and EmptyState are never visible at the same time', () => {
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLP-16: Client items are rendered in a <ul role="list">
  // Accessibility: list items must be inside a semantic list element.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLP-16 — client items are wrapped in a <ul role="list">', () => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(<ClienteListPanel />)

    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    expect(list.tagName.toLowerCase()).toBe('ul')
  })
})
