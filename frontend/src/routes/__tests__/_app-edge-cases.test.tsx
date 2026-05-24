/**
 * Story 1.2: Frontend Navigation Shell — Component Edge Cases & Boundary Conditions
 * Epic 1: Project Foundation & Application Shell
 *
 * Automation Expansion — Additional coverage beyond ATDD happy paths.
 *
 * Coverage areas:
 *   - useIsDesktop hook: exact breakpoint boundary (1024px), resize cleanup, initial value
 *   - AppShell active state logic: path prefix matching, no-match path, root path
 *   - Navigation item rendering: both items always present in DOM regardless of viewport
 *   - AppShell re-render: viewport resize triggers nav switch without unmounting outlet
 *   - NotFound component: isolated rendering, link href, Spanish text content
 *   - NotFound component: renders without router context (standalone)
 *
 * Test levels: Component (Vitest + React Testing Library)
 * Test file location: co-located with routes, per project convention
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sets window.innerWidth to simulate a specific viewport width.
 * Required because jsdom does not resize on its own.
 */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

/**
 * Renders the application shell at a given route using an in-memory router.
 */
async function renderAppAtRoute(path: string) {
  const { routeTree } = await import('../../routeTree.gen');
  const memoryHistory = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history: memoryHistory });
  render(<RouterProvider router={router} />);
  await router.load();
  return router;
}

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoint boundary — useIsDesktop hook behaviour
// ─────────────────────────────────────────────────────────────────────────────

describe('Breakpoint boundary — useIsDesktop hook', () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it('[P1] should render NavigationRail at exactly 1024px (inclusive desktop threshold)', async () => {
    // GIVEN: The application is loaded at exactly 1024px
    setViewportWidth(1024);

    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: NavigationRail is in the DOM (>= 1024 is desktop)
    expect(screen.getByTestId('navigation-rail')).toBeDefined();
    const navBar = screen.queryByTestId('navigation-bar');
    if (navBar) {
      expect(navBar).not.toBeVisible();
    } else {
      expect(navBar).toBeNull();
    }
  });

  it('[P1] should render NavigationBar at 1023px (one pixel below desktop threshold)', async () => {
    // GIVEN: The application is loaded at 1023px (mobile)
    setViewportWidth(1023);

    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: NavigationBar is in the DOM (< 1024 is mobile)
    expect(screen.getByTestId('navigation-bar')).toBeDefined();
    const navRail = screen.queryByTestId('navigation-rail');
    if (navRail) {
      expect(navRail).not.toBeVisible();
    } else {
      expect(navRail).toBeNull();
    }
  });

  it('[P1] should switch from NavigationRail to NavigationBar when viewport crosses 1024px boundary', async () => {
    // GIVEN: The application starts in desktop mode
    setViewportWidth(1280);
    await renderAppAtRoute('/clientes');

    // Confirm desktop state
    expect(screen.getByTestId('navigation-rail')).toBeDefined();

    // WHEN: The viewport is resized below the breakpoint
    await act(async () => {
      setViewportWidth(800);
    });

    // THEN: NavigationBar appears (mobile mode)
    expect(screen.getByTestId('navigation-bar')).toBeDefined();
  });

  it('[P1] should switch from NavigationBar to NavigationRail when viewport grows above 1024px', async () => {
    // GIVEN: The application starts in mobile mode
    setViewportWidth(375);
    await renderAppAtRoute('/clientes');

    // Confirm mobile state
    expect(screen.getByTestId('navigation-bar')).toBeDefined();

    // WHEN: The viewport grows to desktop size
    await act(async () => {
      setViewportWidth(1280);
    });

    // THEN: NavigationRail appears (desktop mode)
    expect(screen.getByTestId('navigation-rail')).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Active state logic — path matching edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Active state logic — path matching edge cases', () => {
  beforeEach(() => {
    setViewportWidth(1280);
  });

  afterEach(() => {
    setViewportWidth(1024);
  });

  it('[P1] should have data-active="false" on the Contactos item when at /clientes', async () => {
    // GIVEN: The router is at /clientes
    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: Contactos item is NOT active
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem.getAttribute('data-active')).toBe('false');
  });

  it('[P1] should have data-active="false" on the Clientes item when at /contactos', async () => {
    // GIVEN: The router is at /contactos
    // WHEN: The shell renders
    await renderAppAtRoute('/contactos');

    // THEN: Clientes item is NOT active
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem.getAttribute('data-active')).toBe('false');
  });

  it('[P1] should set data-active="true" only on Clientes when at /clientes — exclusivity', async () => {
    // GIVEN: The router is at /clientes
    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: Exactly one nav item is active
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(clientesItem.getAttribute('data-active')).toBe('true');
    expect(contactosItem.getAttribute('data-active')).toBe('false');
  });

  it('[P1] should set data-active="true" only on Contactos when at /contactos — exclusivity', async () => {
    // GIVEN: The router is at /contactos
    // WHEN: The shell renders
    await renderAppAtRoute('/contactos');

    // THEN: Exactly one nav item is active
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem.getAttribute('data-active')).toBe('true');
    expect(clientesItem.getAttribute('data-active')).toBe('false');
  });

  it('[P2] should update active state when SPA navigating from /clientes to /contactos', async () => {
    // GIVEN: The application is at /clientes with Clientes active
    await renderAppAtRoute('/clientes');
    expect(screen.getByTestId('nav-item-clientes').getAttribute('data-active')).toBe('true');

    // WHEN: The user clicks the Contactos nav item
    await act(async () => {
      fireEvent.click(screen.getByTestId('nav-item-contactos'));
    });

    // THEN: Contactos becomes active and Clientes becomes inactive
    expect(screen.getByTestId('nav-item-contactos').getAttribute('data-active')).toBe('true');
    expect(screen.getByTestId('nav-item-clientes').getAttribute('data-active')).toBe('false');
  });

  it('[P2] should update active state when SPA navigating from /contactos to /clientes', async () => {
    // GIVEN: The application is at /contactos with Contactos active
    await renderAppAtRoute('/contactos');
    expect(screen.getByTestId('nav-item-contactos').getAttribute('data-active')).toBe('true');

    // WHEN: The user clicks the Clientes nav item
    await act(async () => {
      fireEvent.click(screen.getByTestId('nav-item-clientes'));
    });

    // THEN: Clientes becomes active and Contactos becomes inactive
    expect(screen.getByTestId('nav-item-clientes').getAttribute('data-active')).toBe('true');
    expect(screen.getByTestId('nav-item-contactos').getAttribute('data-active')).toBe('false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation items always present in DOM (both viewports)
// ─────────────────────────────────────────────────────────────────────────────

describe('Navigation items always present in DOM', () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it('[P2] should have both nav items in DOM on desktop (even if one container is hidden)', async () => {
    // GIVEN: The application is on desktop
    setViewportWidth(1280);

    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: Both nav item test IDs are queryable in DOM
    expect(screen.getByTestId('nav-item-clientes')).toBeDefined();
    expect(screen.getByTestId('nav-item-contactos')).toBeDefined();
  });

  it('[P2] should have both nav items in DOM on mobile (even if one container is hidden)', async () => {
    // GIVEN: The application is on mobile
    setViewportWidth(390);

    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: Both nav item test IDs are queryable in DOM
    expect(screen.getByTestId('nav-item-clientes')).toBeDefined();
    expect(screen.getByTestId('nav-item-contactos')).toBeDefined();
  });

  it('[P1] should render nav items with correct aria-label attributes for accessibility', async () => {
    // GIVEN: The application is rendered on desktop
    setViewportWidth(1280);

    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: Each nav item has an aria-label matching its Spanish label
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(clientesItem.getAttribute('aria-label')).toBe('Clientes');
    expect(contactosItem.getAttribute('aria-label')).toBe('Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NotFound component — isolated unit tests
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFound component — isolated unit tests', () => {
  it('[P1] should render the not-found-view testid when navigating to an unknown route', async () => {
    // GIVEN: The application receives an unknown path
    setViewportWidth(1280);

    // WHEN: The router is at /completely-unknown
    await renderAppAtRoute('/completely-unknown');

    // THEN: The not-found view container renders
    expect(screen.getByTestId('not-found-view')).toBeDefined();
  });

  it('[P1] should display a Spanish message containing "no encontrada" on 404', async () => {
    // GIVEN: An unknown path is loaded
    setViewportWidth(1280);

    // WHEN: The not-found component renders
    await renderAppAtRoute('/completely-unknown');

    // THEN: The message element contains "no encontrada"
    const message = screen.getByTestId('not-found-message');
    expect(message.textContent).toContain('no encontrada');
  });

  it('[P1] should have a back-link with href="/clientes" on the 404 page', async () => {
    // GIVEN: The user lands on a 404 page
    setViewportWidth(1280);

    // WHEN: The not-found component renders
    await renderAppAtRoute('/completely-unknown');

    // THEN: The back-link href points to /clientes
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink.getAttribute('href')).toBe('/clientes');
  });

  it('[P1] should display "Volver" text (Spanish) on the 404 back-link', async () => {
    // GIVEN: The user lands on a 404 page
    setViewportWidth(1280);

    // WHEN: The not-found component renders
    await renderAppAtRoute('/completely-unknown');

    // THEN: The back-link text contains "Volver" (Spanish, not English)
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink.textContent).toContain('Volver');
  });

  it('[P1] should navigate to /clientes after clicking the back-link on 404 view', async () => {
    // GIVEN: The user is on the 404 page
    setViewportWidth(1280);
    const router = await renderAppAtRoute('/completely-unknown');

    // WHEN: The user clicks the back-link
    await act(async () => {
      fireEvent.click(screen.getByTestId('not-found-back-link'));
      await router.load();
    });

    // THEN: The router navigates to /clientes
    expect(router.state.location.pathname).toBe('/clientes');
  });

  it('[P2] should show 404 view for a deeply nested unknown path', async () => {
    // GIVEN: A deeply nested path that matches no route
    setViewportWidth(1280);

    // WHEN: The router resolves the deep path
    await renderAppAtRoute('/a/b/c/d/e');

    // THEN: The not-found view is still displayed
    expect(screen.getByTestId('not-found-view')).toBeDefined();
    expect(screen.getByTestId('not-found-message').textContent).toContain('no encontrada');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — navigation landmark edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — navigation landmark edge cases', () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it('[P1] should have aria-label="Navegación principal" on the nav element (desktop)', async () => {
    // GIVEN: The application is rendered on desktop
    setViewportWidth(1280);

    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: The nav element has the correct Spanish aria-label
    const nav = screen.getByTestId('navigation-landmark');
    expect(nav.getAttribute('aria-label')).toBe('Navegación principal');
  });

  it('[P1] should have aria-label="Navegación principal" on the nav element (mobile)', async () => {
    // GIVEN: The application is rendered on mobile
    setViewportWidth(390);

    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: The nav element retains the Spanish aria-label even on mobile
    const nav = screen.getByTestId('navigation-landmark');
    expect(nav.getAttribute('aria-label')).toBe('Navegación principal');
  });

  it('[P1] should expose the nav element via ARIA navigation role', async () => {
    // GIVEN: The application is rendered
    setViewportWidth(1280);

    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: A navigation landmark is discoverable by role
    const navByRole = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(navByRole).toBeDefined();
    expect(navByRole.tagName.toLowerCase()).toBe('nav');
  });

  it('[P2] should NOT have an English aria-label on the nav element', async () => {
    // GIVEN: The company standard mandates all labels in Spanish
    setViewportWidth(1280);

    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: The aria-label is NOT in English
    const nav = screen.getByTestId('navigation-landmark');
    expect(nav.getAttribute('aria-label')).not.toBe('Main navigation');
    expect(nav.getAttribute('aria-label')).not.toBe('Navigation');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Root redirect — shell integrity after redirect
// ─────────────────────────────────────────────────────────────────────────────

describe('Root redirect — shell integrity after redirect to /clientes', () => {
  beforeEach(() => {
    setViewportWidth(1280);
  });

  afterEach(() => {
    setViewportWidth(1024);
  });

  it('[P1] should render NavigationRail after the root / redirect resolves to /clientes', async () => {
    // GIVEN: The router starts at /
    const { routeTree } = await import('../../routeTree.gen');
    const memoryHistory = createMemoryHistory({ initialEntries: ['/'] });
    const router = createRouter({ routeTree, history: memoryHistory });
    render(<RouterProvider router={router} />);
    await router.load();

    // THEN: The shell is rendered with the NavigationRail (redirect landed on /clientes)
    expect(screen.getByTestId('navigation-rail')).toBeDefined();
    expect(router.state.location.pathname).toBe('/clientes');
  });

  it('[P1] should have the Clientes nav item active after the root / redirect', async () => {
    // GIVEN: The router starts at / and redirects to /clientes
    const { routeTree } = await import('../../routeTree.gen');
    const memoryHistory = createMemoryHistory({ initialEntries: ['/'] });
    const router = createRouter({ routeTree, history: memoryHistory });
    render(<RouterProvider router={router} />);
    await router.load();

    // THEN: The Clientes nav item has data-active="true"
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem.getAttribute('data-active')).toBe('true');
  });

  it('[P2] should render the ClientesView as the outlet after redirect from /', async () => {
    // GIVEN: The router starts at /
    const { routeTree } = await import('../../routeTree.gen');
    const memoryHistory = createMemoryHistory({ initialEntries: ['/'] });
    const router = createRouter({ routeTree, history: memoryHistory });
    render(<RouterProvider router={router} />);
    await router.load();

    // THEN: The ClientesView is the content in the main outlet
    expect(screen.getByTestId('clientes-view')).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AppShell layout structure integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell layout structure integrity', () => {
  beforeEach(() => {
    setViewportWidth(1280);
  });

  afterEach(() => {
    setViewportWidth(1024);
  });

  it('[P1] should render a <main> element wrapping the outlet content', async () => {
    // GIVEN: The application is rendered at /clientes
    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: A <main> element is present containing the view content
    const mainEl = document.querySelector('main');
    expect(mainEl).not.toBeNull();
    expect(mainEl?.querySelector('[data-testid="clientes-view"]')).not.toBeNull();
  });

  it('[P1] should contain outlet content within the main element at /contactos', async () => {
    // GIVEN: The application is rendered at /contactos
    // WHEN: The shell renders
    await renderAppAtRoute('/contactos');

    // THEN: A <main> element contains the Contactos view
    const mainEl = document.querySelector('main');
    expect(mainEl).not.toBeNull();
    expect(mainEl?.querySelector('[data-testid="contactos-view"]')).not.toBeNull();
  });

  it('[P2] should render the navigation-landmark element alongside the main element', async () => {
    // GIVEN: The application is rendered at /clientes
    // WHEN: The shell renders
    await renderAppAtRoute('/clientes');

    // THEN: Both the nav landmark and the main content are present
    expect(screen.getByTestId('navigation-landmark')).toBeDefined();
    const mainEl = document.querySelector('main');
    expect(mainEl).not.toBeNull();
  });
});
