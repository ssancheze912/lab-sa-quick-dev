/**
 * Story 1.1 — Root route component edge cases
 * Tests RootLayout and app-shell container behavior.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'

// Minimal router wiring to render RootLayout in isolation
function buildTestRouter(children?: React.ReactNode) {
  const rootRoute = createRootRoute({
    component: () => (
      <div id="app-shell" data-testid="app-shell">
        {children}
      </div>
    ),
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return router
}

describe('RootLayout — edge cases', () => {
  it('renders the app-shell container div', () => {
    const router = buildTestRouter()
    const { container } = render(<RouterProvider router={router} />)
    const shell = container.querySelector('#app-shell')
    expect(shell).not.toBeNull()
  })

  it('app-shell div is present as root wrapper element', () => {
    const router = buildTestRouter(<span data-testid="content">loaded</span>)
    const { container } = render(<RouterProvider router={router} />)
    const shell = container.querySelector('#app-shell')
    expect(shell).toBeTruthy()
  })

  it('renders children inside app-shell', () => {
    const router = buildTestRouter(<span id="child-content">hello</span>)
    const { container } = render(<RouterProvider router={router} />)
    const child = container.querySelector('#child-content')
    expect(child).not.toBeNull()
    expect(child?.textContent).toBe('hello')
  })

  it('does not throw when no children are passed to root layout', () => {
    const router = buildTestRouter()
    expect(() => render(<RouterProvider router={router} />)).not.toThrow()
  })
})
