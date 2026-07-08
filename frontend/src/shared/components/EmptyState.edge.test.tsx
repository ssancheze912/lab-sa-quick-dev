/**
 * Story 2.1 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `EmptyState`:
 *   * `no-contacts` variant renders correct Spanish copy (declared now for
 *     Epic 3 reuse per Task 9 — the component must not break under this
 *     variant even though Story 2.1 doesn't render it in `ClienteListView`).
 *   * Custom `subtitle` override is honoured.
 *   * `actionLabel` + `onAction` render a button and fire the callback.
 *   * `actionLabel` without `onAction` does NOT render a button.
 *   * The variant icon carries `aria-hidden="true"` (does not clobber the
 *     assistive-tech announcement of the title/subtitle).
 *
 * [P2] tag — UI component: broad reuse, low blast radius per test.
 */
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState — no-contacts variant (future Epic 3)', () => {
  it('renders the exact Spanish title "No hay contactos asociados"', () => {
    render(<EmptyState variant="no-contacts" />)
    expect(screen.getByText('No hay contactos asociados')).toBeInTheDocument()
  })

  it('renders the exact Spanish subtitle "Agrega el primer contacto"', () => {
    render(<EmptyState variant="no-contacts" />)
    expect(screen.getByText('Agrega el primer contacto')).toBeInTheDocument()
  })

  it('sets role="status" and aria-live="polite"', () => {
    render(<EmptyState variant="no-contacts" />)
    const container = screen.getByRole('status')
    expect(container).toHaveAttribute('aria-live', 'polite')
  })
})

describe('EmptyState — subtitle override', () => {
  it('respects a custom subtitle override', () => {
    render(
      <EmptyState variant="no-clients" subtitle="Custom subtitle text" />,
    )
    expect(screen.getByText('Custom subtitle text')).toBeInTheDocument()
    expect(screen.queryByText('Crea el primer cliente del sistema')).not.toBeInTheDocument()
  })

  it('respects both title AND subtitle overrides simultaneously', () => {
    render(
      <EmptyState variant="no-clients" title="Custom Title" subtitle="Custom Sub" />,
    )
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom Sub')).toBeInTheDocument()
  })
})

describe('EmptyState — action button', () => {
  it('GIVEN both actionLabel and onAction, THEN a button with the label is rendered', () => {
    render(
      <EmptyState
        variant="no-clients"
        actionLabel="Nuevo cliente"
        onAction={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /nuevo cliente/i })).toBeInTheDocument()
  })

  it('GIVEN a click on the action button, THEN onAction is invoked exactly once', () => {
    const onAction = vi.fn()
    render(
      <EmptyState
        variant="no-clients"
        actionLabel="Nuevo cliente"
        onAction={onAction}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }))

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('GIVEN actionLabel alone (no onAction), THEN no button is rendered', () => {
    render(<EmptyState variant="no-clients" actionLabel="Ignored label" />)
    expect(screen.queryByRole('button', { name: /ignored label/i })).not.toBeInTheDocument()
  })

  it('GIVEN onAction alone (no actionLabel), THEN no button is rendered', () => {
    render(<EmptyState variant="no-clients" onAction={vi.fn()} />)
    // No text — no button.
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('EmptyState — accessibility', () => {
  it('the decorative icon carries aria-hidden="true"', () => {
    const { container } = render(<EmptyState variant="no-clients" />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
