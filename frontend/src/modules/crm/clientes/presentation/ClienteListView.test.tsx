import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClienteListView } from './ClienteListView'
import type { Cliente } from '../domain/Cliente'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}))

// Mock useClientes hook
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

describe('ClienteListView', () => {
  beforeEach(() => {
    vi.mocked(useClientes).mockReturnValue({
      data: mockClientes,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as ReturnType<typeof useClientes>)
  })

  it('renders skeleton while loading', () => {
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useClientes>)

    render(<ClienteListView />)

    expect(screen.getByLabelText('Cargando clientes')).toBeInTheDocument()
  })

  it('renders client items when data is available', () => {
    render(<ClienteListView />)

    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    expect(screen.getByText('900123456-1')).toBeInTheDocument()
    expect(screen.getByText('Industrias XYZ')).toBeInTheDocument()
  })

  it('filters list when typing in search input', () => {
    render(<ClienteListView />)

    const searchInput = screen.getByLabelText('Buscar clientes')
    fireEvent.change(searchInput, { target: { value: 'ABC' } })

    expect(screen.getByText('Empresa ABC')).toBeInTheDocument()
    expect(screen.queryByText('Industrias XYZ')).not.toBeInTheDocument()
  })

  it('renders EmptyState when data is empty', () => {
    vi.mocked(useClientes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as ReturnType<typeof useClientes>)

    render(<ClienteListView />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(
      screen.getByText('No hay clientes registrados. Crea el primer cliente.'),
    ).toBeInTheDocument()
  })

  it('renders ErrorPanel when fetch fails', () => {
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useClientes>)

    render(<ClienteListView />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByLabelText('Reintentar')).toBeInTheDocument()
  })

  it('calls refetch when ErrorPanel retry button is clicked', async () => {
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useClientes>)

    render(<ClienteListView />)

    const retryButton = screen.getByLabelText('Reintentar')
    fireEvent.click(retryButton)

    await waitFor(() => expect(mockRefetch).toHaveBeenCalledOnce())
  })
})
