/**
 * Story 2.1 — EmptyState edge-case automation expansion.
 *
 * Complements EmptyState.test.tsx with cases the ATDD layer omits:
 *   [P2] `no-clients` variant WITHOUT onAction → CTA must NOT render (defensive)
 *   [P2] `no-contacts` variant (Epic 3 placeholder) renders the expected copy
 *   [P2] Container aria-live="polite" — verified across every variant
 *   [P2] No CTA on `search-empty` even when onAction is provided (variant has no ctaLabel)
 */
import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { EmptyState } from './EmptyState'

describe('EmptyState — edge cases', () => {
  test('[P2] no-clients WITHOUT onAction omits the CTA button', () => {
    // GIVEN: no onAction provided
    render(<EmptyState variant="no-clients" />)

    // THEN: CTA is NOT rendered (showCta requires both label AND handler)
    expect(screen.queryByRole('button', { name: 'Nuevo cliente' })).not.toBeInTheDocument()
    // sanity — title/subtitle still render
    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
  })

  test('[P2] search-empty WITH onAction still does NOT render a CTA', () => {
    // GIVEN: search-empty variant has no ctaLabel by design
    render(<EmptyState variant="search-empty" onAction={vi.fn()} />)

    // THEN: no CTA, even though onAction was supplied
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  test('[P2] no-contacts variant renders the Epic 3 copy and CTA', () => {
    // GIVEN: future no-contacts variant (Epic 3 hook)
    render(<EmptyState variant="no-contacts" onAction={vi.fn()} />)

    // THEN: copy + CTA render
    expect(screen.getByText('No hay contactos registrados')).toBeInTheDocument()
    expect(screen.getByText('Crea el primer contacto del sistema')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo contacto' })).toBeInTheDocument()
  })

  test('[P2] no-contacts variant is identifiable via data-testid="empty-state-no-contacts"', () => {
    render(<EmptyState variant="no-contacts" />)
    expect(screen.getByTestId('empty-state-no-contacts')).toBeInTheDocument()
  })

  test('[P2] container aria-live="polite" holds across every variant', () => {
    // The screen-reader announcement contract MUST be present in ALL variants
    const variants = ['no-clients', 'search-empty', 'no-contacts'] as const

    for (const variant of variants) {
      const { unmount } = render(<EmptyState variant={variant} />)
      const region = screen.getByRole('status')
      expect(region).toHaveAttribute('aria-live', 'polite')
      unmount()
    }
  })

  test('[P2] icons are aria-hidden so screen readers do not announce them', () => {
    // GIVEN: rendered EmptyState
    const { container } = render(<EmptyState variant="no-clients" />)

    // THEN: every SVG icon inside is aria-hidden
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true')
    })
  })
})
