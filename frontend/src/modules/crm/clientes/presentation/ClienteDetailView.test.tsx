/**
 * Story 2.2 — Client Detail View — ClienteDetailView ATDD (RED phase).
 *
 * Acceptance Criteria covered:
 *   AC #5 — Detail loads via TanStack Query with queryKey ['clientes', id]
 *   AC #6 — 404 path renders ClienteNotFound (graceful), NO console error,
 *           NO leakage of internal detail (NFR6)
 *   AC #7 — Skeleton during pending state (role=status, aria-busy, aria-label)
 *   AC #8 — 500/network failure path renders ErrorPanel with onRetry=refetch
 *   AC #9 — DescriptionList with 4 pairs in order: Nombre, NIT/RUC, Teléfono, Ciudad
 *           and an <h2> aria-labelledby pointing to the client name
 *
 * Aligned test cases (test-design-epic-2.md):
 *   TC-E2-P1-01 (UI component leg) — Deep link to client detail
 *   R7  — Deep link to non-existent id graceful not-found
 *   R8  — Refetch on transient error
 *   NFR6 leakage scan — DOM substring check
 *
 * MUST fail until ClienteDetailView, useCliente, ClienteNotFound,
 * ClienteNotFoundError and the MSW per-id handlers exist.
 */
import { describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse, delay } from 'msw'
import type { ReactElement } from 'react'

import { server } from '@/mocks/server'
import {
  buildClienteFixture,
  clienteByIdHandler,
  clienteByIdNotFoundHandler,
  clienteByIdServerErrorHandler,
} from '@/mocks/handlers/clientes'

// Mock @tanstack/react-router useNavigate before importing the component under test.
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

describe('ClienteDetailView — Story 2.2 ATDD', () => {
  // ─── AC #7 — skeleton during pending ─────────────────────────────────
  test('AC #7 — renders skeleton with role=status / aria-busy / aria-label while pending', async () => {
    // GIVEN: a slow per-id GET so the pending state is observable
    const cliente = buildClienteFixture()
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, async () => {
        await delay(800)
        return HttpResponse.json(cliente)
      })
    )

    // WHEN: ClienteDetailView mounts with that id
    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: skeleton container exposes the spec-mandated a11y attributes
    const skeleton = await screen.findByTestId('cliente-detail-skeleton')
    expect(skeleton).toHaveAttribute('role', 'status')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
    expect(skeleton).toHaveAttribute('aria-label', 'Cargando cliente')
  })

  // ─── AC #5 / AC #9 — success render with 4 DescriptionList pairs ─────
  test('AC #5 / AC #9 — on 200, renders the detail card with Nombre, NIT/RUC, Teléfono, Ciudad', async () => {
    // GIVEN: the per-id endpoint returns a known client
    const cliente = buildClienteFixture({
      nombre: 'ACME Detail SAS',
      nitRuc: '900111222',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    })
    server.use(...clienteByIdHandler(cliente))

    // WHEN: ClienteDetailView mounts
    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: the card is rendered with the 4 expected labels and values
    expect(await screen.findByTestId('cliente-detail-card')).toBeInTheDocument()
    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByText('NIT/RUC')).toBeInTheDocument()
    expect(screen.getByText('Teléfono')).toBeInTheDocument()
    expect(screen.getByText('Ciudad')).toBeInTheDocument()
    expect(screen.getByText('ACME Detail SAS')).toBeInTheDocument()
    expect(screen.getByText('900111222')).toBeInTheDocument()
    expect(screen.getByText('3001234567')).toBeInTheDocument()
    expect(screen.getByText('Bogotá')).toBeInTheDocument()
  })

  // ─── AC #9 — heading is the client name, aria-labelledby points to it ─
  test('AC #9 — the detail card aria-labelledby points to an <h2> rendering the client name', async () => {
    // GIVEN: the per-id endpoint returns a client with a known nombre
    const cliente = buildClienteFixture({ nombre: 'Heading Client Ltda' })
    server.use(...clienteByIdHandler(cliente))

    // WHEN: ClienteDetailView mounts
    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)

    // THEN: the card has aria-labelledby and the referenced element is the <h2> with the nombre
    const card = await screen.findByTestId('cliente-detail-card')
    const labelledById = card.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()
    const heading = document.getElementById(labelledById as string)
    expect(heading).not.toBeNull()
    expect(heading?.tagName).toBe('H2')
    expect(heading?.textContent).toContain('Heading Client Ltda')
  })

  // ─── AC #6 / R7 — 404 → ClienteNotFound (no console error) ──────────
  test('AC #6 / R7 — on 404, renders ClienteNotFound with exact Spanish copy and no console.error', async () => {
    // GIVEN: the per-id endpoint returns 404 Problem Details
    const id = '00000000-0000-0000-0000-000000000000'
    server.use(...clienteByIdNotFoundHandler(id))

    // Capture console.error — there MUST be none
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // WHEN: ClienteDetailView mounts with the missing id
    renderWithQueryClient(<ClienteDetailView clienteId={id} />)

    // THEN: ClienteNotFound renders with exact Spanish copy
    const notFound = await screen.findByTestId('cliente-not-found')
    expect(notFound).toBeInTheDocument()
    expect(screen.getByText('Cliente no encontrado')).toBeInTheDocument()
    expect(
      screen.getByText('El cliente que buscas no existe o fue eliminado')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Volver a la lista' })
    ).toBeInTheDocument()

    // AND: ErrorPanel is NOT rendered (404 is the controlled branch)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()

    // AND: no console.error was emitted (NFR6 contract)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  // ─── AC #6 / NFR6 — DOM does NOT leak status code, URL, or Problem Details ─
  test('AC #6 / NFR6 — not-found DOM does NOT contain "404", "about:blank", or "section-6.5.4"', async () => {
    // GIVEN: per-id endpoint returns the standard 404 Problem Details
    const id = '11111111-1111-1111-1111-111111111111'
    server.use(...clienteByIdNotFoundHandler(id))

    // WHEN: ClienteDetailView mounts
    const { container } = renderWithQueryClient(
      <ClienteDetailView clienteId={id} />
    )
    await screen.findByTestId('cliente-not-found')

    // THEN: the rendered HTML does NOT leak technical detail
    const html = container.innerHTML
    expect(html).not.toContain('404')
    expect(html).not.toContain('about:blank')
    expect(html).not.toContain('section-6.5.4')
  })

  // ─── AC #6 — "Volver a la lista" navigates back to /clientes ──────────
  test('AC #6 — clicking "Volver a la lista" calls navigate({ to: "/clientes" })', async () => {
    // GIVEN: per-id endpoint returns 404
    const id = '22222222-2222-2222-2222-222222222222'
    server.use(...clienteByIdNotFoundHandler(id))
    const user = userEvent.setup()
    navigateMock.mockClear()

    // WHEN: ClienteDetailView mounts and user clicks the CTA
    renderWithQueryClient(<ClienteDetailView clienteId={id} />)
    await screen.findByTestId('cliente-not-found')
    await user.click(screen.getByRole('button', { name: 'Volver a la lista' }))

    // THEN: navigate was called with the /clientes target
    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/clientes' })
    )
  })

  // ─── AC #8 / R8 — 500 → ErrorPanel → Reintentar refetches ─────────────
  test('AC #8 / R8 — on 500, renders ErrorPanel; Reintentar refetches and shows the detail card', async () => {
    // GIVEN: first 3 calls return 500 (the hook auto-retries twice, so the
    // ErrorPanel only surfaces after the full retry budget is exhausted);
    // subsequent calls return the client to verify the manual Reintentar leg.
    const cliente = buildClienteFixture({ nombre: 'Recovered Detail' })
    let calls = 0
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () => {
        calls += 1
        if (calls <= 3) {
          return HttpResponse.json(
            { type: 'about:blank', title: 'Server Error', status: 500 },
            { status: 500 }
          )
        }
        return HttpResponse.json(cliente)
      })
    )
    const user = userEvent.setup()

    // WHEN: mounts → ErrorPanel renders → user clicks Reintentar
    renderWithQueryClient(<ClienteDetailView clienteId={cliente.id} />)
    expect(await screen.findByTestId('error-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    // THEN: detail card renders, ErrorPanel disappears
    expect(await screen.findByText('Recovered Detail')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument()
    })
  })

  // ─── NFR6 — ErrorPanel does NOT leak technical detail ─────────────────
  test('NFR6 — ErrorPanel rendered on 500 does NOT leak status code, URL, or Problem Details strings', async () => {
    // GIVEN: per-id endpoint returns 500 with a Problem Details body
    const id = '33333333-3333-3333-3333-333333333333'
    server.use(...clienteByIdServerErrorHandler(id))

    // WHEN: ClienteDetailView mounts
    renderWithQueryClient(<ClienteDetailView clienteId={id} />)
    const panel = await screen.findByTestId('error-panel')

    // THEN: no status code, no URL, no problem-details type/instance leaks
    const text = panel.textContent ?? ''
    expect(text).not.toMatch(/500|404|about:blank|http|api\/v1/i)
  })
})
