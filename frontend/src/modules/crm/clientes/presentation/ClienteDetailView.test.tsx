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

  // ───────────────────────────────────────────────────────────────────────
  // Edge cases / expansions (Story 2.2 automate pass)
  // ───────────────────────────────────────────────────────────────────────

  it('[P1] renders the mobile "Volver" button in the panel header on success', async () => {
    // GIVEN: A cliente resolves successfully
    render(
      <Providers>
        <ClienteDetailView clienteId={seedClientes[0].id} />
      </Providers>,
    )
    await screen.findByTestId('cliente-detail-panel')

    // THEN: The mobile back button carries its accessibility label and text
    const backBtn = screen.getByRole('button', {
      name: /volver a la lista de clientes/i,
    })
    expect(backBtn).toBeInTheDocument()
    expect(backBtn).toHaveTextContent(/volver/i)
  })

  it('[P1] clicking the mobile "Volver" button invokes navigate({ to: "/clientes" })', async () => {
    // GIVEN: The detail panel is rendered on success
    navigateMock.mockClear()
    const user = userEvent.setup()
    render(
      <Providers>
        <ClienteDetailView clienteId={seedClientes[0].id} />
      </Providers>,
    )
    await screen.findByTestId('cliente-detail-panel')

    // WHEN: The user clicks the mobile "Volver" button
    await user.click(
      screen.getByRole('button', { name: /volver a la lista de clientes/i }),
    )

    // THEN: navigate is invoked exactly once with the expected route target
    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/clientes' })
  })

  it('[P1] does NOT render the mobile "Volver" button in the skeleton branch', async () => {
    // GIVEN: The detail response is deliberately delayed so we stay on the skeleton
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

    // WHEN: The skeleton is visible
    await screen.findByTestId('cliente-detail-skeleton')

    // THEN: The mobile back button lives inside the success branch only
    expect(
      screen.queryByRole('button', { name: /volver a la lista de clientes/i }),
    ).toBeNull()
  })

  it('[P2] wires aria-labelledby="cliente-detail-title" to the h2 with matching id', async () => {
    // GIVEN: The success branch renders with the four cliente fields
    render(
      <Providers>
        <ClienteDetailView clienteId={seedClientes[0].id} />
      </Providers>,
    )
    const panel = await screen.findByTestId('cliente-detail-panel')

    // THEN: The <section> aria-labelledby references the same id the <h2> exposes.
    // This is what screen readers consume as the region label (WCAG 2.1 AA).
    expect(panel).toHaveAttribute('aria-labelledby', 'cliente-detail-title')
    const heading = screen.getByRole('heading', {
      level: 2,
      name: seedClientes[0].nombre,
    })
    expect(heading).toHaveAttribute('id', 'cliente-detail-title')
  })

  it('[P2] renders the four field labels ("NIT/RUC", "Teléfono", "Ciudad") in Spanish', async () => {
    // GIVEN: A cliente resolves successfully
    render(
      <Providers>
        <ClienteDetailView clienteId={seedClientes[0].id} />
      </Providers>,
    )
    await screen.findByTestId('cliente-detail-panel')

    // THEN: The three field labels are visible with es-CO copy (UI locale contract)
    expect(screen.getByText(/nit\/ruc/i)).toBeInTheDocument()
    expect(screen.getByText(/teléfono/i)).toBeInTheDocument()
    expect(screen.getByText(/ciudad/i)).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────
  // Story 2.4 — Edit Button + Edit Modal integration
  // ───────────────────────────────────────────────────────────────────────

  it('[TC-Story-2.4-Editar-Button-Visible] renders the "Editar" button with aria-label when cliente is loaded', async () => {
    render(
      <Providers>
        <ClienteDetailView clienteId={seedClientes[0].id} />
      </Providers>,
    )
    await screen.findByTestId('cliente-detail-panel')

    const editar = screen.getByTestId('cliente-editar-button')
    expect(editar).toBeInTheDocument()
    expect(editar).toHaveAttribute('aria-label', 'Editar cliente')
    expect(editar).toHaveTextContent(/editar/i)
  })

  it('[TC-Story-2.4-Editar-Button-Hidden-While-Loading] does NOT render the "Editar" button in the skeleton branch', async () => {
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
    await screen.findByTestId('cliente-detail-skeleton')

    expect(screen.queryByTestId('cliente-editar-button')).toBeNull()
  })

  it('[TC-Story-2.4-Editar-Button-Hidden-On-404] does NOT render the "Editar" button on 404', async () => {
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json(
          { title: 'Cliente no encontrado', status: 404 },
          { status: 404 },
        ),
      ),
    )

    render(
      <Providers>
        <ClienteDetailView clienteId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" />
      </Providers>,
    )
    await screen.findByTestId('cliente-not-found')

    expect(screen.queryByTestId('cliente-editar-button')).toBeNull()
  })

  it('[TC-Story-2.4-Opens-Modal-With-Prefilled-Fields] clicking the "Editar" button opens the modal in edit mode with pre-filled values', async () => {
    const user = userEvent.setup()
    const target = seedClientes[0]
    render(
      <Providers>
        <ClienteDetailView clienteId={target.id} />
      </Providers>,
    )
    await screen.findByTestId('cliente-detail-panel')

    await user.click(screen.getByTestId('cliente-editar-button'))
    const modal = await screen.findByTestId('cliente-form-modal')
    expect(modal).toBeInTheDocument()
    // Title "Editar cliente" not "Nuevo cliente"
    expect(screen.getByText('Editar cliente')).toBeInTheDocument()
    // Pre-filled inputs
    expect(screen.getByTestId('cliente-form-nombre')).toHaveValue(target.nombre)
    expect(screen.getByTestId('cliente-form-nit')).toHaveValue(target.nit)
    expect(screen.getByTestId('cliente-form-telefono')).toHaveValue(target.telefono)
    expect(screen.getByTestId('cliente-form-ciudad')).toHaveValue(target.ciudad)
  })
})
