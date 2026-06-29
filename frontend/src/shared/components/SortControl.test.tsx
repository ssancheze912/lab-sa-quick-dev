/**
 * Component tests — SortControl
 * Story 2.6 — Sort Client List (ATDD phase)
 *
 * Test IDs covered:
 *   TC-E2-P2-01  SortControl renders all 4 options with correct Spanish labels
 *   TC-E2-P3-01  SortOption type identifier constants match expected values
 *
 * Test stack: Vitest + React Testing Library
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SortControl, type SortOption } from './SortControl';

// ---------------------------------------------------------------------------
// TC-E2-P2-01: SortControl renders all 4 options with correct Spanish labels
// ---------------------------------------------------------------------------

describe('TC-E2-P2-01: SortControl renders all 4 options with correct Spanish labels', () => {
  it('should render the sort control dropdown with aria-label "Ordenar clientes"', () => {
    // GIVEN: SortControl is rendered with a default value
    render(<SortControl value="fecha-desc" onChange={() => {}} />);

    // WHEN: The component is in the DOM

    // THEN: The dropdown has the correct ARIA label for WCAG 2.1 AA compliance
    const select = screen.getByRole('combobox', { name: /ordenar clientes/i });
    expect(select).toBeInTheDocument();
  });

  it('should render option "Más reciente" for fecha-desc', () => {
    // GIVEN: SortControl is rendered
    render(<SortControl value="fecha-desc" onChange={() => {}} />);

    // WHEN: Options are displayed

    // THEN: "Más reciente" option exists
    expect(screen.getByRole('option', { name: 'Más reciente' })).toBeInTheDocument();
  });

  it('should render option "Más antiguo" for fecha-asc', () => {
    // GIVEN: SortControl is rendered
    render(<SortControl value="fecha-desc" onChange={() => {}} />);

    // WHEN: Options are displayed

    // THEN: "Más antiguo" option exists
    expect(screen.getByRole('option', { name: 'Más antiguo' })).toBeInTheDocument();
  });

  it('should render option "Nombre A→Z" for nombre-asc', () => {
    // GIVEN: SortControl is rendered
    render(<SortControl value="fecha-desc" onChange={() => {}} />);

    // WHEN: Options are displayed

    // THEN: "Nombre A→Z" option exists
    expect(screen.getByRole('option', { name: 'Nombre A→Z' })).toBeInTheDocument();
  });

  it('should render option "Nombre Z→A" for nombre-desc', () => {
    // GIVEN: SortControl is rendered
    render(<SortControl value="fecha-desc" onChange={() => {}} />);

    // WHEN: Options are displayed

    // THEN: "Nombre Z→A" option exists
    expect(screen.getByRole('option', { name: 'Nombre Z→A' })).toBeInTheDocument();
  });

  it('should render exactly 4 options', () => {
    // GIVEN: SortControl is rendered
    render(<SortControl value="fecha-desc" onChange={() => {}} />);

    // WHEN: All options are counted

    // THEN: Exactly 4 sort options are present
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('should reflect the current value as the selected option', () => {
    // GIVEN: SortControl is rendered with value "nombre-asc"
    render(<SortControl value="nombre-asc" onChange={() => {}} />);

    // WHEN: The dropdown renders

    // THEN: "nombre-asc" is the selected value
    const select = screen.getByRole('combobox', { name: /ordenar clientes/i });
    expect(select).toHaveValue('nombre-asc');
  });

  it('should have data-testid="sort-control" for stable selector', () => {
    // GIVEN: SortControl is rendered
    render(<SortControl value="fecha-desc" onChange={() => {}} />);

    // WHEN: The component is queried by data-testid

    // THEN: The element has the correct testid
    expect(screen.getByTestId('sort-control')).toBeInTheDocument();
  });

  it('should call onChange with the selected SortOption value when selection changes', () => {
    // GIVEN: SortControl is rendered with an onChange spy
    const handleChange = vi.fn();
    render(<SortControl value="fecha-desc" onChange={handleChange} />);

    // WHEN: User selects "nombre-asc"
    fireEvent.change(screen.getByTestId('sort-control'), {
      target: { value: 'nombre-asc' },
    });

    // THEN: onChange is called with 'nombre-asc'
    expect(handleChange).toHaveBeenCalledWith('nombre-asc');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P3-01: SortOption type identifier constants match expected values
// ---------------------------------------------------------------------------

describe('TC-E2-P3-01: SortOption identifier constants match expected values', () => {
  it('should accept "nombre-asc" as a valid SortOption', () => {
    // GIVEN: A variable typed as SortOption
    // WHEN: Assigned "nombre-asc"
    // THEN: TypeScript accepts it and the value is correct at runtime
    const option: SortOption = 'nombre-asc';
    expect(option).toBe('nombre-asc');
  });

  it('should accept "nombre-desc" as a valid SortOption', () => {
    // GIVEN/WHEN/THEN: "nombre-desc" is a valid SortOption value
    const option: SortOption = 'nombre-desc';
    expect(option).toBe('nombre-desc');
  });

  it('should accept "fecha-desc" as a valid SortOption', () => {
    // GIVEN/WHEN/THEN: "fecha-desc" is a valid SortOption value (default)
    const option: SortOption = 'fecha-desc';
    expect(option).toBe('fecha-desc');
  });

  it('should accept "fecha-asc" as a valid SortOption', () => {
    // GIVEN/WHEN/THEN: "fecha-asc" is a valid SortOption value
    const option: SortOption = 'fecha-asc';
    expect(option).toBe('fecha-asc');
  });

  it('should render SortControl with each valid SortOption value without errors', () => {
    // GIVEN: All 4 valid SortOption values
    const validOptions: SortOption[] = ['nombre-asc', 'nombre-desc', 'fecha-desc', 'fecha-asc'];

    // WHEN/THEN: Each renders the dropdown with the correct selected value
    for (const opt of validOptions) {
      const { unmount } = render(<SortControl value={opt} onChange={() => {}} />);
      expect(screen.getByTestId('sort-control')).toHaveValue(opt);
      unmount();
    }
  });
});
