/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Component Tests — RED Phase (Vitest + RTL)
 * These tests are intentionally FAILING until ErrorPanel is implemented.
 *
 * Component under test: ErrorPanel (not yet created)
 * Path: frontend/src/shared/components/ErrorPanel.tsx
 *
 * Required data-testid:
 *   - error-panel — root element of ErrorPanel
 *
 * Props interface (expected by implementation):
 *   - onRetry: () => void — called when the user clicks "Reintentar"
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ErrorPanel does not exist yet — import will fail in RED phase (intentional)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ErrorPanel } = require('../ErrorPanel');

describe('ErrorPanel — component tests (RED phase)', () => {
  it('should render with data-testid="error-panel"', () => {
    // GIVEN: ErrorPanel is mounted with a required onRetry prop
    // WHEN: The component renders
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: The root element has data-testid="error-panel"
    expect(screen.getByTestId('error-panel')).toBeInTheDocument();
  });

  it('should display an error message in Spanish', () => {
    // GIVEN: ErrorPanel is rendered (AC4 — shows error state)
    // WHEN: The component renders
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: An error message in Spanish is visible
    // The exact text is up to the implementation — we check for common patterns
    const errorPanel = screen.getByTestId('error-panel');
    expect(errorPanel.textContent).toMatch(/error|falló|no se pudo|problema|intenta/i);
  });

  it('should display a "Reintentar" button', () => {
    // GIVEN: ErrorPanel is rendered with an onRetry callback
    // WHEN: The component renders
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: A button labeled "Reintentar" (or matching /reintentar/i) is visible
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('should call onRetry when the "Reintentar" button is clicked', async () => {
    // GIVEN: ErrorPanel is rendered with a spy as onRetry
    const onRetrySpy = vi.fn();
    render(<ErrorPanel onRetry={onRetrySpy} />);

    // WHEN: The user clicks the "Reintentar" button
    const reintentarButton = screen.getByRole('button', { name: /reintentar/i });
    await userEvent.click(reintentarButton);

    // THEN: onRetry is called exactly once
    expect(onRetrySpy).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry only once per click (not debounced or double-fired)', async () => {
    // GIVEN: ErrorPanel is rendered
    const onRetrySpy = vi.fn();
    render(<ErrorPanel onRetry={onRetrySpy} />);

    // WHEN: The user clicks "Reintentar" once
    await userEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    // THEN: onRetry is called exactly once
    expect(onRetrySpy).toHaveBeenCalledTimes(1);
  });

  it('should have an accessible ARIA role for screen readers (role="alert")', () => {
    // GIVEN: ErrorPanel is rendered (WCAG 2.1 AA requirement — error must be announced)
    // WHEN: The component renders
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: The root element uses role="alert" (disruptive — communicates error urgently)
    const errorPanel = screen.getByTestId('error-panel');
    expect(errorPanel.getAttribute('role')).toBe('alert');
  });

  it('should have a descriptive accessible label on the "Reintentar" button', () => {
    // GIVEN: ErrorPanel is rendered (WCAG 2.1 AA — buttons must have descriptive labels)
    // WHEN: The component renders
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: The "Reintentar" button has an accessible name
    const button = screen.getByRole('button', { name: /reintentar/i });
    // The accessible name is provided by either visible text or aria-label
    expect(button.textContent?.trim().length).toBeGreaterThan(0);
  });
});
