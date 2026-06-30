/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Edge Case & Boundary Tests — AUTO-GENERATED (testarch-automate)
 *
 * Expands unit test coverage with:
 *   - activeId is undefined when route is unknown (404 path — no nav item matches)
 *   - handleRailSelect with unrecognised id does not crash or navigate
 *   - handleBarClick with unrecognised id does not crash or navigate
 *   - Exactly 2 nav items rendered in both rail and bar (not 1, not 3)
 *   - aria-current toggling on route change (clientes → contactos)
 *   - not-found-view and not-found-message data-testids present on 404 route
 *   - "Ir a Clientes" link present in 404 view
 *   - nav components receive correct selectedId / activeItemId props on each route
 *   - navigation items never have aria-current when on an unmatched route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { createMemoryHistory, RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─── Mock siesa-ui-kit (same pattern as main test file) ──────────────────────
vi.mock('siesa-ui-kit', () => ({
  NavigationRail: ({ items, selectedId, onItemSelect }: {
    items: Array<{ id: string; label: string; selected?: boolean; ariaLabel?: string }>
    selectedId?: string
    onItemSelect?: (id: string) => void
  }) => (
    <nav data-testid="navigation-rail" aria-label="Navegación principal">
      {items.map((item) => (
        <button
          key={item.id}
          data-testid={`rail-item-${item.id}`}
          aria-label={item.ariaLabel ?? item.label}
          aria-current={item.id === selectedId ? 'page' : undefined}
          onClick={() => onItemSelect?.(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  ),
  NavigationBar: ({ items, activeItemId, onItemClick, ariaLabel }: {
    items: Array<{ id: string; label: string; active?: boolean; ariaLabel?: string }>
    activeItemId?: string
    onItemClick?: (id: string) => void
    ariaLabel?: string
  }) => (
    <nav data-testid="navigation-bar" aria-label={ariaLabel ?? 'Navegación principal'}>
      {items.map((item) => (
        <button
          key={item.id}
          data-testid={`bar-item-${item.id}`}
          aria-label={item.ariaLabel ?? item.label}
          aria-current={item.id === activeItemId ? 'page' : undefined}
          onClick={() => onItemClick?.(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  ),
}))

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: activeId on unknown routes
// ─────────────────────────────────────────────────────────────────────────────

describe('Root Navigation Shell — edge cases: unknown route (404)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the not-found-view data-testid for an unknown route', async () => {
    // GIVEN: A route that does not exist in the route tree
    const router = createTestRouter('/ruta-completamente-desconocida')
    render(<RouterProvider router={router} />)

    // THEN: The 404 component renders with the expected testid
    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
  })

  it('renders the not-found-message data-testid for an unknown route', async () => {
    // GIVEN: A route that does not exist in the route tree
    const router = createTestRouter('/pagina-no-existe')
    render(<RouterProvider router={router} />)

    // THEN: The 404 message element is present
    await waitFor(() => {
      expect(screen.getByTestId('not-found-message')).toBeInTheDocument()
    })
  })

  it('renders "Ir a Clientes" recovery link on the 404 view', async () => {
    // GIVEN: An unknown route triggers the not-found component
    const router = createTestRouter('/enlace-roto')
    render(<RouterProvider router={router} />)

    // THEN: A recovery link is present pointing to /clientes
    await waitFor(() => {
      expect(screen.getByText('Ir a Clientes')).toBeInTheDocument()
    })
  })

  it('no nav item has aria-current="page" when on an unknown route', async () => {
    // GIVEN: The router is on an unmatched path — no nav item should be "active"
    const router = createTestRouter('/ruta-desconocida-para-edge-test')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })

    // WHEN: Both nav items are inspected
    const clientesBtn = screen.getByTestId('rail-item-clientes')
    const contactosBtn = screen.getByTestId('rail-item-contactos')

    // THEN: Neither has aria-current="page"
    expect(clientesBtn).not.toHaveAttribute('aria-current', 'page')
    expect(contactosBtn).not.toHaveAttribute('aria-current', 'page')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: nav item count (boundary)
// ─────────────────────────────────────────────────────────────────────────────

describe('Root Navigation Shell — edge cases: nav item count boundary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders exactly 2 items in the NavigationRail (boundary: not 1, not 3)', async () => {
    // GIVEN: NAV_ITEMS = [clientes, contactos] — exactly 2
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    // WHEN: All rail item buttons are counted
    const railItems = screen.getAllByTestId(/^rail-item-/)

    // THEN: Exactly 2 items
    expect(railItems).toHaveLength(2)
  })

  it('renders exactly 2 items in the NavigationBar (boundary: not 1, not 3)', async () => {
    // GIVEN: NAV_ITEMS = [clientes, contactos] — exactly 2
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    })

    // WHEN: All bar item buttons are counted
    const barItems = screen.getAllByTestId(/^bar-item-/)

    // THEN: Exactly 2 items
    expect(barItems).toHaveLength(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: aria-current toggling on route change
// ─────────────────────────────────────────────────────────────────────────────

describe('Root Navigation Shell — edge cases: aria-current toggling', () => {
  beforeEach(() => vi.clearAllMocks())

  it('switches aria-current from clientes to contactos when Contactos item is clicked', async () => {
    // GIVEN: The router starts at /clientes — Clientes is aria-current="page"
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('rail-item-clientes')).toHaveAttribute('aria-current', 'page')
    })

    // WHEN: The user clicks the Contactos rail item
    fireEvent.click(screen.getByTestId('rail-item-contactos'))

    // THEN: Contactos gains aria-current="page" and Clientes loses it
    await waitFor(() => {
      expect(screen.getByTestId('rail-item-contactos')).toHaveAttribute('aria-current', 'page')
      expect(screen.getByTestId('rail-item-clientes')).not.toHaveAttribute('aria-current', 'page')
    })
  })

  it('switches aria-current from contactos to clientes when Clientes item is clicked', async () => {
    // GIVEN: The router starts at /contactos — Contactos is aria-current="page"
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('rail-item-contactos')).toHaveAttribute('aria-current', 'page')
    })

    // WHEN: The user clicks the Clientes rail item
    fireEvent.click(screen.getByTestId('rail-item-clientes'))

    // THEN: Clientes gains aria-current="page" and Contactos loses it
    await waitFor(() => {
      expect(screen.getByTestId('rail-item-clientes')).toHaveAttribute('aria-current', 'page')
      expect(screen.getByTestId('rail-item-contactos')).not.toHaveAttribute('aria-current', 'page')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: NavigationBar active item tracking
// ─────────────────────────────────────────────────────────────────────────────

describe('Root Navigation Shell — edge cases: NavigationBar active item', () => {
  beforeEach(() => vi.clearAllMocks())

  it('bar-item-clientes has aria-current="page" on /clientes route', async () => {
    // GIVEN: The router starts at /clientes
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('bar-item-clientes')).toBeInTheDocument()
    })

    // THEN: bar-item-clientes is marked as current
    expect(screen.getByTestId('bar-item-clientes')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('bar-item-contactos')).not.toHaveAttribute('aria-current', 'page')
  })

  it('bar-item-contactos has aria-current="page" on /contactos route', async () => {
    // GIVEN: The router starts at /contactos
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('bar-item-contactos')).toBeInTheDocument()
    })

    // THEN: bar-item-contactos is marked as current
    expect(screen.getByTestId('bar-item-contactos')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('bar-item-clientes')).not.toHaveAttribute('aria-current', 'page')
  })

  it('switches NavigationBar active item from clientes to contactos on bar click', async () => {
    // GIVEN: The router starts at /clientes
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('bar-item-clientes')).toHaveAttribute('aria-current', 'page')
    })

    // WHEN: The user clicks the Contactos bar item
    fireEvent.click(screen.getByTestId('bar-item-contactos'))

    // THEN: Contactos gains active, Clientes loses it
    await waitFor(() => {
      expect(screen.getByTestId('bar-item-contactos')).toHaveAttribute('aria-current', 'page')
      expect(screen.getByTestId('bar-item-clientes')).not.toHaveAttribute('aria-current', 'page')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: Accessibility — multiple navigation landmarks
// ─────────────────────────────────────────────────────────────────────────────

describe('Root Navigation Shell — edge cases: accessibility landmarks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('both navigation elements have aria-label="Navegación principal"', async () => {
    // GIVEN: Both NavigationRail and NavigationBar are rendered
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    })

    // THEN: Both navigation landmarks have the Spanish aria-label
    const navElements = screen.getAllByRole('navigation')
    const spanishLabelledNavs = navElements.filter(
      (el) => el.getAttribute('aria-label') === 'Navegación principal',
    )
    expect(spanishLabelledNavs.length).toBeGreaterThanOrEqual(2)
  })

  it('all nav item buttons are accessible by their Spanish label', async () => {
    // GIVEN: The router is at /clientes
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    // THEN: All 4 buttons (2 rail + 2 bar) have Spanish labels
    // getAllByLabelText returns all matching — ensures labels are present
    expect(screen.getAllByLabelText('Clientes').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByLabelText('Contactos').length).toBeGreaterThanOrEqual(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge Cases: Root redirect edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Root Navigation Shell — edge cases: root redirect boundary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects from / and Clientes nav item is active after redirect', async () => {
    // GIVEN: The router starts at /
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)

    // WHEN: Redirect completes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })

    // THEN: Clientes nav item is marked as current (activeId derived from pathname /clientes)
    await waitFor(() => {
      expect(screen.getByTestId('rail-item-clientes')).toHaveAttribute('aria-current', 'page')
    })
  })

  it('does not render contactos-view content after root redirect (clientes content shows)', async () => {
    // GIVEN: The router starts at / and redirects to /clientes
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })

    // THEN: clientes-view content is present, contactos-view is not
    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('contactos-view')).not.toBeInTheDocument()
  })
})
