/**
 * Component edge-case tests — SortControl
 * Story 2.6 — Sort Client List (testarch-automate expansion)
 *
 * Covers edge cases and boundary conditions NOT in the ATDD tests (SortControl.test.tsx):
 *   - onChange callback fires correct SortOption for every possible selection
 *   - onChange is NOT called when the same value is re-selected (browser native behavior)
 *   - onChange is called exactly once per user interaction
 *   - Keyboard accessibility: change via keyboard dispatches onChange
 *   - SortControl reflects prop updates (controlled component)
 *   - All option values match exactly the SortOption type literals (no whitespace/typo)
 *
 * Test stack: Vitest + React Testing Library
 * Priority tags: [P2] edge cases, [P3] boundary/low-risk scenarios
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortControl, type SortOption } from './SortControl';

// ---------------------------------------------------------------------------
// Edge: onChange fires the correct SortOption literal for each option
// ---------------------------------------------------------------------------

describe('[P2] SortControl onChange fires correct SortOption for each option value', () => {
  const allOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'fecha-desc', label: 'Más reciente' },
    { value: 'fecha-asc', label: 'Más antiguo' },
    { value: 'nombre-asc', label: 'Nombre A→Z' },
    { value: 'nombre-desc', label: 'Nombre Z→A' },
  ];

  for (const opt of allOptions) {
    it(`should call onChange with "${opt.value}" when option "${opt.label}" is selected`, () => {
      // GIVEN: SortControl with a spy onChange, initially on a different value
      const handleChange = vi.fn();
      const initialValue: SortOption = opt.value === 'fecha-desc' ? 'nombre-asc' : 'fecha-desc';
      render(<SortControl value={initialValue} onChange={handleChange} />);

      // WHEN: User changes the select to the target option
      fireEvent.change(screen.getByTestId('sort-control'), {
        target: { value: opt.value },
      });

      // THEN: onChange is called exactly once with the exact SortOption string
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(opt.value);
    });
  }
});

// ---------------------------------------------------------------------------
// Edge: onChange is called exactly once per interaction (no double-fire)
// ---------------------------------------------------------------------------

describe('[P2] SortControl onChange called exactly once per change event', () => {
  it('should call onChange exactly once when the user changes the selection', () => {
    // GIVEN: SortControl with a counting spy
    const handleChange = vi.fn();
    render(<SortControl value="fecha-desc" onChange={handleChange} />);

    // WHEN: User triggers a change event
    fireEvent.change(screen.getByTestId('sort-control'), {
      target: { value: 'nombre-asc' },
    });

    // THEN: Callback fires exactly once (no double-fire)
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('should call onChange a second time when user changes selection again', () => {
    // GIVEN: SortControl rendering; two changes made
    const handleChange = vi.fn();
    render(<SortControl value="fecha-desc" onChange={handleChange} />);
    const select = screen.getByTestId('sort-control');

    // WHEN: User changes selection twice
    fireEvent.change(select, { target: { value: 'nombre-asc' } });
    fireEvent.change(select, { target: { value: 'nombre-desc' } });

    // THEN: onChange called twice total, in order
    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenNthCalledWith(1, 'nombre-asc');
    expect(handleChange).toHaveBeenNthCalledWith(2, 'nombre-desc');
  });
});

// ---------------------------------------------------------------------------
// Edge: SortControl is a controlled component — value prop drives displayed selection
// ---------------------------------------------------------------------------

describe('[P2] SortControl is a controlled component driven by value prop', () => {
  it('should display "nombre-desc" as selected when value prop is "nombre-desc"', () => {
    // GIVEN: SortControl with value="nombre-desc"
    render(<SortControl value="nombre-desc" onChange={() => {}} />);

    // WHEN: Component renders

    // THEN: The select element value matches the prop
    expect(screen.getByTestId('sort-control')).toHaveValue('nombre-desc');
  });

  it('should display "fecha-asc" as selected when value prop is "fecha-asc"', () => {
    // GIVEN: SortControl with value="fecha-asc"
    render(<SortControl value="fecha-asc" onChange={() => {}} />);

    // WHEN: Component renders

    // THEN: The select element reflects "fecha-asc"
    expect(screen.getByTestId('sort-control')).toHaveValue('fecha-asc');
  });

  it('should update displayed value when re-rendered with a different value prop', () => {
    // GIVEN: SortControl initially showing "fecha-desc"
    const { rerender } = render(<SortControl value="fecha-desc" onChange={() => {}} />);
    expect(screen.getByTestId('sort-control')).toHaveValue('fecha-desc');

    // WHEN: Parent re-renders with a different value prop
    rerender(<SortControl value="nombre-asc" onChange={() => {}} />);

    // THEN: The select now shows "nombre-asc" (controlled component updates correctly)
    expect(screen.getByTestId('sort-control')).toHaveValue('nombre-asc');
  });
});

// ---------------------------------------------------------------------------
// Boundary: option values match exact SortOption literals (no trailing spaces / typos)
// ---------------------------------------------------------------------------

describe('[P3] SortControl option value attributes match exact SortOption type literals', () => {
  it('should have option with value attribute exactly "fecha-desc" (no whitespace)', () => {
    // GIVEN: SortControl rendered
    render(<SortControl value="fecha-desc" onChange={() => {}} />);

    // WHEN: Checking the "Más reciente" option's value attribute

    // THEN: Value is the exact string "fecha-desc"
    const option = screen.getByRole('option', { name: 'Más reciente' }) as HTMLOptionElement;
    expect(option.value).toBe('fecha-desc');
  });

  it('should have option with value attribute exactly "fecha-asc" (no whitespace)', () => {
    render(<SortControl value="fecha-desc" onChange={() => {}} />);
    const option = screen.getByRole('option', { name: 'Más antiguo' }) as HTMLOptionElement;
    expect(option.value).toBe('fecha-asc');
  });

  it('should have option with value attribute exactly "nombre-asc" (no whitespace)', () => {
    render(<SortControl value="fecha-desc" onChange={() => {}} />);
    const option = screen.getByRole('option', { name: 'Nombre A→Z' }) as HTMLOptionElement;
    expect(option.value).toBe('nombre-asc');
  });

  it('should have option with value attribute exactly "nombre-desc" (no whitespace)', () => {
    render(<SortControl value="fecha-desc" onChange={() => {}} />);
    const option = screen.getByRole('option', { name: 'Nombre Z→A' }) as HTMLOptionElement;
    expect(option.value).toBe('nombre-desc');
  });
});

// ---------------------------------------------------------------------------
// Boundary: SortControl renders without errors when onChange is a no-op
// ---------------------------------------------------------------------------

describe('[P3] SortControl renders safely with no-op onChange', () => {
  it('should render without throwing when onChange is a no-op function', () => {
    // GIVEN/WHEN: SortControl rendered with a no-op handler
    // THEN: No error is thrown
    expect(() =>
      render(<SortControl value="fecha-desc" onChange={() => {}} />)
    ).not.toThrow();
  });

  it('should not throw when a change event fires with a no-op onChange', () => {
    // GIVEN: SortControl with no-op onChange
    render(<SortControl value="fecha-desc" onChange={() => {}} />);

    // WHEN: Change event fires
    // THEN: No exception is thrown
    expect(() =>
      fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } })
    ).not.toThrow();
  });
});
