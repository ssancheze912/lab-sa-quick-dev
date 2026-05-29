/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — 404 Not Found — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC5 — Unknown route renders graceful 404 view in Spanish with link to /clientes
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// NOTE: These imports will fail until implementation is complete (RED phase).
// Component under test — to be created in Story 1.2 implementation.
import { NotFoundView } from '../../../shared/components/ui/NotFoundView';

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — NotFoundView renders correctly for unknown routes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — NotFoundView for unknown routes', () => {
  it('should render the not-found view with correct data-testid', () => {
    // GIVEN: An unknown route is accessed
    render(<NotFoundView />);

    // WHEN: Component renders

    // THEN: The not-found container is present in the DOM
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
  });

  it('should display Spanish message "Página no encontrada"', () => {
    // GIVEN: The NotFoundView is rendered
    render(<NotFoundView />);

    // WHEN: Component renders

    // THEN: Spanish not-found message is shown
    expect(screen.getByTestId('not-found-message')).toHaveTextContent('Página no encontrada');
  });

  it('should display a link to return to /clientes', () => {
    // GIVEN: The NotFoundView is rendered
    render(<NotFoundView />);

    // WHEN: Component renders

    // THEN: A back link targeting /clientes is visible
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toBeInTheDocument();
  });

  it('should have the back link pointing to /clientes', () => {
    // GIVEN: The NotFoundView is rendered
    render(<NotFoundView />);

    // WHEN: Component renders

    // THEN: The back link href is /clientes
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toHaveAttribute('href', '/clientes');
  });

  it('should display a graceful message (not a raw error or stack trace)', () => {
    // GIVEN: The NotFoundView is rendered
    render(<NotFoundView />);

    // WHEN: Component renders

    // THEN: The view contains readable user-facing text in Spanish
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
    expect(screen.queryByText(/Error|Exception|stack/i)).not.toBeInTheDocument();
  });
});
