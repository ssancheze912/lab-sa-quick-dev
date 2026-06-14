/**
 * Story 2.3: Create Client — Component Tests (RED PHASE)
 *
 * Tests are written BEFORE implementation. They will fail because:
 * - ClienteForm component does not exist yet
 *   (frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx)
 * - useCreateCliente hook does not exist yet
 * - clienteApiRepository.create method does not exist yet
 *
 * Acceptance Criteria covered:
 *   AC#2 — Valid submission calls POST /api/v1/clientes and triggers onSuccess
 *   AC#3 — Empty required fields show inline errors and block network call (TC-E2-P0-04)
 *   AC#4 — 409 duplicate NIT maps to inline error on NIT field
 *   AC#5 — "Cancelar" calls onCancel without making any API call
 *
 * Test cases from test-design-epic-2.md:
 *   TC-E2-P0-04: Frontend Form — Each Required Field Shows Inline Error When Empty
 *   TC-E2-P1-09: Create Client Form Submits and New Client Appears in List
 */

import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// RED: These imports will fail until implementation exists.
// Expected failures: "Cannot find module '../ClienteForm'"
import { ClienteForm } from '../ClienteForm'
import { createCliente, resetClienteFactory } from '../../../../test/factories/cliente.factory'

// ─── MSW Server Setup (network-first: intercept before any render) ────────────

const API_BASE = 'http://localhost:5000'

const newCliente = createCliente({
  id: 'new-uuid-2-3',
  nombre: 'Empresa Test',
  nit: '123456789-0',
  telefono: '3001234567',
  ciudad: 'Cali',
})

const server = setupServer(
  // Default happy-path handler: POST creates client and returns 201
  http.post(`${API_BASE}/api/v1/clientes`, () =>
    HttpResponse.json(newCliente, { status: 201 })
  )
)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => {
  server.resetHandlers()
  resetClienteFactory()
})
afterAll(() => server.close())

// ─── Test Wrapper ──────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

// ─── AC#2: Valid form submission ───────────────────────────────────────────────

describe('ClienteForm — AC#2: valid submission (TC-E2-P1-09)', () => {
  it('submit_WithAllValidFields_CallsOnSuccess', async () => {
    // GIVEN: ClienteForm rendered with MSW ready (POST → 201)
    const onSuccess = vi.fn()
    renderWithProviders(<ClienteForm onSuccess={onSuccess} />)

    // WHEN: user fills all required fields
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Test')
    await userEvent.type(screen.getByTestId('input-nit'), '123456789-0')
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567')
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Cali')

    // AND: clicks "Guardar"
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: onSuccess callback is called
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('submit_WithAllValidFields_MakesPOSTRequest', async () => {
    // GIVEN: MSW intercepts POST and tracks it
    let postCalled = false
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        postCalled = true
        return HttpResponse.json(newCliente, { status: 201 })
      })
    )

    renderWithProviders(<ClienteForm />)

    // WHEN: user fills valid data and submits
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Test')
    await userEvent.type(screen.getByTestId('input-nit'), '123456789-0')
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567')
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Cali')
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: POST request was made
    await waitFor(() => expect(postCalled).toBe(true))
  })

  it('submit_WhilePending_RendersGuardandoText', async () => {
    // GIVEN: POST handler is slow (keeps response pending)
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return HttpResponse.json(newCliente, { status: 201 })
      })
    )

    renderWithProviders(<ClienteForm />)

    // WHEN: user fills form and clicks submit
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Test')
    await userEvent.type(screen.getByTestId('input-nit'), '123456789-0')
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567')
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Cali')
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: submit button is disabled and shows "Guardando..." text while pending
    await waitFor(() =>
      expect(screen.getByTestId('btn-guardar')).toBeDisabled()
    )
    expect(screen.getByTestId('btn-guardar')).toHaveTextContent('Guardando...')
  })
})

// ─── AC#3: Empty fields → inline errors, no POST (TC-E2-P0-04) ───────────────

describe('ClienteForm — AC#3: empty field validation (TC-E2-P0-04)', () => {
  it('submit_WithAllFieldsEmpty_ShowsInlineErrorForNombre', async () => {
    // GIVEN: form is empty; MSW should NOT be called
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        throw new Error('POST should NOT be called when fields are empty')
      })
    )

    renderWithProviders(<ClienteForm />)

    // WHEN: user clicks "Guardar" without filling anything
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: inline error for Nombre appears
    await waitFor(() =>
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
    )
  })

  it('submit_WithAllFieldsEmpty_ShowsInlineErrorForNit', async () => {
    // GIVEN: form is empty
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        throw new Error('POST should NOT be called when fields are empty')
      })
    )

    renderWithProviders(<ClienteForm />)

    // WHEN: user clicks "Guardar" without filling anything
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: inline error for NIT/RUC appears
    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC es requerido')).toBeInTheDocument()
    )
  })

  it('submit_WithAllFieldsEmpty_ShowsInlineErrorForTelefono', async () => {
    // GIVEN: form is empty
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        throw new Error('POST should NOT be called when fields are empty')
      })
    )

    renderWithProviders(<ClienteForm />)

    // WHEN: user clicks "Guardar" without filling anything
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: inline error for Teléfono appears
    await waitFor(() =>
      expect(screen.getByText('El teléfono es requerido')).toBeInTheDocument()
    )
  })

  it('submit_WithAllFieldsEmpty_ShowsInlineErrorForCiudad', async () => {
    // GIVEN: form is empty
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        throw new Error('POST should NOT be called when fields are empty')
      })
    )

    renderWithProviders(<ClienteForm />)

    // WHEN: user clicks "Guardar" without filling anything
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: inline error for Ciudad appears
    await waitFor(() =>
      expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument()
    )
  })

  it('submit_WithOnlyNombreEmpty_ShowsNombreErrorOnly', async () => {
    // GIVEN: only Nombre is empty; all others are filled
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        throw new Error('POST should NOT be called')
      })
    )

    renderWithProviders(<ClienteForm />)

    await userEvent.type(screen.getByTestId('input-nit'), '900000001-1')
    await userEvent.type(screen.getByTestId('input-telefono'), '3001111111')
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá')

    // WHEN: submits without Nombre
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: only Nombre error appears
    await waitFor(() =>
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument()
    )

    // AND: no errors for the other fields
    expect(screen.queryByText('El NIT/RUC es requerido')).not.toBeInTheDocument()
    expect(screen.queryByText('El teléfono es requerido')).not.toBeInTheDocument()
    expect(screen.queryByText('La ciudad es requerida')).not.toBeInTheDocument()
  })

  it('submit_WithOnlyNitEmpty_ShowsNitErrorOnly', async () => {
    // GIVEN: only NIT is empty; all others are filled
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        throw new Error('POST should NOT be called')
      })
    )

    renderWithProviders(<ClienteForm />)

    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Test')
    await userEvent.type(screen.getByTestId('input-telefono'), '3001111112')
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá')

    // WHEN: submits without NIT
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: only NIT error appears
    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC es requerido')).toBeInTheDocument()
    )

    // AND: no errors for the other fields
    expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument()
    expect(screen.queryByText('El teléfono es requerido')).not.toBeInTheDocument()
    expect(screen.queryByText('La ciudad es requerida')).not.toBeInTheDocument()
  })

  it('submit_WithOnlyTelefonoEmpty_ShowsTelefonoErrorOnly', async () => {
    // GIVEN: only Teléfono is empty
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        throw new Error('POST should NOT be called')
      })
    )

    renderWithProviders(<ClienteForm />)

    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Test')
    await userEvent.type(screen.getByTestId('input-nit'), '900000002-2')
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá')

    // WHEN: submits without Teléfono
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: only Teléfono error appears
    await waitFor(() =>
      expect(screen.getByText('El teléfono es requerido')).toBeInTheDocument()
    )

    expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument()
    expect(screen.queryByText('El NIT/RUC es requerido')).not.toBeInTheDocument()
    expect(screen.queryByText('La ciudad es requerida')).not.toBeInTheDocument()
  })

  it('submit_WithOnlyCiudadEmpty_ShowsCiudadErrorOnly', async () => {
    // GIVEN: only Ciudad is empty
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        throw new Error('POST should NOT be called')
      })
    )

    renderWithProviders(<ClienteForm />)

    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Test')
    await userEvent.type(screen.getByTestId('input-nit'), '900000003-3')
    await userEvent.type(screen.getByTestId('input-telefono'), '3001111113')

    // WHEN: submits without Ciudad
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: only Ciudad error appears
    await waitFor(() =>
      expect(screen.getByText('La ciudad es requerida')).toBeInTheDocument()
    )

    expect(screen.queryByText('El nombre es requerido')).not.toBeInTheDocument()
    expect(screen.queryByText('El NIT/RUC es requerido')).not.toBeInTheDocument()
    expect(screen.queryByText('El teléfono es requerido')).not.toBeInTheDocument()
  })

  it('submit_WithEmptyFields_InlineErrorHasRoleAlert', async () => {
    // GIVEN: form is empty
    renderWithProviders(<ClienteForm />)

    // WHEN: submits
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: error elements have role="alert" for WCAG 2.1 AA (AC#3, accessibility)
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert')
      expect(alerts.length).toBeGreaterThanOrEqual(1)
    })
  })
})

// ─── AC#4: 409 duplicate NIT → inline error on NIT field ─────────────────────

describe('ClienteForm — AC#4: 409 conflict maps to NIT field error', () => {
  it('submit_WithDuplicateNit_ShowsInlineNitError', async () => {
    // GIVEN: MSW returns 409 for the POST request
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(
          { title: 'El NIT/RUC ya está registrado.', status: 409 },
          { status: 409 }
        )
      )
    )

    renderWithProviders(<ClienteForm />)

    // WHEN: user fills form with a duplicate NIT and submits
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa')
    await userEvent.type(screen.getByTestId('input-nit'), '900123456-7')
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567')
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá')
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: inline error "El NIT/RUC ya está registrado" appears
    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    )
  })

  it('submit_WithDuplicateNit_DoesNotShowGenericToastError', async () => {
    // GIVEN: MSW returns 409
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(
          { title: 'El NIT/RUC ya está registrado.', status: 409 },
          { status: 409 }
        )
      )
    )

    renderWithProviders(<ClienteForm />)

    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa')
    await userEvent.type(screen.getByTestId('input-nit'), '900123456-7')
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567')
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá')
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: no generic "No se pudo guardar" error toast appears for 409
    // (409 conflict is surfaced as field-level error only)
    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    )
    expect(screen.queryByText('No se pudo guardar. Intenta de nuevo.')).not.toBeInTheDocument()
  })

  it('submit_WithDuplicateNit_DoesNotExposeTechnicalDetails (NFR6)', async () => {
    // GIVEN: MSW returns 409 without stack trace
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () =>
        HttpResponse.json(
          { title: 'El NIT/RUC ya está registrado.', status: 409 },
          { status: 409 }
        )
      )
    )

    renderWithProviders(<ClienteForm />)

    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa')
    await userEvent.type(screen.getByTestId('input-nit'), '900123456-7')
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567')
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá')
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: no stack trace or exception text rendered in UI
    await waitFor(() =>
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    )
    expect(screen.queryByText(/exception/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stacktrace/i)).not.toBeInTheDocument()
  })
})

// ─── AC#5: "Cancelar" closes form without API call ───────────────────────────

describe('ClienteForm — AC#5: cancel closes form without mutation', () => {
  it('clickCancel_CallsOnCancel', async () => {
    // GIVEN: ClienteForm rendered with onCancel spy
    const onCancel = vi.fn()

    // MSW should NOT be called
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        throw new Error('POST should NOT be called on cancel')
      })
    )

    renderWithProviders(<ClienteForm onCancel={onCancel} />)

    // WHEN: user clicks "Cancelar"
    await userEvent.click(screen.getByTestId('btn-cancelar'))

    // THEN: onCancel is called
    expect(onCancel).toHaveBeenCalled()
  })

  it('clickCancel_WithFilledFields_DoesNotMakeApiCall', async () => {
    // GIVEN: user fills all fields but clicks cancel
    let postCalled = false
    server.use(
      http.post(`${API_BASE}/api/v1/clientes`, () => {
        postCalled = true
        return HttpResponse.json(newCliente, { status: 201 })
      })
    )

    renderWithProviders(<ClienteForm onCancel={vi.fn()} />)

    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Cancel')
    await userEvent.type(screen.getByTestId('input-nit'), '900000099-9')
    await userEvent.type(screen.getByTestId('input-telefono'), '3009999999')
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Cali')

    // WHEN: user clicks "Cancelar" (not "Guardar")
    await userEvent.click(screen.getByTestId('btn-cancelar'))

    // THEN: no POST request was made
    expect(postCalled).toBe(false)
  })

  it('clickCancel_CancelButtonHasTypeButton', () => {
    // GIVEN: ClienteForm is rendered
    renderWithProviders(<ClienteForm />)

    // THEN: "Cancelar" button has type="button" (not "submit") so it doesn't trigger form submit
    const cancelBtn = screen.getByTestId('btn-cancelar')
    expect(cancelBtn).toHaveAttribute('type', 'button')
  })
})

// ─── Accessibility (WCAG 2.1 AA requirements) ─────────────────────────────────

describe('ClienteForm — Accessibility (WCAG 2.1 AA)', () => {
  it('inputs have id matching label htmlFor', () => {
    // GIVEN: form is rendered
    renderWithProviders(<ClienteForm />)

    // THEN: each input has an id and a corresponding label uses htmlFor
    const nombreInput = screen.getByTestId('input-nombre')
    const nitInput = screen.getByTestId('input-nit')
    const telefonoInput = screen.getByTestId('input-telefono')
    const ciudadInput = screen.getByTestId('input-ciudad')

    expect(nombreInput).toHaveAttribute('id')
    expect(nitInput).toHaveAttribute('id')
    expect(telefonoInput).toHaveAttribute('id')
    expect(ciudadInput).toHaveAttribute('id')
  })

  it('inputs have aria-invalid=false when no error', () => {
    // GIVEN: form is rendered with no errors yet
    renderWithProviders(<ClienteForm />)

    // THEN: aria-invalid is false/absent on all fields
    const nombreInput = screen.getByTestId('input-nombre')
    const nitInput = screen.getByTestId('input-nit')
    const telefonoInput = screen.getByTestId('input-telefono')
    const ciudadInput = screen.getByTestId('input-ciudad')

    expect(nombreInput).not.toHaveAttribute('aria-invalid', 'true')
    expect(nitInput).not.toHaveAttribute('aria-invalid', 'true')
    expect(telefonoInput).not.toHaveAttribute('aria-invalid', 'true')
    expect(ciudadInput).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('inputs have aria-invalid=true when field has error', async () => {
    // GIVEN: form submitted empty
    renderWithProviders(<ClienteForm />)
    await userEvent.click(screen.getByTestId('btn-guardar'))

    // THEN: inputs with errors have aria-invalid="true"
    await waitFor(() => {
      expect(screen.getByTestId('input-nombre')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByTestId('input-nit')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByTestId('input-telefono')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByTestId('input-ciudad')).toHaveAttribute('aria-invalid', 'true')
    })
  })
})

// ─── Form structure and data-testid presence ─────────────────────────────────

describe('ClienteForm — Structure and data-testid attributes', () => {
  it('renders the form element with data-testid="cliente-form"', () => {
    // GIVEN: form is rendered
    renderWithProviders(<ClienteForm />)

    // THEN: form element has data-testid="cliente-form"
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument()
  })

  it('renders Guardar button with data-testid="btn-guardar"', () => {
    renderWithProviders(<ClienteForm />)
    expect(screen.getByTestId('btn-guardar')).toBeInTheDocument()
  })

  it('renders Cancelar button with data-testid="btn-cancelar"', () => {
    renderWithProviders(<ClienteForm />)
    expect(screen.getByTestId('btn-cancelar')).toBeInTheDocument()
  })

  it('renders all 4 input fields with correct data-testid attributes', () => {
    renderWithProviders(<ClienteForm />)
    expect(screen.getByTestId('input-nombre')).toBeInTheDocument()
    expect(screen.getByTestId('input-nit')).toBeInTheDocument()
    expect(screen.getByTestId('input-telefono')).toBeInTheDocument()
    expect(screen.getByTestId('input-ciudad')).toBeInTheDocument()
  })

  it('Guardar button has type="submit"', () => {
    renderWithProviders(<ClienteForm />)
    expect(screen.getByTestId('btn-guardar')).toHaveAttribute('type', 'submit')
  })
})
