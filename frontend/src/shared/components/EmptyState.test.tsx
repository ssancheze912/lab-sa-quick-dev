/**
 * Story 2.1: Client List & Search — Task 12
 * Epic 2: Client Management
 *
 * ATDD component test — RED Phase
 * Intentionally FAILING until `EmptyState` is implemented.
 *
 * Acceptance Criteria covered:
 *   AC #6  — `no-clients` variant rendered when the backend returns [].
 *   AC #7  — `search-empty` variant rendered when the filter yields no result
 *            (wrapped in aria-live="polite" so screen readers announce changes).
 *   AC #11 — Spanish copy (verbatim strings from the story).
 *
 * Verbatim copy assertions:
 *   no-clients   → title    "No hay clientes registrados"
 *                  subtitle "Crea el primer cliente del sistema"
 *                  CTA      "Nuevo cliente"
 *   search-empty → title    "No se encontró ningún cliente"
 *                  subtitle "Intenta con otro nombre o NIT"
 *                  CTA      "Crear cliente"
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
// RED: EmptyState.tsx does not exist yet — this import will fail until Task 12 is done.
import { EmptyState } from './EmptyState'

afterEach(() => {
  cleanup()
})

describe('EmptyState — no-clients variant (AC #6, #11)', () => {
  it('renders the verbatim Spanish title', () => {
    // GIVEN / WHEN: the no-clients variant mounts
    render(<EmptyState variant="no-clients" />)

    // THEN: the verbatim Spanish title is visible
    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
  })

  it('renders the verbatim Spanish subtitle', () => {
    render(<EmptyState variant="no-clients" />)
    expect(screen.getByText('Crea el primer cliente del sistema')).toBeInTheDocument()
  })

  it('renders the "Nuevo cliente" CTA when an onCtaClick handler is provided', () => {
    // GIVEN: an onCtaClick handler
    const onCtaClick = vi.fn()

    // WHEN: the no-clients variant mounts
    render(<EmptyState variant="no-clients" onCtaClick={onCtaClick} />)

    // THEN: the verbatim CTA label is visible
    expect(screen.getByRole('button', { name: 'Nuevo cliente' })).toBeInTheDocument()
  })

  it('exposes the data-testid="empty-state" hook + data-variant="no-clients"', () => {
    render(<EmptyState variant="no-clients" />)
    const root = screen.getByTestId('empty-state')
    expect(root).toBeInTheDocument()
    expect(root).toHaveAttribute('data-variant', 'no-clients')
  })

  it('is wrapped in an aria-live="polite" region (AC #7 accessibility)', () => {
    render(<EmptyState variant="no-clients" />)
    const root = screen.getByTestId('empty-state')
    expect(root).toHaveAttribute('aria-live', 'polite')
  })
})

describe('EmptyState — search-empty variant (AC #7, #11)', () => {
  it('renders the verbatim Spanish title', () => {
    render(<EmptyState variant="search-empty" />)
    expect(screen.getByText('No se encontró ningún cliente')).toBeInTheDocument()
  })

  it('renders the verbatim Spanish subtitle', () => {
    render(<EmptyState variant="search-empty" />)
    expect(screen.getByText('Intenta con otro nombre o NIT')).toBeInTheDocument()
  })

  it('renders the "Crear cliente" CTA when an onCtaClick handler is provided', () => {
    const onCtaClick = vi.fn()
    render(<EmptyState variant="search-empty" onCtaClick={onCtaClick} />)
    expect(screen.getByRole('button', { name: 'Crear cliente' })).toBeInTheDocument()
  })

  it('exposes data-variant="search-empty"', () => {
    render(<EmptyState variant="search-empty" />)
    expect(screen.getByTestId('empty-state')).toHaveAttribute('data-variant', 'search-empty')
  })
})

describe('EmptyState — CTA interaction', () => {
  it('invokes onCtaClick when the CTA button is clicked', () => {
    // GIVEN: an onCtaClick handler
    const onCtaClick = vi.fn()
    render(<EmptyState variant="no-clients" onCtaClick={onCtaClick} />)

    // WHEN: the user clicks the CTA
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo cliente' }))

    // THEN: the handler is invoked exactly once
    expect(onCtaClick).toHaveBeenCalledTimes(1)
  })

  it('does NOT render the CTA when onCtaClick is omitted (placeholder mode for this story)', () => {
    // GIVEN: no onCtaClick handler (CTA is a no-op in Story 2.1)
    render(<EmptyState variant="no-clients" />)

    // WHEN: the component renders
    // THEN: the CTA is not present (Story 2.3 wires the click)
    expect(screen.queryByRole('button', { name: 'Nuevo cliente' })).not.toBeInTheDocument()
  })
})
