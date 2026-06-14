/**
 * Story 2.1: Client List & Search — EmptyState Edge Case Tests
 *
 * Expands coverage beyond ATDD tests (EmptyState.test.tsx).
 * Covers: long message text, special characters, multiple renders, accessibility edge cases.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { EmptyState } from '../EmptyState'

describe('EmptyState — edge cases', () => {
  // ─── Long message text ─────────────────────────────────────────────────────

  it('[P2] should render very long message text without crashing', () => {
    // GIVEN: an unusually long message (boundary condition)
    const longMessage = 'No hay clientes registrados. '.repeat(20).trim()

    // WHEN: rendered
    render(<EmptyState message={longMessage} />)

    // THEN: component renders without throwing
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })

  // ─── Special characters in message ────────────────────────────────────────

  it('[P2] should render message containing special characters (accents, punctuation)', () => {
    // GIVEN: message with Spanish accents and special chars
    const message = '¡No hay registros! Crea el primero — ¿ahora?'

    // WHEN: rendered
    render(<EmptyState message={message} />)

    // THEN: text is displayed correctly
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  // ─── aria-label matches message exactly ───────────────────────────────────

  it('[P1] aria-label should exactly match the message prop (no truncation)', () => {
    // GIVEN: specific message
    const message = 'No hay clientes registrados. Crea el primero.'

    // WHEN: rendered
    render(<EmptyState message={message} />)

    // THEN: aria-label is IDENTICAL to message text (WCAG 2.1 AA requirement)
    const statusEl = screen.getByRole('status')
    expect(statusEl.getAttribute('aria-label')).toBe(message)
  })

  // ─── action slot renders without action ────────────────────────────────────

  it('[P2] should NOT render action wrapper div when action prop is undefined', () => {
    // GIVEN: no action
    const { container } = render(<EmptyState message="Sin datos." />)

    // THEN: there is no button and no extra div container for the action
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    // The action wrapper (mt-4 div) should not be present
    const actionDiv = container.querySelector('.mt-4')
    expect(actionDiv).toBeNull()
  })

  // ─── Inbox icon present (visual indicator) ────────────────────────────────

  it('[P2] should render an icon element that is aria-hidden', () => {
    // GIVEN: standard empty state
    const { container } = render(
      <EmptyState message="No hay registros." />
    )

    // THEN: an SVG icon is present and marked aria-hidden (decorative, not announced)
    const icon = container.querySelector('svg[aria-hidden="true"]')
    expect(icon).not.toBeNull()
  })

  // ─── Re-render with different message ────────────────────────────────────

  it('[P2] should update aria-label when message prop changes', () => {
    // GIVEN: initial render with one message
    const { rerender } = render(
      <EmptyState message="Primer mensaje." />
    )
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Primer mensaje.')

    // WHEN: message prop is updated
    rerender(<EmptyState message="Segundo mensaje actualizado." />)

    // THEN: aria-label reflects the new message
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Segundo mensaje actualizado.')
  })

  // ─── Multiple action types ─────────────────────────────────────────────────

  it('[P2] should render a link element as the action slot', () => {
    // GIVEN: action is an anchor element (not just a button)
    render(
      <EmptyState
        message="Sin datos."
        action={<a href="/crear">Ir a crear</a>}
      />
    )

    // THEN: the link is rendered inside the component
    expect(screen.getByRole('link', { name: 'Ir a crear' })).toBeInTheDocument()
  })
})
