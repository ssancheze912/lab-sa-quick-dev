/**
 * Story 2.1: Client List & Search
 * Component tests for EmptyState
 *
 * Acceptance Criteria covered:
 *   AC3 — variant="no-clients": shows "No hay clientes registrados" + "Nuevo cliente" CTA
 *   AC4 — variant="search-empty": shows "No se encontró ningún cliente" hint, no CTA
 *
 * NOTE: Tests are in RED state — they will fail until EmptyState.tsx is implemented.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// RED: import will fail until component exists
import { EmptyState } from './EmptyState'

afterEach(() => cleanup())

describe('EmptyState — variant="no-clients"', () => {
  /**
   * AC3: Given there are no clients in the system,
   * When the user navigates to /clientes,
   * Then the EmptyState component (variant="no-clients") is displayed with
   * the message "No hay clientes registrados" and a "Nuevo cliente" CTA button.
   */
  it('renders "No hay clientes registrados" message', () => {
    render(<EmptyState variant="no-clients" onAction={vi.fn()} />)

    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
  })

  it('renders "Nuevo cliente" CTA button', () => {
    render(<EmptyState variant="no-clients" onAction={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: 'Nuevo cliente' })
    ).toBeInTheDocument()
  })

  it('calls onAction when "Nuevo cliente" CTA is clicked', () => {
    const handleAction = vi.fn()
    render(<EmptyState variant="no-clients" onAction={handleAction} />)

    fireEvent.click(screen.getByRole('button', { name: 'Nuevo cliente' }))

    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('renders descriptive subtitle for no-clients state', () => {
    render(<EmptyState variant="no-clients" onAction={vi.fn()} />)

    // The subtitle text per story spec
    expect(
      screen.getByText('Crea el primer cliente del sistema')
    ).toBeInTheDocument()
  })
})

describe('EmptyState — variant="search-empty"', () => {
  /**
   * AC4: Given a search returns no matching clients,
   * When the search field contains text with no results,
   * Then the EmptyState component (variant="search-empty") is displayed with
   * the message "No se encontró ningún cliente" and hint "Intenta con otro nombre o NIT".
   */
  it('renders "No se encontró ningún cliente" message', () => {
    render(<EmptyState variant="search-empty" />)

    expect(screen.getByText('No se encontró ningún cliente')).toBeInTheDocument()
  })

  it('renders hint "Intenta con otro nombre o NIT"', () => {
    render(<EmptyState variant="search-empty" />)

    expect(
      screen.getByText('Intenta con otro nombre o NIT')
    ).toBeInTheDocument()
  })

  it('does NOT render a CTA button for search-empty variant', () => {
    render(<EmptyState variant="search-empty" />)

    expect(
      screen.queryByRole('button', { name: 'Nuevo cliente' })
    ).not.toBeInTheDocument()
  })
})

describe('EmptyState — accessibility', () => {
  /**
   * AC3/AC4: aria-live="polite" announces result changes to screen readers.
   */
  it('container has aria-live="polite"', () => {
    const { container } = render(<EmptyState variant="no-clients" onAction={vi.fn()} />)

    // The outer container must have aria-live="polite"
    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).not.toBeNull()
  })

  it('aria-live="polite" is also present for search-empty variant', () => {
    const { container } = render(<EmptyState variant="search-empty" />)

    const liveRegion = container.querySelector('[aria-live="polite"]')
    expect(liveRegion).not.toBeNull()
  })

  it('has data-testid="empty-state" for testability', () => {
    render(<EmptyState variant="no-clients" onAction={vi.fn()} />)

    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})
