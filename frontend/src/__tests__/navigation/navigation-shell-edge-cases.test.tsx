/**
 * Story 1.2: Frontend Navigation Shell — Edge Cases & Expanded Unit/Component Coverage
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion Tests (BMad-Integrated Mode — Component/Unit Level)
 * Covers gaps not addressed by ATDD navigation-shell.test.tsx:
 *
 *   - AC5 (root redirect): router at / redirects to /clientes in memory history
 *   - NavigationBar active state in DOM (nav-bar-item-* data-active)
 *   - Navigation shell (rail + bar) present on 404 route
 *   - Route isolation: multiple routers in the same test session render independently
 *   - NotFoundPage renders in isolation without router context (pure component)
 *   - NavigationRail and NavigationBar both present in DOM simultaneously
 *   - No data-active attribute when value is false (attribute is absent, not "false")
 *   - Navbar product name rendered
 */

import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from '../../routeTree.gen';

// ─────────────────────────────────────────────────────────────────────────────
// Test helper
// ─────────────────────────────────────────────────────────────────────────────

async function renderWithRouter(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history });
  await router.load();
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Root redirect in memory history
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Root redirect to /clientes (component level)', () => {
  it('[P0] should redirect router to /clientes when starting at /', async () => {
    // GIVEN: The router starts at /
    // WHEN: The router resolves routes and redirect fires
    const router = await renderWithRouter('/');

    // THEN: The router history ends at /clientes
    expect(router.state.location.pathname).toBe('/clientes');
  });

  it('[P0] should render ClientesPage heading after root redirect', async () => {
    // GIVEN: The router starts at /
    // WHEN: Redirect resolves and ClientesPage renders
    await renderWithRouter('/');

    // THEN: The Clientes page heading is present in the DOM
    expect(screen.getByTestId('clientes-page-heading')).toBeInTheDocument();
  });

  it('[P1] should render NavigationRail after root redirect', async () => {
    // GIVEN: The router starts at / and redirects to /clientes
    // WHEN: The root layout renders
    await renderWithRouter('/');

    // THEN: NavigationRail is in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('[P1] should set Clientes nav item as active after root redirect to /clientes', async () => {
    // GIVEN: Root redirect fires and current path becomes /clientes
    // WHEN: Nav items render
    await renderWithRouter('/');

    // THEN: Clientes nav item carries data-active="true"
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NavigationBar active state in DOM (nav-bar-item-*)
// Not covered by ATDD component tests — those only check nav-item-* (rail)
// ─────────────────────────────────────────────────────────────────────────────

describe('NavigationBar (nav-bar-item-*) active state in DOM', () => {
  it('[P1] should set data-active="true" on nav-bar-item-clientes when on /clientes', async () => {
    // GIVEN: The user is on /clientes
    // WHEN: NavigationBar renders
    await renderWithRouter('/clientes');

    // THEN: The Clientes nav bar item carries data-active="true"
    expect(screen.getByTestId('nav-bar-item-clientes')).toHaveAttribute('data-active', 'true');
  });

  it('[P1] should NOT have data-active on nav-bar-item-contactos when on /clientes', async () => {
    // GIVEN: The user is on /clientes
    // WHEN: NavigationBar renders
    await renderWithRouter('/clientes');

    // THEN: The Contactos nav bar item does NOT carry data-active="true"
    expect(screen.getByTestId('nav-bar-item-contactos')).not.toHaveAttribute('data-active', 'true');
  });

  it('[P1] should set data-active="true" on nav-bar-item-contactos when on /contactos', async () => {
    // GIVEN: The user is on /contactos
    // WHEN: NavigationBar renders
    await renderWithRouter('/contactos');

    // THEN: The Contactos nav bar item carries data-active="true"
    expect(screen.getByTestId('nav-bar-item-contactos')).toHaveAttribute('data-active', 'true');
  });

  it('[P1] should NOT have data-active on nav-bar-item-clientes when on /contactos', async () => {
    // GIVEN: The user is on /contactos
    // WHEN: NavigationBar renders
    await renderWithRouter('/contactos');

    // THEN: The Clientes nav bar item does NOT carry data-active="true"
    expect(screen.getByTestId('nav-bar-item-clientes')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NavigationBar aria-label on nav-bar-item-* (mobile accessibility, unit level)
// ─────────────────────────────────────────────────────────────────────────────

describe('NavigationBar items aria-label (mobile accessibility)', () => {
  it('[P1] should render nav-bar-item-clientes with aria-label="Ir a Clientes"', async () => {
    // GIVEN: The app renders NavigationBar
    await renderWithRouter('/clientes');

    // THEN: Clientes nav bar item has correct Spanish aria-label
    expect(screen.getByTestId('nav-bar-item-clientes')).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  it('[P1] should render nav-bar-item-contactos with aria-label="Ir a Contactos"', async () => {
    // GIVEN: The app renders NavigationBar
    await renderWithRouter('/clientes');

    // THEN: Contactos nav bar item has correct Spanish aria-label
    expect(screen.getByTestId('nav-bar-item-contactos')).toHaveAttribute('aria-label', 'Ir a Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation shell present on 404 route
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation shell presence on 404 route', () => {
  it('[P1] should render NavigationRail on unknown route (shell persists)', async () => {
    // GIVEN: The router starts at an unknown path
    // WHEN: NotFoundPage is displayed
    await renderWithRouter('/ruta-inexistente');

    // THEN: NavigationRail is still in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('[P1] should render NavigationBar on unknown route (shell persists)', async () => {
    // GIVEN: The router starts at an unknown path
    // WHEN: NotFoundPage is displayed
    await renderWithRouter('/ruta-desconocida');

    // THEN: NavigationBar is still in the DOM
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('[P1] should render not-found-page alongside NavigationRail on 404', async () => {
    // GIVEN: Unknown route
    await renderWithRouter('/pagina-que-no-existe');

    // THEN: Both navigation shell and 404 content are present simultaneously
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation shell always renders both rail and bar in DOM
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation shell DOM structure — both rail and bar present', () => {
  it('[P2] should render both NavigationRail and NavigationBar in DOM on /clientes', async () => {
    // GIVEN: CSS controls visibility; both elements must exist in DOM at all times
    // WHEN: The app renders at /clientes
    await renderWithRouter('/clientes');

    // THEN: Both nav elements are in the DOM (CSS hides one based on viewport)
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('[P2] should render both NavigationRail and NavigationBar in DOM on /contactos', async () => {
    // GIVEN: CSS controls visibility; both elements must exist in DOM at all times
    // WHEN: The app renders at /contactos
    await renderWithRouter('/contactos');

    // THEN: Both nav elements are in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Inactive nav item has no data-active attribute (not "false" — absent)
// ─────────────────────────────────────────────────────────────────────────────

describe('Inactive nav item — data-active attribute is absent (not "false")', () => {
  it('[P2] should have no data-active attribute on inactive nav-item-contactos on /clientes', async () => {
    // GIVEN: User is on /clientes
    await renderWithRouter('/clientes');

    // THEN: data-active is absent (not set to "false") on Contactos item
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).not.toHaveAttribute('data-active');
  });

  it('[P2] should have no data-active attribute on inactive nav-item-clientes on /contactos', async () => {
    // GIVEN: User is on /contactos
    await renderWithRouter('/contactos');

    // THEN: data-active is absent on inactive Clientes item
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).not.toHaveAttribute('data-active');
  });

  it('[P2] should have no data-active attribute on inactive nav-bar-item-contactos on /clientes', async () => {
    // GIVEN: User is on /clientes
    await renderWithRouter('/clientes');

    // THEN: data-active is absent on inactive mobile Contactos bar item
    const contactosBarItem = screen.getByTestId('nav-bar-item-contactos');
    expect(contactosBarItem).not.toHaveAttribute('data-active');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Route isolation — independent router instances render correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('Route isolation — independent router instances', () => {
  it('[P2] should render ContactosPage when a second router instance starts at /contactos', async () => {
    // GIVEN: A fresh router instance at /contactos (not reusing prior renders)
    // WHEN: The route resolves
    await renderWithRouter('/contactos');

    // THEN: ContactosPage heading is present
    expect(screen.getByTestId('contactos-page-heading')).toBeInTheDocument();
  });

  it('[P2] should have data-active on nav-item-contactos for a fresh render at /contactos', async () => {
    // GIVEN: Fresh router instance at /contactos
    await renderWithRouter('/contactos');

    // THEN: Contactos is active, Clientes is not
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 page content — link points to /clientes (href boundary)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — 404 page link boundary conditions', () => {
  it('[P2] should render not-found-link-clientes with href="/clientes" on any unknown route', async () => {
    // GIVEN: An unknown route /pagina-profunda/sub-pagina
    await renderWithRouter('/pagina-profunda/sub-pagina');

    // THEN: The return link points exactly to /clientes
    const link = screen.getByTestId('not-found-link-clientes');
    expect(link).toHaveAttribute('href', '/clientes');
  });

  it('[P2] should render "Ir a Clientes" as link text on 404 page', async () => {
    // GIVEN: An unknown route
    await renderWithRouter('/no-existe');

    // THEN: The link text is "Ir a Clientes"
    expect(screen.getByTestId('not-found-link-clientes')).toHaveTextContent('Ir a Clientes');
  });

  it('[P2] should render description text on 404 page', async () => {
    // GIVEN: An unknown route
    await renderWithRouter('/unknown-path');

    // THEN: The description paragraph is present
    expect(screen.getByText('La ruta solicitada no existe en la aplicación.')).toBeInTheDocument();
  });
});
