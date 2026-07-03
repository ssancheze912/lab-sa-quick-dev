/**
 * Story 1.2: Frontend Navigation Shell — Router-level Vitest tests
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests will fail until Story 1.2 is implemented AND jsdom+Vitest is set up (Task 7).
 *
 * Test cases covered:
 *   TC-E1-P1-01 — SPA navigation between Clientes and Contactos with NO full page reload
 *   TC-E1-P1-04 — 404 not-found view renders inside persistent shell for unknown route
 *   TC-E1-P2-03 — Index `/` redirects to `/clientes`
 *
 * ACs covered: AC #1, AC #3, AC #4, AC #5, AC #8
 *
 * Given-When-Then + one assertion per test.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

/**
 * Shim window.matchMedia with a desktop-default (≥ lg 1024px) resolver.
 * This is the assumed jsdom shape once Task 7 installs @/test/setup.ts,
 * but we redefine per-suite for safety.
 */
function useDesktopMatchMedia() {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  window.matchMedia = ((query: string) => {
    const minWidthMatch = /\(min-width:\s*(\d+)px\)/.exec(query);
    const matches = minWidthMatch ? 1280 >= Number(minWidthMatch[1]) : false;
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
}

function renderRouterAt(path: string) {
  useDesktopMatchMedia();
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
// TC-E1-P1-01 — SPA navigation, no full page reload
// AC covered: AC #1
// ─────────────────────────────────────────────────────────────────────────────

describe('SPA navigation — no full page reload (TC-E1-P1-01)', () => {
  it('should navigate from /clientes to /contactos via router (no window.location.reload)', async () => {
    // GIVEN: The user starts on /clientes and location.reload is spied
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const { router } = renderRouterAt('/clientes');
    await screen.findByTestId('clientes-view');

    // WHEN: The user clicks the Contactos nav entry
    const user = userEvent.setup();
    const contactosControl = await screen.findByRole(
      /link|button/ as unknown as 'link',
      { name: /contactos/i },
    );
    await user.click(contactosControl);

    // THEN: URL updates to /contactos AND window.location.reload was never called
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/contactos');
    });
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('should render the Contactos view after in-app navigation from /clientes', async () => {
    // GIVEN: The user is on /clientes
    renderRouterAt('/clientes');
    await screen.findByTestId('clientes-view');

    // WHEN: The user clicks the Contactos nav entry
    const user = userEvent.setup();
    const contactosControl = await screen.findByRole(
      /link|button/ as unknown as 'link',
      { name: /contactos/i },
    );
    await user.click(contactosControl);

    // THEN: The Contactos placeholder view is rendered
    const contactosView = await screen.findByTestId('contactos-view');
    expect(contactosView).toBeInTheDocument();
  });

  it('should keep the persistent AppShell mounted across route changes', async () => {
    // GIVEN: The user is on /clientes; the shell renders once
    renderRouterAt('/clientes');
    const initialShell = await screen.findByTestId('app-shell');
    expect(initialShell).toBeInTheDocument();

    // WHEN: The user navigates to /contactos
    const user = userEvent.setup();
    const contactosControl = await screen.findByRole(
      /link|button/ as unknown as 'link',
      { name: /contactos/i },
    );
    await user.click(contactosControl);
    await screen.findByTestId('contactos-view');

    // THEN: The same AppShell element is still in the DOM (not unmounted)
    const stillShell = screen.getByTestId('app-shell');
    expect(stillShell).toBe(initialShell);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P1-04 — 404 fallback renders within persistent shell
// AC covered: AC #4
// ─────────────────────────────────────────────────────────────────────────────

describe('404 not-found view within persistent shell (TC-E1-P1-04)', () => {
  it('should render NotFoundView for an unknown route', async () => {
    // GIVEN: The router is rendered at an unknown route
    renderRouterAt('/ruta-que-no-existe');

    // WHEN: The router resolves and falls through to notFoundComponent
    // THEN: The NotFoundView is rendered
    const notFound = await screen.findByTestId('not-found-view');
    expect(notFound).toBeInTheDocument();
  });

  it('should keep the AppShell mounted while showing the 404', async () => {
    // GIVEN: An unknown route is opened
    renderRouterAt('/ruta-que-no-existe');
    await screen.findByTestId('not-found-view');

    // WHEN: The 404 view is shown
    // THEN: The AppShell wrapper is still in the DOM
    expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  });

  it('should display the Spanish "La página solicitada no existe" copy', async () => {
    // GIVEN: An unknown route is opened
    renderRouterAt('/ruta-que-no-existe');

    // WHEN: The NotFoundView renders
    const notFound = await screen.findByTestId('not-found-view');

    // THEN: The Spanish 404 message is present
    expect(notFound.textContent ?? '').toMatch(/la página solicitada no existe/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P2-03 — Index route redirects to /clientes
// AC covered: AC #5
// ─────────────────────────────────────────────────────────────────────────────

describe('Index redirect to /clientes (TC-E1-P2-03)', () => {
  it('should redirect from `/` to `/clientes` via beforeLoad', async () => {
    // GIVEN: The router mounts at `/`
    const { router } = renderRouterAt('/');

    // WHEN: The beforeLoad redirect resolves
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/clientes');
    });

    // THEN: The Clientes view is rendered — proving redirect was in-app (no window.location)
    const clientesView = await screen.findByTestId('clientes-view');
    expect(clientesView).toBeInTheDocument();
  });

  it('should not render any landing content at `/` (no pre-redirect flash)', async () => {
    // GIVEN: index.tsx has NO component export — only `beforeLoad → throw redirect(...)`
    // WHEN: Rendering at `/`
    renderRouterAt('/');
    await screen.findByTestId('clientes-view');

    // THEN: The old placeholder text from Story 1.1's index route is NOT present
    expect(
      screen.queryByText(/aplicación inicializada\. las funcionalidades/i),
    ).toBeNull();
  });
});
