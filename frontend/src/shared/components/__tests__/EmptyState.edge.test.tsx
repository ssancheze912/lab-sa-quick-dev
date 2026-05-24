/**
 * Story 2.1: Client List & Search
 * Component Tests — EmptyState (Edge Cases — Automate EXPAND)
 *
 * Covers boundary conditions NOT in ATDD tests:
 *   - Empty string message prop renders (no crash)
 *   - Very long message prop (boundary: 500 chars)
 *   - Multiple renders with different messages (prop reactivity)
 *   - Component renders without crashing when no message supplied
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import React from 'react';
import { EmptyState } from '../EmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: empty string message prop
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — edge: empty string message', () => {
  test('Given empty string message, should render without crash', () => {
    // GIVEN: explicitly empty message
    // WHEN: render is called
    expect(() => render(<EmptyState message="" />)).not.toThrow();
  });

  test('Given empty string message, data-testid should still be present', () => {
    // GIVEN: empty string message
    render(<EmptyState message="" />);

    // THEN: container is accessible via testid
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: very long message (500 chars)
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — edge: very long message', () => {
  test('Given 500-character message, should render and display it fully', () => {
    // GIVEN: 500-char message
    const longMessage = 'A'.repeat(500);
    render(<EmptyState message={longMessage} />);

    // THEN: message is in the DOM
    const container = screen.getByTestId('empty-state');
    expect(container).toHaveTextContent(longMessage);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: special characters in message
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — edge: special character message', () => {
  test('Given message with HTML-like characters, should render as text not HTML', () => {
    // GIVEN: message with special chars
    const specialMessage = 'No hay registros <activos> & vigentes.';
    render(<EmptyState message={specialMessage} />);

    // THEN: text is in the document (React escapes HTML entities by default)
    const container = screen.getByTestId('empty-state');
    expect(container.textContent).toContain('No hay registros');
    expect(container.textContent).toContain('activos');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: prop reactivity — changing message prop updates displayed text
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — edge: prop reactivity', () => {
  test('Given re-render with different message, displays new message', () => {
    // GIVEN: initial render with message A
    const { rerender } = render(<EmptyState message="Mensaje inicial" />);
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Mensaje inicial');

    // WHEN: re-rendered with message B
    rerender(<EmptyState message="Mensaje actualizado" />);

    // THEN: new message is displayed
    expect(screen.getByTestId('empty-state')).toHaveTextContent('Mensaje actualizado');
    expect(screen.getByTestId('empty-state')).not.toHaveTextContent('Mensaje inicial');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Spanish characters preserved in default message
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — edge: Spanish locale default message', () => {
  test('Default message contains Spanish accents and characters correctly', () => {
    // GIVEN: default render
    render(<EmptyState />);

    const container = screen.getByTestId('empty-state');

    // THEN: "aún" is correctly rendered with accent (not "aun")
    expect(container.textContent).toMatch(/aún/);
  });
});
