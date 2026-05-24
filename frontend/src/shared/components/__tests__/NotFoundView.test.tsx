/**
 * Story 1.2: Frontend Navigation Shell
 * Unit Tests — NotFoundView Component (Isolated)
 *
 * Tests the NotFoundView component in isolation, covering:
 *   - Rendering of the not-found container with correct data-testid
 *   - Spanish-language heading text "Página no encontrada"
 *   - Secondary description text
 *   - Return link href points to /clientes
 *   - Return link text content (Spanish)
 *   - Component renders without crashing when mounted standalone
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render via router to provide TanStack Router Link context
// ─────────────────────────────────────────────────────────────────────────────

async function renderNotFound() {
  const history = createMemoryHistory({ initialEntries: ['/unknown-route-for-test'] })
  const router = createRouter({ routeTree, history })
  await router.load()
  render(<RouterProvider router={router} />)
}

// ─────────────────────────────────────────────────────────────────────────────
// NotFoundView — Data Attributes and Structure
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — Structure and data-testid', () => {
  it('[P1] should render the not-found container with data-testid="not-found-view"', async () => {
    // GIVEN: User navigates to an unknown route
    await renderNotFound()

    // THEN: The not-found container is rendered with the correct test id
    const view = await screen.findByTestId('not-found-view')
    expect(view).toBeInTheDocument()
  })

  it('[P1] should render the heading with data-testid="not-found-message"', async () => {
    // GIVEN: User navigates to an unknown route
    await renderNotFound()

    // THEN: The heading element with the test id is present
    const message = await screen.findByTestId('not-found-message')
    expect(message).toBeInTheDocument()
  })

  it('[P1] should render the return link with data-testid="not-found-return-link"', async () => {
    // GIVEN: User navigates to an unknown route
    await renderNotFound()

    // THEN: The return link element is present
    const link = await screen.findByTestId('not-found-return-link')
    expect(link).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NotFoundView — Spanish Text Content
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — Spanish Text Content', () => {
  it('[P1] should display exactly "Página no encontrada" as the heading text', async () => {
    // GIVEN: User is on the 404 view
    await renderNotFound()

    // THEN: The heading text is exactly the required Spanish message
    const message = await screen.findByTestId('not-found-message')
    expect(message).toHaveTextContent('Página no encontrada')
  })

  it('[P2] should display secondary description "La ruta que buscas no existe"', async () => {
    // GIVEN: User is on the 404 view
    await renderNotFound()

    // THEN: A secondary description is shown to explain the error
    const view = await screen.findByTestId('not-found-view')
    expect(view).toHaveTextContent('La ruta que buscas no existe')
  })

  it('[P2] should display return link text containing "Clientes"', async () => {
    // GIVEN: User is on the 404 view
    await renderNotFound()

    // THEN: The return link has text that references Clientes (Spanish)
    const link = await screen.findByTestId('not-found-return-link')
    expect(link).toHaveTextContent(/clientes/i)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NotFoundView — Link Href Boundary
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — Return Link href', () => {
  it('[P1] should have href="/clientes" on the return link (not "/" or "#")', async () => {
    // GIVEN: User is on the 404 view
    await renderNotFound()

    // THEN: The return link href points exactly to /clientes
    const link = await screen.findByTestId('not-found-return-link')
    expect(link).toHaveAttribute('href', '/clientes')
  })

  it('[P2] should not have href="#" or href="" on the return link', async () => {
    // GIVEN: User is on the 404 view
    await renderNotFound()

    // THEN: The return link is a valid navigation link (not empty/anchor-only)
    const link = await screen.findByTestId('not-found-return-link')
    const href = link.getAttribute('href')
    expect(href).not.toBe('#')
    expect(href).not.toBe('')
    expect(href).not.toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// NotFoundView — Heading Semantics
// ─────────────────────────────────────────────────────────────────────────────

describe('NotFoundView — Heading Semantics', () => {
  it('[P2] should render "Página no encontrada" as an h1 element', async () => {
    // GIVEN: User is on the 404 view
    await renderNotFound()

    // THEN: The error message is an h1 (proper heading hierarchy for screen readers)
    const heading = await screen.findByRole('heading', { level: 1, name: /página no encontrada/i })
    expect(heading).toBeInTheDocument()
  })
})
