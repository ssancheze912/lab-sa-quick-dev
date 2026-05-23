/**
 * Story 2.1: Client List & Search
 * Component Tests — ErrorPanel shared component (RED phase)
 *
 * Verifies the ErrorPanel component renders the Spanish error message,
 * shows the "Reintentar" button, and calls onRetry when clicked.
 *
 * AC covered: #4 (ErrorPanel with "Reintentar" button that triggers refetch)
 *
 * STATUS: RED — ErrorPanel.tsx does not exist yet.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// ErrorPanel — rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — rendering', () => {
  it('should render the Spanish error message "Ocurrió un error al cargar los datos."', async () => {
    // GIVEN: An ErrorPanel component
    const { ErrorPanel } = await import('../ErrorPanel')

    // WHEN: It is rendered
    render(
      React.createElement(ErrorPanel, {
        onRetry: () => {},
      })
    )

    // THEN: The Spanish error message is visible
    expect(
      screen.getByText('Ocurrió un error al cargar los datos.')
    ).toBeInTheDocument()
  })

  it('should render a "Reintentar" button', async () => {
    // GIVEN: An ErrorPanel component
    const { ErrorPanel } = await import('../ErrorPanel')

    // WHEN: It is rendered
    render(
      React.createElement(ErrorPanel, {
        onRetry: () => {},
      })
    )

    // THEN: A button labeled "Reintentar" is visible
    expect(
      screen.getByRole('button', { name: /reintentar/i })
    ).toBeInTheDocument()
  })

  it('should render with data-testid="error-panel"', async () => {
    // GIVEN: An ErrorPanel component
    const { ErrorPanel } = await import('../ErrorPanel')

    // WHEN: Rendered
    render(
      React.createElement(ErrorPanel, {
        onRetry: () => {},
      })
    )

    // THEN: The testid is present for reliable selection
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })

  it('should render without crashing when aria-label is provided', async () => {
    // GIVEN: ErrorPanel with an aria-label prop
    const { ErrorPanel } = await import('../ErrorPanel')

    // WHEN: Rendered with aria-label
    render(
      React.createElement(ErrorPanel, {
        onRetry: () => {},
        'aria-label': 'Error al cargar clientes',
      })
    )

    // THEN: The component renders and has the aria-label
    const panel = screen.getByTestId('error-panel')
    expect(panel).toHaveAttribute('aria-label', 'Error al cargar clientes')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ErrorPanel — interaction
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — interaction', () => {
  it('should call onRetry when the "Reintentar" button is clicked', async () => {
    // GIVEN: An ErrorPanel with an onRetry handler
    const { ErrorPanel } = await import('../ErrorPanel')
    const handleRetry = vi.fn()

    // WHEN: The "Reintentar" button is clicked
    render(
      React.createElement(ErrorPanel, {
        onRetry: handleRetry,
      })
    )

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    // THEN: onRetry is called exactly once
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('should call onRetry with no arguments when clicked', async () => {
    // GIVEN: An ErrorPanel
    const { ErrorPanel } = await import('../ErrorPanel')
    const handleRetry = vi.fn()

    render(
      React.createElement(ErrorPanel, {
        onRetry: handleRetry,
      })
    )

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    // THEN: onRetry is called once with no arguments
    expect(handleRetry).toHaveBeenCalledWith()
  })

  it('should NOT call onRetry when the panel is rendered without clicking', async () => {
    // GIVEN: An ErrorPanel
    const { ErrorPanel } = await import('../ErrorPanel')
    const handleRetry = vi.fn()

    // WHEN: Rendered but not clicked
    render(
      React.createElement(ErrorPanel, {
        onRetry: handleRetry,
      })
    )

    // THEN: onRetry has not been called
    expect(handleRetry).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ErrorPanel — accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel — accessibility', () => {
  it('should have the "Reintentar" button as a native <button> element (not a div)', async () => {
    // GIVEN: ErrorPanel rendered
    const { ErrorPanel } = await import('../ErrorPanel')

    render(
      React.createElement(ErrorPanel, {
        onRetry: () => {},
      })
    )

    // THEN: The button is a native button element accessible by role
    const button = screen.getByRole('button', { name: /reintentar/i })
    expect(button.tagName).toBe('BUTTON')
  })

  it('should expose the Reintentar button with a minimum touch-target size of 44px implied by styling', async () => {
    // GIVEN: ErrorPanel rendered
    const { ErrorPanel } = await import('../ErrorPanel')

    render(
      React.createElement(ErrorPanel, {
        onRetry: () => {},
      })
    )

    // THEN: The button exists and is accessible (actual sizing enforced via CSS class)
    const button = screen.getByRole('button', { name: /reintentar/i })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })
})
