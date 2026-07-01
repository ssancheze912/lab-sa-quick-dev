import { describe, test, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { server } from '@/test/msw/server'
import { CONTACTOS_ENDPOINT, contactoValidationErrorProblemDetails } from '@/test/msw/handlers'
import { ContactoForm } from './ContactoForm'

/**
 * Story 3.3 — `ContactoForm.tsx` (AC #1, #2, #3, #5).
 *
 * RED PHASE: `ContactoForm.tsx` does not exist yet (Story 3.3, Task 5). These
 * tests define the expected create-path behavior only (mode="edit" is Story
 * 3.4 scope, per Dev Notes' scope boundary):
 *   - AC #1: renders Nombre, Cargo, Teléfono, Email fields
 *   - AC #3: empty required fields show inline Zod errors, mutation not called
 *   - AC #2: successful submit shows the exact success toast + triggers
 *     onSuccess so the host can close the dialog
 *   - AC #5: a 400 validation error from the backend shows field-level
 *     messages inline via setError, form stays open, values intact (no data
 *     loss) — no 409 path exists (ContactoEntity has no unique business key)
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

function renderContactoForm(props: Partial<React.ComponentProps<typeof ContactoForm>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onSuccess = props.onSuccess ?? vi.fn()

  return {
    onSuccess,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ContactoForm mode="create" onSuccess={onSuccess} {...props} />
      </QueryClientProvider>,
    ),
  }
}

const validData = {
  nombre: 'Camila Restrepo Duque',
  cargo: 'Gerente Comercial',
  telefono: '3011234567',
  email: 'camila.restrepo@ejemplo.co',
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, data: Partial<typeof validData> = validData) {
  if (data.nombre !== undefined) await user.type(screen.getByLabelText(/^nombre$/i), data.nombre)
  if (data.cargo !== undefined) await user.type(screen.getByLabelText(/^cargo$/i), data.cargo)
  if (data.telefono !== undefined) await user.type(screen.getByLabelText(/tel[ée]fono/i), data.telefono)
  if (data.email !== undefined) await user.type(screen.getByLabelText(/^email$/i), data.email)
}

describe('ContactoForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC #1 - renders all required fields', () => {
    test('should render a Nombre input field', () => {
      // GIVEN the create form is rendered
      renderContactoForm()

      // THEN a Nombre field is present
      expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument()
    })

    test('should render a Cargo input field', () => {
      // GIVEN the create form is rendered
      renderContactoForm()

      // THEN a Cargo field is present
      expect(screen.getByLabelText(/^cargo$/i)).toBeInTheDocument()
    })

    test('should render a Teléfono input field', () => {
      // GIVEN the create form is rendered
      renderContactoForm()

      // THEN a Teléfono field is present
      expect(screen.getByLabelText(/tel[ée]fono/i)).toBeInTheDocument()
    })

    test('should render an Email input field', () => {
      // GIVEN the create form is rendered
      renderContactoForm()

      // THEN an Email field is present
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    })

    test('should render a "Guardar" submit button', () => {
      // GIVEN the create form is rendered
      renderContactoForm()

      // THEN a submit ("Guardar") button is present
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
    })
  })

  describe('AC #3 - required-field validation blocks submission', () => {
    test('should display an inline error under Nombre when submitted empty', async () => {
      // GIVEN the create form is rendered with all fields empty
      const user = userEvent.setup()
      renderContactoForm()

      // WHEN the user submits without filling any field
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN an inline error appears near the Nombre field (Zod, AC #3)
      expect(await screen.findByText(/obligatorio|requerido/i)).toBeInTheDocument()
    })

    test('should NOT call the create mutation when required fields are empty', async () => {
      // GIVEN a request spy on the create endpoint
      let requestCount = 0
      server.use(
        http.post(CONTACTOS_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderContactoForm()

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
        http.post(CONTACTOS_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderContactoForm()

      // WHEN the user fills every field except Nombre (left whitespace-only) and submits
      await fillForm(user, { ...validData, nombre: '   ' })
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN validation blocks the submit (Zod .trim().min(1)) and no request fires
      await waitFor(() => {
        expect(requestCount).toBe(0)
      })
    })

    test('should NOT submit when Cargo is whitespace-only, other fields valid', async () => {
      // GIVEN a request spy on the create endpoint
      let requestCount = 0
      server.use(
        http.post(CONTACTOS_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderContactoForm()

      // WHEN the user fills every field except Cargo (left whitespace-only) and submits
      await fillForm(user, { ...validData, cargo: '   ' })
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
        http.post(CONTACTOS_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderContactoForm()

      // WHEN the user fills every field except Teléfono (left whitespace-only) and submits
      await fillForm(user, { ...validData, telefono: '   ' })
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN validation blocks the submit and no request fires
      await waitFor(() => {
        expect(requestCount).toBe(0)
      })
    })

    test('should NOT submit when Email is whitespace-only, other fields valid', async () => {
      // GIVEN a request spy on the create endpoint
      let requestCount = 0
      server.use(
        http.post(CONTACTOS_ENDPOINT, () => {
          requestCount += 1
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderContactoForm()

      // WHEN the user fills every field except Email (left whitespace-only) and submits
      await fillForm(user, { ...validData, email: '   ' })
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN validation blocks the submit and no request fires
      await waitFor(() => {
        expect(requestCount).toBe(0)
      })
    })
  })

  describe('AC #2 - successful submit', () => {
    test('should call toast.success with the exact copy "Contacto creado correctamente" (R10)', async () => {
      // GIVEN the backend accepts the create request (default MSW 201 handler)
      const { toast } = await import('siesa-ui-kit')
      const user = userEvent.setup()
      renderContactoForm()

      // WHEN the user fills all fields with valid values and submits
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN the exact Spanish success toast copy is shown (R10, no paraphrasing)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Contacto creado correctamente')
      })
    })

    test('should invoke onSuccess after a successful create (so the host can close the dialog)', async () => {
      // GIVEN the backend accepts the create request
      const user = userEvent.setup()
      const { onSuccess } = renderContactoForm()

      // WHEN the user fills all fields and submits
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN onSuccess is called, letting the host container close the form
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })

    test('should disable the "Guardar" button while the create mutation is pending', async () => {
      // GIVEN the backend delays its response so the pending state is observable
      server.use(
        http.post(CONTACTOS_ENDPOINT, async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          return HttpResponse.json(validData, { status: 201 })
        }),
      )
      const user = userEvent.setup()
      renderContactoForm()

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

  describe('AC #5 - 400 backend validation error', () => {
    test('should display the backend field-level error message inline when the backend returns 400', async () => {
      // GIVEN the backend returns a 400 Problem Details validation error for nombre
      server.use(
        http.post(CONTACTOS_ENDPOINT, () =>
          HttpResponse.json(contactoValidationErrorProblemDetails, { status: 400 }),
        ),
      )
      const user = userEvent.setup()
      renderContactoForm()

      // WHEN the user fills all fields and submits
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))

      // THEN the backend-provided field-level message is rendered inline (AC #5)
      expect(await screen.findByText(contactoValidationErrorProblemDetails.errors.nombre[0])).toBeInTheDocument()
    })

    test('should keep the form open (not call onSuccess) when the backend returns 400', async () => {
      // GIVEN the backend returns a 400 Problem Details validation error
      server.use(
        http.post(CONTACTOS_ENDPOINT, () =>
          HttpResponse.json(contactoValidationErrorProblemDetails, { status: 400 }),
        ),
      )
      const user = userEvent.setup()
      const { onSuccess } = renderContactoForm()

      // WHEN the user fills all fields and submits
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText(contactoValidationErrorProblemDetails.errors.nombre[0])

      // THEN onSuccess (which the host uses to close the form) is never called (AC #5)
      expect(onSuccess).not.toHaveBeenCalled()
    })

    test('should keep the previously entered field values intact after a 400 (no data loss)', async () => {
      // GIVEN the backend returns a 400 Problem Details validation error
      server.use(
        http.post(CONTACTOS_ENDPOINT, () =>
          HttpResponse.json(contactoValidationErrorProblemDetails, { status: 400 }),
        ),
      )
      const user = userEvent.setup()
      renderContactoForm()

      // WHEN the user fills all fields and submits, hitting the 400
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText(contactoValidationErrorProblemDetails.errors.nombre[0])

      // THEN the entered values remain in the fields — no data loss (AC #5)
      expect(screen.getByLabelText(/^nombre$/i)).toHaveValue(validData.nombre)
      expect(screen.getByLabelText(/^cargo$/i)).toHaveValue(validData.cargo)
      expect(screen.getByLabelText(/tel[ée]fono/i)).toHaveValue(validData.telefono)
      expect(screen.getByLabelText(/^email$/i)).toHaveValue(validData.email)
    })

    test('should NOT show a generic toast for the 400 case (must render inline, not toast)', async () => {
      // GIVEN the backend returns a 400 Problem Details validation error
      server.use(
        http.post(CONTACTOS_ENDPOINT, () =>
          HttpResponse.json(contactoValidationErrorProblemDetails, { status: 400 }),
        ),
      )
      const { toast } = await import('siesa-ui-kit')
      const user = userEvent.setup()
      renderContactoForm()

      // WHEN the user fills all fields and submits, hitting the 400
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText(contactoValidationErrorProblemDetails.errors.nombre[0])

      // THEN no error toast is fired for this specific case — it's rendered inline instead
      expect(toast.error).not.toHaveBeenCalled()
    })

    test('should NOT expose raw Problem Details JSON or technical details in the rendered error (NFR6)', async () => {
      // GIVEN the backend returns a 400 Problem Details validation error
      server.use(
        http.post(CONTACTOS_ENDPOINT, () =>
          HttpResponse.json(contactoValidationErrorProblemDetails, { status: 400 }),
        ),
      )
      const user = userEvent.setup()
      renderContactoForm()

      // WHEN the user fills all fields and submits, hitting the 400
      await fillForm(user)
      await user.click(screen.getByRole('button', { name: /guardar/i }))
      await screen.findByText(contactoValidationErrorProblemDetails.errors.nombre[0])

      // THEN no raw technical Problem Details fields leak into the rendered UI (NFR6)
      expect(screen.queryByText(/one or more validation errors occurred/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/stacktrace/i)).not.toBeInTheDocument()
    })
  })
})
