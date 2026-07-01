import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortControl } from './SortControl'

/**
 * Test Automation Expansion (testarch-automate) — Story 2.6: Sort Client List
 *
 * Expands beyond the ATDD suite (`SortControl.test.tsx`) with edge cases not
 * covered by the AC-driven contract tests: controlled-value updates from the
 * parent (re-render, not user interaction), keyboard-only interaction, and
 * defensive click-forwarding behavior on the wrapper `div`.
 *
 * Priorities: P2 (component-level robustness, no direct AC mapping but
 * protects the controlled-component contract this story's tests rely on).
 */

describe('SortControl - edge cases', () => {
  test('[P2] should update the displayed label when the controlled value prop changes externally', () => {
    // GIVEN: SortControl is mounted with "fecha-desc"
    const { rerender } = render(<SortControl value="fecha-desc" onChange={vi.fn()} />)
    expect(screen.getByTestId('sort-control')).toHaveTextContent('Más reciente')

    // WHEN: the parent re-renders with a different controlled value (no user click)
    rerender(<SortControl value="fecha-asc" onChange={vi.fn()} />)

    // THEN: the displayed label reflects the new prop value
    expect(screen.getByTestId('sort-control')).toHaveTextContent('Más antiguo')
  })

  test('[P2] should open the options menu via keyboard (ArrowDown) without a mouse click', async () => {
    // GIVEN: SortControl is mounted and focused via Tab
    const user = userEvent.setup()
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)
    await user.tab()

    // WHEN: the user presses ArrowDown to open the menu (Headless UI's Listbox.Button
    // opens on ArrowDown/ArrowUp/Enter/Space; ArrowDown is the most reliable across
    // versions since Enter/Space can be swallowed by native <button> semantics first)
    await user.keyboard('{ArrowDown}')

    // THEN: the options become visible
    expect(screen.getByRole('option', { name: 'Más reciente' })).toBeInTheDocument()
  })

  test('[P2] should select an option via keyboard arrow navigation and Enter', async () => {
    // GIVEN: SortControl is open via keyboard focus
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)
    await user.tab()
    await user.keyboard('{Enter}')

    // WHEN: the user navigates down one option and confirms with Enter
    await user.keyboard('{ArrowDown}{Enter}')

    // THEN: onChange fires with a valid SortOption (exact option depends on
    // Listbox's focus-management starting point, but it must be one of the
    // four known values, never undefined/garbage)
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(['nombre-asc', 'nombre-desc', 'fecha-desc', 'fecha-asc']).toContain(
      handleChange.mock.calls[0]?.[0],
    )
  })

  test('[P2] should not throw when a click event target is a descendant rather than the wrapper itself', async () => {
    // GIVEN: SortControl is mounted (the wrapper's onClickCapture only forwards
    // when event.target === event.currentTarget; clicking the internal trigger
    // button directly, as userEvent does, must NOT double-fire/forward)
    const user = userEvent.setup()
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // WHEN: the user clicks the control (target is the inner button, not the wrapper div)
    await user.click(screen.getByTestId('sort-control'))

    // THEN: the menu opens exactly once (no duplicate open/close toggling from
    // a redundant forwarded click)
    expect(screen.getAllByRole('option', { name: 'Más reciente' })).toHaveLength(1)
  })
})
