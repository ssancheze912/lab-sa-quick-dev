/**
 * Component tests — ClienteListItem — Story 2.1 automation expansion.
 *
 * Tests keyboard navigation, active state, aria-label, and onClick callback.
 * These are edge cases not covered by ClienteListView.test.tsx.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClienteListItem } from '../../../../shared/components/ClienteListItem';
import { buildCliente, resetClienteCounter } from './clienteFactory';

describe('ClienteListItem component', () => {
  beforeEach(() => {
    resetClienteCounter();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Rendering
  // ─────────────────────────────────────────────────────────────────────────

  it('[P1] should render Nombre and NIT visible in the item', () => {
    // GIVEN: A cliente with known Nombre and NIT
    const cliente = buildCliente({ nombre: 'Acme S.A.', nit: '900123456-1' });

    // WHEN: Component renders
    render(<ClienteListItem cliente={cliente} />);

    // THEN: Nombre and NIT are visible
    expect(screen.getByText('Acme S.A.')).toBeInTheDocument();
    expect(screen.getByText('900123456-1')).toBeInTheDocument();
  });

  it('[P1] should have data-testid="cliente-list-item"', () => {
    // GIVEN: A cliente
    const cliente = buildCliente();

    // WHEN: Component renders
    render(<ClienteListItem cliente={cliente} />);

    // THEN: data-testid is present
    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument();
  });

  it('[P1] should have role="button" and tabIndex=0 for accessibility', () => {
    // GIVEN: A cliente
    const cliente = buildCliente();

    // WHEN: Component renders
    render(<ClienteListItem cliente={cliente} />);

    // THEN: Accessible button role
    const item = screen.getByRole('button');
    expect(item).toBeInTheDocument();
    expect(item).toHaveAttribute('tabindex', '0');
  });

  it('[P2] should render aria-label containing Nombre and NIT', () => {
    // GIVEN: A cliente
    const cliente = buildCliente({ nombre: 'Beta Corp', nit: '811999888-9' });

    // WHEN: Component renders
    render(<ClienteListItem cliente={cliente} />);

    // THEN: aria-label contains both Nombre and NIT
    const item = screen.getByRole('button');
    const ariaLabel = item.getAttribute('aria-label') ?? '';
    expect(ariaLabel).toContain('Beta Corp');
    expect(ariaLabel).toContain('811999888-9');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Active state styling
  // ─────────────────────────────────────────────────────────────────────────

  it('[P1] should apply active background when isActive=true', () => {
    // GIVEN: A cliente with isActive=true
    const cliente = buildCliente();

    // WHEN: Component renders with isActive
    render(<ClienteListItem cliente={cliente} isActive={true} />);

    // THEN: Active class is applied
    const item = screen.getByTestId('cliente-list-item');
    expect(item.className).toContain('bg-slate-100');
  });

  it('[P1] should not apply active background when isActive=false', () => {
    // GIVEN: A cliente with isActive=false (default)
    const cliente = buildCliente();

    // WHEN: Component renders without isActive
    render(<ClienteListItem cliente={cliente} isActive={false} />);

    // THEN: Active class is NOT applied
    const item = screen.getByTestId('cliente-list-item');
    // bg-slate-100 should not be in className
    // Note: empty string isActive=false means the conditional is not applied
    expect(item.className).not.toMatch(/\bbg-slate-100\b/);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // onClick callback
  // ─────────────────────────────────────────────────────────────────────────

  it('[P1] should call onClick with the cliente object when clicked', () => {
    // GIVEN: A mock onClick handler
    const handleClick = vi.fn();
    const cliente = buildCliente({ nombre: 'Click Test Corp' });

    // WHEN: Component renders and is clicked
    render(<ClienteListItem cliente={cliente} onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('cliente-list-item'));

    // THEN: onClick called once with the correct cliente
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(cliente);
  });

  it('[P1] should not throw when onClick is not provided and item is clicked', () => {
    // GIVEN: No onClick handler provided
    const cliente = buildCliente();
    render(<ClienteListItem cliente={cliente} />);

    // WHEN: Item is clicked
    // THEN: No error thrown
    expect(() => fireEvent.click(screen.getByTestId('cliente-list-item'))).not.toThrow();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard navigation — Enter key
  // ─────────────────────────────────────────────────────────────────────────

  it('[P1] should call onClick when Enter key is pressed on the item', () => {
    // GIVEN: A mock onClick and a rendered item
    const handleClick = vi.fn();
    const cliente = buildCliente({ nombre: 'Keyboard Enter Test' });
    render(<ClienteListItem cliente={cliente} onClick={handleClick} />);

    // WHEN: Enter key pressed on the item
    const item = screen.getByTestId('cliente-list-item');
    fireEvent.keyDown(item, { key: 'Enter', code: 'Enter' });

    // THEN: onClick is invoked
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(cliente);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard navigation — Space key
  // ─────────────────────────────────────────────────────────────────────────

  it('[P1] should call onClick when Space key is pressed on the item', () => {
    // GIVEN: A mock onClick and a rendered item
    const handleClick = vi.fn();
    const cliente = buildCliente({ nombre: 'Keyboard Space Test' });
    render(<ClienteListItem cliente={cliente} onClick={handleClick} />);

    // WHEN: Space key pressed on the item
    const item = screen.getByTestId('cliente-list-item');
    fireEvent.keyDown(item, { key: ' ', code: 'Space' });

    // THEN: onClick is invoked
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('[P2] should NOT call onClick when other keys are pressed (e.g., Tab)', () => {
    // GIVEN: A mock onClick and a rendered item
    const handleClick = vi.fn();
    const cliente = buildCliente();
    render(<ClienteListItem cliente={cliente} onClick={handleClick} />);

    // WHEN: Tab key pressed
    const item = screen.getByTestId('cliente-list-item');
    fireEvent.keyDown(item, { key: 'Tab', code: 'Tab' });

    // THEN: onClick NOT invoked
    expect(handleClick).not.toHaveBeenCalled();
  });
});
