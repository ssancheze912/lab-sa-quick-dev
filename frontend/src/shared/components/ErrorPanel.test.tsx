/**
 * Story 2.1 — ErrorPanel shared component (Automate expansion)
 *
 * Unit-level tests for the `ErrorPanel` shared component. Complement the ATDD
 * suite which only exercises `ErrorPanel` indirectly through `ClienteListView`
 * on 500 responses.
 *
 * Verifies:
 *   • Default Spanish copy (title + description)
 *   • Custom copy overrides via props
 *   • `onRetry` fires exactly once on click
 *   • The button has type="button" (never submits an enclosing form)
 *
 * Priority: P1 — the "Reintentar" flow is user-facing error recovery (NFR6).
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'

import { ErrorPanel } from '@/shared/components/ErrorPanel'

afterEach(() => cleanup())

describe('[P1] ErrorPanel — default copy', () => {
  it('[P1] should render the default Spanish title', () => {
    // GIVEN: An ErrorPanel with the default copy
    render(<ErrorPanel onRetry={() => {}} />)

    // WHEN / THEN: The default title is in Spanish
    expect(
      screen.getByText('No se pudieron cargar los datos'),
    ).toBeInTheDocument()
  })

  it('[P1] should render the default Spanish description', () => {
    // GIVEN: An ErrorPanel with the default copy
    render(<ErrorPanel onRetry={() => {}} />)

    // WHEN / THEN: The default description is in Spanish
    expect(
      screen.getByText('Verifica tu conexión e inténtalo de nuevo.'),
    ).toBeInTheDocument()
  })

  it('[P1] should render the "Reintentar" button', () => {
    // GIVEN: An ErrorPanel with the default copy
    render(<ErrorPanel onRetry={() => {}} />)

    // WHEN / THEN: The retry button exists with Spanish label
    const btn = screen.getByTestId('error-panel-retry')
    expect(btn.textContent ?? '').toMatch(/reintentar/i)
  })
})

describe('[P2] ErrorPanel — custom copy', () => {
  it('[P2] should render a caller-provided title', () => {
    // GIVEN: A custom title
    render(
      <ErrorPanel title="Servicio no disponible" onRetry={() => {}} />,
    )

    // WHEN / THEN: The custom title wins over the default
    expect(screen.getByText('Servicio no disponible')).toBeInTheDocument()
    expect(
      screen.queryByText('No se pudieron cargar los datos'),
    ).toBeNull()
  })

  it('[P2] should render a caller-provided description', () => {
    // GIVEN: A custom description
    render(
      <ErrorPanel
        description="Inténtalo más tarde"
        onRetry={() => {}}
      />,
    )

    // WHEN / THEN: The custom description wins over the default
    expect(screen.getByText('Inténtalo más tarde')).toBeInTheDocument()
  })
})

describe('[P1] ErrorPanel — retry callback', () => {
  it('[P1] should call onRetry exactly once when Reintentar is clicked', async () => {
    // GIVEN: An ErrorPanel with a mock retry callback
    const onRetry = vi.fn()
    render(<ErrorPanel onRetry={onRetry} />)

    // WHEN: The user clicks the retry button
    const user = userEvent.setup({ delay: null })
    await user.click(screen.getByTestId('error-panel-retry'))

    // THEN: onRetry was called exactly once
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('[P1] should fire onRetry on every subsequent click', async () => {
    // GIVEN: An ErrorPanel with a mock retry callback
    const onRetry = vi.fn()
    render(<ErrorPanel onRetry={onRetry} />)

    // WHEN: The user clicks the retry button three times
    const user = userEvent.setup({ delay: null })
    const btn = screen.getByTestId('error-panel-retry')
    await user.click(btn)
    await user.click(btn)
    await user.click(btn)

    // THEN: onRetry was called three times
    expect(onRetry).toHaveBeenCalledTimes(3)
  })
})

describe('[P2] ErrorPanel — button semantics', () => {
  it('[P2] should render the retry control as a type="button" element', () => {
    // GIVEN: An ErrorPanel
    render(<ErrorPanel onRetry={() => {}} />)

    // WHEN / THEN: The retry button is explicitly type="button" so it never
    // submits an enclosing <form> by accident (a defensive HTML default).
    const btn = screen.getByTestId('error-panel-retry')
    expect(btn.getAttribute('type')).toBe('button')
  })
})
