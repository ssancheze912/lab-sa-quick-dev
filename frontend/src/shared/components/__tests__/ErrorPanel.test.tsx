/**
 * Story 2.1: Client List & Search
 * Component Tests — ErrorPanel (RED Phase — ATDD)
 *
 * Acceptance Criteria covered:
 *   AC4 — ErrorPanel with "Reintentar" button shown when backend is unavailable
 *          Clicking "Reintentar" triggers a new fetch attempt
 *
 * Tests will FAIL until ErrorPanel component is implemented.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { ErrorPanel } from '../ErrorPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Given: ErrorPanel rendered with an onRetry handler
// When:  component mounts
// Then:  shows error state with Reintentar button
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — rendering', () => {
  test('should render with data-testid="error-panel"', () => {
    // GIVEN: ErrorPanel with a noop retry handler
    render(<ErrorPanel onRetry={() => {}} />);

    // THEN: root element has correct testid
    expect(screen.getByTestId('error-panel')).toBeInTheDocument();
  });

  test('should render "Reintentar" button with data-testid="retry-button"', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={() => {}} />);

    // THEN: retry button is visible
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
  });

  test('should display "Reintentar" as button text', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={() => {}} />);

    // THEN: button text is "Reintentar" in Spanish
    expect(screen.getByTestId('retry-button')).toHaveTextContent(/reintentar/i);
  });

  test('should display a Spanish error message to the user', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={() => {}} />);

    // THEN: a Spanish error message is shown
    expect(screen.getByTestId('error-panel')).toHaveTextContent(
      /no se pudo cargar/i,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Given: ErrorPanel with onRetry callback
// When:  user clicks "Reintentar"
// Then:  onRetry is called exactly once
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — retry interaction', () => {
  test('should call onRetry when "Reintentar" button is clicked', async () => {
    // GIVEN: onRetry is a mock function
    const onRetry = vi.fn();
    render(<ErrorPanel onRetry={onRetry} />);

    // WHEN: user clicks the retry button
    await userEvent.click(screen.getByTestId('retry-button'));

    // THEN: onRetry was called exactly once
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test('should call onRetry each time "Reintentar" is clicked', async () => {
    // GIVEN: onRetry is a mock function
    const onRetry = vi.fn();
    render(<ErrorPanel onRetry={onRetry} />);

    // WHEN: user clicks the retry button twice
    await userEvent.click(screen.getByTestId('retry-button'));
    await userEvent.click(screen.getByTestId('retry-button'));

    // THEN: onRetry was called twice
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — accessibility', () => {
  test('retry button should be a proper button element (keyboard accessible)', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={() => {}} />);

    // THEN: the retry element is a button role (WCAG 2.1 AA)
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});
