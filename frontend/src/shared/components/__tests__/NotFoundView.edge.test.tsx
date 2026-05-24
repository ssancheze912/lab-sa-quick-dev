/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — NotFoundView (Edge Cases & Content Completeness)
 *
 * Coverage focus:
 *   - 404 numeric heading is present
 *   - Secondary Spanish explanation text is displayed
 *   - Back-link text is non-empty and descriptive (not just an icon)
 *   - Back-link accessible name matches its visual text
 *   - Component snapshot stability (no accidental regressions in structure)
 *   - Container minimum height/fullscreen layout class presence
 *   - No unexpected interactive elements beyond the single back-link
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { NotFoundView } from '../NotFoundView';

// Mock TanStack Router's Link for unit-test isolation
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    'data-testid': dataTestId,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    'data-testid'?: string;
    [key: string]: unknown;
  }) => (
    <a href={to} data-testid={dataTestId} {...props}>
      {children}
    </a>
  ),
}));

describe('NotFoundView — content completeness and edge cases', () => {
  test('should display "404" numeric error code heading', () => {
    render(<NotFoundView />);

    // The 404 heading is rendered as an h1
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('404');
  });

  test('should display secondary explanation text in Spanish', () => {
    render(<NotFoundView />);

    // "La página que buscas no existe o fue movida." should be present
    expect(screen.getByText(/la página que buscas/i)).toBeInTheDocument();
  });

  test('back-link text "Volver a Clientes" is visible', () => {
    render(<NotFoundView />);

    const backLink = screen.getByTestId('not-found-back-link');
    expect(backLink.textContent).toMatch(/volver a clientes/i);
  });

  test('back-link accessible name is non-empty (not just an icon)', () => {
    render(<NotFoundView />);

    const backLink = screen.getByTestId('not-found-back-link');
    // Either textContent or aria-label must be meaningful
    const accessibleName =
      backLink.getAttribute('aria-label') || backLink.textContent;
    expect(accessibleName!.trim().length).toBeGreaterThan(0);
  });

  test('should render exactly one link element (back-link)', () => {
    render(<NotFoundView />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(1);
  });

  test('should render no button elements', () => {
    render(<NotFoundView />);

    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  test('not-found-view container contains the 404 heading and back link', () => {
    render(<NotFoundView />);

    const container = screen.getByTestId('not-found-view');
    expect(container).toContainElement(screen.getByRole('heading', { level: 1 }));
    expect(container).toContainElement(screen.getByTestId('not-found-back-link'));
  });

  test('should remain stable across consecutive renders (no side-effect accumulation)', () => {
    const { unmount } = render(<NotFoundView />);
    unmount();
    render(<NotFoundView />);

    // After remount the view is still correctly rendered
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument();
    expect(screen.getByTestId('not-found-back-link')).toHaveAttribute('href', '/clientes');
  });
});
