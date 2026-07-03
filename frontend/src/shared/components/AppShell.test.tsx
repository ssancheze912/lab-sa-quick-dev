/**
 * Story 1.2: Frontend Navigation Shell — AppShell component tests
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests will fail until AppShell is implemented (Task 1) AND
 * Vitest + jsdom is configured (Task 7).
 *
 * Test cases covered:
 *   TC-E1-P2-01 — NavigationRail visible on desktop viewport (1280px)
 *   TC-E1-P2-02 — NavigationBar visible on mobile viewport (375px);
 *                 NavigationRail hidden (Tailwind `hidden lg:block` cascade).
 *
 * Given-When-Then structure. One assertion per test (atomic).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
} from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

/**
 * Set the jsdom viewport and refresh matchMedia to match Tailwind's `lg` breakpoint (1024px).
 * The test setup file (src/test/setup.ts, added in Task 7) is expected to shim window.matchMedia.
 */
function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Tailwind media query resolution — the shim in src/test/setup.ts must honour min-width queries.
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

/**
 * Renders the router at a given path using an in-memory history. This exercises the real
 * AppShell composition (via `_app.tsx`) without hitting the network.
 */
function renderRouterAt(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] });
  const router = createRouter({ routeTree, history: memoryHistory });
  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P2-01 — NavigationRail visible at desktop viewport (1280px)
// AC covered: AC #1
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Desktop viewport (≥ 1024px)', () => {
  beforeEach(() => {
    setViewport(1280, 800);
  });

  it('TC-E1-P2-01 — should render the desktop nav-rail wrapper when viewport is 1280px', async () => {
    // GIVEN: The window is set to 1280x800 (desktop)
    // WHEN: The router is rendered at /clientes (which uses the _app layout with AppShell)
    renderRouterAt('/clientes');

    // THEN: The desktop NavigationRail wrapper is in the DOM
    const rail = await screen.findByTestId('nav-rail');
    expect(rail).toBeInTheDocument();
  });

  it('TC-E1-P2-01 — should mount the persistent AppShell wrapper on desktop', async () => {
    // GIVEN: Desktop viewport
    // WHEN: Rendering at /clientes
    renderRouterAt('/clientes');

    // THEN: The AppShell wrapper is mounted
    const shell = await screen.findByTestId('app-shell');
    expect(shell).toBeInTheDocument();
  });

  it('TC-E1-P2-01 — should include a "Clientes" nav entry in the NavigationRail', async () => {
    // GIVEN: Desktop viewport with NavigationRail rendered
    // WHEN: The rail composes the two nav items
    renderRouterAt('/clientes');
    const rail = await screen.findByTestId('nav-rail');

    // THEN: A Clientes-labelled control is present in the rail
    // (accessible name may come from aria-label or visible text — both are acceptable)
    expect(rail.textContent ?? '').toMatch(/clientes/i);
  });

  it('TC-E1-P2-01 — should include a "Contactos" nav entry in the NavigationRail', async () => {
    // GIVEN: Desktop viewport with NavigationRail rendered
    // WHEN: The rail composes the two nav items
    renderRouterAt('/clientes');
    const rail = await screen.findByTestId('nav-rail');

    // THEN: A Contactos-labelled control is present in the rail
    expect(rail.textContent ?? '').toMatch(/contactos/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E1-P2-02 — NavigationBar visible at mobile viewport (375px);
// NavigationRail hidden.
// AC covered: AC #2
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Mobile viewport (< 1024px)', () => {
  beforeEach(() => {
    setViewport(375, 812);
  });

  it('TC-E1-P2-02 — should render the mobile nav-bar wrapper when viewport is 375px', async () => {
    // GIVEN: Mobile viewport (375px width)
    // WHEN: Rendering at /clientes
    renderRouterAt('/clientes');

    // THEN: The mobile NavigationBar wrapper is present
    const navBar = await screen.findByTestId('nav-bar');
    expect(navBar).toBeInTheDocument();
  });

  it('TC-E1-P2-02 — should hide the desktop nav-rail wrapper on mobile', async () => {
    // GIVEN: Mobile viewport
    // WHEN: Rendering at /clientes
    renderRouterAt('/clientes');

    // THEN: If the rail is in the DOM at all, it carries the `hidden` Tailwind class
    // (per Task 1: outer wrapper has `hidden lg:block`).
    const rail = screen.queryByTestId('nav-rail');
    if (rail !== null) {
      expect(rail.className).toMatch(/(^|\s)hidden(\s|$)/);
    } else {
      // Alternatively, implementation may omit the rail entirely under lg — that is also acceptable.
      expect(rail).toBeNull();
    }
  });

  it('TC-E1-P2-02 — should render two NavigationBar items with Spanish accessible labels', async () => {
    // GIVEN: Mobile viewport, NavigationBar rendered with Clientes + Contactos
    // WHEN: The bar composes items
    renderRouterAt('/clientes');
    const bar = await screen.findByTestId('nav-bar');

    // THEN: Both Spanish labels are present
    expect(bar.textContent ?? '').toMatch(/clientes/i);
    expect(bar.textContent ?? '').toMatch(/contactos/i);
  });
});
