/**
 * Story 2.1 — EmptyState shared component (Automate expansion)
 *
 * Unit-level tests for the `EmptyState` shared component. Component-level
 * coverage complements the ATDD suite which only exercises `EmptyState`
 * indirectly through `ClienteListView`.
 *
 * Priority: P2 — direct props coverage of a small presentational component.
 * Deterministic: no MSW / query client required (pure render).
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

import { EmptyState } from '@/shared/components/EmptyState'

afterEach(() => cleanup())

describe('[P2] EmptyState — props contract', () => {
  it('[P2] should render the provided title', () => {
    // GIVEN: A title in Spanish
    render(<EmptyState title="Aún no hay clientes" />)

    // WHEN / THEN: The title is present in the DOM
    expect(screen.getByText('Aún no hay clientes')).toBeInTheDocument()
  })

  it('[P2] should render the description when provided', () => {
    // GIVEN: A title and description
    render(
      <EmptyState
        title="Aún no hay clientes"
        description="Cuando registres el primero aparecerá aquí."
      />,
    )

    // WHEN / THEN: The description text is present
    expect(
      screen.getByText('Cuando registres el primero aparecerá aquí.'),
    ).toBeInTheDocument()
  })

  it('[P2] should NOT render a description paragraph when the prop is omitted', () => {
    // GIVEN: An EmptyState without a description
    render(<EmptyState title="Sin datos" />)

    // WHEN / THEN: Only the title paragraph exists inside the container
    const container = screen.getByTestId('empty-state')
    // The description paragraph would be a second <p>; without it, only one <p>.
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(1)
    expect(paragraphs[0].textContent).toBe('Sin datos')
  })

  it('[P2] should expose the data-testid="empty-state" hook', () => {
    // GIVEN: Any EmptyState instance
    render(<EmptyState title="Vacío" />)

    // WHEN / THEN: The test hook is on the outer container
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})
