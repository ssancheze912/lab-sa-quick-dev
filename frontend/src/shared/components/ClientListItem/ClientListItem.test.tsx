/**
 * Story 2.1 — Client List & Search — ClientListItem ATDD (RED phase).
 *
 * Acceptance criterion covered:
 *   AC #3 — Each list item shows Nombre + NIT/RUC, is reachable as a <button>
 *            with role + aria-label, and exposes a data-testid for tests.
 *
 * MUST fail until shared/components/ClientListItem/ClientListItem.tsx exists.
 */
import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ClientListItem } from './ClientListItem'

const cliente = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'ACME Solutions SAS',
  nitRuc: '900111222',
  telefono: '3001112233',
  ciudad: 'Bogotá',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

describe('ClientListItem — visual + a11y contract', () => {
  test('renders Nombre and NIT/RUC visibly', () => {
    // GIVEN: a ClientListItem with a real cliente
    render(<ClientListItem cliente={cliente} isSelected={false} onSelect={vi.fn()} />)

    // THEN: both name and NIT are visible
    expect(screen.getByText('ACME Solutions SAS')).toBeInTheDocument()
    expect(screen.getByText('900111222')).toBeInTheDocument()
  })

  test('is rendered as a <button> with descriptive aria-label', () => {
    // GIVEN: a ClientListItem
    render(<ClientListItem cliente={cliente} isSelected={false} onSelect={vi.fn()} />)

    // THEN: the element is a button, reachable by aria-label
    const button = screen.getByRole('button', { name: 'Ver cliente: ACME Solutions SAS' })
    expect(button.tagName).toBe('BUTTON')
  })

  test('exposes data-testid="client-list-item-{id}"', () => {
    // GIVEN: a ClientListItem
    render(<ClientListItem cliente={cliente} isSelected={false} onSelect={vi.fn()} />)

    // THEN: the testid is namespaced with the cliente id
    expect(
      screen.getByTestId('client-list-item-11111111-1111-1111-1111-111111111111')
    ).toBeInTheDocument()
  })

  test('clicking the item calls onSelect with the cliente id', async () => {
    // GIVEN: an onSelect spy
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<ClientListItem cliente={cliente} isSelected={false} onSelect={onSelect} />)

    // WHEN: the user clicks the item
    await user.click(screen.getByRole('button', { name: 'Ver cliente: ACME Solutions SAS' }))

    // THEN: onSelect fires with the id
    expect(onSelect).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111')
  })

  test('when isSelected=true, aria-current is "true"', () => {
    // GIVEN: a selected ClientListItem
    render(<ClientListItem cliente={cliente} isSelected={true} onSelect={vi.fn()} />)

    // THEN: aria-current reflects selection
    expect(
      screen.getByRole('button', { name: 'Ver cliente: ACME Solutions SAS' })
    ).toHaveAttribute('aria-current', 'true')
  })

  test('when isSelected=false, aria-current is absent', () => {
    // GIVEN: a non-selected ClientListItem
    render(<ClientListItem cliente={cliente} isSelected={false} onSelect={vi.fn()} />)

    // THEN: aria-current is NOT present (or explicitly false)
    expect(
      screen.getByRole('button', { name: 'Ver cliente: ACME Solutions SAS' })
    ).not.toHaveAttribute('aria-current', 'true')
  })
})
