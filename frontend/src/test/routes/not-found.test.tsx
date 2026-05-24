/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — RED Phase
 *
 * Tests for the 404 not-found view (`not-found.tsx`):
 *   - Spanish "Página no encontrada" message visible
 *   - Link back to /clientes visible and correct
 *
 * These tests FAIL until `frontend/src/routes/not-found.tsx` is implemented.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// ─── Component stub ──────────────────────────────────────────────────────────
// Forward-declares the expected shape of NotFoundPage.
// Tests fail because the stub does NOT render data-testid elements or the
// required content.
//
// When not-found.tsx is implemented, replace with:
// import { NotFoundPage } from '@/routes/not-found'

function NotFoundPageStub() {
  // Implementation MUST render:
  // - [data-testid="not-found-page"] as root wrapper
  // - [data-testid="not-found-message"] with text "Página no encontrada"
  // - [data-testid="not-found-back-link"] as <a> with href="/clientes"
  return <div />
}

// ─────────────────────────────────────────────────────────────────────────────
// AC4: 404 not-found view
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundPage — 404 view (AC4)', () => {
  it('renders the not-found-page container', () => {
    // GIVEN: The NotFoundPage component is rendered
    render(<NotFoundPageStub />)

    // WHEN: An unknown route triggers the not-found component
    // THEN: The root not-found container is present
    expect(screen.getByTestId('not-found-page')).toBeTruthy()
  })

  it('displays "Página no encontrada" as the main message in Spanish', () => {
    // GIVEN: The NotFoundPage component is rendered
    render(<NotFoundPageStub />)

    // WHEN: A user lands on an unknown route
    // THEN: The Spanish message "Página no encontrada" is visible
    const message = screen.getByTestId('not-found-message')
    expect(message).toHaveTextContent('Página no encontrada')
  })

  it('renders a link back to /clientes', () => {
    // GIVEN: The NotFoundPage is rendered
    render(<NotFoundPageStub />)

    // WHEN: The page is displayed
    // THEN: A link pointing to /clientes is present
    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink).toBeTruthy()
    expect(backLink).toHaveAttribute('href', '/clientes')
  })

  it('back link has accessible link text (not empty)', () => {
    // GIVEN: The NotFoundPage is rendered
    render(<NotFoundPageStub />)

    // WHEN: The back link is rendered
    // THEN: The link has non-empty text so screen readers can describe it
    const backLink = screen.getByTestId('not-found-back-link')
    expect(backLink.textContent?.trim().length).toBeGreaterThan(0)
  })

  it('renders a semantic heading element for the 404 message', () => {
    // GIVEN: The NotFoundPage is rendered
    render(<NotFoundPageStub />)

    // WHEN: The page loads
    // THEN: There is at least one heading element (h1 or h2) for accessibility (WCAG 2.1 AA)
    const heading = screen.queryByRole('heading')
    expect(heading).not.toBeNull()
  })

  it('does not render the NavigationRail or NavigationBar on the 404 page', () => {
    // GIVEN: The NotFoundPage is rendered in isolation
    render(<NotFoundPageStub />)

    // WHEN: The 404 page is displayed
    // THEN: No navigation components bleed into the isolated 404 component
    expect(screen.queryByTestId('navigation-rail')).toBeNull()
    expect(screen.queryByTestId('navigation-bar')).toBeNull()
  })

  it('does not throw when rendered without props', () => {
    // GIVEN: No props passed
    // WHEN: Component is rendered
    // THEN: No exceptions thrown
    expect(() => render(<NotFoundPageStub />)).not.toThrow()
  })
})
