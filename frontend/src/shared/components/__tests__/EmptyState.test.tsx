/**
 * Component Tests — EmptyState (shared component, Story 2.1)
 * BMad-Integrated Mode: unit-level tests for EmptyState in isolation.
 *
 * Not covered in the ATDD suite (which tests ClienteListView E2E, not the component directly).
 *
 * Edge cases covered:
 *   - Renders message prop
 *   - Does NOT render action button when actionLabel/onAction are absent
 *   - Renders action button when both actionLabel and onAction are provided
 *   - Calls onAction when the action button is clicked
 *   - Does NOT render action button when only actionLabel is provided (no handler)
 *   - Does NOT render action button when only onAction is provided (no label)
 *   - data-testid="empty-state" always present
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

// Mock siesa-ui-kit Button component
vi.mock('siesa-ui-kit', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Rendering — basic output
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — rendering', () => {

  it('[P1] should render the data-testid="empty-state" attribute', () => {
    // GIVEN: A message is provided
    // WHEN: EmptyState is rendered
    render(<EmptyState message="No hay registros." />);

    // THEN: data-testid is present
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('[P1] should display the message prop', () => {
    // GIVEN: A specific message
    // WHEN: EmptyState is rendered
    render(<EmptyState message="No hay clientes registrados. Crea el primero." />);

    // THEN: Message text is visible
    expect(screen.getByText('No hay clientes registrados. Crea el primero.')).toBeInTheDocument();
  });

  it('[P2] should render different messages without alteration', () => {
    // GIVEN: A different message
    // WHEN: EmptyState is rendered
    render(<EmptyState message="Sin resultados para esta búsqueda." />);

    // THEN: The exact message is rendered
    expect(screen.getByText('Sin resultados para esta búsqueda.')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Action button — conditional rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — action button conditional rendering', () => {

  it('[P1] should NOT render an action button when neither actionLabel nor onAction are provided', () => {
    // GIVEN: Only message prop is provided
    // WHEN: EmptyState is rendered
    render(<EmptyState message="Sin datos." />);

    // THEN: No button is rendered
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('[P1] should NOT render an action button when only actionLabel is provided (missing handler)', () => {
    // GIVEN: actionLabel without onAction
    // WHEN: EmptyState is rendered
    render(<EmptyState message="Sin datos." actionLabel="Crear ahora" />);

    // THEN: Button is NOT rendered (both required to show button)
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('[P1] should NOT render an action button when only onAction is provided (missing label)', () => {
    // GIVEN: onAction without actionLabel
    // WHEN: EmptyState is rendered
    render(<EmptyState message="Sin datos." onAction={vi.fn()} />);

    // THEN: Button is NOT rendered
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('[P1] should render an action button when both actionLabel and onAction are provided', () => {
    // GIVEN: Both actionLabel and onAction are provided
    // WHEN: EmptyState is rendered
    render(
      <EmptyState message="Sin datos." actionLabel="Crear cliente" onAction={vi.fn()} />
    );

    // THEN: Action button is rendered with the correct label
    expect(screen.getByRole('button', { name: 'Crear cliente' })).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Action button — click behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — action button click behavior', () => {

  it('[P1] should call onAction when the action button is clicked', () => {
    // GIVEN: onAction spy provided
    const onActionSpy = vi.fn();
    render(
      <EmptyState message="Sin datos." actionLabel="Crear cliente" onAction={onActionSpy} />
    );

    // WHEN: User clicks the action button
    fireEvent.click(screen.getByRole('button'));

    // THEN: onAction is called once
    expect(onActionSpy).toHaveBeenCalledTimes(1);
  });

  it('[P2] should call onAction exactly once per click (no double-fire)', () => {
    // GIVEN: onAction spy
    const onActionSpy = vi.fn();
    render(
      <EmptyState message="Sin datos." actionLabel="Crear" onAction={onActionSpy} />
    );

    // WHEN: Single click
    fireEvent.click(screen.getByRole('button'));

    // THEN: Called exactly once
    expect(onActionSpy).toHaveBeenCalledTimes(1);
  });
});
