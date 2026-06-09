/**
 * Component Edge-Case Tests — ClienteListView
 * Story 2.1: Client List & Search
 * Expands ATDD component coverage with edge cases NOT in ClienteListView.test.tsx
 *
 * Scenarios:
 *   EC-COMP-01 — Loading skeleton is visible while isLoading=true
 *   EC-COMP-02 — Case-insensitive search
 *   EC-COMP-03 — Search with leading/trailing spaces (trims correctly)
 *   EC-COMP-04 — Search no-match shows search-specific EmptyState message
 *   EC-COMP-05 — Clicking Reintentar multiple times does not crash
 *   EC-COMP-06 — Search input has correct placeholder (Spanish)
 *   EC-COMP-07 — Search input has aria-label for accessibility
 *   EC-COMP-08 — Empty state with existing data but no search match uses different message
 *   EC-COMP-09 — Each client item has role=listitem
 *   EC-COMP-10 — Panel has data-testid=clientes-list-panel
 *   EC-COMP-11 — Long nombre/NIT are rendered (not null/undefined)
 *   EC-COMP-12 — Search query updates in real time (each keystroke filters)
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import React from 'react'
import { ClienteListView } from './ClienteListView'
import type { Cliente } from '../domain/Cliente'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCliente(id: string, nombre: string, nit: string, overrides: Partial<Cliente> = {}): Cliente {
  return {
    id,
    nombre,
    nit,
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultClientes: Cliente[] = [
  makeCliente('1', 'Acme Corp', '900111111-1'),
  makeCliente('2', 'Beta SA', '800222222-2'),
  makeCliente('3', 'Gamma Ltda', '700333333-3'),
]

const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json(defaultClientes)),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function renderView(overrideQueryClient?: QueryClient) {
  const queryClient = overrideQueryClient ?? new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(ClienteListView),
    ),
  )
  return queryClient
}

// ---------------------------------------------------------------------------
// EC-COMP-01: Loading skeleton visible while fetching
// ---------------------------------------------------------------------------

describe('Edge: Loading skeleton', () => {
  test('[P1] loading-skeleton is in the DOM immediately after mount (before data arrives)', () => {
    // GIVEN: Network is slow (not resolved yet)
    // The MSW handler stays pending until resolved
    renderView()

    // WHEN: Component has just mounted (synchronous check, before waitFor)
    // THEN: Loading skeleton is shown
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-02: Case-insensitive search
// ---------------------------------------------------------------------------

describe('Edge: Case-insensitive search', () => {
  test('[P1] typing uppercase query matches lowercase nombre', async () => {
    const user = userEvent.setup()
    renderView()

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    // WHEN: User types uppercase "ACME"
    await user.type(screen.getByTestId('clientes-search-input'), 'ACME')

    // THEN: Acme Corp is still visible
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    // AND: others are hidden
    expect(screen.queryByText('Beta SA')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma Ltda')).not.toBeInTheDocument()
  })

  test('[P1] lowercase query matches uppercase-starting nombre', async () => {
    const user = userEvent.setup()
    renderView()

    await waitFor(() => expect(screen.getByText('Beta SA')).toBeInTheDocument())

    // WHEN: User types lowercase "beta"
    await user.type(screen.getByTestId('clientes-search-input'), 'beta')

    // THEN: Beta SA is visible
    expect(screen.getByText('Beta SA')).toBeInTheDocument()
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-03: Search trims leading/trailing spaces
// ---------------------------------------------------------------------------

describe('Edge: Search trims whitespace', () => {
  test('[P1] query with leading spaces still filters correctly', async () => {
    const user = userEvent.setup()
    renderView()

    await waitFor(() => expect(screen.getByText('Gamma Ltda')).toBeInTheDocument())

    // WHEN: User types "  Gamma" (leading spaces)
    await user.type(screen.getByTestId('clientes-search-input'), '  Gamma')

    // THEN: Gamma Ltda is visible (trim removes leading spaces)
    expect(screen.getByText('Gamma Ltda')).toBeInTheDocument()
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
    expect(screen.queryByText('Beta SA')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-04: Search no-match shows search-specific EmptyState message
// ---------------------------------------------------------------------------

describe('Edge: Search with no results', () => {
  test('[P1] EmptyState is shown when search query has no matches', async () => {
    const user = userEvent.setup()
    renderView()

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    // WHEN: User searches for a term that matches nothing
    await user.type(screen.getByTestId('clientes-search-input'), 'zzznomatchxxx')

    // THEN: EmptyState is shown
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    // AND: All client names are hidden
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument()
    expect(screen.queryByText('Beta SA')).not.toBeInTheDocument()
    expect(screen.queryByText('Gamma Ltda')).not.toBeInTheDocument()
  })

  test('[P2] search EmptyState message mentions search criteria (not create-first-client)', async () => {
    const user = userEvent.setup()
    renderView()

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    await user.type(screen.getByTestId('clientes-search-input'), 'zzznomatch')

    // THEN: The empty state message references search/criteria, not "create first client"
    const emptyState = screen.getByTestId('empty-state')
    expect(emptyState).toBeInTheDocument()
    expect(emptyState.textContent).toMatch(/búsqueda|criterio|encontr/i)
    // NOT the create-first-client message
    expect(emptyState.textContent).not.toMatch(/primer cliente/i)
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-05: Multiple retry clicks do not crash
// ---------------------------------------------------------------------------

describe('Edge: Multiple retry clicks', () => {
  test('[P1] clicking Reintentar multiple times does not throw or render duplicate panels', async () => {
    const user = userEvent.setup()
    let callCount = 0

    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++
        return HttpResponse.json({ error: 'error' }, { status: 500 })
      }),
    )

    renderView()

    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeInTheDocument())

    // WHEN: User clicks Reintentar 3 times rapidly
    const retryButton = screen.getByTestId('retry-button')
    await user.click(retryButton)
    await user.click(retryButton)
    await user.click(retryButton)

    // THEN: Only one ErrorPanel exists (no duplication)
    expect(screen.getAllByTestId('error-panel')).toHaveLength(1)
    // AND: Each click triggered a new fetch attempt
    expect(callCount).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-06: Search input has correct Spanish placeholder
// ---------------------------------------------------------------------------

describe('Edge: Search input placeholder', () => {
  test('[P1] search input placeholder contains "nombre" and "NIT/RUC" in Spanish', async () => {
    renderView()

    // WHEN: Page loads (placeholder is visible without waiting for data)
    const input = screen.getByTestId('clientes-search-input')

    // THEN: Placeholder has Spanish text mentioning nombre and NIT/RUC
    expect(input).toHaveAttribute('placeholder', expect.stringMatching(/nombre/i))
    expect(input).toHaveAttribute('placeholder', expect.stringMatching(/NIT|nit/))
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-07: Search input has aria-label for accessibility
// ---------------------------------------------------------------------------

describe('Edge: Search input aria-label', () => {
  test('[P1] search input has a non-empty aria-label', async () => {
    renderView()

    const input = screen.getByTestId('clientes-search-input')
    const ariaLabel = input.getAttribute('aria-label')

    // THEN: aria-label is present and non-empty
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-08: Empty state from "no data" vs "no search match" are different messages
// ---------------------------------------------------------------------------

describe('Edge: EmptyState message differentiation', () => {
  test('[P2] no-data EmptyState contains "crear" or "primer" (invite to create)', async () => {
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    )

    renderView()

    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument())

    const emptyState = screen.getByTestId('empty-state')
    // Message when no clients exist should mention creating the first client
    expect(emptyState.textContent).toMatch(/crear|primer|registrado/i)
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-09: Each client item has role=listitem
// ---------------------------------------------------------------------------

describe('Edge: Client items have correct ARIA role', () => {
  test('[P1] each rendered client has role=listitem', async () => {
    renderView()

    await waitFor(() => expect(screen.getByText('Acme Corp')).toBeInTheDocument())

    // THEN: All client items are in the DOM as listitems
    const items = screen.getAllByRole('listitem')
    expect(items.length).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-10: Panel has data-testid=clientes-list-panel
// ---------------------------------------------------------------------------

describe('Edge: Panel testid', () => {
  test('[P1] the main panel container has data-testid="clientes-list-panel"', async () => {
    renderView()

    // THEN: The panel container is immediately present (before data loads)
    expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-11: Long nombre/NIT are rendered (no null/undefined displayed)
// ---------------------------------------------------------------------------

describe('Edge: Long field values', () => {
  test('[P2] very long nombre is rendered as text (no crash, no empty display)', async () => {
    const longNombre = 'Empresa Con Un Nombre Muy Largo Que Supera Cincuenta Caracteres SA'
    const longNit = '900000000000-1'

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([makeCliente('long-1', longNombre, longNit)]),
      ),
    )

    renderView()

    await waitFor(() => expect(screen.getByText(longNombre)).toBeInTheDocument())

    // THEN: Both long nombre and long NIT are present in the document
    expect(screen.getByText(longNombre)).toBeInTheDocument()
    expect(screen.getByText(longNit)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// EC-COMP-12: Real-time filtering — intermediate keystrokes filter correctly
// ---------------------------------------------------------------------------

describe('Edge: Real-time filtering per keystroke', () => {
  test('[P1] filter updates on each keystroke progressively narrowing the results', async () => {
    const clientes: Cliente[] = [
      makeCliente('rt-1', 'Proveedor Norte SAS', '111111-1'),
      makeCliente('rt-2', 'Proveedor Norte Oriente SAS', '222222-2'),
      makeCliente('rt-3', 'Distribuidor Sur Ltda', '555555-5'),
    ]

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    )

    const user = userEvent.setup()
    renderView()

    await waitFor(() => expect(screen.getByText('Proveedor Norte SAS')).toBeInTheDocument())

    const input = screen.getByTestId('clientes-search-input')

    // WHEN: User types "Proveedor" — shows both Proveedor clients, hides Distribuidor
    await user.type(input, 'Proveedor')
    await waitFor(() => expect(screen.getByText('Proveedor Norte SAS')).toBeInTheDocument())
    expect(screen.getByText('Proveedor Norte Oriente SAS')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Distribuidor Sur Ltda')).not.toBeInTheDocument())

    // WHEN: User clears and types "Proveedor Norte Oriente" — narrows to just one
    await user.clear(input)
    await user.type(input, 'Proveedor Norte Oriente')
    await waitFor(() => expect(screen.queryByText('Proveedor Norte SAS')).not.toBeInTheDocument())
    expect(screen.getByText('Proveedor Norte Oriente SAS')).toBeInTheDocument()
  })
})
