/**
 * Story 2.1 — Client List & Search — EmptyState ATDD (RED phase).
 *
 * Acceptance criterion covered:
 *   AC #5 — EmptyState renders distinct copy and a11y attributes per variant.
 *
 * MUST fail until shared/components/EmptyState/EmptyState.tsx exists with
 * variants: 'no-clients' | 'search-empty' | 'no-contacts'.
 */
import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { EmptyState } from './EmptyState'

describe('EmptyState — variant copy contract', () => {
  test('variant=no-clients renders the no-clients title, subtitle and CTA', () => {
    // GIVEN: EmptyState rendered with the no-clients variant
    render(<EmptyState variant="no-clients" onAction={vi.fn()} />)

    // THEN: copy matches the UX spec
    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
    expect(screen.getByText('Crea el primer cliente del sistema')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo cliente' })).toBeInTheDocument()
  })

  test('variant=search-empty renders the search-empty title and subtitle and NO CTA', () => {
    // GIVEN: EmptyState rendered with the search-empty variant
    render(<EmptyState variant="search-empty" />)

    // THEN: copy matches the UX spec and no CTA is rendered
    expect(screen.getByText('No se encontró ningún cliente')).toBeInTheDocument()
    expect(screen.getByText('Intenta con otro nombre o NIT')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nuevo cliente' })).not.toBeInTheDocument()
  })

  test('container has role="status" and aria-live="polite" for screen reader announcements', () => {
    // GIVEN: EmptyState rendered
    render(<EmptyState variant="no-clients" />)

    // THEN: the announcement region is wired
    const region = screen.getByRole('status')
    expect(region).toHaveAttribute('aria-live', 'polite')
  })

  test('clicking the Nuevo cliente CTA invokes onAction exactly once', async () => {
    // GIVEN: EmptyState with an onAction handler
    const onAction = vi.fn()
    const user = userEvent.setup()
    render(<EmptyState variant="no-clients" onAction={onAction} />)

    // WHEN: the user clicks the CTA
    await user.click(screen.getByRole('button', { name: 'Nuevo cliente' }))

    // THEN: onAction fires once
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  test('the no-clients EmptyState is identifiable via data-testid="empty-state-no-clients"', () => {
    render(<EmptyState variant="no-clients" />)
    expect(screen.getByTestId('empty-state-no-clients')).toBeInTheDocument()
  })

  test('the search-empty EmptyState is identifiable via data-testid="empty-state-search-empty"', () => {
    render(<EmptyState variant="search-empty" />)
    expect(screen.getByTestId('empty-state-search-empty')).toBeInTheDocument()
  })
})
