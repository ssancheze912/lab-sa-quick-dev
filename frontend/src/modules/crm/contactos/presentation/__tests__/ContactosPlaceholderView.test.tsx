/**
 * Story 1.2: Frontend Navigation Shell
 * Unit Tests — ContactosPlaceholderView
 *
 * Coverage focus:
 *   - Renders with correct data-testid (AC4, AC5)
 *   - Displays "Contactos" heading in Spanish
 *   - Component is a stable placeholder (no side effects, no async behaviour)
 *   - Structurally parallel to ClientesPlaceholderView (symmetry test)
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { ContactosPlaceholderView } from '../ContactosPlaceholderView';

describe('ContactosPlaceholderView — placeholder view rendering', () => {
  test('should render the contactos-view container with correct data-testid', () => {
    render(<ContactosPlaceholderView />);

    expect(screen.getByTestId('contactos-view')).toBeInTheDocument();
  });

  test('should display "Contactos" heading text', () => {
    render(<ContactosPlaceholderView />);

    expect(screen.getByRole('heading', { name: /contactos/i })).toBeInTheDocument();
  });

  test('should render exactly one heading element', () => {
    render(<ContactosPlaceholderView />);

    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBe(1);
  });

  test('should render without crashing when mounted multiple times', () => {
    const { unmount } = render(<ContactosPlaceholderView />);
    unmount();
    render(<ContactosPlaceholderView />);

    expect(screen.getByTestId('contactos-view')).toBeInTheDocument();
  });

  test('should not render any interactive elements in the placeholder', () => {
    render(<ContactosPlaceholderView />);

    const buttons = screen.queryAllByRole('button');
    const links = screen.queryAllByRole('link');
    expect(buttons.length).toBe(0);
    expect(links.length).toBe(0);
  });

  test('contactos-view container has visible text content', () => {
    render(<ContactosPlaceholderView />);

    const view = screen.getByTestId('contactos-view');
    expect(view.textContent!.trim().length).toBeGreaterThan(0);
  });

  test('contactos-view data-testid is distinct from clientes-view data-testid', () => {
    // Symmetry check: both views co-exist in the same test run without confusion
    render(<ContactosPlaceholderView />);

    expect(screen.getByTestId('contactos-view')).toBeInTheDocument();
    expect(screen.queryByTestId('clientes-view')).not.toBeInTheDocument();
  });
});
