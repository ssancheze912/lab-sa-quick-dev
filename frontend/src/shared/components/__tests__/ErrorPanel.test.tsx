import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ErrorPanel } from '../ErrorPanel'

describe('ErrorPanel', () => {
  // UNIT-C-FE-04: ErrorPanel renders "Reintentar" button and calls onRetry on click
  it('UNIT-C-FE-04 — renders Reintentar button and calls onRetry on click', () => {
    const onRetry = vi.fn()
    render(<ErrorPanel onRetry={onRetry} />)

    const btn = screen.getByRole('button', { name: /reintentar/i })
    expect(btn).toBeInTheDocument()

    fireEvent.click(btn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders default message when no message prop provided', () => {
    render(<ErrorPanel onRetry={() => {}} />)
    expect(
      screen.getByText('No se pudo cargar la información'),
    ).toBeInTheDocument()
  })

  it('renders custom message when provided', () => {
    render(<ErrorPanel message="Error personalizado" />)
    expect(screen.getByText('Error personalizado')).toBeInTheDocument()
  })

  it('has data-testid="error-panel"', () => {
    render(<ErrorPanel />)
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })

  it('does not render Reintentar button when onRetry is not provided', () => {
    render(<ErrorPanel />)
    expect(
      screen.queryByRole('button', { name: /reintentar/i }),
    ).not.toBeInTheDocument()
  })
})
