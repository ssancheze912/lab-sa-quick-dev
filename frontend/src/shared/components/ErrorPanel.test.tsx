/**
 * Story 2.1: Client List & Search — Task 13
 * Epic 2: Client Management
 *
 * ATDD component test — RED Phase
 * Intentionally FAILING until `ErrorPanel` is implemented.
 *
 * Acceptance Criteria covered:
 *   AC #8  — ErrorPanel + "Reintentar" shown on initial fetch failure.
 *   AC #11 — Spanish copy + role="alert" so screen readers announce the error.
 *
 * Verbatim copy:
 *   title   "No se pudo cargar"
 *   message "Ocurrió un problema al cargar los clientes. Intenta de nuevo."
 *   button  "Reintentar"
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
// RED: ErrorPanel.tsx does not exist yet — this import will fail until Task 13 is done.
import { ErrorPanel } from './ErrorPanel'

afterEach(() => {
  cleanup()
})

describe('ErrorPanel (AC #8, #11)', () => {
  it('renders the default Spanish title verbatim', () => {
    // GIVEN: an ErrorPanel with default copy
    render(<ErrorPanel onRetry={vi.fn()} />)

    // WHEN / THEN: the verbatim Spanish title is visible
    expect(screen.getByText('No se pudo cargar')).toBeInTheDocument()
  })

  it('renders the default Spanish message verbatim', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(
      screen.getByText('Ocurrió un problema al cargar los clientes. Intenta de nuevo.'),
    ).toBeInTheDocument()
  })

  it('renders a primary button labelled "Reintentar"', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('exposes data-testid="error-panel" so views can query it', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })

  it('exposes role="alert" so assistive technologies announce the error (AC #11)', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.getByTestId('error-panel')).toHaveAttribute('role', 'alert')
  })

  it('invokes onRetry exactly once when the user clicks "Reintentar" (AC #8)', () => {
    // GIVEN: an onRetry handler
    const onRetry = vi.fn()
    render(<ErrorPanel onRetry={onRetry} />)

    // WHEN: the user clicks the Reintentar button
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: onRetry is invoked exactly once
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
