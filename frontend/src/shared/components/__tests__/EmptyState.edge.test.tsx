/**
 * Story 2.1: Client List & Search
 * Edge Case Tests — EmptyState component (Vitest + RTL)
 *
 * Covers scenarios NOT addressed by ClienteListView integration tests:
 *   - Default message is rendered when no prop is supplied
 *   - Custom message overrides the default
 *   - data-testid="empty-state" is always present
 *   - Icon is rendered (aria-hidden so it doesn't pollute the a11y tree)
 *   - Empty string message renders without crash
 *   - Very long custom message renders without crash
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from '../EmptyState'

// ─────────────────────────────────────────────────────────────────────────────
// data-testid presence
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — data-testid', () => {
  it('should always render data-testid="empty-state"', () => {
    render(<EmptyState />)
    expect(screen.getByTestId('empty-state')).toBeDefined()
  })

  it('should render data-testid="empty-state" when a custom message is provided', () => {
    render(<EmptyState message="No hay resultados" />)
    expect(screen.getByTestId('empty-state')).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Default message
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — default message', () => {
  it('should display the default Spanish message when no message prop is provided', () => {
    render(<EmptyState />)
    expect(screen.getByTestId('empty-state').textContent).toContain(
      'Aún no hay clientes registrados'
    )
  })

  it('default message should contain guidance to create the first client', () => {
    render(<EmptyState />)
    expect(screen.getByTestId('empty-state').textContent).toContain('Crea el primero')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Custom message prop
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — custom message prop', () => {
  it('should display the custom message when provided', () => {
    render(<EmptyState message="No hay resultados para esta búsqueda." />)
    expect(screen.getByTestId('empty-state').textContent).toContain(
      'No hay resultados para esta búsqueda.'
    )
  })

  it('should NOT display the default message when a custom message is supplied', () => {
    render(<EmptyState message="Custom message" />)
    expect(screen.getByTestId('empty-state').textContent).not.toContain(
      'Aún no hay clientes registrados'
    )
  })

  it('should render without crash when message is an empty string', () => {
    expect(() => render(<EmptyState message="" />)).not.toThrow()
    expect(screen.getByTestId('empty-state')).toBeDefined()
  })

  it('should render without crash when message is very long (200+ chars)', () => {
    const longMessage = 'A'.repeat(220)
    expect(() => render(<EmptyState message={longMessage} />)).not.toThrow()
    expect(screen.getByTestId('empty-state').textContent).toContain(longMessage)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Icon accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — icon accessibility', () => {
  it('should render an SVG icon (Heroicons UsersIcon) inside the component', () => {
    render(<EmptyState />)
    const container = screen.getByTestId('empty-state')
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('icon should be aria-hidden so screen readers ignore it', () => {
    render(<EmptyState />)
    const container = screen.getByTestId('empty-state')
    const svg = container.querySelector('svg')
    // Either the svg itself or a wrapper should carry aria-hidden="true"
    expect(
      svg?.getAttribute('aria-hidden') === 'true' ||
      svg?.parentElement?.getAttribute('aria-hidden') === 'true'
    ).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Structural / layout
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — structure', () => {
  it('should be a single root element (not a fragment)', () => {
    const { container } = render(<EmptyState />)
    // The component should render a single root div
    expect(container.firstElementChild?.tagName).toBe('DIV')
  })

  it('should have centered flex layout classes', () => {
    render(<EmptyState />)
    const container = screen.getByTestId('empty-state')
    expect(container.className).toContain('flex')
    expect(container.className).toContain('items-center')
  })
})
