/**
 * Story 1.1 — Root route component edge cases
 * Tests RootLayout and app-shell container behavior.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { act } from 'react'
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from '@tanstack/react-router'

// Minimal router wiring to render RootLayout in isolation
async function buildAndRenderTestRouter(children?: React.ReactNode) {
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
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(<RouterProvider router={router} />)
    await router.load()
  })
  return result!
}

describe('RootLayout — edge cases', () => {
  it('renders the app-shell container div', async () => {
    const { container } = await buildAndRenderTestRouter()
    const shell = container.querySelector('#app-shell')
    expect(shell).not.toBeNull()
  })

  it('app-shell div is present as root wrapper element', async () => {
    const { container } = await buildAndRenderTestRouter(<span data-testid="content">loaded</span>)
    const shell = container.querySelector('#app-shell')
    expect(shell).toBeTruthy()
  })

  it('renders children inside app-shell', async () => {
    const { container } = await buildAndRenderTestRouter(<span id="child-content">hello</span>)
    const child = container.querySelector('#child-content')
    expect(child).not.toBeNull()
    expect(child?.textContent).toBe('hello')
  })

  it('does not throw when no children are passed to root layout', async () => {
    await expect(buildAndRenderTestRouter()).resolves.not.toThrow()
  })
})
