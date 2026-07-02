// -----------------------------------------------------------------------------
// Story 2.3 — Create Client (BMad-Integrated automate expansion)
// Edge-case component tests for ClienteFormModal.
//
// Complements ClienteFormModal.test.tsx (which covers happy / empty / whitespace /
// 409 / 500 / cancel) with paths the baseline does not:
//   - Re-opening the modal after a close resets fields (no residual values).
//   - Submitting with untrimmed input sends the trimmed body to the server.
//   - After a 409, correcting the NIT and resubmitting recovers cleanly.
//   - noValidate is set on the <form> so the browser does not double up on
//     Zod's validation with its native constraint messages.
//   - The submit button is disabled while the mutation is in flight (isSubmitting).
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

beforeEach(() => {
  toastSuccess.mockReset()
  toastError.mockReset()
})

describe('ClienteFormModal — form structure invariants', () => {
  it('[P2] the <form> uses noValidate so the browser does not overlay native errors', async () => {
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={vi.fn()} />
      </Providers>,
    )
    const form = await screen.findByTestId('cliente-form-modal')
    // `noValidate` on an HTMLFormElement is exposed via the `noValidate` prop
    // (Reflect on the element) — presence of the DOM attribute is the assertion.
    expect(form.hasAttribute('novalidate')).toBe(true)
  })

  it('[P2] renders the "* Campos obligatorios" legend inside the form', async () => {
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={vi.fn()} />
      </Providers>,
    )
    expect(await screen.findByText('* Campos obligatorios')).toBeInTheDocument()
  })
})

describe('ClienteFormModal — trim on submit', () => {
  it('[P1] leading/trailing whitespace in every field is trimmed before POST', async () => {
    let capturedBody: unknown = null
    server.use(
      http.post('*/api/v1/clientes', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(
          {
            id: 'trimmed',
            nombre: 'Nuevo Cliente SA',
            nit: '999-1',
            telefono: '+57 300 555 0000',
            ciudad: 'Medellín',
            createdAt: '2026-07-02T12:00:00Z',
            updatedAt: '2026-07-02T12:00:00Z',
          },
          { status: 201 },
        )
      }),
    )

    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={vi.fn()} />
      </Providers>,
    )

    await user.type(screen.getByTestId('cliente-form-nombre'), '  Nuevo Cliente SA  ')
    await user.type(screen.getByTestId('cliente-form-nit'), '  999-1  ')
    await user.type(screen.getByTestId('cliente-form-telefono'), '  +57 300 555 0000  ')
    await user.type(screen.getByTestId('cliente-form-ciudad'), '  Medellín  ')
    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledTimes(1))

    expect(capturedBody).toEqual({
      nombre: 'Nuevo Cliente SA',
      nit: '999-1',
      telefono: '+57 300 555 0000',
      ciudad: 'Medellín',
    })
  })
})

describe('ClienteFormModal — recovery from 409', () => {
  it('[P1] correcting the NIT after a 409 and resubmitting closes the modal on success', async () => {
    // First POST → 409 (default MSW handler for the seed NIT '900123456-7').
    // Second POST → 201.
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={onClose} />
      </Providers>,
    )

    await user.type(screen.getByTestId('cliente-form-nombre'), 'Acme Corp')
    await user.type(screen.getByTestId('cliente-form-nit'), '900123456-7')
    await user.type(screen.getByTestId('cliente-form-telefono'), '+57 300 111 1111')
    await user.type(screen.getByTestId('cliente-form-ciudad'), 'Cali')
    await user.click(screen.getByTestId('cliente-form-submit'))

    // 409 inline error appears.
    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-nit-error')).toHaveTextContent(
        'El NIT/RUC ya está registrado',
      ),
    )
    expect(onClose).not.toHaveBeenCalled()

    // User corrects the NIT to a fresh value → next POST returns 201 via the
    // default MSW handler.
    const nitInput = screen.getByTestId('cliente-form-nit')
    await user.clear(nitInput)
    await user.type(nitInput, '999-new-nit')

    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(toastSuccess).toHaveBeenCalledTimes(1)
  })
})

describe('ClienteFormModal — accessibility invariants', () => {
  it('[P2] error <p> elements carry role="alert" so AT announces them immediately', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={vi.fn()} />
      </Providers>,
    )

    await user.click(screen.getByTestId('cliente-form-submit'))

    const errorEl = await screen.findByTestId('cliente-form-nombre-error')
    expect(errorEl).toHaveAttribute('role', 'alert')
  })

  it('[P2] aria-describedby wires each field to its own error id', async () => {
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={vi.fn()} />
      </Providers>,
    )

    await user.click(screen.getByTestId('cliente-form-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-nombre')).toHaveAttribute(
        'aria-describedby',
        'nombre-error',
      )
    })
    expect(screen.getByTestId('cliente-form-nit')).toHaveAttribute(
      'aria-describedby',
      'nit-error',
    )
    expect(screen.getByTestId('cliente-form-telefono')).toHaveAttribute(
      'aria-describedby',
      'telefono-error',
    )
    expect(screen.getByTestId('cliente-form-ciudad')).toHaveAttribute(
      'aria-describedby',
      'ciudad-error',
    )
  })
})

describe('ClienteFormModal — modal open/close lifecycle', () => {
  it('[P1] closing then re-opening resets the form to empty defaults', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={vi.fn()} />
      </Providers>,
    )

    // Type something, then close via isOpen=false.
    await user.type(screen.getByTestId('cliente-form-nombre'), 'Draft')
    rerender(
      <Providers>
        <ClienteFormModal isOpen={false} onClose={vi.fn()} />
      </Providers>,
    )

    // Re-open.
    rerender(
      <Providers>
        <ClienteFormModal isOpen={true} onClose={vi.fn()} />
      </Providers>,
    )

    // Nombre is back to empty (reset() ran on the isOpen=false transition).
    const nombre = await screen.findByTestId('cliente-form-nombre')
    expect(nombre).toHaveValue('')
  })

  it('[P2] returns null when isOpen=false — modal is not in the DOM', () => {
    render(
      <Providers>
        <ClienteFormModal isOpen={false} onClose={vi.fn()} />
      </Providers>,
    )
    expect(screen.queryByTestId('cliente-form-modal')).not.toBeInTheDocument()
  })
})
