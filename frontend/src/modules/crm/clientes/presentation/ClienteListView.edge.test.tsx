/**
 * Story 2.1 — Edge-case unit tests for ClienteListView (expanding ATDD coverage).
 *
 * The primary ATDD tests cover: skeleton, items rendered, filter by nombre,
 * empty data EmptyState, error panel render, and retry click.
 *
 * This file covers edge cases NOT in the ATDD set:
 *   - Search with leading/trailing whitespace is trimmed before matching
 *   - Search by nit (unit-level confirmation)
 *   - Clearing search restores full list
 *   - No-match EmptyState message differs from empty-data EmptyState message
 *   - Search with special regex characters does not throw
 *   - Lista de clientes aria-label is present
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClienteListView } from './ClienteListView'
import type { Cliente } from '../domain/Cliente'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}))

const mockRefetch = vi.fn()
vi.mock('../application/useClientes', () => ({
  useClientes: vi.fn(),
}))

import { useClientes } from '../application/useClientes'

const mockClientes: Cliente[] = [
  {
    id: '1',
    nombre: 'Empresa ABC',
    nit: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-03-12T10:30:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
  },
  {
    id: '2',
    nombre: 'Industrias XYZ',
    nit: '800456789-2',
    telefono: '3109876543',
    ciudad: 'Medellín',
    createdAt: '2026-03-12T10:30:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
  },
]

function setupSuccessState(clientes: Cliente[] = mockClientes) {
  vi.mocked(useClientes).mockReturnValue({
    data: clientes,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  } as ReturnType<typeof useClientes>)
}

describe('ClienteListView — search edge cases', () => {
  beforeEach(() => {
    setupSuccessState()
  })

  it('[P1] trims leading/trailing whitespace before filtering by nombre', () => {
    // GIVEN: Clientes loaded
    render(<ClienteListView />)
    const searchInput = screen.getByLabelText('Buscar clientes')

    // WHEN: User types with surrounding spaces
    fireEvent.change(searchInput, { target: { value: '  ABC  ' } })

    // THEN: Empresa ABC is still shown (whitespace trimmed)
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    expect(screen.queryByText('Industrias XYZ')).not.toBeInTheDocument()
  })

  it('[P1] filters by nit when user types a nit fragment', () => {
    // GIVEN: Clientes loaded
    render(<ClienteListView />)
    const searchInput = screen.getByLabelText('Buscar clientes')

    // WHEN: User types a nit fragment
    fireEvent.change(searchInput, { target: { value: '800456789' } })

    // THEN: Only the matching nit client appears
    expect(screen.getByText('Industrias XYZ')).toBeInTheDocument()
    expect(screen.queryByText('Empresa ABC')).not.toBeInTheDocument()
  })

  it('[P1] restores full list when search input is cleared', () => {
    // GIVEN: Clientes loaded and search active
    render(<ClienteListView />)
    const searchInput = screen.getByLabelText('Buscar clientes')

    fireEvent.change(searchInput, { target: { value: 'ABC' } })
    expect(screen.queryByText('Industrias XYZ')).not.toBeInTheDocument()

    // WHEN: User clears the search
    fireEvent.change(searchInput, { target: { value: '' } })

    // THEN: All clients are visible again
    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    expect(screen.getByText('Industrias XYZ')).toBeInTheDocument()
  })

  it('[P2] does not throw when search contains special regex characters', () => {
    // GIVEN: Clientes loaded
    render(<ClienteListView />)
    const searchInput = screen.getByLabelText('Buscar clientes')

    // WHEN: User types a string with special regex chars
    // THEN: No error is thrown (filter uses includes, not regex)
    expect(() => {
      fireEvent.change(searchInput, { target: { value: '(.*)' } })
    }).not.toThrow()
  })

  it('[P2] is case-insensitive when filtering by nit', () => {
    // GIVEN: A client with mixed-case nit
    setupSuccessState([
      {
        id: '3',
        nombre: 'Empresa Gamma',
        nit: 'NIT-ABC-123',
        telefono: '3000000001',
        ciudad: 'Cali',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ])
    render(<ClienteListView />)
    const searchInput = screen.getByLabelText('Buscar clientes')

    // WHEN: User searches with lowercase
    fireEvent.change(searchInput, { target: { value: 'nit-abc' } })

    // THEN: The client is visible (case-insensitive nit match)
    expect(screen.getByText('Empresa Gamma')).toBeInTheDocument()
  })
})

describe('ClienteListView — EmptyState message differentiation', () => {
  it('[P1] shows "no data" EmptyState message when data array is empty (no clients exist)', () => {
    // GIVEN: Backend returned an empty client list
    vi.mocked(useClientes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as ReturnType<typeof useClientes>)
    render(<ClienteListView />)

    // WHEN: Page renders with no data
    // THEN: "create first client" message is shown
    expect(
      screen.getByText('No hay clientes registrados. Crea el primer cliente.'),
    ).toBeInTheDocument()
  })

  it('[P1] shows "no results" EmptyState message when data exists but search has no matches', () => {
    // GIVEN: Clients exist but search yields no results
    setupSuccessState()
    render(<ClienteListView />)
    const searchInput = screen.getByLabelText('Buscar clientes')

    // WHEN: User types a query that matches nothing
    fireEvent.change(searchInput, { target: { value: 'ZZZNoMatchAtAll' } })

    // THEN: "no results" message (not the "create first client" message)
    expect(
      screen.getByText('No se encontraron clientes con ese criterio de búsqueda.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('No hay clientes registrados. Crea el primer cliente.'),
    ).not.toBeInTheDocument()
  })
})

describe('ClienteListView — list accessibility', () => {
  beforeEach(() => {
    setupSuccessState()
  })

  it('[P2] the client list has aria-label="Lista de clientes"', () => {
    // GIVEN: Clients are loaded
    render(<ClienteListView />)

    // WHEN: List renders
    // THEN: The list has the correct aria-label
    expect(screen.getByRole('list', { name: 'Lista de clientes' })).toBeInTheDocument()
  })

  it('[P2] each client item renders inside a list element', () => {
    // GIVEN: 2 clients loaded
    render(<ClienteListView />)

    // WHEN: List renders
    // THEN: 2 list items are present
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(2)
  })
})

describe('ClienteListView — selection state', () => {
  it('[P1] renders the client list without errors (selection via route param covered by ClienteListItem.test)', () => {
    // GIVEN: Clients are loaded (no clienteId in URL param — default mock returns {})
    // useParams mock already returns {} (no clienteId), so selectedId = ''
    setupSuccessState()

    // WHEN: Rendered
    render(<ClienteListView />)

    // THEN: List renders without errors; individual selected state is tested in ClienteListItem.test
    expect(screen.getByRole('list')).toBeInTheDocument()
    // Neither item should have aria-pressed=true since no clienteId in params
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-pressed', 'false')
    })
  })
})
