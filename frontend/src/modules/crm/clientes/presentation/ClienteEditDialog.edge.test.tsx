/**
 * Story 2.4 — ATDD (RED phase) — edge cases.
 *
 * Complements `ClienteEditDialog.test.tsx` with the trickier flows that the
 * story's Task 7 test list calls out explicitly:
 *
 *   - AC #3 — Clearing a required field then submitting renders the exact
 *             Spanish inline error AND does NOT fire a PUT request.
 *   - AC #3 — Real-time re-validation: after an error appears, typing into
 *             the field clears it (reValidateMode: 'onChange').
 *   - AC #6 — Same-NIT round trip: pre-filled NIT is unchanged, only Nombre
 *             is edited → PUT is fired → 200 → dialog closes. Ensures the FE
 *             does NOT add a client-side "NIT unchanged" barrier — the
 *             exclude-self check lives server-side.
 *
 * RED until `ClienteEditDialog.tsx` and `useUpdateCliente` are implemented.
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

function renderDialog(cliente = defaultCliente()) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  const onOpenChange = vi.fn()
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  return {
    client,
    onOpenChange,
    ...render(
      <ClienteEditDialog open={true} onOpenChange={onOpenChange} cliente={cliente} />,
      { wrapper: Wrapper },
    ),
  }
}

function defaultCliente() {
  return buildCliente({
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Original Nombre',
    nit: '900111000',
    telefono: '3001110000',
    ciudad: 'Bogotá',
  })
}

beforeEach(() => {
  toastSuccessMock.mockReset()
})

describe('ClienteEditDialog — required-field validation on edit (AC #3)', () => {
  it('GIVEN a pre-filled form, WHEN the Nombre field is cleared and Guardar is clicked, THEN the Spanish inline error appears AND NO PUT is fired', async () => {
    let putCalls = 0
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () => {
        putCalls += 1
        return HttpResponse.json({}, { status: 200 })
      }),
    )

    renderDialog()

    const nombreInput = await screen.findByLabelText(/^Nombre$/)
    fireEvent.change(nombreInput, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument(),
    )
    // Give any accidental fetch a chance to fire.
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(putCalls).toBe(0)
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})

describe('ClienteEditDialog — real-time re-validation after first error (AC #3)', () => {
  it('GIVEN an inline error is visible, WHEN the user types into the field again, THEN the error clears (reValidateMode: onChange)', async () => {
    renderDialog()

    const nombreInput = await screen.findByLabelText(/^Nombre$/)
    fireEvent.change(nombreInput, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument(),
    )

    fireEvent.change(nombreInput, { target: { value: 'Recovered' } })

    await waitFor(() =>
      expect(screen.queryByText('El nombre es obligatorio')).not.toBeInTheDocument(),
    )
  })
})

describe('ClienteEditDialog — same-NIT round trip (AC #6)', () => {
  it('GIVEN pre-fill nit="900111000", WHEN only Nombre changes and Guardar is clicked, THEN PUT fires AND 200 closes the dialog (no client-side "NIT unchanged" barrier)', async () => {
    const cliente = defaultCliente()
    let putCalls = 0
    server.use(
      http.put(`${API_BASE}/api/v1/clientes/:id`, () => {
        putCalls += 1
        return HttpResponse.json(
          { ...cliente, nombre: 'Changed Name' },
          { status: 200 },
        )
      }),
    )

    const { onOpenChange } = renderDialog(cliente)

    fireEvent.change(await screen.findByLabelText(/^Nombre$/), {
      target: { value: 'Changed Name' },
    })
    // DO NOT touch NIT — it stays as the seeded '900111000'.
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(putCalls).toBe(1)
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente actualizado correctamente')
  })
})
