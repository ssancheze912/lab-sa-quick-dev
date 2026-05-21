import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import {
  createRouter,
  RouterProvider,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router'
import { act } from 'react'
import { NotFoundView } from '../NotFoundView'

/**
 * Unit tests for NotFoundView component.
 *
 * Story 1.2 — Frontend Navigation Shell
 * Epic 1 — Project Foundation & Application Shell
 *
 * BMad-Integrated expansion — component-level coverage.
 * These tests verify the NotFoundView renders correctly and contains
 * the required Spanish content per AC4.
 *
 * TanStack RouterProvider renders asynchronously; we use `act` + `findBy`
 * to wait for the router to settle before asserting.
 *
 * Test IDs: UNIT-NF-01 through UNIT-NF-07
 */

afterEach(cleanup)

/**
 * Helper to render NotFoundView wrapped in a minimal TanStack Router.
 * Uses findBy* queries (async) to wait for router to settle.
 */
async function renderNotFoundWithRouter() {
  const rootRoute = createRootRoute({
    component: () => <NotFoundView />,
  })
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <NotFoundView />,
  })
  const routeTree = rootRoute.addChildren([indexRoute])
  const router = createRouter({ routeTree })

  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<RouterProvider router={router} />)
    await router.load()
  })

  return result!
}

describe('NotFoundView', () => {
  /**
   * UNIT-NF-01 (P0 — AC4)
   * The 404 numeric heading is rendered.
   */
  it('UNIT-NF-01 — Renders the numeric "404" heading', async () => {
    await renderNotFoundWithRouter()
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
  })

  /**
   * UNIT-NF-02 (P0 — AC4)
   * Primary Spanish message "Página no encontrada" is visible.
   */
  it('UNIT-NF-02 — Renders primary Spanish message "Página no encontrada"', async () => {
    await renderNotFoundWithRouter()
    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument()
  })

  /**
   * UNIT-NF-03 (P1 — AC4)
   * Secondary Spanish message "La ruta solicitada no existe." is visible.
   */
  it('UNIT-NF-03 — Renders secondary Spanish message "La ruta solicitada no existe."', async () => {
    await renderNotFoundWithRouter()
    expect(await screen.findByText('La ruta solicitada no existe.')).toBeInTheDocument()
  })

  /**
   * UNIT-NF-04 (P0 — AC4)
   * "Ir a Clientes" link is rendered and points to /clientes.
   */
  it('UNIT-NF-04 — Renders "Ir a Clientes" link with href /clientes', async () => {
    await renderNotFoundWithRouter()
    const link = await screen.findByRole('link', { name: /ir a clientes/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/clientes')
  })

  /**
   * UNIT-NF-05 (P1 — AC4)
   * data-testid="not-found-view" is present on the root element (used by E2E selectors).
   */
  it('UNIT-NF-05 — Root element has data-testid="not-found-view"', async () => {
    await renderNotFoundWithRouter()
    expect(await screen.findByTestId('not-found-view')).toBeInTheDocument()
  })

  /**
   * UNIT-NF-06 (P2 — AC4)
   * The component renders all required text nodes together (snapshot-style content check).
   */
  it('UNIT-NF-06 — All required content nodes are present in a single render', async () => {
    await renderNotFoundWithRouter()
    const container = await screen.findByTestId('not-found-view')

    // All text content is within the not-found-view container
    expect(container).toHaveTextContent('404')
    expect(container).toHaveTextContent('Página no encontrada')
    expect(container).toHaveTextContent('La ruta solicitada no existe.')
    expect(container).toHaveTextContent('Ir a Clientes')
  })

  /**
   * UNIT-NF-07 (P2 — AC4)
   * The component does NOT render any navigation rail or bar
   * (it is a standalone 404 view, no shell wrapper when directly rendered).
   */
  it('UNIT-NF-07 — Does not render NavigationRail or NavigationBar in isolation', async () => {
    await renderNotFoundWithRouter()
    // Wait for render to settle
    await screen.findByTestId('not-found-view')

    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument()
    expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument()
  })
})
