/**
 * Story 1.2 — BMad Automate Expansion (Component-level edge cases)
 *
 * Extends the ATDD suite in `AppShell.test.tsx` with edge cases and
 * negative paths that acceptance-level tests do NOT cover:
 *
 *  - Unknown pathname → activeId undefined (no crash)
 *  - Outlet renders inside AppShell (main content region present)
 *  - NavigationBar exposes ariaLabel="Navegación principal"
 *  - Clicking the Contactos entry inside the mobile NavigationBar
 *    also invokes useNavigate (mobile flow parity with desktop rail)
 *  - Clicking an already-active entry still calls navigate (idempotent)
 *  - Rail and Bar both render markup (visibility is CSS-only responsibility)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from './AppShell';

const mockNavigate = vi.fn();
let mockPathname = '/clientes';

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useRouterState: (opts?: { select?: (s: { location: { pathname: string } }) => unknown }) => {
      const state = { location: { pathname: mockPathname } };
      return opts?.select ? opts.select(state) : state;
    },
    Outlet: () => <div data-testid="outlet-stub" />,
  };
});

describe('AppShell — edge cases', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPathname = '/clientes';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('[P1] Unknown pathname (activeId = undefined)', () => {
    it('should render without crashing when the pathname does not match any nav item', () => {
      // GIVEN: The router is at a pathname outside the nav catalogue (e.g. 404 route)
      mockPathname = '/ruta-que-no-existe';

      // WHEN: The shell mounts
      const { container } = render(<AppShell />);

      // THEN: Both rail and bar wrappers render, no exception is thrown, and
      // nav items remain accessible so the user can escape the 404
      expect(container).toBeTruthy();
      expect(screen.getByTestId('nav-rail')).toBeInTheDocument();
      expect(screen.getByTestId('nav-bar')).toBeInTheDocument();
      const rail = screen.getByTestId('nav-rail');
      expect(within(rail).getByRole('button', { name: /clientes/i })).toBeInTheDocument();
    });
  });

  describe('[P1] Outlet renders inside AppShell (main content region)', () => {
    it('should render the router Outlet stub inside a <main> region', () => {
      // GIVEN: The shell composes an <Outlet /> as the main content slot
      render(<AppShell />);

      // WHEN: We look up the Outlet stub
      const outlet = screen.getByTestId('outlet-stub');

      // THEN: The stub is nested under a <main> ancestor (accessibility landmark)
      expect(outlet).toBeInTheDocument();
      const main = outlet.closest('main');
      expect(main).not.toBeNull();
    });
  });

  describe('[P2] Mobile NavigationBar wiring', () => {
    it('should call useNavigate with { to: "/contactos" } when the mobile bar Contactos entry is clicked', async () => {
      // GIVEN: The user is on /clientes (bar is rendered in the DOM regardless of viewport — only CSS hides it)
      mockPathname = '/clientes';
      const user = userEvent.setup();
      render(<AppShell />);

      // WHEN: The user clicks the Contactos entry inside the NavigationBar
      const bar = screen.getByTestId('nav-bar');
      await user.click(within(bar).getByRole('button', { name: /contactos/i }));

      // THEN: useNavigate was invoked with { to: '/contactos' } (parity with rail)
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/contactos' });
    });

    it('should expose ariaLabel "Navegación principal" on the NavigationBar wrapper for a11y', () => {
      // GIVEN: The mobile bar renders
      render(<AppShell />);

      // WHEN: We look inside the nav-bar wrapper for an element carrying the Spanish label
      const bar = screen.getByTestId('nav-bar');
      const labelled = bar.querySelector('[aria-label="Navegación principal"]');

      // THEN: siesa-ui-kit's NavigationBar carries aria-label="Navegación principal"
      expect(labelled).not.toBeNull();
    });
  });

  describe('[P2] Idempotent nav to active route', () => {
    it('should still invoke useNavigate when the user clicks the already-active Clientes entry', async () => {
      // GIVEN: The user is already on /clientes
      mockPathname = '/clientes';
      const user = userEvent.setup();
      render(<AppShell />);

      // WHEN: The user clicks the active Clientes rail entry (idempotent action)
      const rail = screen.getByTestId('nav-rail');
      await user.click(within(rail).getByRole('button', { name: /clientes/i }));

      // THEN: navigate is called with { to: '/clientes' } — no throw, no early return
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/clientes' });
    });
  });

  describe('[P2] Both nav shells are always mounted (CSS-driven visibility)', () => {
    it('should render both nav-rail and nav-bar wrappers in the DOM simultaneously', () => {
      // GIVEN: The implementation uses Tailwind `hidden lg:flex` / `lg:hidden` for viewport swap
      // WHEN: The shell mounts (in jsdom, matchMedia is not available so we can't rely on real breakpoints)
      render(<AppShell />);

      // THEN: Both wrappers exist so CSS can toggle visibility per viewport
      expect(screen.getByTestId('nav-rail')).toBeInTheDocument();
      expect(screen.getByTestId('nav-bar')).toBeInTheDocument();
    });

    it('should apply the responsive visibility classes required by AC #1 and AC #2', () => {
      // GIVEN: The shell mounts
      render(<AppShell />);

      // WHEN: We inspect the class list of both wrappers
      const rail = screen.getByTestId('nav-rail');
      const bar = screen.getByTestId('nav-bar');

      // THEN: The rail is desktop-only (`hidden lg:flex`) and the bar is mobile-only (`lg:hidden`)
      // These classes are the deterministic viewport-swap signal for AC #1 and AC #2 in jsdom.
      expect(rail.className).toMatch(/\bhidden\b/);
      expect(rail.className).toMatch(/\blg:flex\b/);
      expect(bar.className).toMatch(/\blg:hidden\b/);
    });
  });

  describe('[P2] SPA discipline — navigation never touches window.location.href', () => {
    it('should not assign to window.location.href when clicking any nav entry', async () => {
      // GIVEN: A getter/setter spy on window.location.href
      const hrefSetter = vi.fn();
      const originalHref = window.location.href;
      Object.defineProperty(window.location, 'href', {
        configurable: true,
        get: () => originalHref,
        set: hrefSetter,
      });

      const user = userEvent.setup();
      render(<AppShell />);

      // WHEN: The user clicks the Contactos entry
      const rail = screen.getByTestId('nav-rail');
      await user.click(within(rail).getByRole('button', { name: /contactos/i }));

      // THEN: navigate was called AND window.location.href was NOT assigned
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/contactos' });
      expect(hrefSetter).not.toHaveBeenCalled();

      // Restore
      Object.defineProperty(window.location, 'href', {
        configurable: true,
        writable: true,
        value: originalHref,
      });
    });
  });
});
