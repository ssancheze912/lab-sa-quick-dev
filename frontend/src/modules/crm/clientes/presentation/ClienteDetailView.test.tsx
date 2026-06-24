import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { ClienteDetailView } from './ClienteDetailView'
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
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ClienteDetailView, { clienteId }),
    ),
  )
}

describe('ClienteDetailView', () => {
  it('renders the detail view root container with data-testid="cliente-detail-view"', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })
  })

  it('renders the Nombre field value when client data is loaded', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Empresa Test')
    })
  })

  it('renders the NIT/RUC field value when client data is loaded', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent('900123456-1')
    })
  })

  it('renders the Teléfono field value when client data is loaded', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('3001234567')
    })
  })

  it('renders the Ciudad field value when client data is loaded', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Bogotá')
    })
  })

  it('renders all field labels in Spanish', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument()
    })
    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByText('NIT/RUC')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ciudad')).toBeInTheDocument()
  })

  it('wraps the detail view in <section aria-label="Detalle del cliente"> for WCAG 2.1 AA', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      const section = screen.getByRole('region', { name: 'Detalle del cliente' })
      expect(section).toBeInTheDocument()
      expect(section.tagName.toLowerCase()).toBe('section')
    })
  })

  it('has data-testid attributes for each field value', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument()
      expect(screen.getByTestId('cliente-detail-nit')).toBeInTheDocument()
      expect(screen.getByTestId('cliente-detail-telefono')).toBeInTheDocument()
      expect(screen.getByTestId('cliente-detail-ciudad')).toBeInTheDocument()
    })
  })

  it('renders a skeleton loader while the fetch is in-flight', async () => {
    // Arrange — delay response so component stays in loading state
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        // Justified: 300ms MSW delay holds the response in-flight so the
        // synchronous assertion below can observe the skeleton loading state.
        // This is NOT a hard wait for timing — it simulates network latency
        // to create a testable loading window before the skeleton disappears.
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockCliente)
      }),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert — skeleton is visible before data arrives
    expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
    })
  })

  it('does NOT render a spinner during loading (skeleton only)', async () => {
    // Arrange — delay response
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        // Justified: MSW delay holds the response in-flight to verify no
        // spinner is rendered during the loading window (skeleton-only requirement).
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockCliente)
      }),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert — no spinner element
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(document.querySelector('.spinner')).toBeNull()
  })

  it('hides the skeleton once the client data is loaded', async () => {
    // Arrange & Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
  })

  it('renders "Cliente no encontrado." when the API returns 404', async () => {
    // Arrange & Act
    renderClienteDetailView('99999999-9999-9999-9999-999999999999')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })
    expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument()
  })

  it('does NOT render ErrorPanel when the API returns 404', async () => {
    // Arrange & Act
    renderClienteDetailView('99999999-9999-9999-9999-999999999999')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
  })

  it('does NOT render the detail view fields when the API returns 404', async () => {
    // Arrange & Act
    renderClienteDetailView('99999999-9999-9999-9999-999999999999')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-telefono')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-detail-ciudad')).not.toBeInTheDocument()
  })

  it('renders ErrorPanel when the API returns a 500 error', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })

  it('renders a "Reintentar" button inside ErrorPanel on non-404 error', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    })
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('triggers a new fetch when the "Reintentar" button is clicked', async () => {
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

    const retryButton = screen.getByTestId('retry-button')
    fireEvent.click(retryButton)

    // Assert — at least 2 calls: initial + retry
    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(2)
    })
  })

  it('renders ErrorPanel on a network error (not a 404)', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        return HttpResponse.error()
      }),
    )

    // Act
    renderClienteDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
  })
})
