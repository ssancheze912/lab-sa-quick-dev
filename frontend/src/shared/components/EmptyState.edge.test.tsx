/**
 * Story 2.1: Client List & Search — Automate Phase
 * Epic 2: Client Management
 *
 * AUTOMATE expansion tests (edge cases — NOT regenerated from ATDD)
 * Complements `EmptyState.test.tsx` with the third variant `no-contacts`,
 * multiple-click idempotence, and CTA-omission scenarios for the search-empty
 * variant.
 *
 * Acceptance Criteria touched:
 *   AC #6 / AC #7 — EmptyState variants accessibility.
 *   AC #11 — Spanish copy for every variant.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { EmptyState } from './EmptyState'

afterEach(() => {
  cleanup()
})

describe('EmptyState — no-contacts variant (Future story 4.x reuse)', () => {
  it('[P3] renders the verbatim "No hay contactos registrados" title', () => {
    // GIVEN / WHEN: the no-contacts variant mounts
    render(<EmptyState variant="no-contacts" />)

    // THEN: the verbatim title appears (Spanish, reused in Epic 4)
    expect(screen.getByText('No hay contactos registrados')).toBeInTheDocument()
  })

  it('[P3] renders the verbatim "Crea el primer contacto del sistema" subtitle', () => {
    render(<EmptyState variant="no-contacts" />)
    expect(screen.getByText('Crea el primer contacto del sistema')).toBeInTheDocument()
  })

  it('[P3] exposes data-variant="no-contacts" on the root', () => {
    render(<EmptyState variant="no-contacts" />)
    expect(screen.getByTestId('empty-state')).toHaveAttribute('data-variant', 'no-contacts')
  })

  it('[P3] keeps role="status" + aria-live="polite" so AT users still get the announcement', () => {
    render(<EmptyState variant="no-contacts" />)
    const root = screen.getByTestId('empty-state')
    expect(root).toHaveAttribute('role', 'status')
    expect(root).toHaveAttribute('aria-live', 'polite')
  })

  it('[P3] renders the "Nuevo contacto" CTA when onCtaClick is provided', () => {
    const onCtaClick = vi.fn()
    render(<EmptyState variant="no-contacts" onCtaClick={onCtaClick} />)
    expect(screen.getByRole('button', { name: 'Nuevo contacto' })).toBeInTheDocument()
  })
})

describe('EmptyState — CTA interaction edges', () => {
  it('[P2] fires onCtaClick once per click — multiple clicks fire multiple times', () => {
    // GIVEN: a no-clients EmptyState with an onCtaClick handler
    const onCtaClick = vi.fn()
    render(<EmptyState variant="no-clients" onCtaClick={onCtaClick} />)

    // WHEN: the user clicks the CTA three times
    const cta = screen.getByRole('button', { name: 'Nuevo cliente' })
    fireEvent.click(cta)
    fireEvent.click(cta)
    fireEvent.click(cta)

    // THEN: the handler is invoked exactly three times (no swallowing)
    expect(onCtaClick).toHaveBeenCalledTimes(3)
  })

  it('[P2] does NOT render the search-empty CTA when onCtaClick is omitted', () => {
    // GIVEN: search-empty without an onCtaClick handler (placeholder mode in Story 2.1)
    render(<EmptyState variant="search-empty" />)

    // WHEN / THEN: the "Crear cliente" CTA is absent
    expect(screen.queryByRole('button', { name: 'Crear cliente' })).not.toBeInTheDocument()
  })

  it('[P2] every variant exposes a single root element with data-testid="empty-state"', () => {
    // GIVEN: rendering all three variants in isolation
    const { unmount: u1 } = render(<EmptyState variant="no-clients" />)
    expect(screen.getAllByTestId('empty-state')).toHaveLength(1)
    u1()

    const { unmount: u2 } = render(<EmptyState variant="search-empty" />)
    expect(screen.getAllByTestId('empty-state')).toHaveLength(1)
    u2()

    render(<EmptyState variant="no-contacts" />)
    expect(screen.getAllByTestId('empty-state')).toHaveLength(1)
  })
})
