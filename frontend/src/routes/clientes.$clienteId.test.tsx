/**
 * Story 2.2 — ATDD (RED phase).
 *
 * Routing-integration test for `/clientes/:clienteId`. Boots the real
 * `routeTree` with a memory history and MSW-stubbed backend so we exercise
 * the exact seam from URL → Outlet → ClienteDetailView.
 *
 * Covers:
 *   - AC #1 / #7 — Deep-link to `/clientes/{existingId}` renders the split
 *                  panel with the matching list item selected AND the detail
 *                  card populated with that client's data.
 *   - AC #3     — Deep-link to `/clientes/{unknownUuid}` renders
 *                 `ClienteNotFound` on the right panel; the list panel stays
 *                 fully interactive (both items still rendered).
 *   - AC #4     — Deep-link to `/clientes/not-a-uuid` renders
 *                 `ClienteNotFound` AND does NOT fire a request to
 *                 `/api/v1/clientes/not-a-uuid` (short-circuited by
 *                 `isValidClienteId`).
 *
 * RED until:
 *   - `src/modules/crm/clientes/presentation/ClienteDetailView.tsx` renders
 *   - `src/routes/clientes.$clienteId.tsx` wires that component in
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { http, HttpResponse } from 'msw'
import { routeTree } from '@/routeTree.gen'
import { createTestQueryClient } from '@/test/render'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente } from '@/test/factories/cliente.factory'

function mountAt(path: string) {
  const client = createTestQueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('/clientes/:clienteId — deep link with existing id (AC #1, #7)', () => {
  it('GIVEN /clientes/{existingId}, THEN the list renders 2 items AND the detail card shows the matching client', async () => {
    const target = buildCliente({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Empresa A',
      nit: '900000001',
      telefono: '3000000001',
      ciudad: 'Bogotá',
    })
    const other = buildCliente({ nombre: 'Empresa B' })

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json([target, other], { status: 200 }),
      ),
      http.get(`${API_BASE}/api/v1/clientes/:id`, ({ params }) => {
        if (String(params.id) === target.id) {
          return HttpResponse.json(target, { status: 200 })
        }
        return new HttpResponse(null, { status: 404 })
      }),
    )

    mountAt(`/clientes/${target.id}`)

    // List: both items rendered.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /ver cliente:\s*empresa a/i }),
      ).toBeInTheDocument(),
    )
    expect(
      screen.getByRole('button', { name: /ver cliente:\s*empresa b/i }),
    ).toBeInTheDocument()

    // Selected row carries data-selected="true" (Story 2.1 contract).
    const item = screen.getByRole('button', { name: /ver cliente:\s*empresa a/i })
    expect(item).toHaveAttribute('data-selected', 'true')

    // Detail card: heading + fields present.
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Empresa A' }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByTestId('detail-nit')).toHaveTextContent('900000001')
    expect(screen.getByTestId('detail-telefono')).toHaveTextContent('3000000001')
    expect(screen.getByTestId('detail-ciudad')).toHaveTextContent('Bogotá')
  })
})

describe('/clientes/:clienteId — unknown UUID (AC #3)', () => {
  it('GIVEN /clientes/{unknownUuid}, THEN ClienteNotFound is visible AND the list stays interactive', async () => {
    const a = buildCliente({ nombre: 'Empresa A' })
    const b = buildCliente({ nombre: 'Empresa B' })

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json([a, b], { status: 200 }),
      ),
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => new HttpResponse(null, { status: 404 })),
    )

    mountAt('/clientes/00000000-0000-0000-0000-000000000000')

    // Not-found panel is announced.
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(screen.getByText('Cliente no encontrado')).toBeInTheDocument()

    // List remains interactive.
    expect(
      screen.getByRole('button', { name: /ver cliente:\s*empresa a/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /ver cliente:\s*empresa b/i }),
    ).toBeInTheDocument()
  })
})

describe('/clientes/:clienteId — non-UUID short-circuit (AC #4)', () => {
  it('GIVEN /clientes/not-a-uuid, THEN ClienteNotFound is visible AND NO request fires against the detail endpoint', async () => {
    let detailCalls = 0
    const a = buildCliente({ nombre: 'Empresa A' })

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json([a], { status: 200 }),
      ),
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        detailCalls += 1
        return HttpResponse.json({}, { status: 200 })
      }),
    )

    mountAt('/clientes/not-a-uuid')

    // Not-found renders synchronously (no network round-trip).
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(screen.getByText('Cliente no encontrado')).toBeInTheDocument()

    // Give any accidental fetch a chance to fire.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(detailCalls).toBe(0)
  })
})
