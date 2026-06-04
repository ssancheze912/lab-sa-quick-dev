/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Component Tests — RED Phase (Vitest + RTL)
 * These tests are intentionally FAILING until EmptyState is implemented.
 *
 * Component under test: EmptyState (not yet created)
 * Path: frontend/src/shared/components/EmptyState.tsx
 *
 * Required data-testid:
 *   - empty-state — root element of EmptyState
 *
 * Props interface (expected by implementation):
 *   - message: string         — primary message (e.g. "No hay clientes registrados")
 *   - description?: string    — optional secondary text
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// EmptyState does not exist yet — import will fail in RED phase (intentional)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { EmptyState } = require('../EmptyState');

describe('EmptyState — component tests (RED phase)', () => {
  it('should render with data-testid="empty-state"', () => {
    // GIVEN: EmptyState is mounted with a required message prop
    // WHEN: The component renders
    render(<EmptyState message="No hay clientes registrados" />);

    // THEN: The root element has data-testid="empty-state"
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should display the message prop as visible text', () => {
    // GIVEN: EmptyState receives message="No hay clientes registrados"
    // WHEN: The component renders
    render(<EmptyState message="No hay clientes registrados" />);

    // THEN: The message text is visible
    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument();
  });

  it('should display the optional description prop when provided', () => {
    // GIVEN: EmptyState receives a description prop
    // WHEN: The component renders
    render(
      <EmptyState
        message="No hay clientes registrados"
        description="Crea el primer cliente para comenzar"
      />
    );

    // THEN: The description text is visible
    expect(screen.getByText('Crea el primer cliente para comenzar')).toBeInTheDocument();
  });

  it('should NOT render description text when description prop is omitted', () => {
    // GIVEN: EmptyState receives only the required message prop
    // WHEN: The component renders
    render(<EmptyState message="No hay clientes registrados" />);

    // THEN: No description text is rendered
    expect(screen.queryByText(/Crea el primer/)).not.toBeInTheDocument();
  });

  it('should have an accessible role for screen readers (role="status" or role="region")', () => {
    // GIVEN: EmptyState is rendered (WCAG 2.1 AA requirement)
    // WHEN: The component renders
    render(<EmptyState message="No hay clientes registrados" />);

    // THEN: The component communicates its purpose to assistive technology
    // EmptyState should use role="status" (non-disruptive) per AC3
    const emptyState = screen.getByTestId('empty-state');
    const role = emptyState.getAttribute('role');
    expect(['status', 'region', 'main']).toContain(role);
  });

  it('should include guidance to create the first client (AC3 requirement)', () => {
    // GIVEN: EmptyState is rendered with the client-specific message
    // WHEN: Rendered with the Spanish guidance message
    render(
      <EmptyState
        message="No hay clientes registrados"
        description="Crea el primer cliente para comenzar"
      />
    );

    // THEN: The content guides the user toward creating the first client
    const emptyState = screen.getByTestId('empty-state');
    expect(emptyState.textContent).toMatch(/primer cliente|crea.*cliente/i);
  });
});
