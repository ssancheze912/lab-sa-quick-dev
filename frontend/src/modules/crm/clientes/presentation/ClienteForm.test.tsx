/**
 * Story 2.3 — ATDD (RED phase).
 *
 * Component tests for `ClienteForm` (Task 7). Covers:
 *   - AC #1 — Four fields in exact vertical order with exact Spanish labels
 *             and the two action buttons (Cancelar, Guardar). Focus lands on
 *             Nombre on mount.
 *   - AC #3 — Zod validation on submit: empty submits render the four Spanish
 *             error strings under each field; onSubmit is NOT called.
 *   - AC #3 — reValidateMode 'onChange' clears an error as the user types.
 *   - AC #4 — When `submitError.kind === 'nit-conflict'`, the NIT inline error
 *             renders the backend Spanish message.
 *   - AC #7 — When `submitError.kind === 'network'`, the top-of-form Alert
 *             renders the exact Spanish copy; per-field errors NOT rendered.
 *   - AC #8 — `isSubmitting={true}` freezes the four inputs (readOnly),
 *             sets aria-busy on Guardar and disables it; Cancelar stays enabled.
 *
 * RED until:
 *   - `ClienteForm.tsx` exists and exposes the props described in Task 7.
 *   - `clienteSchema.ts` exists with the parity messages.
 */
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ClienteForm } from './ClienteForm'
import type { CreateClienteError } from '../application/useCreateCliente'

function noop() {
  /* intentional */
}

describe('ClienteForm — structure (AC #1)', () => {
  it('renders the four required fields in order with exact Spanish labels', () => {
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    const labels = screen.getAllByText(/^(Nombre|NIT\/RUC|Teléfono|Ciudad)$/)
    expect(labels.map((l) => l.textContent)).toEqual([
      'Nombre',
      'NIT/RUC',
      'Teléfono',
      'Ciudad',
    ])
  })

  it('renders "Cancelar" and "Guardar" action buttons', () => {
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
  })

  it('focuses the Nombre input on mount (WCAG focus-management)', () => {
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    const nombre = screen.getByLabelText(/^Nombre$/) as HTMLInputElement
    expect(document.activeElement).toBe(nombre)
  })
})

describe('ClienteForm — validation errors on submit (AC #3)', () => {
  it('GIVEN empty form, WHEN Guardar is clicked, THEN four Spanish errors render AND onSubmit is NOT called', async () => {
    const onSubmit = vi.fn()
    render(
      <ClienteForm
        onSubmit={onSubmit}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument(),
    )
    expect(screen.getByText('El NIT/RUC es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El teléfono es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('La ciudad es obligatoria')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('GIVEN a submit with errors, WHEN the user types into NIT, THEN the NIT error clears in real time (reValidateMode onChange)', async () => {
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
      expect(screen.getByText('El NIT/RUC es obligatorio')).toBeInTheDocument(),
    )

    const nitInput = screen.getByLabelText(/NIT\/RUC/) as HTMLInputElement
    fireEvent.change(nitInput, { target: { value: '900123456' } })

    await waitFor(() =>
      expect(screen.queryByText('El NIT/RUC es obligatorio')).not.toBeInTheDocument(),
    )
    // Other errors remain (unchanged fields).
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
  })

  it('GIVEN all four fields filled, WHEN Guardar is clicked, THEN onSubmit is called ONCE with the values', async () => {
    const onSubmit = vi.fn()
    render(
      <ClienteForm
        onSubmit={onSubmit}
        onCancel={noop}
        isSubmitting={false}
        submitError={null}
      />,
    )

    fireEvent.change(screen.getByLabelText(/^Nombre$/), { target: { value: 'Acme SAS' } })
    fireEvent.change(screen.getByLabelText(/NIT\/RUC/), { target: { value: '900123456' } })
    fireEvent.change(screen.getByLabelText(/Teléfono/), { target: { value: '3001234567' } })
    fireEvent.change(screen.getByLabelText(/Ciudad/), { target: { value: 'Cali' } })

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Acme SAS',
        nit: '900123456',
        telefono: '3001234567',
        ciudad: 'Cali',
      }),
      expect.anything(),
    )
  })
})

describe('ClienteForm — NIT backend error surface (AC #4)', () => {
  it('GIVEN submitError.kind === "nit-conflict", THEN the exact Spanish message renders inline under NIT AND no top alert appears', () => {
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

    expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument()
    expect(screen.queryByTestId('cliente-form-alert')).not.toBeInTheDocument()
  })
})

describe('ClienteForm — network error surface (AC #7)', () => {
  it('GIVEN submitError.kind === "network", THEN the top-of-form Alert renders the exact Spanish copy', () => {
    const submitError: CreateClienteError = {
      kind: 'network',
      generic: {
        title: 'No se pudo guardar',
        subtitle: 'Comprueba tu conexión e intenta nuevamente.',
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
    expect(screen.getByText('Comprueba tu conexión e intenta nuevamente.')).toBeInTheDocument()
  })
})

describe('ClienteForm — in-flight submit freezes the form (AC #8)', () => {
  it('GIVEN isSubmitting={true}, THEN four inputs are readOnly, Guardar is disabled + aria-busy, Cancelar stays enabled', () => {
    render(
      <ClienteForm
        onSubmit={vi.fn()}
        onCancel={noop}
        isSubmitting
        submitError={null}
      />,
    )

    for (const label of ['Nombre', 'NIT/RUC', 'Teléfono', 'Ciudad']) {
      const input = screen.getByLabelText(new RegExp(`^${label.replace('/', '\\/')}$`)) as HTMLInputElement
      expect(input.readOnly).toBe(true)
    }

    const guardar = screen.getByRole('button', { name: /guardar/i })
    expect(guardar).toBeDisabled()
    expect(guardar).toHaveAttribute('aria-busy', 'true')

    const cancelar = screen.getByRole('button', { name: /cancelar/i })
    expect(cancelar).not.toBeDisabled()
  })
})
