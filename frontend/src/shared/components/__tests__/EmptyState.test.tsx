/**
 * Story 2.1: Client List & Search
 * Component Tests — EmptyState (RED Phase — ATDD)
 *
 * Acceptance Criteria covered:
 *   AC3 — EmptyState displayed with Spanish message when no clients exist
 *
 * Tests will FAIL until EmptyState component is implemented.
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import React from 'react';
import { EmptyState } from '../EmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Given: EmptyState rendered with default props
// When:  component mounts
// Then:  shows default Spanish message and data-testid
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — default rendering', () => {
  test('should render with data-testid="empty-state"', () => {
    // GIVEN: EmptyState with no props
    render(<EmptyState />);

    // THEN: root element has correct testid
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  test('should display the default Spanish message', () => {
    // GIVEN: EmptyState with no props
    render(<EmptyState />);

    // THEN: default message guides user to create first client
    expect(screen.getByTestId('empty-state')).toHaveTextContent(
      /no hay clientes aún/i,
    );
  });

  test('default message should include action hint to create first client', () => {
    // GIVEN: EmptyState with no props
    render(<EmptyState />);

    // THEN: message includes "crea el primero" or equivalent Spanish text
    expect(screen.getByTestId('empty-state')).toHaveTextContent(
      /crea el primero/i,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Given: EmptyState rendered with a custom message prop
// When:  component mounts
// Then:  shows custom message instead of default
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — custom message prop', () => {
  test('should display custom message when "message" prop is provided', () => {
    // GIVEN: EmptyState with custom message
    const customMessage = 'No se encontraron resultados para tu búsqueda.';
    render(<EmptyState message={customMessage} />);

    // THEN: custom message is displayed
    expect(screen.getByTestId('empty-state')).toHaveTextContent(customMessage);
  });

  test('should NOT display default message when custom message is provided', () => {
    // GIVEN: EmptyState with a custom message
    render(<EmptyState message="Mensaje personalizado" />);

    // THEN: default message text is not present
    expect(screen.getByTestId('empty-state')).not.toHaveTextContent(
      /no hay clientes aún/i,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility check
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — accessibility', () => {
  test('should render visible text content (not empty)', () => {
    // GIVEN: EmptyState rendered
    render(<EmptyState />);

    // THEN: has visible text
    const container = screen.getByTestId('empty-state');
    expect(container.textContent!.trim().length).toBeGreaterThan(0);
  });
});
