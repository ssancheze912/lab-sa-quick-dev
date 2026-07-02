/**
 * Story 1.2: Frontend Navigation Shell — AppShell Component Tests
 * ATDD RED Phase — these tests FAIL until AppShell.tsx is implemented.
 *
 * Test cases covered:
 *   [TC-E1-P2-01] desktop viewport renders NavigationRail with Clientes & Contactos
 *   [TC-E1-P2-02] mobile viewport renders NavigationBar (rail hidden)
 *   [TC-E1-P1-01] clicking Contactos from /clientes calls useNavigate({ to: '/contactos' })
 *                 and does NOT call window.location.reload()
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from './AppShell';

// Mock TanStack Router's useNavigate + useRouterState hooks so we can assert on nav intent
// without booting a full router.
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

describe('AppShell', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockPathname = '/clientes';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('[TC-E1-P2-01] Desktop viewport (≥ 1024px)', () => {
    beforeEach(() => {
      // GIVEN: A desktop viewport width (1280px)
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
      window.dispatchEvent(new Event('resize'));
    });

    it('should render the NavigationRail wrapper (data-testid="nav-rail")', () => {
      // WHEN: The shell mounts on desktop
      render(<AppShell />);

      // THEN: The nav-rail wrapper is present in the DOM
      expect(screen.getByTestId('nav-rail')).toBeInTheDocument();
    });

    it('should render the "Clientes" entry inside the NavigationRail', () => {
      // GIVEN: Desktop shell mounted
      render(<AppShell />);

      // WHEN: Reading the rail contents
      const rail = screen.getByTestId('nav-rail');

      // THEN: A "Clientes" nav entry exists inside the rail
      expect(within(rail).getByRole('button', { name: /clientes/i })).toBeInTheDocument();
    });

    it('should render the "Contactos" entry inside the NavigationRail', () => {
      // GIVEN: Desktop shell mounted
      render(<AppShell />);

      // WHEN: Reading the rail contents
      const rail = screen.getByTestId('nav-rail');

      // THEN: A "Contactos" nav entry exists inside the rail
      expect(within(rail).getByRole('button', { name: /contactos/i })).toBeInTheDocument();
    });
  });

  describe('[TC-E1-P2-02] Mobile viewport (< 1024px)', () => {
    it('should render the NavigationBar wrapper (data-testid="nav-bar")', () => {
      // GIVEN: A mobile viewport width (375px)
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });
      window.dispatchEvent(new Event('resize'));

      // WHEN: The shell mounts on mobile
      render(<AppShell />);

      // THEN: The nav-bar wrapper is present in the DOM
      expect(screen.getByTestId('nav-bar')).toBeInTheDocument();
    });
  });

  describe('[TC-E1-P1-01] SPA navigation from /clientes to /contactos', () => {
    it('should call useNavigate with { to: "/contactos" } when the Contactos entry is clicked', async () => {
      // GIVEN: The user is on /clientes with the desktop shell
      mockPathname = '/clientes';
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
      window.dispatchEvent(new Event('resize'));

      const user = userEvent.setup();
      render(<AppShell />);

      // WHEN: The user clicks the Contactos rail entry
      const rail = screen.getByTestId('nav-rail');
      await user.click(within(rail).getByRole('button', { name: /contactos/i }));

      // THEN: useNavigate was invoked with { to: '/contactos' }
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/contactos' });
    });

    it('should NOT call window.location.reload() when navigating between sections', async () => {
      // GIVEN: A spy on window.location.reload
      const reloadSpy = vi.fn();
      const originalReload = window.location.reload;
      Object.defineProperty(window.location, 'reload', {
        configurable: true,
        writable: true,
        value: reloadSpy,
      });

      mockPathname = '/clientes';
      const user = userEvent.setup();
      render(<AppShell />);

      // WHEN: The user clicks the Contactos entry
      const rail = screen.getByTestId('nav-rail');
      await user.click(within(rail).getByRole('button', { name: /contactos/i }));

      // THEN: reload was NOT called (SPA navigation only)
      expect(reloadSpy).not.toHaveBeenCalled();

      // Restore reload
      Object.defineProperty(window.location, 'reload', {
        configurable: true,
        writable: true,
        value: originalReload,
      });
    });
  });
});
