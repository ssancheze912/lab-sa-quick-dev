/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Acceptance Tests — RED Phase (Component Level)
 * ClienteListView — 280px left panel component
 *
 * Acceptance Criteria covered:
 *   AC1 — Renders scrollable list with nombre + nit per item
 *   AC2 — Real-time case-insensitive filtering via search input
 *   AC3 — EmptyState rendered when data is empty or search has no matches
 *   AC4 — ErrorPanel with onRetry when isError=true
 *   AC1 (loading) — Skeleton rows while isLoading=true
 *
 * These tests FAIL until ClienteListView.tsx is implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ClienteListView } from './ClienteListView'

// ─────────────────────────────────────────────────────────────────────────────
// Mock useClientes hook
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('../application/useClientes', () => ({
  useClientes: vi.fn(),
}))

// Mock TanStack Router navigate/params
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}))

import { useClientes } from '../application/useClientes'
const mockUseClientes = vi.mocked(useClientes)

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const mockClientes = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Empresa Alpha SA',
    nit: '900111000-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    nombre: 'Beta Ltda',
    nit: '811222333-2',
    telefono: '3009876543',
    ciudad: 'Medellín',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    nombre: 'Gamma Corp',
    nit: '700333444-3',
    telefono: '3006543210',
    ciudad: 'Cali',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

function renderComponent() {
  return render(
    <MemoryRouter>
      <ClienteListView />
    </MemoryRouter>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 (loading) — Skeleton rows shown while isLoading=true
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — loading state (AC1 implied)', () => {
  it('should render loading skeletons while isLoading is true', () => {
    // GIVEN: useClientes returns loading state
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as any)

    renderComponent()

    // THEN: Skeleton loader is present (react-loading-skeleton rows)
    expect(screen.getByTestId('clientes-loading-skeleton')).toBeInTheDocument()
  })

  it('should NOT render the client list while loading', () => {
    // GIVEN: useClientes is loading
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as any)

    renderComponent()

    // THEN: No client list items rendered
    expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — List renders with nombre and nit per item
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — data loaded state (AC1)', () => {
  beforeEach(() => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)
  })

  it('should render a list item for each client', () => {
    renderComponent()

    const items = screen.getAllByTestId('cliente-list-item')
    expect(items).toHaveLength(3)
  })

  it('should display client nombre in each list item', () => {
    renderComponent()

    expect(screen.getByText('Empresa Alpha SA')).toBeInTheDocument()
    expect(screen.getByText('Beta Ltda')).toBeInTheDocument()
    expect(screen.getByText('Gamma Corp')).toBeInTheDocument()
  })

  it('should display client nit in each list item', () => {
    renderComponent()

    expect(screen.getByText('900111000-1')).toBeInTheDocument()
    expect(screen.getByText('811222333-2')).toBeInTheDocument()
    expect(screen.getByText('700333444-3')).toBeInTheDocument()
  })

  it('should render the search input with aria-label="Buscar clientes"', () => {
    renderComponent()

    expect(screen.getByRole('textbox', { name: /buscar clientes/i })).toBeInTheDocument()
  })

  it('should render search input with placeholder "Buscar por nombre o NIT..."', () => {
    renderComponent()

    expect(
      screen.getByPlaceholderText(/buscar por nombre o nit/i)
    ).toBeInTheDocument()
  })

  it('should render the list panel container with testid "clientes-list-panel"', () => {
    renderComponent()

    expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time case-insensitive filtering
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — search filtering (AC2)', () => {
  beforeEach(() => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)
  })

  it('should show only matching clients when user types in the search input', () => {
    renderComponent()

    // WHEN: User types a query matching only "Empresa Alpha SA"
    const searchInput = screen.getByTestId('search-clientes')
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })

    // THEN: Only Alpha is shown
    expect(screen.getByText('Empresa Alpha SA')).toBeInTheDocument()
    expect(screen.queryByText('Beta Ltda')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma Corp')).not.toBeInTheDocument()
  })

  it('should filter case-insensitively (uppercase query matches lowercase nombre)', () => {
    renderComponent()

    const searchInput = screen.getByTestId('search-clientes')
    fireEvent.change(searchInput, { target: { value: 'BETA' } })

    // THEN: Beta Ltda matches despite uppercase query
    expect(screen.getByText('Beta Ltda')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Alpha SA')).not.toBeInTheDocument()
  })

  it('should filter by nit when user types a nit fragment', () => {
    renderComponent()

    const searchInput = screen.getByTestId('search-clientes')
    fireEvent.change(searchInput, { target: { value: '811222333' } })

    // THEN: Beta Ltda (nit 811222333-2) appears; others do not
    expect(screen.getByText('Beta Ltda')).toBeInTheDocument()
    expect(screen.queryByText('Empresa Alpha SA')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma Corp')).not.toBeInTheDocument()
  })

  it('should restore the full list when search input is cleared', () => {
    renderComponent()

    const searchInput = screen.getByTestId('search-clientes')
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })
    // Now clear
    fireEvent.change(searchInput, { target: { value: '' } })

    // THEN: All items are visible again
    expect(screen.getByText('Empresa Alpha SA')).toBeInTheDocument()
    expect(screen.getByText('Beta Ltda')).toBeInTheDocument()
    expect(screen.getByText('Gamma Corp')).toBeInTheDocument()
  })

  it('should show EmptyState when no items match the search query (AC3)', () => {
    renderComponent()

    const searchInput = screen.getByTestId('search-clientes')
    fireEvent.change(searchInput, { target: { value: 'xyzNoMatchABCDEF' } })

    // THEN: EmptyState is shown (no results)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    // AND: No list items
    expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState when data array is empty
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — empty state (AC3)', () => {
  it('should display EmptyState component when there are no clients', () => {
    // GIVEN: useClientes returns empty array
    mockUseClientes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    renderComponent()

    // THEN: EmptyState is rendered inside the left panel
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('should NOT display client list items when data is empty', () => {
    mockUseClientes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    renderComponent()

    expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
  })

  it('should display EmptyState when data is undefined', () => {
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    renderComponent()

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel with onRetry when fetch fails
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — error state (AC4)', () => {
  it('should render ErrorPanel when isError is true', () => {
    // GIVEN: useClientes returns error state
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as any)

    renderComponent()

    // THEN: ErrorPanel is rendered
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })

  it('should render "Reintentar" button inside ErrorPanel', () => {
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as any)

    renderComponent()

    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('should call refetch when user clicks "Reintentar"', () => {
    const mockRefetch = vi.fn()
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    } as any)

    renderComponent()

    // WHEN: User clicks the Reintentar button
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    // THEN: refetch was called
    expect(mockRefetch).toHaveBeenCalledOnce()
  })

  it('should NOT display client list items when ErrorPanel is shown', () => {
    mockUseClientes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as any)

    renderComponent()

    expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — keyboard navigation on list items
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — accessibility', () => {
  beforeEach(() => {
    mockUseClientes.mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)
  })

  it('should render each list item with role="button" for keyboard accessibility', () => {
    renderComponent()

    const items = screen.getAllByRole('button', { name: /empresa alpha|beta ltda|gamma corp/i })
    expect(items.length).toBeGreaterThan(0)
  })

  it('should render each client list item with tabIndex=0', () => {
    renderComponent()

    const items = screen.getAllByTestId('cliente-list-item')
    items.forEach((item) => {
      expect(item).toHaveAttribute('tabindex', '0')
    })
  })
})
