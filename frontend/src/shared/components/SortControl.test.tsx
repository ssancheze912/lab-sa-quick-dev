import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortControl, SORT_OPTIONS } from './SortControl'
import type { SortOption } from './SortControl'

// Mock siesa-ui-kit Select
vi.mock('siesa-ui-kit', () => ({
  Select: ({
    options,
    value,
    onChange,
    ariaLabel,
  }: {
    options: { value: string; label: string }[]
    value?: string
    onChange?: (value: string) => void
    ariaLabel?: string
  }) => (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      data-testid="select-inner"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}))

describe('SortControl', () => {
  it('renders four options with correct Spanish labels', () => {
    // Arrange & Act
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // Assert
    expect(screen.getByText('Nombre A→Z')).toBeInTheDocument()
    expect(screen.getByText('Nombre Z→A')).toBeInTheDocument()
    expect(screen.getByText('Más reciente')).toBeInTheDocument()
    expect(screen.getByText('Más antiguo')).toBeInTheDocument()
  })

  it('calls onChange with correct SortOption value on selection', async () => {
    // Arrange
    const user = userEvent.setup()
    const onChangeMock = vi.fn()
    render(<SortControl value="fecha-desc" onChange={onChangeMock} />)

    // Act
    const selectEl = screen.getByTestId('select-inner')
    await user.selectOptions(selectEl, 'nombre-asc')

    // Assert
    expect(onChangeMock).toHaveBeenCalledWith('nombre-asc')
  })

  it('reflects the current value as selected', () => {
    // Arrange & Act
    render(<SortControl value="nombre-desc" onChange={vi.fn()} />)

    // Assert
    const selectEl = screen.getByTestId('select-inner') as HTMLSelectElement
    expect(selectEl.value).toBe('nombre-desc')
  })

  it('has data-testid="sort-control" on the root element', () => {
    // Arrange & Act
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // Assert
    expect(screen.getByTestId('sort-control')).toBeInTheDocument()
  })

  it('has aria-label="Ordenar clientes" on the root element', () => {
    // Arrange & Act
    render(<SortControl value="fecha-desc" onChange={vi.fn()} />)

    // Assert
    const root = screen.getByTestId('sort-control')
    expect(root).toHaveAttribute('aria-label', 'Ordenar clientes')
  })

  it('SORT_OPTIONS contains all four valid sort options', () => {
    // Assert
    const values = SORT_OPTIONS.map((o) => o.value)
    expect(values).toContain('nombre-asc')
    expect(values).toContain('nombre-desc')
    expect(values).toContain('fecha-desc')
    expect(values).toContain('fecha-asc')
    expect(SORT_OPTIONS).toHaveLength(4)
  })

  it('calls onChange with each valid SortOption value', async () => {
    // Arrange
    const user = userEvent.setup()
    const sortOptions: SortOption[] = ['nombre-asc', 'nombre-desc', 'fecha-desc', 'fecha-asc']

    for (const option of sortOptions) {
      const onChangeMock = vi.fn()
      const { unmount } = render(<SortControl value="fecha-desc" onChange={onChangeMock} />)
      const selectEl = screen.getByTestId('select-inner')
      await user.selectOptions(selectEl, option)
      expect(onChangeMock).toHaveBeenCalledWith(option)
      unmount()
    }
  })
})
