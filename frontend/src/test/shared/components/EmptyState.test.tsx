/**
 * Story 2.1: Client List & Search
 * Epic 2: Gestión de Clientes
 *
 * Component Tests — EmptyState — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC3 — EmptyState displays Spanish-language message and description
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Import the component under test
// This import will fail (RED phase) until the component is created
import { EmptyState } from '@/shared/components/EmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — Rendering', () => {
  it('renders with data-testid="empty-state"', () => {
    // GIVEN: A message string
    // WHEN: EmptyState is rendered
    render(<EmptyState message="Aún no hay clientes registrados" />);

    // THEN: The element with testid "empty-state" is in the DOM
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('renders the message prop text', () => {
    // GIVEN: A message "Aún no hay clientes registrados"
    render(<EmptyState message="Aún no hay clientes registrados" />);

    // THEN: The message text is visible
    expect(screen.getByText('Aún no hay clientes registrados')).toBeTruthy();
  });

  it('renders the description prop when provided', () => {
    // GIVEN: A message and a description
    render(
      <EmptyState
        message="Aún no hay clientes registrados"
        description="Crea el primer cliente para comenzar"
      />,
    );

    // THEN: The description text is also visible
    expect(screen.getByText('Crea el primer cliente para comenzar')).toBeTruthy();
  });

  it('does NOT render a description element when description prop is omitted', () => {
    // GIVEN: Only a message (no description)
    render(<EmptyState message="No se encontraron clientes" />);

    // THEN: No description element is in the DOM
    expect(screen.queryByText('Crea el primer cliente para comenzar')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reusability (used across Epic 2 and Epic 3)
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — Reusability', () => {
  it('accepts any Spanish message string (not hard-coded)', () => {
    // GIVEN: A custom message for a different context
    render(<EmptyState message="Aún no hay contactos registrados" />);

    // THEN: The custom message is displayed
    expect(screen.getByText('Aún no hay contactos registrados')).toBeTruthy();
  });
});
