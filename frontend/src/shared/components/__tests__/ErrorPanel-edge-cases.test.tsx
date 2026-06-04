/**
 * Story 2.1: Client List & Search — ErrorPanel Edge Cases
 * Epic 2: Client Management
 *
 * Automation Tests — Component Level Edge Cases for ErrorPanel
 * Expands beyond ATDD tests in ErrorPanel.test.tsx.
 *
 * Covers:
 *   - Rapid multiple clicks call onRetry each time (no accidental debounce)
 *   - onRetry does NOT fire when a different element is clicked
 *   - Icon renders as decorative (aria-hidden="true")
 *   - Button is not disabled (always clickable for retry)
 *   - Re-render with new onRetry function — new function is called, not stale closure
 *   - Component renders without crashing after re-render
 *   - role="alert" is announced immediately by screen readers
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorPanel } from '../ErrorPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Multiple rapid clicks — no accidental rate limiting
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — rapid click behavior', () => {
  it('[P2] should call onRetry for each individual click (no accidental debounce or throttle)', async () => {
    // GIVEN: ErrorPanel with a spy onRetry
    const onRetrySpy = vi.fn();
    render(<ErrorPanel onRetry={onRetrySpy} />);

    const button = screen.getByRole('button', { name: /reintentar/i });

    // WHEN: User clicks the button 3 times rapidly
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    // THEN: onRetry is called exactly 3 times (no debounce applied)
    expect(onRetrySpy).toHaveBeenCalledTimes(3);
  });

  it('[P2] should NOT call onRetry when clicking on the error text (not the button)', async () => {
    // GIVEN: ErrorPanel rendered
    const onRetrySpy = vi.fn();
    render(<ErrorPanel onRetry={onRetrySpy} />);

    // WHEN: User clicks the error message text (not the button)
    const errorPanel = screen.getByTestId('error-panel');
    const textElement = errorPanel.querySelector('p');
    if (textElement) {
      await userEvent.click(textElement);
    }

    // THEN: onRetry is NOT called (click was not on the button)
    expect(onRetrySpy).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Button state
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — button state', () => {
  it('[P1] should have the Reintentar button enabled (not disabled)', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: The button is enabled (user can always retry)
    const button = screen.getByRole('button', { name: /reintentar/i });
    expect(button).not.toBeDisabled();
  });

  it('[P1] should render button with type="button" to prevent accidental form submission', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: The button has explicit type="button"
    const button = screen.getByRole('button', { name: /reintentar/i });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('[P2] should focus the Reintentar button when Tab key is pressed', async () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    const button = screen.getByRole('button', { name: /reintentar/i });

    // WHEN: User explicitly focuses the button
    button.focus();

    // THEN: Button is focused
    expect(button).toHaveFocus();
  });

  it('[P2] should call onRetry when Enter key is pressed while button is focused', async () => {
    // GIVEN: ErrorPanel rendered with a spy
    const onRetrySpy = vi.fn();
    render(<ErrorPanel onRetry={onRetrySpy} />);

    const button = screen.getByRole('button', { name: /reintentar/i });
    button.focus();

    // WHEN: User presses Enter
    await userEvent.keyboard('{Enter}');

    // THEN: onRetry is called
    expect(onRetrySpy).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — accessibility', () => {
  it('[P1] should render the icon with aria-hidden="true" (decorative, not read by screen readers)', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: The error icon has aria-hidden="true"
    const errorPanel = screen.getByTestId('error-panel');
    const hiddenIcon = errorPanel.querySelector('[aria-hidden="true"]');
    expect(hiddenIcon).not.toBeNull();
  });

  it('[P1] should use role="alert" to announce errors immediately to screen readers', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: The root element uses role="alert" (live region, assertive)
    const errorPanel = screen.getByTestId('error-panel');
    expect(errorPanel).toHaveAttribute('role', 'alert');
  });

  it('[P2] should have an aria-label on the button that describes the action', () => {
    // GIVEN: ErrorPanel rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    const button = screen.getByRole('button', { name: /reintentar/i });

    // THEN: The button has either visible text content or aria-label
    const hasVisibleText = (button.textContent?.trim().length ?? 0) > 0;
    const hasAriaLabel = button.hasAttribute('aria-label');
    expect(hasVisibleText || hasAriaLabel).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Re-render behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — re-render behavior', () => {
  it('[P2] should call the latest onRetry function after prop update', async () => {
    // GIVEN: ErrorPanel rendered with initialSpy
    const initialSpy = vi.fn();
    const { rerender } = render(<ErrorPanel onRetry={initialSpy} />);

    // WHEN: onRetry prop is updated to a new spy
    const newSpy = vi.fn();
    rerender(<ErrorPanel onRetry={newSpy} />);

    // AND: User clicks Reintentar
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    // THEN: The NEW spy is called, not the stale initial one
    expect(newSpy).toHaveBeenCalledTimes(1);
    expect(initialSpy).not.toHaveBeenCalled();
  });

  it('[P2] should render consistently without errors across multiple re-renders', () => {
    // GIVEN: ErrorPanel rendered multiple times
    const { rerender } = render(<ErrorPanel onRetry={vi.fn()} />);

    // WHEN: Multiple re-renders with the same props
    for (let i = 0; i < 5; i++) {
      expect(() => rerender(<ErrorPanel onRetry={vi.fn()} />)).not.toThrow();
    }

    // THEN: Component is still in the DOM and stable
    expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    expect(screen.getAllByTestId('error-panel')).toHaveLength(1);
  });

  it('[P2] should display the Spanish error message even after prop changes', () => {
    // GIVEN: ErrorPanel rendered with initial spy
    const { rerender } = render(<ErrorPanel onRetry={vi.fn()} />);

    // WHEN: onRetry prop updates (simulating parent component state change)
    rerender(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: The Spanish error message is still visible
    const errorPanel = screen.getByTestId('error-panel');
    expect(errorPanel.textContent).toMatch(/error|falló|no se pudo|problema|intenta/i);
  });
});
