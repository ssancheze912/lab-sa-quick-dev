/**
 * Story 1.2: Frontend Navigation Shell
 * Component tests for the 404 not-found route — RED Phase (TDD)
 *
 * Acceptance Criteria covered:
 *   AC6 — Unknown route: 404 view in Spanish within shell with link back to /clientes
 *
 * These tests FAIL initially (RED phase) because:
 *   - $notFound.tsx does not exist yet
 *   - "Página no encontrada" text is not rendered
 *   - The not-found-view and not-found-home-link data-testid attributes are absent
 *
 * Testing stack: Vitest + React Testing Library + jsdom
 * Pattern: Given-When-Then
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React from 'react'

// ─── Router mock ─────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({
      to,
      children,
      ...rest
    }: {
      to: string
      children?: React.ReactNode
      [key: string]: unknown
    }) => (
      <a href={to} {...rest}>
        {children}
      </a>
    ),
    createFileRoute: actual.createFileRoute,
    useRouter: () => ({ navigate: vi.fn() }),
  }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — 404 not-found route: Spanish text, link back to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — 404 not-found route component', () => {
  it('should render the not-found view container (data-testid="not-found-view")', async () => {
    // GIVEN: A user navigates to an unknown route
    // The $notFound.tsx component is imported — fails RED if file does not exist
    const { Route } = await import('../$notFound')
    const NotFoundComponent = Route.options.component as React.FC

    // WHEN: The not-found component renders
    render(<NotFoundComponent />)

    // THEN: The not-found view container is present
    expect(screen.getByTestId('not-found-view')).toBeInTheDocument()
  })

  it('should display "Página no encontrada" in Spanish in the 404 view', async () => {
    // GIVEN: User lands on an unknown route
    const { Route } = await import('../$notFound')
    const NotFoundComponent = Route.options.component as React.FC

    // WHEN: The not-found component renders
    render(<NotFoundComponent />)

    // THEN: The Spanish not-found message is visible
    expect(screen.getByTestId('not-found-view')).toHaveTextContent('Página no encontrada')
  })

  it('should provide a home link with data-testid="not-found-home-link" pointing to /clientes', async () => {
    // GIVEN: The 404 view is rendered
    const { Route } = await import('../$notFound')
    const NotFoundComponent = Route.options.component as React.FC

    // WHEN: The not-found component renders
    render(<NotFoundComponent />)

    // THEN: The home link is present and points to /clientes
    const homeLink = screen.getByTestId('not-found-home-link')
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/clientes')
  })

  it('should display a clickable link text that guides users back to the main section', async () => {
    // GIVEN: The 404 view is rendered
    const { Route } = await import('../$notFound')
    const NotFoundComponent = Route.options.component as React.FC

    // WHEN: The not-found component renders
    render(<NotFoundComponent />)

    // THEN: The link has visible, non-empty text content
    const homeLink = screen.getByTestId('not-found-home-link')
    expect(homeLink.textContent?.trim().length).toBeGreaterThan(0)
  })

  it('should render a heading or prominent element for the 404 message', async () => {
    // GIVEN: The 404 view renders inside the shell
    const { Route } = await import('../$notFound')
    const NotFoundComponent = Route.options.component as React.FC

    // WHEN: The not-found component renders
    render(<NotFoundComponent />)

    // THEN: A heading element (h1 or h2) contains the not-found text
    const heading = screen.queryByRole('heading')
    expect(heading).not.toBeNull()
    expect(heading?.textContent).toBeTruthy()
  })
})
