/**
 * Story 2.2: Client Detail View — ClienteDetailView Component Edge Case Tests
 *
 * Expands coverage beyond ATDD tests (ClienteDetailView.test.tsx).
 * Covers:
 *   - Empty string clienteId treated as no-selection (placeholder shown)
 *   - Error state (isError=true from 500) shows not-found message gracefully
 *   - data-testid "cliente-detail-view" is NOT present in placeholder state
 *   - data-testid "cliente-detail-view" is NOT present in not-found state
 *   - data-testid "cliente-detail-skeleton" is NOT present in detail state
 *   - data-testid "cliente-detail-skeleton" is NOT present in placeholder state
 *   - ARIA article element NOT present in placeholder state
 *   - ARIA article element NOT present in not-found state
 *   - Detail view renders dl/dt/dd semantic structure
 *   - Switching from null to valid id shows detail
 *   - Switching from valid id to null shows placeholder
 *
 * Does NOT duplicate coverage from ClienteDetailView.test.tsx.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ClienteDetailView } from '../ClienteDetailView'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000'
const CLIENT_ID = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

const mockCliente = createCliente({
  id: CLIENT_ID,
  nombre: 'Empresa Edge Test',
  nit: '900888001-1',
  telefono: '601 888 0001',
  ciudad: 'Cali',
})

const server = setupServer(
  http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
    HttpResponse.json(mockCliente)
  )
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetClienteFactory()
})
afterAll(() => server.close())

// ─── Render Helper ─────────────────────────────────────────────────────────────

function renderComponent(clienteId: string | null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>
  )
}

// ─── Empty string clienteId treated as no-selection ─────────────────────────

describe('ClienteDetailView — empty string clienteId', () => {
  it('[P2] should show placeholder when clienteId is an empty string (falsy)', () => {
    // GIVEN: clienteId is an empty string (falsy in JS)
    renderComponent('')

    // THEN: placeholder is shown (empty string treated like null)
    expect(
      screen.getByText('Selecciona un cliente para ver sus detalles.')
    ).toBeInTheDocument()
  })

  it('[P2] should NOT render cliente-detail-view when clienteId is empty string', () => {
    // GIVEN: empty string clienteId
    renderComponent('')

    // THEN: detail view element is not present
    expect(screen.queryByTestId('cliente-detail-view')).not.toBeInTheDocument()
  })
})

// ─── Error state (500) — graceful fallback ────────────────────────────────────

describe('ClienteDetailView — 500 API error graceful fallback', () => {
  it('[P1] should show not-found message when API returns 500 (graceful fallback)', async () => {
    // GIVEN: the API returns 500
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    )

    // WHEN: component renders with a valid clienteId
    renderComponent(CLIENT_ID)

    // THEN: "Cliente no encontrado." is shown (not-found fallback per story spec)
    await waitFor(() => {
      expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument()
    })
  })

  it('[P1] should NOT crash when API returns 500 (no thrown exception)', async () => {
    // GIVEN: the API returns 500
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 })
      )
    )

    // THEN: rendering does not throw
    expect(() => renderComponent(CLIENT_ID)).not.toThrow()

    // AND: component eventually shows something (not blank)
    await waitFor(() => {
      expect(document.body.textContent).not.toBe('')
    })
  })
})

// ─── cliente-detail-view testid absent in non-detail states ──────────────────

describe('ClienteDetailView — data-testid absence in non-detail states', () => {
  it('[P1] cliente-detail-view should NOT be present when clienteId is null', () => {
    // GIVEN: no client selected
    renderComponent(null)

    // THEN: detail container is not rendered
    expect(screen.queryByTestId('cliente-detail-view')).not.toBeInTheDocument()
  })

  it('[P1] cliente-detail-view should NOT be present when API returns 404', async () => {
    // GIVEN: API returns 404
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
        HttpResponse.json({ title: 'Not found', status: 404 }, { status: 404 })
      )
    )

    renderComponent(CLIENT_ID)

    // THEN: detail container is NOT present after load
    await waitFor(() => {
      expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('cliente-detail-view')).not.toBeInTheDocument()
  })
})

// ─── cliente-detail-skeleton absent in non-loading states ────────────────────

describe('ClienteDetailView — skeleton absent in non-loading states', () => {
  it('[P1] skeleton should NOT be present when clienteId is null (placeholder state)', () => {
    // GIVEN: no client selected
    renderComponent(null)

    // THEN: skeleton is not rendered
    expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
  })

  it('[P2] skeleton should NOT be present after data loads successfully', async () => {
    // GIVEN: data loads successfully
    renderComponent(CLIENT_ID)

    // WHEN: data has finished loading
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })

    // THEN: skeleton is no longer present
    expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument()
  })
})

// ─── ARIA article element — state-based presence ──────────────────────────────

describe('ClienteDetailView — ARIA article element presence', () => {
  it('[P2] article element should NOT be present in placeholder state (clienteId null)', () => {
    // GIVEN: no client selected
    renderComponent(null)

    // THEN: no article element (only shown when client data is present)
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('[P2] article element should NOT be present in not-found state', async () => {
    // GIVEN: API returns 404
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
        HttpResponse.json({ title: 'Not found', status: 404 }, { status: 404 })
      )
    )

    renderComponent(CLIENT_ID)

    await waitFor(() => {
      expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument()
    })

    // THEN: no article element in not-found state
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('[P1] article element SHOULD be present when client data is loaded', async () => {
    // GIVEN: data loads successfully
    renderComponent(CLIENT_ID)

    // WHEN: data is loaded
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })

    // THEN: article element is present with correct aria-label
    const article = screen.getByRole('article')
    expect(article).toBeInTheDocument()
    expect(article).toHaveAttribute('aria-label', expect.stringContaining('Empresa Edge Test'))
  })
})

// ─── DL/DT/DD semantic structure ─────────────────────────────────────────────

describe('ClienteDetailView — dl/dt/dd semantic HTML structure', () => {
  it('[P2] detail view should use dl element as the container for field groups', async () => {
    // GIVEN: data loads successfully
    renderComponent(CLIENT_ID)

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })

    // THEN: a dl (description list) element is present
    const dl = document.querySelector('dl')
    expect(dl).not.toBeNull()
  })

  it('[P2] field labels should be rendered as dt elements', async () => {
    // GIVEN: data loads
    renderComponent(CLIENT_ID)

    await waitFor(() => {
      expect(screen.getByText('Nombre')).toBeInTheDocument()
    })

    // THEN: each label is a dt element
    const dtElements = document.querySelectorAll('dt')
    const dtTexts = Array.from(dtElements).map((dt) => dt.textContent?.trim())
    expect(dtTexts).toContain('Nombre')
    expect(dtTexts).toContain('NIT/RUC')
    expect(dtTexts).toContain('Teléfono')
    expect(dtTexts).toContain('Ciudad')
  })

  it('[P2] field values should be rendered as dd elements', async () => {
    // GIVEN: data loads
    renderComponent(CLIENT_ID)

    await waitFor(() => {
      expect(screen.getByText('Empresa Edge Test')).toBeInTheDocument()
    })

    // THEN: values are inside dd elements
    const ddElements = document.querySelectorAll('dd')
    const ddTexts = Array.from(ddElements).map((dd) => dd.textContent?.trim())
    expect(ddTexts).toContain('Empresa Edge Test')
    expect(ddTexts).toContain('900888001-1')
    expect(ddTexts).toContain('601 888 0001')
    expect(ddTexts).toContain('Cali')
  })
})

// ─── Transition from null to valid id ────────────────────────────────────────

describe('ClienteDetailView — clienteId prop transitions', () => {
  it('[P1] should show detail when clienteId transitions from null to a valid UUID', async () => {
    // GIVEN: component starts with null clienteId
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    })

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={null} />
      </QueryClientProvider>
    )

    expect(
      screen.getByText('Selecciona un cliente para ver sus detalles.')
    ).toBeInTheDocument()

    // WHEN: clienteId changes to a valid UUID
    rerender(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={CLIENT_ID} />
      </QueryClientProvider>
    )

    // THEN: detail view is shown with client data
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })

    expect(screen.getByText('Empresa Edge Test')).toBeInTheDocument()
  })

  it('[P1] should show placeholder when clienteId transitions from valid UUID back to null', async () => {
    // GIVEN: component starts with a valid clienteId and data loaded
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    })

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={CLIENT_ID} />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-view')).toBeInTheDocument()
    })

    // WHEN: clienteId changes back to null (user navigates to /clientes base route)
    rerender(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={null} />
      </QueryClientProvider>
    )

    // THEN: placeholder is shown
    expect(
      screen.getByText('Selecciona un cliente para ver sus detalles.')
    ).toBeInTheDocument()

    // AND: detail view is not shown
    expect(screen.queryByTestId('cliente-detail-view')).not.toBeInTheDocument()
  })
})

// ─── Not-found state has role="status" ───────────────────────────────────────

describe('ClienteDetailView — not-found role="status" accessibility', () => {
  it('[P1] not-found message element should have role="status" (WCAG accessible announcement)', async () => {
    // GIVEN: API returns 404
    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${CLIENT_ID}`, () =>
        HttpResponse.json({ title: 'Not found', status: 404 }, { status: 404 })
      )
    )

    renderComponent(CLIENT_ID)

    // THEN: status role element with not-found text is present
    await waitFor(() => {
      const statusEl = screen.getByRole('status')
      expect(statusEl).toBeInTheDocument()
      expect(statusEl).toHaveTextContent('Cliente no encontrado.')
    })
  })
})
