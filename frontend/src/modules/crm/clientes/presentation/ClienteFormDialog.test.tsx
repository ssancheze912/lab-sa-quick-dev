/**
 * Story 2.3 — ATDD (RED phase).
 *
 * Component tests for `ClienteFormDialog` (Task 7). Covers:
 *   - AC #1 — Open state renders the dialog title "Nuevo cliente".
 *   - AC #1 — Closed state does NOT render the form.
 *   - AC #2 — 201 path closes the dialog, invalidates ['clientes'] and fires
 *             the success toast with the exact Spanish copy.
 *   - AC #4 — 409 path keeps the dialog open, renders the NIT inline error,
 *             and does NOT fire the toast.
 *   - AC #6 — Clicking Cancelar closes the dialog (onOpenChange(false)).
 *   - AC #7 — 500 path keeps the dialog open, renders the top-of-form Alert
 *             and does NOT fire the toast.
 *
 * RED until:
 *   - `ClienteFormDialog.tsx` exists (Task 7) and wires `useCreateCliente`.
 *   - `ToastProvider` is not required inside tests — `toast` is mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { createElement, type ReactNode } from 'react'
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

function renderDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return {
    client,
    ...render(<ClienteFormDialog open={open} onOpenChange={onOpenChange} />, {
      wrapper: Wrapper,
    }),
  }
}

async function fillForm() {
  fireEvent.change(await screen.findByLabelText(/^Nombre$/), { target: { value: 'Acme SAS' } })
  fireEvent.change(screen.getByLabelText(/NIT\/RUC/), { target: { value: '900123456' } })
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '3001234567' } })
  fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: 'Cali' } })
}

beforeEach(() => {
  toastSuccessMock.mockReset()
})

describe('ClienteFormDialog — visibility (AC #1)', () => {
  it('GIVEN open=false, THEN the form is NOT rendered', () => {
    renderDialog({ open: false, onOpenChange: vi.fn() })
    expect(screen.queryByTestId('cliente-form')).not.toBeInTheDocument()
  })

  it('GIVEN open=true, THEN the dialog title "Nuevo cliente" and the form are rendered', async () => {
    renderDialog({ open: true, onOpenChange: vi.fn() })

    await waitFor(() =>
      expect(screen.getByText('Nuevo cliente')).toBeInTheDocument(),
    )
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument()
  })
})

describe('ClienteFormDialog — Cancelar closes the dialog (AC #6)', () => {
  it('GIVEN the dialog is open, WHEN Cancelar is clicked, THEN onOpenChange(false) is called', async () => {
    const onOpenChange = vi.fn()
    renderDialog({ open: true, onOpenChange })

    fireEvent.click(await screen.findByRole('button', { name: /cancelar/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('ClienteFormDialog — 201 success path (AC #2)', () => {
  it('GIVEN 201, WHEN Guardar is clicked, THEN dialog closes AND ["clientes"] invalidated AND toast.success called', async () => {
    const created = buildCliente({ nombre: 'Acme SAS', nit: '900123456' })
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(created, { status: 201 }),
      ),
    )

    const onOpenChange = vi.fn()
    const { client } = renderDialog({ open: true, onOpenChange })
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente creado correctamente')
  })
})

describe('ClienteFormDialog — 409 conflict path (AC #4)', () => {
  it('GIVEN 409, WHEN Guardar is clicked, THEN dialog STAYS open AND NIT inline error appears AND toast NOT called', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
            title: 'Conflict',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
          },
          {
            status: 409,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
      ),
    )

    const onOpenChange = vi.fn()
    renderDialog({ open: true, onOpenChange })

    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument(),
    )
    // Dialog was not closed by the dialog wrapper.
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

describe('ClienteFormDialog — 500 network path (AC #7)', () => {
  it('GIVEN 500, WHEN Guardar is clicked, THEN top-of-form Alert appears AND toast NOT called', async () => {
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )

    const onOpenChange = vi.fn()
    renderDialog({ open: true, onOpenChange })

    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-alert')).toBeInTheDocument(),
    )
    expect(screen.getByText('No se pudo guardar')).toBeInTheDocument()
    expect(screen.getByText('Comprueba tu conexión e intenta nuevamente.')).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})
