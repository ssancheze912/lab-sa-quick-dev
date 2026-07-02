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
})
