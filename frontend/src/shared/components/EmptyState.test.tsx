/**
 * Story 2.1 — Edge-case unit tests for EmptyState shared component.
 * Covers: ARIA role, message rendering, and boundary conditions.
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState — rendering', () => {
  it('[P1] renders the provided message text', () => {
    // GIVEN: An EmptyState with a custom message
    // WHEN: Rendered
    render(<EmptyState message="No hay clientes registrados." />)

    // THEN: The message is visible
    expect(screen.getByText('No hay clientes registrados.')).toBeInTheDocument()
  })

  it('[P1] has role="status" for screen reader accessibility', () => {
    // GIVEN: An EmptyState component
    // WHEN: Rendered
    render(<EmptyState message="Sin resultados" />)

    // THEN: role is status
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('[P2] has aria-label="Estado vacío"', () => {
    // GIVEN: An EmptyState
    // WHEN: Rendered
    render(<EmptyState message="Sin resultados" />)

    // THEN: Has the expected aria-label
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Estado vacío')
  })

  it('[P2] renders an SVG icon (aria-hidden)', () => {
    // GIVEN: An EmptyState
    // WHEN: Rendered
    const { container } = render(<EmptyState message="Sin resultados" />)

    // THEN: An SVG is present and decorative (aria-hidden)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('[P2] renders a long message without truncation by default', () => {
    // GIVEN: An EmptyState with a long message
    const longMessage = 'No hay resultados que coincidan con los criterios de búsqueda ingresados en el campo de filtro.'

    // WHEN: Rendered
    render(<EmptyState message={longMessage} />)

    // THEN: Full message is present in the DOM
    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })
})
