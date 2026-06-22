import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'vitest-axe'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// Mock siesa-ui-kit navigation components to keep tests isolated
vi.mock('siesa-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('siesa-ui-kit')>()
  return {
    ...actual,
    NavigationRail: vi.fn(({ items, selectedId, onItemSelect }) => (
      // data-testid="navigation-rail" is on the wrapper div in _app.tsx
      <nav aria-label="navigation-rail">
        {items.map(
          (item: { id: string; label: string; selected?: boolean }) => (
            <button
              key={item.id}
              data-testid={`rail-item-${item.id}`}
              aria-current={item.id === selectedId ? 'page' : undefined}
              onClick={() => onItemSelect?.(item.id)}
            >
              {item.label}
            </button>
          ),
        )}
      </nav>
    )),
    NavigationBar: vi.fn(({ items, activeItemId, onItemClick }) => (
      // data-testid="navigation-bar" is on the wrapper div in _app.tsx
      <nav aria-label="navigation-bar">
        {items.map(
          (item: { id: string; label: string; active?: boolean }) => (
            <button
              key={item.id}
              data-testid={`bar-item-${item.id}`}
              aria-current={item.id === activeItemId ? 'page' : undefined}
              onClick={() => onItemClick?.(item.id)}
            >
              {item.label}
            </button>
          ),
        )}
      </nav>
    )),
  }
})

function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history })
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1: NavigationRail wrapper is rendered in DOM (desktop testid)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail wrapper testid present in DOM', () => {
  it('navigation-rail wrapper is in the document at /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC4: NavigationBar wrapper is rendered in DOM (mobile testid)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — NavigationBar wrapper testid present in DOM', () => {
  it('navigation-bar wrapper is in the document at /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5/AC6: nav-item testids with data-active attribute
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5/AC6 — nav-item testids present with data-active', () => {
  it('nav-item-clientes has data-active="true" on /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    // nav-item-clientes is inside navigation-rail (desktop), find all and check one is active
    await waitFor(() => {
      const navItems = screen.getAllByTestId('nav-item-clientes')
      const activeItem = navItems.find((el) => el.getAttribute('data-active') === 'true')
      expect(activeItem).toBeDefined()
    })
  })

  it('nav-item-contactos has data-active="true" on /contactos', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      const navItems = screen.getAllByTestId('nav-item-contactos')
      const activeItem = navItems.find((el) => el.getAttribute('data-active') === 'true')
      expect(activeItem).toBeDefined()
    })
  })

  it('nav-item-clientes is present in DOM', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getAllByTestId('nav-item-clientes').length).toBeGreaterThan(0)
    })
  })

  it('nav-item-contactos is present in DOM', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getAllByTestId('nav-item-contactos').length).toBeGreaterThan(0)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC5/AC6: Shell view testids
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — clientes-shell-view testid on /clientes', () => {
  it('renders clientes-shell-view at /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('clientes-shell-view')).toBeInTheDocument()
    })
  })
})

describe('AC6 — contactos-shell-view testid on /contactos', () => {
  it('renders contactos-shell-view at /contactos', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('contactos-shell-view')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC7: 404 view testids
// ─────────────────────────────────────────────────────────────────────────────

describe('AC7 — not-found-view and not-found-back-link on unknown route', () => {
  it('renders not-found-view for unknown route', async () => {
    const router = createTestRouter('/unknown-path-xyz')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
    })
  })

  it('renders not-found-back-link for unknown route', async () => {
    const router = createTestRouter('/unknown-path-xyz')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('not-found-back-link')).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC8: Root redirect
// ─────────────────────────────────────────────────────────────────────────────

describe('AC8 — Root path / redirects to /clientes', () => {
  it('redirects from / to /clientes', async () => {
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — WCAG 2.1 AA on key routes', () => {
  it('passes axe check at /clientes', async () => {
    const router = createTestRouter('/clientes')
    const { container } = render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByTestId('clientes-shell-view'))

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('passes axe check on 404 page', async () => {
    const router = createTestRouter('/unknown-page')
    const { container } = render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByTestId('not-found-view'))

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
