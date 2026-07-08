/**
 * Story 1.2 — AC #3, #4 — Routing edge cases against the real routeTree.
 * Complements deepLink.test.tsx and notFound.test.tsx by covering:
 * - Case sensitivity of route paths
 * - Deeply nested unknown URLs
 * - Trailing slash behavior
 * - Query string preservation on redirect
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

function mountAt(path: string) {
  // Story 2.1 introduced the /clientes route data-loader (useClientes). Wrap
  // in a QueryClientProvider so any /clientes render inside these routing
  // edge-case tests receives a valid TanStack Query client.
  server.use(
    http.get(`${API_BASE}/api/v1/clientes`, () => HttpResponse.json([], { status: 200 })),
  )
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  const client = createTestQueryClient()
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

describe('Routing — edge cases', () => {
  it('[P2] GIVEN a differently-cased URL /CLIENTES, THEN the router matches /clientes route (TanStack default is case-insensitive)', async () => {
    // TanStack Router's default caseSensitive:false means /CLIENTES is
    // routed to the /clientes component — no not-found view is shown.
    // This documents the current behavior so any future switch to
    // caseSensitive:true becomes an intentional, observable change.
    mountAt('/CLIENTES')
    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('not-found-view')).not.toBeInTheDocument()
  })

  it('[P1] GIVEN a deeply nested unknown URL under an unknown segment, THEN the not-found view is rendered', async () => {
    // Story 2.1 introduced /clientes/$clienteId, so /clientes/<anything> is
    // now a valid match (the router treats trailing segments as fuzzy). The
    // spirit of this edge-case is preserved by pointing at a segment that is
    // definitely not in the route tree.
    mountAt('/unknown-domain/foo/bar/baz')
    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
  })

  it('[P1] GIVEN a completely unrelated URL /admin/dashboard, THEN the not-found view is rendered', async () => {
    mountAt('/admin/dashboard')
    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
  })

  it('[P1] GIVEN an unknown URL, THEN the app-shell wrapper remains rendered around the not-found view', async () => {
    mountAt('/nada')
    await waitFor(() => {
      expect(screen.getByTestId('app-shell')).toBeInTheDocument()
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
  })

  it('[P2] GIVEN direct URL /clientes with a query string, THEN clientes-view still renders (query is preserved)', async () => {
    const router = mountAt('/clientes?filter=active&page=2')
    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
    // Note: TanStack Router auto-parses numeric-looking values to numbers.
    expect(router.state.location.search).toEqual(
      expect.objectContaining({ filter: 'active', page: 2 }),
    )
  })

  it('[P2] GIVEN direct URL /contactos with a hash fragment, THEN contactos-view still renders', async () => {
    mountAt('/contactos#section')
    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })
  })

  it('[P1] GIVEN two consecutive navigations to the same target /clientes, THEN reload is NOT called', async () => {
    const router = mountAt('/contactos')
    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })
    await router.navigate({ to: '/clientes' })
    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
    await router.navigate({ to: '/clientes' })
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('[P1] GIVEN unknown URL, THEN the pathname is NOT rewritten to /clientes (redirect is not silently triggered)', async () => {
    const router = mountAt('/ruta-inexistente-xyz')
    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
    expect(router.state.location.pathname).toBe('/ruta-inexistente-xyz')
  })
})
