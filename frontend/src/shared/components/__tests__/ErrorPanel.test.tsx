/**
 * Component Tests — ErrorPanel (shared component, Story 2.1)
 * BMad-Integrated Mode: unit-level tests for ErrorPanel in isolation.
 *
 * Not covered in the ATDD suite (which tests ClienteListView E2E, not ErrorPanel directly).
 *
 * Edge cases covered:
 *   - Renders data-testid="error-panel"
 *   - Renders data-testid="retry-button" on the Reintentar button
 *   - Renders default error message when no message prop provided
 *   - Renders custom message when message prop provided
 *   - Calls onRetry when "Reintentar" button is clicked
 *   - "Reintentar" button is always visible (not conditional)
 *   - onRetry called exactly once per click
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorPanel } from '../ErrorPanel';

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
    <button onClick={onClick} {...(props as Record<string, unknown>)}>
      {children}
    </button>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Rendering — basic output
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — rendering', () => {

  it('[P1] should render the data-testid="error-panel" attribute', () => {
    // GIVEN: onRetry is provided
    // WHEN: ErrorPanel is rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: data-testid="error-panel" is present
    expect(screen.getByTestId('error-panel')).toBeInTheDocument();
  });

  it('[P1] should render the "Reintentar" button text', () => {
    // GIVEN: onRetry is provided
    // WHEN: ErrorPanel is rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: "Reintentar" text is visible
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });

  it('[P1] should render a button with data-testid="retry-button"', () => {
    // GIVEN: onRetry is provided
    // WHEN: ErrorPanel is rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: retry-button testid is present
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Message — default vs custom
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — message content', () => {

  it('[P1] should display the default error message when no message prop is provided', () => {
    // GIVEN: No message prop
    // WHEN: ErrorPanel is rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: Default Spanish error message is displayed
    expect(screen.getByText(/Error al cargar los datos/i)).toBeInTheDocument();
  });

  it('[P1] should display the default message in Spanish', () => {
    // GIVEN: No custom message
    // WHEN: ErrorPanel is rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: Default message contains "Intenta de nuevo" (Spanish retry hint)
    expect(screen.getByText(/Intenta de nuevo/i)).toBeInTheDocument();
  });

  it('[P2] should display a custom message when message prop is provided', () => {
    // GIVEN: A custom message
    // WHEN: ErrorPanel is rendered with custom message
    render(<ErrorPanel message="Error de red. Verifica tu conexión." onRetry={vi.fn()} />);

    // THEN: Custom message is displayed instead of default
    expect(screen.getByText('Error de red. Verifica tu conexión.')).toBeInTheDocument();
  });

  it('[P2] should NOT display the default message when a custom message is provided', () => {
    // GIVEN: Custom message
    // WHEN: ErrorPanel is rendered
    render(<ErrorPanel message="Error personalizado." onRetry={vi.fn()} />);

    // THEN: Default message is NOT displayed
    expect(screen.queryByText(/Error al cargar los datos/i)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Retry button — click behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — retry button behavior', () => {

  it('[P0] should call onRetry when the "Reintentar" button is clicked', () => {
    // GIVEN: onRetry spy
    const onRetrySpy = vi.fn();
    render(<ErrorPanel onRetry={onRetrySpy} />);

    // WHEN: User clicks the "Reintentar" button
    fireEvent.click(screen.getByTestId('retry-button'));

    // THEN: onRetry is called once
    expect(onRetrySpy).toHaveBeenCalledTimes(1);
  });

  it('[P1] should call onRetry exactly once per click (no double-fire)', () => {
    // GIVEN: onRetry spy
    const onRetrySpy = vi.fn();
    render(<ErrorPanel onRetry={onRetrySpy} />);

    // WHEN: Single click
    fireEvent.click(screen.getByTestId('retry-button'));

    // THEN: Called exactly once
    expect(onRetrySpy).toHaveBeenCalledTimes(1);
  });

  it('[P2] should support multiple consecutive clicks (each triggers onRetry)', () => {
    // GIVEN: onRetry spy
    const onRetrySpy = vi.fn();
    render(<ErrorPanel onRetry={onRetrySpy} />);

    // WHEN: User clicks three times
    fireEvent.click(screen.getByTestId('retry-button'));
    fireEvent.click(screen.getByTestId('retry-button'));
    fireEvent.click(screen.getByTestId('retry-button'));

    // THEN: onRetry called 3 times
    expect(onRetrySpy).toHaveBeenCalledTimes(3);
  });
});
