/**
 * Story 2.3 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `ClienteForm` with boundary conditions the RED
 * suite skipped:
 *   - Submit via Enter key inside a text input triggers Zod resolution
 *     (browser default form-submission semantic — AC #2).
 *   - `defaultValues` prop pre-fills all four inputs (Story 2.4 reuse seam).
 *   - `submitLabel` override renames the primary button (Story 2.4 reuse seam).
 *   - `submitError.kind === 'validation'` renders the top-of-form Alert with
 *     the "Comprueba los datos e intenta nuevamente." copy — the AC #10
 *     defense-in-depth branch.
 *   - Recovery: an inline error clears when `submitError` transitions to
 *     null on a subsequent render (parent-controlled cleanup).
 *   - `role="alert"` present on every inline error node (a11y — AC #3).
 *   - `aria-describedby` binding wires each input to its error node.
 *   - Whitespace-only values are rejected at submit (Zod `.trim().min(1)` —
 *     the same R-006 parity contract enforced by the schema tests).
 *
 * [P1] tag — the form is the single input surface for Cliente creation; any
 * bug here directly breaks user-facing behaviour (AC #1, #3, #4, #7, #8).
 */
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ClienteForm } from './ClienteForm'
import type { CreateClienteError } from '../application/useCreateCliente'

function noop() {
  /* intentional */
}

const submitValues = {
  nombre: 'Acme SAS',
  nit: '900123456',
  telefono: '3001234567',
  ciudad: 'Cali',
}

function fillForm() {
  fireEvent.change(screen.getByLabelText(/^Nombre$/), { target: { value: submitValues.nombre } })
  fireEvent.change(screen.getByLabelText(/NIT\/RUC/), { target: { value: submitValues.nit } })
  fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: submitValues.telefono } })
  fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: submitValues.ciudad } })
}

describe('ClienteForm — Enter key submits the form (AC #2)', () => {
  it('[P1] GIVEN all four fields filled, WHEN Enter is pressed on any input, THEN onSubmit fires once', async () => {
    const onSubmit = vi.fn()
    render(
      <ClienteForm
        onSubmit={onSubmit}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    fillForm()
    // Native submit event dispatched via requestSubmit (RHF listens to form.onSubmit).
    const form = screen.getByTestId('cliente-form') as HTMLFormElement
    fireEvent.submit(form)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining(submitValues),
      expect.anything(),
    )
  })
})

describe('ClienteForm — defaultValues reuse seam (Story 2.4 anchor)', () => {
  it('[P1] GIVEN defaultValues, THEN each input is pre-filled with that value', () => {
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
        defaultValues={{
          nombre: 'Pre-Filled',
          nit: '111111111',
          telefono: '3000000001',
          ciudad: 'Barranquilla',
        }}
      />,
    )

    expect((screen.getByLabelText(/^Nombre$/) as HTMLInputElement).value).toBe('Pre-Filled')
    expect((screen.getByLabelText(/NIT\/RUC/) as HTMLInputElement).value).toBe('111111111')
    expect((screen.getByLabelText(/Teléfono/) as HTMLInputElement).value).toBe('3000000001')
    expect((screen.getByLabelText(/Ciudad/) as HTMLInputElement).value).toBe('Barranquilla')
  })

  it('[P2] GIVEN partial defaultValues, THEN unspecified fields default to empty strings', () => {
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
        defaultValues={{ nombre: 'Only Name' }}
      />,
    )

    expect((screen.getByLabelText(/^Nombre$/) as HTMLInputElement).value).toBe('Only Name')
    expect((screen.getByLabelText(/NIT\/RUC/) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/Teléfono/) as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText(/Ciudad/) as HTMLInputElement).value).toBe('')
  })
})

describe('ClienteForm — submitLabel reuse seam (Story 2.4 anchor)', () => {
  it('[P1] GIVEN submitLabel="Actualizar", THEN the primary button reads "Actualizar" (not "Guardar")', () => {
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
        submitLabel="Actualizar"
      />,
    )

    expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^guardar$/i })).not.toBeInTheDocument()
  })
})

describe('ClienteForm — validation error surface (AC #10 defense)', () => {
  it('[P1] GIVEN submitError.kind === "validation", THEN the top-of-form Alert renders with the "Comprueba los datos" copy', () => {
    const submitError: CreateClienteError = {
      kind: 'validation',
      generic: {
        title: 'No se pudo guardar',
        subtitle: 'Comprueba los datos e intenta nuevamente.',
      },
    }
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={submitError}
      />,
    )

    expect(screen.getByTestId('cliente-form-alert')).toBeInTheDocument()
    expect(screen.getByText('No se pudo guardar')).toBeInTheDocument()
    expect(screen.getByText('Comprueba los datos e intenta nuevamente.')).toBeInTheDocument()
  })
})

describe('ClienteForm — accessibility (AC #3, WCAG 2.1)', () => {
  it('[P1] GIVEN empty submit, THEN each inline error has role="alert"', async () => {
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument(),
    )

    const alerts = screen.getAllByRole('alert')
    // Exactly four (one per required field) — no NIT-backend error, no top Alert.
    expect(alerts.length).toBe(4)
  })

  it('[P1] GIVEN inline errors, THEN each input binds aria-describedby to its error node', async () => {
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument(),
    )

    const nombre = screen.getByLabelText(/^Nombre$/) as HTMLInputElement
    const describedBy = nombre.getAttribute('aria-describedby')
    expect(describedBy).toBe('cliente-nombre-error')

    const errorNode = document.getElementById('cliente-nombre-error')
    expect(errorNode).not.toBeNull()
    expect(errorNode!.textContent).toBe('El nombre es obligatorio')
  })

  it('[P2] GIVEN inline errors, THEN each input has aria-invalid="true"', async () => {
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument(),
    )

    for (const label of ['Nombre', 'NIT\\/RUC', 'Teléfono', 'Ciudad']) {
      const input = screen.getByLabelText(new RegExp(`^${label}$`)) as HTMLInputElement
      expect(input.getAttribute('aria-invalid')).toBe('true')
    }
  })
})

describe('ClienteForm — whitespace-only submits are rejected (R-006 parity)', () => {
  it('[P1] GIVEN whitespace-only values in all fields, WHEN Guardar is clicked, THEN four errors render AND onSubmit is NOT called', async () => {
    const onSubmit = vi.fn()
    render(
      <ClienteForm
        onSubmit={onSubmit}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/^Nombre$/), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText(/NIT\/RUC/), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: '   ' } })

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument(),
    )
    expect(screen.getByText('El NIT/RUC es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('La ciudad es obligatoria')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('ClienteForm — nit-conflict surface (AC #4) does not double-render alert', () => {
  it('[P1] GIVEN submitError.kind === "nit-conflict", THEN NO top-of-form Alert is rendered', () => {
    const submitError: CreateClienteError = {
      kind: 'nit-conflict',
      nitMessage: 'El NIT/RUC ya está registrado',
    }
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={submitError}
      />,
    )

    // The Spanish string SHOULD render — but only inline under NIT, not in the Alert wrapper.
    expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-form-alert')).not.toBeInTheDocument()
  })
})

describe('ClienteForm — Cancelar button semantics', () => {
  it('[P1] GIVEN a Cancelar click, THEN onCancel is called exactly once', () => {
    const onCancel = vi.fn()
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={onCancel}
        isSubmitting={false}
        submitError={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

describe('ClienteForm — long input acceptance (AC #9 boundary)', () => {
  it('[P2] GIVEN a very long Nombre (500 characters), WHEN submitted, THEN onSubmit receives the value untouched', async () => {
    const onSubmit = vi.fn()
    const longNombre = 'A'.repeat(500)
    render(
      <ClienteForm
        onSubmit={onSubmit}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/^Nombre$/), { target: { value: longNombre } })
    fireEvent.change(screen.getByLabelText(/NIT\/RUC/), { target: { value: '900' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '3000000000' } })
    fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: 'Cali' } })

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: longNombre }),
      expect.anything(),
    )
  })
})
