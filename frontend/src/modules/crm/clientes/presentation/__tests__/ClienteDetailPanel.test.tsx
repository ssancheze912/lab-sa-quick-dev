import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ClienteDetailPanel } from '../ClienteDetailPanel'

// Mock useClienteById to control all states
vi.mock('../../application/useClienteById', () => ({
  useClienteById: vi.fn(),
}))

import { useClienteById } from '../../application/useClienteById'

const mockUseClienteById = useClienteById as ReturnType<typeof vi.fn>

const mockCliente = {
  id: '550e8400-e29b-41d4-a716-446655440099',
  nombre: 'Empresa Detalle Alpha SAS',
  nit: '900999001-0',
  telefono: '+57 1 234 5678',
  ciudad: 'Bogotá',
  createdAt: '2026-05-20T10:00:00Z',
  updatedAt: '2026-05-20T10:00:00Z',
}

/**
 * Component tests for ClienteDetailPanel — Story 2.2 expansion.
 *
 * Test IDs: UNIT-C-FE-CDP-01 … UNIT-C-FE-CDP-12
 */
describe('ClienteDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-01: Root element has correct data-testid in all states
  // Boundary: E2E tests rely on data-testid="cliente-detail-panel"
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-01 — renders root element with data-testid="cliente-detail-panel" in success state', () => {
    mockUseClienteById.mockReturnValue({
      data: mockCliente,
      isLoading: false,
      isError: false,
      error: null,
    })

    render(<ClienteDetailPanel clienteId={mockCliente.id} />)

    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-02: Success state renders all required fields
  // Boundary: E2E-C-07 depends on nombre, nit, telefono, ciudad being present
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-02 — success state renders nombre, nit, telefono, ciudad', () => {
    mockUseClienteById.mockReturnValue({
      data: mockCliente,
      isLoading: false,
      isError: false,
      error: null,
    })

    render(<ClienteDetailPanel clienteId={mockCliente.id} />)

    expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent(mockCliente.nombre)
    expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent(mockCliente.nit)
    expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent(mockCliente.telefono)
    expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent(mockCliente.ciudad)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-03: Loading state renders data-testid="cliente-detail-panel" (not null)
  // Boundary: E2E skeleton test relies on panel being present during loading
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-03 — loading state renders panel container with skeleton (not null)', () => {
    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    render(<ClienteDetailPanel clienteId="some-id" />)

    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-04: Loading state does NOT show field values
  // Boundary: skeleton must replace content, not co-exist with it
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-04 — loading state does not render field testids', () => {
    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    render(<ClienteDetailPanel clienteId="some-id" />)

    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-05: 404 error state renders data-testid="cliente-not-found"
  // Boundary: E2E-C-10 depends on this element being present for non-existent IDs
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-05 — 404 error renders "cliente-not-found" testid', () => {
    const notFoundError = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
    })

    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: notFoundError,
    })

    render(<ClienteDetailPanel clienteId="00000000-0000-4000-8000-000000000000" />)

    expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-06: 404 state shows "Cliente no encontrado" text (case-insensitive)
  // Boundary: E2E-C-10 asserts /cliente no encontrado/i
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-06 — 404 error shows "Cliente no encontrado" text', () => {
    const notFoundError = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
    })

    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: notFoundError,
    })

    render(<ClienteDetailPanel clienteId="00000000-0000-4000-8000-000000000000" />)

    expect(screen.getByTestId('cliente-not-found')).toHaveTextContent(/cliente no encontrado/i)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-07: 404 state does NOT render field testids
  // Error path: not-found state must not show any stale field content
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-07 — 404 error does not render any field testids', () => {
    const notFoundError = Object.assign(new Error('Not Found'), {
      response: { status: 404 },
    })

    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: notFoundError,
    })

    render(<ClienteDetailPanel clienteId="invalid-id" />)

    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-08: Generic error (non-404) renders error message
  // Error path: network error / 500 → shows generic error, not not-found
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-08 — generic error renders error message (not the 404 message)', () => {
    const networkError = Object.assign(new Error('Network Error'), {
      response: { status: 500 },
    })

    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: networkError,
    })

    render(<ClienteDetailPanel clienteId="some-id" />)

    // not-found must NOT appear
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()

    // panel still renders (it shows error message inside)
    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-09: Generic error (no response field) renders error message
  // Error path: pure network error with no response object attached
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-09 — error with no response object renders generic error panel', () => {
    const rawError = new Error('fetch failed')

    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: rawError,
    })

    render(<ClienteDetailPanel clienteId="some-id" />)

    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-10: When data is undefined and not loading/error, renders nothing
  // Boundary: `if (!cliente) return null` guard in the component
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-10 — when data is undefined, not loading, not error — renders nothing', () => {
    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    })

    const { container } = render(<ClienteDetailPanel clienteId="some-id" />)

    expect(container.firstChild).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-11: Component passes clienteId to the hook
  // Boundary: useClienteById must be called with the exact prop value
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-11 — calls useClienteById with the provided clienteId', () => {
    mockUseClienteById.mockReturnValue({
      data: mockCliente,
      isLoading: false,
      isError: false,
      error: null,
    })

    render(<ClienteDetailPanel clienteId={mockCliente.id} />)

    expect(mockUseClienteById).toHaveBeenCalledWith(mockCliente.id)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CDP-12: Success state: 404-not-found and loading skeleton absent
  // Mutual exclusion: success state must not show error or loading UI
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CDP-12 — success state does not show cliente-not-found or skeleton', () => {
    mockUseClienteById.mockReturnValue({
      data: mockCliente,
      isLoading: false,
      isError: false,
      error: null,
    })

    render(<ClienteDetailPanel clienteId={mockCliente.id} />)

    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
    // In success state there are no react-loading-skeleton elements
    expect(document.querySelector('.react-loading-skeleton')).toBeNull()
  })
})
