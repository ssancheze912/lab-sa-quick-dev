/**
 * Story 2.6: Sort Client List
 * Epic 2: Gestión de Clientes
 *
 * Component tests for the shared `SortControl` dropdown.
 * Covers AC #11 sub-cases:
 *   - SortControl_renders_four_options_with_default_selection
 *   - SortControl_fires_onChange_with_new_value
 */

import { describe, expect, test, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { SortControl } from '@/shared/components/SortControl'

afterEach(() => cleanup())

describe('SortControl — Story 2.6', () => {
  test('SortControl_renders_four_options_with_default_selection', () => {
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    const select = screen.getByTestId('clientes-sort-control') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    expect(select.tagName.toLowerCase()).toBe('select')
    expect(select.getAttribute('aria-label')).toBe('Ordenar por')

    const options = select.querySelectorAll('option')
    expect(options).toHaveLength(4)

    const values = Array.from(options).map((o) => o.value)
    const labels = Array.from(options).map((o) => o.textContent)

    expect(values).toEqual(['fecha-desc', 'fecha-asc', 'nombre-asc', 'nombre-desc'])
    expect(labels).toEqual(['Más reciente', 'Más antiguo', 'Nombre A→Z', 'Nombre Z→A'])

    expect(select.value).toBe('fecha-desc')

    // Visible label "Ordenar por" rendered above the dropdown.
    expect(screen.getByText('Ordenar por')).toBeInTheDocument()
  })

  test('SortControl_fires_onChange_with_new_value', () => {
    const handleChange = vi.fn()
    render(<SortControl value="fecha-desc" onChange={handleChange} />)

    const select = screen.getByTestId('clientes-sort-control') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'nombre-asc' } })

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith('nombre-asc')
  })
})
