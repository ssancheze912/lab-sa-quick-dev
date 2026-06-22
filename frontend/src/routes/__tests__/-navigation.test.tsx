import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
      <nav data-testid="navigation-rail" aria-label="navigation-rail">
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
      <nav data-testid="navigation-bar" aria-label="navigation-bar">
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

describe('Navigation Shell — Desktop (NavigationRail)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    })
  })

  it('renders NavigationRail with Clientes and Contactos at /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })

    // Both nav components (rail + bar) render in DOM; check rail specifically
    expect(screen.getByTestId('rail-item-clientes')).toBeInTheDocument()
    expect(screen.getByTestId('rail-item-contactos')).toBeInTheDocument()
  })

  it('highlights Clientes as active when on /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      const clientesBtn = screen.getByTestId('rail-item-clientes')
      expect(clientesBtn).toHaveAttribute('aria-current', 'page')
    })
  })

  it('highlights Contactos as active when on /contactos', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      const contactosBtn = screen.getByTestId('rail-item-contactos')
      expect(contactosBtn).toHaveAttribute('aria-current', 'page')
    })
  })

  it('navigates to /contactos when Contactos item is clicked', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByTestId('rail-item-contactos'))
    fireEvent.click(screen.getByTestId('rail-item-contactos'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos')
    })
  })

  it('navigates to /clientes when Clientes item is clicked', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByTestId('rail-item-clientes'))
    fireEvent.click(screen.getByTestId('rail-item-clientes'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })
})

describe('Navigation Shell — Mobile (NavigationBar)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })
  })

  it('renders NavigationBar with Clientes and Contactos', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument()
    })

    // Both nav components (rail + bar) render in DOM; check bar specifically
    expect(screen.getByTestId('bar-item-clientes')).toBeInTheDocument()
    expect(screen.getByTestId('bar-item-contactos')).toBeInTheDocument()
  })
})

describe('Navigation Shell — Direct Routes (Deep Linking)', () => {
  it('renders ClientesShellView on direct navigation to /clientes', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Clientes' }),
      ).toBeInTheDocument()
    })
  })

  it('renders ContactosShellView on direct navigation to /contactos', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Contactos' }),
      ).toBeInTheDocument()
    })
  })
})

describe('Navigation Shell — 404 Not Found', () => {
  it('renders 404 view for unknown route', async () => {
    const router = createTestRouter('/unknown-path-that-does-not-exist')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    })
  })

  it('renders a link back to Clientes on 404 page', async () => {
    const router = createTestRouter('/unknown-path-that-does-not-exist')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /volver a clientes/i }),
      ).toBeInTheDocument()
    })
  })
})

describe('Navigation Shell — Root Redirect', () => {
  it('redirects from / to /clientes', async () => {
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })
})

describe('Navigation Shell — Accessibility (WCAG 2.1 AA)', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('passes axe accessibility check on /clientes', async () => {
    const router = createTestRouter('/clientes')
    const { container } = render(<RouterProvider router={router} />)

    await waitFor(() =>
      screen.getByRole('heading', { name: 'Clientes' }),
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('passes axe accessibility check on /contactos', async () => {
    const router = createTestRouter('/contactos')
    const { container } = render(<RouterProvider router={router} />)

    await waitFor(() =>
      screen.getByRole('heading', { name: 'Contactos' }),
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('passes axe accessibility check on 404 page', async () => {
    const router = createTestRouter('/unknown-page')
    const { container } = render(<RouterProvider router={router} />)

    await waitFor(() => screen.getByText('Página no encontrada'))

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
