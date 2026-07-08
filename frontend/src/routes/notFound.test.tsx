/**
 * Story 1.2 — AC #4 — Unknown routes render a Spanish NotFoundView inside the shell.
 * RED until notFoundComponent is registered on the root route and NotFoundView exists.
 */
import { describe, it, expect } from 'vitest'
import { render, waitFor, screen } from '@testing-library/react'
import { createRouter, createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'

describe('Route: /ruta-que-no-existe (not-found)', () => {
  it('GIVEN an unknown URL, WHEN the router resolves, THEN the Spanish not-found heading is displayed', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/ruta-que-no-existe'] }),
    })

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /página no encontrada/i }),
      ).toBeInTheDocument()
    })
  })

  it('GIVEN the not-found route, THEN the app shell remains rendered around it', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/ruta-que-no-existe'] }),
    })

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('app-shell')).toBeInTheDocument()
    })
  })

  it('GIVEN the not-found view, THEN it offers a link back to /clientes', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/ruta-que-no-existe'] }),
    })

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /ir a clientes/i })
      expect(link.getAttribute('href')).toBe('/clientes')
    })
  })

  it('GIVEN an unknown URL, THEN the not-found view container is present (not a blank page) and no redirect to home is triggered', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/ruta-que-no-existe'] }),
    })

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
    // Pathname stays unchanged (not redirected to /clientes)
    expect(router.state.location.pathname).toBe('/ruta-que-no-existe')
    // Not the clientes-view (which would indicate a silent redirect)
    expect(screen.queryByTestId('clientes-view')).not.toBeInTheDocument()
  })
})
