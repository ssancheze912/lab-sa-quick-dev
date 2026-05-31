/**
 * Unit Tests — ErrorPanel component
 *
 * Covers:
 *   - Renders Spanish error message
 *   - Renders "Reintentar" button
 *   - Has data-testid="error-panel"
 *   - Has role="alert" (WCAG 2.1)
 *   - Calls onRetry callback when button is clicked
 *   - onRetry is called exactly once per click
 *   - onRetry is called on each subsequent click
 *
 * Pattern: Vitest + @testing-library/react (no MSW — pure presentational)
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorPanel } from '../ErrorPanel'

describe('ErrorPanel — rendering', () => {
  it('Renders the Spanish error message', () => {
    render(<ErrorPanel onRetry={() => {}} />)
    expect(
      screen.getByText('No se pudo cargar la lista de clientes.')
    ).toBeInTheDocument()
  })

  it('Renders a "Reintentar" button', () => {
    render(<ErrorPanel onRetry={() => {}} />)
    expect(
      screen.getByRole('button', { name: 'Reintentar' })
    ).toBeInTheDocument()
  })

  it('Has data-testid="error-panel"', () => {
    render(<ErrorPanel onRetry={() => {}} />)
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })

  it('Has role="alert" for WCAG 2.1 immediate screen reader announcement', () => {
    render(<ErrorPanel onRetry={() => {}} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

describe('ErrorPanel — onRetry callback', () => {
  it('Calls onRetry once when "Reintentar" button is clicked', async () => {
    const mockRetry = vi.fn()
    const user = userEvent.setup()

    render(<ErrorPanel onRetry={mockRetry} />)
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(mockRetry).toHaveBeenCalledTimes(1)
  })

  it('Does not call onRetry before the button is clicked', () => {
    const mockRetry = vi.fn()

    render(<ErrorPanel onRetry={mockRetry} />)

    expect(mockRetry).not.toHaveBeenCalled()
  })

  it('Calls onRetry on each subsequent click', async () => {
    const mockRetry = vi.fn()
    const user = userEvent.setup()

    render(<ErrorPanel onRetry={mockRetry} />)
    const button = screen.getByRole('button', { name: 'Reintentar' })

    await user.click(button)
    await user.click(button)
    await user.click(button)

    expect(mockRetry).toHaveBeenCalledTimes(3)
  })
})
