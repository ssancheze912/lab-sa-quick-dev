/**
 * Story 2.1: Client List & Search
 * Component Tests — ClientListItem (RED Phase — ATDD)
 *
 * Acceptance Criteria covered:
 *   AC5 — Each item shows Nombre and NIT/RUC; item is keyboard-accessible (WCAG 2.1 AA)
 *   AC1 — List items identifiable by data-testid
 *
 * Tests will FAIL until ClientListItem component is implemented.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { ClientListItem } from '../ClientListItem';

const DEFAULT_PROPS = {
  id: 'abc-123',
  nombre: 'Empresa Alpha SA',
  nit: '900123456-1',
  onClick: () => {},
};

// ─────────────────────────────────────────────────────────────────────────────
// Given: ClientListItem rendered with valid props
// When:  component mounts
// Then:  shows Nombre and NIT with correct testid
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — rendering', () => {
  test('should render with data-testid="client-item-{id}"', () => {
    // GIVEN: item with id "abc-123"
    render(<ClientListItem {...DEFAULT_PROPS} />);

    // THEN: testid is correctly set
    expect(screen.getByTestId('client-item-abc-123')).toBeInTheDocument();
  });

  test('should display the client Nombre prominently', () => {
    // GIVEN: item with Nombre "Empresa Alpha SA"
    render(<ClientListItem {...DEFAULT_PROPS} />);

    // THEN: Nombre text is visible
    expect(screen.getByTestId('client-item-abc-123')).toHaveTextContent('Empresa Alpha SA');
  });

  test('should display the client NIT/RUC', () => {
    // GIVEN: item with NIT "900123456-1"
    render(<ClientListItem {...DEFAULT_PROPS} />);

    // THEN: NIT text is visible
    expect(screen.getByTestId('client-item-abc-123')).toHaveTextContent('900123456-1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Given: isSelected prop
// When:  isSelected is true
// Then:  visual highlight is applied
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — selection highlight', () => {
  test('should apply selected styling class when isSelected is true', () => {
    // GIVEN: item with isSelected=true
    render(<ClientListItem {...DEFAULT_PROPS} isSelected={true} />);

    const item = screen.getByTestId('client-item-abc-123');

    // THEN: item has an indicator of selection (aria or class)
    // Accept either: aria-selected="true", a "selected" class, or a data attribute
    const isAriaSelected = item.getAttribute('aria-selected') === 'true';
    const hasSelectedClass =
      item.className.includes('selected') ||
      item.className.includes('border-l') ||
      item.className.includes('bg-');
    const hasDataSelected = item.getAttribute('data-selected') === 'true';

    expect(isAriaSelected || hasSelectedClass || hasDataSelected).toBe(true);
  });

  test('should NOT apply selected styling when isSelected is false', () => {
    // GIVEN: item with isSelected=false (or omitted)
    render(<ClientListItem {...DEFAULT_PROPS} isSelected={false} />);

    const item = screen.getByTestId('client-item-abc-123');

    // THEN: item should not have aria-selected="true"
    expect(item.getAttribute('aria-selected')).not.toBe('true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Given: ClientListItem with onClick handler
// When:  user interacts via click, Enter, or Space
// Then:  onClick is called — WCAG 2.1 AA keyboard accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — keyboard accessibility (WCAG 2.1 AA)', () => {
  test('should call onClick when item is clicked', async () => {
    // GIVEN: onClick is a mock function
    const onClick = vi.fn();
    render(<ClientListItem {...DEFAULT_PROPS} onClick={onClick} />);

    // WHEN: user clicks the item
    await userEvent.click(screen.getByTestId('client-item-abc-123'));

    // THEN: onClick is called
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('should call onClick when Enter key is pressed on focused item', async () => {
    // GIVEN: onClick is a mock function
    const onClick = vi.fn();
    render(<ClientListItem {...DEFAULT_PROPS} onClick={onClick} />);

    // WHEN: item is focused and Enter is pressed
    const item = screen.getByTestId('client-item-abc-123');
    item.focus();
    await userEvent.keyboard('{Enter}');

    // THEN: onClick is called
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('should call onClick when Space key is pressed on focused item', async () => {
    // GIVEN: onClick is a mock function
    const onClick = vi.fn();
    render(<ClientListItem {...DEFAULT_PROPS} onClick={onClick} />);

    // WHEN: item is focused and Space is pressed
    const item = screen.getByTestId('client-item-abc-123');
    item.focus();
    await userEvent.keyboard(' ');

    // THEN: onClick is called
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('should be focusable via keyboard (tabIndex >= 0)', () => {
    // GIVEN: ClientListItem rendered
    render(<ClientListItem {...DEFAULT_PROPS} />);

    const item = screen.getByTestId('client-item-abc-123');

    // THEN: item has tabIndex 0 (or is a naturally focusable element)
    const tabIndex = parseInt(item.getAttribute('tabindex') ?? '0', 10);
    expect(tabIndex).toBeGreaterThanOrEqual(0);
  });

  test('should have role="button" or be a native interactive element', () => {
    // GIVEN: ClientListItem rendered
    render(<ClientListItem {...DEFAULT_PROPS} />);

    // THEN: item is accessible as button role
    // This test uses getByRole to check for button or link
    const item =
      screen.queryByRole('button') ??
      screen.queryByRole('link') ??
      screen.getByTestId('client-item-abc-123');

    expect(item).toBeInTheDocument();

    const role = item.getAttribute('role');
    const tagName = item.tagName.toLowerCase();
    const isInteractiveNatively = ['button', 'a', 'input'].includes(tagName);
    const hasButtonRole = role === 'button' || role === 'link';

    expect(isInteractiveNatively || hasButtonRole).toBe(true);
  });
});
