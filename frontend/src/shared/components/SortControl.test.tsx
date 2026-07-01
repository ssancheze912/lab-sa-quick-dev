import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortControl } from './SortControl'

// RED PHASE: SortControl.tsx does not exist yet (Story 2.6, Task 1).
// Covers AC #1, #2, #3, #4, #6 — the isolated component contract: renders all
// 4 Spanish-labeled options, reflects the controlled `value` prop, and calls
// `onChange` with the correct `SortOption` value on selection.
//
// The underlying siesa-ui-kit `Select` wraps Headless UI's `Listbox`: the
// trigger renders as a `<button>` (opened via a click), and once open, each
// option renders with `role="option"`. Tests interact through the public
// `data-testid="sort-control"` wrapper per the story's data-testid convention
// (never through siesa-ui-kit internals/CSS classes).

async function openSortControl(user: ReturnType<typeof userEvent.setup>) {
  const control = screen.getByTestId('sort-control')
  await user.click(control)
  return control
}

describe('SortControl', () => {
  test('should render the "Nombre A→Z" option', async () => {
    // GIVEN: SortControl is mounted with a controlled value and no-op onChange
    const user = userEvent.setup()
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // WHEN: the user opens the options menu
    await openSortControl(user)

    // THEN: the "Nombre A→Z" option is present
    expect(screen.getByRole('option', { name: 'Nombre A→Z' })).toBeInTheDocument()
  })

  test('should render the "Nombre Z→A" option', async () => {
    // GIVEN: SortControl is mounted
    const user = userEvent.setup()
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // WHEN: the user opens the options menu
    await openSortControl(user)

    // THEN: the "Nombre Z→A" option is present
    expect(screen.getByRole('option', { name: 'Nombre Z→A' })).toBeInTheDocument()
  })

  test('should render the "Más reciente" option', async () => {
    // GIVEN: SortControl is mounted
    const user = userEvent.setup()
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // WHEN: the user opens the options menu
    await openSortControl(user)

    // THEN: the "Más reciente" option is present
    expect(screen.getByRole('option', { name: 'Más reciente' })).toBeInTheDocument()
  })

  test('should render the "Más antiguo" option', async () => {
    // GIVEN: SortControl is mounted
    const user = userEvent.setup()
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // WHEN: the user opens the options menu
    await openSortControl(user)

    // THEN: the "Más antiguo" option is present
    expect(screen.getByRole('option', { name: 'Más antiguo' })).toBeInTheDocument()
  })

  test('should call onChange with "nombre-asc" when "Nombre A→Z" is selected', async () => {
    // GIVEN: SortControl is mounted with a spy onChange handler
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)
    await openSortControl(user)

    // WHEN: the user selects "Nombre A→Z"
    await user.click(screen.getByRole('option', { name: 'Nombre A→Z' }))

    // THEN: onChange fires with the 'nombre-asc' SortOption value
    expect(handleChange).toHaveBeenCalledWith('nombre-asc')
  })

  test('should call onChange with "nombre-desc" when "Nombre Z→A" is selected', async () => {
    // GIVEN: SortControl is mounted with a spy onChange handler
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)
    await openSortControl(user)

    // WHEN: the user selects "Nombre Z→A"
    await user.click(screen.getByRole('option', { name: 'Nombre Z→A' }))

    // THEN: onChange fires with the 'nombre-desc' SortOption value
    expect(handleChange).toHaveBeenCalledWith('nombre-desc')
  })

  test('should call onChange with "fecha-desc" when "Más reciente" is selected', async () => {
    // GIVEN: SortControl is mounted with a different value selected and a spy onChange
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(<SortControl value="nombre-asc" onChange={handleChange} />)
    await openSortControl(user)

    // WHEN: the user selects "Más reciente"
    await user.click(screen.getByRole('option', { name: 'Más reciente' }))

    // THEN: onChange fires with the 'fecha-desc' SortOption value
    expect(handleChange).toHaveBeenCalledWith('fecha-desc')
  })

  test('should call onChange with "fecha-asc" when "Más antiguo" is selected', async () => {
    // GIVEN: SortControl is mounted with a spy onChange handler
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)
    await openSortControl(user)

    // WHEN: the user selects "Más antiguo"
    await user.click(screen.getByRole('option', { name: 'Más antiguo' }))

    // THEN: onChange fires with the 'fecha-asc' SortOption value
    expect(handleChange).toHaveBeenCalledWith('fecha-asc')
  })

  test('should reflect "nombre-asc" as the visually selected option when passed as value', () => {
    // GIVEN: SortControl is mounted with value="nombre-asc"
    render(<SortControl value="nombre-asc" onChange={vi.fn()} />)

    // WHEN: the trigger (closed state) is inspected without opening the menu
    // THEN: the closed trigger displays the label matching the controlled value
    expect(screen.getByTestId('sort-control')).toHaveTextContent('Nombre A→Z')
  })

  test('should reflect "fecha-desc" as the visually selected option when passed as value', () => {
    // GIVEN: SortControl is mounted with value="fecha-desc" (the default)
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // WHEN: the trigger (closed state) is inspected without opening the menu
    // THEN: the closed trigger displays "Más reciente"
    expect(screen.getByTestId('sort-control')).toHaveTextContent('Más reciente')
  })
})
