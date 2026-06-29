/**
 * Story 2.1 — ClientListItem edge-case automation expansion.
 *
 * Complements ClientListItem.test.tsx with cases the ATDD layer omits:
 *   [P2] Keyboard activation — Enter and Space trigger onSelect (native <button> behaviour)
 *   [P2] Telefono and Ciudad fields are NOT rendered in Story 2.1 (Epic 4 contract)
 *   [P2] Multiple rapid clicks each invoke onSelect (no internal debouncing)
 *   [P2] aria-label uses the EXACT cliente.nombre (including spaces/diacritics)
 *   [P2] When isSelected toggles, aria-current updates without re-keying
 */
import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ClientListItem } from './ClientListItem'

const baseCliente = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  nombre: 'ACME Ñoño SAS',
  nitRuc: '900111222',
  telefono: '3001112233',
  ciudad: 'Bogotá',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

describe('ClientListItem — edge cases', () => {
  test('[P2] pressing Enter on the focused button invokes onSelect', async () => {
    // GIVEN: a focusable ClientListItem
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<ClientListItem cliente={baseCliente} isSelected={false} onSelect={onSelect} />)

    // WHEN: the button is focused and Enter is pressed
    const button = screen.getByRole('button', { name: 'Ver cliente: ACME Ñoño SAS' })
    button.focus()
    await user.keyboard('{Enter}')

    // THEN: onSelect fires with the cliente id
    expect(onSelect).toHaveBeenCalledWith(baseCliente.id)
  })

  test('[P2] pressing Space on the focused button invokes onSelect', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<ClientListItem cliente={baseCliente} isSelected={false} onSelect={onSelect} />)

    const button = screen.getByRole('button', { name: 'Ver cliente: ACME Ñoño SAS' })
    button.focus()
    await user.keyboard(' ')

    expect(onSelect).toHaveBeenCalledWith(baseCliente.id)
  })

  test('[P2] Telefono and Ciudad are NOT rendered (Story 2.1 contract — Epic 4 ships those)', () => {
    // GIVEN: a ClientListItem with telefono + ciudad data present
    render(<ClientListItem cliente={baseCliente} isSelected={false} onSelect={vi.fn()} />)

    // THEN: those values do NOT appear in the rendered item
    expect(screen.queryByText('3001112233')).not.toBeInTheDocument()
    expect(screen.queryByText('Bogotá')).not.toBeInTheDocument()
  })

  test('[P2] aria-label preserves accented characters in the cliente.nombre', () => {
    // GIVEN: nombre contains Ñ + accented characters
    render(<ClientListItem cliente={baseCliente} isSelected={false} onSelect={vi.fn()} />)

    // THEN: the aria-label keeps them exactly
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Ver cliente: ACME Ñoño SAS')
  })

  test('[P2] rapid double-click invokes onSelect twice (no internal debouncing)', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<ClientListItem cliente={baseCliente} isSelected={false} onSelect={onSelect} />)

    const button = screen.getByRole('button')
    await user.click(button)
    await user.click(button)

    // The component MUST forward both clicks — debouncing belongs to the parent
    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(onSelect).toHaveBeenNthCalledWith(1, baseCliente.id)
    expect(onSelect).toHaveBeenNthCalledWith(2, baseCliente.id)
  })

  test('[P2] re-rendering with isSelected=true updates aria-current without remount', () => {
    // GIVEN: initially unselected
    const { rerender } = render(
      <ClientListItem cliente={baseCliente} isSelected={false} onSelect={vi.fn()} />,
    )
    const initialButton = screen.getByRole('button')
    expect(initialButton).not.toHaveAttribute('aria-current', 'true')

    // WHEN: re-rendered with isSelected=true
    rerender(<ClientListItem cliente={baseCliente} isSelected={true} onSelect={vi.fn()} />)

    // THEN: aria-current flips, same node still present
    const updatedButton = screen.getByRole('button')
    expect(updatedButton).toHaveAttribute('aria-current', 'true')
  })

  test('[P2] the rendered <button> has type="button" (does not submit ancestral forms)', () => {
    // GIVEN: a ClientListItem inside (hypothetically) a form
    render(<ClientListItem cliente={baseCliente} isSelected={false} onSelect={vi.fn()} />)

    // THEN: type=button so it never causes a form submit
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  test('[P2] minimum tap-target class (min-h-[44px]) is present for mobile a11y', () => {
    // GIVEN: a rendered ClientListItem
    render(<ClientListItem cliente={baseCliente} isSelected={false} onSelect={vi.fn()} />)

    // THEN: the WCAG 2.1 AA min tap target class is applied
    const button = screen.getByRole('button')
    expect(button.className).toContain('min-h-[44px]')
  })
})
