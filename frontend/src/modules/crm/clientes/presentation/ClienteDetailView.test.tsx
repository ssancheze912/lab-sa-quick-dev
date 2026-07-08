/**
 * Story 2.2 — ATDD (RED phase).
 *
 * Component-level integration test for `ClienteDetailView`. Mounts the
 * component in isolation with a QueryClientProvider and MSW-stubbed
 * `/api/v1/clientes/:id`. `useNavigate` is mocked so the "Volver a la lista"
 * click can be asserted without wiring a full router. Covers:
 *
 *   - AC #1 / #2 — happy path renders the four fields (Nombre, NIT/RUC,
 *                  Teléfono, Ciudad) with the returned values.
 *   - AC #5     — the skeleton (`data-testid="cliente-detail-skeleton"` +
 *                 `aria-busy="true"`) shows while the query is in flight.
 *   - AC #3     — 404 renders `ClienteNotFound` (role="status" +
 *                 "Cliente no encontrado"); clicking "Volver a la lista"
 *                 navigates to `/clientes`.
 *   - AC #4     — non-UUID `clienteId` renders `ClienteNotFound` AND does
 *                 NOT hit the network.
 *   - AC #6     — non-404 error renders `ErrorPanel` with exact Spanish copy;
 *                 clicking "Reintentar" triggers a re-fetch.
 *   - AC #7     — switching `clienteId` from A to B re-fetches and re-renders
 *                 the detail card with B's data.
 *   - AC #1 / #2 — visible strings are Spanish ("NIT/RUC", "Teléfono", "Ciudad").
 *
 * RED until:
 *   - `src/modules/crm/clientes/presentation/ClienteDetailView.tsx`
 *   - `src/modules/crm/clientes/application/useCliente.ts`
 *   - `src/shared/components/ClienteNotFound.tsx`
 * are all implemented.
 */
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente } from '@/test/factories/cliente.factory'

// Mock @tanstack/react-router's useNavigate BEFORE importing the component,
// so the test does not require a router provider. The component invokes
// `navigate({ to: '/clientes' })` on "Volver a la lista".
const navigateSpy = vi.fn()
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '@tanstack/react-router',
  )
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

// Static import AFTER the mock so the component picks up the mocked hook.
import { ClienteDetailView } from './ClienteDetailView'

function renderView(clienteId: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  })
  const utils = render(
    <QueryClientProvider client={client}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>,
  )
  return {
    ...utils,
    rerenderWithId: (id: string) =>
      utils.rerender(
        <QueryClientProvider client={client}>
          <ClienteDetailView clienteId={id} />
        </QueryClientProvider>,
      ),
  }
}

describe('ClienteDetailView — happy path (AC #1, #2)', () => {
  it('GIVEN backend returns a Cliente, THEN the four fields are rendered with the exact values', async () => {
    const target = buildCliente({
      nombre: 'Empresa Detalle',
      nit: '900555111',
      telefono: '3005551110',
      ciudad: 'Medellín',
    })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(target, { status: 200 }),
      ),
    )

    renderView(target.id)

    // Nombre is the article heading.
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Empresa Detalle' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByTestId('detail-nit')).toHaveTextContent('900555111')
    expect(screen.getByTestId('detail-telefono')).toHaveTextContent('3005551110')
    expect(screen.getByTestId('detail-ciudad')).toHaveTextContent('Medellín')
  })

  it('GIVEN happy path, THEN the visible field labels are exactly Spanish ("NIT/RUC", "Teléfono", "Ciudad")', async () => {
    const target = buildCliente({ nombre: 'Empresa X' })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(target, { status: 200 }),
      ),
    )

    renderView(target.id)

    await waitFor(() => expect(screen.getByText('NIT/RUC')).toBeInTheDocument())
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ciudad')).toBeInTheDocument()
  })
})

describe('ClienteDetailView — loading skeleton (AC #5)', () => {
  it('GIVEN the query is in flight, THEN the skeleton has data-testid="cliente-detail-skeleton" and aria-busy="true"', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200))
        return HttpResponse.json(buildCliente(), { status: 200 })
      }),
    )
    renderView('a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77')

    const skeleton = await screen.findByTestId('cliente-detail-skeleton')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
    // No field value while loading.
    expect(screen.queryByTestId('detail-nit')).not.toBeInTheDocument()
  })
})

describe('ClienteDetailView — 404 not-found branch (AC #3)', () => {
  it('GIVEN backend returns 404, THEN ClienteNotFound (role="status") is rendered with exact Spanish title', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        new HttpResponse(null, { status: 404 }),
      ),
    )
    renderView('a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77')

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(screen.getByText('Cliente no encontrado')).toBeInTheDocument()
    expect(
      screen.getByText('El cliente que buscas no existe o fue eliminado.'),
    ).toBeInTheDocument()
  })

  it('GIVEN the 404 not-found view, WHEN "Volver a la lista" is clicked, THEN useNavigate({ to: "/clientes" }) is called', async () => {
    navigateSpy.mockClear()
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        new HttpResponse(null, { status: 404 }),
      ),
    )
    renderView('a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77')

    const backBtn = await screen.findByRole('button', {
      name: /volver a la lista/i,
    })
    fireEvent.click(backBtn)

    expect(navigateSpy).toHaveBeenCalledWith({ to: '/clientes' })
  })
})

describe('ClienteDetailView — invalid UUID short-circuit (AC #4)', () => {
  it('GIVEN clienteId is not a UUID, THEN ClienteNotFound renders AND NO network request fires', async () => {
    let calls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        calls += 1
        return HttpResponse.json({}, { status: 200 })
      }),
    )

    renderView('not-a-uuid')

    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Cliente no encontrado')).toBeInTheDocument()
    // Give any accidental fetch a chance to fire.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(calls).toBe(0)
  })
})

describe('ClienteDetailView — non-404 error branch (AC #6)', () => {
  it('GIVEN backend returns 500, THEN ErrorPanel renders with the exact Spanish title/subtitle', async () => {
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    renderView('a3d81b62-9c9d-4a3d-9c8e-2b1f4d1a0e77')

    await waitFor(() =>
      expect(
        screen.getByText('No se pudo cargar el cliente'),
      ).toBeInTheDocument(),
    )
    expect(
      screen.getByText('Comprueba tu conexión e intenta nuevamente.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /reintentar/i }),
    ).toBeInTheDocument()
  })

  it('GIVEN a 500 followed by recovery, WHEN Reintentar is clicked, THEN a new request fires and the detail card renders', async () => {
    let calls = 0
    const recovered = buildCliente({ nombre: 'Recovered' })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        calls += 1
        if (calls === 1) return HttpResponse.json({}, { status: 500 })
        return HttpResponse.json(recovered, { status: 200 })
      }),
    )
    renderView(recovered.id)

    const retry = await screen.findByRole('button', { name: /reintentar/i })
    fireEvent.click(retry)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Recovered' }),
      ).toBeInTheDocument(),
    )
    expect(calls).toBeGreaterThanOrEqual(2)
  })
})

describe('ClienteDetailView — Editar button opens edit dialog (Story 2.4 AC #1)', () => {
  it('GIVEN a loaded cliente, THEN the Editar button is visible AND clicking it opens the edit dialog with title "Editar cliente"', async () => {
    const target = buildCliente({ nombre: 'Editable Corp' })
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(target, { status: 200 }),
      ),
    )

    renderView(target.id)

    const editBtn = await screen.findByRole('button', { name: /editar cliente/i })
    expect(editBtn).toBeInTheDocument()

    fireEvent.click(editBtn)

    await waitFor(() =>
      expect(screen.getByText('Editar cliente')).toBeInTheDocument(),
    )
    expect(screen.getByTestId('cliente-edit-dialog')).toBeInTheDocument()
  })
})

describe('ClienteDetailView — switching selection (AC #7)', () => {
  it('GIVEN clienteId changes from A to B, THEN the detail card re-renders with B\'s data', async () => {
    const a = buildCliente({ id: '11111111-1111-1111-1111-111111111111', nombre: 'Empresa A' })
    const b = buildCliente({ id: '22222222-2222-2222-2222-222222222222', nombre: 'Empresa B' })

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/:id`, ({ params }) => {
        if (String(params.id) === a.id) return HttpResponse.json(a, { status: 200 })
        if (String(params.id) === b.id) return HttpResponse.json(b, { status: 200 })
        return new HttpResponse(null, { status: 404 })
      }),
    )

    const { rerenderWithId } = renderView(a.id)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Empresa A' }),
      ).toBeInTheDocument(),
    )

    rerenderWithId(b.id)

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Empresa B' }),
      ).toBeInTheDocument(),
    )
  })
})
