/**
 * Story 2.1: Client List & Search — ErrorPanel Component Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - ErrorPanel component does not exist yet (frontend/src/shared/components/ErrorPanel.tsx)
 *
 * Acceptance Criteria covered:
 *   AC#5 — ErrorPanel with "Reintentar" button shown when backend is unavailable
 *
 * From story tasks:
 *   Task 5 — Create shared ErrorPanel component
 *   - Accepts props: message: string, onRetry: () => void
 *   - WCAG 2.1 AA: role="alert" on container, button has accessible text
 *   - All text in Spanish
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// RED: This import will fail until implementation exists.
// Expected failure: "Cannot find module '../ErrorPanel'"
import { ErrorPanel } from '../ErrorPanel'

describe('ErrorPanel component', () => {
  it('should render the provided message text', () => {
    // GIVEN: error message
    const message = 'Error al cargar los clientes.'

    // WHEN: ErrorPanel is rendered
    render(<ErrorPanel message={message} onRetry={() => {}} />)

    // THEN: message text is visible
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('should have role="alert" for WCAG 2.1 AA compliance (AC#5)', () => {
    // GIVEN: any message

    // WHEN: component renders
    render(<ErrorPanel message="Error al cargar los clientes." onRetry={() => {}} />)

    // THEN: container has role="alert" (announces to screen readers immediately)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should render a "Reintentar" button (AC#5)', () => {
    // GIVEN: component with retry handler

    // WHEN: rendered
    render(<ErrorPanel message="Error al cargar los clientes." onRetry={() => {}} />)

    // THEN: "Reintentar" button exists
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('should call onRetry when "Reintentar" button is clicked (AC#5)', async () => {
    // GIVEN: a spy on the retry handler
    const onRetry = vi.fn()
    const user = userEvent.setup()

    render(<ErrorPanel message="Error al cargar los clientes." onRetry={onRetry} />)

    // WHEN: user clicks "Reintentar"
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: onRetry was called exactly once
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('should call onRetry again on each subsequent click', async () => {
    // GIVEN: spy and user
    const onRetry = vi.fn()
    const user = userEvent.setup()

    render(<ErrorPanel message="Error." onRetry={onRetry} />)

    const retryButton = screen.getByRole('button', { name: 'Reintentar' })

    // WHEN: user clicks multiple times
    await user.click(retryButton)
    await user.click(retryButton)
    await user.click(retryButton)

    // THEN: onRetry called 3 times
    expect(onRetry).toHaveBeenCalledTimes(3)
  })
})
