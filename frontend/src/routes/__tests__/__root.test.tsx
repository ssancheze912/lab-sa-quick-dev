/**
 * Story 1.1: Project Initialization & Repository Structure
 * Component Tests — Root Route (__root.tsx)
 *
 * Tests the root route component in isolation using TanStack Router's
 * createMemoryHistory + createRouter for unit-level testing.
 *
 * Covers: data-testid presence, Outlet rendering, mount stability,
 *         and the DOM boundary for the root wrapper div.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
import { QueryProvider } from '../../app/providers/QueryProvider'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: minimal router setup for unit tests
// ─────────────────────────────────────────────────────────────────────────────

function renderWithRouter(initialPath: string = '/') {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  return render(
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: data-testid="app-root" must exist (ATDD AC1 unit proxy)
// ─────────────────────────────────────────────────────────────────────────────

describe('Root route — app-root testid', () => {
  it('should render an element with data-testid="app-root"', async () => {
    // GIVEN: The router is initialized at "/"
    renderWithRouter('/')

    // THEN: The root component renders the app-root wrapper
    await screen.findByTestId('app-root')
    expect(screen.getByTestId('app-root')).toBeDefined()
  })

  it('should render exactly one element with data-testid="app-root"', async () => {
    renderWithRouter('/')

    await screen.findByTestId('app-root')
    const roots = screen.getAllByTestId('app-root')

    // THEN: Uniqueness boundary — only one root wrapper in the DOM
    expect(roots).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: app-root must be a div (not replaced by framework elements)
// ─────────────────────────────────────────────────────────────────────────────

describe('Root route — DOM structure boundary', () => {
  it('app-root element should be a <div> tag', async () => {
    renderWithRouter('/')

    const appRoot = await screen.findByTestId('app-root')

    // THEN: The element tag name is DIV
    expect(appRoot.tagName.toLowerCase()).toBe('div')
  })

  it('app-root should contain child content (Outlet is rendered)', async () => {
    renderWithRouter('/')

    const appRoot = await screen.findByTestId('app-root')

    // THEN: The Outlet renders at least one child element
    expect(appRoot.childNodes.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Index route renders inside root
// ─────────────────────────────────────────────────────────────────────────────

describe('Root route — Outlet content at "/"', () => {
  it('should render the clientes view inside app-root after redirect from /', async () => {
    renderWithRouter('/')

    // THEN: Root "/" redirects to "/clientes" — clientes-view is rendered inside app-root
    const clientesView = await screen.findByTestId('clientes-view')
    expect(clientesView).toBeDefined()
  })
})
