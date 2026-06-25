/**
 * Story 2.6: SortControl shared component — Component Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1/AC2/AC3/AC4: Component renders all four sort options in Spanish
 * - AC6: Default rendered option is "Más reciente" when value is "fecha-desc"
 * - All ACs: onChange fires with correct SortOption identifier for each option
 * - Accessibility: aria-label="Ordenar clientes" on control; visible "Ordenar por:" label
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';

// SUT — will fail until implemented
import { SortControl } from './SortControl';
import type { SortOption } from './SortControl';

// ─── AC6: Default renders "Más reciente" for fecha-desc ──────────────────────

describe('SortControl — default value rendering', () => {
  it('should render with the "Más reciente" option selected when value is "fecha-desc"', () => {
    // GIVEN: SortControl receives value="fecha-desc"
    const onChange = vi.fn();

    // WHEN: Component is rendered
    render(createElement(SortControl, { value: 'fecha-desc', onChange }));

    // THEN: The select control shows "fecha-desc" as its current value
    const select = screen.getByTestId('sort-control');
    expect((select as HTMLSelectElement).value).toBe('fecha-desc');
  });

  it('should render the visible label "Ordenar por:" in Spanish', () => {
    // GIVEN: SortControl is rendered
    const onChange = vi.fn();

    // WHEN: Component mounts
    render(createElement(SortControl, { value: 'fecha-desc', onChange }));

    // THEN: The visible label "Ordenar por:" is present in the DOM
    expect(screen.getByText(/ordenar por/i)).toBeInTheDocument();
  });
});

// ─── All four options are present in Spanish ─────────────────────────────────

describe('SortControl — all four Spanish options rendered', () => {
  it('should render the "Nombre A→Z" option', () => {
    // GIVEN: SortControl is rendered
    render(createElement(SortControl, { value: 'fecha-desc', onChange: vi.fn() }));

    // WHEN/THEN: "Nombre A→Z" option is present in the DOM
    expect(screen.getByRole('option', { name: /nombre a.*z/i })).toBeInTheDocument();
  });

  it('should render the "Nombre Z→A" option', () => {
    // GIVEN: SortControl is rendered
    render(createElement(SortControl, { value: 'fecha-desc', onChange: vi.fn() }));

    // WHEN/THEN: "Nombre Z→A" option is present in the DOM
    expect(screen.getByRole('option', { name: /nombre z.*a/i })).toBeInTheDocument();
  });

  it('should render the "Más reciente" option', () => {
    // GIVEN: SortControl is rendered
    render(createElement(SortControl, { value: 'fecha-desc', onChange: vi.fn() }));

    // WHEN/THEN: "Más reciente" option is present in the DOM
    expect(screen.getByRole('option', { name: /más reciente/i })).toBeInTheDocument();
  });

  it('should render the "Más antiguo" option', () => {
    // GIVEN: SortControl is rendered
    render(createElement(SortControl, { value: 'fecha-desc', onChange: vi.fn() }));

    // WHEN/THEN: "Más antiguo" option is present in the DOM
    expect(screen.getByRole('option', { name: /más antiguo/i })).toBeInTheDocument();
  });
});

// ─── Controlled component: reflects the provided value ───────────────────────

describe('SortControl — controlled component reflects value prop', () => {
  it('should show "nombre-asc" selected when value prop is "nombre-asc"', () => {
    // GIVEN: SortControl receives value="nombre-asc"
    render(createElement(SortControl, { value: 'nombre-asc', onChange: vi.fn() }));

    // WHEN: Component is rendered
    const select = screen.getByTestId('sort-control');

    // THEN: The select value matches the prop
    expect((select as HTMLSelectElement).value).toBe('nombre-asc');
  });

  it('should show "nombre-desc" selected when value prop is "nombre-desc"', () => {
    // GIVEN: SortControl receives value="nombre-desc"
    render(createElement(SortControl, { value: 'nombre-desc', onChange: vi.fn() }));

    // WHEN/THEN: The select value reflects the prop
    const select = screen.getByTestId('sort-control');
    expect((select as HTMLSelectElement).value).toBe('nombre-desc');
  });

  it('should show "fecha-asc" selected when value prop is "fecha-asc"', () => {
    // GIVEN: SortControl receives value="fecha-asc"
    render(createElement(SortControl, { value: 'fecha-asc', onChange: vi.fn() }));

    // WHEN/THEN: The select value reflects the prop
    const select = screen.getByTestId('sort-control');
    expect((select as HTMLSelectElement).value).toBe('fecha-asc');
  });
});

// ─── onChange called with correct SortOption identifiers ─────────────────────

describe('SortControl — onChange fires with correct SortOption identifier', () => {
  it('should call onChange with "nombre-asc" when user selects "Nombre A→Z"', async () => {
    // GIVEN: SortControl with an onChange spy
    const onChange = vi.fn();
    render(createElement(SortControl, { value: 'fecha-desc', onChange }));

    // WHEN: User selects "Nombre A→Z"
    const select = screen.getByTestId('sort-control');
    await userEvent.selectOptions(select, 'nombre-asc');

    // THEN: onChange is called with "nombre-asc"
    expect(onChange).toHaveBeenCalledWith('nombre-asc');
  });

  it('should call onChange with "nombre-desc" when user selects "Nombre Z→A"', async () => {
    // GIVEN: SortControl with an onChange spy
    const onChange = vi.fn();
    render(createElement(SortControl, { value: 'fecha-desc', onChange }));

    // WHEN: User selects "Nombre Z→A"
    const select = screen.getByTestId('sort-control');
    await userEvent.selectOptions(select, 'nombre-desc');

    // THEN: onChange is called with "nombre-desc"
    expect(onChange).toHaveBeenCalledWith('nombre-desc');
  });

  it('should call onChange with "fecha-desc" when user selects "Más reciente"', async () => {
    // GIVEN: SortControl currently showing "nombre-asc"
    const onChange = vi.fn();
    render(createElement(SortControl, { value: 'nombre-asc', onChange }));

    // WHEN: User selects "Más reciente"
    const select = screen.getByTestId('sort-control');
    await userEvent.selectOptions(select, 'fecha-desc');

    // THEN: onChange is called with "fecha-desc"
    expect(onChange).toHaveBeenCalledWith('fecha-desc');
  });

  it('should call onChange with "fecha-asc" when user selects "Más antiguo"', async () => {
    // GIVEN: SortControl with an onChange spy
    const onChange = vi.fn();
    render(createElement(SortControl, { value: 'fecha-desc', onChange }));

    // WHEN: User selects "Más antiguo"
    const select = screen.getByTestId('sort-control');
    await userEvent.selectOptions(select, 'fecha-asc');

    // THEN: onChange is called with "fecha-asc"
    expect(onChange).toHaveBeenCalledWith('fecha-asc');
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('SortControl — accessibility requirements', () => {
  it('should have aria-label="Ordenar clientes" on the control element', () => {
    // GIVEN: SortControl is rendered
    render(createElement(SortControl, { value: 'fecha-desc', onChange: vi.fn() }));

    // WHEN/THEN: The select control has the required aria-label
    const select = screen.getByTestId('sort-control');
    expect(select).toHaveAttribute('aria-label', 'Ordenar clientes');
  });

  it('should not have internal state — does not update displayed value without new value prop', async () => {
    // GIVEN: SortControl is a controlled component with value="fecha-desc" and a no-op onChange
    const onChange = vi.fn();
    render(createElement(SortControl, { value: 'fecha-desc', onChange }));
    const select = screen.getByTestId('sort-control');

    // WHEN: User attempts to select a different option (but parent does not update value prop)
    // onChange is called but value prop stays "fecha-desc" (controlled — no internal state)
    await userEvent.selectOptions(select, 'nombre-asc');

    // THEN: onChange was called (so parent knows about the intent)
    expect(onChange).toHaveBeenCalledWith('nombre-asc');
    // AND: The displayed value did not change on its own (parent controls it)
    // Note: In a real controlled component the value stays "fecha-desc" because the prop didn't change.
    // This test confirms no internal useState that would override the prop.
    expect((select as HTMLSelectElement).value).toBe('fecha-desc');
  });
});
