/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — NotFoundView
 *
 * ATDD Acceptance Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC7 — Unknown route renders 404 view with Spanish message "Página no encontrada"
 *          and a link back to /clientes.
 *
 * NOTE: NotFoundView does not exist yet — all tests will fail with module import errors (RED phase).
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { NotFoundView } from '../NotFoundView';

// Mock TanStack Router's Link for unit-test isolation
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} data-testid={(props as { 'data-testid'?: string })['data-testid']} {...props}>
      {children}
    </a>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — 404 Not-Found View
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — AC7: 404 view with Spanish message and back link', () => {
  test('should render the not-found view container', () => {
    // GIVEN: NotFoundView is mounted
    render(<NotFoundView />);

    // THEN: The not-found view container is in the document
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
  });

  test('should display "Página no encontrada" Spanish message', () => {
    // GIVEN: NotFoundView is mounted
    render(<NotFoundView />);

    // WHEN: The component is fully rendered
    // THEN: The Spanish message "Página no encontrada" is visible
    expect(screen.getByText(/Página no encontrada/i)).toBeInTheDocument();
  });

  test('should render a back link pointing to /clientes', () => {
    // GIVEN: NotFoundView is mounted
    render(<NotFoundView />);

    // THEN: The back link is present and points to /clientes
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/clientes');
  });

  test('should render the back link as a visible element', () => {
    // GIVEN: NotFoundView is mounted
    render(<NotFoundView />);

    // THEN: The back link element is visible to the user
    expect(screen.getByTestId('not-found-back-link')).toBeVisible();
  });

  test('should display the not-found view as a user-friendly error page', () => {
    // GIVEN: NotFoundView is mounted
    render(<NotFoundView />);

    // THEN: The page communicates a friendly message (not a raw error dump)
    // The container should have visible text content
    const view = screen.getByTestId('not-found-view');
    expect(view.textContent).toBeTruthy();
    expect(view.textContent!.length).toBeGreaterThan(0);
  });

  test('should have the back link with visible descriptive text', () => {
    // GIVEN: NotFoundView is mounted
    render(<NotFoundView />);

    // THEN: The back link has meaningful label text (not empty)
    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink.textContent).toBeTruthy();
    expect(backLink.textContent!.trim().length).toBeGreaterThan(0);
  });
});
