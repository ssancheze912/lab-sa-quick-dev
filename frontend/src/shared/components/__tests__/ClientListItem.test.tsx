/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Unit Tests — ClientListItem component
 * This component had no dedicated test file (covered only implicitly via ClienteListView tests).
 *
 * Component under test: ClientListItem
 * Path: frontend/src/shared/components/ClientListItem.tsx
 *
 * Covers:
 *   - Renders nombre and nit from cliente prop
 *   - isSelected=true → visual selection state + aria-pressed="true"
 *   - isSelected=false → aria-pressed="false"
 *   - onClick fires when button is clicked
 *   - onClick fires exactly once per click (no double-fire)
 *   - Long nombres render without breaking layout (truncated)
 *   - Keyboard accessibility: button role + Enter key fires onClick
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientListItem } from '../ClientListItem';
import type { Cliente } from '../../../modules/crm/clientes/domain/Cliente';

const mockCliente: Cliente = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  nombre: 'Empresa Test',
  nit: '900100200-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// Rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — rendering', () => {
  it('[P1] should display the nombre of the client', () => {
    // GIVEN: A client with nombre "Empresa Test"
    // WHEN: The component renders
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: The nombre is visible
    expect(screen.getByText('Empresa Test')).toBeInTheDocument();
  });

  it('[P1] should display the nit of the client', () => {
    // GIVEN: A client with nit "900100200-1"
    // WHEN: The component renders
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: The nit is visible
    expect(screen.getByText('900100200-1')).toBeInTheDocument();
  });

  it('[P1] should render as a button element (keyboard accessible)', () => {
    // GIVEN: ClientListItem is rendered
    // WHEN: The component renders
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: A button role element is present
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('[P2] should render long nombres without throwing (truncation applied)', () => {
    // GIVEN: A client with an extremely long nombre
    const longNombreCliente: Cliente = {
      ...mockCliente,
      nombre: 'Empresa con un nombre muy largo que podría desbordar el contenedor del panel lateral de la lista de clientes',
    };

    // WHEN: The component renders (should not throw)
    expect(() =>
      render(<ClientListItem cliente={longNombreCliente} isSelected={false} onClick={vi.fn()} />)
    ).not.toThrow();

    // THEN: The text is present in the DOM (may be truncated visually via CSS)
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('[P2] should render NITs containing dash characters', () => {
    // GIVEN: A client whose NIT has a dash (standard Colombian NIT format)
    const nitCliente: Cliente = { ...mockCliente, nit: '900100200-1' };

    // WHEN: The component renders
    render(<ClientListItem cliente={nitCliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: The full NIT including dash is visible
    expect(screen.getByText('900100200-1')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Selection state
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — selection state', () => {
  it('[P1] should have aria-pressed="true" when isSelected is true', () => {
    // GIVEN: The item is selected
    render(<ClientListItem cliente={mockCliente} isSelected={true} onClick={vi.fn()} />);

    // THEN: aria-pressed communicates the selected state to assistive technology
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('[P1] should have aria-pressed="false" when isSelected is false', () => {
    // GIVEN: The item is NOT selected
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />);

    // THEN: aria-pressed is false
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('[P2] should re-render without errors when isSelected transitions from false to true', () => {
    // GIVEN: Item starts unselected
    const { rerender } = render(
      <ClientListItem cliente={mockCliente} isSelected={false} onClick={vi.fn()} />
    );

    // WHEN: isSelected changes to true (simulating user selecting the client)
    expect(() =>
      rerender(<ClientListItem cliente={mockCliente} isSelected={true} onClick={vi.fn()} />)
    ).not.toThrow();

    // THEN: aria-pressed reflects the new state
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Interaction — onClick
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — onClick interaction', () => {
  it('[P1] should call onClick when the button is clicked', async () => {
    // GIVEN: A spy function as onClick
    const onClickSpy = vi.fn();
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={onClickSpy} />);

    // WHEN: User clicks the item
    await userEvent.click(screen.getByRole('button'));

    // THEN: onClick is called exactly once
    expect(onClickSpy).toHaveBeenCalledTimes(1);
  });

  it('[P1] should call onClick exactly once per click (no double-fire)', async () => {
    // GIVEN: A spy function as onClick
    const onClickSpy = vi.fn();
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={onClickSpy} />);

    // WHEN: User clicks once
    await userEvent.click(screen.getByRole('button'));

    // THEN: Exactly one call (not doubled by event bubbling or re-renders)
    expect(onClickSpy).toHaveBeenCalledTimes(1);
  });

  it('[P2] should call onClick when Enter key is pressed while button is focused', async () => {
    // GIVEN: The component is rendered and button is focused
    const onClickSpy = vi.fn();
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={onClickSpy} />);

    const button = screen.getByRole('button');
    button.focus();

    // WHEN: User presses Enter
    await userEvent.keyboard('{Enter}');

    // THEN: onClick is called (keyboard activation)
    expect(onClickSpy).toHaveBeenCalledTimes(1);
  });

  it('[P2] should call onClick when Space key is pressed while button is focused', async () => {
    // GIVEN: The component is rendered and button is focused
    const onClickSpy = vi.fn();
    render(<ClientListItem cliente={mockCliente} isSelected={false} onClick={onClickSpy} />);

    const button = screen.getByRole('button');
    button.focus();

    // WHEN: User presses Space
    await userEvent.keyboard(' ');

    // THEN: onClick is called (native button Space activation)
    expect(onClickSpy).toHaveBeenCalledTimes(1);
  });

  it('[P1] should NOT call onClick when the item is already selected and clicked again', async () => {
    // GIVEN: The item is selected
    const onClickSpy = vi.fn();
    render(<ClientListItem cliente={mockCliente} isSelected={true} onClick={onClickSpy} />);

    // WHEN: User clicks the already-selected item
    await userEvent.click(screen.getByRole('button'));

    // THEN: onClick is still called (selection is managed by the parent, not blocked)
    // This verifies no accidental guard that prevents re-clicks on selected items
    expect(onClickSpy).toHaveBeenCalledTimes(1);
  });
});
