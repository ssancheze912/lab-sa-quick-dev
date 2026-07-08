/**
 * Story 2.4 — ATDD (RED phase).
 *
 * Routing-integration test that boots the real `routeTree` at
 * `/clientes/:clienteId` with MSW-stubbed backend, clicks "Editar", edits
 * fields, submits, and asserts the full happy + duplicate-NIT + not-found flows.
 *
 * Covers:
 *   - AC #1 — "Editar" button opens the dialog with title "Editar cliente"
 *             and inputs pre-filled with the loaded client's values.
 *   - AC #2 — On 200, dialog closes AND the detail card re-renders with the
 *             new Nombre (via the invalidation-triggered refetch), AND toast
 *             success fires with exact Spanish copy.
 *   - AC #5 — On 409 the inline NIT error appears with exact Spanish copy;
 *             dialog stays open; user edits NIT and re-submits → 200 closes.
 *   - AC #7 — On 404 the top-of-form alert "El cliente ya no existe" appears;
 *             dialog stays open; toast NOT called.
 *
 * RED until:
 *   - `ClienteDetailView` mounts the "Editar" button and `ClienteEditDialog`.
 *   - `useUpdateCliente` invalidates both ['clientes'] and ['clientes', id].
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

describe('/clientes/:clienteId — edit client happy path (AC #1, #2)', () => {
  it('GIVEN 200, WHEN a client is edited, THEN dialog closes AND the detail card re-renders with new values AND toast.success fires', async () => {
    const target = buildCliente({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Old Name',
      nit: '900111000',
      telefono: '3001110000',
      ciudad: 'Bogotá',
    })
    const updated = { ...target, nombre: 'New Name' }
    let getCalls = 0

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json([target], { status: 200 }),
      ),
      http.get(`${API_BASE}/api/v1/clientes/:id`, () => {
        getCalls += 1
        return HttpResponse.json(
          getCalls === 1 ? target : updated,
          { status: 200 },
        )
      }),
      http.put(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(updated, { status: 200 }),
      ),
    )

    mountAt(`/clientes/${target.id}`)

    // Detail card loads with the initial Nombre.
    await screen.findByRole('heading', { name: 'Old Name' })

    // Click the "Editar" button.
    fireEvent.click(screen.getByRole('button', { name: /editar cliente/i }))

    // Dialog opens with the exact Spanish title.
    await waitFor(() =>
      expect(screen.getByText('Editar cliente')).toBeInTheDocument(),
    )

    // Inputs are pre-filled.
    expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('900111000')).toBeInTheDocument()

    // Edit Nombre and submit.
    fireEvent.change(screen.getByLabelText(/^Nombre$/), {
      target: { value: 'New Name' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    // Dialog closes.
    await waitFor(() =>
      expect(screen.queryByTestId('cliente-edit-dialog')).not.toBeInTheDocument(),
    )

    // Detail card re-renders with the new Nombre (invalidation-driven refetch).
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'New Name' }),
      ).toBeInTheDocument(),
    )

    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente actualizado correctamente')
  })
})

describe('/clientes/:clienteId — duplicate NIT then retry (AC #5)', () => {
  it('GIVEN 409 on first submit, THEN inline NIT error appears; editing NIT then re-submitting resolves via 200', async () => {
    const target = buildCliente({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Original',
      nit: '900111000',
      telefono: '3001110000',
      ciudad: 'Bogotá',
    })
    let putCalls = 0

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json([target], { status: 200 }),
      ),
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(target, { status: 200 }),
      ),
      http.put(`${API_BASE}/api/v1/clientes/:id`, () => {
        putCalls += 1
        if (putCalls === 1) {
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
          { ...target, nit: '900999888' },
          { status: 200 },
        )
      }),
    )

    mountAt(`/clientes/${target.id}`)
    await screen.findByRole('heading', { name: 'Original' })

    fireEvent.click(screen.getByRole('button', { name: /editar cliente/i }))
    await waitFor(() =>
      expect(screen.getByText('Editar cliente')).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText(/NIT\/RUC/), {
      target: { value: '900222333' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    // Inline NIT error appears; dialog stays open.
    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument(),
    )
    expect(screen.getByTestId('cliente-edit-dialog')).toBeInTheDocument()
    expect(toastSuccessMock).not.toHaveBeenCalled()

    // Edit the NIT and resubmit — 200 path.
    fireEvent.change(screen.getByLabelText(/NIT\/RUC/), {
      target: { value: '900999888' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.queryByTestId('cliente-edit-dialog')).not.toBeInTheDocument(),
    )
    expect(toastSuccessMock).toHaveBeenCalledWith('Cliente actualizado correctamente')
  })
})

describe('/clientes/:clienteId — not-found on save (AC #7)', () => {
  it('GIVEN 404 on submit, THEN top-of-form alert "El cliente ya no existe" appears AND dialog stays open AND toast NOT called', async () => {
    const target = buildCliente({
      id: '11111111-1111-1111-1111-111111111111',
      nombre: 'Deleted-Race',
      nit: '900111000',
      telefono: '3001110000',
      ciudad: 'Bogotá',
    })

    server.use(
      http.get(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json([target], { status: 200 }),
      ),
      http.get(`${API_BASE}/api/v1/clientes/:id`, () =>
        HttpResponse.json(target, { status: 200 }),
      ),
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

    mountAt(`/clientes/${target.id}`)
    await screen.findByRole('heading', { name: 'Deleted-Race' })

    fireEvent.click(screen.getByRole('button', { name: /editar cliente/i }))
    await waitFor(() =>
      expect(screen.getByText('Editar cliente')).toBeInTheDocument(),
    )

    fireEvent.change(screen.getByLabelText(/^Nombre$/), {
      target: { value: 'Anything' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }))

    await waitFor(() =>
      expect(screen.getByText('El cliente ya no existe')).toBeInTheDocument(),
    )
    expect(screen.getByTestId('cliente-edit-dialog')).toBeInTheDocument()
    expect(toastSuccessMock).not.toHaveBeenCalled()
  })
})
