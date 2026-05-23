/**
 * Story 1.2: Frontend Navigation Shell
 * Component Tests — Clientes and Contactos Route Views
 *
 * Edge Cases — Route view stubs (AC3)
 *
 * Tests not covered in ATDD or root.test.tsx:
 *   - ClientesPage renders data-testid="clientes-view"
 *   - ContactosPage renders data-testid="contactos-view"
 *   - Correct heading text per view
 *   - Clientes view does NOT render contactos content
 *   - Contactos view does NOT render clientes content
 */

import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

async function renderAppAt(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] })
  const router = createRouter({ routeTree, history: memoryHistory })
  await act(async () => {
    render(<RouterProvider router={router} />)
    await router.load()
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// ClientesPage — route view component
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientesPage — route view stub', () => {
  it('should render an element with data-testid="clientes-view" at /clientes', async () => {
    // GIVEN: The router renders at /clientes
    await renderAppAt('/clientes')

    // THEN: The clientes view sentinel is present
    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
  })

  it('should render "Clientes" as the heading text in the view', async () => {
    // GIVEN: The router renders at /clientes
    await renderAppAt('/clientes')

    // THEN: The heading with text "Clientes" is present
    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: 'Clientes' })
      expect(heading).toBeInTheDocument()
    })
  })

  it('should NOT render "contactos-view" sentinel when on /clientes', async () => {
    // GIVEN: Router at /clientes
    await renderAppAt('/clientes')

    // THEN: The contactos view sentinel is absent
    expect(screen.queryByTestId('contactos-view')).toBeNull()
  })

  it('should have the clientes-view as a descendant of the main content area', async () => {
    // GIVEN: Router at /clientes
    await renderAppAt('/clientes')

    // THEN: clientes-view is inside a <main> element (correct shell structure)
    await waitFor(() => {
      const view = screen.getByTestId('clientes-view')
      expect(view.closest('main')).not.toBeNull()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ContactosPage — route view component
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactosPage — route view stub', () => {
  it('should render an element with data-testid="contactos-view" at /contactos', async () => {
    // GIVEN: The router renders at /contactos
    await renderAppAt('/contactos')

    // THEN: The contactos view sentinel is present
    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })
  })

  it('should render "Contactos" as the heading text in the view', async () => {
    // GIVEN: The router renders at /contactos
    await renderAppAt('/contactos')

    // THEN: The heading with text "Contactos" is present
    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: 'Contactos' })
      expect(heading).toBeInTheDocument()
    })
  })

  it('should NOT render "clientes-view" sentinel when on /contactos', async () => {
    // GIVEN: Router at /contactos
    await renderAppAt('/contactos')

    // THEN: The clientes view sentinel is absent
    expect(screen.queryByTestId('clientes-view')).toBeNull()
  })

  it('should have the contactos-view as a descendant of the main content area', async () => {
    // GIVEN: Router at /contactos
    await renderAppAt('/contactos')

    // THEN: contactos-view is inside a <main> element (correct shell structure)
    await waitFor(() => {
      const view = screen.getByTestId('contactos-view')
      expect(view.closest('main')).not.toBeNull()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Route isolation — navigating between views swaps content
// ─────────────────────────────────────────────────────────────────────────────

describe('Route isolation — view swaps on navigation', () => {
  it('should show clientes-view at /clientes and not contactos-view', async () => {
    // GIVEN/WHEN: App renders at /clientes
    await renderAppAt('/clientes')

    // THEN: Only clientes view is present
    await waitFor(() => {
      expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('contactos-view')).toBeNull()
  })

  it('should show contactos-view at /contactos and not clientes-view', async () => {
    // GIVEN/WHEN: App renders at /contactos
    await renderAppAt('/contactos')

    // THEN: Only contactos view is present
    await waitFor(() => {
      expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('clientes-view')).toBeNull()
  })
})
