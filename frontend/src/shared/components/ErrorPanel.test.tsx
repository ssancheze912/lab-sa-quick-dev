// Story 2.1: Client List & Search — Automate expansion
// Unit tests for ErrorPanel shared component
// Coverage: rendering, props, retry interaction, ARIA, error paths
// Level: Component/Unit | Priority: P1-P2

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorPanel } from './ErrorPanel'

// ---------------------------------------------------------------------------
// [P1] data-testid presence
// ---------------------------------------------------------------------------
describe('ErrorPanel — [P1] testid', () => {
  it('When rendered Then data-testid="error-panel" is present', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// [P1] Default error message
// AC task 19: Text: "No se pudo cargar la información"
// ---------------------------------------------------------------------------
describe('ErrorPanel — [P1] default message', () => {
  it('Given no message prop When rendered Then default Spanish error message is shown', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.getByText('No se pudo cargar la información')).toBeInTheDocument()
  })

  it('Given custom message prop When rendered Then custom message overrides default', () => {
    render(<ErrorPanel onRetry={vi.fn()} message="Error de conexión al servidor" />)
    expect(screen.getByText('Error de conexión al servidor')).toBeInTheDocument()
    expect(
      screen.queryByText('No se pudo cargar la información'),
    ).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// [P1] Reintentar button
// AC task 19: Button "Reintentar" calls onRetry prop
// ---------------------------------------------------------------------------
describe('ErrorPanel — [P1] Reintentar button', () => {
  it('When rendered Then a button with text "Reintentar" is present', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('When user clicks "Reintentar" Then onRetry is called exactly once', async () => {
    const onRetryMock = vi.fn()
    const user = userEvent.setup()

    render(<ErrorPanel onRetry={onRetryMock} />)
    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(onRetryMock).toHaveBeenCalledTimes(1)
  })

  it('When user clicks "Reintentar" multiple times Then onRetry is called for each click', async () => {
    const onRetryMock = vi.fn()
    const user = userEvent.setup()

    render(<ErrorPanel onRetry={onRetryMock} />)
    const btn = screen.getByRole('button', { name: /reintentar/i })

    await user.click(btn)
    await user.click(btn)
    await user.click(btn)

    expect(onRetryMock).toHaveBeenCalledTimes(3)
  })
})

// ---------------------------------------------------------------------------
// [P1] ARIA: button has aria-label="Reintentar carga"
// AC task 19: WCAG: button has aria-label="Reintentar carga"
// ---------------------------------------------------------------------------
describe('ErrorPanel — [P1] ARIA accessibility', () => {
  it('When rendered Then Reintentar button has aria-label="Reintentar carga"', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /reintentar carga/i })
    expect(btn).toHaveAttribute('aria-label', 'Reintentar carga')
  })

  it('When rendered Then the icon svg has aria-hidden="true"', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    const svg = screen.getByTestId('error-panel').querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})

// ---------------------------------------------------------------------------
// [P2] data-testid on the retry button for programmatic selection
// ---------------------------------------------------------------------------
describe('ErrorPanel — [P2] retry button testid', () => {
  it('When rendered Then the retry button has data-testid="retry-button"', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// [P2] Icon color — ExclamationCircleIcon in red-400
// AC task 19: Icon in red-400
// ---------------------------------------------------------------------------
describe('ErrorPanel — [P2] icon styling', () => {
  it('When rendered Then the icon has text-red-400 class', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    const svg = screen.getByTestId('error-panel').querySelector('svg')
    expect(svg?.getAttribute('class')).toContain('text-red-400')
  })
})

// ---------------------------------------------------------------------------
// [P2] No error thrown when onRetry prop is a no-op
// Regression: defensive coding for minimal onRetry
// ---------------------------------------------------------------------------
describe('ErrorPanel — [P2] defensive onRetry', () => {
  it('Given onRetry is a no-op function When clicked Then no error is thrown', async () => {
    const user = userEvent.setup()
    render(<ErrorPanel onRetry={() => {}} />)
    await expect(
      user.click(screen.getByRole('button', { name: /reintentar/i })),
    ).resolves.not.toThrow()
  })
})
