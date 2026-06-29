/**
 * Story 2.1 — Client List & Search — ErrorPanel ATDD (RED phase).
 *
 * Acceptance criteria covered:
 *   AC #6 — ErrorPanel renders generic copy, exposes a Reintentar button,
 *            and accepts only an onRetry handler (NFR6 — no error object leak).
 *
 * MUST fail until shared/components/ErrorPanel/ErrorPanel.tsx exists.
 */
import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ErrorPanel } from './ErrorPanel'

describe('ErrorPanel — load-time error surface', () => {
  test('renders the user-safe title and subtitle (no error object leaked)', () => {
    // GIVEN: ErrorPanel with an onRetry callback
    render(<ErrorPanel onRetry={vi.fn()} />)

    // THEN: the user-facing copy matches the UX spec
    expect(screen.getByText('No pudimos cargar los clientes')).toBeInTheDocument()
    expect(screen.getByText('Verifica tu conexión e intenta nuevamente')).toBeInTheDocument()
  })

  test('exposes a primary Reintentar button', () => {
    // GIVEN: ErrorPanel
    render(<ErrorPanel onRetry={vi.fn()} />)

    // THEN: the Reintentar button is present and reachable by name
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  test('clicking Reintentar invokes onRetry exactly once', async () => {
    // GIVEN: ErrorPanel with a spy
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ErrorPanel onRetry={onRetry} />)

    // WHEN: the user clicks the retry button
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: onRetry runs exactly once (no infinite loops, no duplicate calls)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('panel is identifiable via data-testid="error-panel"', () => {
    render(<ErrorPanel onRetry={vi.fn()} />)
    expect(screen.getByTestId('error-panel')).toBeInTheDocument()
  })

  test('panel does NOT leak technical detail (no status code, no URL, no problem-details strings)', () => {
    // GIVEN: ErrorPanel
    render(<ErrorPanel onRetry={vi.fn()} />)
    const panel = screen.getByTestId('error-panel')

    // THEN: NFR6 — no internal detail surfaces
    expect(panel.textContent ?? '').not.toMatch(/500|404|about:blank|http|api\/v1/i)
  })
})
