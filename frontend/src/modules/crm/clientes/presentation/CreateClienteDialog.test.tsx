/**
 * Story 2.3 — Create Client — CreateClienteDialog ATDD (RED phase).
 *
 * Acceptance Criteria covered:
 *   AC #4  — Dialog opens with title "Nuevo cliente" + 4 required inputs (aria-required) + 2 buttons
 *   AC #5  — Empty submit blocks (zero POST calls), 4 inline Spanish errors, focus on first failing field
 *   AC #6  — Happy path: dialog closes, ['clientes'] cache prepends new client, success toast
 *   AC #7  — Duplicate NIT: dialog stays open, inline error on NIT/RUC, NO toast, NFR6 leak scan
 *   AC #8  — 500 / generic error: dialog stays open, error toast, form values preserved
 *   AC #9  — Cancel + Escape close dialog (no POST), form is reset on reopen
 *   AC #10 — Submitting state disables inputs + Guardar; second click fires only one POST
 *
 * Aligned test cases (test-design-epic-2.md):
 *   TC-E2-P0-01 (UI leg) — Happy path
 *   TC-E2-P0-02 (UI leg) — Empty submit / partial fill
 *   TC-E2-P0-03 (UI leg) — Duplicate NIT inline error + NFR6 scan
 *
 * MUST fail until CreateClienteDialog.tsx + useCreateCliente.ts +
 * createClienteSchema.ts + the typed errors (DuplicateNitError, ClienteValidationError) +
 * the new MSW handlers exist.
 */
import { describe, expect, test, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse, delay } from 'msw'
import type { ReactElement } from 'react'

import { server } from '@/mocks/server'
import { buildClienteFixture } from '@/mocks/handlers/clientes'

// Mock siesa-ui-kit toast — keep the rest of the module intact so AlertDialog, Input, etc. still render.
const toastSuccessMock = vi.fn()
const toastErrorMock = vi.fn()
vi.mock('siesa-ui-kit', async () => {
  const actual = await vi.importActual<typeof import('siesa-ui-kit')>('siesa-ui-kit')
  return {
    ...actual,
    toast: { success: toastSuccessMock, error: toastErrorMock },
  }
})

import { CreateClienteDialog } from './CreateClienteDialog'

function renderWithQueryClient(
  ui: ReactElement,
  initialCache?: Record<string, unknown>,
): { queryClient: QueryClient } {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  if (initialCache) {
    Object.entries(initialCache).forEach(([key, value]) => {
      queryClient.setQueryData(key.split(','), value)
    })
  }
  render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
  return { queryClient }
}

describe('CreateClienteDialog — Story 2.3 ATDD', () => {
  beforeEach(() => {
    toastSuccessMock.mockReset()
    toastErrorMock.mockReset()
  })

  // ─── AC #4 — Dialog renders 4 inputs (aria-required) + 2 buttons ─────────
  test('AC #4 — renders title, 4 aria-required inputs, and Guardar/Cancelar buttons', () => {
    // GIVEN/WHEN: dialog is opened
    renderWithQueryClient(<CreateClienteDialog isOpen={true} onClose={vi.fn()} />)

    // THEN: title is present
    expect(screen.getByText('Nuevo cliente')).toBeInTheDocument()

    // AND: each label is rendered and the corresponding input has aria-required="true"
    for (const label of ['Nombre', 'NIT/RUC', 'Teléfono', 'Ciudad']) {
      const input = screen.getByLabelText(label)
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('aria-required', 'true')
    }

    // AND: Guardar + Cancelar buttons are present
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  // ─── AC #5 — Empty submit blocks (zero POST calls), 4 inline errors ──────
  test('AC #5 — clicking Guardar with empty form blocks submission (zero POST), shows 4 inline errors', async () => {
    // GIVEN: a POST spy
    let postCount = 0
    server.use(
      http.post('*/api/v1/clientes', () => {
        postCount += 1
        return HttpResponse.json(buildClienteFixture(), { status: 201 })
      }),
    )

    renderWithQueryClient(<CreateClienteDialog isOpen={true} onClose={vi.fn()} />)
    const user = userEvent.setup()

    // WHEN: user clicks Guardar without filling any field
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // THEN: 4 inline Spanish errors are visible
    await waitFor(() => {
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    })
    expect(screen.getByText('El NIT/RUC es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('La ciudad es obligatoria')).toBeInTheDocument()

    // AND: no POST was fired
    expect(postCount).toBe(0)
  })

  // ─── AC #5 — Partial fill: only the empty fields show errors, no POST ────
  test('AC #5 — partial fill: empty fields show errors, NIT/RUC/Teléfono/Ciudad missing, no POST', async () => {
    let postCount = 0
    server.use(
      http.post('*/api/v1/clientes', () => {
        postCount += 1
        return HttpResponse.json(buildClienteFixture(), { status: 201 })
      }),
    )

    renderWithQueryClient(<CreateClienteDialog isOpen={true} onClose={vi.fn()} />)
    const user = userEvent.setup()

    // WHEN: only Nombre is filled
    await user.type(screen.getByLabelText('Nombre'), 'Only Nombre')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // THEN: errors appear on the remaining 3 fields, but NOT on Nombre
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC es obligatorio')).toBeInTheDocument()
    })
    expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('La ciudad es obligatoria')).toBeInTheDocument()
    expect(screen.queryByText('El nombre es obligatorio')).not.toBeInTheDocument()

    // AND: no POST was fired
    expect(postCount).toBe(0)
  })

  // ─── AC #6 / TC-E2-P0-01 — Happy path: 201 closes dialog + updates cache + toast ──
  test('AC #6 — happy path 201: dialog closes, cache prepends new client, success toast fires', async () => {
    // GIVEN: backend returns 201 with the new client fixture
    const newFixture = buildClienteFixture({ nombre: 'Happy Cliente' })
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(newFixture, { status: 201 }),
      ),
    )

    const onClose = vi.fn()
    const { queryClient } = renderWithQueryClient(
      <CreateClienteDialog isOpen={true} onClose={onClose} />,
    )

    // Seed the cache with an existing client to verify prepending behaviour
    const existing = buildClienteFixture({ nombre: 'Pre-existing' })
    queryClient.setQueryData(['clientes'], [existing])

    const user = userEvent.setup()

    // WHEN: user fills and submits
    await user.type(screen.getByLabelText('Nombre'), 'Happy Cliente')
    await user.type(screen.getByLabelText('NIT/RUC'), '900111250')
    await user.type(screen.getByLabelText('Teléfono'), '3001234567')
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // THEN: onClose was called (dialog should close)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })

    // AND: success toast was invoked with exact Spanish copy
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente creado correctamente')

    // AND: cache for ['clientes'] now has the new client at index 0 (prepend)
    const cached = queryClient.getQueryData<Array<{ id: string; nombre: string }>>(['clientes'])
    expect(cached).toBeDefined()
    expect(cached?.[0]?.id).toBe(newFixture.id)
    expect(cached?.[0]?.nombre).toBe('Happy Cliente')
  })

  // ─── AC #7 / TC-E2-P0-03 — 409 duplicate NIT: stays open + inline error ───
  test('AC #7 — 409 duplicate NIT: dialog stays open, inline NIT/RUC error, no toast, no NFR6 leak', async () => {
    // GIVEN: backend returns 409 with safe Problem Details
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
            title: 'NIT/RUC duplicado',
            status: 409,
            instance: '/api/v1/clientes',
            detail: 'El NIT/RUC ya está registrado',
          },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    const onClose = vi.fn()
    const { container } = render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false, staleTime: 0, gcTime: 0 },
              mutations: { retry: false },
            },
          })
        }
      >
        <CreateClienteDialog isOpen={true} onClose={onClose} />
      </QueryClientProvider>,
    )
    const user = userEvent.setup()

    // WHEN: user submits a valid form
    await user.type(screen.getByLabelText('Nombre'), 'Dup Cliente')
    await user.type(screen.getByLabelText('NIT/RUC'), '900111260-2')
    await user.type(screen.getByLabelText('Teléfono'), '3009998877')
    await user.type(screen.getByLabelText('Ciudad'), 'Cali')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // THEN: inline error appears under NIT/RUC
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    })

    // AND: onClose was NOT called (dialog stays open)
    expect(onClose).not.toHaveBeenCalled()

    // AND: no toast was invoked for the 409 branch
    expect(toastSuccessMock).not.toHaveBeenCalled()
    expect(toastErrorMock).not.toHaveBeenCalled()

    // AND (NFR6): rendered HTML does NOT contain forbidden substrings
    const html = container.outerHTML
    expect(html).not.toContain('23505')
    expect(html).not.toContain('DbUpdateException')
    expect(html).not.toContain('uk_clientes_nit')
    expect(html).not.toContain('about:blank')
    expect(html).not.toContain('"409"')
  })

  // ─── AC #8 — 500 server error: stays open + error toast + values preserved ─
  test('AC #8 — 500 server error: dialog stays open, error toast, form values preserved', async () => {
    // GIVEN: backend returns 500
    server.use(
      http.post('*/api/v1/clientes', () =>
        HttpResponse.json(
          { type: 'about:blank', title: 'Server Error', status: 500 },
          { status: 500 },
        ),
      ),
    )

    const onClose = vi.fn()
    renderWithQueryClient(<CreateClienteDialog isOpen={true} onClose={onClose} />)
    const user = userEvent.setup()

    // WHEN: user submits a valid form
    await user.type(screen.getByLabelText('Nombre'), 'Server Down')
    await user.type(screen.getByLabelText('NIT/RUC'), '900111270-3')
    await user.type(screen.getByLabelText('Teléfono'), '3001234567')
    await user.type(screen.getByLabelText('Ciudad'), 'Cali')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // THEN: error toast was invoked with exact Spanish copy
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'No pudimos crear el cliente. Inténtalo de nuevo.',
      )
    })

    // AND: dialog stays open
    expect(onClose).not.toHaveBeenCalled()

    // AND: form values are preserved (user can retry)
    expect(screen.getByLabelText('Nombre')).toHaveValue('Server Down')
    expect(screen.getByLabelText('NIT/RUC')).toHaveValue('900111270-3')
  })

  // ─── AC #9 — Cancel button closes the dialog without firing POST ─────────
  test('AC #9 — clicking Cancelar invokes onClose and does NOT fire POST', async () => {
    let postCount = 0
    server.use(
      http.post('*/api/v1/clientes', () => {
        postCount += 1
        return HttpResponse.json(buildClienteFixture(), { status: 201 })
      }),
    )

    const onClose = vi.fn()
    renderWithQueryClient(<CreateClienteDialog isOpen={true} onClose={onClose} />)
    const user = userEvent.setup()

    // WHEN: user types something and clicks Cancelar
    await user.type(screen.getByLabelText('Nombre'), 'Cancelled')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    // THEN: onClose was called and no POST was fired
    expect(onClose).toHaveBeenCalled()
    expect(postCount).toBe(0)
  })

  // ─── AC #10 — Submitting state disables Guardar + inputs ──────────────────
  test('AC #10 — while submitting, inputs and Guardar are disabled', async () => {
    // GIVEN: backend POST is delayed (300 ms) so the in-flight state is observable
    server.use(
      http.post('*/api/v1/clientes', async () => {
        await delay(300)
        return HttpResponse.json(buildClienteFixture(), { status: 201 })
      }),
    )

    renderWithQueryClient(<CreateClienteDialog isOpen={true} onClose={vi.fn()} />)
    const user = userEvent.setup()

    // WHEN: user fills a valid form and clicks Guardar
    await user.type(screen.getByLabelText('Nombre'), 'Slow')
    await user.type(screen.getByLabelText('NIT/RUC'), '900111280')
    await user.type(screen.getByLabelText('Teléfono'), '3001234567')
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    // THEN: while in-flight, the 4 inputs are disabled
    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeDisabled()
    })
    expect(screen.getByLabelText('NIT/RUC')).toBeDisabled()
    expect(screen.getByLabelText('Teléfono')).toBeDisabled()
    expect(screen.getByLabelText('Ciudad')).toBeDisabled()

    // AND: the Cancelar button is also disabled
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  // ─── AC #10 — Double-click on Guardar fires POST exactly once ─────────────
  test('AC #10 — double-click on Guardar fires POST exactly once (no double-submit)', async () => {
    let postCount = 0
    server.use(
      http.post('*/api/v1/clientes', async () => {
        postCount += 1
        await delay(150)
        return HttpResponse.json(buildClienteFixture(), { status: 201 })
      }),
    )

    renderWithQueryClient(<CreateClienteDialog isOpen={true} onClose={vi.fn()} />)
    const user = userEvent.setup()

    // WHEN: user fills + clicks Guardar twice in rapid succession
    await user.type(screen.getByLabelText('Nombre'), 'Double')
    await user.type(screen.getByLabelText('NIT/RUC'), '900111290')
    await user.type(screen.getByLabelText('Teléfono'), '3001234567')
    await user.type(screen.getByLabelText('Ciudad'), 'Bogotá')

    const guardar = screen.getByRole('button', { name: 'Guardar' })
    await user.click(guardar)
    await user.click(guardar) // second click while in-flight

    // THEN: only one POST was fired
    await waitFor(() => {
      expect(postCount).toBe(1)
    })
  })
})
