/**
 * Story 2.1: Client List & Search
 * Component Tests — ClientListItem (Edge Cases — Automate EXPAND)
 *
 * Covers boundary conditions NOT in ATDD tests:
 *   - Other key presses (e.g., Escape, Tab, ArrowDown) do NOT call onClick
 *   - isSelected default is false when prop omitted
 *   - Very long Nombre does not crash render
 *   - Very long NIT does not crash render
 *   - ID with special characters in testid (UUID format)
 *   - Multiple rapid clicks call onClick multiple times
 */

import { render, screen, fireEvent } from '@testing-library/react';
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
// Edge: other key presses should NOT trigger onClick
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — edge: non-activating key presses', () => {
  test('Escape key should NOT call onClick', async () => {
    // GIVEN: onClick is a mock
    const onClick = vi.fn();
    render(<ClientListItem {...DEFAULT_PROPS} onClick={onClick} />);

    // WHEN: user focuses item and presses Escape
    const item = screen.getByTestId('client-item-abc-123');
    item.focus();
    await userEvent.keyboard('{Escape}');

    // THEN: onClick is NOT called
    expect(onClick).not.toHaveBeenCalled();
  });

  test('ArrowDown key should NOT call onClick', async () => {
    // GIVEN: onClick is a mock
    const onClick = vi.fn();
    render(<ClientListItem {...DEFAULT_PROPS} onClick={onClick} />);

    // WHEN: user presses ArrowDown
    const item = screen.getByTestId('client-item-abc-123');
    item.focus();
    await userEvent.keyboard('{ArrowDown}');

    // THEN: onClick is NOT called
    expect(onClick).not.toHaveBeenCalled();
  });

  test('ArrowUp key should NOT call onClick', async () => {
    // GIVEN: onClick is a mock
    const onClick = vi.fn();
    render(<ClientListItem {...DEFAULT_PROPS} onClick={onClick} />);

    // WHEN: user presses ArrowUp
    const item = screen.getByTestId('client-item-abc-123');
    item.focus();
    await userEvent.keyboard('{ArrowUp}');

    // THEN: onClick is NOT called
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: isSelected defaults to false when prop is omitted
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — edge: isSelected default value', () => {
  test('When isSelected prop is omitted, aria-selected should not be true', () => {
    // GIVEN: no isSelected prop provided
    render(
      <ClientListItem
        id="abc-123"
        nombre="Empresa"
        nit="900123456-1"
        onClick={() => {}}
      />,
    );

    const item = screen.getByTestId('client-item-abc-123');

    // THEN: aria-selected is not "true"
    expect(item.getAttribute('aria-selected')).not.toBe('true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: very long Nombre and NIT (boundary — no crash)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — edge: long string props', () => {
  test('Given 200-character Nombre, should render without crash', () => {
    // GIVEN: Nombre at max DB length (200)
    const longNombre = 'A'.repeat(200);

    expect(() =>
      render(
        <ClientListItem
          id="long-id"
          nombre={longNombre}
          nit="900123456-1"
          onClick={() => {}}
        />,
      ),
    ).not.toThrow();

    // THEN: item is in the document
    expect(screen.getByTestId('client-item-long-id')).toBeInTheDocument();
  });

  test('Given 50-character NIT, should render without crash', () => {
    // GIVEN: NIT at max DB length (50)
    const longNit = '9'.repeat(50);

    expect(() =>
      render(
        <ClientListItem
          id="long-nit-id"
          nombre="Empresa Normal"
          nit={longNit}
          onClick={() => {}}
        />,
      ),
    ).not.toThrow();

    expect(screen.getByTestId('client-item-long-nit-id')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: UUID id in testid (standard production format)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — edge: UUID-format id', () => {
  test('Given a UUID id, data-testid should contain full UUID', () => {
    // GIVEN: a real UUID
    const uuid = '11111111-0000-0000-0000-000000000001';
    render(
      <ClientListItem
        id={uuid}
        nombre="Empresa UUID"
        nit="900000001-1"
        onClick={() => {}}
      />,
    );

    // THEN: testid includes the full UUID
    expect(
      screen.getByTestId(`client-item-${uuid}`),
    ).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: multiple rapid clicks
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — edge: multiple clicks', () => {
  test('Clicking 3 times calls onClick 3 times', async () => {
    // GIVEN: onClick mock
    const onClick = vi.fn();
    render(<ClientListItem {...DEFAULT_PROPS} onClick={onClick} />);

    const item = screen.getByTestId('client-item-abc-123');

    // WHEN: clicked 3 times
    await userEvent.click(item);
    await userEvent.click(item);
    await userEvent.click(item);

    // THEN: called exactly 3 times
    expect(onClick).toHaveBeenCalledTimes(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Space key prevents default scroll behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — edge: Space key prevents default', () => {
  test('Space key fires onClick and event default is prevented (checked via dispatchEvent)', () => {
    // GIVEN: onClick mock
    const onClick = vi.fn();
    render(<ClientListItem {...DEFAULT_PROPS} onClick={onClick} />);

    const item = screen.getByTestId('client-item-abc-123');
    item.focus();

    // WHEN: Space keydown event is dispatched (cancelable)
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      bubbles: true,
      cancelable: true,
    });
    const dispatched = item.dispatchEvent(event);

    // THEN: onClick is called (via the React synthetic event handler)
    expect(onClick).toHaveBeenCalledTimes(1);
    // AND: the event was prevented (dispatchEvent returns false when preventDefault called)
    expect(dispatched).toBe(false);
  });

  test('Enter key fires onClick and event default is prevented', () => {
    // GIVEN: onClick mock
    const onClick = vi.fn();
    render(<ClientListItem {...DEFAULT_PROPS} onClick={onClick} />);

    const item = screen.getByTestId('client-item-abc-123');
    item.focus();

    // WHEN: Enter keydown event is dispatched (cancelable)
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    const dispatched = item.dispatchEvent(event);

    // THEN: onClick is called
    expect(onClick).toHaveBeenCalledTimes(1);
    // AND: the event was prevented
    expect(dispatched).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: isSelected state change (re-render)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — edge: isSelected state change on re-render', () => {
  test('Switching isSelected from false to true updates the component', () => {
    // GIVEN: initially not selected
    const { rerender } = render(
      <ClientListItem {...DEFAULT_PROPS} isSelected={false} />,
    );

    const item = screen.getByTestId('client-item-abc-123');
    expect(item.getAttribute('aria-selected')).not.toBe('true');

    // WHEN: re-rendered as selected
    rerender(<ClientListItem {...DEFAULT_PROPS} isSelected={true} />);

    // THEN: aria-selected is now true
    expect(item.getAttribute('aria-selected')).toBe('true');
  });
});
