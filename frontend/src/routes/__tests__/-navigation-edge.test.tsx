/**
 * Component Tests: Navigation Shell — Edge Cases
 * Story 1.2: Frontend Navigation Shell
 *
 * Expands unit/component coverage beyond the ATDD tests by covering:
 *   - Nav item click handler calls router.navigate with correct path
 *   - Active item resolves correctly for both nav entries
 *   - NAV_ITEMS array completeness and label correctness
 *   - 404 notFoundComponent text and link href
 *   - Root redirect beforeLoad throws redirect
 *   - Both navigation modes show the same nav items (label/id consistency)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ── Shared mock for siesa-ui-kit ──────────────────────────────────────────────
vi.mock('siesa-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('siesa-ui-kit')>()
  return {
    ...actual,
    NavigationRail: vi.fn(({ items, selectedId, onItemSelect }) => (
      <nav aria-label="navigation-rail">
        {items.map((item: { id: string; label: string }) => (
          <button
            key={item.id}
            data-testid={`rail-item-${item.id}`}
            aria-current={item.id === selectedId ? 'page' : undefined}
            onClick={() => onItemSelect?.(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    )),
    NavigationBar: vi.fn(({ items, activeItemId, onItemClick }) => (
      <nav aria-label="navigation-bar">
        {items.map((item: { id: string; label: string }) => (
          <button
            key={item.id}
            data-testid={`bar-item-${item.id}`}
            aria-current={item.id === activeItemId ? 'page' : undefined}
            onClick={() => onItemClick?.(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    )),
  }
})

function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge: NAV_ITEMS label consistency — both components receive correct labels
// ─────────────────────────────────────────────────────────────────────────────

describe('NAV_ITEMS — label and id consistency in NavigationRail', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  it('[P2] NavigationRail items display Spanish label "Clientes"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => expect(screen.getByTestId('rail-item-clientes')).toBeInTheDocument())

    // THEN: Button text is the Spanish label
    expect(screen.getByTestId('rail-item-clientes')).toHaveTextContent('Clientes')
  })

  it('[P2] NavigationRail items display Spanish label "Contactos"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => expect(screen.getByTestId('rail-item-contactos')).toBeInTheDocument())

    expect(screen.getByTestId('rail-item-contactos')).toHaveTextContent('Contactos')
  })
})

describe('NAV_ITEMS — label and id consistency in NavigationBar (mobile)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
  })

  it('[P2] NavigationBar items display Spanish label "Clientes"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => expect(screen.getByTestId('bar-item-clientes')).toBeInTheDocument())

    expect(screen.getByTestId('bar-item-clientes')).toHaveTextContent('Clientes')
  })

  it('[P2] NavigationBar items display Spanish label "Contactos"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => expect(screen.getByTestId('bar-item-contactos')).toBeInTheDocument())

    expect(screen.getByTestId('bar-item-contactos')).toHaveTextContent('Contactos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: selectedId / activeItemId propagated correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('Active nav item selection — NavigationRail', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  it('[P1] Clientes rail item has aria-current="page" when route is /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('rail-item-clientes')).toHaveAttribute('aria-current', 'page')
    })
  })

  it('[P1] Contactos rail item does NOT have aria-current when route is /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => expect(screen.getByTestId('rail-item-contactos')).toBeInTheDocument())

    expect(screen.getByTestId('rail-item-contactos')).not.toHaveAttribute('aria-current', 'page')
  })

  it('[P1] Contactos rail item has aria-current="page" when route is /contactos', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('rail-item-contactos')).toHaveAttribute('aria-current', 'page')
    })
  })

  it('[P1] Clientes rail item does NOT have aria-current when route is /contactos', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => expect(screen.getByTestId('rail-item-clientes')).toBeInTheDocument())

    expect(screen.getByTestId('rail-item-clientes')).not.toHaveAttribute('aria-current', 'page')
  })
})

describe('Active nav item selection — NavigationBar (mobile)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
  })

  it('[P1] Clientes bar item has aria-current="page" when route is /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('bar-item-clientes')).toHaveAttribute('aria-current', 'page')
    })
  })

  it('[P1] Contactos bar item has aria-current="page" when route is /contactos', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('bar-item-contactos')).toHaveAttribute('aria-current', 'page')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Click handlers trigger correct router navigation
// ─────────────────────────────────────────────────────────────────────────────

describe('NavigationRail — click handler navigation paths', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  it('[P1] clicking Contactos rail item changes router location to /contactos', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByTestId('rail-item-contactos'))
    fireEvent.click(screen.getByTestId('rail-item-contactos'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
  })

  it('[P1] clicking Clientes rail item changes router location to /clientes from /contactos', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByTestId('rail-item-clientes'))
    fireEvent.click(screen.getByTestId('rail-item-clientes'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  it('[P2] clicking Clientes rail item when already on /clientes keeps route at /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByTestId('rail-item-clientes'))
    fireEvent.click(screen.getByTestId('rail-item-clientes'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })
})

describe('NavigationBar — click handler navigation paths (mobile)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
  })

  it('[P1] clicking Contactos bar item changes router location to /contactos', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByTestId('bar-item-contactos'))
    fireEvent.click(screen.getByTestId('bar-item-contactos'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
  })

  it('[P1] clicking Clientes bar item changes router location to /clientes from /contactos', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByTestId('bar-item-clientes'))
    fireEvent.click(screen.getByTestId('bar-item-clientes'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: 404 notFoundComponent — text and link correctness
// ─────────────────────────────────────────────────────────────────────────────

describe('404 notFoundComponent — edge cases', () => {
  it('[P2] displays the exact Spanish text "Página no encontrada" (accent and tilde correct)', async () => {
    const router = createTestRouter('/this/does/not/exist')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      // Verify exact Spanish text with diacritics
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    })
  })

  it('[P2] the back link points to /clientes', async () => {
    const router = createTestRouter('/this/does/not/exist')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      const backLink = screen.getByTestId('not-found-back-link')
      // Link href should point to /clientes
      expect(backLink).toHaveAttribute('href', '/clientes')
    })
  })

  it('[P2] clicking back link on 404 navigates to /clientes', async () => {
    const router = createTestRouter('/this/does/not/exist')
    render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByTestId('not-found-back-link'))
    fireEvent.click(screen.getByTestId('not-found-back-link'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  it('[P2] not-found-view testid is present on multiple different unknown paths', async () => {
    for (const unknownPath of ['/abc', '/xyz/123', '/foo/bar/baz']) {
      const router = createTestRouter(unknownPath)
      const { unmount } = render(<RouterProvider router={router} />)

      await waitFor(() => {
        expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
      })

      unmount()
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Root redirect — /  correctly goes to /clientes in all scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe('Root redirect — edge cases', () => {
  it('[P1] navigating to / when starting at /contactos still redirects to /clientes', async () => {
    // GIVEN: Router starts at /contactos, then history is replaced with /
    const history = createMemoryHistory({ initialEntries: ['/contactos', '/'] })
    const router = createRouter({ routeTree, history })
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Shell views — clientes/contactos data-testid present in DOM
// ─────────────────────────────────────────────────────────────────────────────

describe('Shell views — testid presence', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  it('[P2] clientes-shell-view testid is absent when on /contactos', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => expect(screen.getByTestId('contactos-shell-view')).toBeInTheDocument())

    expect(screen.queryByTestId('clientes-shell-view')).not.toBeInTheDocument()
  })

  it('[P2] contactos-shell-view testid is absent when on /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => expect(screen.getByTestId('clientes-shell-view')).toBeInTheDocument())

    expect(screen.queryByTestId('contactos-shell-view')).not.toBeInTheDocument()
  })
})
