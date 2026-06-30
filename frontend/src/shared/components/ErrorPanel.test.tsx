/**
 * Story 2.1 — Edge-case unit tests for ErrorPanel shared component.
 * Covers: ARIA alert role, default message, custom message, retry button click,
 * button aria-label, and icon rendering.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ErrorPanel } from './ErrorPanel'

describe('ErrorPanel — rendering', () => {
  it('[P1] has role="alert" for screen reader accessibility', () => {
    // GIVEN: An ErrorPanel
    // WHEN: Rendered
    render(<ErrorPanel onRetry={vi.fn()} />)

    // THEN: role is alert
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('[P1] displays the default error message when no message prop is provided', () => {
    // GIVEN: No custom message passed
    // WHEN: Rendered with only onRetry
    render(<ErrorPanel onRetry={vi.fn()} />)

    // THEN: Default message is visible
    expect(screen.getByText('Error al cargar los datos.')).toBeInTheDocument()
  })

  it('[P1] displays a custom message when provided', () => {
    // GIVEN: A custom message
    // WHEN: Rendered with custom message
    render(<ErrorPanel message="Error al cargar los clientes." onRetry={vi.fn()} />)

    // THEN: Custom message is visible
    expect(screen.getByText('Error al cargar los clientes.')).toBeInTheDocument()
  })

  it('[P1] renders the retry button with aria-label="Reintentar"', () => {
    // GIVEN: An ErrorPanel
    // WHEN: Rendered
    render(<ErrorPanel onRetry={vi.fn()} />)

    // THEN: Retry button has the expected label
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('[P2] renders an SVG icon (aria-hidden)', () => {
    // GIVEN: An ErrorPanel
    // WHEN: Rendered
    const { container } = render(<ErrorPanel onRetry={vi.fn()} />)

    // THEN: SVG is present and decorative
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('ErrorPanel — interactions', () => {
  it('[P0] calls onRetry when the Reintentar button is clicked', () => {
    // GIVEN: A retry handler
    const handleRetry = vi.fn()

    // WHEN: User clicks the retry button
    render(<ErrorPanel onRetry={handleRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: onRetry is called once
    expect(handleRetry).toHaveBeenCalledOnce()
  })

  it('[P1] retry button is not called when user does not click it', () => {
    // GIVEN: A retry handler
    const handleRetry = vi.fn()

    // WHEN: Component renders but nothing is clicked
    render(<ErrorPanel onRetry={handleRetry} />)

    // THEN: onRetry is not called
    expect(handleRetry).not.toHaveBeenCalled()
  })

  it('[P2] retry button can be clicked multiple times', () => {
    // GIVEN: A retry handler
    const handleRetry = vi.fn()

    // WHEN: User clicks retry 3 times
    render(<ErrorPanel onRetry={handleRetry} />)
    const button = screen.getByRole('button', { name: 'Reintentar' })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    // THEN: onRetry is called 3 times
    expect(handleRetry).toHaveBeenCalledTimes(3)
  })
})
