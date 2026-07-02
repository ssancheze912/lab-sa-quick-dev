/**
 * Story 1.2 — BMad Automate Expansion (Component-level edge cases)
 *
 * Extends the ATDD suite in `NotFoundView.test.tsx` with edge cases and
 * negative paths that acceptance-level tests do NOT cover:
 *
 *  - Explanatory paragraph text is present and in Spanish
 *  - aria-live="polite" on the container (per Task 6 accessibility spec)
 *  - The heading semantic level is exactly 1 (single-h1-per-view rule)
 *  - Warning icon is hidden from assistive tech via aria-hidden
 *  - Multiple clicks on "Ir a Clientes" call navigate every time
 *  - The recovery button is a real <button> element (keyboard accessible)
 *  - Keyboard activation (Enter) also triggers navigation
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

describe('NotFoundView — edge cases', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('[P2] Copy content and language', () => {
    it('should render the Spanish explanatory paragraph', () => {
      // GIVEN: Task 6 requires an explanatory paragraph
      render(<NotFoundView />);

      // WHEN: We look for the paragraph body
      // THEN: Spanish copy about verifying the URL is present
      expect(
        screen.getByText(/La ruta solicitada no existe\. Verifica la URL o vuelve al inicio\./i),
      ).toBeInTheDocument();
    });

    it('should render exactly one <h1> element (single-h1-per-view rule)', () => {
      // GIVEN: The 404 view acts as its own page section
      render(<NotFoundView />);

      // WHEN: We enumerate all level-1 headings
      const headings = screen.getAllByRole('heading', { level: 1 });

      // THEN: Exactly one <h1> is rendered
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent(/página no encontrada/i);
    });
  });

  describe('[P2] Accessibility attributes', () => {
    it('should annotate the container with aria-live="polite"', () => {
      // GIVEN: Task 6 mandates aria-live="polite" for graceful announcement
      render(<NotFoundView />);

      // WHEN: We inspect the 404 container
      const container = screen.getByTestId('not-found-view');

      // THEN: aria-live is set to polite (screen readers announce non-interruptively)
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should hide the decorative warning icon from assistive tech (aria-hidden)', () => {
      // GIVEN: The icon is decorative — the <h1> already conveys meaning
      render(<NotFoundView />);

      // WHEN: We locate any aria-hidden SVG within the container
      const container = screen.getByTestId('not-found-view');
      const hiddenSvg = container.querySelector('svg[aria-hidden="true"]');

      // THEN: The icon carries aria-hidden="true" so it does not double-announce
      expect(hiddenSvg).not.toBeNull();
    });
  });

  describe('[P2] Recovery button behaviour', () => {
    it('should call useNavigate every time "Ir a Clientes" is clicked (no debounce/lock)', async () => {
      // GIVEN: Some users double-click; the button must be idempotently callable
      const user = userEvent.setup();
      render(<NotFoundView />);
      const button = screen.getByRole('button', { name: 'Ir a Clientes' });

      // WHEN: The user clicks the button twice in rapid succession
      await user.click(button);
      await user.click(button);

      // THEN: navigate is called both times with the same intent
      expect(mockNavigate).toHaveBeenCalledTimes(2);
      expect(mockNavigate).toHaveBeenNthCalledWith(1, { to: '/clientes' });
      expect(mockNavigate).toHaveBeenNthCalledWith(2, { to: '/clientes' });
    });

    it('should be activatable via the keyboard (Enter key)', async () => {
      // GIVEN: Company standard requires WCAG 2.1 AA keyboard operability
      const user = userEvent.setup();
      render(<NotFoundView />);
      const button = screen.getByRole('button', { name: 'Ir a Clientes' });

      // WHEN: The user focuses the button and presses Enter
      button.focus();
      await user.keyboard('{Enter}');

      // THEN: navigate is called with the correct target
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/clientes' });
    });

    it('should render the recovery button as a real HTMLButtonElement (not a link)', () => {
      // GIVEN: Task 6 mandates a <Button> primitive with onClick, not <a href>
      render(<NotFoundView />);

      // WHEN: We look up the recovery action
      const button = screen.getByRole('button', { name: 'Ir a Clientes' });

      // THEN: The element is a real <button> (or role=button on a button element)
      // Anchors would break the SPA contract (would trigger full navigation).
      expect(button.tagName.toLowerCase()).toBe('button');
    });
  });
});
