/**
 * Story 2.3 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `ClienteFormDialog` with boundary conditions the
 * RED-phase suite skipped:
 *   - Sequential open → 409 → cancel → re-open shows a FRESH form (no stale
 *     NIT-conflict inline error survives across dialog cycles — AC #6).
 *   - open=false leaves neither the dialog nor the trigger's form in the DOM
 *     (portal cleanup, no stray Alert / Field artefacts).
 *   - Empty submit renders four inline errors AND does NOT fire a POST
 *     (Zod short-circuit — the same defense as AC #3, but wired through the
 *     dialog).
 *
 * [P1] tag — the dialog is the AC #6 state-management seam. Any stale error
 * leaked across cycles is a user-visible regression.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { createElement, useState, type ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { API_BASE } from '@/test/msw/handlers'
import { buildCliente } from '@/test/factories/cliente.factory'

const { toastSuccessMock } = vi.hoisted(() => ({ toastSuccessMock: vi.fn() }))
vi.mock('siesa-ui-kit', async (importOriginal) => {
  const original = await importOriginal<typeof import('siesa-ui-kit')>()
  return {
    ...original,
    toast: {
      success: toastSuccessMock,
      error: vi.fn(),
    },
  }
})

import { ClienteFormDialog } from './ClienteFormDialog'

function renderDialogWithHarness() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  function Harness() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button type="button" data-testid="open-btn" onClick={() => setOpen(true)}>
          Abrir
        </button>
        <ClienteFormDialog open={open} onOpenChange={setOpen} />
      </>
    )
  }
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return { client, ...render(<Harness />, { wrapper: Wrapper }) }
}

function fillForm() {
  fireEvent.change(screen.getByLabelText(/^Nombre$/), { target: { value: 'Acme SAS' } })
  fireEvent.change(screen.getByLabelText(/NIT\/RUC/), { target: { value: '900123456' } })
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '3001234567' } })
  fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: 'Cali' } })
}

beforeEach(() => {
  toastSuccessMock.mockReset()
})

describe('ClienteFormDialog — stale state cleared on re-open (AC #6)', () => {
  it('[P1] GIVEN open → 409 → Cancelar → re-open, THEN the second open shows a FRESH form (no stale NIT-conflict error)', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(
          {
            type: '',
            title: 'Conflict',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
          },
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )
    renderDialogWithHarness()

    // Open, submit → 409.
    fireEvent.click(screen.getByTestId('open-btn'))
    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-dialog')).toBeInTheDocument(),
    )
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument(),
    )

    // Cancel — dialog closes.
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    await waitFor(() =>
      expect(screen.queryByTestId('cliente-form')).not.toBeInTheDocument(),
    )

    // Re-open — the form is fresh (no NIT-conflict message, no stale inputs).
    fireEvent.click(screen.getByTestId('open-btn'))
    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-dialog')).toBeInTheDocument(),
    )

    // The stale NIT-conflict Spanish string is gone.
    expect(screen.queryByText('El NIT/RUC ya está registrado')).not.toBeInTheDocument()
    // The inputs are empty (form state was reset).
    expect((screen.getByLabelText(/^Nombre$/) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/NIT\/RUC/) as HTMLInputElement).value).toBe('')
  })
})

describe('ClienteFormDialog — closed dialog has no residual form DOM', () => {
  it('[P1] GIVEN open=false, THEN neither the form nor the Alert nor the trigger portal is in the DOM', () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0, staleTime: 0 },
        mutations: { retry: false },
      },
    })
    const Wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client }, children)

    render(<ClienteFormDialog open={false} onOpenChange={vi.fn()} />, { wrapper: Wrapper })

    expect(screen.queryByTestId('cliente-form')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-form-dialog')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cliente-form-alert')).not.toBeInTheDocument()
    // The dialog title MUST NOT be in the DOM either (shadcn Dialog fully unmounts on closed state).
    expect(screen.queryByText('Nuevo cliente')).not.toBeInTheDocument()
  })
})

describe('ClienteFormDialog — empty submit short-circuits (AC #3)', () => {
  it('[P1] GIVEN empty form, WHEN Guardar clicked, THEN four Spanish errors render AND NO POST is fired', async () => {
    let postCalls = 0
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        postCalls += 1
        return HttpResponse.json({}, { status: 500 })
      }),
    )
    renderDialogWithHarness()

    fireEvent.click(screen.getByTestId('open-btn'))
    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-dialog')).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument(),
    )
    expect(screen.getByText('El NIT/RUC es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('La ciudad es obligatoria')).toBeInTheDocument()

    // Give any accidental fetch a chance to fire.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(postCalls).toBe(0)
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

describe('ClienteFormDialog — 201 success clears mutation.error before close (AC #6)', () => {
  it('[P1] GIVEN 409 then re-fill with unique NIT then 201, THEN dialog closes AND no residual error is visible on next open', async () => {
    let postCalls = 0
    const created = buildCliente({ nombre: 'Acme SAS', nit: '900987654' })
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        postCalls += 1
        if (postCalls === 1) {
          return HttpResponse.json(
            { title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado' },
            { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
          )
        }
        return HttpResponse.json(created, { status: 201 })
      }),
    )
    renderDialogWithHarness()

    fireEvent.click(screen.getByTestId('open-btn'))
    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-dialog')).toBeInTheDocument(),
    )
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    // 409 inline error.
    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument(),
    )

    // Change NIT → resubmit → 201 → dialog closes.
    fireEvent.change(screen.getByLabelText(/NIT\/RUC/), { target: { value: '900987654' } })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.queryByTestId('cliente-form')).not.toBeInTheDocument(),
    )
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente creado correctamente')

    // Re-open — form is fresh, no stale error visible.
    fireEvent.click(screen.getByTestId('open-btn'))
    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-dialog')).toBeInTheDocument(),
    )
    expect(screen.queryByText('El NIT/RUC ya está registrado')).not.toBeInTheDocument()
  })
})
