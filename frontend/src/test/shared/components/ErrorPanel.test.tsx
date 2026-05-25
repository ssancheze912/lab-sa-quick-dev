/**
 * Story 2.1: Client List & Search
 * Epic 2: Gestión de Clientes
 *
 * Component Tests — ErrorPanel — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC4 — ErrorPanel shows error message in Spanish and a "Reintentar" button
 *          that calls the onRetry callback
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Import the component under test
// This import will fail (RED phase) until the component is created
import { ErrorPanel } from '@/shared/components/ErrorPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — Rendering', () => {
  it('renders with data-testid="error-panel"', () => {
    // GIVEN: A mock onRetry handler
    // WHEN: ErrorPanel is rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: The element with testid "error-panel" is in the DOM
    expect(screen.getByTestId('error-panel')).toBeTruthy();
  });

  it('renders a Spanish error message (not the raw error.message)', () => {
    // GIVEN: ErrorPanel with an onRetry prop
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: A Spanish-language error message is visible (not a raw exception string)
    const panel = screen.getByTestId('error-panel');
    const text = panel.textContent?.toLowerCase() ?? '';
    // Must contain Spanish error phrasing — not "Error" or "Failed" in English
    expect(text).toMatch(/no se pudo|error al|información/);
  });

  it('renders a "Reintentar" button', () => {
    // GIVEN: ErrorPanel is rendered
    render(<ErrorPanel onRetry={vi.fn()} />);

    // THEN: A button with text "Reintentar" is visible
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Interaction
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — Interaction', () => {
  it('calls onRetry when "Reintentar" button is clicked', () => {
    // GIVEN: A mock onRetry callback
    const mockOnRetry = vi.fn();
    render(<ErrorPanel onRetry={mockOnRetry} />);

    // WHEN: User clicks "Reintentar"
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));

    // THEN: onRetry is called exactly once
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry again on second click', () => {
    // GIVEN: A mock onRetry callback
    const mockOnRetry = vi.fn();
    render(<ErrorPanel onRetry={mockOnRetry} />);

    // WHEN: User clicks "Reintentar" twice
    const button = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(button);
    fireEvent.click(button);

    // THEN: onRetry is called twice
    expect(mockOnRetry).toHaveBeenCalledTimes(2);
  });
});
