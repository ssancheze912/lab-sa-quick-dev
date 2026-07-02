import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorPanel } from './ErrorPanel'

describe('ErrorPanel', () => {
  it('renders default Spanish title and message with role="alert"', () => {
    render(<ErrorPanel onRetry={() => undefined} />)

    const root = screen.getByTestId('error-panel')
    expect(root).toHaveAttribute('role', 'alert')
    expect(screen.getByText(/No se pudo cargar/)).toBeInTheDocument()
    expect(
      screen.getByText(/Verifica tu conexión e intenta de nuevo\./i),
    ).toBeInTheDocument()
  })

  it('respects a custom testId prop', () => {
    render(<ErrorPanel onRetry={() => undefined} testId="clientes-error-panel" />)
    expect(screen.getByTestId('clientes-error-panel')).toBeInTheDocument()
  })

  it('invokes onRetry when the Reintentar button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<ErrorPanel onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: /reintentar/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  // ───────────────────────────────────────────────────────────────────────
  // Edge cases / expansions (Story 2.1 automate pass)
  // ───────────────────────────────────────────────────────────────────────

  it('[P1] renders a custom title when the prop is provided instead of the default', () => {
    // GIVEN / WHEN: A custom title is passed
    render(
      <ErrorPanel
        title="Falló la carga de clientes"
        onRetry={() => undefined}
      />,
    )

    // THEN: The custom title appears; the default no longer does
    expect(screen.getByText('Falló la carga de clientes')).toBeInTheDocument()
    expect(screen.queryByText(/No se pudo cargar$/)).toBeNull()
  })

  it('[P1] renders a custom message when the prop is provided instead of the default', () => {
    // GIVEN / WHEN: A custom message is passed
    render(
      <ErrorPanel
        message="Reintenta en unos minutos o contacta soporte."
        onRetry={() => undefined}
      />,
    )

    // THEN: The custom message appears; the default is not rendered
    expect(
      screen.getByText('Reintenta en unos minutos o contacta soporte.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Verifica tu conexión e intenta de nuevo\./),
    ).toBeNull()
  })

  it('[P1] invokes onRetry once per click even when clicked repeatedly', async () => {
    // GIVEN: A retry spy
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorPanel onRetry={onRetry} />)

    // WHEN: The user clicks the button three times
    const btn = screen.getByRole('button', { name: /reintentar/i })
    await user.click(btn)
    await user.click(btn)
    await user.click(btn)

    // THEN: onRetry receives exactly three invocations (no throttle / debounce)
    expect(onRetry).toHaveBeenCalledTimes(3)
  })

  it('[P2] renders the Reintentar button with an accessible name in Spanish (es-CO)', () => {
    // GIVEN / WHEN: The panel is rendered
    render(<ErrorPanel onRetry={() => undefined} />)

    // THEN: A button with the Spanish label "Reintentar" is discoverable by role
    const btn = screen.getByRole('button', { name: /^reintentar$/i })
    expect(btn).toBeInTheDocument()
  })

  it('[P2] falls back to the default testId "error-panel" when the prop is omitted', () => {
    // GIVEN / WHEN: No testId is passed
    render(<ErrorPanel onRetry={() => undefined} />)

    // THEN: The default testId is applied — reusable across features
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })
})
