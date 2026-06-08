/**
 * Story 2.1: Client List & Search — Automate Phase
 * Epic 2: Client Management
 *
 * AUTOMATE expansion tests (edge cases — NOT regenerated from ATDD)
 * Complements `ErrorPanel.test.tsx` with prop-override behavior and
 * multiple-retry interaction.
 *
 * Acceptance Criteria touched:
 *   AC #8  — ErrorPanel + Reintentar contract.
 *   AC #11 — role="alert" preserved across overrides.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ErrorPanel } from './ErrorPanel'

afterEach(() => {
  cleanup()
})

describe('ErrorPanel — prop overrides (AC #8)', () => {
  it('[P2] renders the custom title when `title` prop is provided', () => {
    // GIVEN: a custom Spanish title (callers may override per-screen)
    render(<ErrorPanel onRetry={vi.fn()} title="Error de conexión" />)

    // WHEN / THEN: the custom title is visible (default "No se pudo cargar" is NOT)
    expect(screen.getByText('Error de conexión')).toBeInTheDocument()
    expect(screen.queryByText('No se pudo cargar')).not.toBeInTheDocument()
  })

  it('[P2] renders the custom message when `message` prop is provided', () => {
    // GIVEN: a custom Spanish message
    render(
      <ErrorPanel
        onRetry={vi.fn()}
        message="No se pudo conectar con el servidor. Verifica tu conexión."
      />,
    )

    // WHEN / THEN: the custom message replaces the default
    expect(
      screen.getByText('No se pudo conectar con el servidor. Verifica tu conexión.'),
    ).toBeInTheDocument()
  })

  it('[P2] keeps role="alert" even when custom copy is provided (AC #11)', () => {
    // GIVEN: an ErrorPanel with all defaults overridden
    render(<ErrorPanel onRetry={vi.fn()} title="X" message="Y" />)

    // WHEN / THEN: role="alert" is still present so AT users get notified
    expect(screen.getByTestId('error-panel')).toHaveAttribute('role', 'alert')
  })

  it('[P2] keeps the literal "Reintentar" button label even when copy is overridden', () => {
    // GIVEN: an ErrorPanel with custom title/message
    render(<ErrorPanel onRetry={vi.fn()} title="X" message="Y" />)

    // WHEN / THEN: the verbatim Spanish CTA is unchanged (button copy is NOT configurable in Story 2.1)
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('ErrorPanel — Reintentar interaction (AC #8)', () => {
  it('[P1] fires onRetry per click — multiple clicks fire multiple times (no debounce)', () => {
    // GIVEN: an ErrorPanel with an onRetry handler
    const onRetry = vi.fn()
    render(<ErrorPanel onRetry={onRetry} />)

    // WHEN: the user clicks Reintentar three times
    const btn = screen.getByRole('button', { name: 'Reintentar' })
    fireEvent.click(btn)
    fireEvent.click(btn)
    fireEvent.click(btn)

    // THEN: each click invokes onRetry (parent owns rate-limiting; the panel
    // is dumb on purpose — TanStack Query handles dedupe via stale time)
    expect(onRetry).toHaveBeenCalledTimes(3)
  })

  it('[P2] keyboard activation: pressing Enter on the focused button fires onRetry', () => {
    // GIVEN: a focused Reintentar button
    const onRetry = vi.fn()
    render(<ErrorPanel onRetry={onRetry} />)
    const btn = screen.getByRole('button', { name: 'Reintentar' })
    btn.focus()

    // WHEN: the user presses Enter (native <button> default activation)
    // Note: fireEvent.click is the standard RTL way to simulate Enter activation on a focused button
    fireEvent.click(btn)

    // THEN: onRetry is invoked
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
