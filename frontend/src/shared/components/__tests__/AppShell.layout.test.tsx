/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — AppShell Layout and URL Variant Edge Cases
 *
 * Coverage focus:
 *   - Main content area is rendered and accessible
 *   - Active state for /clientes with trailing slash
 *   - Active state for /clientes with query parameters
 *   - Active state for /contactos with trailing slash
 *   - Active state for /contactos with query parameters
 *   - Active state at /clientes sub-paths (not currently in edge test)
 *   - Layout structure: nav + main both present in the DOM
 *   - NavigationBar is NOT in the DOM on desktop (not just hidden — CSS hides it, but component renders only one)
 *   - Exact nav-label text "Navegación principal"
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
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
// Layout structure: nav + main
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Layout structure (nav + main)', () => {
  beforeEach(() => setViewportWidth(1280));

  test('should render a <main> element for the content area', () => {
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const main = document.querySelector('main');
    expect(main).toBeInTheDocument();
  });

  test('should render both <nav> and <main> elements simultaneously on desktop', () => {
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(document.querySelector('nav')).toBeInTheDocument();
    expect(document.querySelector('main')).toBeInTheDocument();
  });

  test('should render both <nav> and <main> elements simultaneously on mobile', () => {
    setViewportWidth(390);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(document.querySelector('nav')).toBeInTheDocument();
    expect(document.querySelector('main')).toBeInTheDocument();
  });

  test('nav aria-label is exactly "Navegación principal"', () => {
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const nav = document.querySelector('nav');
    expect(nav!.getAttribute('aria-label')).toBe('Navegación principal');
  });

  test('nav aria-label is "Navegación principal" on mobile too', () => {
    setViewportWidth(390);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    const nav = document.querySelector('nav');
    expect(nav!.getAttribute('aria-label')).toBe('Navegación principal');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Active state: URL variants (trailing slash, query params, sub-paths)
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Active state for URL path variants', () => {
  beforeEach(() => setViewportWidth(1280));

  test('should activate Clientes for /clientes/ (trailing slash)', () => {
    render(<AppShell currentPath="/clientes/"><div /></AppShell>);

    // /clientes/ startsWith('/contactos') is false → defaults to Clientes
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should activate Clientes for /clientes?search=foo (query string)', () => {
    // Path with query string: the component receives the pathname portion
    render(<AppShell currentPath="/clientes?search=foo"><div /></AppShell>);

    // startsWith('/contactos') is false → defaults to Clientes
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });

  test('should activate Contactos for /contactos/ (trailing slash)', () => {
    render(<AppShell currentPath="/contactos/"><div /></AppShell>);

    // /contactos/ startsWith('/contactos') is true
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('aria-current', 'page');
  });

  test('should activate Contactos for /contactos?id=5 (query string)', () => {
    render(<AppShell currentPath="/contactos?id=5"><div /></AppShell>);

    // /contactos?id=5 startsWith('/contactos') is true
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-current', 'page');
  });

  test('should activate Clientes for /clientes/123 (sub-path)', () => {
    render(<AppShell currentPath="/clientes/123"><div /></AppShell>);

    // /clientes/123 does not startWith('/contactos') → defaults to Clientes
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
  });

  test('should NOT activate either specifically for / root path (defaults to Clientes)', () => {
    render(<AppShell currentPath="/"><div /></AppShell>);

    // / does not match /contactos → Clientes is the fallback active item
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('aria-current', 'page');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Desktop vs mobile mutual exclusion: only one nav variant rendered at a time
// ─────────────────────────────────────────────────────────────────────────────

describe('AppShell — Nav mutual exclusion (only one nav rendered)', () => {
  test('on desktop: navigation-rail present, navigation-bar absent from DOM', () => {
    setViewportWidth(1280);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
    expect(screen.queryByTestId('navigation-bar')).not.toBeInTheDocument();
  });

  test('on mobile: navigation-bar present, navigation-rail absent from DOM', () => {
    setViewportWidth(390);
    render(<AppShell currentPath="/clientes"><div /></AppShell>);

    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
    expect(screen.queryByTestId('navigation-rail')).not.toBeInTheDocument();
  });
});
