/**
 * Story 2.1: Client List & Search
 * Component Tests — EmptyState shared component (RED phase)
 *
 * Verifies the EmptyState component renders the message prop correctly
 * and exposes the expected accessibility attributes.
 *
 * AC covered: #3 (EmptyState with guidance message)
 *
 * STATUS: RED — EmptyState.tsx does not exist yet.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState — rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState — rendering', () => {
  it('should render the message passed as a prop', async () => {
    // GIVEN: An EmptyState with a specific message
    const { EmptyState } = await import('../EmptyState')

    // WHEN: The component is rendered
    render(
      React.createElement(EmptyState, {
        message: 'No hay clientes aún. Crea el primero.',
      })
    )

    // THEN: The message text is visible in the DOM
    expect(
      screen.getByText('No hay clientes aún. Crea el primero.')
    ).toBeInTheDocument()
  })

  it('should render with data-testid="empty-state"', async () => {
    // GIVEN: An EmptyState component
    const { EmptyState } = await import('../EmptyState')

    // WHEN: Rendered
    render(
      React.createElement(EmptyState, {
        message: 'Sin datos',
      })
    )

    // THEN: The testid is present for selection in tests and E2E
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('should render the default clientes guidance message correctly', async () => {
    // GIVEN: The guidance message as specified in the story
    const { EmptyState } = await import('../EmptyState')

    // WHEN: EmptyState renders the story-specified message
    render(
      React.createElement(EmptyState, {
        message: 'No hay clientes aún. Crea el primero.',
      })
    )

    // THEN: The message is readable in the DOM
    const el = screen.getByTestId('empty-state')
    expect(el).toHaveTextContent('No hay clientes aún. Crea el primero.')
  })

  it('should render without crashing when aria-label is provided', async () => {
    // GIVEN: EmptyState with an aria-label prop
    const { EmptyState } = await import('../EmptyState')

    // WHEN: Rendered with aria-label
    render(
      React.createElement(EmptyState, {
        message: 'Lista vacía',
        'aria-label': 'Lista vacía de clientes',
      })
    )

    // THEN: The component renders without error and has the aria-label
    const el = screen.getByTestId('empty-state')
    expect(el).toHaveAttribute('aria-label', 'Lista vacía de clientes')
  })

  it('should accept different message strings without crashing', async () => {
    // GIVEN: EmptyState receives a different message
    const { EmptyState } = await import('../EmptyState')

    // WHEN: Rendered with alternate text
    render(
      React.createElement(EmptyState, {
        message: 'No se encontraron resultados.',
      })
    )

    // THEN: The alternate message is displayed
    expect(
      screen.getByText('No se encontraron resultados.')
    ).toBeInTheDocument()
  })
})
