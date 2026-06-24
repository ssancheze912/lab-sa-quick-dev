/**
 * Component Tests — ClientListItem (shared component, Story 2.1)
 * BMad-Integrated Mode: unit-level tests for the ClientListItem component.
 *
 * These tests are NOT present in the ATDD suite (which tests ClienteListView E2E).
 * They cover the component in isolation: props, rendering, events, accessibility.
 *
 * Edge cases covered:
 *   - Renders with isSelected=true (active state classes)
 *   - Renders with isSelected=false (default state classes)
 *   - onClick is called with correct id on click
 *   - aria-selected="true" when selected
 *   - aria-selected="false" when not selected
 *   - data-testid matches the cliente id pattern
 *   - Renders nombre and nit text
 *   - Long nombre is truncated (CSS truncate class applied)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientListItem } from '../ClientListItem';
import type { Cliente } from '../../../modules/crm/clientes/domain/Cliente';

// ─────────────────────────────────────────────────────────────────────────────
// Test fixture
// ─────────────────────────────────────────────────────────────────────────────

const mockCliente: Cliente = {
  id: 'test-id-001',
  nombre: 'Empresa Test SA',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — rendering', () => {

  it('[P1] should render the cliente Nombre', () => {
    // GIVEN: A cliente with a known Nombre
    // WHEN: ClientListItem is rendered
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: Nombre text is visible
    expect(screen.getByText('Empresa Test SA')).toBeInTheDocument();
  });

  it('[P1] should render the cliente NIT/RUC', () => {
    // GIVEN: A cliente with a known NIT
    // WHEN: ClientListItem is rendered
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: NIT text is visible
    expect(screen.getByText('900123456-1')).toBeInTheDocument();
  });

  it('[P1] should render a list item element (li)', () => {
    // GIVEN: A cliente
    // WHEN: ClientListItem is rendered
    const { container } = render(
      <ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />
    );

    // THEN: The root element is a <li>
    expect(container.firstChild?.nodeName).toBe('LI');
  });

  it('[P1] should render with data-testid="client-list-item-{id}"', () => {
    // GIVEN: A cliente with id "test-id-001"
    // WHEN: ClientListItem is rendered
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: data-testid matches the expected pattern
    expect(screen.getByTestId('client-list-item-test-id-001')).toBeInTheDocument();
  });

  it('[P1] should render with role="option" for ARIA listbox compliance', () => {
    // GIVEN: A cliente
    // WHEN: ClientListItem is rendered
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: role="option" is set (required by parent ul[role="listbox"])
    const item = screen.getByRole('option');
    expect(item).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ARIA — accessibility state
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — ARIA accessibility', () => {

  it('[P1] should have aria-selected="false" when isSelected is false', () => {
    // GIVEN: isSelected=false
    // WHEN: ClientListItem is rendered
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: aria-selected is "false" (string, not boolean)
    expect(screen.getByTestId('client-list-item-test-id-001')).toHaveAttribute('aria-selected', 'false');
  });

  it('[P1] should have aria-selected="true" when isSelected is true', () => {
    // GIVEN: isSelected=true
    // WHEN: ClientListItem is rendered
    render(<ClientListItem cliente={mockCliente} isSelected={true} onClick={vi.fn()} />);

    // THEN: aria-selected is "true" (string)
    expect(screen.getByTestId('client-list-item-test-id-001')).toHaveAttribute('aria-selected', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Click behavior — event handling
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — click behavior', () => {

  it('[P1] should call onClick with the cliente id when clicked', () => {
    // GIVEN: A click handler spy
    const onClickSpy = vi.fn();
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={onClickSpy} />);

    // WHEN: User clicks the item
    fireEvent.click(screen.getByTestId('client-list-item-test-id-001'));

    // THEN: onClick is called with the correct id
    expect(onClickSpy).toHaveBeenCalledTimes(1);
    expect(onClickSpy).toHaveBeenCalledWith('test-id-001');
  });

  it('[P1] should call onClick exactly once per click (no double-fire)', () => {
    // GIVEN: A click handler spy
    const onClickSpy = vi.fn();
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={onClickSpy} />);

    // WHEN: User clicks the item once
    fireEvent.click(screen.getByTestId('client-list-item-test-id-001'));

    // THEN: onClick is called exactly once
    expect(onClickSpy).toHaveBeenCalledTimes(1);
  });

  it('[P2] should call onClick with the correct id for different clients', () => {
    // GIVEN: A different cliente and a click handler spy
    const otherCliente: Cliente = {
      ...mockCliente,
      id: 'other-id-999',
      nombre: 'Otra Empresa',
    };
    const onClickSpy = vi.fn();
    render(<ClientListItem cliente={otherCliente} isSelected={false} onClick={onClickSpy} />);

    // WHEN: User clicks the item
    fireEvent.click(screen.getByTestId('client-list-item-other-id-999'));

    // THEN: onClick is called with "other-id-999" (not a hardcoded id)
    expect(onClickSpy).toHaveBeenCalledWith('other-id-999');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Active state — visual selection indicator
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — active state styling', () => {

  it('[P2] should apply primary color class when isSelected is true', () => {
    // GIVEN: isSelected=true
    // WHEN: ClientListItem is rendered
    const { container } = render(
      <ClientListItem cliente={mockCliente} isSelected={true} onClick={vi.fn()} />
    );

    // THEN: The item has a primary-themed active class (bg-primary-50 or similar)
    const li = container.querySelector('li');
    expect(li?.className).toMatch(/primary/);
  });

  it('[P2] should NOT apply primary color class when isSelected is false', () => {
    // GIVEN: isSelected=false
    // WHEN: ClientListItem is rendered
    const { container } = render(
      <ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />
    );

    // THEN: The item does NOT have the primary active class applied as a background
    const li = container.querySelector('li');
    expect(li?.className).not.toMatch(/bg-primary-50/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases — boundary values
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — boundary/edge values', () => {

  it('[P2] should render correctly when Nombre is a single character', () => {
    // GIVEN: A cliente with a single-character nombre
    const cliente: Cliente = { ...mockCliente, nombre: 'A' };

    // WHEN: ClientListItem is rendered
    render(<ClientListItem cliente={cliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: Single character nombre is rendered
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('[P2] should render correctly when NIT contains special characters (hyphen)', () => {
    // GIVEN: A cliente with a NIT containing hyphens (common in Colombian NITs)
    const cliente: Cliente = { ...mockCliente, nit: '900-123456-7' };

    // WHEN: ClientListItem is rendered
    render(<ClientListItem cliente={cliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: NIT with hyphens is rendered correctly
    expect(screen.getByText('900-123456-7')).toBeInTheDocument();
  });

  it('[P2] should render correctly when Nombre is a very long string (truncation via CSS)', () => {
    // GIVEN: A client with a very long nombre
    const longNombre = 'A'.repeat(200);
    const cliente: Cliente = { ...mockCliente, nombre: longNombre };

    // WHEN: ClientListItem is rendered
    render(<ClientListItem cliente={cliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: Component renders without crashing; truncate class is applied
    const { container } = render(
      <ClientListItem cliente={cliente} isSelected={false} onClick={vi.fn()} />
    );
    const nombreEl = container.querySelector('p.truncate');
    expect(nombreEl).not.toBeNull();
  });
});
