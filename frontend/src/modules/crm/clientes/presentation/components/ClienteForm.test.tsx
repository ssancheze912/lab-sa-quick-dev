import { describe, test, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { server } from '@/test/msw/server'
import {
  CLIENTES_ENDPOINT,
  CLIENTE_BY_ID_ENDPOINT,
  clienteNitConflictProblemDetails,
} from '@/test/msw/handlers'
import { createCliente } from '@/test/factories/cliente.factory'
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

  // --- Story 2.4: Edit mode ---------------------------------------------------
  //
  // RED PHASE: `ClienteForm.tsx`'s `mode` param is currently unused (prefixed
  // `_mode`) and it ALWAYS calls `useCreateCliente` regardless of mode (Story
  // 2.4, Task 5). These tests define the expected edit-mode behavior:
  //   - AC #1 (TC-E2-P1-08): form pre-fills with `initialValues` on mount
  //   - AC #2 (TC-E2-P2-06): successful edit submit shows the exact edit
  //     success toast copy, distinct from the create copy
  //   - AC #4 (TC-E2-P1-10): clearing a required field blocks submit, same
  //     Zod validation as create mode
  //   - AC #5: a 409 on edit shows the same inline conflict message, form
  //     stays open with data intact
  //   - AC #6 (TC-E2-P1-15): "Cancelar" closes the form with zero API calls
  //     and does not mutate the original values
  //   - AC #7: editing with the client's OWN unchanged NIT succeeds (no
  //     false-positive 409 surfaced to the user)

  const existingCliente = createCliente({
    nombre: 'Distribuidora Andina SAS',
    nit: '900555777-2',
    telefono: '3011234567',
    ciudad: 'Medellín',
  })

  function renderEditClienteForm(props: Partial<React.ComponentProps<typeof ClienteForm>> = {}) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const onSuccess = props.onSuccess ?? vi.fn()
    const onCancel = props.onCancel ?? vi.fn()

    return {
      onSuccess,
      onCancel,
      ...render(
        <QueryClientProvider client={queryClient}>
          <ClienteForm
            mode="edit"
            id={existingCliente.id}
            initialValues={{
              nombre: existingCliente.nombre,
              nit: existingCliente.nit,
              telefono: existingCliente.telefono,
              ciudad: existingCliente.ciudad,
            }}
            onSuccess={onSuccess}
            onCancel={onCancel}
            {...props}
          />
        </QueryClientProvider>,
      ),
    }
  }

  describe('AC #1 - edit mode pre-fills with current values (TC-E2-P1-08)', () => {
    test('should pre-fill the Nombre field with the current value on mount', () => {
      // GIVEN an existing client's data
      renderEditClienteForm()

      // WHEN the edit form is rendered
      // THEN the Nombre field shows the current value, not empty
      expect(screen.getByLabelText(/^nombre$/i)).toHaveValue(existingCliente.nombre)
    })

    test('should pre-fill the NIT/RUC field with the current value on mount', () => {
      // GIVEN an existing client's data
      renderEditClienteForm()

      // WHEN the edit form is rendered
      // THEN the NIT/RUC field shows the current value
      expect(screen.getByLabelText(/nit\/ruc/i)).toHaveValue(existingCliente.nit)
    })

    test('should pre-fill the Teléfono field with the current value on mount', () => {
      // GIVEN an existing client's data
      renderEditClienteForm()

      // WHEN the edit form is rendered
      // THEN the Teléfono field shows the current value
      expect(screen.getByLabelText(/tel[ée]fono/i)).toHaveValue(existingCliente.telefono)
    })

    test('should pre-fill the Ciudad field with the current value on mount', () => {
      // GIVEN an existing client's data
      renderEditClienteForm()

      // WHEN the edit form is rendered
      // THEN the Ciudad field shows the current value
      expect(screen.getByLabelText(/^ciudad$/i)).toHaveValue(existingCliente.ciudad)
    })
  })

  describe('AC #2 - successful edit submit', () => {
    test('should call toast.success with the exact copy "Cliente actualizado correctamente" (TC-E2-P2-06)', async () => {
      // GIVEN the backend accepts the update request (default MSW 200 handler)
      const { toast } = await import('siesa-ui-kit')
      const user = userEvent.setup()
      renderEditClienteForm()

      // WHEN the user changes Ciudad and submits
      await user.clear(screen.getByLabelText(/^ciudad$/i))
      await user.type(screen.getByLabelText(/^ciudad$/i), 'Cali')
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN the exact Spanish edit-success toast copy is shown (no
      // paraphrasing, R11) — distinct from the create-mode copy
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Cliente actualizado correctamente')
      })
    })

    test('should invoke onSuccess after a successful edit (so the host can close the dialog)', async () => {
      // GIVEN the backend accepts the update request
      const user = userEvent.setup()
      const { onSuccess } = renderEditClienteForm()

      // WHEN the user changes Ciudad and submits
      await user.clear(screen.getByLabelText(/^ciudad$/i))
      await user.type(screen.getByLabelText(/^ciudad$/i), 'Cali')
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN onSuccess is called, letting the host container close the form
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('AC #4 - edit mode required-field validation blocks submission (TC-E2-P1-10)', () => {
    test('should display an inline error when Nombre is cleared and submitted', async () => {
      // GIVEN the edit form is rendered pre-filled
      const user = userEvent.setup()
      renderEditClienteForm()

      // WHEN the user clears the required Nombre field and submits
      await user.clear(screen.getByLabelText(/^nombre$/i))
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN an inline Zod validation error appears (FR8)
      expect(await screen.findByText(/obligatorio|requerido/i)).toBeInTheDocument()
    })

    test('should NOT call the update mutation when a required field is cleared', async () => {
      // GIVEN a request spy on the update endpoint
      let requestCount = 0
      server.use(
        http.put(CLIENTE_BY_ID_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(existingCliente, { status: 200 })
        }),
      )
      const user = userEvent.setup()
      renderEditClienteForm()

      // WHEN the user clears Nombre and submits
      await user.clear(screen.getByLabelText(/^nombre$/i))
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText(/obligatorio|requerido/i)

      // THEN the backend was never called — frontend Zod blocked the submit
      expect(requestCount).toBe(0)
    })
  })

  describe('AC #5 - 409 duplicate NIT/RUC conflict on edit', () => {
    test('should display "El NIT/RUC ya está registrado" when the backend returns 409 on edit', async () => {
      // GIVEN the backend returns a 409 Problem Details conflict (colliding
      // with a DIFFERENT client's NIT)
      server.use(
        http.put(CLIENTE_BY_ID_ENDPOINT, () =>
          HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
        ),
      )
      const user = userEvent.setup()
      renderEditClienteForm()

      // WHEN the user changes the NIT/RUC to a colliding value and submits
      await user.clear(screen.getByLabelText(/nit\/ruc/i))
      await user.type(screen.getByLabelText(/nit\/ruc/i), '900999888-1')
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN the friendly Spanish conflict message is displayed inline
      expect(await screen.findByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    })

    test('should keep the edit form open (not call onSuccess) when the backend returns 409', async () => {
      // GIVEN the backend returns a 409 Problem Details conflict
      server.use(
        http.put(CLIENTE_BY_ID_ENDPOINT, () =>
          HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
        ),
      )
      const user = userEvent.setup()
      const { onSuccess } = renderEditClienteForm()

      // WHEN the user changes the NIT/RUC and submits, hitting the 409
      await user.clear(screen.getByLabelText(/nit\/ruc/i))
      await user.type(screen.getByLabelText(/nit\/ruc/i), '900999888-1')
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText('El NIT/RUC ya está registrado')

      // THEN onSuccess is never called — the form stays open (AC #5)
      expect(onSuccess).not.toHaveBeenCalled()
    })

    test('should keep the entered field values intact after a 409 on edit (no data loss)', async () => {
      // GIVEN the backend returns a 409 Problem Details conflict
      server.use(
        http.put(CLIENTE_BY_ID_ENDPOINT, () =>
          HttpResponse.json(clienteNitConflictProblemDetails, { status: 409 }),
        ),
      )
      const user = userEvent.setup()
      renderEditClienteForm()

      // WHEN the user changes Nombre and NIT/RUC and submits, hitting the 409
      await user.clear(screen.getByLabelText(/^nombre$/i))
      await user.type(screen.getByLabelText(/^nombre$/i), 'Nombre Editado SAS')
      await user.clear(screen.getByLabelText(/nit\/ruc/i))
      await user.type(screen.getByLabelText(/nit\/ruc/i), '900999888-1')
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText('El NIT/RUC ya está registrado')

      // THEN the entered values remain in the fields — no data loss (AC #5)
      expect(screen.getByLabelText(/^nombre$/i)).toHaveValue('Nombre Editado SAS')
      expect(screen.getByLabelText(/nit\/ruc/i)).toHaveValue('900999888-1')
    })
  })

  describe('AC #6 - Cancelar makes zero API calls and preserves original data (TC-E2-P1-15)', () => {
    test('should call onCancel without invoking any mutation when "Cancelar" is clicked', async () => {
      // GIVEN a request spy on the update endpoint
      let requestCount = 0
      server.use(
        http.put(CLIENTE_BY_ID_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(existingCliente, { status: 200 })
        }),
      )
      const user = userEvent.setup()
      const { onCancel } = renderEditClienteForm()

      // WHEN the user modifies a field but clicks "Cancelar" instead of "Guardar"
      await user.clear(screen.getByLabelText(/^ciudad$/i))
      await user.type(screen.getByLabelText(/^ciudad$/i), 'Barranquilla')
      await user.click(screen.getByRole('button', { name: /cancelar/i }))

      // THEN onCancel is invoked and zero network requests were made (R8)
      expect(onCancel).toHaveBeenCalled()
      expect(requestCount).toBe(0)
    })
  })

  describe('AC #7 - self-update with unchanged NIT/RUC succeeds', () => {
    test('should call toast.success when saving with the client\'s own unchanged NIT/RUC', async () => {
      // GIVEN the backend accepts a self-update where the NIT/RUC is unchanged
      // (self-exclusion — no false 409)
      const { toast } = await import('siesa-ui-kit')
      const user = userEvent.setup()
      renderEditClienteForm()

      // WHEN the user changes only Ciudad, leaving NIT/RUC untouched, and submits
      await user.clear(screen.getByLabelText(/^ciudad$/i))
      await user.type(screen.getByLabelText(/^ciudad$/i), 'Pereira')
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN the update succeeds (no incorrect 409 for the unchanged NIT/RUC)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Cliente actualizado correctamente')
      })
    })
  })
})
