/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Desktop NavigationRail visible with Clientes/Contactos; SPA navigation (FR28)
 *   AC3 — Direct URL /clientes renders Clientes view with active highlight (FR30)
 *   AC4 — Direct URL /contactos renders Contactos view with active highlight (FR30)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// NOTE: These imports will fail until implementation is complete (RED phase).
// Components under test — to be created in Story 1.2 implementation.
import { NavigationRail } from '../../../shared/components/ui/NavigationRail';
import { ClientesShellView } from '../../../modules/crm/clientes/presentation/components/ClientesShellView';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — NavigationRail renders correct entries at desktop viewport
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — NavigationRail at desktop viewport (>= 1024px)', () => {
  it('should render the NavigationRail component', () => {
    // GIVEN: The application layout renders at desktop width
    render(<NavigationRail />);

    // WHEN: Component renders

    // THEN: The navigation rail element is present in the DOM
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('should display the "Clientes" navigation entry', () => {
    // GIVEN: The NavigationRail is rendered
    render(<NavigationRail />);

    // WHEN: Component renders

    // THEN: "Clientes" nav item is visible
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should display the "Contactos" navigation entry', () => {
    // GIVEN: The NavigationRail is rendered
    render(<NavigationRail />);

    // WHEN: Component renders

    // THEN: "Contactos" nav item is visible
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  it('should have accessible aria-label on "Clientes" nav item in Spanish', () => {
    // GIVEN: The NavigationRail is rendered
    render(<NavigationRail />);

    // WHEN: Component renders

    // THEN: "Clientes" item has aria-label in Spanish (WCAG 2.1 AA)
    const clientesItem = screen.getByTestId('nav-item-clientes');
    expect(clientesItem).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  it('should have accessible aria-label on "Contactos" nav item in Spanish', () => {
    // GIVEN: The NavigationRail is rendered
    render(<NavigationRail />);

    // WHEN: Component renders

    // THEN: "Contactos" item has aria-label in Spanish (WCAG 2.1 AA)
    const contactosItem = screen.getByTestId('nav-item-contactos');
    expect(contactosItem).toHaveAttribute('aria-label', 'Ir a Contactos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Active route highlight on NavigationRail
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 / AC3 — Active route highlight in NavigationRail', () => {
  it('should highlight "Clientes" as active when activeRoute is /clientes', () => {
    // GIVEN: NavigationRail rendered with /clientes as the active route
    render(<NavigationRail activeRoute="/clientes" />);

    // WHEN: Component renders with active route prop

    // THEN: "Clientes" item has data-active="true"
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
  });

  it('should NOT highlight "Contactos" as active when activeRoute is /clientes', () => {
    // GIVEN: NavigationRail rendered with /clientes as the active route
    render(<NavigationRail activeRoute="/clientes" />);

    // WHEN: Component renders

    // THEN: "Contactos" item does NOT have data-active="true"
    expect(screen.getByTestId('nav-item-contactos')).not.toHaveAttribute('data-active', 'true');
  });

  it('should highlight "Contactos" as active when activeRoute is /contactos', () => {
    // GIVEN: NavigationRail rendered with /contactos as the active route
    render(<NavigationRail activeRoute="/contactos" />);

    // WHEN: Component renders with active route prop

    // THEN: "Contactos" item has data-active="true"
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true');
  });

  it('should NOT highlight "Clientes" as active when activeRoute is /contactos', () => {
    // GIVEN: NavigationRail rendered with /contactos as the active route
    render(<NavigationRail activeRoute="/contactos" />);

    // WHEN: Component renders

    // THEN: "Clientes" item does NOT have data-active="true"
    expect(screen.getByTestId('nav-item-clientes')).not.toHaveAttribute('data-active', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — ClientesShellView renders correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — ClientesShellView component renders correctly', () => {
  it('should render the ClientesShellView with correct data-testid', () => {
    // GIVEN: ClientesShellView is mounted
    render(<ClientesShellView />);

    // WHEN: Component renders

    // THEN: The shell view container is present
    expect(screen.getByTestId('clientes-shell-view')).toBeInTheDocument();
  });

  it('should display the "Clientes" heading in Spanish', () => {
    // GIVEN: ClientesShellView is mounted
    render(<ClientesShellView />);

    // WHEN: Component renders

    // THEN: Spanish heading is shown
    expect(screen.getByRole('heading', { name: /Clientes/i })).toBeInTheDocument();
  });

  it('should render a loading skeleton as placeholder content', () => {
    // GIVEN: ClientesShellView is mounted (no data yet — skeleton placeholder)
    render(<ClientesShellView />);

    // WHEN: Component renders

    // THEN: Skeleton placeholder is visible
    expect(screen.getByTestId('clientes-skeleton')).toBeInTheDocument();
  });
});
