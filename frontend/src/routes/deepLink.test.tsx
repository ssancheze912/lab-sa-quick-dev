/**
 * Story 1.2 — AC #3 — Direct URL access to /clientes and /contactos MUST render the correct view.
 * No redirect to home, no 404, no blank page.
 * RED until routes/clientes.tsx, routes/contactos.tsx and __root.tsx are updated.
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
  // in a QueryClientProvider so any /clientes render inside these deep-link
  // tests receives a valid TanStack Query client.
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

describe('Deep-link routing', () => {
  it('GIVEN direct URL /clientes, WHEN loaded, THEN clientes-view renders without redirect', async () => {
    const router = mountAt('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('GIVEN direct URL /contactos, WHEN loaded, THEN contactos-view renders without redirect', async () => {
    const router = mountAt('/contactos')

    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })
    expect(router.state.location.pathname).toBe('/contactos')
  })

  it('GIVEN direct URL /clientes, THEN NO 404/not-found copy is displayed', async () => {
    mountAt('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
    expect(screen.queryByText(/página no encontrada/i)).not.toBeInTheDocument()
  })

  it('GIVEN direct URL /contactos, THEN NO 404/not-found copy is displayed', async () => {
    mountAt('/contactos')

    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })
    expect(screen.queryByText(/página no encontrada/i)).not.toBeInTheDocument()
  })

  it('GIVEN switching from /clientes to /contactos, THEN the shell wrapper stays mounted (SPA)', async () => {
    const router = mountAt('/clientes')

    await waitFor(() => {
      expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    })
    const shellFirst = screen.getByTestId('app-shell')

    await router.navigate({ to: '/contactos' })

    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })

    const shellSecond = screen.getByTestId('app-shell')
    // Same DOM node — the shell did NOT unmount/remount
    expect(shellSecond).toBe(shellFirst)
    expect(window.location.reload).not.toHaveBeenCalled()
  })
})
