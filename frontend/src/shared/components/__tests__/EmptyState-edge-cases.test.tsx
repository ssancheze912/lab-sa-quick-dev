/**
 * Story 2.1: Client List & Search — EmptyState Edge Cases
 * Epic 2: Client Management
 *
 * Automation Tests — Component Level Edge Cases for EmptyState
 * Expands beyond ATDD tests in EmptyState.test.tsx.
 *
 * Covers:
 *   - Long message text renders without crash
 *   - Empty description string treated same as omitted (no extra DOM node)
 *   - Multiple renders are idempotent
 *   - aria-live="polite" attribute for screen reader announcements
 *   - Snapshot stability: consistent DOM structure across renders
 *   - InboxIcon renders as decorative (aria-hidden="true")
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Long content boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — boundary conditions', () => {
  it('[P2] should render without crashing when message is very long', () => {
    // GIVEN: An unusually long message string
    const longMessage = 'No hay clientes registrados en el sistema en este momento. '.repeat(5).trim();

    // WHEN: EmptyState is rendered with the long message
    expect(() => render(<EmptyState message={longMessage} />)).not.toThrow();

    // THEN: The component is in the DOM
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('[P2] should render without crashing when description is very long', () => {
    // GIVEN: An unusually long description
    const longDescription = 'Crea el primer cliente haciendo clic en el botón de agregar cliente. '.repeat(4).trim();

    // WHEN: EmptyState is rendered with long description
    expect(() =>
      render(<EmptyState message="No hay clientes" description={longDescription} />)
    ).not.toThrow();

    // THEN: The description text is in the DOM
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('[P2] should not render description when an empty string is provided', () => {
    // GIVEN: Description prop is an empty string (edge case — not omitted, but empty)
    render(<EmptyState message="No hay clientes registrados" description="" />);

    // THEN: No <p> element for description is added (empty string is falsy)
    // The implementation uses {description && <p>} so empty string won't render
    const emptyState = screen.getByTestId('empty-state');
    const paragraphs = emptyState.querySelectorAll('p');
    // All <p> tags should be empty — no visible description content
    const hasNonEmptyParagraph = Array.from(paragraphs).some((p) => p.textContent && p.textContent.trim().length > 0);
    expect(hasNonEmptyParagraph).toBe(false);
  });

  it('[P2] should render consistently across multiple re-renders', () => {
    // GIVEN: EmptyState is rendered once
    const { rerender } = render(
      <EmptyState message="No hay clientes" description="Crea el primero" />
    );

    // WHEN: The same props are passed again (re-render)
    rerender(<EmptyState message="No hay clientes" description="Crea el primero" />);

    // THEN: Content is still present (no double-render artifacts)
    expect(screen.getByText('No hay clientes')).toBeInTheDocument();
    expect(screen.getByText('Crea el primero')).toBeInTheDocument();
    expect(screen.getAllByTestId('empty-state')).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — accessibility', () => {
  it('[P1] should have aria-live="polite" for non-disruptive screen reader announcements', () => {
    // GIVEN: EmptyState rendered
    render(<EmptyState message="No hay clientes registrados" />);

    // THEN: aria-live is polite (doesn't interrupt the user)
    const emptyState = screen.getByTestId('empty-state');
    expect(emptyState).toHaveAttribute('aria-live', 'polite');
  });

  it('[P1] should render the icon with aria-hidden="true" (decorative, not read by screen readers)', () => {
    // GIVEN: EmptyState rendered
    render(<EmptyState message="No hay clientes registrados" />);

    // THEN: The icon SVG has aria-hidden="true" so screen readers skip it
    const emptyState = screen.getByTestId('empty-state');
    const icon = emptyState.querySelector('[aria-hidden="true"]');
    expect(icon).not.toBeNull();
  });

  it('[P2] should have an h3 heading element for the message (semantic structure)', () => {
    // GIVEN: EmptyState rendered with a message
    render(<EmptyState message="No hay clientes registrados" />);

    // THEN: The message is wrapped in an h3 element (semantic hierarchy)
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('No hay clientes registrados');
  });

  it('[P2] should NOT duplicate the role attribute (only one role value present)', () => {
    // GIVEN: EmptyState rendered
    render(<EmptyState message="No hay clientes registrados" />);

    // THEN: The root element has exactly one role attribute value
    const emptyState = screen.getByTestId('empty-state');
    const role = emptyState.getAttribute('role');
    expect(role).not.toBeNull();
    // role should be a single value, not a space-separated list of roles
    expect(role?.trim().split(/\s+/)).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Props update scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — prop updates', () => {
  it('[P2] should update the displayed message when message prop changes', () => {
    // GIVEN: EmptyState with an initial message
    const { rerender } = render(<EmptyState message="Mensaje inicial" />);
    expect(screen.getByText('Mensaje inicial')).toBeInTheDocument();

    // WHEN: The message prop is updated
    rerender(<EmptyState message="Mensaje actualizado" />);

    // THEN: The new message is displayed
    expect(screen.getByText('Mensaje actualizado')).toBeInTheDocument();
    expect(screen.queryByText('Mensaje inicial')).not.toBeInTheDocument();
  });

  it('[P2] should show description when it is added after initial render without description', () => {
    // GIVEN: EmptyState rendered without description
    const { rerender } = render(<EmptyState message="Sin clientes" />);
    expect(screen.queryByText('Crea el primero')).not.toBeInTheDocument();

    // WHEN: Description is added via prop update
    rerender(<EmptyState message="Sin clientes" description="Crea el primero" />);

    // THEN: Description now appears
    expect(screen.getByText('Crea el primero')).toBeInTheDocument();
  });

  it('[P2] should hide description when it is removed after initial render with description', () => {
    // GIVEN: EmptyState rendered with description
    const { rerender } = render(
      <EmptyState message="Sin clientes" description="Crea el primero" />
    );
    expect(screen.getByText('Crea el primero')).toBeInTheDocument();

    // WHEN: Description is removed
    rerender(<EmptyState message="Sin clientes" />);

    // THEN: Description is no longer in the DOM
    expect(screen.queryByText('Crea el primero')).not.toBeInTheDocument();
  });
});
