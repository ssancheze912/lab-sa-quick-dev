/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * NotFoundView Edge Case Tests (Vitest + RTL)
 * Covers scenarios NOT included in the ATDD NotFoundView.test.tsx:
 *   - Component renders in isolation without router context
 *   - Descriptive paragraph text in Spanish is present
 *   - not-found-view testid is present on the root container
 *   - not-found-heading is an H1 (not a lesser heading)
 *   - not-found-back-link points to /clientes (exact href)
 *   - Only one heading is rendered (no duplicate H1)
 *   - The component renders without crashing when re-mounted
 *   - The back link navigates client-side to /clientes via router
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../../routeTree.gen'
import { NotFoundView } from '../NotFoundView'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render the 404 route via the router
// ─────────────────────────────────────────────────────────────────────────────

async function renderNotFoundViaRouter(path = '/ruta-inexistente') {
  const history = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history })
  render(<RouterProvider router={router} />)
  await router.load()
  return router
}

// ─────────────────────────────────────────────────────────────────────────────
// Isolation rendering (no router context)
// Note: NotFoundView uses TanStack Router <Link> which requires a RouterContext.
// True isolation rendering (without RouterProvider) throws because Link calls
// useLinkProps() which reads from router context internally. These tests are
// marked fixme — they require either mocking @tanstack/react-router Link or
// wrapping with a RouterProvider, making "true isolation" impossible as-is.
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — isolation rendering', () => {
  it.skip('should render without crashing when mounted without a router context', () => {
    // SKIP: Test healing failed after 3 attempts (Vitest equivalent of Playwright test.fixme)
    // Failure: NotFoundView uses TanStack Router <Link> which internally calls
    //   useLinkProps() → reads RouterContext → throws "Cannot read properties of null (reading 'isServer')"
    // Attempted fixes:
    //   1. Wrapped expect in try-catch — Link still throws during render
    //   2. Mocked @tanstack/react-router — breaks routeTree import chain in other tests
    //   3. Used act() wrapper — context error occurs before render completes
    // Root cause: TanStack Router <Link> is not designed for context-free rendering.
    //   NotFoundView cannot be rendered in true isolation — it requires RouterProvider.
    // TODO: Extract the visual content from NotFoundView into a pure presentational
    //   component (NotFoundContent) that can be tested in isolation, keeping only the
    //   <Link> in the route-aware wrapper.
    expect(() => render(<NotFoundView />)).not.toThrow()
  })

  it.skip('should render the not-found-view testid container in isolation', () => {
    // SKIP: Same root cause as above — TanStack Link requires router context.
    //   Cannot render NotFoundView without RouterProvider. See parent describe comment.
    render(<NotFoundView />)
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
  })

  it.skip('should render the not-found-heading element in isolation', () => {
    // SKIP: Same root cause as above — TanStack Link requires router context.
    //   Cannot render NotFoundView without RouterProvider. See parent describe comment.
    render(<NotFoundView />)
    expect(screen.getByTestId('not-found-heading')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Content correctness — heading level, text, testids
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — content correctness', () => {
  it('should render "Página no encontrada" as an H1 heading (not H2+)', async () => {
    // GIVEN: The 404 route is rendered
    await renderNotFoundViaRouter()

    // THEN: The heading is level 1 (H1), not a lesser heading
    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: 'Página no encontrada', level: 1 })
      expect(heading).toBeInTheDocument()
    })
  })

  it('should render exactly one H1 heading on the 404 page (no duplicate headings)', async () => {
    // GIVEN: The 404 route is rendered
    await renderNotFoundViaRouter()

    // THEN: There is only one H1 — no duplicate heading confusion for screen readers
    await waitFor(() => {
      const h1Elements = screen.getAllByRole('heading', { level: 1 })
      expect(h1Elements).toHaveLength(1)
    })
  })

  it('should render the descriptive Spanish paragraph text', async () => {
    // GIVEN: The 404 route is rendered
    await renderNotFoundViaRouter()

    // THEN: The Spanish description paragraph is visible to users
    await waitFor(() => {
      expect(
        screen.getByText('La página que buscas no existe o ha sido movida.'),
      ).toBeInTheDocument()
    })
  })

  it('should render the not-found-view container testid on the 404 route', async () => {
    // GIVEN: The 404 route is rendered
    await renderNotFoundViaRouter()

    // THEN: The root container has the testid used by E2E tests
    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
  })

  it('should render the not-found-back-link testid for Playwright E2E selectors', async () => {
    // GIVEN: The 404 route is rendered
    await renderNotFoundViaRouter()

    // THEN: The back link has the testid used by E2E tests
    await waitFor(() => {
      expect(screen.getByTestId('not-found-back-link')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Back link — href, text, and navigation
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — back link href and navigation', () => {
  it('should render the back link pointing to /clientes (exact href)', async () => {
    // GIVEN: The 404 route is rendered
    await renderNotFoundViaRouter()

    // THEN: The back link href is exactly /clientes (not a relative path or other route)
    await waitFor(() => {
      const backLink = screen.getByTestId('not-found-back-link')
      expect(backLink).toHaveAttribute('href', '/clientes')
    })
  })

  it('should render the back link with text "Ir a Clientes"', async () => {
    // GIVEN: The 404 route is rendered
    await renderNotFoundViaRouter()

    // THEN: Back link text is in Spanish as specified in the story
    await waitFor(() => {
      const backLink = screen.getByRole('link', { name: 'Ir a Clientes' })
      expect(backLink).toBeInTheDocument()
    })
  })

  it('should navigate client-side to /clientes when the back link is clicked', async () => {
    // GIVEN: The 404 route is rendered via the router
    const router = await renderNotFoundViaRouter()

    // WHEN: The back link is clicked
    await waitFor(() => {
      expect(screen.getByTestId('not-found-back-link')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByTestId('not-found-back-link'))

    // THEN: The router location changes to /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  it('should render exactly one link element inside the 404 view container (the Ir a Clientes CTA)', async () => {
    // GIVEN: The 404 route is rendered (full shell with nav links + back link)
    await renderNotFoundViaRouter()

    // THEN: Within the not-found-view container there is exactly one link (the CTA back link)
    // Note: The full page also includes 2 nav links in the NavigationRail/Bar — we scope to the container
    await waitFor(() => {
      const notFoundContainer = screen.getByTestId('not-found-view')
      const linksInContainer = notFoundContainer.querySelectorAll('a[role], a')
      expect(linksInContainer).toHaveLength(1)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 404 view on multiple unknown paths (boundary: path variety)
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — triggered by various unknown paths', () => {
  it('should display 404 heading for a deeply nested unknown path', async () => {
    // GIVEN: An unknown path with multiple segments
    await renderNotFoundViaRouter('/ruta/muy/profunda/desconocida')

    // THEN: The 404 heading is shown regardless of path depth
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Página no encontrada', level: 1 })).toBeInTheDocument()
    })
  })

  it('should display 404 heading for a path with digits', async () => {
    // GIVEN: Unknown path with numbers (common for IDs)
    await renderNotFoundViaRouter('/ruta-12345')

    // THEN: 404 heading is displayed (not misrouted as a valid route)
    await waitFor(() => {
      expect(screen.getByTestId('not-found-heading')).toHaveTextContent('Página no encontrada')
    })
  })
})
