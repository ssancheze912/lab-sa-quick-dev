/**
 * Story 2.1: Client List & Search
 * Epic 2: Gestión de Clientes
 *
 * Component Tests — ClienteListItem — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Each list item shows Nombre (primary) and NIT/RUC (secondary) text
 *          with WCAG 2.1 AA accessibility attributes
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Import the component under test
// This import will fail (RED phase) until the component is created
import { ClienteListItem } from '@/shared/components/ClienteListItem';

const clienteFixture = {
  id: 'aaaaaaaa-0000-0000-0000-000000000001',
  nombre: 'Empresa Alpha',
  nitRuc: '900100001-1',
  telefono: null,
  ciudad: null,
  creadoEn: '2026-01-10T08:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListItem — Rendering', () => {
  it('renders with data-testid="cliente-list-item"', () => {
    // GIVEN: A valid cliente fixture
    // WHEN: ClienteListItem is rendered
    render(
      <ClienteListItem
        cliente={clienteFixture}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    // THEN: The element with testid "cliente-list-item" is in the DOM
    expect(screen.getByTestId('cliente-list-item')).toBeTruthy();
  });

  it('displays the cliente nombre as primary text', () => {
    // GIVEN: A client with nombre "Empresa Alpha"
    render(
      <ClienteListItem
        cliente={clienteFixture}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    // THEN: "Empresa Alpha" is visible
    expect(screen.getByText('Empresa Alpha')).toBeTruthy();
  });

  it('displays the cliente nitRuc as secondary text', () => {
    // GIVEN: A client with nitRuc "900100001-1"
    render(
      <ClienteListItem
        cliente={clienteFixture}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    // THEN: "900100001-1" is visible
    expect(screen.getByText('900100001-1')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Interaction
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListItem — Interaction', () => {
  it('calls onClick when the item is clicked', () => {
    // GIVEN: A mock onClick handler
    const mockOnClick = vi.fn();
    render(
      <ClienteListItem
        cliente={clienteFixture}
        isSelected={false}
        onClick={mockOnClick}
      />,
    );

    // WHEN: The item is clicked
    fireEvent.click(screen.getByTestId('cliente-list-item'));

    // THEN: onClick is called once
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Selection state
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListItem — Selection State', () => {
  it('has aria-selected="true" when isSelected is true', () => {
    // GIVEN: The item is selected
    render(
      <ClienteListItem
        cliente={clienteFixture}
        isSelected={true}
        onClick={vi.fn()}
      />,
    );

    // THEN: aria-selected attribute is "true"
    const item = screen.getByTestId('cliente-list-item');
    expect(item.getAttribute('aria-selected')).toBe('true');
  });

  it('has aria-selected="false" when isSelected is false', () => {
    // GIVEN: The item is not selected
    render(
      <ClienteListItem
        cliente={clienteFixture}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    // THEN: aria-selected attribute is "false"
    const item = screen.getByTestId('cliente-list-item');
    expect(item.getAttribute('aria-selected')).toBe('false');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListItem — Accessibility (WCAG 2.1 AA)', () => {
  it('has role="button" for keyboard accessibility', () => {
    // GIVEN: A valid client item
    render(
      <ClienteListItem
        cliente={clienteFixture}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    // THEN: The element has role="button"
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('has an aria-label that includes the client nombre', () => {
    // GIVEN: A client with nombre "Empresa Alpha"
    render(
      <ClienteListItem
        cliente={clienteFixture}
        isSelected={false}
        onClick={vi.fn()}
      />,
    );

    // THEN: The button element has an aria-label containing the nombre
    const button = screen.getByRole('button');
    const ariaLabel = button.getAttribute('aria-label') ?? '';
    expect(ariaLabel.toLowerCase()).toContain('empresa alpha');
  });
});
