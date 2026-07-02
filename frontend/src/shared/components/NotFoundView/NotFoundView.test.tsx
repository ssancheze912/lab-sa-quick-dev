/**
 * Story 1.2: Frontend Navigation Shell — NotFoundView Component Tests
 * ATDD RED Phase — these tests FAIL until NotFoundView.tsx is implemented.
 *
 * Test case covered:
 *   [TC-E1-P1-04] 404 view renders "Página no encontrada" heading + "Ir a Clientes" button
 *                 that navigates to /clientes via useNavigate.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotFoundView } from './NotFoundView';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotFoundView', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('[TC-E1-P1-04] should render the Spanish heading "Página no encontrada"', () => {
    // GIVEN: The user hit an unknown route
    // WHEN: The NotFoundView is rendered
    render(<NotFoundView />);

    // THEN: A level-1 heading "Página no encontrada" is present
    expect(screen.getByRole('heading', { level: 1, name: /página no encontrada/i })).toBeInTheDocument();
  });

  it('[TC-E1-P1-04] should render an "Ir a Clientes" recovery button', () => {
    // GIVEN: The 404 view is rendered
    // WHEN: The user looks for the recovery action
    render(<NotFoundView />);

    // THEN: An "Ir a Clientes" button is present
    expect(screen.getByRole('button', { name: 'Ir a Clientes' })).toBeInTheDocument();
  });

  it('[TC-E1-P1-04] should expose data-testid="not-found-view" on the container', () => {
    // GIVEN: ATDD requires a stable selector for the 404 container
    // WHEN: The NotFoundView is rendered
    render(<NotFoundView />);

    // THEN: The container carries data-testid="not-found-view"
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
  });

  it('[TC-E1-P1-04] should call useNavigate with { to: "/clientes" } when "Ir a Clientes" is clicked', async () => {
    // GIVEN: The 404 view is rendered
    const user = userEvent.setup();
    render(<NotFoundView />);

    // WHEN: The user clicks the recovery button
    await user.click(screen.getByRole('button', { name: 'Ir a Clientes' }));

    // THEN: useNavigate was invoked with { to: '/clientes' }
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/clientes' });
  });

  it('[TC-E1-P1-04] should annotate the container with role="alert" for a11y', () => {
    // GIVEN: The 404 view acts as a notification
    // WHEN: The NotFoundView is rendered
    render(<NotFoundView />);

    // THEN: The container carries role="alert" (aria-live implied)
    const container = screen.getByTestId('not-found-view');
    expect(container).toHaveAttribute('role', 'alert');
  });
});
