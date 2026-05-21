import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Edge-Case Tests: Story 1.2 — Frontend Navigation Shell
 *
 * AppShell uses Tailwind CSS (hidden lg:flex / flex lg:hidden) for responsive visibility.
 * Both navigation-rail and navigation-bar are ALWAYS in the DOM — CSS controls show/hide.
 * Active state uses aria-current="page" on the Link element.
 *
 * Coverage:
 *   EC1  — Both navigation elements always present in DOM
 *   EC2  — nav elements expose role="navigation" semantic
 *   EC3  — Deep nested unknown route still renders 404 view
 *   EC4  — 404 back link href contains /clientes
 *   EC5  — Navigation links are actual <a> elements with hrefs
 *   EC6  — Active state (aria-current) reflects current route
 *   EC7  — Multiple rapid clicks on same nav item are idempotent
 *   EC8  — Both nav items render in both navigation components
 *   EC9  — Main content area renders Outlet correctly
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createTestRouter(initialPath: string = '/') {
  const { createMemoryHistory, createRouter } = await import('@tanstack/react-router')
  const { routeTree } = await import('../../routeTree.gen')
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  return router
}

async function renderWithRouter(initialPath: string = '/') {
  const { RouterProvider } = await import('@tanstack/react-router')
  const router = await createTestRouter(initialPath)
  await router.load()
  return render(<RouterProvider router={router} />)
}

// ---------------------------------------------------------------------------
// EC1 — Both navigation elements always present in DOM
// ---------------------------------------------------------------------------

describe('EC1 — Both nav elements are always in the DOM', () => {
  it('[P1] navigation-rail is always present in the DOM', async () => {
    await renderWithRouter('/')

    expect(screen.getByTestId('navigation-rail')).toBeDefined()
  })

  it('[P1] navigation-bar is always present in the DOM', async () => {
    await renderWithRouter('/')

    expect(screen.getByTestId('navigation-bar')).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// EC2 — Nav element semantic role
// ---------------------------------------------------------------------------

describe('EC2 — Nav elements expose role="navigation"', () => {
  it('[P1] At least one navigation landmark is discoverable by role', async () => {
    await renderWithRouter('/')

    const navLandmarks = screen.getAllByRole('navigation')
    expect(navLandmarks.length).toBeGreaterThanOrEqual(1)
  })

  it('[P1] navigation-rail has aria-label="Navegación principal"', async () => {
    await renderWithRouter('/')

    const navLandmark = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(navLandmark).toBeDefined()
  })

  it('[P1] navigation-bar has aria-label="Menú de navegación"', async () => {
    await renderWithRouter('/')

    const navLandmark = screen.getByRole('navigation', { name: 'Menú de navegación' })
    expect(navLandmark).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// EC3 — Deep nested unknown routes render 404 view
// ---------------------------------------------------------------------------

describe('EC3 — Deep nested unknown routes render 404 view', () => {
  it('[P1] /a/b/c/deeply-nested renders not-found-view (no crash)', async () => {
    await renderWithRouter('/a/b/c/deeply-nested')

    expect(screen.getByTestId('not-found-view')).toBeDefined()
  })

  it('[P1] /clientes/inexistente renders non-blank content (no crash)', async () => {
    await renderWithRouter('/clientes/inexistente')

    const body = document.body.textContent ?? ''
    expect(body.trim().length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// EC4 — 404 back link
// ---------------------------------------------------------------------------

describe('EC4 — 404 back link href', () => {
  it('[P1] not-found-back-link has href containing /clientes', async () => {
    await renderWithRouter('/unknown-route')

    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toBeDefined()
    const href = backLink.getAttribute('href') ?? ''
    expect(href).toContain('/clientes')
  })
})

// ---------------------------------------------------------------------------
// EC5 — Navigation links are actual anchor elements
// ---------------------------------------------------------------------------

describe('EC5 — Navigation links are proper anchor elements', () => {
  it('[P1] Clientes link is an anchor element with href /clientes', async () => {
    await renderWithRouter('/')

    const links = screen.getAllByRole('link', { name: /clientes/i })
    expect(links.length).toBeGreaterThan(0)
    const href = links[0].getAttribute('href') ?? ''
    expect(href).toContain('/clientes')
  })

  it('[P1] Contactos link is an anchor element with href /contactos', async () => {
    await renderWithRouter('/')

    const links = screen.getAllByRole('link', { name: /contactos/i })
    expect(links.length).toBeGreaterThan(0)
    const href = links[0].getAttribute('href') ?? ''
    expect(href).toContain('/contactos')
  })
})

// ---------------------------------------------------------------------------
// EC6 — Active state via aria-current
// ---------------------------------------------------------------------------

describe('EC6 — Active state (aria-current) reflects current route', () => {
  it('[P1] Clientes link has aria-current="page" when on /clientes', async () => {
    await renderWithRouter('/clientes')

    const clientesLinks = screen.getAllByRole('link', { name: /clientes/i })
    const activeLink = clientesLinks.find(
      (el) => el.getAttribute('aria-current') === 'page',
    )
    expect(activeLink).toBeDefined()
  })

  it('[P1] Contactos link has aria-current="page" when on /contactos', async () => {
    await renderWithRouter('/contactos')

    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })
    const activeLink = contactosLinks.find(
      (el) => el.getAttribute('aria-current') === 'page',
    )
    expect(activeLink).toBeDefined()
  })

  it('[P1] Contactos link does NOT have aria-current="page" when on /clientes', async () => {
    await renderWithRouter('/clientes')

    const contactosLinks = screen.getAllByRole('link', { name: /contactos/i })
    const activeContactos = contactosLinks.find(
      (el) => el.getAttribute('aria-current') === 'page',
    )
    expect(activeContactos).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// EC7 — Multiple rapid clicks on same nav item are idempotent
// ---------------------------------------------------------------------------

describe('EC7 — Multiple rapid clicks on same nav item', () => {
  it('[P2] Clicking Clientes twice stays on /clientes without error', async () => {
    const user = userEvent.setup()
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/')
    await router.load()
    render(<RouterProvider router={router} />)

    const links = screen.getAllByRole('link', { name: /clientes/i })
    await user.click(links[0])
    await user.click(links[0])

    expect(router.state.location.pathname).toBe('/clientes')
  })

  it('[P2] Clicking Contactos after Clientes correctly updates active route', async () => {
    const user = userEvent.setup()
    const { RouterProvider } = await import('@tanstack/react-router')
    const router = await createTestRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)

    const links = screen.getAllByRole('link', { name: /contactos/i })
    await user.click(links[0])

    expect(router.state.location.pathname).toBe('/contactos')
  })
})

// ---------------------------------------------------------------------------
// EC8 — Both nav items present in both nav components
// ---------------------------------------------------------------------------

describe('EC8 — Both nav items in both navigation components', () => {
  it('[P1] navigation-rail contains Clientes link', async () => {
    await renderWithRouter('/')

    const rail = screen.getByTestId('navigation-rail')
    const links = screen.getAllByRole('link', { name: /clientes/i })
    const linkInRail = links.find((el) => rail.contains(el))
    expect(linkInRail).toBeDefined()
  })

  it('[P1] navigation-bar contains Clientes link', async () => {
    await renderWithRouter('/')

    const bar = screen.getByTestId('navigation-bar')
    const links = screen.getAllByRole('link', { name: /clientes/i })
    const linkInBar = links.find((el) => bar.contains(el))
    expect(linkInBar).toBeDefined()
  })

  it('[P1] navigation-rail contains Contactos link', async () => {
    await renderWithRouter('/')

    const rail = screen.getByTestId('navigation-rail')
    const links = screen.getAllByRole('link', { name: /contactos/i })
    const linkInRail = links.find((el) => rail.contains(el))
    expect(linkInRail).toBeDefined()
  })

  it('[P1] navigation-bar contains Contactos link', async () => {
    await renderWithRouter('/')

    const bar = screen.getByTestId('navigation-bar')
    const links = screen.getAllByRole('link', { name: /contactos/i })
    const linkInBar = links.find((el) => bar.contains(el))
    expect(linkInBar).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// EC9 — Main content area renders Outlet correctly
// ---------------------------------------------------------------------------

describe('EC9 — Main content area renders Outlet correctly', () => {
  it('[P1] /clientes route renders clientes-view inside <main> element', async () => {
    await renderWithRouter('/clientes')

    const mainEl = document.querySelector('main')
    const clientesView = screen.getByTestId('clientes-view')

    expect(mainEl).not.toBeNull()
    expect(mainEl!.contains(clientesView)).toBe(true)
  })

  it('[P1] /contactos route renders contactos-view inside <main> element', async () => {
    await renderWithRouter('/contactos')

    const mainEl = document.querySelector('main')
    const contactosView = screen.getByTestId('contactos-view')

    expect(mainEl).not.toBeNull()
    expect(mainEl!.contains(contactosView)).toBe(true)
  })

  it('[P2] <main> element has flex-1 layout class for content expansion', async () => {
    await renderWithRouter('/clientes')

    const mainEl = document.querySelector('main')
    expect(mainEl).not.toBeNull()
    expect(mainEl!.className).toContain('flex-1')
  })
})
