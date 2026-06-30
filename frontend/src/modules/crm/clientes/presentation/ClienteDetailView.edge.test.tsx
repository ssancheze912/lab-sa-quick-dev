/**
 * Story 2.2: Client Detail View — ClienteDetailView component edge-case tests
 *
 * Automation expansion. The primary ATDD tests cover:
 *   skeleton on loading, all fields on success, not-found on error,
 *   data-testid presence and absence.
 *
 * This file covers:
 *   - useCliente is called with the exact clienteId prop value
 *   - clienteDetailStore.setClienteNotFound is called with true when isError
 *   - clienteDetailStore.setClienteNotFound is called with false on cleanup (unmount)
 *   - Component renders not-found when data is undefined and isError is false (edge: no data, no error)
 *   - createdAt/updatedAt domain fields are NOT rendered in the UI (not visible)
 *   - All four labeled rows have correct Spanish labels (Nombre, NIT/RUC, Teléfono, Ciudad)
 *   - clienteId prop change causes re-render with new data
 */

import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClienteDetailView } from './ClienteDetailView'
import type { Cliente } from '../domain/Cliente'

// Mock useCliente
vi.mock('../application/useCliente', () => ({
  useCliente: vi.fn(),
}))

// Mock clienteDetailStore to spy on setClienteNotFound
vi.mock('../application/clienteDetailStore', () => ({
  useClienteDetailStore: vi.fn(),
}))

// Mock useDeleteCliente — not under test in this file
vi.mock('../application/useDeleteCliente', () => ({
  useDeleteCliente: vi.fn(() => ({ mutate: vi.fn(), isPending: false, isError: false })),
}))

// Mock useContactosPorCliente — not under test in this file
vi.mock('../../contactos/application/useContactosPorCliente', () => ({
  useContactosPorCliente: vi.fn(() => ({ data: [] })),
}))

// Mock TanStack Router navigation
vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}))

import { useCliente } from '../application/useCliente'
import { useClienteDetailStore } from '../application/clienteDetailStore'

const mockCliente: Cliente = {
  id: 'test-id-123',
  nombre: 'Empresa ABC',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
}

const mockSetClienteNotFound = vi.fn()

describe('ClienteDetailView — useCliente call contract', () => {
  beforeEach(() => {
    vi.mocked(useClienteDetailStore).mockImplementation((selector: (s: { clienteNotFound: boolean; setClienteNotFound: (v: boolean) => void }) => unknown) =>
      selector({ clienteNotFound: false, setClienteNotFound: mockSetClienteNotFound }),
    )
    vi.mocked(useCliente).mockReturnValue({
      data: mockCliente,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCliente>)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('[P1] should call useCliente with the exact clienteId prop', () => {
    // GIVEN: A specific clienteId
    const specificId = 'exact-id-xyz'
    vi.mocked(useCliente).mockReturnValue({
      data: mockCliente,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCliente>)

    // WHEN: Component is rendered with that id
    render(<ClienteDetailView clienteId={specificId} />)

    // THEN: useCliente was called with that exact id
    expect(useCliente).toHaveBeenCalledWith(specificId)
  })

  it('[P2] should re-call useCliente with the new id when clienteId prop changes', () => {
    // GIVEN: Component rendered with initial id
    const { rerender } = render(<ClienteDetailView clienteId="id-first" />)
    expect(useCliente).toHaveBeenCalledWith('id-first')

    // WHEN: clienteId prop changes
    rerender(<ClienteDetailView clienteId="id-second" />)

    // THEN: useCliente was called with the new id
    expect(useCliente).toHaveBeenCalledWith('id-second')
  })
})

describe('ClienteDetailView — clienteDetailStore integration', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('[P1] should call setClienteNotFound(true) when isError is true', () => {
    // GIVEN: API returns error
    vi.mocked(useCliente).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useCliente>)
    vi.mocked(useClienteDetailStore).mockImplementation((selector: (s: { clienteNotFound: boolean; setClienteNotFound: (v: boolean) => void }) => unknown) =>
      selector({ clienteNotFound: false, setClienteNotFound: mockSetClienteNotFound }),
    )

    // WHEN: Component renders
    render(<ClienteDetailView clienteId="non-existent" />)

    // THEN: Store is notified that client was not found
    expect(mockSetClienteNotFound).toHaveBeenCalledWith(true)
  })

  it('[P1] should call setClienteNotFound(false) when data is available (success state)', () => {
    // GIVEN: Successful load
    vi.mocked(useCliente).mockReturnValue({
      data: mockCliente,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCliente>)
    vi.mocked(useClienteDetailStore).mockImplementation((selector: (s: { clienteNotFound: boolean; setClienteNotFound: (v: boolean) => void }) => unknown) =>
      selector({ clienteNotFound: false, setClienteNotFound: mockSetClienteNotFound }),
    )

    // WHEN: Component renders with valid data
    render(<ClienteDetailView clienteId="test-id-123" />)

    // THEN: Store is updated — client IS found
    expect(mockSetClienteNotFound).toHaveBeenCalledWith(false)
  })

  it('[P1] should call setClienteNotFound(false) on component unmount (cleanup)', () => {
    // GIVEN: Component is in error state
    vi.mocked(useCliente).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useCliente>)
    vi.mocked(useClienteDetailStore).mockImplementation((selector: (s: { clienteNotFound: boolean; setClienteNotFound: (v: boolean) => void }) => unknown) =>
      selector({ clienteNotFound: false, setClienteNotFound: mockSetClienteNotFound }),
    )

    // WHEN: Component is rendered then unmounted
    const { unmount } = render(<ClienteDetailView clienteId="gone" />)

    act(() => {
      unmount()
    })

    // THEN: Cleanup effect resets the store to false
    expect(mockSetClienteNotFound).toHaveBeenCalledWith(false)
  })
})

describe('ClienteDetailView — not-found edge cases', () => {
  beforeEach(() => {
    vi.mocked(useClienteDetailStore).mockImplementation((selector: (s: { clienteNotFound: boolean; setClienteNotFound: (v: boolean) => void }) => unknown) =>
      selector({ clienteNotFound: false, setClienteNotFound: mockSetClienteNotFound }),
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('[P2] should render not-found when data is undefined and isError is false (no-data-no-error edge)', () => {
    // GIVEN: Hook returns no data and no error (e.g. disabled query or race condition)
    vi.mocked(useCliente).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCliente>)

    // WHEN: Component renders
    render(<ClienteDetailView clienteId="some-id" />)

    // THEN: Not-found state is shown (the component treats null/undefined data as not-found)
    expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
  })

  it('[P2] should NOT render cliente-detail-content in the no-data-no-error edge', () => {
    // GIVEN: No data and no error
    vi.mocked(useCliente).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useCliente>)

    // WHEN: Component renders
    render(<ClienteDetailView clienteId="some-id" />)

    // THEN: Success container is absent
    expect(screen.queryByTestId('cliente-detail-content')).not.toBeInTheDocument()
  })
})

describe('ClienteDetailView — UI field rendering', () => {
  beforeEach(() => {
    vi.mocked(useCliente).mockReturnValue({
      data: mockCliente,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useCliente>)
    vi.mocked(useClienteDetailStore).mockImplementation((selector: (s: { clienteNotFound: boolean; setClienteNotFound: (v: boolean) => void }) => unknown) =>
      selector({ clienteNotFound: false, setClienteNotFound: mockSetClienteNotFound }),
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('[P1] should render the Spanish label "Nombre" for the client name', () => {
    // GIVEN: Successful data load
    render(<ClienteDetailView clienteId="test-id-123" />)

    // THEN: Label "Nombre" is visible
    expect(screen.getByText('Nombre')).toBeInTheDocument()
  })

  it('[P1] should render the Spanish label "NIT/RUC" for the identifier field', () => {
    render(<ClienteDetailView clienteId="test-id-123" />)

    expect(screen.getByText('NIT/RUC')).toBeInTheDocument()
  })

  it('[P1] should render the Spanish label "Teléfono" for the phone field', () => {
    render(<ClienteDetailView clienteId="test-id-123" />)

    expect(screen.getByText('Teléfono')).toBeInTheDocument()
  })

  it('[P1] should render the Spanish label "Ciudad" for the city field', () => {
    render(<ClienteDetailView clienteId="test-id-123" />)

    expect(screen.getByText('Ciudad')).toBeInTheDocument()
  })

  it('[P2] should NOT render the raw createdAt ISO timestamp as visible text', () => {
    // GIVEN: Domain data includes createdAt timestamp
    render(<ClienteDetailView clienteId="test-id-123" />)

    // THEN: ISO timestamp is NOT visible in the UI (implementation detail not shown)
    expect(screen.queryByText('2026-03-12T10:30:00Z')).not.toBeInTheDocument()
  })

  it('[P2] should NOT render the raw updatedAt ISO timestamp as visible text', () => {
    render(<ClienteDetailView clienteId="test-id-123" />)

    expect(screen.queryByText(mockCliente.updatedAt)).not.toBeInTheDocument()
  })
})
