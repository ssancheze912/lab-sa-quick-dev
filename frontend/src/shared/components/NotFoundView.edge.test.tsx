/**
 * Story 1.2 — AC #4 — Edge cases for the Spanish NotFoundView.
 * Complements NotFoundView.test.tsx by covering:
 * - Link uses TanStack Router (SPA navigation — no full reload)
 * - motion-safe: prefix for reduced-motion respect
 * - Container role/aria structure
 * - Content is not empty (guard against blank page)
 */
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { NotFoundView } from './NotFoundView'

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
  return { ...utils, router }
}

describe('NotFoundView — edge cases', () => {
  it('[P1] GIVEN the Ir a Clientes link is clicked, THEN the router navigates to /clientes WITHOUT calling window.location.reload', async () => {
    const { router } = await mountWithRouter()

    const link = screen.getByRole('link', { name: /ir a clientes/i })
    fireEvent.click(link)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('[P2] GIVEN the Ir a Clientes link, THEN its transition is prefixed with motion-safe: to respect prefers-reduced-motion', async () => {
    await mountWithRouter()
    const link = screen.getByRole('link', { name: /ir a clientes/i })
    expect(link.className).toMatch(/motion-safe:/)
  })

  it('[P1] GIVEN the NotFoundView container, THEN it has role/behavior of a polite live region', async () => {
    await mountWithRouter()
    const container = screen.getByTestId('not-found-view')
    expect(container.tagName.toLowerCase()).toBe('section')
    expect(container.getAttribute('aria-live')).toBe('polite')
  })

  it('[P1] GIVEN the NotFoundView content, THEN it renders non-empty user-facing copy (not a blank page)', async () => {
    await mountWithRouter()
    const container = screen.getByTestId('not-found-view')
    expect(container.textContent?.trim().length).toBeGreaterThan(0)
    expect(container.querySelector('h1')?.textContent).toMatch(/página no encontrada/i)
  })

  it('[P2] GIVEN the Ir a Clientes link, THEN it has visible focus-visible outline styling for keyboard users', async () => {
    await mountWithRouter()
    const link = screen.getByRole('link', { name: /ir a clientes/i })
    expect(link.className).toMatch(/focus-visible:outline/)
  })

  it('[P1] GIVEN keyboard users, THEN the link is a real anchor with an href attribute (not a button or div)', async () => {
    await mountWithRouter()
    const link = screen.getByRole('link', { name: /ir a clientes/i })
    expect(link.tagName.toLowerCase()).toBe('a')
    expect(link.getAttribute('href')).toBe('/clientes')
  })
})
