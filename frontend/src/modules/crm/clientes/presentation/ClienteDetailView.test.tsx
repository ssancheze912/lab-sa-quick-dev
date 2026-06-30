import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ClienteDetailView } from './ClienteDetailView'
import type { Cliente } from '../domain/Cliente'

vi.mock('../application/useCliente', () => ({
  useCliente: vi.fn(),
}))

import { useCliente } from '../application/useCliente'

const mockCliente: Cliente = {
  id: 'test-id-123',
  nombre: 'Empresa ABC',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
}

describe('ClienteDetailView', () => {
  beforeEach(() => {
    vi.mocked(useCliente).mockReturnValue({
      data: mockCliente,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCliente>)
  })

  it('renders skeleton while loading', () => {
    vi.mocked(useCliente).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useCliente>)

    render(<ClienteDetailView clienteId="test-id-123" />)

    // Skeletons render with aria role or via container — no spinner
    const container = document.querySelector('.react-loading-skeleton')
    expect(container).not.toBeNull()
  })

  it('renders Nombre, NIT, Teléfono and Ciudad on success', () => {
    render(<ClienteDetailView clienteId="test-id-123" />)

    expect(screen.getAllByText('Empresa ABC').length).toBeGreaterThan(0)
    expect(screen.getByText('900123456-1')).toBeInTheDocument()
    expect(screen.getByText('3001234567')).toBeInTheDocument()
    expect(screen.getByText('Bogotá')).toBeInTheDocument()
  })

  it('renders not-found message on 404 (isError=true)', () => {
    vi.mocked(useCliente).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useCliente>)

    render(<ClienteDetailView clienteId="non-existent" />)

    expect(screen.getByText('No se encontró el cliente solicitado.')).toBeInTheDocument()
  })

  it('has data-testid="cliente-detail-content" on success', () => {
    render(<ClienteDetailView clienteId="test-id-123" />)

    expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument()
  })

  it('does not show data-testid="cliente-detail-content" when not found', () => {
    vi.mocked(useCliente).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useCliente>)

    render(<ClienteDetailView clienteId="non-existent" />)

    expect(screen.queryByTestId('cliente-detail-content')).not.toBeInTheDocument()
  })
})
