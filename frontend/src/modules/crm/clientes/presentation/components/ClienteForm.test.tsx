import { describe, test, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { server } from '@/test/msw/server'
import {
  CLIENTES_ENDPOINT,
  clienteNitConflictProblemDetails,
} from '@/test/msw/handlers'
import { ClienteForm } from './ClienteForm'

/**
 * Story 2.3 — `ClienteForm.tsx` (AC #1, #2, #3, #5).
 *
 * RED PHASE: `ClienteForm.tsx` does not exist yet (Story 2.3, Task 5). These
 * tests define the expected create-path behavior:
 *   - AC #1: renders Nombre, NIT/RUC, Teléfono, Ciudad fields
 *   - AC #3: empty required fields show inline Zod errors, mutation not called
 *   - AC #2: successful submit shows the exact success toast + triggers cache
 *     invalidation
 *   - AC #5: a 409 response shows "El NIT/RUC ya está registrado" inline,
 *     form stays open, previously entered values remain intact (no data loss)
 *
 * Network-first: every test that submits the form registers `server.use(...)`
 * overrides BEFORE interacting with the DOM (network-first.md).
 */

vi.mock('siesa-ui-kit', async () => {
  const actual = await vi.importActual<typeof import('siesa-ui-kit')>('siesa-ui-kit')
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  }
})

function renderClienteForm(props: Partial<React.ComponentProps<typeof ClienteForm>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onSuccess = props.onSuccess ?? vi.fn()

  return {
    onSuccess,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ClienteForm mode="create" onSuccess={onSuccess} {...props} />
      </QueryClientProvider>,
    ),
  }
}

const validData = {
  nombre: 'Comercializadora Andina SAS',
  nit: '900123456-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, data: Partial<typeof validData> = validData) {
  if (data.nombre !== undefined) await user.type(screen.getByLabelText(/^nombre$/i), data.nombre)
  if (data.nit !== undefined) await user.type(screen.getByLabelText(/nit\/ruc/i), data.nit)
  if (data.telefono !== undefined) await user.type(screen.getByLabelText(/tel[ée]fono/i), data.telefono)
  if (data.ciudad !== undefined) await user.type(screen.getByLabelText(/^ciudad$/i), data.ciudad)
}

describe('ClienteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC #1 - renders all required fields', () => {
    test('should render a Nombre input field', () => {
      // GIVEN the create form is rendered
      renderClienteForm()

      // THEN a Nombre field is present
      expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument()
    })

    test('should render a NIT/RUC input field', () => {
      // GIVEN the create form is rendered
      renderClienteForm()

      // THEN a NIT/RUC field is present
      expect(screen.getByLabelText(/nit\/ruc/i)).toBeInTheDocument()
    })

    test('should render a Teléfono input field', () => {
      // GIVEN the create form is rendered
      renderClienteForm()

      // THEN a Teléfono field is present
      expect(screen.getByLabelText(/tel[ée]fono/i)).toBeInTheDocument()
    })

    test('should render a Ciudad input field', () => {
      // GIVEN the create form is rendered
      renderClienteForm()

      // THEN a Ciudad field is present
      expect(screen.getByLabelText(/^ciudad$/i)).toBeInTheDocument()
    })

    test('should render a "Guardar" submit button', () => {
      // GIVEN the create form is rendered
      renderClienteForm()

      // THEN a submit ("Guardar") button is present
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
    })
  })

  describe('AC #3 - required-field validation blocks submission', () => {
    test('should display an inline error under Nombre when submitted empty', async () => {
      // GIVEN the create form is rendered with all fields empty
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user submits without filling any field
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN an inline error appears near the Nombre field (Zod, AC #3)
      expect(await screen.findByText(/obligatorio|requerido/i)).toBeInTheDocument()
    })

    test('should NOT call the create mutation when required fields are empty', async () => {
      // GIVEN a request spy on the create endpoint
      let requestCount = 0
      server.use(
        http.post(CLIENTES_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user submits with all fields empty
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText(/obligatorio|requerido/i)

      // THEN the backend was never called — frontend Zod blocked the submit (AC #3)
      expect(requestCount).toBe(0)
    })

    test('should NOT submit when Nombre is whitespace-only, other fields valid', async () => {
      // GIVEN a request spy on the create endpoint
      let requestCount = 0
      server.use(
        http.post(CLIENTES_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user fills every field except Nombre (left whitespace-only) and submits
      await fillForm(user, { ...validData, nombre: '   ' })
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN validation blocks the submit (Zod .trim().min(1)) and no request fires
      await waitFor(() => {
        expect(requestCount).toBe(0)
      })
    })
  })

  describe('AC #2 - successful submit', () => {
    test('should call toast.success with the exact copy "Cliente creado correctamente"', async () => {
      // GIVEN the backend accepts the create request (default MSW 201 handler)
      const { toast } = await import('siesa-ui-kit')
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user fills all fields with valid values and submits
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN the exact Spanish success toast copy is shown (TC-E2-P2-05, R11)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Cliente creado correctamente')
      })
    })

    test('should invoke onSuccess after a successful create (so the host can close the dialog)', async () => {
      // GIVEN the backend accepts the create request
      const user = userEvent.setup()
      const { onSuccess } = renderClienteForm()

      // WHEN the user fills all fields and submits
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN onSuccess is called, letting the host container close the form
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('AC #5 - 409 duplicate NIT/RUC conflict', () => {
    test('should display "El NIT/RUC ya está registrado" when the backend returns 409', async () => {
      // GIVEN the backend returns a 409 Problem Details conflict
      server.use(
        http.post(CLIENTES_ENDPOINT, () =>
          HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
        ),
      )
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user fills all fields and submits
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN the friendly Spanish conflict message is displayed
      expect(await screen.findByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    })

    test('should keep the form open (not call onSuccess) when the backend returns 409', async () => {
      // GIVEN the backend returns a 409 Problem Details conflict
      server.use(
        http.post(CLIENTES_ENDPOINT, () =>
          HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
        ),
      )
      const user = userEvent.setup()
      const { onSuccess } = renderClienteForm()

      // WHEN the user fills all fields and submits
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText('El NIT/RUC ya está registrado')

      // THEN onSuccess (which the host uses to close the form) is never called (AC #5)
      expect(onSuccess).not.toHaveBeenCalled()
    })

    test('should keep the previously entered field values intact after a 409 (no data loss)', async () => {
      // GIVEN the backend returns a 409 Problem Details conflict
      server.use(
        http.post(CLIENTES_ENDPOINT, () =>
          HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
        ),
      )
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user fills all fields and submits, hitting the 409
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText('El NIT/RUC ya está registrado')

      // THEN the entered values remain in the fields — no data loss (AC #5)
      expect(screen.getByLabelText(/^nombre$/i)).toHaveValue(validData.nombre)
      expect(screen.getByLabelText(/nit\/ruc/i)).toHaveValue(validData.nit)
      expect(screen.getByLabelText(/tel[ée]fono/i)).toHaveValue(validData.telefono)
      expect(screen.getByLabelText(/^ciudad$/i)).toHaveValue(validData.ciudad)
    })

    test('should NOT show a generic toast for the 409 case (must render inline, not toast)', async () => {
      // GIVEN the backend returns a 409 Problem Details conflict
      server.use(
        http.post(CLIENTES_ENDPOINT, () =>
          HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
        ),
      )
      const { toast } = await import('siesa-ui-kit')
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user fills all fields and submits, hitting the 409
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText('El NIT/RUC ya está registrado')

      // THEN no error toast is fired for this specific case — it's rendered inline instead
      expect(toast.error).not.toHaveBeenCalled()
    })
  })

  // --- Edge cases (testarch-automate expansion) -----------------------------

  describe('AC #3 - whitespace-only validation on individual fields', () => {
    test('should NOT submit when NIT/RUC is whitespace-only, other fields valid', async () => {
      // GIVEN a request spy on the create endpoint
      let requestCount = 0
      server.use(
        http.post(CLIENTES_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user fills every field except NIT/RUC (left whitespace-only) and submits
      await fillForm(user, { ...validData, nit: '   ' })
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN validation blocks the submit and no request fires
      await waitFor(() => {
        expect(requestCount).toBe(0)
      })
    })

    test('should NOT submit when Teléfono is whitespace-only, other fields valid', async () => {
      // GIVEN a request spy on the create endpoint
      let requestCount = 0
      server.use(
        http.post(CLIENTES_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user fills every field except Teléfono (left whitespace-only) and submits
      await fillForm(user, { ...validData, telefono: '   ' })
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN validation blocks the submit and no request fires
      await waitFor(() => {
        expect(requestCount).toBe(0)
      })
    })

    test('should NOT submit when Ciudad is whitespace-only, other fields valid', async () => {
      // GIVEN a request spy on the create endpoint
      let requestCount = 0
      server.use(
        http.post(CLIENTES_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user fills every field except Ciudad (left whitespace-only) and submits
      await fillForm(user, { ...validData, ciudad: '   ' })
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN validation blocks the submit and no request fires
      await waitFor(() => {
        expect(requestCount).toBe(0)
      })
    })
  })

  describe('AC #2 - submit button state during pending mutation', () => {
    test('should disable the "Guardar" button while the create mutation is pending', async () => {
      // GIVEN the backend delays its response so the pending state is observable
      server.use(
        http.post(CLIENTES_ENDPOINT, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderClienteForm()

      // WHEN the user fills the form and submits
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN the submit button is disabled while the mutation is in flight,
      // preventing a duplicate/double submit
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /guardar/i })).toBeDisabled()
      })
    })
  })
})
