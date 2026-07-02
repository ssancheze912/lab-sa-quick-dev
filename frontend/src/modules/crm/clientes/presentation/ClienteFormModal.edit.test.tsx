// -----------------------------------------------------------------------------
// Story 2.4 — Edit Client
// Unit tests for ClienteFormModal in edit mode (pre-filled, PUT flow, 409, 404).
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

const clienteId = '11111111-1111-1111-1111-111111111111'

const initialValues = {
  nombre: 'Acme Corp',
  nit: '900123456-7',
  telefono: '+57 300 111 1111',
  ciudad: 'Cali',
}

function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  toastSuccess.mockReset()
  toastError.mockReset()
})

describe('ClienteFormModal — edit mode', () => {
  it('renders with title "Editar cliente" and pre-fills the four inputs', async () => {
    render(
      <Providers>
        <ClienteFormModal
          mode="edit"
          isOpen={true}
          onClose={vi.fn()}
          clienteId={clienteId}
          initialValues={initialValues}
        />
      </Providers>,
    )

    expect(await screen.findByTestId('cliente-form-nombre')).toHaveValue(initialValues.nombre)
    expect(screen.getByTestId('cliente-form-nit')).toHaveValue(initialValues.nit)
    expect(screen.getByTestId('cliente-form-telefono')).toHaveValue(initialValues.telefono)
    expect(screen.getByTestId('cliente-form-ciudad')).toHaveValue(initialValues.ciudad)

    // Title dynamic — "Editar cliente" NOT "Nuevo cliente".
    expect(screen.getByText('Editar cliente')).toBeInTheDocument()
    expect(screen.queryByText('Nuevo cliente')).not.toBeInTheDocument()
  })

  it('submits update with edited values → invokes PUT, closes modal, toast success', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal
          mode="edit"
          isOpen={true}
          onClose={onClose}
          clienteId={clienteId}
          initialValues={initialValues}
        />
      </Providers>,
    )

    const nombre = await screen.findByTestId('cliente-form-nombre')
    await user.clear(nombre)
    await user.type(nombre, 'Acme Updated')
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(toastSuccess).toHaveBeenCalledWith(
      'Cliente actualizado correctamente',
      expect.objectContaining({ color: 'green' }),
    )
  })

  it('shows inline error on empty required field and sends no PUT', async () => {
    let putCount = 0
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        putCount++
        return HttpResponse.json({ id: clienteId, ...initialValues }, { status: 200 })
      }),
    )

    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal
          mode="edit"
          isOpen={true}
          onClose={onClose}
          clienteId={clienteId}
          initialValues={initialValues}
        />
      </Providers>,
    )

    const nombre = await screen.findByTestId('cliente-form-nombre')
    await user.clear(nombre)
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-nombre-error')).toHaveTextContent(
        'El nombre es requerido',
      ),
    )
    expect(putCount).toBe(0)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('on 409 duplicate NIT → inline NIT error, modal stays open, no toast, no leak', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal
          mode="edit"
          isOpen={true}
          onClose={onClose}
          clienteId={clienteId}
          initialValues={initialValues}
        />
      </Providers>,
    )

    const nit = await screen.findByTestId('cliente-form-nit')
    await user.clear(nit)
    // NIT of Beta in the MSW seed → 409 against a different row.
    await user.type(nit, '800987654-3')
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-nit-error')).toHaveTextContent(
        'El NIT/RUC ya está registrado',
      ),
    )
    expect(screen.getByTestId('cliente-form-modal')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(toastError).not.toHaveBeenCalled()

    // NFR6 — no Problem Details leak.
    const html = document.body.innerHTML
    expect(html).not.toContain('Ya existe un cliente con el NIT/RUC indicado.')
    expect(html).not.toContain('NIT/RUC duplicado')
  })

  it('on 404 unknown id → red toast, modal stays open with edited values', async () => {
    server.use(
      http.put('*/api/v1/clientes/:id', () =>
        HttpResponse.json(
          { title: 'Cliente no encontrado', status: 404 },
          { status: 404 },
        ),
      ),
    )

    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal
          mode="edit"
          isOpen={true}
          onClose={onClose}
          clienteId={clienteId}
          initialValues={initialValues}
        />
      </Providers>,
    )

    const nombre = await screen.findByTestId('cliente-form-nombre')
    await user.clear(nombre)
    await user.type(nombre, 'Ghost Row')
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'No se pudo guardar. Intenta de nuevo.',
        expect.objectContaining({ color: 'red' }),
      ),
    )
    expect(screen.getByTestId('cliente-form-modal')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-form-nombre')).toHaveValue('Ghost Row')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('cancel → closes modal without PUT and preserves original values on reopen', async () => {
    let putCount = 0
    server.use(
      http.put('*/api/v1/clientes/:id', () => {
        putCount++
        return HttpResponse.json({ id: clienteId, ...initialValues }, { status: 200 })
      }),
    )

    const onClose = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <Providers>
        <ClienteFormModal
          mode="edit"
          isOpen={true}
          onClose={onClose}
          clienteId={clienteId}
          initialValues={initialValues}
        />
      </Providers>,
    )

    const nombre = await screen.findByTestId('cliente-form-nombre')
    await user.clear(nombre)
    await user.type(nombre, 'Modified But Not Saved')
    await user.click(screen.getByTestId('cliente-form-cancel'))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(putCount).toBe(0)

    // Simulate parent re-render with isOpen=false then isOpen=true (real flow).
    rerender(
      <Providers>
        <ClienteFormModal
          mode="edit"
          isOpen={false}
          onClose={onClose}
          clienteId={clienteId}
          initialValues={initialValues}
        />
      </Providers>,
    )
    rerender(
      <Providers>
        <ClienteFormModal
          mode="edit"
          isOpen={true}
          onClose={onClose}
          clienteId={clienteId}
          initialValues={initialValues}
        />
      </Providers>,
    )

    expect(await screen.findByTestId('cliente-form-nombre')).toHaveValue(initialValues.nombre)
  })
})
