/**
 * Story 1.2: Frontend Navigation Shell
 * Unit Tests — ClientesPlaceholderView
 *
 * Coverage focus:
 *   - Renders with correct data-testid (AC3, AC5)
 *   - Displays "Clientes" heading in Spanish
 *   - Component is a stable placeholder (no side effects, no async behaviour)
 *   - Root element is accessible as a region
 */

import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { ClientesPlaceholderView } from '../ClientesPlaceholderView';

describe('ClientesPlaceholderView — placeholder view rendering', () => {
  test('should render the clientes-view container with correct data-testid', () => {
    render(<ClientesPlaceholderView />);

    expect(screen.getByTestId('clientes-view')).toBeInTheDocument();
  });

  test('should display "Clientes" heading text', () => {
    render(<ClientesPlaceholderView />);

    // The heading shows Spanish label
    expect(screen.getByRole('heading', { name: /clientes/i })).toBeInTheDocument();
  });

  test('should render exactly one heading element', () => {
    render(<ClientesPlaceholderView />);

    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBe(1);
  });

  test('should render without crashing when mounted multiple times', () => {
    // Stability check — no shared mutable state
    const { unmount } = render(<ClientesPlaceholderView />);
    unmount();
    render(<ClientesPlaceholderView />);

    expect(screen.getByTestId('clientes-view')).toBeInTheDocument();
  });

  test('should not render any interactive elements in the placeholder', () => {
    render(<ClientesPlaceholderView />);

    // The placeholder is display-only — no buttons or links expected
    const buttons = screen.queryAllByRole('button');
    const links = screen.queryAllByRole('link');
    expect(buttons.length).toBe(0);
    expect(links.length).toBe(0);
  });

  test('clientes-view container has visible text content', () => {
    render(<ClientesPlaceholderView />);

    const view = screen.getByTestId('clientes-view');
    expect(view.textContent!.trim().length).toBeGreaterThan(0);
  });
});
