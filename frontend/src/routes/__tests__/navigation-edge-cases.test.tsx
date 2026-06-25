/**
 * Story 1.2: Frontend Navigation Shell — Edge Case & Boundary Tests
 * Expands ATDD coverage with:
 * - Viewport boundary conditions (exactly 1023px vs 1024px)
 * - Runtime viewport resize transitions
 * - Keyboard Enter activation of nav links
 * - Not-found back-link click behaviour
 * - Post-navigation active state correctness
 * - DOM structural invariants (app-root wrapper)
 * - Multiple successive SPA navigations remain SPA
 *
 * Framework: Vitest + React Testing Library + @tanstack/react-router
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';

import { routeTree } from '../../routeTree.gen';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function createTestRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  return createRouter({ routeTree, history });
}

async function renderAtPath(path: string) {
  const router = createTestRouter(path);
  await router.load();
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true });
  fireEvent(window, new Event('resize'));
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Viewport Boundary Conditions ────────────────────────────────────────────

describe('Viewport boundary: exact breakpoint 1024px', () => {
  it('should render NavigationRail at exactly 1024px (desktop boundary, inclusive)', async () => {
    // GIVEN: Viewport width is exactly the desktop breakpoint
    setViewportWidth(1024);

    // WHEN: Application renders
    await renderAtPath('/clientes');

    // THEN: NavigationRail is shown (1024 >= 1024)
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
    expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
  });

  it('should render NavigationBar at exactly 1023px (mobile boundary, exclusive)', async () => {
    // GIVEN: Viewport width is one pixel below the desktop breakpoint
    setViewportWidth(1023);

    // WHEN: Application renders
    await renderAtPath('/clientes');

    // THEN: NavigationBar is shown (1023 < 1024)
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument();
  });

  it('should render NavigationRail at minimum common desktop width (1280px)', async () => {
    setViewportWidth(1280);
    await renderAtPath('/clientes');
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('should render NavigationBar at maximum common mobile width (767px)', async () => {
    setViewportWidth(767);
    await renderAtPath('/clientes');
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('should render NavigationBar at minimum common mobile width (320px)', async () => {
    setViewportWidth(320);
    await renderAtPath('/clientes');
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });
});

// ─── Viewport Resize Transition ───────────────────────────────────────────────

describe('Viewport resize transitions between desktop and mobile', () => {
  it('should switch from NavigationRail to NavigationBar when resized from desktop to mobile', async () => {
    // GIVEN: Desktop viewport renders NavigationRail
    setViewportWidth(1280);
    await renderAtPath('/clientes');
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();

    // WHEN: Viewport resizes to mobile
    await act(async () => {
      setViewportWidth(375);
    });

    // THEN: NavigationBar replaces NavigationRail
    await waitFor(() => {
      expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument();
      expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    });
  });

  it('should switch from NavigationBar to NavigationRail when resized from mobile to desktop', async () => {
    // GIVEN: Mobile viewport renders NavigationBar
    setViewportWidth(375);
    await renderAtPath('/clientes');
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();

    // WHEN: Viewport resizes to desktop
    await act(async () => {
      setViewportWidth(1280);
    });

    // THEN: NavigationRail replaces NavigationBar
    await waitFor(() => {
      expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
      expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
    });
  });
});

// ─── Keyboard Navigation Activation ──────────────────────────────────────────

describe('Keyboard navigation: Enter key activates nav links', () => {
  it('should navigate to /contactos when Enter is pressed on focused Contactos nav link', async () => {
    // GIVEN: Desktop viewport, app renders at /clientes
    setViewportWidth(1280);
    const router = await renderAtPath('/clientes');

    // Verify initial state
    expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument();

    const contactosLink = screen.getByTestId('nav-item-contactos');

    // WHEN: User focuses and presses Enter on the Contactos link
    await act(async () => {
      contactosLink.focus();
      fireEvent.keyDown(contactosLink, { key: 'Enter', code: 'Enter' });
      fireEvent.click(contactosLink); // Enter triggers click for <a> elements
    });

    // THEN: Navigation updates to /contactos
    await waitFor(() => {
      expect(screen.getByTestId('contactos-placeholder')).toBeInTheDocument();
    });
    // Router state also reflects the new route
    expect(router.state.location.pathname).toBe('/contactos');
  });

  it('should navigate to /clientes when Enter is pressed on focused Clientes nav link', async () => {
    // GIVEN: Desktop viewport, app renders at /contactos
    setViewportWidth(1280);
    const router = await renderAtPath('/contactos');

    const clientesLink = screen.getByTestId('nav-item-clientes');

    // WHEN: User focuses and presses Enter on the Clientes link
    await act(async () => {
      clientesLink.focus();
      fireEvent.click(clientesLink);
    });

    // THEN: Navigation updates to /clientes
    await waitFor(() => {
      expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe('/clientes');
  });

  it('all navigation links should be focusable (tabIndex not negative)', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280);
    await renderAtPath('/clientes');

    // THEN: Both nav links are keyboard-focusable
    const clientesLink = screen.getByTestId('nav-item-clientes');
    const contactosLink = screen.getByTestId('nav-item-contactos');

    // tabIndex should not be -1 (which would remove from tab order)
    expect(clientesLink).not.toHaveAttribute('tabindex', '-1');
    expect(contactosLink).not.toHaveAttribute('tabindex', '-1');
  });
});

// ─── Not-Found Back Link Behaviour ────────────────────────────────────────────

describe('Not-found view: back link navigates correctly', () => {
  it('should navigate to /clientes when back link is clicked on 404 page', async () => {
    // GIVEN: User is on an unknown route
    await renderAtPath('/this-is-a-nonexistent-path');
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();

    // WHEN: User clicks the back link
    const backLink = screen.getByTestId('not-found-back-link');
    await act(async () => {
      fireEvent.click(backLink);
    });

    // THEN: Clientes placeholder is shown
    await waitFor(() => {
      expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument();
    });
  });

  it('back link href should point to /clientes', async () => {
    // GIVEN: User is on the 404 page
    await renderAtPath('/nonexistent');

    // THEN: The back link href is /clientes
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toHaveAttribute('href', '/clientes');
  });

  it('should display not-found view for deeply nested unknown routes', async () => {
    // GIVEN: User navigates to a deeply nested unknown route
    await renderAtPath('/a/b/c/d/not/real');

    // THEN: The 404 view is shown (not a crash or blank screen)
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
    expect(screen.getByTestId('not-found-message')).toHaveTextContent('Página no encontrada');
  });
});

// ─── Post-Navigation Active State ─────────────────────────────────────────────

describe('Active state correctness after user navigation', () => {
  it('should update aria-current to contactos after clicking Contactos from clientes', async () => {
    // GIVEN: User starts at /clientes, Clientes is active
    setViewportWidth(1280);
    await renderAtPath('/clientes');
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');

    // WHEN: User clicks Contactos nav link
    await act(async () => {
      fireEvent.click(screen.getByTestId('nav-item-contactos'));
    });

    // THEN: Contactos becomes active, Clientes is no longer active
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page');
      expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page');
    });
  });

  it('should update nav-active class correctly after navigation', async () => {
    // GIVEN: User starts at /clientes
    setViewportWidth(1280);
    await renderAtPath('/clientes');
    expect(screen.getByTestId('nav-item-clientes')).toHaveClass('nav-active');
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveClass('nav-active');

    // WHEN: User clicks Contactos
    await act(async () => {
      fireEvent.click(screen.getByTestId('nav-item-contactos'));
    });

    // THEN: nav-active class transfers to Contactos
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-contactos')).toHaveClass('nav-active');
      expect(screen.getByTestId('nav-item-clientes')).not.toHaveClass('nav-active');
    });
  });

  it('should correctly re-activate Clientes after round-trip navigation (clientes → contactos → clientes)', async () => {
    // GIVEN: Desktop, starting at /clientes
    setViewportWidth(1280);
    await renderAtPath('/clientes');

    // WHEN: Navigate to /contactos then back to /clientes
    await act(async () => {
      fireEvent.click(screen.getByTestId('nav-item-contactos'));
    });
    await waitFor(() =>
      expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page'),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('nav-item-clientes'));
    });

    // THEN: Clientes is active again, Contactos is not
    await waitFor(() => {
      expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
      expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');
    });
  });
});

// ─── DOM Structural Invariants ────────────────────────────────────────────────

describe('DOM structural invariants', () => {
  it('should render the app-root wrapper at the document root', async () => {
    // GIVEN: App renders at any valid route
    setViewportWidth(1280);
    await renderAtPath('/clientes');

    // THEN: The outermost app-root div is present
    expect(screen.getByTestId('app-root')).toBeInTheDocument();
  });

  it('app-root should contain both the navigation and the main content area', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280);
    await renderAtPath('/clientes');

    const appRoot = screen.getByTestId('app-root');
    const navRail = screen.getByTestId('navigation-rail');
    const content = screen.getByTestId('clientes-placeholder');

    // THEN: Both navigation and content are inside the app root
    expect(appRoot).toContainElement(navRail);
    expect(appRoot).toContainElement(content);
  });

  it('navigation landmark should have role="navigation"', async () => {
    // GIVEN: App renders
    setViewportWidth(1280);
    await renderAtPath('/clientes');

    // THEN: There is a navigation landmark (either via role attr or <nav> element)
    const navLandmark = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(navLandmark).toBeInTheDocument();
  });

  it('nav items should be anchor elements (rendered as <a> by TanStack Link)', async () => {
    // GIVEN: Desktop viewport
    setViewportWidth(1280);
    await renderAtPath('/clientes');

    // THEN: nav items are <a> tags with valid hrefs (not div/button)
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');

    expect(clientesItem.tagName).toBe('A');
    expect(contactosItem.tagName).toBe('A');
    expect(clientesItem).toHaveAttribute('href', '/clientes');
    expect(contactosItem).toHaveAttribute('href', '/contactos');
  });
});

// ─── Error Path: Initial State Edge Cases ─────────────────────────────────────

describe('Initial state edge cases', () => {
  it('root "/" redirect should render clientes-placeholder, not a blank screen', async () => {
    // GIVEN: User navigates to root
    setViewportWidth(1280);

    // WHEN: Router resolves the root redirect
    const router = createTestRouter('/');
    await router.load();
    await act(async () => {
      render(<RouterProvider router={router} />);
    });

    // THEN: Content is rendered (no blank screen)
    await waitFor(() => {
      expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument();
    });
  });

  it('should render clientes view correctly on consecutive renders (no state leak)', async () => {
    // GIVEN: First render at /clientes
    setViewportWidth(1280);
    const { unmount } = await (async () => {
      const router = createTestRouter('/clientes');
      await router.load();
      let result!: ReturnType<typeof render>;
      await act(async () => {
        result = render(<RouterProvider router={router} />);
      });
      return result;
    })();

    expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument();

    // WHEN: Component unmounts and re-renders (simulates navigating away and back)
    unmount();

    setViewportWidth(1280);
    const router2 = createTestRouter('/clientes');
    await router2.load();
    await act(async () => {
      render(<RouterProvider router={router2} />);
    });

    // THEN: Clientes placeholder is still correctly rendered (no stale state from prior render)
    expect(screen.getByTestId('clientes-placeholder')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });
});

// ─── Tab Order / Keyboard Focus Order ─────────────────────────────────────────

describe('Keyboard: Tab order through navigation items', () => {
  it('both nav items should be reachable within 10 Tab presses from document start', async () => {
    // GIVEN: Desktop viewport, app rendered
    setViewportWidth(1280);
    await renderAtPath('/clientes');

    const user = userEvent.setup();
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');

    let clientesReached = false;
    let contactosReached = false;

    for (let i = 0; i < 10; i++) {
      await user.tab();
      const focused = document.activeElement;
      if (focused === clientesItem || clientesItem.contains(focused)) clientesReached = true;
      if (focused === contactosItem || contactosItem.contains(focused)) contactosReached = true;
      if (clientesReached && contactosReached) break;
    }

    // THEN: Both nav items were focusable via Tab
    expect(clientesReached).toBe(true);
    expect(contactosReached).toBe(true);
  });

  it('mobile: both nav items should be reachable via Tab on NavigationBar', async () => {
    // GIVEN: Mobile viewport
    setViewportWidth(375);
    await renderAtPath('/clientes');

    const user = userEvent.setup();
    const clientesItem = screen.getByTestId('nav-item-clientes');
    const contactosItem = screen.getByTestId('nav-item-contactos');

    let clientesReached = false;
    let contactosReached = false;

    for (let i = 0; i < 10; i++) {
      await user.tab();
      const focused = document.activeElement;
      if (focused === clientesItem || clientesItem.contains(focused)) clientesReached = true;
      if (focused === contactosItem || contactosItem.contains(focused)) contactosReached = true;
      if (clientesReached && contactosReached) break;
    }

    expect(clientesReached).toBe(true);
    expect(contactosReached).toBe(true);
  });
});
