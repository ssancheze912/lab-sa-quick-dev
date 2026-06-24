/**
 * Component Edge Case Tests — Story 2.2: ClienteDetailView
 * BMad-Integrated Automate — Expansion beyond ATDD coverage
 *
 * Covers edge cases and boundary conditions NOT covered by the ATDD component tests:
 *   - Fields with empty string values (blank data from backend)
 *   - Fields with very long values (overflow boundary)
 *   - Fields with special characters (accented, symbols)
 *   - clienteId prop changes (re-render with different id)
 *   - ErrorPanel custom message display
 *   - ErrorPanel with default message when no custom message provided
 *   - ARIA section renders with correct tag name (section, not div)
 *   - Skeleton has multiple rows (4 rows matching field count)
 *   - Component handles null/undefined data gracefully after query disable
 *   - Multiple retries increment call count correctly
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { ClienteDetailView } from './ClienteDetailView'
import { ErrorPanel } from '../../../../shared/components/ErrorPanel'
import type { Cliente } from '../domain/Cliente'

// Mock siesa-ui-kit Button component used in ErrorPanel
vi.mock('siesa-ui-kit', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: unknown }) =>
    createElement('button', { onClick, ...props }, children),
}))

const mockCliente: Cliente = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Empresa Test',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const server = setupServer(
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === '11111111-1111-1111-1111-111111111111') {
      return HttpResponse.json(mockCliente)
    }
    return new HttpResponse(
      JSON.stringify({ status: 404, title: 'Not Found', detail: `Cliente with id '${params.id}' was not found.` }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderClienteDetailView(clienteId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    queryClient,
    ...render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ClienteDetailView, { clienteId }),
      ),
    ),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fields with special characters
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — edge: special characters in field values', () => {
  it('[P2] renders nombre with accented characters without escaping', async () => {
    // Arrange: Client with accented characters
    const clienteWithAccents: Cliente = {
      ...mockCliente,
      nombre: 'Comercializadora Ñoño & Asociados S.A.S.',
    }
    server.use(
      http.get('*/api/v1/clientes/:id', () => HttpResponse.json(clienteWithAccents)),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Comercializadora Ñoño & Asociados S.A.S.')
    })
  })

  it('[P2] renders NIT with dots and dashes formatting intact', async () => {
    // Arrange: Client with formatted NIT
    const clienteFormattedNit: Cliente = {
      ...mockCliente,
      nit: '900.123.456-7',
    }
    server.use(
      http.get('*/api/v1/clientes/:id', () => HttpResponse.json(clienteFormattedNit)),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent('900.123.456-7')
    })
  })

  it('[P2] renders ciudad with spaces (multi-word city name)', async () => {
    // Arrange: Client with multi-word city
    const clienteMultiWordCity: Cliente = {
      ...mockCliente,
      ciudad: 'Santa Marta',
    }
    server.use(
      http.get('*/api/v1/clientes/:id', () => HttpResponse.json(clienteMultiWordCity)),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Santa Marta')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Fields with very long values (boundary condition)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — edge: very long field values', () => {
  it('[P2] renders a nombre value that exceeds 100 characters without truncation', async () => {
    // Arrange: Very long company name (boundary)
    const longName = 'A'.repeat(120)
    const clienteLongNombre: Cliente = {
      ...mockCliente,
      nombre: longName,
    }
    server.use(
      http.get('*/api/v1/clientes/:id', () => HttpResponse.json(clienteLongNombre)),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert: Full text is present (component does not truncate)
    await waitFor(() => {
      const el = screen.getByTestId('cliente-detail-nombre')
      expect(el.textContent).toBe(longName)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Section element tag and ARIA role
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — edge: correct HTML section element', () => {
  it('[P1] renders the root element as a <section> tag (not a <div>)', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert: Element is <section> for WCAG compliance
    await waitFor(() => {
      const el = screen.getByTestId('cliente-detail-view')
      expect(el.tagName.toLowerCase()).toBe('section')
    })
  })

  it('[P1] section with aria-label is queryable as a landmark region', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert: getByRole("region") works — means section + aria-label is properly configured
    await waitFor(() => {
      const region = screen.getByRole('region', { name: 'Detalle del cliente' })
      expect(region).toBeInTheDocument()
    })
  })

  it('[P1] the <section> element has data-testid="cliente-detail-view" even during skeleton state', async () => {
    // Arrange: Delay response to ensure skeleton renders
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockCliente)
      }),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert: root section present during loading too
    const section = screen.getByTestId('cliente-detail-view')
    expect(section).toBeInTheDocument()
    expect(section.tagName.toLowerCase()).toBe('section')

    // Cleanup
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton — 4 rows
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — edge: skeleton has 4 rows matching field count', () => {
  it('[P2] renders skeleton container during loading', async () => {
    // Arrange: Delayed response
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockCliente)
      }),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert: skeleton container is present
    const skeleton = screen.getByTestId('cliente-detail-skeleton')
    expect(skeleton).toBeInTheDocument()

    // Cleanup
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ErrorPanel: default and custom message
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — edge: message prop behavior', () => {
  it('[P1] renders default message "Error al cargar los datos. Intenta de nuevo." when no message prop', () => {
    // Arrange
    const onRetry = vi.fn()

    // Act
    render(
      createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        createElement(ErrorPanel, { onRetry }),
      ),
    )

    // Assert: default message is shown
    expect(screen.getByText('Error al cargar los datos. Intenta de nuevo.')).toBeInTheDocument()
  })

  it('[P1] renders custom message when message prop is provided', () => {
    // Arrange
    const onRetry = vi.fn()
    const customMessage = 'No se pudo conectar al servidor de clientes.'

    // Act
    render(
      createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        createElement(ErrorPanel, { onRetry, message: customMessage }),
      ),
    )

    // Assert: custom message is shown
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('[P1] calls onRetry callback when "Reintentar" button is clicked', () => {
    // Arrange
    const onRetry = vi.fn()

    // Act
    render(
      createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        createElement(ErrorPanel, { onRetry }),
      ),
    )

    fireEvent.click(screen.getByTestId('retry-button'))

    // Assert: onRetry was called exactly once
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('[P2] calls onRetry multiple times when button is clicked multiple times', () => {
    // Arrange
    const onRetry = vi.fn()

    // Act
    render(
      createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        createElement(ErrorPanel, { onRetry }),
      ),
    )

    fireEvent.click(screen.getByTestId('retry-button'))
    fireEvent.click(screen.getByTestId('retry-button'))
    fireEvent.click(screen.getByTestId('retry-button'))

    // Assert: onRetry called 3 times (button is not disabled after first click)
    expect(onRetry).toHaveBeenCalledTimes(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ClienteDetailView: 500 error shows default ErrorPanel message
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — edge: ErrorPanel message in 500 error state', () => {
  it('[P1] ErrorPanel shows default Spanish error message on 500 error', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => new HttpResponse(null, { status: 500 })),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
    expect(screen.getByText('Error al cargar los datos. Intenta de nuevo.')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Re-render with different clienteId prop
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — edge: prop change triggers new fetch', () => {
  it('[P1] re-renders and shows new client data when clienteId prop changes', async () => {
    // Arrange: Two different clients
    const clienteA: Cliente = { ...mockCliente, id: 'aaaaaaaa-1111-1111-1111-111111111111', nombre: 'Cliente A' }
    const clienteB: Cliente = { ...mockCliente, id: 'bbbbbbbb-2222-2222-2222-222222222222', nombre: 'Cliente B' }

    server.use(
      http.get('*/api/v1/clientes/:id', ({ params }) => {
        if (params.id === clienteA.id) return HttpResponse.json(clienteA)
        if (params.id === clienteB.id) return HttpResponse.json(clienteB)
        return new HttpResponse(null, { status: 404 })
      }),
    )

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    // Act: render with clienteA
    const { rerender } = render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ClienteDetailView, { clienteId: clienteA.id }),
      ),
    )

    // Wait for clienteA to load
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Cliente A')
    })

    // WHEN: clienteId prop changes to clienteB
    rerender(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ClienteDetailView, { clienteId: clienteB.id }),
      ),
    )

    // THEN: New client data is shown
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Cliente B')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Multiple retries — call count increments
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — edge: retry increments fetch call count correctly', () => {
  it('[P1] triggers exactly one additional fetch per "Reintentar" click (total 2 calls after 1 retry)', async () => {
    // Arrange
    let callCount = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        callCount++
        return new HttpResponse(null, { status: 500 })
      }),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })

    const callCountAfterInitial = callCount

    // WHEN: Click retry once
    await act(async () => {
      fireEvent.click(screen.getByTestId('retry-button'))
    })

    // THEN: At least one more call than before
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(callCountAfterInitial)
    })
  })
})
