/**
 * Story 2.1: Client List & Search — ErrorPanel Edge Case Tests
 *
 * Expands coverage beyond ATDD tests (ErrorPanel.test.tsx).
 * Covers: special characters, keyboard interaction, icon accessibility,
 * message prop changes, button state after multiple clicks.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ErrorPanel } from '../ErrorPanel'

describe('ErrorPanel — edge cases', () => {
  // ─── Special characters in message ────────────────────────────────────────

  it('[P2] should render message with Spanish special characters', () => {
    // GIVEN: message with accents and punctuation
    const message = 'Error al cargar los clientes. ¡Intente de nuevo!'

    // WHEN: rendered
    render(<ErrorPanel message={message} onRetry={() => {}} />)

    // THEN: text is displayed correctly
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  // ─── Very long message ─────────────────────────────────────────────────────

  it('[P2] should render very long error message without crashing', () => {
    // GIVEN: a very long error message (edge of normal use)
    const message = 'Error crítico al procesar la solicitud. '.repeat(10).trim()

    // WHEN: rendered
    render(<ErrorPanel message={message} onRetry={() => {}} />)

    // THEN: renders without exception
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  // ─── Keyboard accessibility: Enter on button ──────────────────────────────

  it('[P1] should call onRetry when Enter key is pressed on the Reintentar button', async () => {
    // GIVEN: spy and keyboard user
    const onRetry = vi.fn()
    const user = userEvent.setup()

    render(<ErrorPanel message="Error al cargar los clientes." onRetry={onRetry} />)

    // WHEN: user tabs to the button and presses Enter
    const button = screen.getByRole('button', { name: 'Reintentar' })
    button.focus()
    await user.keyboard('{Enter}')

    // THEN: onRetry is triggered via keyboard
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  // ─── Keyboard accessibility: Space on button ──────────────────────────────

  it('[P1] should call onRetry when Space key is pressed on the Reintentar button', async () => {
    // GIVEN: spy and keyboard user
    const onRetry = vi.fn()
    const user = userEvent.setup()

    render(<ErrorPanel message="Error al cargar los clientes." onRetry={onRetry} />)

    // WHEN: user presses Space on the button (standard button behavior)
    const button = screen.getByRole('button', { name: 'Reintentar' })
    button.focus()
    await user.keyboard(' ')

    // THEN: onRetry is triggered
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  // ─── Decorative icon is aria-hidden ───────────────────────────────────────

  it('[P2] should render the error icon as aria-hidden (decorative, not read by SR)', () => {
    // GIVEN: standard error panel
    const { container } = render(
      <ErrorPanel message="Error." onRetry={() => {}} />
    )

    // THEN: SVG icon has aria-hidden="true" so screen readers skip it
    const icon = container.querySelector('svg[aria-hidden="true"]')
    expect(icon).not.toBeNull()
  })

  // ─── onRetry callback receives no arguments ───────────────────────────────

  it('[P2] should call onRetry with no arguments', async () => {
    // GIVEN: spy capturing call arguments
    const onRetry = vi.fn()
    const user = userEvent.setup()

    render(<ErrorPanel message="Error." onRetry={onRetry} />)

    // WHEN: user clicks Reintentar
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: called once with no arguments
    expect(onRetry).toHaveBeenCalledWith()
  })

  // ─── Button type attribute ─────────────────────────────────────────────────

  it('[P2] Reintentar button should have type="button" to prevent accidental form submission', () => {
    // GIVEN: rendered component
    render(<ErrorPanel message="Error." onRetry={() => {}} />)

    // THEN: button type is explicitly "button"
    const button = screen.getByRole('button', { name: 'Reintentar' })
    expect(button).toHaveAttribute('type', 'button')
  })

  // ─── Re-render with different message ────────────────────────────────────

  it('[P2] should display updated message when message prop changes', () => {
    // GIVEN: initial render
    const { rerender } = render(
      <ErrorPanel message="Error inicial." onRetry={() => {}} />
    )
    expect(screen.getByText('Error inicial.')).toBeInTheDocument()

    // WHEN: message prop is updated
    rerender(<ErrorPanel message="Error actualizado." onRetry={() => {}} />)

    // THEN: updated message is shown
    expect(screen.getByText('Error actualizado.')).toBeInTheDocument()
    expect(screen.queryByText('Error inicial.')).not.toBeInTheDocument()
  })

  // ─── Re-render with different onRetry ────────────────────────────────────

  it('[P2] should use the latest onRetry callback after re-render', async () => {
    // GIVEN: initial handler
    const firstHandler = vi.fn()
    const secondHandler = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <ErrorPanel message="Error." onRetry={firstHandler} />
    )

    // WHEN: onRetry prop is replaced and user clicks
    rerender(<ErrorPanel message="Error." onRetry={secondHandler} />)
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: only the new handler is called
    expect(secondHandler).toHaveBeenCalledTimes(1)
    expect(firstHandler).not.toHaveBeenCalled()
  })
})
