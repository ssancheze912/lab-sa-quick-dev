/**
 * Unit Tests — Story 4.4: View Associated Client from Contact Detail
 *
 * Coverage:
 *   AC1 — Contact associated with a client shows client name inline (FR23, NFR9)
 *   AC2 — Client name is a link to /clientes/:clienteId (FR24)
 *   AC3 — Contact without a client shows "Sin cliente asignado"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ history: { back: vi.fn() } }),
  Link: ({ children, to, params, 'data-testid': testId, 'aria-label': ariaLabel, className }: {
    children: React.ReactNode
    to: string
    params?: Record<string, string>
    'data-testid'?: string
    'aria-label'?: string
    className?: string
  }) =>
    createElement(
      'a',
      {
        href: to.replace('$clienteId', params?.clienteId ?? ''),
        'data-testid': testId,
        'aria-label': ariaLabel,
        className,
      },
      children
    ),
}))

// Mock useContactoById
vi.mock('../../application/useContactoById', () => ({
  useContactoById: vi.fn(),
}))

// Mock useClienteById
vi.mock('../../../clientes/application/useClienteById', () => ({
  useClienteById: vi.fn(),
}))

// Mock dialogs to keep tests simple
vi.mock('../ContactoFormDialog', () => ({
  ContactoFormDialog: () => null,
}))
vi.mock('../DeleteContactoDialog', () => ({
  DeleteContactoDialog: () => null,
}))

import { useContactoById } from '../../application/useContactoById'
import { useClienteById } from '../../../clientes/application/useClienteById'
import { ContactoDetailPanel } from '../ContactoDetailPanel'

const mockUseContactoById = useContactoById as ReturnType<typeof vi.fn>
const mockUseClienteById = useClienteById as ReturnType<typeof vi.fn>

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

const baseContacto = {
  id: 'c1',
  nombre: 'Ana Torres',
  cargo: 'Gerente',
  telefono: '3001234567',
  email: 'ana@test.co',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('ContactoDetailPanel — Cliente section (Story 4.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('AC1 — shows client name when contact has a clienteId', async () => {
    // ARRANGE
    mockUseContactoById.mockReturnValue({
      data: { ...baseContacto, clienteId: 'cl-001' },
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseClienteById.mockReturnValue({
      data: { id: 'cl-001', nombre: 'Empresa Alfa' },
      isLoading: false,
    })

    // ACT
    render(createElement(ContactoDetailPanel, { contactoId: 'c1' }), {
      wrapper: createWrapper(),
    })

    // ASSERT — client link is visible with correct name
    await waitFor(() => {
      expect(screen.getByTestId('clienteAsociadoLink')).toBeInTheDocument()
    })
    expect(screen.getByTestId('clienteAsociadoLink')).toHaveTextContent('Empresa Alfa')
    expect(screen.queryByTestId('sin-cliente-asignado')).not.toBeInTheDocument()
  })

  it('AC2 — client name link has aria-label "Ir al cliente asociado"', async () => {
    // ARRANGE
    mockUseContactoById.mockReturnValue({
      data: { ...baseContacto, clienteId: 'cl-002' },
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseClienteById.mockReturnValue({
      data: { id: 'cl-002', nombre: 'Empresa Beta' },
      isLoading: false,
    })

    // ACT
    render(createElement(ContactoDetailPanel, { contactoId: 'c1' }), {
      wrapper: createWrapper(),
    })

    // ASSERT — WCAG 2.1 AA aria-label
    await waitFor(() => {
      expect(screen.getByTestId('clienteAsociadoLink')).toBeInTheDocument()
    })
    expect(screen.getByTestId('clienteAsociadoLink')).toHaveAttribute(
      'aria-label',
      'Ir al cliente asociado'
    )
  })

  it('AC3 — shows "Sin cliente asignado" when clienteId is null', async () => {
    // ARRANGE
    mockUseContactoById.mockReturnValue({
      data: { ...baseContacto, clienteId: null },
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: false,
    })

    // ACT
    render(createElement(ContactoDetailPanel, { contactoId: 'c1' }), {
      wrapper: createWrapper(),
    })

    // ASSERT — fallback message displayed
    await waitFor(() => {
      expect(screen.getByTestId('sin-cliente-asignado')).toBeInTheDocument()
    })
    expect(screen.getByTestId('sin-cliente-asignado')).toHaveTextContent(
      /sin cliente asignado/i
    )
    expect(screen.queryByTestId('clienteAsociadoLink')).not.toBeInTheDocument()
  })

  it('shows skeleton while cliente data is loading (clienteId non-null)', async () => {
    // ARRANGE
    mockUseContactoById.mockReturnValue({
      data: { ...baseContacto, clienteId: 'cl-003' },
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    // ACT
    render(createElement(ContactoDetailPanel, { contactoId: 'c1' }), {
      wrapper: createWrapper(),
    })

    // ASSERT — no link and no fallback text while loading
    await waitFor(() => {
      expect(screen.queryByTestId('clienteAsociadoLink')).not.toBeInTheDocument()
      expect(screen.queryByTestId('sin-cliente-asignado')).not.toBeInTheDocument()
    })
  })

  it('useClienteById is called with clienteId when contact has a client', async () => {
    // ARRANGE
    mockUseContactoById.mockReturnValue({
      data: { ...baseContacto, clienteId: 'cl-999' },
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseClienteById.mockReturnValue({
      data: { id: 'cl-999', nombre: 'Empresa Gamma' },
      isLoading: false,
    })

    // ACT
    render(createElement(ContactoDetailPanel, { contactoId: 'c1' }), {
      wrapper: createWrapper(),
    })

    // ASSERT — hook called with the correct id
    await waitFor(() => {
      expect(mockUseClienteById).toHaveBeenCalledWith('cl-999')
    })
  })

  it('useClienteById is called with undefined when clienteId is null (no fetch)', async () => {
    // ARRANGE
    mockUseContactoById.mockReturnValue({
      data: { ...baseContacto, clienteId: null },
      isLoading: false,
      isError: false,
      error: null,
    })
    mockUseClienteById.mockReturnValue({
      data: undefined,
      isLoading: false,
    })

    // ACT
    render(createElement(ContactoDetailPanel, { contactoId: 'c1' }), {
      wrapper: createWrapper(),
    })

    // ASSERT — hook called with undefined (enabled: false, no network request)
    await waitFor(() => {
      expect(mockUseClienteById).toHaveBeenCalledWith(undefined)
    })
  })
})
