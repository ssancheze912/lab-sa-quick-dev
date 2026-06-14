/**
 * Story 2.1: Client List & Search — EmptyState Component Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - EmptyState component does not exist yet (frontend/src/shared/components/EmptyState.tsx)
 *
 * Acceptance Criteria covered:
 *   AC#4 — EmptyState renders the guidance message when no clients exist
 *
 * From story tasks:
 *   Task 4 — Create shared EmptyState component
 *   - Accepts props: message: string, optional action?: React.ReactNode
 *   - WCAG 2.1 AA: role="status" and aria-label matching message
 *   - All text in Spanish
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// RED: This import will fail until implementation exists.
// Expected failure: "Cannot find module '../EmptyState'"
import { EmptyState } from '../EmptyState'

describe('EmptyState component', () => {
  it('should render the provided message text', () => {
    // GIVEN: a message string
    const message = 'No hay clientes registrados. Crea el primero.'

    // WHEN: EmptyState is rendered
    render(<EmptyState message={message} />)

    // THEN: message text is visible
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('should have role="status" for WCAG 2.1 AA compliance (AC#4)', () => {
    // GIVEN: a message
    const message = 'No hay clientes registrados. Crea el primero.'

    // WHEN: component renders
    render(<EmptyState message={message} />)

    // THEN: container has role="status"
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should have aria-label matching the message text (AC#4)', () => {
    // GIVEN: a specific message
    const message = 'No hay clientes registrados. Crea el primero.'

    // WHEN: component renders
    render(<EmptyState message={message} />)

    // THEN: aria-label matches message
    expect(
      screen.getByRole('status', { name: message })
    ).toBeInTheDocument()
  })

  it('should render optional action slot when provided', async () => {
    // GIVEN: an action node is passed
    const user = userEvent.setup()
    let clicked = false

    render(
      <EmptyState
        message="No hay registros."
        action={
          <button onClick={() => { clicked = true }}>Crear primero</button>
        }
      />
    )

    // WHEN: action button is rendered and clicked
    const actionButton = screen.getByRole('button', { name: 'Crear primero' })
    expect(actionButton).toBeInTheDocument()

    await user.click(actionButton)

    // THEN: click handler was invoked
    expect(clicked).toBe(true)
  })

  it('should NOT render an action slot when action prop is not provided', () => {
    // GIVEN: no action prop

    // WHEN: component renders
    render(<EmptyState message="Sin datos." />)

    // THEN: no button in the component
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
