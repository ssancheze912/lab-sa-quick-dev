/**
 * Story 2.2 — ClienteDetailView edge-case automation expansion.
 *
 * Complements ClienteDetailView.test.tsx with cases the ATDD layer omits:
 *   [P2] Skeleton renders the spec-mandated 4 field-row skeletons (regression guard)
 *   [P2] Spanish characters / diacritics in nombre / ciudad render verbatim
 *   [P2] Switching the clienteId prop refetches and re-renders for the new client
 *   [P2] Non-404 HTTP errors (e.g., 401, 503) fall back to ErrorPanel, NOT ClienteNotFound
 *   [P2] Very long client name still renders (no truncation in the card body)
 *   [P2] Root container is an <article> tag with the cliente-detail-card test id
 *   [P2] aria-labelledby points to an element that EXISTS in the DOM
 *   [P2] All four field labels render in spec-mandated order:
 *        Nombre → NIT/RUC → Teléfono → Ciudad
 */
import { describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactElement } from 'react'

import { server } from '@/mocks/server'
import {
  buildClienteFixture,
  clienteByIdHandler,
} from '@/mocks/handlers/clientes'

// Mock useNavigate to keep the component testable without a real router
const navigateMock = vi.fn()
vi.mock('@tanstack/react-router', async () => {
  const actual =
    await vi.importActual<typeof import('@tanstack/react-router')>(
      '@tanstack/react-router'
    )
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

import { ClienteDetailView } from './ClienteDetailView'

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
    },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('ClienteDetailView — edge cases', () => {
  // ─── [P2] Skeleton field-row count is exactly 4 ──────────────────────
  test('[P2] skeleton renders exactly 4 field-row groups (one per AC #9 field)', async () => {
    const cliente = buildClienteFixture()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, async () => {
        // Hold the response open so the pending state stays observable
        await new Promise<void>(() => {})
        return HttpResponse.json(cliente)
      })
    )

    const { container } = renderWithQueryClient(
      <ClienteDetailView clienteId={cliente.id} />
    )

    const skeleton = await screen.findByTestId('cliente-detail-skeleton')
    expect(skeleton).toBeInTheDocument()
    // 4 nested flex-col groups inside the skeleton container = one per field
    const rowGroups = container.querySelectorAll(
      '[data-testid="cliente-detail-skeleton"] > div.flex.flex-col.gap-1'
    )
    expect(rowGroups).toHaveLength(4)
  })

  // ─── [P2] Spanish diacritics render verbatim ─────────────────────────
  test('[P2] nombre and ciudad with Spanish diacritics render verbatim', async () => {
    const cliente = buildClienteFixture({
      nombre: 'Distribuidora Ñoño & Compañía S.A.S.',
      ciudad: 'Bogotá',
    })
    server.use(...clienteByIdHandler(cliente))

    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    expect(
      await screen.findByText('Distribuidora Ñoño & Compañía S.A.S.')
    ).toBeInTheDocument()
    expect(screen.getByText('Bogotá')).toBeInTheDocument()
  })

  // ─── [P2] Switching the clienteId prop triggers a refetch ────────────
  test('[P2] changing the clienteId prop loads the new client and replaces the card', async () => {
    const first = buildClienteFixture({ nombre: 'First Client' })
    const second = buildClienteFixture({ nombre: 'Second Client' })
    server.use(...clienteByIdHandler(first), ...clienteByIdHandler(second))

    const { rerender } = renderWithQueryClient(
      <ClienteDetailView clienteId={first.id} />
    )
    expect(await screen.findByText('First Client')).toBeInTheDocument()

    // Re-render with the second id — must show the second client, not the first
    rerender(
      <QueryClientProvider
        client={new QueryClient({
          defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
        })}
      >
        <ClienteDetailView clienteId={second.id} />
      </QueryClientProvider>
    )
    expect(await screen.findByText('Second Client')).toBeInTheDocument()
  })

  // ─── [P2] Non-404 HTTP errors → ErrorPanel branch ────────────────────
  test('[P2] 401 Unauthorized falls back to ErrorPanel (not ClienteNotFound)', async () => {
    const id = '44444444-4444-4444-4444-444444444444'
    server.use(
      http.get(`*/api/v1/clientes/${id}`, () =>
        HttpResponse.json({ type: 'about:blank', title: 'Unauthorized', status: 401 }, { status: 401 })
      )
    )

    renderWithQueryClient(<ClienteDetailView clienteId={id} />)

    expect(await screen.findByTestId('error-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })

  // ─── [P2] 503 Service Unavailable → ErrorPanel branch ────────────────
  test('[P2] 503 Service Unavailable falls back to ErrorPanel', async () => {
    const id = '55555555-5555-5555-5555-555555555555'
    server.use(
      http.get(`*/api/v1/clientes/${id}`, () =>
        HttpResponse.json({ type: 'about:blank', title: 'Service Unavailable', status: 503 }, { status: 503 })
      )
    )

    renderWithQueryClient(<ClienteDetailView clienteId={id} />)

    expect(await screen.findByTestId('error-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()
  })

  // ─── [P2] Very long client name still renders ────────────────────────
  test('[P2] very long client name still renders without truncation in the card body', async () => {
    const longName = 'A'.repeat(200) + ' SAS'
    const cliente = buildClienteFixture({ nombre: longName })
    server.use(...clienteByIdHandler(cliente))

    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    // The "Nombre" field in the DescriptionList must render the full string
    expect(await screen.findByText(longName)).toBeInTheDocument()
  })

  // ─── [P2] Root container is an <article> ─────────────────────────────
  test('[P2] success-state root container is an <article> element', async () => {
    const cliente = buildClienteFixture()
    server.use(...clienteByIdHandler(cliente))

    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    const card = await screen.findByTestId('cliente-detail-card')
    expect(card.tagName).toBe('ARTICLE')
  })

  // ─── [P2] aria-labelledby points to a real DOM element ────────────────
  test('[P2] aria-labelledby attribute references an element that exists in the document', async () => {
    const cliente = buildClienteFixture({ nombre: 'Labelled Client' })
    server.use(...clienteByIdHandler(cliente))

    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    const card = await screen.findByTestId('cliente-detail-card')
    const labelledById = card.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()
    expect(document.getElementById(labelledById as string)).not.toBeNull()
  })

  // ─── [P2] Field labels render in spec-mandated order ─────────────────
  test('[P2] DescriptionList renders four labels in order: Nombre, NIT/RUC, Teléfono, Ciudad', async () => {
    const cliente = buildClienteFixture({
      nombre: 'Order Test',
      nitRuc: '900000001',
      telefono: '3001111111',
      ciudad: 'Cali',
    })
    server.use(...clienteByIdHandler(cliente))

    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    const list = await screen.findByTestId('cliente-detail-description-list')
    // Use innerText/textContent order to verify the spec order
    const text = list.textContent ?? ''
    const idxNombre = text.indexOf('Nombre')
    const idxNitRuc = text.indexOf('NIT/RUC')
    const idxTelefono = text.indexOf('Teléfono')
    const idxCiudad = text.indexOf('Ciudad')
    expect(idxNombre).toBeGreaterThanOrEqual(0)
    expect(idxNitRuc).toBeGreaterThan(idxNombre)
    expect(idxTelefono).toBeGreaterThan(idxNitRuc)
    expect(idxCiudad).toBeGreaterThan(idxTelefono)
  })

  // ─── [P2] Heading element is an <h2> ─────────────────────────────────
  test('[P2] heading element is an <h2> tag for AC #9 / WCAG 2.1 AA', async () => {
    const cliente = buildClienteFixture({ nombre: 'H2 Test' })
    server.use(...clienteByIdHandler(cliente))

    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    const card = await screen.findByTestId('cliente-detail-card')
    const labelledById = card.getAttribute('aria-labelledby')
    const heading = document.getElementById(labelledById as string)
    expect(heading?.tagName).toBe('H2')
  })

  // ─── [P2] No leakage of the clienteId in the rendered card ────────────
  test('[P2] success card does NOT render the clienteId UUID as visible text (NFR6 follow-up)', async () => {
    const cliente = buildClienteFixture({ nombre: 'NoLeak Client' })
    server.use(...clienteByIdHandler(cliente))

    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    const card = await screen.findByTestId('cliente-detail-card')
    // The id is the route param; it MUST NOT appear in user-visible text.
    expect(card.textContent ?? '').not.toContain(cliente.id)
  })

  // ─── [P2] Skeleton has the spec-mandated 4 fields + a header skeleton ─
  test('[P2] skeleton container exposes role=status AND aria-busy=true together', async () => {
    const cliente = buildClienteFixture()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, async () => {
        await new Promise<void>(() => {})
        return HttpResponse.json(cliente)
      })
    )

    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)
    const skeleton = await screen.findByTestId('cliente-detail-skeleton')
    expect(skeleton.getAttribute('role')).toBe('status')
    expect(skeleton.getAttribute('aria-busy')).toBe('true')
  })

  // ─── [P2] Spinners are NOT used in the pending state (company UX rule) ─
  test('[P2] pending state does NOT render any spinner element', async () => {
    const cliente = buildClienteFixture()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, async () => {
        await new Promise<void>(() => {})
        return HttpResponse.json(cliente)
      })
    )

    const { container } = renderWithQueryClient(
      <ClienteDetailView clienteId={cliente.id} />
    )
    await screen.findByTestId('cliente-detail-skeleton')
    // No element with the typical spinner role or class names
    expect(container.querySelector('[role="progressbar"]')).toBeNull()
    expect(container.querySelector('.spinner')).toBeNull()
    expect(container.querySelector('.animate-spin')).toBeNull()
  })

  // ─── [P2] Pending state is replaced by the detail card on resolution ──
  test('[P2] skeleton disappears when the GET resolves to 200', async () => {
    const cliente = buildClienteFixture({ nombre: 'Settled Client' })
    server.use(...clienteByIdHandler(cliente))

    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    expect(await screen.findByText('Settled Client')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.queryByTestId('cliente-detail-skeleton')
      ).not.toBeInTheDocument()
    })
  })
})
