import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { seedClientes } from '@/test/msw/handlers'
import { ClienteDetailView } from './ClienteDetailView'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

function Providers({ children }: { children: ReactNode }) {
  // retryDelay: 0 — useCliente sets its own retry (2 retries on non-404).
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('ClienteDetailView', () => {
  it('renders the skeleton on initial load', async () => {
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return HttpResponse.json(seedClientes[0])
      }),
    )

    render(
      <Providers>
        <ClienteDetailView clienteId={seedClientes[0].id} />
      </Providers>,
    )

    const skeleton = await screen.findByTestId('cliente-detail-skeleton')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
  })

  it('renders the four cliente fields on success', async () => {
    const target = seedClientes[0] // Acme Corp
    render(
      <Providers>
        <ClienteDetailView clienteId={target.id} />
      </Providers>,
    )

    const panel = await screen.findByTestId('cliente-detail-panel')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute('role', 'region')
    expect(
      screen.getByRole('heading', { level: 2, name: target.nombre }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent(target.nit)
    expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent(target.telefono)
    expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent(target.ciudad)
  })

  it('renders NotFoundClientePanel on 404 (and NOT the detail panel)', async () => {
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ title: 'Cliente no encontrado', status: 404 }, { status: 404 }),
      ),
    )

    render(
      <Providers>
        <ClienteDetailView clienteId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" />
      </Providers>,
    )

    await screen.findByTestId('cliente-not-found')
    expect(screen.queryByTestId('cliente-detail-panel')).toBeNull()
    expect(screen.queryByTestId('cliente-detail-error-panel')).toBeNull()
  })

  it('renders ErrorPanel with Reintentar on 5xx and refetches on click', async () => {
    // useCliente retries non-404 up to 2 times (3 attempts total) — return 500
    // for the initial fetch + all retries so the error branch is reached.
    // After the user clicks Reintentar we start returning 200.
    let recovered = false
    let count = 0
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        count += 1
        if (!recovered) {
          return HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 })
        }
        return HttpResponse.json(seedClientes[0])
      }),
    )

    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteDetailView clienteId={seedClientes[0].id} />
      </Providers>,
    )

    const errorPanel = await screen.findByTestId('cliente-detail-error-panel')
    expect(errorPanel).toHaveAttribute('role', 'alert')
    expect(screen.queryByTestId('cliente-not-found')).toBeNull()
    const countBeforeRetry = count

    recovered = true
    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    await waitFor(() =>
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument(),
    )
    expect(count).toBeGreaterThan(countBeforeRetry)
  })

  it('smoke: does not throw for a valid clienteId', async () => {
    render(
      <Providers>
        <ClienteDetailView clienteId={seedClientes[1].id} />
      </Providers>,
    )
    // Just wait for the tree to settle without an error boundary firing.
    await screen.findByTestId('cliente-detail-panel')
  })
})
