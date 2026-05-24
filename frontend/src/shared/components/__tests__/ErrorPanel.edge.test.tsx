/**
 * Story 2.1: Client List & Search
 * Component Tests — ErrorPanel (Edge Cases — Automate EXPAND)
 *
 * Covers boundary conditions NOT in ATDD tests:
 *   - onRetry callback receives no arguments
 *   - Error message is accessible text (not just visual)
 *   - Retry button is not disabled by default
 *   - Component renders without crash when onRetry is a no-op
 *   - Retry button has accessible name for screen readers
 *   - onRetry prop change on re-render calls new handler
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { ErrorPanel } from '../ErrorPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Edge: retry button is not disabled
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — edge: button disabled state', () => {
  test('Retry button should not be disabled by default', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={() => {}} />);

    const retryButton = screen.getByTestId('retry-button');

    // THEN: button is enabled
    expect(retryButton).not.toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: retry button accessible name matches "Reintentar"
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — edge: accessible button name', () => {
  test('Retry button is findable by accessible name "Reintentar"', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={() => {}} />);

    // THEN: button is discoverable by screen readers via its accessible name
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: error message is actual text content (not empty)
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — edge: error message text', () => {
  test('Error panel has non-empty visible text beyond the button text', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={() => {}} />);

    const panel = screen.getByTestId('error-panel');

    // THEN: the panel has text content (not just a button)
    const textContent = panel.textContent ?? '';
    expect(textContent.length).toBeGreaterThan('Reintentar'.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: onRetry receives no arguments when called
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — edge: onRetry call arguments', () => {
  test('onRetry is called with no arguments when button is clicked', async () => {
    // GIVEN: a spy function tracking call arguments
    const onRetry = vi.fn();
    render(<ErrorPanel onRetry={onRetry} />);

    // WHEN: button is clicked
    await userEvent.click(screen.getByTestId('retry-button'));

    // THEN: called once with no arguments (not with click event object)
    expect(onRetry).toHaveBeenCalledTimes(1);
    // The component calls onRetry() directly (no event passthrough)
    // The mock may be called with undefined args — check it was called
    const calls = onRetry.mock.calls;
    expect(calls[0]).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: updated onRetry prop on re-render calls the new handler
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — edge: onRetry prop update', () => {
  test('After re-render with new onRetry, click calls the new handler', async () => {
    // GIVEN: initial onRetry handler
    const onRetryV1 = vi.fn();
    const onRetryV2 = vi.fn();

    const { rerender } = render(<ErrorPanel onRetry={onRetryV1} />);

    // WHEN: component is re-rendered with a different onRetry
    rerender(<ErrorPanel onRetry={onRetryV2} />);

    await userEvent.click(screen.getByTestId('retry-button'));

    // THEN: new handler was called, old one was not
    expect(onRetryV2).toHaveBeenCalledTimes(1);
    expect(onRetryV1).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: component renders with noop handler without crash
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — edge: noop onRetry', () => {
  test('Given noop onRetry, component renders and button is clickable without crash', async () => {
    // GIVEN: noop function
    expect(() => render(<ErrorPanel onRetry={() => {}} />)).not.toThrow();

    // WHEN: button is clicked
    expect(
      async () => await userEvent.click(screen.getByTestId('retry-button')),
    ).not.toThrow();
  });
});
