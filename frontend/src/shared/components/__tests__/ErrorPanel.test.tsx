/**
 * Unit Tests — ErrorPanel shared component
 * Story 2.1: Client List & Search (edge-case expansion)
 *
 * Covers: rendering presence, "Reintentar" button text, onRetry callback,
 * no raw error message leaked, multiple rapid retry clicks, data-testid presence.
 *
 * Stack: Vitest + React Testing Library
 */

import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorPanel } from '../ErrorPanel'

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('ErrorPanel — rendering', () => {
  test('renders data-testid="error-panel" root element', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })

  test('displays the generic error message in Spanish', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.getByText(/no se pudieron cargar los datos/i)).toBeInTheDocument()
  })

  test('renders the "Reintentar" button with correct data-testid', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    const btn = screen.getByTestId('retry-button')
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveTextContent('Reintentar')
  })

  test('never exposes raw technical error strings to the user', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.queryByText(/network error|AxiosError|TypeError|500|stack/i)).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Interaction — retry callback
// ---------------------------------------------------------------------------

describe('ErrorPanel — retry callback', () => {
  test('calls onRetry when "Reintentar" button is clicked', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorPanel onRetry={onRetry} />)

    await user.click(screen.getByTestId('retry-button'))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('calls onRetry on every click without batching (3 rapid clicks = 3 calls)', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorPanel onRetry={onRetry} />)

    const btn = screen.getByTestId('retry-button')
    await user.click(btn)
    await user.click(btn)
    await user.click(btn)

    expect(onRetry).toHaveBeenCalledTimes(3)
  })

  test('calls onRetry via keyboard Enter on the button (accessibility)', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorPanel onRetry={onRetry} />)

    screen.getByTestId('retry-button').focus()
    await user.keyboard('{Enter}')

    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
