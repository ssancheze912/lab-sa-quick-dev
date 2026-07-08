/**
 * Story 1.2 — AC #5 — Index route `/` MUST redirect to `/clientes` via TanStack Router's redirect.
 * The redirect must occur in beforeLoad (not in a rendered <Navigate>).
 * RED until routes/index.tsx and routes/clientes.tsx are updated.
 */
import { describe, it, expect } from 'vitest'
import { render, waitFor, screen } from '@testing-library/react'
import { createRouter, createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { routeTree } from '@/routeTree.gen'
import { createTestQueryClient } from '@/test/render'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'

function mountAtRoot() {
  server.use(
    http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([], { status: 200 })),
  )
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  const client = createTestQueryClient()
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('Route: / (index)', () => {
  it('GIVEN a user lands on /, WHEN the router resolves, THEN the pathname is /clientes', async () => {
    const router = mountAtRoot()

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  it('GIVEN the redirect to /clientes, WHEN the destination view mounts, THEN clientes-view is rendered', async () => {
    mountAtRoot()

    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
  })

  it('GIVEN the redirect uses beforeLoad, THEN window.location was NOT mutated (no full reload)', async () => {
    const router = mountAtRoot()

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(window.location.reload).not.toHaveBeenCalled()
  })
})
