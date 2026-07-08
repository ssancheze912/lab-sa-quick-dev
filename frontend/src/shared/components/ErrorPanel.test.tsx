/**
 * Story 2.1 — ATDD (RED phase).
 *
 * Covers AC #5 — the ErrorPanel shown when the initial list fetch fails,
 * including the retry contract (button label, disabled state during retry,
 * onRetry callback wiring) and the strict NFR6 constraint that raw error
 * messages are NEVER displayed.
 *
 * RED until `src/shared/components/ErrorPanel.tsx` exists.
 */
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorPanel } from './ErrorPanel'

describe('ErrorPanel', () => {
  it('renders the provided title and subtitle', () => {
    render(
      <ErrorPanel
        title="No se pudo cargar la lista de clientes"
        subtitle="Comprueba tu conexión e intenta nuevamente."
        onRetry={vi.fn()}
      />,
    )
    expect(screen.getByText('No se pudo cargar la lista de clientes')).toBeInTheDocument()
    expect(screen.getByText('Comprueba tu conexión e intenta nuevamente.')).toBeInTheDocument()
  })

  it('sets role="alert" so screen readers announce the failure', () => {
    render(<ErrorPanel title="X" onRetry={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('exposes a button with Spanish label "Reintentar"', () => {
    render(<ErrorPanel title="X" onRetry={vi.fn()} />)
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('GIVEN a click on Reintentar, THEN onRetry is invoked exactly once', () => {
    const onRetry = vi.fn()
    render(<ErrorPanel title="X" onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('GIVEN isRetrying=true, THEN the retry button is disabled', () => {
    render(<ErrorPanel title="X" onRetry={vi.fn()} isRetrying />)
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeDisabled()
  })

  it('GIVEN a raw error message is available, THEN the component NEVER displays it (NFR6)', () => {
    // The parent decides the copy — ErrorPanel receives no `error` prop.
    // This test simply proves the presence of the safe copy and the absence
    // of any leaked internals.
    render(
      <ErrorPanel
        title="No se pudo cargar la lista de clientes"
        subtitle="Comprueba tu conexión e intenta nuevamente."
        onRetry={vi.fn()}
      />,
    )
    expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/exception/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument()
  })
})
