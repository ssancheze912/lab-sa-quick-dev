/**
 * Story 2.3 — component tests for `ClienteForm`.
 *
 * Covers Acceptance Criterion #12 (eight `ClienteForm_*` sub-cases). Uses MSW
 * with `onUnhandledRequest: 'error'` so any unexpected POST fails the test.
 *
 * The siesa-ui-kit toast module is mocked here so we can assert success/error
 * toast calls without depending on the kit's DOM-side ToastProvider.
 */

import {
  describe,
  expect,
  test,
  beforeAll,
  afterEach,
  afterAll,
  beforeEach,
  vi,
} from 'vitest'

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}))

vi.mock('siesa-ui-kit', () => ({
  ToastProvider: ({ children }: { children?: React.ReactNode }) => children,
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}))

import type { ReactElement } from 'react'
import { useState } from 'react'
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClienteForm } from '../ClienteForm'

// ─────────────────────────────────────────────────────────────────────────────
// MSW server.
// ─────────────────────────────────────────────────────────────────────────────

const CREATED = {
  id: '00000000-0000-0000-0000-000000000010',
  nombre: 'Acme S.A.S.',
  nit: '900.123.456-7',
  telefono: '+57 300 000 0000',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

let lastRequestBody: unknown = null

const server = setupServer(
  http.post('*/api/v1/clientes', async ({ request }) => {
    lastRequestBody = await request.json()
    return HttpResponse.json(CREATED, { status: 201 })
  }),
)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  lastRequestBody = null
  toastSuccessMock.mockClear()
  toastErrorMock.mockClear()
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())

// ─────────────────────────────────────────────────────────────────────────────
// Helpers.
// ─────────────────────────────────────────────────────────────────────────────

function FormHarness({ initialOpen = true }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen)
  return (
    <>
      <button data-testid="reopen-form" onClick={() => setOpen(true)}>
        reopen
      </button>
      <ClienteForm open={open} onOpenChange={setOpen} />
    </>
  )
}

function renderForm(ui: ReactElement = <FormHarness />) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

async function fillField(label: RegExp, value: string) {
  const input = screen.getByLabelText(label) as HTMLInputElement
  fireEvent.change(input, { target: { value } })
  return input
}

// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — Story 2.3', () => {
  test('ClienteForm_renders_four_fields_with_required_asterisks', async () => {
    renderForm()

    expect(await screen.findByTestId('cliente-form-dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /nuevo cliente/i })).toBeInTheDocument()

    expect(screen.getByText('Nombre *')).toBeInTheDocument()
    expect(screen.getByText('NIT/RUC *')).toBeInTheDocument()
    expect(screen.getByText('Teléfono *')).toBeInTheDocument()
    expect(screen.getByText('Ciudad *')).toBeInTheDocument()

    const nombre = screen.getByLabelText(/^nombre \*$/i)
    expect(nombre.tagName.toLowerCase()).toBe('input')
  })

  test('ClienteForm_blocks_submit_when_nombre_empty', async () => {
    renderForm()
    await screen.findByTestId('cliente-form-dialog')

    await fillField(/^nit\/ruc \*$/i, '900.123.456-7')
    await fillField(/^teléfono \*$/i, '3001112233')
    await fillField(/^ciudad \*$/i, 'Bogotá')

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    expect(await screen.findByTestId('cliente-form-error-nombre')).toHaveTextContent(
      'Este campo es requerido',
    )
    // MSW `onUnhandledRequest: 'error'` would crash the test if a POST fired.
    expect(lastRequestBody).toBeNull()
  })

  test('ClienteForm_blocks_submit_when_all_fields_empty', async () => {
    renderForm()
    await screen.findByTestId('cliente-form-dialog')

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    expect(await screen.findByTestId('cliente-form-error-nombre')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-form-error-nit')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-form-error-telefono')).toBeInTheDocument()
    expect(screen.getByTestId('cliente-form-error-ciudad')).toBeInTheDocument()

    expect(lastRequestBody).toBeNull()
  })

  test('ClienteForm_clears_inline_error_on_valid_input', async () => {
    renderForm()
    await screen.findByTestId('cliente-form-dialog')

    // Trigger error on nit.
    await fillField(/^nombre \*$/i, 'Acme')
    await fillField(/^teléfono \*$/i, '3001112233')
    await fillField(/^ciudad \*$/i, 'Bogotá')
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    expect(await screen.findByTestId('cliente-form-error-nit')).toBeInTheDocument()

    // Type valid value — inline error clears on next valid change.
    await fillField(/^nit\/ruc \*$/i, '900.123.456-7')

    await waitFor(() => {
      expect(screen.queryByTestId('cliente-form-error-nit')).not.toBeInTheDocument()
    })
  })

  test('ClienteForm_submits_valid_payload_and_closes', async () => {
    renderForm()
    await screen.findByTestId('cliente-form-dialog')

    await fillField(/^nombre \*$/i, 'Acme S.A.S.')
    await fillField(/^nit\/ruc \*$/i, '900.123.456-7')
    await fillField(/^teléfono \*$/i, '+57 300 000 0000')
    await fillField(/^ciudad \*$/i, 'Medellín')

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Cliente creado correctamente',
        expect.objectContaining({ duration: 3000 }),
      )
    })

    expect(lastRequestBody).toEqual({
      nombre: 'Acme S.A.S.',
      nit: '900.123.456-7',
      telefono: '+57 300 000 0000',
      ciudad: 'Medellín',
    })

    // Dialog closes (Radix unmounts when controlled `open` flips to false).
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-form-dialog')).not.toBeInTheDocument()
    })
  })

  test('ClienteForm_handles_409_duplicate_nit', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        new HttpResponse(
          JSON.stringify({
            status: 409,
            title: 'El NIT/RUC ya está registrado.',
            type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
            instance: '/api/v1/clientes',
          }),
          { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    renderForm()
    await screen.findByTestId('cliente-form-dialog')

    await fillField(/^nombre \*$/i, 'Acme S.A.S.')
    await fillField(/^nit\/ruc \*$/i, '900.123.456-7')
    await fillField(/^teléfono \*$/i, '+57 300 000 0000')
    await fillField(/^ciudad \*$/i, 'Medellín')

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    expect(await screen.findByTestId('cliente-form-error-nit')).toHaveTextContent(
      'El NIT/RUC ya está registrado',
    )

    // Modal stays open.
    expect(screen.getByTestId('cliente-form-dialog')).toBeInTheDocument()

    // No red toast for a 409 (AC #7).
    expect(toastErrorMock).not.toHaveBeenCalled()
  })

  test('ClienteForm_handles_5xx_with_red_toast', async () => {
    server.use(
      http.post('*/api/v1/clientes', () =>
        new HttpResponse(
          JSON.stringify({ status: 500, title: 'Internal Server Error' }),
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    )

    renderForm()
    await screen.findByTestId('cliente-form-dialog')

    await fillField(/^nombre \*$/i, 'Acme S.A.S.')
    await fillField(/^nit\/ruc \*$/i, '900.123.456-7')
    await fillField(/^teléfono \*$/i, '+57 300 000 0000')
    await fillField(/^ciudad \*$/i, 'Medellín')

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'No se pudo guardar. Intenta de nuevo.',
        expect.objectContaining({ duration: 5000 }),
      )
    })

    // Modal stays open with values intact.
    expect(screen.getByTestId('cliente-form-dialog')).toBeInTheDocument()
    expect((screen.getByLabelText(/^nombre \*$/i) as HTMLInputElement).value).toBe(
      'Acme S.A.S.',
    )
  })

  test('ClienteForm_cancel_button_discards_state', async () => {
    renderForm()
    await screen.findByTestId('cliente-form-dialog')

    await fillField(/^nombre \*$/i, 'Acme S.A.S.')
    await fillField(/^nit\/ruc \*$/i, '900.123.456-7')

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))

    await waitFor(() => {
      expect(screen.queryByTestId('cliente-form-dialog')).not.toBeInTheDocument()
    })

    // Re-open the form.
    fireEvent.click(screen.getByTestId('reopen-form'))

    const dialog = await screen.findByTestId('cliente-form-dialog')
    const nombre = within(dialog).getByLabelText(/^nombre \*$/i) as HTMLInputElement
    const nit = within(dialog).getByLabelText(/^nit\/ruc \*$/i) as HTMLInputElement

    expect(nombre.value).toBe('')
    expect(nit.value).toBe('')

    // No POST was fired.
    expect(lastRequestBody).toBeNull()
  })
})
