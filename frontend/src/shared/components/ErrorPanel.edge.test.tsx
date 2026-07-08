/**
 * Story 2.1 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `ErrorPanel`:
 *   * No `subtitle` prop → the subtitle DOM node is not rendered.
 *   * `isRetrying={false}` explicitly → the button is enabled.
 *   * Spinner icon has `aria-hidden="true"` when rendered.
 *   * Multiple sequential Reintentar clicks each fire `onRetry`.
 *   * Container has role="alert" so screen readers announce dynamically.
 *
 * [P2] tag — presentational only, but must never leak error internals (NFR6).
 */
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorPanel } from './ErrorPanel'

describe('ErrorPanel — edge cases', () => {
  it('GIVEN no subtitle prop, THEN no subtitle paragraph is rendered', () => {
    const { container } = render(<ErrorPanel title="Only title" onRetry={vi.fn()} />)

    expect(screen.getByText('Only title')).toBeInTheDocument()
    // Only ONE <p> should exist (the title). The subtitle <p> is optional.
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(1)
  })

  it('GIVEN isRetrying=false explicitly, THEN the button is enabled', () => {
    render(<ErrorPanel title="X" onRetry={vi.fn()} isRetrying={false} />)
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeEnabled()
  })

  it('GIVEN isRetrying is omitted (defaults to false), THEN the button is enabled', () => {
    render(<ErrorPanel title="X" onRetry={vi.fn()} />)
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeEnabled()
  })

  it('GIVEN isRetrying=true, THEN the spinner SVG is present and aria-hidden', () => {
    const { container } = render(<ErrorPanel title="X" onRetry={vi.fn()} isRetrying />)

    const svgs = container.querySelectorAll('svg')
    // At minimum: the ExclamationTriangleIcon + the ArrowPathIcon (spinner).
    expect(svgs.length).toBeGreaterThanOrEqual(2)
    // All decorative icons must be aria-hidden.
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('GIVEN 3 consecutive Reintentar clicks, THEN onRetry is invoked 3 times', () => {
    const onRetry = vi.fn()
    render(<ErrorPanel title="X" onRetry={onRetry} />)

    const button = screen.getByRole('button', { name: /reintentar/i })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(onRetry).toHaveBeenCalledTimes(3)
  })

  it('GIVEN isRetrying=true, WHEN the button is clicked, THEN onRetry is NOT invoked (disabled)', () => {
    const onRetry = vi.fn()
    render(<ErrorPanel title="X" onRetry={onRetry} isRetrying />)

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(onRetry).not.toHaveBeenCalled()
  })

  it('GIVEN a subtitle prop, THEN both title AND subtitle paragraphs are rendered', () => {
    const { container } = render(
      <ErrorPanel title="Título" subtitle="Sub" onRetry={vi.fn()} />,
    )
    expect(container.querySelectorAll('p')).toHaveLength(2)
  })

  it('GIVEN the alert container, THEN it lives under role="alert" (screen readers announce it)', () => {
    render(<ErrorPanel title="X" onRetry={vi.fn()} />)
    const alert = screen.getByRole('alert')
    expect(alert).toContainElement(screen.getByRole('button', { name: /reintentar/i }))
  })
})
