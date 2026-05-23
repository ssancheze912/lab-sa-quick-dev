import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ErrorPanel } from '../ErrorPanel'

/**
 * Edge case unit tests for ErrorPanel component — Story 2.1 expansion.
 *
 * Test IDs: UNIT-C-FE-EP-EDGE-01 … UNIT-C-FE-EP-EDGE-06
 */
describe('ErrorPanel — edge cases', () => {
  // ---------------------------------------------------------------------------
  // UNIT-C-FE-EP-EDGE-01: Reintentar button is type="button" (not type="submit")
  // Boundary: inside a form, type="submit" would trigger form submission.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-EP-EDGE-01 — Reintentar button has type="button"', () => {
    render(<ErrorPanel onRetry={() => {}} />)

    const btn = screen.getByRole('button', { name: /reintentar/i })
    expect(btn).toHaveAttribute('type', 'button')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-EP-EDGE-02: Clicking Reintentar multiple times calls onRetry each time
  // Boundary: rapid multiple retries should each trigger the handler.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-EP-EDGE-02 — clicking Reintentar multiple times calls onRetry each time', () => {
    const onRetry = vi.fn()
    render(<ErrorPanel onRetry={onRetry} />)

    const btn = screen.getByRole('button', { name: /reintentar/i })
    fireEvent.click(btn)
    fireEvent.click(btn)
    fireEvent.click(btn)

    expect(onRetry).toHaveBeenCalledTimes(3)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-EP-EDGE-03: Icon element has aria-hidden="true"
  // Screen readers should ignore the decorative error icon.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-EP-EDGE-03 — error icon has aria-hidden="true"', () => {
    render(<ErrorPanel />)

    const icon = screen.getByTestId('error-panel').querySelector('[aria-hidden="true"]')
    expect(icon).not.toBeNull()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-EP-EDGE-04: Renders without throwing when onRetry is undefined
  // Boundary: the component must be safe to render in read-only contexts.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-EP-EDGE-04 — renders without throwing when onRetry is undefined', () => {
    expect(() => {
      render(<ErrorPanel />)
    }).not.toThrow()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-EP-EDGE-05: Message text is visible in the DOM
  // The default error message must be readable (not only in aria attributes).
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-EP-EDGE-05 — default message is visible text in the DOM', () => {
    render(<ErrorPanel />)

    expect(
      screen.getByText('No se pudo cargar la información')
    ).toBeVisible()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-EP-EDGE-06: Custom message overrides default
  // Boundary: prop override must completely replace the default message.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-EP-EDGE-06 — custom message completely replaces the default message', () => {
    render(<ErrorPanel message="Error de red: timeout" />)

    expect(screen.getByText('Error de red: timeout')).toBeInTheDocument()
    expect(
      screen.queryByText('No se pudo cargar la información')
    ).not.toBeInTheDocument()
  })
})
