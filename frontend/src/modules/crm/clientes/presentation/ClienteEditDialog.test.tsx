/**
 * Story 2.4 — ATDD (RED phase).
 *
 * Component tests for `ClienteEditDialog` (Task 7). Covers:
 *   - AC #1 — Open state renders the dialog title "Editar cliente" and
 *             pre-fills the four inputs with the passed `cliente` values;
 *             closed state does NOT render the form.
 *   - AC #2 — 200 path closes the dialog, invalidates BOTH ['clientes'] AND
 *             ['clientes', id] (R-011), fires success toast with exact Spanish.
 *   - AC #4 — Cancelar closes the dialog (onOpenChange(false)).
 *   - AC #5 — 409 path keeps the dialog open, renders the NIT inline error,
 *             and does NOT fire the toast.
 *   - AC #7 — 404 path renders the top-of-form alert "El cliente ya no existe"
 *             with the "Cierra el formulario" subtitle.
 *   - AC #7 — 500 path renders the top-of-form alert "No se pudo guardar".
 *
 * RED until:
 *   - `ClienteEditDialog.tsx` exists (Task 7) and wires `useUpdateCliente`.
 *   - `ClienteForm.tsx`'s submitError prop is widened to accept the union
 *     (CreateClienteError | UpdateClienteError) including the 'not-found' kind.
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

import { ClienteEditDialog } from './ClienteEditDialog'

function renderDialog({
  open,
  onOpenChange,
  cliente = buildCliente({
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Original Nombre',
    nit: '900111000',
    telefono: '3001110000',
    ciudad: 'Bogotá',
  }),
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente?: ReturnType<typeof buildCliente>
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
    cliente,
    ...render(
      <ClienteEditDialog open={open} onOpenChange={onOpenChange} cliente={cliente} />,
      { wrapper: Wrapper },
    ),
  }
}

beforeEach(() => {
  toastSuccessMock.mockReset()
})

describe('ClienteEditDialog — visibility + pre-fill (AC #1)', () => {
  it('GIVEN open=false, THEN the form is NOT rendered', () => {
    renderDialog({ open: false, onOpenChange: vi.fn() })
    expect(screen.queryByTestId('cliente-form')).not.toBeInTheDocument()
  })

  it('GIVEN open=true, THEN the dialog title "Editar cliente" is visible AND the four inputs are pre-filled with the current values', async () => {
    const cliente = buildCliente({
      nombre: 'Pre-filled Corp',
      nit: '900222111',
      telefono: '3002221110',
      ciudad: 'Medellín',
    })
    renderDialog({ open: true, onOpenChange: vi.fn(), cliente })

    await waitFor(() =>
      expect(screen.getByText('Editar cliente')).toBeInTheDocument(),
    )
    expect(screen.getByDisplayValue('Pre-filled Corp')).toBeInTheDocument()
    expect(screen.getByDisplayValue('900222111')).toBeInTheDocument()
    expect(screen.getByDisplayValue('3002221110')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Medellín')).toBeInTheDocument()
    // Guardar + Cancelar visible.
    expect(screen.getByRole('button', { name: /^guardar$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancelar$/i })).toBeInTheDocument()
  })
})

describe('ClienteEditDialog — Cancelar closes the dialog (AC #4)', () => {
  it('GIVEN the dialog is open, WHEN Cancelar is clicked, THEN onOpenChange(false) is called', async () => {
    const onOpenChange = vi.fn()
    renderDialog({ open: true, onOpenChange })

    fireEvent.click(await screen.findByRole('button', { name: /^cancelar$/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('ClienteEditDialog — 200 success path (AC #2)', () => {
  it('GIVEN 200, WHEN Guardar is clicked, THEN dialog closes AND both ["clientes"] and ["clientes", id] invalidated AND toast.success called', async () => {
    const cliente = buildCliente({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Old Name',
      nit: '900111000',
      telefono: '3001110000',
      ciudad: 'Bogotá',
    })
    const updated = { ...cliente, nombre: 'New Name' }
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(updated, { status: 200 }),
      ),
    )

    const onOpenChange = vi.fn()
    const { client } = renderDialog({ open: true, onOpenChange, cliente })
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')

    fireEvent.change(await screen.findByLabelText(/^Nombre$/), {
      target: { value: 'New Name' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    // AC #2 / R-011 — both keys must be invalidated.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['clientes'] })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['clientes', cliente.id],
    })
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente actualizado correctamente')
  })
})

describe('ClienteEditDialog — 409 conflict path (AC #5)', () => {
  it('GIVEN 409, WHEN Guardar is clicked, THEN dialog STAYS open AND NIT inline error appears AND toast NOT called', async () => {
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () =>
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

    // Change NIT to trigger a submit.
    fireEvent.change(await screen.findByLabelText(/NIT\/RUC/), {
      target: { value: '900999888' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument(),
    )
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

describe('ClienteEditDialog — 404 not-found path (AC #7)', () => {
  it('GIVEN 404, WHEN Guardar is clicked, THEN top-of-form alert "El cliente ya no existe" appears AND toast NOT called', async () => {
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(
          { type: '', title: 'Not Found', status: 404 },
          {
            status: 404,
            headers: { 'Content-Type': 'application/problem+json' },
          },
        ),
      ),
    )

    const onOpenChange = vi.fn()
    renderDialog({ open: true, onOpenChange })

    fireEvent.change(await screen.findByLabelText(/^Nombre$/), {
      target: { value: 'Changed' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.getByText('El cliente ya no existe')).toBeInTheDocument(),
    )
    // Subtitle contains the "cerrar el formulario" copy.
    expect(
      screen.getByText(/cierra el formulario/i),
    ).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

describe('ClienteEditDialog — 500 network path (AC #7)', () => {
  it('GIVEN 500, WHEN Guardar is clicked, THEN top-of-form alert "No se pudo guardar" appears AND toast NOT called', async () => {
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )

    const onOpenChange = vi.fn()
    renderDialog({ open: true, onOpenChange })

    fireEvent.change(await screen.findByLabelText(/^Nombre$/), {
      target: { value: 'Changed' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.getByText('No se pudo guardar')).toBeInTheDocument(),
    )
    expect(
      screen.getByText('Comprueba tu conexión e intenta nuevamente.'),
    ).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})
