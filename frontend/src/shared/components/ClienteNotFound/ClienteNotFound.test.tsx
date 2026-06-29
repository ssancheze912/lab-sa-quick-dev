/**
 * Story 2.2 — ClienteNotFound shared component ATDD (RED phase).
 *
 * Acceptance Criteria covered:
 *   AC #6 — Graceful not-found state with exact Spanish copy, single
 *           "Volver a la lista" CTA, role=status / aria-live=polite,
 *           NO error object accepted (NFR6 contract identical to ErrorPanel).
 *
 * MUST fail until shared/components/ClienteNotFound/ClienteNotFound.tsx exists.
 */
import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ClienteNotFound } from './ClienteNotFound'

describe('ClienteNotFound — Story 2.2 ATDD', () => {
  // ─── AC #6 — exact Spanish copy ──────────────────────────────────────
  test('AC #6 — renders the spec-mandated Spanish title and subtitle', () => {
    // GIVEN/WHEN: ClienteNotFound rendered
    render(<ClienteNotFound onBackToList={() => {}} />)

    // THEN: exact Spanish title and subtitle are visible
    expect(screen.getByText('Cliente no encontrado')).toBeInTheDocument()
    expect(
      screen.getByText('El cliente que buscas no existe o fue eliminado')
    ).toBeInTheDocument()
  })

  // ─── AC #6 — data-testid + a11y region ───────────────────────────────
  test('AC #6 — root container exposes data-testid="cliente-not-found", role=status, aria-live=polite', () => {
    render(<ClienteNotFound onBackToList={() => {}} />)

    const root = screen.getByTestId('cliente-not-found')
    expect(root).toBeInTheDocument()
    expect(root).toHaveAttribute('role', 'status')
    expect(root).toHaveAttribute('aria-live', 'polite')
  })

  // ─── AC #6 — single CTA "Volver a la lista" ──────────────────────────
  test('AC #6 — renders a single "Volver a la lista" button', () => {
    render(<ClienteNotFound onBackToList={() => {}} />)

    const buttons = screen.getAllByRole('button', { name: 'Volver a la lista' })
    expect(buttons).toHaveLength(1)
  })

  // ─── AC #6 — CTA fires onBackToList exactly once on click ───────────
  test('AC #6 — clicking "Volver a la lista" fires onBackToList exactly once', async () => {
    const onBackToList = vi.fn()
    const user = userEvent.setup()

    render(<ClienteNotFound onBackToList={onBackToList} />)
    await user.click(screen.getByRole('button', { name: 'Volver a la lista' }))

    expect(onBackToList).toHaveBeenCalledTimes(1)
  })

  // ─── NFR6 — does NOT accept an error object (contract identical to ErrorPanel) ─
  test('NFR6 — receives only { onBackToList } (no error prop) — DOM cannot leak technical detail', () => {
    // GIVEN/WHEN: rendered with the only allowed prop
    const { container } = render(<ClienteNotFound onBackToList={() => {}} />)

    // THEN: forbidden substrings are absent
    const html = container.innerHTML
    expect(html).not.toContain('404')
    expect(html).not.toContain('about:blank')
    expect(html).not.toContain('section-6.5.4')
    expect(html).not.toContain('ClienteEntity')
  })
})
