import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { NotFoundView } from './NotFoundView'

// RED PHASE: NotFoundView.tsx does not exist yet (Task 5 of story 1.2).
// Covers AC #5: unknown routes render a graceful, Spanish 404 view with a
// recovery link back to /clientes (no crash, no blank screen).

describe('NotFoundView', () => {
  test('should display the Spanish "Página no encontrada" heading', () => {
    // GIVEN: the user navigated to an unknown route
    // WHEN: the not-found view renders
    renderWithRouter(<NotFoundView />, { initialPath: '/foo' })

    // THEN: the Spanish not-found heading is shown
    expect(screen.getByRole('heading', { name: /página no encontrada/i })).toBeInTheDocument()
  })

  test('should render a link back to /clientes for recovery', () => {
    // GIVEN: the user is on the not-found view
    // WHEN: the view renders
    renderWithRouter(<NotFoundView />, { initialPath: '/foo' })

    // THEN: a recovery link pointing to /clientes is present
    const recoveryLink = screen.getByTestId('not-found-recovery-link')
    expect(recoveryLink).toHaveAttribute('href', '/clientes')
  })
})
