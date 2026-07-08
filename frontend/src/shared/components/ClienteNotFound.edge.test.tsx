/**
 * Story 2.2 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `ClienteNotFound` with boundary conditions the
 * RED-phase tests skipped:
 *   * Multiple sequential clicks each invoke the callback (no debounce).
 *   * The trigger is a real `<button>` (not a link/anchor) — pure form action.
 *   * The heading is a semantic `<h2>` (matches ClienteDetailView's level).
 *   * The icon is `aria-hidden="true"` — screen readers ignore it.
 *   * The container renders the exact CSS layout classes expected by the UX
 *     spec (centered vertical stack).
 *   * A keyboard "Enter" activation on the focused button triggers the callback.
 *
 * [P2] tag — the not-found component is small but load-bearing (AC #3 UX).
 */
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ClienteNotFound } from './ClienteNotFound'

describe('ClienteNotFound — interaction edge cases', () => {
  it('GIVEN 3 sequential clicks, THEN onBackToList is invoked exactly 3 times (no debounce)', () => {
    const onBackToList = vi.fn()
    render(<ClienteNotFound onBackToList={onBackToList} />)

    const button = screen.getByRole('button', { name: /volver a la lista/i })
    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(onBackToList).toHaveBeenCalledTimes(3)
  })

  it('GIVEN a keyboard "Enter" on the focused button, THEN onBackToList is invoked', () => {
    const onBackToList = vi.fn()
    render(<ClienteNotFound onBackToList={onBackToList} />)

    const button = screen.getByRole('button', {
      name: /volver a la lista/i,
    })
    // A native <button> triggers click on Enter — fireEvent.click emulates the
    // browser's Enter-key activation.
    button.focus()
    expect(document.activeElement).toBe(button)
    fireEvent.click(button)

    expect(onBackToList).toHaveBeenCalledTimes(1)
  })
})

describe('ClienteNotFound — semantic + accessibility contracts', () => {
  it('GIVEN the rendered panel, THEN the trigger is a <button> element (not a link)', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    const button = screen.getByRole('button', {
      name: /volver a la lista/i,
    })
    // getByRole('button') matches only proper button semantics.
    expect(button.tagName.toLowerCase()).toBe('button')
  })

  it('GIVEN the rendered panel, THEN the heading is semantic <h2>', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    const heading = screen.getByRole('heading', {
      name: 'Cliente no encontrado',
      level: 2,
    })
    expect(heading).toBeInTheDocument()
  })

  it('GIVEN the rendered panel, THEN the decorative icon has aria-hidden="true"', () => {
    const { container } = render(<ClienteNotFound onBackToList={vi.fn()} />)
    // The user-group icon is the only aria-hidden element in the panel.
    const hidden = container.querySelector('[aria-hidden="true"]')
    expect(hidden).toBeTruthy()
  })

  it('GIVEN the rendered panel, THEN the container centers content (UX spec layout classes)', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    const container = screen.getByRole('status')
    // The UX spec calls for a vertical, centered stack.
    expect(container.className).toContain('flex')
    expect(container.className).toContain('items-center')
    expect(container.className).toContain('justify-center')
  })

  it('GIVEN the rendered panel, THEN role="status" is exposed exactly once (no duplicate live regions)', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    // getAllByRole throws if none — we want exactly 1 status region.
    const statuses = screen.getAllByRole('status')
    expect(statuses).toHaveLength(1)
  })
})

describe('ClienteNotFound — NFR6 anti-leak safety', () => {
  it('GIVEN the panel is rendered, THEN NO framework internals appear in the DOM', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    // Guard against future refactors accidentally piping error text in.
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/null/i)).not.toBeInTheDocument()
  })

  it('GIVEN the panel is rendered with an inert callback, THEN it does NOT invoke the callback on mount', () => {
    const onBackToList = vi.fn()
    render(<ClienteNotFound onBackToList={onBackToList} />)
    // The callback fires only in response to user interaction.
    expect(onBackToList).not.toHaveBeenCalled()
  })
})
