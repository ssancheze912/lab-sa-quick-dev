/**
 * Story 1.2 — AC #4
 * Not-found view is rendered in Spanish with a link back to /clientes.
 * This test is intentionally RED until NotFoundView.tsx is implemented.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { NotFoundView } from './NotFoundView'

describe('NotFoundView', () => {
  const mountWithRouter = async () => {
    const rootRoute = createRootRoute({ component: NotFoundView })
    const clientesRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/clientes',
      component: () => <div data-testid="clientes-view" />,
    })
    const router = createRouter({
      routeTree: rootRoute.addChildren([clientesRoute]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    const utils = render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
    return utils
  }

  it('GIVEN a rendered NotFoundView, WHEN it appears, THEN Spanish heading is visible', async () => {
    // GIVEN + WHEN
    await mountWithRouter()

    // THEN
    expect(screen.getByRole('heading', { name: /página no encontrada/i })).toBeInTheDocument()
  })

  it('GIVEN the not-found view, THEN it offers a Spanish link back to /clientes', async () => {
    await mountWithRouter()

    const link = screen.getByRole('link', { name: /ir a clientes/i })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/clientes')
  })

  it('GIVEN a screen-reader user, THEN the container is announced via aria-live="polite"', async () => {
    await mountWithRouter()

    const region = screen.getByTestId('not-found-view')
    expect(region.getAttribute('aria-live')).toBe('polite')
  })

  it('GIVEN Spanish content, THEN the descriptive body copy is present', async () => {
    await mountWithRouter()

    expect(
      screen.getByText(/la ruta solicitada no existe/i),
    ).toBeInTheDocument()
  })
})
