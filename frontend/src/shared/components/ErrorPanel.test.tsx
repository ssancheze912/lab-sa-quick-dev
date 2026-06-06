/**
 * Story 2.1: Client List & Search
 * Component tests for ErrorPanel
 *
 * Acceptance Criteria covered:
 *   AC5 — displays ErrorPanel with "Reintentar" button on backend unavailability,
 *          clicking "Reintentar" calls onRetry, NO technical details exposed.
 *
 * NOTE: Tests are in RED state — they will fail until ErrorPanel.tsx is implemented.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// RED: import will fail until component exists
import { ErrorPanel } from './ErrorPanel'

afterEach(() => cleanup())

describe('ErrorPanel — rendering', () => {
  /**
   * AC5: An ErrorPanel component is displayed with a "Reintentar" button.
   */
  it('renders "Reintentar" button', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: 'Reintentar' })
    ).toBeInTheDocument()
  })

  it('renders a user-friendly error message without technical details', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)

    expect(
      screen.getByText('No se pudo cargar la información')
    ).toBeInTheDocument()
  })

  /**
   * AC5: Never display error.message or any technical detail (NFR6).
   */
  it('does NOT display any stack trace or technical error text', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)

    // Should not contain typical technical error strings
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/fetch/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/network/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/500/i)).not.toBeInTheDocument()
  })

  it('has data-testid="error-panel" for testability', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)

    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })
})

describe('ErrorPanel — interactions', () => {
  /**
   * AC5: Clicking "Reintentar" re-triggers the TanStack Query refetch().
   */
  it('calls onRetry when "Reintentar" button is clicked', () => {
    const handleRetry = vi.fn()
    render(<ErrorPanel onRetry={handleRetry} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('calls onRetry each time the button is clicked', () => {
    const handleRetry = vi.fn()
    render(<ErrorPanel onRetry={handleRetry} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(handleRetry).toHaveBeenCalledTimes(2)
  })
})
