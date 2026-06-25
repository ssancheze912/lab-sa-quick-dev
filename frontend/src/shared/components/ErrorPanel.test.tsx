/**
 * Story 2.1: ErrorPanel component — Component Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC4: ErrorPanel shows error message and "Reintentar" button; clicking calls onRetry
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';

// SUT — will fail until implemented
import { ErrorPanel } from './ErrorPanel';

describe('ErrorPanel', () => {
  it('should render the error panel container', () => {
    // GIVEN: ErrorPanel is rendered
    render(createElement(ErrorPanel, { onRetry: vi.fn() }));

    // THEN: Container is in the DOM with testid
    expect(screen.getByTestId('error-panel')).toBeInTheDocument();
  });

  it('should display an error message in Spanish', () => {
    // GIVEN: ErrorPanel is rendered
    render(createElement(ErrorPanel, { onRetry: vi.fn() }));

    // THEN: Error message text is visible in Spanish
    expect(screen.getByText(/error|cargar/i)).toBeInTheDocument();
  });

  it('should render a "Reintentar" button', () => {
    // GIVEN: ErrorPanel is rendered
    render(createElement(ErrorPanel, { onRetry: vi.fn() }));

    // THEN: "Reintentar" button is present with testid
    expect(screen.getByTestId('error-panel-retry-button')).toBeInTheDocument();
  });

  it('should call onRetry when "Reintentar" button is clicked', async () => {
    // GIVEN: A spy function for onRetry
    const onRetry = vi.fn();
    render(createElement(ErrorPanel, { onRetry }));

    // WHEN: User clicks Reintentar
    const retryBtn = screen.getByTestId('error-panel-retry-button');
    await userEvent.click(retryBtn);

    // THEN: onRetry is called exactly once
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should display the "Reintentar" label on the button', () => {
    // GIVEN: ErrorPanel is rendered
    render(createElement(ErrorPanel, { onRetry: vi.fn() }));

    // THEN: Button text is "Reintentar"
    const retryBtn = screen.getByTestId('error-panel-retry-button');
    expect(retryBtn).toHaveTextContent('Reintentar');
  });
});
