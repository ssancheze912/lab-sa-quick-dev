/**
 * Story 2.2 — ATDD (RED phase).
 *
 * Covers the `ClienteNotFound` shared component contract from Task 5:
 *   - AC #3 — exact Spanish title "Cliente no encontrado" and subtitle
 *             "El cliente que buscas no existe o fue eliminado." are rendered.
 *   - AC #3 — the container has `role="status"` and `aria-live="polite"` so
 *             screen readers announce the state change (routine "no data"
 *             state — NOT `role="alert"`).
 *   - AC #3 — a "Volver a la lista" button invokes the `onBackToList` prop
 *             exactly once. The component itself does NOT know about
 *             `useNavigate` — the parent wires the callback (keeps the
 *             component pure and testable without a router provider).
 *
 * RED until `src/shared/components/ClienteNotFound.tsx` exists.
 */
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ClienteNotFound } from './ClienteNotFound'

describe('ClienteNotFound (AC #3 / #4)', () => {
  it('renders the exact Spanish title "Cliente no encontrado"', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    expect(screen.getByText('Cliente no encontrado')).toBeInTheDocument()
  })

  it('renders the exact Spanish subtitle "El cliente que buscas no existe o fue eliminado."', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    expect(
      screen.getByText('El cliente que buscas no existe o fue eliminado.'),
    ).toBeInTheDocument()
  })

  it('renders a container with role="status" (routine no-data state, NOT alert)', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('sets aria-live="polite" on the container so screen readers announce it', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('exposes a Spanish button labelled "Volver a la lista"', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    expect(
      screen.getByRole('button', { name: /volver a la lista/i }),
    ).toBeInTheDocument()
  })

  it('GIVEN a click on "Volver a la lista", THEN onBackToList is invoked exactly once', () => {
    const onBackToList = vi.fn()
    render(<ClienteNotFound onBackToList={onBackToList} />)

    fireEvent.click(screen.getByRole('button', { name: /volver a la lista/i }))

    expect(onBackToList).toHaveBeenCalledTimes(1)
  })

  it('does NOT render a raw error object or stack trace (NFR6)', () => {
    render(<ClienteNotFound onBackToList={vi.fn()} />)
    expect(screen.queryByText(/exception/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument()
  })
})
