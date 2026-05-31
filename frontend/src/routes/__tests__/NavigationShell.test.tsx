import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRouter, RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

function createTestRouter(initialPath: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] })
  return createRouter({ routeTree, history: memoryHistory })
}

// Mock siesa-ui-kit Navbar to avoid CSS/DOM issues in jsdom
vi.mock('siesa-ui-kit', () => ({
  Navbar: ({ productName }: { productName?: string }) => (
    <header data-testid="navbar-inner" role="banner">
      <span>{productName}</span>
    </header>
  ),
}))

// ────────────────────────────────────────────────
// AC1 — Desktop: NavigationRail + Navbar visible
// ────────────────────────────────────────────────
describe('AC1 — Desktop: NavigationRail + Navbar visible', () => {
  it('Given desktop viewport, When app renders, Then Navbar with "Siesa Agents" is visible', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument()
      expect(screen.getByText('Siesa Agents')).toBeInTheDocument()
    })
  })

  it('Given desktop viewport, When app renders, Then NavigationRail is visible on the left', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })
  })

  it('Given desktop viewport, When app renders, Then NavigationRail contains "Clientes" entry', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getAllByTestId('nav-item-clientes').length).toBeGreaterThan(0)
    })
  })

  it('Given desktop viewport, When app renders, Then NavigationRail contains "Contactos" entry', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getAllByTestId('nav-item-contactos').length).toBeGreaterThan(0)
    })
  })

  it('Given desktop viewport, When app renders, Then NavigationBar (mobile) is also in DOM (hidden via CSS)', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      // NavigationBar exists in DOM (hidden via Tailwind lg:hidden)
      expect(screen.getByTestId('nav-bottom-bar')).toBeInTheDocument()
    })
  })
})

// ────────────────────────────────────────────────
// AC2 — Active state: Clientes
// ────────────────────────────────────────────────
describe('AC2 — Active state: Clientes', () => {
  it('Given user is at /clientes, When nav renders, Then Clientes item has aria-current="page"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.some((el) => el.getAttribute('aria-current') === 'page')).toBe(true)
    })
  })

  it('Given user is at /clientes, When nav renders, Then Contactos item does NOT have aria-current="page"', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      expect(contactosItems.every((el) => el.getAttribute('aria-current') !== 'page')).toBe(true)
    })
  })

  it('Given user clicks Clientes item from /contactos, When navigation happens, Then URL becomes /clientes', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getAllByTestId('nav-item-clientes').length).toBeGreaterThan(0)
    })
    // Click first clientes nav item (rail or bar)
    await user.click(screen.getAllByTestId('nav-item-clientes')[0])
    await waitFor(() => {
      expect(screen.getByTestId('clientes-page')).toBeInTheDocument()
    })
  })
})

// ────────────────────────────────────────────────
// AC3 — Active state: Contactos
// ────────────────────────────────────────────────
describe('AC3 — Active state: Contactos', () => {
  it('Given user is at /contactos, When nav renders, Then Contactos item has aria-current="page"', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const contactosItems = screen.getAllByTestId('nav-item-contactos')
      expect(contactosItems.some((el) => el.getAttribute('aria-current') === 'page')).toBe(true)
    })
  })

  it('Given user is at /contactos, When nav renders, Then Clientes item does NOT have aria-current="page"', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const clientesItems = screen.getAllByTestId('nav-item-clientes')
      expect(clientesItems.every((el) => el.getAttribute('aria-current') !== 'page')).toBe(true)
    })
  })

  it('Given user clicks Contactos item from /clientes, When navigation happens, Then URL becomes /contactos', async () => {
    const user = userEvent.setup()
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getAllByTestId('nav-item-contactos').length).toBeGreaterThan(0)
    })
    await user.click(screen.getAllByTestId('nav-item-contactos')[0])
    await waitFor(() => {
      expect(screen.getByTestId('contactos-page')).toBeInTheDocument()
    })
  })
})

// ────────────────────────────────────────────────
// AC4 — Mobile NavigationBar
// ────────────────────────────────────────────────
describe('AC4 — Mobile NavigationBar', () => {
  it('Given mobile viewport, When app renders, Then NavigationBar is present in DOM', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('nav-bottom-bar')).toBeInTheDocument()
    })
  })

  it('Given mobile viewport, When app renders, Then NavigationRail is also in DOM', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument()
    })
  })

  it('Given mobile viewport, When app renders, Then Clientes and Contactos items are in NavigationBar', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      const bar = screen.getByTestId('nav-bottom-bar')
      expect(bar.querySelector('[data-testid="nav-item-clientes"]')).toBeInTheDocument()
      expect(bar.querySelector('[data-testid="nav-item-contactos"]')).toBeInTheDocument()
    })
  })
})

// ────────────────────────────────────────────────
// AC5 — Deep link /clientes
// ────────────────────────────────────────────────
describe('AC5 — Deep link /clientes', () => {
  it('Given direct URL /clientes, When page loads, Then ClientesPage placeholder is rendered', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('clientes-page')).toBeInTheDocument()
    })
  })

  it('Given direct URL /clientes, When page loads, Then navigation shell (Navbar) is present', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument()
    })
  })

  it('Given direct URL /clientes, When page loads, Then router state remains at /clientes (no redirect)', async () => {
    const router = createTestRouter('/clientes')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('clientes-page')).toBeInTheDocument()
    })
    expect(router.state.location.pathname).toBe('/clientes')
  })
})

// ────────────────────────────────────────────────
// AC6 — Deep link /contactos
// ────────────────────────────────────────────────
describe('AC6 — Deep link /contactos', () => {
  it('Given direct URL /contactos, When page loads, Then ContactosPage placeholder is rendered', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('contactos-page')).toBeInTheDocument()
    })
  })

  it('Given direct URL /contactos, When page loads, Then navigation shell (Navbar) is present', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('navbar')).toBeInTheDocument()
    })
  })

  it('Given direct URL /contactos, When page loads, Then router state remains at /contactos (no redirect)', async () => {
    const router = createTestRouter('/contactos')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('contactos-page')).toBeInTheDocument()
    })
    expect(router.state.location.pathname).toBe('/contactos')
  })
})

// ────────────────────────────────────────────────
// AC7 — Unknown route 404
// ────────────────────────────────────────────────
describe('AC7 — Unknown route 404', () => {
  it('Given unknown route /unknown, When page loads, Then 404 not-found component is rendered', async () => {
    const router = createTestRouter('/ruta-desconocida')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
    })
  })

  it('Given unknown route, When page loads, Then "Página no encontrada" message is visible in Spanish', async () => {
    const router = createTestRouter('/ruta-desconocida')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
      expect(screen.getByText('La página que buscas no existe.')).toBeInTheDocument()
    })
  })

  it('Given unknown route, When page loads, Then a link "Volver a Clientes" pointing to /clientes is present', async () => {
    const router = createTestRouter('/ruta-desconocida')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('not-found-back-link')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Volver a Clientes/i })).toBeInTheDocument()
    })
  })
})

// ────────────────────────────────────────────────
// AC8 — Root / redirects to /clientes
// ────────────────────────────────────────────────
describe('AC8 — Root / redirects to /clientes', () => {
  it('Given app loads at /, When page renders, Then router state is redirected to /clientes', async () => {
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes')
    })
  })

  it('Given app loads at /, When redirect happens, Then ClientesPage placeholder is rendered', async () => {
    const router = createTestRouter('/')
    render(<RouterProvider router={router} />)
    await waitFor(() => {
      expect(screen.getByTestId('clientes-page')).toBeInTheDocument()
    })
  })
})
