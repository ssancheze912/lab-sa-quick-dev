/**
 * Story 2.1 — ATDD (RED phase).
 *
 * Covers AC #3 (search-empty variant) and AC #4 (no-clients variant) plus the
 * required a11y attributes.
 *
 * RED until `src/shared/components/EmptyState.tsx` exists.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState — variant="no-clients"', () => {
  it('renders the exact Spanish title "No hay clientes registrados"', () => {
    render(<EmptyState variant="no-clients" />)
    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
  })

  it('renders the exact Spanish subtitle "Crea el primer cliente del sistema"', () => {
    render(<EmptyState variant="no-clients" />)
    expect(screen.getByText('Crea el primer cliente del sistema')).toBeInTheDocument()
  })

  it('sets role="status" and aria-live="polite" for screen-reader announcements', () => {
    render(<EmptyState variant="no-clients" />)
    const container = screen.getByRole('status')
    expect(container).toHaveAttribute('aria-live', 'polite')
  })
})

describe('EmptyState — variant="search-empty"', () => {
  it('renders the exact Spanish title "No se encontró ningún cliente"', () => {
    render(<EmptyState variant="search-empty" />)
    expect(screen.getByText('No se encontró ningún cliente')).toBeInTheDocument()
  })

  it('renders the exact Spanish subtitle "Intenta con otro nombre o NIT"', () => {
    render(<EmptyState variant="search-empty" />)
    expect(screen.getByText('Intenta con otro nombre o NIT')).toBeInTheDocument()
  })

  it('sets role="status" and aria-live="polite" for screen-reader announcements', () => {
    render(<EmptyState variant="search-empty" />)
    const container = screen.getByRole('status')
    expect(container).toHaveAttribute('aria-live', 'polite')
  })
})

describe('EmptyState — override props', () => {
  it('respects a custom title override', () => {
    render(<EmptyState variant="no-clients" title="Custom Title" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })
})
