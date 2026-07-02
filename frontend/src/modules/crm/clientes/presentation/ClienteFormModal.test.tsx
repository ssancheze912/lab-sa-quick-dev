// -----------------------------------------------------------------------------
// Story 2.3 — Create Client
// Unit tests for ClienteFormModal — happy path, validation, 409, 500, cancel.
// -----------------------------------------------------------------------------
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { ClienteFormModal } from './ClienteFormModal'

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('siesa-ui-kit', async () => {
  const actual = await vi.importActual<typeof import('siesa-ui-kit')>('siesa-ui-kit')
  return {
    ...actual,
    toast: Object.assign(vi.fn(), {
      success: (...args: unknown[]) => toastSuccess(...args),
      error: (...args: unknown[]) => toastError(...args),
      warning: vi.fn(),
      info: vi.fn(),
    }),
  }
})

function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

async function fillValidFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('cliente-form-nombre'), 'Nuevo Cliente SA')
  await user.type(screen.getByTestId('cliente-form-nit'), '999888777-1')
  await user.type(screen.getByTestId('cliente-form-telefono'), '+57 300 555 0000')
  await user.type(screen.getByTestId('cliente-form-ciudad'), 'Medellín')
}

beforeEach(() => {
  toastSuccess.mockReset()
  toastError.mockReset()
})

describe('ClienteFormModal', () => {
  it('renders 4 required inputs, action buttons, and the "* Campos obligatorios" legend', async () => {
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={vi.fn()} />
      </Providers>,
    )

    expect(await screen.findByTestId('cliente-form-nombre')).toHaveAttribute('aria-required', 'true')
    expect(screen.getByTestId('cliente-form-nit')).toHaveAttribute('aria-required', 'true')
    expect(screen.getByTestId('cliente-form-telefono')).toHaveAttribute('aria-required', 'true')
    expect(screen.getByTestId('cliente-form-ciudad')).toHaveAttribute('aria-required', 'true')

    expect(screen.getByTestId('cliente-form-cancel')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-form-submit')).toBeInTheDocument()
    expect(screen.getByText('* Campos obligatorios')).toBeInTheDocument()
  })

  it('shows the four inline errors when submitting an empty form and sends no POST', async () => {
    let postCount = 0
    server.use(
      http.post('*/api/v1/clientes', () => {
        postCount++
        return HttpResponse.json({ id: 'x' }, { status: 201 })
      }),
    )

    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={vi.fn()} />
      </Providers>,
    )

    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-nombre-error')).toHaveTextContent(
        'El nombre es requerido',
      ),
    )
    expect(screen.getByTestId('cliente-form-nit-error')).toHaveTextContent('El NIT/RUC es requerido')
    expect(screen.getByTestId('cliente-form-telefono-error')).toHaveTextContent(
      'El teléfono es requerido',
    )
    expect(screen.getByTestId('cliente-form-ciudad-error')).toHaveTextContent('La ciudad es requerida')

    expect(postCount).toBe(0)
  })

  it('shows inline error on whitespace-only Nombre after blur', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={vi.fn()} />
      </Providers>,
    )
    const nombre = await screen.findByTestId('cliente-form-nombre')
    await user.type(nombre, '   ')
    // Blur by focusing another element (tab).
    await user.tab()

    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-nombre-error')).toHaveTextContent(
        'El nombre es requerido',
      ),
    )
  })

  it('submits valid data → mutation runs, modal closes, toast.success fires', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={onClose} />
      </Providers>,
    )

    await fillValidFields(user)
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(toastSuccess).toHaveBeenCalledTimes(1)
    expect(toastSuccess).toHaveBeenCalledWith(
      'Cliente creado correctamente',
      expect.objectContaining({ color: 'green' }),
    )
  })

  it('on 409 → shows inline "El NIT/RUC ya está registrado", modal stays open, no toast, no leak', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={onClose} />
      </Providers>,
    )

    await user.type(screen.getByTestId('cliente-form-nombre'), 'Acme Corp')
    // The default MSW handler returns 409 when this NIT already exists in the seed.
    await user.type(screen.getByTestId('cliente-form-nit'), '900123456-7')
    await user.type(screen.getByTestId('cliente-form-telefono'), '+57 300 111 1111')
    await user.type(screen.getByTestId('cliente-form-ciudad'), 'Cali')
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-nit-error')).toHaveTextContent(
        'El NIT/RUC ya está registrado',
      ),
    )

    // Modal still mounted, values preserved.
    expect(screen.getByTestId('cliente-form-modal')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-form-nit')).toHaveValue('900123456-7')

    expect(onClose).not.toHaveBeenCalled()
    expect(toastError).not.toHaveBeenCalled()

    // NFR6 — the Problem Details `detail` and `title` must not leak into the DOM.
    const html = document.body.innerHTML
    expect(html).not.toContain('Ya existe un cliente con el NIT/RUC indicado.')
    expect(html).not.toContain('NIT/RUC duplicado')
  })

  it('on 500 → shows red toast, modal stays open with fields intact', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )

    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={onClose} />
      </Providers>,
    )
    await fillValidFields(user)
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'No se pudo guardar. Intenta de nuevo.',
        expect.objectContaining({ color: 'red' }),
      ),
    )

    expect(onClose).not.toHaveBeenCalled()
    // Modal still open.
    expect(screen.getByTestId('cliente-form-modal')).toBeInTheDocument()
    // Values preserved.
    expect(screen.getByTestId('cliente-form-nombre')).toHaveValue('Nuevo Cliente SA')
  })

  it('Cancel button → closes the modal without submitting', async () => {
    let postCount = 0
    server.use(
      http.post('*/api/v1/clientes', () => {
        postCount++
        return HttpResponse.json({ id: 'x' }, { status: 201 })
      }),
    )

    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={onClose} />
      </Providers>,
    )
    await user.click(screen.getByTestId('cliente-form-cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(postCount).toBe(0)
  })
})
