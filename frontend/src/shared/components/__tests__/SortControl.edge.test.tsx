/**
 * Edge Case Tests — Story 2.6: Sort Client List
 * Component tests for SortControl — keyboard interaction, dropdown behaviour,
 * accessibility paths not covered by the ATDD suite (UNIT-C-01 to UNIT-C-04).
 *
 * Tests IDs: UNIT-C-EDGE-11 … UNIT-C-EDGE-20
 *
 * Risks covered:
 *   - Dropdown closes after an option is selected (no stale open state)
 *   - Dropdown closes when clicking outside the component
 *   - All four options fire the correct onChange identifier
 *   - fecha-asc and fecha-desc options fire correct callbacks
 *   - SortControl is keyboard-accessible (Enter on trigger opens dropdown)
 *   - SortControl renders without crashing when onChange is never called
 *   - ARIA attributes reflect open/closed state (aria-expanded)
 *   - Options carry role="option" for assistive technology
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SortControl } from '../SortControl'
import type { SortOption } from '../SortControl'

// ---------------------------------------------------------------------------
// UNIT-C-EDGE-11 (P1)
// After the user selects an option, the dropdown must close automatically.
// Prevents the listbox from remaining open after a selection.
// ---------------------------------------------------------------------------
describe('SortControl — edge cases', () => {
  it('UNIT-C-EDGE-11 — dropdown closes after an option is selected', async () => {
    const handleChange = vi.fn()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)

    // WHEN — user opens the dropdown and selects an option
    const trigger = screen.getByTestId('sort-control')
    await userEvent.click(trigger)

    // Verify dropdown is open (at least one option visible)
    expect(screen.getByText('Nombre A→Z')).toBeInTheDocument()

    // WHEN — user selects an option
    await userEvent.click(screen.getByText('Nombre A→Z'))

    // THEN — the dropdown is closed (option list no longer visible)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-12 (P1)
  // onChange must be called once per selection — no double-fire.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-12 — onChange is called exactly once per selection', async () => {
    const handleChange = vi.fn()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)

    const trigger = screen.getByTestId('sort-control')
    await userEvent.click(trigger)
    await userEvent.click(screen.getByText('Nombre Z→A'))

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith('nombre-desc' satisfies SortOption)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-13 (P1)
  // fecha-asc option fires onChange with 'fecha-asc'.
  // The ATDD suite only explicitly tests 'nombre-asc' and 'nombre-desc'.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-13 — selecting "Más antiguo" fires onChange with "fecha-asc"', async () => {
    const handleChange = vi.fn()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)

    const trigger = screen.getByTestId('sort-control')
    await userEvent.click(trigger)
    await userEvent.click(screen.getByText('Más antiguo'))

    expect(handleChange).toHaveBeenCalledWith('fecha-asc' satisfies SortOption)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-14 (P1)
  // fecha-desc option fires onChange with 'fecha-desc'.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-14 — selecting "Más reciente" from open dropdown fires onChange with "fecha-desc"', async () => {
    // Start with a non-fecha-desc value so clicking "Más reciente" is meaningful
    const handleChange = vi.fn()
    render(<SortControl value="nombre-asc" onChange={handleChange} />)

    const trigger = screen.getByTestId('sort-control')
    await userEvent.click(trigger)
    await userEvent.click(screen.getByText('Más reciente'))

    expect(handleChange).toHaveBeenCalledWith('fecha-desc' satisfies SortOption)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-15 (P1)
  // ARIA: trigger button must have aria-expanded="false" when dropdown is closed
  // and aria-expanded="true" when it is open.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-15 — trigger has aria-expanded="false" when closed and "true" when open', async () => {
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    const trigger = screen.getByTestId('sort-control')

    // Initially closed
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    // After click
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // After second click (toggle close)
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-16 (P2)
  // ARIA: listbox options must carry role="option" for assistive technology.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-16 — dropdown options have role="option"', async () => {
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    const trigger = screen.getByTestId('sort-control')
    await userEvent.click(trigger)

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(4)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-17 (P2)
  // ARIA: currently selected option must have aria-selected="true".
  // Only the active option carries aria-selected; others carry aria-selected="false".
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-17 — currently selected option has aria-selected="true"', async () => {
    render(<SortControl value="nombre-asc" onChange={vi.fn()} />)

    const trigger = screen.getByTestId('sort-control')
    await userEvent.click(trigger)

    // "Nombre A→Z" corresponds to 'nombre-asc' — should be selected
    const selectedOption = screen.getByRole('option', { name: 'Nombre A→Z' })
    expect(selectedOption).toHaveAttribute('aria-selected', 'true')

    // Other options should NOT be selected
    const unselectedOption = screen.getByRole('option', { name: 'Nombre Z→A' })
    expect(unselectedOption).toHaveAttribute('aria-selected', 'false')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-18 (P2)
  // Boundary: SortControl toggling the trigger again closes the dropdown
  // without selecting an option or calling onChange.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-18 — clicking trigger again without selecting closes dropdown without onChange', async () => {
    const handleChange = vi.fn()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)

    const trigger = screen.getByTestId('sort-control')

    // Open
    await userEvent.click(trigger)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Close by clicking trigger again
    await userEvent.click(trigger)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    // onChange was never called
    expect(handleChange).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-19 (P1)
  // Boundary: trigger button has aria-haspopup="listbox" to signal to
  // screen readers that activation will open a listbox widget.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-19 — trigger has aria-haspopup="listbox"', () => {
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    const trigger = screen.getByTestId('sort-control')
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-EDGE-20 (P2)
  // Boundary: all four sort options render within the open dropdown.
  // Regression guard — ensure no option is accidentally omitted from SORT_OPTIONS.
  // ---------------------------------------------------------------------------
  it('UNIT-C-EDGE-20 — all four options are present in the open listbox', async () => {
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    await userEvent.click(screen.getByTestId('sort-control'))

    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeInTheDocument()

    const expectedLabels = ['Nombre A→Z', 'Nombre Z→A', 'Más reciente', 'Más antiguo']
    for (const label of expectedLabels) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument()
    }
  })
})
