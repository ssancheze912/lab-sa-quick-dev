/**
 * Story 2.3 — ATDD (RED phase).
 *
 * Routing-integration test that boots the real `routeTree` at `/clientes` with
 * MSW-stubbed backend, clicks "Nuevo cliente", fills the form and asserts the
 * full happy + duplicate-NIT flows.
 *
 * Covers:
 *   - AC #1 — "Nuevo cliente" button opens the dialog with title "Nuevo cliente".
 *   - AC #2 — On 201, dialog closes AND the new row appears in the list panel
 *             (invalidation-driven refetch), AND toast.success fires with the
 *             exact Spanish copy.
 *   - AC #4 — On 409 the inline NIT error appears; dialog stays open; a second
 *             submit (after editing the NIT) succeeds with 201.
 *
 * RED until:
 *   - `ClienteListView` enables the "Nuevo cliente" button (drops `disabled`)
 *     and mounts `ClienteFormDialog`.
 *   - The mutation invalidates ['clientes'] so the list refetches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { http, HttpResponse } from 'msw'
import { routeTree } from '@/routeTree.gen'
import { createTestQueryClient } from '@/test/render'
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

function mountAt(path: string) {
  const client = createTestQueryClient()
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

beforeEach(() => {
  toastSuccessMock.mockReset()
})

describe('/clientes — create client happy path (AC #1, #2)', () => {
  it('GIVEN 201, WHEN a client is created, THEN dialog closes AND the new row appears in the list AND toast.success fires', async () => {
    const initial = buildCliente({ nombre: 'Existing Corp' })
    const created = buildCliente({
      id: '99999999-9999-9999-9999-999999999999',
      nombre: 'Acme SAS',
      nit: '900123456',
      telefono: '3001234567',
      ciudad: 'Cali',
    })

    let listCalls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () => {
        listCalls += 1
        return HttpResponse.json(
          listCalls === 1 ? [initial] : [created, initial],
          { status: 200 },
        )
      }),
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(created, { status: 201 }),
      ),
    )

    mountAt('/clientes')

    // Wait for the initial list to render.
    await screen.findByRole('button', { name: /ver cliente:\s*existing corp/i })

    // Open the dialog.
    fireEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-dialog')).toBeInTheDocument(),
    )

    // Fill and submit.
    fireEvent.change(screen.getByLabelText(/^Nombre$/), { target: { value: 'Acme SAS' } })
    fireEvent.change(screen.getByLabelText(/NIT\/RUC/), { target: { value: '900123456' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: 'Cali' } })

    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    // Dialog closes.
    await waitFor(() =>
      expect(screen.queryByTestId('cliente-form')).not.toBeInTheDocument(),
    )

    // The new row appears in the list (invalidation triggered refetch).
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /ver cliente:\s*acme sas/i }),
      ).toBeInTheDocument(),
    )

    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente creado correctamente')
  })
})

describe('/clientes — duplicate NIT then retry (AC #4)', () => {
  it('GIVEN 409 on first submit, THEN the NIT inline error appears; editing NIT then re-submitting resolves via 201', async () => {
    const initial = buildCliente({ nombre: 'Existing Corp' })
    let postCalls = 0
    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json([initial], { status: 200 }),
      ),
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        postCalls += 1
        if (postCalls === 1) {
          return HttpResponse.json(
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
          )
        }
        return HttpResponse.json(
          buildCliente({ nombre: 'Acme SAS', nit: '900987654' }),
          { status: 201 },
        )
      }),
    )

    mountAt('/clientes')
    await screen.findByRole('button', { name: /ver cliente:\s*existing corp/i })

    fireEvent.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    await waitFor(() =>
      expect(screen.getByTestId('cliente-form-dialog')).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText(/^Nombre$/), { target: { value: 'Acme SAS' } })
    fireEvent.change(screen.getByLabelText(/NIT\/RUC/), { target: { value: '900123456' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: 'Cali' } })

    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    // Inline NIT error appears; dialog stays open.
    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument(),
    )
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument()
    expect(toastSuccessMock).not.toHaveBeenCalled()

    // Edit the NIT and resubmit — 201 path.
    fireEvent.change(screen.getByLabelText(/NIT\/RUC/), { target: { value: '900987654' } })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.queryByTestId('cliente-form')).not.toBeInTheDocument(),
    )
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente creado correctamente')
  })
})
