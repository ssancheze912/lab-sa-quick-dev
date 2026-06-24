import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { ClienteForm } from './ClienteForm'
import type { Cliente } from '../domain/Cliente'
import type { ClienteFormValues } from '../application/clienteSchema'

// Mock siesa-ui-kit components
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
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}))

const createdCliente: Cliente = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Empresa Alpha',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const updatedCliente: Cliente = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Empresa Alpha Editada',
  nit: '900123456-1',
  telefono: '3001234568',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-24T00:00:00Z',
}

const server = setupServer(
  http.post('*/api/v1/clientes', () => {
    return HttpResponse.json(createdCliente, { status: 201 })
  }),
  http.put('*/api/v1/clientes/:id', () => {
    return HttpResponse.json(updatedCliente, { status: 200 })
  }),
)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

function renderClienteForm(
  props: {
    onSuccess?: () => void
    onCancel?: () => void
    clienteId?: string
    defaultValues?: Partial<ClienteFormValues>
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ClienteForm, props),
    ),
  )
}

describe('ClienteForm', () => {
  it('renders the form with all required fields', () => {
    // Arrange & Act
    renderClienteForm()

    // Assert
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument()
    expect(screen.getByTestId('field-nombre')).toBeInTheDocument()
    expect(screen.getByTestId('field-nit')).toBeInTheDocument()
    expect(screen.getByTestId('field-telefono')).toBeInTheDocument()
    expect(screen.getByTestId('field-ciudad')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
  })

  it('shows inline validation errors when submitting with empty fields', async () => {
    // Arrange
    renderClienteForm()

    // Act — click submit without filling anything
    fireEvent.click(screen.getByTestId('submit-button'))

    // Assert
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
      expect(screen.getByText('El NIT/RUC es requerido')).toBeInTheDocument()
      expect(screen.getByText('El teléfono es requerido')).toBeInTheDocument()
      expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument()
    })
  })

  it('does not submit to backend when validation fails', async () => {
    // Arrange
    const onSuccess = vi.fn()
    renderClienteForm({ onSuccess })

    // Act — submit empty form
    fireEvent.click(screen.getByTestId('submit-button'))

    // Assert — onSuccess not called (form not submitted)
    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onSuccess and shows success toast on successful submission', async () => {
    // Arrange
    const onSuccess = vi.fn()
    renderClienteForm({ onSuccess })

    // Act — fill form and submit
    fireEvent.change(screen.getByTestId('field-nombre'), { target: { value: 'Empresa Alpha' } })
    fireEvent.change(screen.getByTestId('field-nit'), { target: { value: '900123456-1' } })
    fireEvent.change(screen.getByTestId('field-telefono'), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByTestId('field-ciudad'), { target: { value: 'Bogotá' } })
    fireEvent.click(screen.getByTestId('submit-button'))

    // Assert
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('Cliente creado correctamente')
  })

  it('shows 409 conflict error toast without calling onSuccess', async () => {
    // Arrange
    server.use(
      http.post('*/api/v1/clientes', () => {
        return HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        )
      }),
    )
    const onSuccess = vi.fn()
    renderClienteForm({ onSuccess })

    // Act
    fireEvent.change(screen.getByTestId('field-nombre'), { target: { value: 'Empresa Alpha' } })
    fireEvent.change(screen.getByTestId('field-nit'), { target: { value: '900123456-1' } })
    fireEvent.change(screen.getByTestId('field-telefono'), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByTestId('field-ciudad'), { target: { value: 'Bogotá' } })
    fireEvent.click(screen.getByTestId('submit-button'))

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('El NIT/RUC ya está registrado')
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('calls onCancel when cancel button is clicked', () => {
    // Arrange
    const onCancel = vi.fn()
    renderClienteForm({ onCancel })

    // Act
    fireEvent.click(screen.getByTestId('cancel-button'))

    // Assert
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('disables submit and cancel buttons while mutation is pending', async () => {
    // Arrange
    server.use(
      http.post('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return HttpResponse.json(createdCliente, { status: 201 })
      }),
    )
    renderClienteForm()

    // Act — fill and submit
    fireEvent.change(screen.getByTestId('field-nombre'), { target: { value: 'Empresa Alpha' } })
    fireEvent.change(screen.getByTestId('field-nit'), { target: { value: '900123456-1' } })
    fireEvent.change(screen.getByTestId('field-telefono'), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByTestId('field-ciudad'), { target: { value: 'Bogotá' } })
    fireEvent.click(screen.getByTestId('submit-button'))

    // Assert — buttons are disabled while loading
    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })
    await waitFor(() => {
      expect(screen.getByText('Guardando...')).toBeInTheDocument()
    })
  })

  it('form has aria-label for WCAG 2.1 AA accessibility', () => {
    // Arrange & Act
    renderClienteForm()

    // Assert
    const form = screen.getByTestId('cliente-form')
    expect(form).toHaveAttribute('aria-label', 'Crear nuevo cliente')
  })
})

describe('ClienteForm — edit mode', () => {
  const editProps = {
    clienteId: '11111111-1111-1111-1111-111111111111',
    defaultValues: {
      nombre: 'Empresa Alpha',
      nit: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    },
  }

  it('renders in edit mode with pre-filled defaultValues', () => {
    // Arrange & Act
    renderClienteForm(editProps)

    // Assert
    expect(screen.getByTestId('field-nombre')).toHaveValue('Empresa Alpha')
    expect(screen.getByTestId('field-nit')).toHaveValue('900123456-1')
    expect(screen.getByTestId('field-telefono')).toHaveValue('3001234567')
    expect(screen.getByTestId('field-ciudad')).toHaveValue('Bogotá')
  })

  it('has aria-label "Editar cliente" in edit mode', () => {
    // Arrange & Act
    renderClienteForm(editProps)

    // Assert
    const form = screen.getByTestId('cliente-form')
    expect(form).toHaveAttribute('aria-label', 'Editar cliente')
  })

  it('calls update mutation and onSuccess on valid submit in edit mode', async () => {
    // Arrange
    const onSuccess = vi.fn()
    renderClienteForm({ ...editProps, onSuccess })

    // Act — submit without changing (values already pre-filled)
    fireEvent.click(screen.getByTestId('submit-button'))

    // Assert
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
    })
    expect(mockToastSuccess).toHaveBeenCalledWith('Cliente actualizado correctamente')
  })

  it('calls onCancel without submitting in edit mode', () => {
    // Arrange
    const onCancel = vi.fn()
    renderClienteForm({ ...editProps, onCancel })

    // Act
    fireEvent.click(screen.getByTestId('cancel-button'))

    // Assert
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('shows 409 conflict toast in edit mode on NIT conflict', async () => {
    // Arrange
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        return HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        )
      }),
    )
    const onSuccess = vi.fn()
    renderClienteForm({ ...editProps, onSuccess })

    // Act
    fireEvent.click(screen.getByTestId('submit-button'))

    // Assert
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('El NIT/RUC ya está registrado')
    })
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('shows "Guardando..." and disables submit while mutation is pending in edit mode', async () => {
    // Arrange
    server.use(
      http.put('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return HttpResponse.json(updatedCliente, { status: 200 })
      }),
    )
    renderClienteForm(editProps)

    // Act
    fireEvent.click(screen.getByTestId('submit-button'))

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })
    await waitFor(() => {
      expect(screen.getByText('Guardando...')).toBeInTheDocument()
    })
  })
})
