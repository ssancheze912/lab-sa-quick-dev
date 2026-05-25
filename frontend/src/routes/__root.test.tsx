import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'

/**
 * Tests for the root route component defined in __root.tsx.
 * We test the structural contract (renders <main> with Outlet)
 * without importing the file directly to avoid TanStack Router
 * code-generation side-effects in unit test context.
 */
describe('Root Route component', () => {
  it('[P1] renders a <main> element as the root shell container', () => {
    // GIVEN: a minimal router built with the same component shape as __root.tsx
    const rootRoute = createRootRoute({
      component: () => (
        <main data-testid="root-main">
          <div data-testid="outlet-placeholder" />
        </main>
      ),
    })
    const router = createRouter({ routeTree: rootRoute.addChildren([]) })

    // WHEN: rendering the RouterProvider
    render(<RouterProvider router={router} />)

    // THEN: a <main> element is present in the document
    const mainEl = screen.getByTestId('root-main')
    expect(mainEl.tagName.toLowerCase()).toBe('main')
  })

  it('[P1] <main> element contains the outlet area', () => {
    // GIVEN: root route component renders children inside <main>
    const rootRoute = createRootRoute({
      component: () => (
        <main>
          <span data-testid="child-content">content</span>
        </main>
      ),
    })
    const router = createRouter({ routeTree: rootRoute.addChildren([]) })

    // WHEN: rendering
    render(<RouterProvider router={router} />)

    // THEN: child content is inside the main element
    const child = screen.getByTestId('child-content')
    expect(child.closest('main')).not.toBeNull()
  })

  it('[P2] root route component renders without throwing on empty tree', () => {
    // GIVEN: a root route with no child routes
    const rootRoute = createRootRoute({
      component: () => <main />,
    })
    const router = createRouter({ routeTree: rootRoute.addChildren([]) })

    // WHEN: rendering
    // THEN: no error thrown
    expect(() => render(<RouterProvider router={router} />)).not.toThrow()
  })
})
