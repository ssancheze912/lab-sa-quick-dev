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

  test('[P2] should render a real anchor element for the recovery link (not a button/onClick div)', () => {
    // GIVEN: the not-found view is rendered
    // WHEN: inspecting the recovery link element
    renderWithRouter(<NotFoundView />, { initialPath: '/foo' })

    // THEN: it is a genuine <a> tag for correct semantics/deep-linking, not a styled button
    const recoveryLink = screen.getByTestId('not-found-recovery-link')
    expect(recoveryLink.tagName).toBe('A')
  })

  test('[P2] should render the same graceful not-found view for any unmatched nested path', () => {
    // GIVEN: an arbitrary deeply-nested unknown path (not just a single-segment one)
    // WHEN: the not-found view renders for that path
    renderWithRouter(<NotFoundView />, { initialPath: '/clientes/does-not-exist/nested' })

    // THEN: the same graceful Spanish heading renders — no crash, no blank screen
    expect(screen.getByRole('heading', { name: /página no encontrada/i })).toBeInTheDocument()
  })

  test('[P3] should render explanatory body text alongside the heading', () => {
    // GIVEN: the not-found view is rendered
    // WHEN: inspecting its content
    renderWithRouter(<NotFoundView />, { initialPath: '/foo' })

    // THEN: a supporting message is shown to the user (not just a bare heading)
    expect(screen.getByText(/la página que buscas no existe o fue movida/i)).toBeInTheDocument()
  })
})
