/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests
 *
 * Tests for the 404 not-found view (`not-found.tsx`):
 *   - Spanish "Página no encontrada" message visible
 *   - Link back to /clientes visible and correct
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { act } from 'react'
import { NotFoundPage } from '@/routes/-not-found'

// ─── Router wrapper for Link components ──────────────────────────────────────

async function renderWithRouter(ui: React.ReactElement) {
  const rootRoute = createRootRoute({
    component: () => ui,
  })
  const routeTree = rootRoute
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/unknown'] }),
  })
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<RouterProvider router={router} />)
    await router.load()
  })
  return result!
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4: 404 not-found view
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundPage — 404 view (AC4)', () => {
  it('renders the not-found-page container', async () => {
    await renderWithRouter(<NotFoundPage />)
    await waitFor(() => expect(screen.getByTestId('not-found-page')).toBeTruthy())
  })

  it('displays "Página no encontrada" as the main message in Spanish', async () => {
    await renderWithRouter(<NotFoundPage />)
    await waitFor(() => {
      const message = screen.getByTestId('not-found-message')
      expect(message).toHaveTextContent('Página no encontrada')
    })
  })

  it('renders a link back to /clientes', async () => {
    await renderWithRouter(<NotFoundPage />)
    await waitFor(() => {
      const backLink = screen.getByTestId('not-found-back-link')
      expect(backLink).toBeTruthy()
      expect(backLink).toHaveAttribute('href', '/clientes')
    })
  })

  it('back link has accessible link text (not empty)', async () => {
    await renderWithRouter(<NotFoundPage />)
    await waitFor(() => {
      const backLink = screen.getByTestId('not-found-back-link')
      expect(backLink.textContent?.trim().length).toBeGreaterThan(0)
    })
  })

  it('renders a semantic heading element for the 404 message', async () => {
    await renderWithRouter(<NotFoundPage />)
    await waitFor(() => {
      const heading = screen.queryByRole('heading')
      expect(heading).not.toBeNull()
    })
  })

  it('does not render the NavigationRail or NavigationBar on the 404 page', async () => {
    await renderWithRouter(<NotFoundPage />)
    await waitFor(() => {
      expect(screen.queryByTestId('navigation-rail')).toBeNull()
      expect(screen.queryByTestId('navigation-bar')).toBeNull()
    })
  })

  it('does not throw when rendered without props', async () => {
    await expect(renderWithRouter(<NotFoundPage />)).resolves.not.toThrow()
  })
})
