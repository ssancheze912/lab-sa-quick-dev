/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — 404 Not Found — Vitest + React Testing Library
 *
 * Acceptance Criteria covered:
 *   AC5 — Unknown route renders graceful 404 view in Spanish with link to /clientes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { NotFoundView } from '../../shared/components/ui/NotFoundView';

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — NotFoundView renders correctly for unknown routes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — NotFoundView for unknown routes', () => {
  it('should render the not-found view with correct data-testid', () => {
    render(<NotFoundView />);
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
  });

  it('should display Spanish message "Página no encontrada"', () => {
    render(<NotFoundView />);
    expect(screen.getByTestId('not-found-message')).toHaveTextContent('Página no encontrada');
  });

  it('should display a link to return to /clientes', () => {
    render(<NotFoundView />);
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toBeInTheDocument();
  });

  it('should have the back link pointing to /clientes', () => {
    render(<NotFoundView />);
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toHaveAttribute('href', '/clientes');
  });

  it('should display a graceful message (not a raw error or stack trace)', () => {
    render(<NotFoundView />);
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
    expect(screen.queryByText(/Error|Exception|stack/i)).not.toBeInTheDocument();
  });
});
