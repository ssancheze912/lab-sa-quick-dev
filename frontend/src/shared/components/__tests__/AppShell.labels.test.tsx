/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — AppShell Labels and Nav Item Count
 *
 * Coverage focus:
 *   - Spanish labels visible in both desktop and mobile layouts
 *   - Navigation item count (exactly 2: Clientes and Contactos)
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { AppShell } from '../AppShell';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    'aria-current': ariaCurrent,
    'aria-label': ariaLabel,
    'data-testid': dataTestId,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    'aria-current'?: string;
    'aria-label'?: string;
    'data-testid'?: string;
    [key: string]: unknown;
  }) => (
    <a
      href={to}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      {...props}
    >
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet-placeholder" />,
  useRouterState: () => ({
    location: { pathname: '/clientes' },
  }),
}));

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Spanish label visibility in both layouts
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Spanish labels visible in both layouts', () => {
  test('Spanish labels are visible in desktop NavigationRail', () => {
    setViewportWidth(1280);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });

  test('Spanish labels are visible in mobile NavigationBar', () => {
    setViewportWidth(390);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Nav items count — no extra items rendered
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Navigation item count', () => {
  test('desktop nav renders exactly 2 navigation items', () => {
    setViewportWidth(1280);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const nav = document.querySelector('nav');
    const navLinks = nav!.querySelectorAll('a');
    expect(navLinks.length).toBe(2);
  });

  test('mobile nav renders exactly 2 navigation items', () => {
    setViewportWidth(390);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const nav = document.querySelector('nav');
    const navLinks = nav!.querySelectorAll('a');
    expect(navLinks.length).toBe(2);
  });
});
