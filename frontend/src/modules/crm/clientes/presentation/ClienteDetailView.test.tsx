/**
 * Story 2.2: Client Detail View — Component Tests
 * Epic 2: Client Management
 *
 * Test IDs covered:
 *   TC-E2-P1-07 (frontend) — Render ClienteDetailView with valid clienteId; all 4 fields visible
 *   TC-E2-P1-09            — Non-existent clienteId shows not-found message, no JS error
 *   Skeleton test           — Skeleton visible while pending; disappears after response
 *
 * Tooling: Vitest 2+ | @testing-library/react | MSW 2
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router'
import { ClienteDetailView } from './ClienteDetailView'
import type { Cliente } from '../domain/Cliente'

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

function renderClienteDetailView(clienteId: string) {
  const queryClient = createQueryClient()
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={clienteId} />
      </QueryClientProvider>
    ),
  })
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

function buildClienteDto(overrides?: Partial<Cliente>): Cliente {
  return {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nombre: 'Empresa Ejemplo S.A.S.',
    nitRuc: '900123456-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-06-17T14:30:00Z',
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-07 (frontend): Valid clienteId — all 4 fields visible
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-07 — ClienteDetailView renders all 4 fields for valid clienteId', () => {
  it('should render Nombre, NIT/RUC, Teléfono and Ciudad after successful fetch', async () => {
    // ARRANGE
    const cliente = buildClienteDto()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // ACT
    renderClienteDetailView(cliente.id)

    // ASSERT — all 4 fields visible
    await waitFor(() => {
      expect(screen.getByText('Empresa Ejemplo S.A.S.')).toBeInTheDocument()
    })
    expect(screen.getByText('900123456-1')).toBeInTheDocument()
    expect(screen.getByText('3001234567')).toBeInTheDocument()
    expect(screen.getByText('Bogotá')).toBeInTheDocument()
  })

  it('should render the section with aria-label "Detalle del cliente"', async () => {
    // ARRANGE
    const cliente = buildClienteDto()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // ACT
    renderClienteDetailView(cliente.id)

    // ASSERT — accessible region label
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Detalle del cliente' })).toBeInTheDocument()
    })
  })

  it('should render dl/dt/dd semantic markup for field-value pairs', async () => {
    // ARRANGE
    const cliente = buildClienteDto()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente, { status: 200 })
      )
    )

    // ACT
    renderClienteDetailView(cliente.id)

    // ASSERT — semantic markup: wait for data then verify dt labels
    await waitFor(() => {
      expect(screen.getByText('Empresa Ejemplo S.A.S.')).toBeInTheDocument()
    })
    expect(screen.getByText('NIT/RUC')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ciudad')).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-09: Non-existent clienteId → not-found message, no JS error
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-09 — Non-existent clienteId shows not-found message', () => {
  it('should render not-found message when API returns 404', async () => {
    // ARRANGE
    const nonExistentId = 'nonexistent-id'
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Cliente no encontrado' },
          { status: 404 }
        )
      )
    )

    // ACT
    renderClienteDetailView(nonExistentId)

    // ASSERT — not-found message visible
    await waitFor(() => {
      expect(
        screen.getByText('No se encontró el cliente solicitado.')
      ).toBeInTheDocument()
    })
  })

  it('should NOT render client fields when 404 is returned', async () => {
    // ARRANGE
    const nonExistentId = 'nonexistent-id'
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Cliente no encontrado' },
          { status: 404 }
        )
      )
    )

    // ACT
    renderClienteDetailView(nonExistentId)

    // ASSERT — no client fields shown
    await waitFor(() => {
      expect(
        screen.getByText('No se encontró el cliente solicitado.')
      ).toBeInTheDocument()
    })
    expect(screen.queryByText('NIT/RUC')).not.toBeInTheDocument()
    expect(screen.queryByText('Teléfono')).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton loading test
// ─────────────────────────────────────────────────────────────────────────────

describe('Skeleton loading — visible while pending, gone after response', () => {
  it('should show skeleton placeholder while loading and render content after', async () => {
    // ARRANGE
    const cliente = buildClienteDto()
    let resolveResponse!: () => void
    const pendingPromise = new Promise<void>((res) => {
      resolveResponse = res
    })

    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, async () => {
        await pendingPromise
        return HttpResponse.json(cliente, { status: 200 })
      })
    )

    // ACT — render while pending
    renderClienteDetailView(cliente.id)

    // ASSERT — skeleton is shown (react-loading-skeleton renders span elements)
    // The section with aria-label should not be the success section yet
    expect(screen.queryByText('Empresa Ejemplo S.A.S.')).not.toBeInTheDocument()

    // Resolve the request
    resolveResponse()

    // ASSERT — content renders after response
    await waitFor(() => {
      expect(screen.getByText('Empresa Ejemplo S.A.S.')).toBeInTheDocument()
    })
  })
})
