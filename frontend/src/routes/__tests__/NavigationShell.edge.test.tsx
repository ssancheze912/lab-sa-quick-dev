/**
 * NavigationShell — Edge Cases & Boundary Conditions
 * Story 1.2: Frontend Navigation Shell
 *
 * Covers scenarios NOT in the ATDD happy-path spec:
 * - Keyboard interaction (Enter/Space key on nav items)
 * - Active state mutual exclusivity during rapid route switching
 * - Structural / accessibility semantics (landmarks, sr-only labels, ARIA roles)
 * - `app-root` container presence
 * - Page-level landmark verification (main role)
 * - 404 back link → correct active state restoration
 * - Router isolation between test cases
 * - navItems count (exactly 2 items in rail and bar)
 * - Navbar does NOT contain nav item links (separation of concerns)
 * - Placeholder pages have h1 heading in Spanish
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRouter, RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// Mock siesa-ui-kit Navbar to avoid CSS/DOM issues in jsdom
vi.mock('siesa-ui-kit', () => ({
  Navbar: ({ productName }: { productName?: string }) => (
    <header data-testid="navbar-inner" role="banner">
      <span>{productName}</span>
    </header>
  ),
}))

function createTestRouter(initialPath: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history: memoryHistory })
}

// ────────────────────────────────────────────────────────────────────────────
// EDGE: Structural & Semantic Landmarks
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — Structural & Semantic Landmarks', () => {
  it('Given app loads, When layout renders, Then app-root data-testid container exists', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('app-root')).toBeInTheDocument()
    })
  })

  it('Given app loads at /clientes, When layout renders, Then NavigationRail has role="navigation"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const rail = screen.getByTestId('navigation-rail')
      expect(rail).toHaveAttribute('role', 'navigation')
    })
  })

  it('Given app loads at /clientes, When layout renders, Then NavigationRail has aria-label in Spanish', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const rail = screen.getByTestId('navigation-rail')
      expect(rail).toHaveAttribute('aria-label', 'Navegación principal')
    })
  })

  it('Given app loads at /clientes, When layout renders, Then NavigationBar has role="navigation"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const bar = screen.getByTestId('nav-bottom-bar')
      expect(bar).toHaveAttribute('role', 'navigation')
    })
  })

  it('Given app loads at /clientes, When layout renders, Then NavigationBar has aria-label in Spanish', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const bar = screen.getByTestId('nav-bottom-bar')
      expect(bar).toHaveAttribute('aria-label', 'Navegación móvil')
    })
  })

  it('Given app loads at /clientes, When layout renders, Then Clientes page has role="main"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const main = screen.getByTestId('clientes-page')
      expect(main).toHaveAttribute('role', 'main')
    })
  })

  it('Given app loads at /contactos, When layout renders, Then Contactos page has role="main"', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const main = screen.getByTestId('contactos-page')
      expect(main).toHaveAttribute('role', 'main')
    })
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EDGE: Nav item counts (exactly 2 items in rail and in bar)
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — Nav item counts in rail and bar', () => {
  it('Given app loads at /clientes, When rail renders, Then NavigationRail contains exactly 2 nav items', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const rail = screen.getByTestId('navigation-rail')
      const items = within(rail).getAllByRole('link')
      expect(items).toHaveLength(2)
    })
  })

  it('Given app loads at /clientes, When bar renders, Then NavigationBar contains exactly 2 nav items', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const bar = screen.getByTestId('nav-bottom-bar')
      const items = within(bar).getAllByRole('link')
      expect(items).toHaveLength(2)
    })
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EDGE: Nav items have sr-only text for screen readers
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — Screen-reader text on navigation rail items', () => {
  it('Given desktop NavigationRail renders, When user examines Clientes item, Then it contains visible text or sr-only text "Clientes"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const rail = screen.getByTestId('navigation-rail')
      // sr-only span with "Clientes" or visible label
      const clientesItem = within(rail).getByTestId('nav-item-clientes')
      expect(clientesItem.textContent).toContain('Clientes')
    })
  })

  it('Given desktop NavigationRail renders, When user examines Contactos item, Then it contains visible text or sr-only text "Contactos"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const rail = screen.getByTestId('navigation-rail')
      const contactosItem = within(rail).getByTestId('nav-item-contactos')
      expect(contactosItem.textContent).toContain('Contactos')
    })
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EDGE: Keyboard navigation (Enter key activates nav links)
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — Keyboard activation of nav items', () => {
  it('Given user focuses Contactos nav item, When Enter key is pressed, Then URL changes to /contactos', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getAllByTestId('nav-item-contactos').length).toBeGreaterThan(0)
    })
    // Focus and activate via keyboard
    const contactosLinks = screen.getAllByTestId('nav-item-contactos')
    contactosLinks[0].focus()
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(screen.getByTestId('contactos-page')).toBeInTheDocument()
    })
  })

  it('Given user focuses Clientes nav item on /contactos, When Enter key is pressed, Then URL changes to /clientes', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getAllByTestId('nav-item-clientes').length).toBeGreaterThan(0)
    })
    const clientesLinks = screen.getAllByTestId('nav-item-clientes')
    clientesLinks[0].focus()
    await user.keyboard('{Enter}')
    await waitFor(() => {
      expect(screen.getByTestId('clientes-page')).toBeInTheDocument()
    })
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EDGE: Active state mutual exclusivity (only ONE item active at a time)
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — Active state mutual exclusivity', () => {
  it('Given user is at /clientes, When nav renders, Then exactly one item across rail+bar has aria-current="page" per nav context', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      // In the rail (hidden by CSS but present in DOM)
      const rail = screen.getByTestId('navigation-rail')
      const activeRailItems = within(rail).queryAllByRole('link')
        .filter(el => el.getAttribute('aria-current') === 'page')
      expect(activeRailItems).toHaveLength(1)
    })
  })

  it('Given user is at /contactos, When nav renders, Then exactly one item in NavigationBar has aria-current="page"', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const bar = screen.getByTestId('nav-bottom-bar')
      const activeBarItems = within(bar).queryAllByRole('link')
        .filter(el => el.getAttribute('aria-current') === 'page')
      expect(activeBarItems).toHaveLength(1)
    })
  })

  it('Given user navigates Clientes → Contactos → Clientes, When each navigation completes, Then active state is correct at each step', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // Step 1: at /clientes — Clientes should be active
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.some(el => el.getAttribute('aria-current') === 'page')).toBe(true)
    })

    // Step 2: navigate to /contactos
    await user.click(screen.getAllByTestId('nav-item-contactos')[0])
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      expect(contactosItems.some(el => el.getAttribute('aria-current') === 'page')).toBe(true)
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.every(el => el.getAttribute('aria-current') !== 'page')).toBe(true)
    })

    // Step 3: navigate back to /clientes
    await user.click(screen.getAllByTestId('nav-item-clientes')[0])
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.some(el => el.getAttribute('aria-current') === 'page')).toBe(true)
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      expect(contactosItems.every(el => el.getAttribute('aria-current') !== 'page')).toBe(true)
    })
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EDGE: 404 back link restores correct active state
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — 404 back link restores navigation state', () => {
  it('Given user is on 404 page and clicks "Volver a Clientes", When navigation completes, Then Clientes item is active', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/ruta-inexistente')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
    })

    await user.click(screen.getByTestId('not-found-back-link'))

    await waitFor(() => {
      expect(screen.getByTestId('clientes-page')).toBeInTheDocument()
    })

    // Active state should be restored after navigation from 404
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.some(el => el.getAttribute('aria-current') === 'page')).toBe(true)
    })
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EDGE: ARIA labels on nav items are correct per spec
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — ARIA labels on navigation items', () => {
  it('Given desktop rail renders, When Clientes item is inspected, Then aria-label is "Ir a Clientes"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const rail = screen.getByTestId('navigation-rail')
      const clientesItem = within(rail).getByTestId('nav-item-clientes')
      expect(clientesItem).toHaveAttribute('aria-label', 'Ir a Clientes')
    })
  })

  it('Given desktop rail renders, When Contactos item is inspected, Then aria-label is "Ir a Contactos"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const rail = screen.getByTestId('navigation-rail')
      const contactosItem = within(rail).getByTestId('nav-item-contactos')
      expect(contactosItem).toHaveAttribute('aria-label', 'Ir a Contactos')
    })
  })

  it('Given mobile bar renders, When Clientes item is inspected, Then aria-label is "Ir a Clientes"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const bar = screen.getByTestId('nav-bottom-bar')
      const clientesItem = within(bar).getByTestId('nav-item-clientes')
      expect(clientesItem).toHaveAttribute('aria-label', 'Ir a Clientes')
    })
  })

  it('Given mobile bar renders, When Contactos item is inspected, Then aria-label is "Ir a Contactos"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const bar = screen.getByTestId('nav-bottom-bar')
      const contactosItem = within(bar).getByTestId('nav-item-contactos')
      expect(contactosItem).toHaveAttribute('aria-label', 'Ir a Contactos')
    })
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EDGE: Placeholder page content (heading in Spanish)
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — Placeholder page headings', () => {
  it('Given /clientes loads, When page renders, Then h1 heading "Clientes" is present', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Clientes', level: 1 })).toBeInTheDocument()
    })
  })

  it('Given /contactos loads, When page renders, Then h1 heading "Contactos" is present', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Contactos', level: 1 })).toBeInTheDocument()
    })
  })

  it('Given /clientes loads, When page renders, Then Clientes page has correct aria-label', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const page = screen.getByTestId('clientes-page')
      expect(page).toHaveAttribute('aria-label', 'Clientes')
    })
  })

  it('Given /contactos loads, When page renders, Then Contactos page has correct aria-label', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const page = screen.getByTestId('contactos-page')
      expect(page).toHaveAttribute('aria-label', 'Contactos')
    })
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EDGE: 404 page role and aria-label
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — 404 page semantic structure', () => {
  it('Given unknown route /anything-else, When 404 renders, Then not-found page has role="main"', async () => {
    const router = createTestRouter('/anything-else')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const notFound = screen.getByTestId('not-found-page')
      expect(notFound).toHaveAttribute('role', 'main')
    })
  })

  it('Given unknown route, When 404 renders, Then not-found page has aria-label "Página no encontrada"', async () => {
    const router = createTestRouter('/anything-else')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const notFound = screen.getByTestId('not-found-page')
      expect(notFound).toHaveAttribute('aria-label', 'Página no encontrada')
    })
  })

  it('Given unknown route with deeply nested path, When 404 renders, Then not-found component is shown', async () => {
    const router = createTestRouter('/very/deep/nested/unknown/path')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
    })
  })

  it('Given unknown route /clientes-extended (partial match), When page loads, Then 404 is shown (not ClientesPage)', async () => {
    const router = createTestRouter('/clientes-extended')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
    })
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EDGE: Navbar separation of concerns — does NOT render nav links
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — Navbar does not contain nav item links', () => {
  it('Given app loads, When Navbar renders, Then the navbar wrapper does NOT contain nav-item-clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const navbar = screen.getByTestId('navbar')
      expect(within(navbar).queryByTestId('nav-item-clientes')).not.toBeInTheDocument()
    })
  })

  it('Given app loads, When Navbar renders, Then the navbar wrapper does NOT contain nav-item-contactos', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const navbar = screen.getByTestId('navbar')
      expect(within(navbar).queryByTestId('nav-item-contactos')).not.toBeInTheDocument()
    })
  })
})

// ────────────────────────────────────────────────────────────────────────────
// EDGE: Router isolation — fresh router per test does not bleed state
// ────────────────────────────────────────────────────────────────────────────
describe('EDGE — Router state isolation', () => {
  it('Given two independent test routers starting at /contactos and /clientes, When both render, Then each shows correct page', async () => {
    const routerA = createTestRouter('/contactos')
    const routerB = createTestRouter('/clientes')

    const { unmount } = render(<RouterProvider router={routerA} />)
    await waitFor(() => {
      expect(screen.getByTestId('contactos-page')).toBeInTheDocument()
    })
    unmount()

    render(<RouterProvider router={routerB} />)
    await waitFor(() => {
      expect(screen.getByTestId('clientes-page')).toBeInTheDocument()
    })
  })
})
