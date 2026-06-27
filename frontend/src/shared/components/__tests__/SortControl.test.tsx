/**
 * ATDD — Story 2.6: Sort Client List
 * Component tests for SortControl controlled select component.
 *
 * Tests are in RED phase — they define expected behaviour BEFORE implementation.
 * Make these tests GREEN by implementing:
 *   frontend/src/shared/components/SortControl.tsx
 *
 * Coverage:
 *   UNIT-C-01 (P1) — Renders 4 options with correct Spanish labels
 *   UNIT-C-02 (P1) — Fires onChange callback with correct sort option identifier on selection
 *   UNIT-C-03 (P1) — Shows "Más reciente" selected by default when no value prop is passed
 *   UNIT-C-04 (P2) — Controlled: changing value prop updates the displayed selection
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SortControl } from '../SortControl'
import type { SortOption } from '../SortControl'

// ---------------------------------------------------------------------------
// UNIT-C-01 (P1 · AC1, AC2, AC3, AC4)
// Given the SortControl component is rendered
// When viewing the available options
// Then all 4 sort options appear with correct Spanish labels
// ---------------------------------------------------------------------------
describe('SortControl', () => {
  it('UNIT-C-01 — renders 4 options with correct Spanish labels', async () => {
    // GIVEN: SortControl is rendered with a default value
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // WHEN: the user opens the control to see options
    const control = screen.getByTestId('sort-control')
    await userEvent.click(control)

    // THEN: all 4 Spanish labels are visible
    expect(screen.getByText('Nombre A→Z')).toBeInTheDocument()
    expect(screen.getByText('Nombre Z→A')).toBeInTheDocument()
    expect(screen.getByText('Más reciente')).toBeInTheDocument()
    expect(screen.getByText('Más antiguo')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-02 (P1 · AC1, AC2)
  // Given the SortControl is rendered
  // When the user selects an option
  // Then the onChange callback is fired with the correct sort option identifier
  // ---------------------------------------------------------------------------
  it('UNIT-C-02 — fires onChange with correct sort option identifier on selection', async () => {
    // GIVEN: onChange spy and SortControl rendered
    const handleChange = vi.fn()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)

    // WHEN: user opens the control and selects "Nombre A→Z"
    const control = screen.getByTestId('sort-control')
    await userEvent.click(control)
    await userEvent.click(screen.getByText('Nombre A→Z'))

    // THEN: onChange is called with 'nombre-asc'
    expect(handleChange).toHaveBeenCalledWith('nombre-asc' satisfies SortOption)
  })

  it('UNIT-C-02b — fires onChange with "nombre-desc" when selecting "Nombre Z→A"', async () => {
    // GIVEN: onChange spy and SortControl rendered
    const handleChange = vi.fn()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)

    // WHEN: user selects "Nombre Z→A"
    const control = screen.getByTestId('sort-control')
    await userEvent.click(control)
    await userEvent.click(screen.getByText('Nombre Z→A'))

    // THEN: onChange is called with 'nombre-desc'
    expect(handleChange).toHaveBeenCalledWith('nombre-desc' satisfies SortOption)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-03 (P1 · AC6)
  // Given the SortControl is rendered without an explicit value prop
  // When viewing the displayed selection
  // Then "Más reciente" (fecha-desc) is selected by default
  // ---------------------------------------------------------------------------
  it('UNIT-C-03 — shows "Más reciente" selected by default when no value prop is passed', () => {
    // GIVEN: SortControl rendered with default value 'fecha-desc'
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // WHEN: viewing the component (no interaction needed)
    const control = screen.getByTestId('sort-control')

    // THEN: the control displays "Más reciente" as the current selection
    expect(control).toHaveTextContent('Más reciente')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-04 (P2 · AC6)
  // Given the SortControl is rendered with a specific value prop
  // When the value prop changes to a different option
  // Then the displayed selection reflects the new value
  // ---------------------------------------------------------------------------
  it('UNIT-C-04 — controlled: value prop updates the displayed selection', () => {
    // GIVEN: SortControl rendered with 'nombre-asc'
    const { rerender } = render(<SortControl value="nombre-asc" onChange={vi.fn()} />)

    // WHEN: the control shows 'nombre-asc'
    expect(screen.getByTestId('sort-control')).toHaveTextContent('Nombre A→Z')

    // WHEN: parent changes value prop to 'fecha-asc'
    rerender(<SortControl value="fecha-asc" onChange={vi.fn()} />)

    // THEN: the displayed selection changes to "Más antiguo"
    expect(screen.getByTestId('sort-control')).toHaveTextContent('Más antiguo')
  })

  // ---------------------------------------------------------------------------
  // Accessibility: aria-label on the control
  // ---------------------------------------------------------------------------
  it('has accessible aria-label "Ordenar clientes" on the control element', () => {
    // GIVEN: SortControl is rendered
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // THEN: the control has the required accessible label
    expect(screen.getByLabelText('Ordenar clientes')).toBeInTheDocument()
  })
})
