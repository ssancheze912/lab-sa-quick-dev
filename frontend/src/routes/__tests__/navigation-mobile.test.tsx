/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — Mobile — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC2 — Mobile viewport (< 1024px) renders NavigationBar at bottom; items tappable (FR29)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// NOTE: These imports will fail until implementation is complete (RED phase).
// Components under test — to be created in Story 1.2 implementation.
import { NavigationBar } from '../../../shared/components/ui/NavigationBar';

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — NavigationBar renders on mobile viewport (< 1024px)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — NavigationBar at mobile viewport (< 1024px)', () => {
  it('should render the NavigationBar component', () => {
    // GIVEN: The application layout renders at mobile width (375px)
    // jsdom viewport width simulated via component rendering
    render(<NavigationBar />);

    // WHEN: Component renders

    // THEN: The navigation bar element is present in the DOM
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('should display the "Clientes" navigation item in the NavigationBar', () => {
    // GIVEN: The NavigationBar is rendered
    render(<NavigationBar />);

    // WHEN: Component renders

    // THEN: "Clientes" nav item is visible and tappable
    expect(screen.getByTestId('nav-item-clientes')).toBeInTheDocument();
  });

  it('should display the "Contactos" navigation item in the NavigationBar', () => {
    // GIVEN: The NavigationBar is rendered
    render(<NavigationBar />);

    // WHEN: Component renders

    // THEN: "Contactos" nav item is visible and tappable
    expect(screen.getByTestId('nav-item-contactos')).toBeInTheDocument();
  });

  it('should have accessible aria-label on "Clientes" item in Spanish', () => {
    // GIVEN: The NavigationBar is rendered
    render(<NavigationBar />);

    // WHEN: Component renders

    // THEN: "Clientes" item has aria-label in Spanish (WCAG 2.1 AA)
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('aria-label', 'Ir a Clientes');
  });

  it('should have accessible aria-label on "Contactos" item in Spanish', () => {
    // GIVEN: The NavigationBar is rendered
    render(<NavigationBar />);

    // WHEN: Component renders

    // THEN: "Contactos" item has aria-label in Spanish (WCAG 2.1 AA)
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('aria-label', 'Ir a Contactos');
  });

  it('should highlight "Clientes" as active when activeRoute is /clientes', () => {
    // GIVEN: NavigationBar rendered with /clientes as the active route
    render(<NavigationBar activeRoute="/clientes" />);

    // WHEN: Component renders with active route prop

    // THEN: "Clientes" item has data-active="true"
    expect(screen.getByTestId('nav-item-clientes')).toHaveAttribute('data-active', 'true');
  });

  it('should highlight "Contactos" as active when activeRoute is /contactos', () => {
    // GIVEN: NavigationBar rendered with /contactos as the active route
    render(<NavigationBar activeRoute="/contactos" />);

    // WHEN: Component renders with active route prop

    // THEN: "Contactos" item has data-active="true"
    expect(screen.getByTestId('nav-item-contactos')).toHaveAttribute('data-active', 'true');
  });
});
