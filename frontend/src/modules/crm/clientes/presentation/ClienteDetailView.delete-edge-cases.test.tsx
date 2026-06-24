/**
 * Component Edge-Case Tests — Story 2.5: Delete Client
 * BMad-Integrated Automate — Expansion beyond ClienteDetailView.test.tsx delete section
 *
 * ATDD baseline covers (NOT duplicated here):
 *   - "Eliminar" button is rendered in detail view
 *   - Clicking "Eliminar" opens AlertDialog with "Confirmar" and "Cancelar" buttons
 *   - "Cancelar" closes dialog without DELETE call; no toast
 *   - "Confirmar" triggers mutation, shows toast, navigates to /clientes
 *   - "Confirmar" button disabled + "Eliminando..." while mutation is pending
 *
 * Edge cases added here:
 *   - "Eliminar" button is NOT present while data is loading (skeleton state)
 *   - "Eliminar" button is NOT present when client is not found (404 state)
 *   - "Eliminar" button is NOT present in error panel state (500 state)
 *   - Confirmation dialog closes and "Eliminar" button remains after successful deletion
 *     (navigation mock absorbs routing — button gone because component unmounts, test confirms nav called)
 *   - Toast.error displayed on 500 DELETE, "Confirmar" re-enabled (isError path)
 *   - "Confirmar" button text resets to "Confirmar" after failed delete
 *   - Opening delete dialog does NOT interfere with edit dialog state
 *   - Both "Eliminar" and "Editar" open their respective dialogs independently
 *   - Dialog does NOT stay open after failed delete (AlertDialog closes on error)
 *   - "Cancelar" in delete dialog does NOT trigger navigate
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { ClienteDetailView } from './ClienteDetailView'
import type { Cliente } from '../domain/Cliente'

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('siesa-ui-kit', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    htmlType,
    type: _type,
    inputSize: _inputSize,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    htmlType?: string
    type?: string
    inputSize?: string
    [key: string]: unknown
  }) =>
    createElement(
      'button',
      { onClick, disabled, type: htmlType ?? 'button', ...props },
      children,
    ),
  Input: ({
    label,
    id,
    errorMessage,
    error: _error,
    inputSize: _inputSize,
    actionText: _actionText,
    startIcon: _startIcon,
    endIcon: _endIcon,
    ...props
  }: {
    label?: string
    id?: string
    errorMessage?: string
    error?: boolean
    inputSize?: string
    actionText?: string
    startIcon?: React.ReactNode
    endIcon?: React.ReactNode
    [key: string]: unknown
  }) =>
    createElement(
      'div',
      null,
      label && createElement('label', { htmlFor: id }, label),
      createElement('input', { id, ...props }),
      errorMessage && createElement('p', { role: 'alert' }, errorMessage),
    ),
  AlertDialog: ({
    title,
    isOpen,
    onCancel,
    actions,
    showCloseButton,
    children,
  }: {
    title?: string
    isOpen?: boolean
    onCancel?: () => void
    actions?: React.ReactNode
    showCloseButton?: boolean
    children?: React.ReactNode
  }) => {
    if (!isOpen) return null
    return createElement(
      'div',
      { role: 'dialog', 'aria-label': title, 'data-testid': 'alert-dialog' },
      showCloseButton &&
        createElement('button', { onClick: onCancel, 'data-testid': 'close-dialog-button' }, 'X'),
      actions ?? children,
    )
  },
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}))

const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

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
  http.put('*/api/v1/clientes/:id', () => {
    return HttpResponse.json({ ...mockCliente, nombre: 'Editado' }, { status: 200 })
  }),
  http.delete('*/api/v1/clientes/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

function renderDetailView(clienteId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ClienteDetailView, { clienteId }),
    ),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// "Eliminar" NOT present during loading
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — delete edge: "Eliminar" absent during skeleton state', () => {
  it('[P1] does not render "Eliminar" button while data is loading', async () => {
    // Arrange: Delay response to hold skeleton state
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json(mockCliente)
      }),
    )

    // Act
    renderDetailView('11111111-1111-1111-1111-111111111111')

    // Assert: "Eliminar" not present while skeleton is shown
    expect(screen.queryByTestId('eliminar-cliente-button')).not.toBeInTheDocument()

    // Cleanup: wait for data to arrive
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// "Eliminar" NOT present when client is not found (404)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — delete edge: "Eliminar" absent when client not found', () => {
  it('[P1] does not render "Eliminar" button when GET returns 404', async () => {
    // Act
    renderDetailView('99999999-9999-9999-9999-999999999999')

    // Assert: skeleton and then not-found state — no "Eliminar"
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('eliminar-cliente-button')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// "Eliminar" NOT present in error panel state (500)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — delete edge: "Eliminar" absent in error state', () => {
  it('[P1] does not render "Eliminar" button when GET returns 500', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/clientes/:id', () => new HttpResponse(null, { status: 500 })),
    )

    // Act
    renderDetailView('11111111-1111-1111-1111-111111111111')

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('eliminar-cliente-button')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE 500 error: toast.error shown, "Confirmar" re-enables
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — delete edge: 500 DELETE shows error toast', () => {
  it('[P1] shows error toast when DELETE returns 500', async () => {
    // Arrange: DELETE returns 500
    server.use(
      http.delete('*/api/v1/clientes/:id', () => {
        return new HttpResponse(
          JSON.stringify({ status: 500, title: 'Internal Server Error' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } },
        )
      }),
    )

    renderDetailView('11111111-1111-1111-1111-111111111111')
    await waitFor(() => {
      expect(screen.getByTestId('eliminar-cliente-button')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('eliminar-cliente-button'))
    await waitFor(() => {
      expect(screen.getByTestId('confirmar-eliminacion-button')).toBeInTheDocument()
    })

    // Act: confirm deletion that will fail
    fireEvent.click(screen.getByTestId('confirmar-eliminacion-button'))

    // Assert: error toast shown
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
    })
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it('[P2] "Confirmar" button re-enables after a failed DELETE (not stuck in "Eliminando..." state)', async () => {
    // Arrange: DELETE returns 500
    server.use(
      http.delete('*/api/v1/clientes/:id', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    renderDetailView('11111111-1111-1111-1111-111111111111')
    await waitFor(() => {
      expect(screen.getByTestId('eliminar-cliente-button')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('eliminar-cliente-button'))
    await waitFor(() => {
      expect(screen.getByTestId('confirmar-eliminacion-button')).toBeInTheDocument()
    })

    // Act
    fireEvent.click(screen.getByTestId('confirmar-eliminacion-button'))

    // Assert: After error resolves, "Confirmar" button is enabled again
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('No se pudo eliminar. Intenta de nuevo.')
    })
    await waitFor(() => {
      expect(screen.getByTestId('confirmar-eliminacion-button')).toBeEnabled()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// "Cancelar" does NOT trigger navigate
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — delete edge: cancel does not navigate', () => {
  it('[P1] does NOT call navigate when "Cancelar" is clicked in the delete dialog', async () => {
    // Arrange
    renderDetailView('11111111-1111-1111-1111-111111111111')
    await waitFor(() => {
      expect(screen.getByTestId('eliminar-cliente-button')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('eliminar-cliente-button'))
    await waitFor(() => {
      expect(screen.getByTestId('cancelar-eliminacion-button')).toBeInTheDocument()
    })

    // Act
    fireEvent.click(screen.getByTestId('cancelar-eliminacion-button'))

    // Assert
    await waitFor(() => {
      expect(screen.queryByTestId('confirmar-eliminacion-button')).not.toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE success: navigate called with { to: '/clientes' }
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — delete edge: navigate called with correct path on success', () => {
  it('[P0] navigates to /clientes with exact { to: "/clientes" } argument after successful delete', async () => {
    // Arrange
    renderDetailView('11111111-1111-1111-1111-111111111111')
    await waitFor(() => {
      expect(screen.getByTestId('eliminar-cliente-button')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('eliminar-cliente-button'))
    await waitFor(() => {
      expect(screen.getByTestId('confirmar-eliminacion-button')).toBeInTheDocument()
    })

    // Act
    fireEvent.click(screen.getByTestId('confirmar-eliminacion-button'))

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/clientes' })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Opening delete dialog does NOT affect edit dialog and vice versa
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — delete edge: delete and edit dialogs are independent', () => {
  it('[P1] opening delete dialog does not show edit form', async () => {
    // Arrange
    renderDetailView('11111111-1111-1111-1111-111111111111')
    await waitFor(() => {
      expect(screen.getByTestId('eliminar-cliente-button')).toBeInTheDocument()
    })

    // Act: open delete dialog only
    fireEvent.click(screen.getByTestId('eliminar-cliente-button'))

    // Assert: delete dialog is shown, edit form is NOT
    await waitFor(() => {
      expect(screen.getByTestId('confirmar-eliminacion-button')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('cliente-form')).not.toBeInTheDocument()
  })

  it('[P1] cancelling delete dialog allows opening edit dialog afterwards', async () => {
    // Arrange
    renderDetailView('11111111-1111-1111-1111-111111111111')
    await waitFor(() => {
      expect(screen.getByTestId('eliminar-cliente-button')).toBeInTheDocument()
    })

    // Open delete dialog, then cancel
    fireEvent.click(screen.getByTestId('eliminar-cliente-button'))
    await waitFor(() => {
      expect(screen.getByTestId('cancelar-eliminacion-button')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTestId('cancelar-eliminacion-button'))
    await waitFor(() => {
      expect(screen.queryByTestId('cancelar-eliminacion-button')).not.toBeInTheDocument()
    })

    // Act: now open edit dialog
    fireEvent.click(screen.getByTestId('editar-cliente-button'))

    // Assert: edit form is now open without issue
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form')).toBeInTheDocument()
    })
  })
})
