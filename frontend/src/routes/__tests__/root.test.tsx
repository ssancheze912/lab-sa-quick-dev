/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — __root.tsx
 *
 * AC1, AC4 — Navigation shell renders with correct components per viewport
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('__root.tsx — Root layout shell', () => {
  it('should render the root layout without crashing on /clientes', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    const { container } = render(<RouterProvider router={router} />)

    expect(container.firstChild).not.toBeNull()
  })

  it('should render the NavigationRail data-testid element at desktop viewport', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const navRail = screen.queryByTestId('navigation-rail')
    expect(navRail).not.toBeNull()
  })

  it('should render the NavigationBar data-testid element (hidden at desktop, present in DOM)', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    const navBar = screen.queryByTestId('navigation-bar')
    expect(navBar).not.toBeNull()
  })

  it('should render the Navbar with product name "Siesa Agents"', async () => {
    const router = createTestRouter('/clientes')
    await router.load()

    render(<RouterProvider router={router} />)

    expect(screen.getByText('Siesa Agents')).toBeInTheDocument()
  })
})
