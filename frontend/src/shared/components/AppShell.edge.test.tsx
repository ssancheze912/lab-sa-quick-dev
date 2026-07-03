/**
 * Story 1.2: Frontend Navigation Shell — AppShell EDGE CASE tests
 * Epic 1: Project Foundation & Application Shell
 *
 * BMad-Integrated Automation Expansion (post-ATDD)
 * ─────────────────────────────────────────────────
 * Complements the ATDD baseline in `AppShell.test.tsx` + `src/test/navigation.test.tsx`
 * with edge cases, negative paths and boundary conditions:
 *   • Initial route resolution (/contactos direct mount)
 *   • Bidirectional in-app navigation (Contactos → Clientes)
 *   • Idempotent navigation (clicking active item is a no-op)
 *   • Query-string tolerance (/clientes?foo=bar)
 *   • Nested unknown route (/clientes/algo) falls through to 404
 *   • Mobile shell navigation via NavigationBar
 *   • Mobile shell 404 rendering
 *   • ARIA landmarks (nav accessible label)
 *
 * Given-When-Then format, atomic assertions, deterministic waits only.
 * No hard timeouts. All tests use in-memory router + jsdom matchMedia shim.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

// ─────────────────────────────────────────────────────────────────────────────
// Viewport / matchMedia helpers (mirror the ATDD helpers so behaviour is stable)
// ─────────────────────────────────────────────────────────────────────────────

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.matchMedia = ((query: string) => {
    const minWidthMatch = /\(min-width:\s*(\d+)px\)/.exec(query);
    const matches = minWidthMatch ? width >= Number(minWidthMatch[1]) : false;
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  }) as typeof window.matchMedia;
  window.dispatchEvent(new Event('resize'));
}

function renderRouterAt(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history: memoryHistory });
  const utils = render(<RouterProvider router={router} />);
  return { ...utils, router };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Desktop viewport — initial route resolution & bidirectional navigation
// AC coverage: AC #1, AC #3
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell edge — Desktop initial routing (≥ 1024px)', () => {
  beforeEach(() => {
    setViewport(1280, 800);
  });

  it('[P1] should render contactos-view directly when router mounts at /contactos', async () => {
    // GIVEN: The router history is seeded with /contactos (deep link)
    // WHEN: The AppShell mounts via _app layout
    renderRouterAt('/contactos');

    // THEN: The Contactos placeholder is rendered without any user interaction
    const contactosView = await screen.findByTestId('contactos-view');
    expect(contactosView).toBeInTheDocument();
  });

  it('[P1] should navigate from /contactos back to /clientes via the rail entry', async () => {
    // GIVEN: The user is currently on /contactos
    const { router } = renderRouterAt('/contactos');
    await screen.findByTestId('contactos-view');

    // WHEN: The user clicks the Clientes nav control in the persistent shell
    const user = userEvent.setup();
    const clientesControl = await screen.findByRole(
      /link|button/ as unknown as 'link',
      { name: /clientes/i },
    );
    await user.click(clientesControl);

    // THEN: The router state updates to /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });
  });

  it('[P2] should render clientes-view after navigating back from /contactos', async () => {
    // GIVEN: Starting on /contactos
    renderRouterAt('/contactos');
    await screen.findByTestId('contactos-view');

    // WHEN: The user clicks Clientes to return
    const user = userEvent.setup();
    const clientesControl = await screen.findByRole(
      /link|button/ as unknown as 'link',
      { name: /clientes/i },
    );
    await user.click(clientesControl);

    // THEN: The Clientes placeholder view is rendered
    const clientesView = await screen.findByTestId('clientes-view');
    expect(clientesView).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Desktop viewport — idempotent navigation & query strings
// AC coverage: AC #1, AC #3
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell edge — Idempotent / query-string navigation (desktop)', () => {
  beforeEach(() => {
    setViewport(1280, 800);
  });

  it('[P2] should stay on /clientes when the user clicks the already-active Clientes entry', async () => {
    // GIVEN: The user is on /clientes
    const { router } = renderRouterAt('/clientes');
    await screen.findByTestId('clientes-view');
    const initialShell = screen.getByTestId('app-shell');

    // WHEN: The user clicks the Clientes entry (already active)
    const user = userEvent.setup();
    const clientesControl = await screen.findByRole(
      /link|button/ as unknown as 'link',
      { name: /clientes/i },
    );
    await user.click(clientesControl);

    // THEN: The router state is still /clientes and the shell is not remounted
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });
    expect(screen.getByTestId('app-shell')).toBe(initialShell);
  });

  it('[P2] should render clientes-view when the URL includes a query string (/clientes?foo=bar)', async () => {
    // GIVEN: A deep link with query parameters
    // WHEN: The router mounts at /clientes?foo=bar
    const { router } = renderRouterAt('/clientes?foo=bar');

    // THEN: The clientes route resolves (query params do not break routing) and the view renders
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });
    expect(await screen.findByTestId('clientes-view')).toBeInTheDocument();
  });

  it('[P2] should preserve the query string in the router state when navigating to /contactos?tab=1', async () => {
    // GIVEN: A contactos deep link with a query parameter
    const { router } = renderRouterAt('/contactos?tab=1');

    // WHEN: The router resolves the route
    await screen.findByTestId('contactos-view');

    // THEN: The pathname matches /contactos AND the search string is preserved
    expect(router.state.location.pathname).toBe('/contactos');
    expect(router.state.location.searchStr).toContain('tab=1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Desktop viewport — nested unknown route → 404 fallback
// AC coverage: AC #4
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell edge — Nested unknown routes (404 fallback)', () => {
  beforeEach(() => {
    setViewport(1280, 800);
  });

  it('[P2] should render NotFoundView for a nested unknown segment (/clientes/algo)', async () => {
    // GIVEN: A URL with an extra segment beneath /clientes (no matching route)
    // WHEN: The router mounts at /clientes/algo
    renderRouterAt('/clientes/algo');

    // THEN: The not-found view is rendered
    const notFound = await screen.findByTestId('not-found-view');
    expect(notFound).toBeInTheDocument();
  });

  it('[P2] should keep the app-shell mounted for the nested unknown route', async () => {
    // GIVEN: A nested unknown URL
    renderRouterAt('/contactos/xyz');
    await screen.findByTestId('not-found-view');

    // WHEN: The 404 renders
    // THEN: The persistent shell wrapper is still present
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('[P1] should recover from 404 by clicking the "Ir a Clientes" CTA', async () => {
    // GIVEN: The user is on the 404 page
    const { router } = renderRouterAt('/ruta-que-no-existe');
    const notFound = await screen.findByTestId('not-found-view');

    // WHEN: The user clicks the "Ir a Clientes" recovery link
    const user = userEvent.setup();
    const cta = within(notFound).getByRole('link', { name: /ir a clientes/i });
    await user.click(cta);

    // THEN: The router state resolves to /clientes and clientes-view renders
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });
    expect(await screen.findByTestId('clientes-view')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile viewport — NavigationBar interaction & mobile 404
// AC coverage: AC #2, AC #4
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell edge — Mobile interaction (< 1024px)', () => {
  beforeEach(() => {
    setViewport(375, 812);
  });

  it('[P1] should render contactos-view directly at /contactos on mobile viewport', async () => {
    // GIVEN: A mobile viewport (375px) with router mounted at /contactos
    // WHEN: The shell resolves
    renderRouterAt('/contactos');

    // THEN: The Contactos placeholder is rendered
    const contactosView = await screen.findByTestId('contactos-view');
    expect(contactosView).toBeInTheDocument();
  });

  it('[P1] should navigate from /contactos to /clientes via the NavigationBar item', async () => {
    // GIVEN: Mobile user on /contactos
    const { router } = renderRouterAt('/contactos');
    await screen.findByTestId('contactos-view');
    const navBar = screen.getByTestId('nav-bar');

    // WHEN: The user taps the Clientes item in the bottom bar
    // (siesa-ui-kit NavigationBar renders each item as a <button aria-label="…">)
    const user = userEvent.setup();
    const clientesTap = within(navBar).getByRole('button', { name: /clientes/i });
    await user.click(clientesTap);

    // THEN: The router pathname updates to /clientes
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });
  });

  it('[P2] should render the clientes-view after mobile navigation to /clientes', async () => {
    // GIVEN: Mobile user on /contactos
    renderRouterAt('/contactos');
    await screen.findByTestId('contactos-view');
    const navBar = screen.getByTestId('nav-bar');

    // WHEN: The user taps Clientes in the bar
    const user = userEvent.setup();
    const clientesTap = within(navBar).getByRole('button', { name: /clientes/i });
    await user.click(clientesTap);

    // THEN: The Clientes placeholder becomes visible
    const clientesView = await screen.findByTestId('clientes-view');
    expect(clientesView).toBeInTheDocument();
  });

  it('[P2] should render NotFoundView inside the mobile shell for an unknown route', async () => {
    // GIVEN: An unknown route opened on mobile
    // WHEN: The router mounts at /pagina-desconocida
    renderRouterAt('/pagina-desconocida');

    // THEN: The not-found view is rendered AND the mobile nav-bar is also present
    // (the shell persists on mobile too — AC #4)
    const notFound = await screen.findByTestId('not-found-view');
    expect(notFound).toBeInTheDocument();
    expect(screen.getByTestId('nav-bar')).toBeInTheDocument();
  });

  it('[P2] should expose a Spanish accessible label on the mobile NavigationBar', async () => {
    // GIVEN: Mobile viewport with the AppShell mounted
    renderRouterAt('/clientes');
    const navBar = await screen.findByTestId('nav-bar');

    // WHEN: The bar renders
    // THEN: A `nav` landmark with the Spanish label "Navegación principal" exists inside it
    // (siesa-ui-kit forwards the aria-label prop onto its nav element)
    const navLandmark = within(navBar).getByRole('navigation', {
      name: /navegación principal/i,
    });
    expect(navLandmark).toBeInTheDocument();
  });

  it('[P3] should mount the same AppShell across mobile route changes (shell persistence)', async () => {
    // GIVEN: Mobile user on /clientes
    const { router } = renderRouterAt('/clientes');
    const initialShell = await screen.findByTestId('app-shell');

    // WHEN: The user navigates to /contactos via the bar
    const user = userEvent.setup();
    const navBar = screen.getByTestId('nav-bar');
    const contactosTap = within(navBar).getByRole('button', {
      name: /contactos/i,
    });
    await user.click(contactosTap);
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos');
    });

    // THEN: The same AppShell node is still in the DOM (no full remount)
    expect(screen.getByTestId('app-shell')).toBe(initialShell);
  });
});
