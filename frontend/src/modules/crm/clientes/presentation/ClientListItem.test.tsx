import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientListItem } from './ClientListItem'
import { makeCliente } from '@/test/factories/clienteFactory'

describe('ClientListItem', () => {
  const cliente = makeCliente({
    id: 'abc',
    nombre: 'Acme Corp',
    nit: '900123456-7',
  })

  it('renders Nombre and NIT', () => {
    render(<ClientListItem cliente={cliente} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('900123456-7')).toBeInTheDocument()
  })

  it('exposes role="button" and an accessible name including Nombre', () => {
    render(<ClientListItem cliente={cliente} />)
    const item = screen.getByRole('button', { name: /Ver cliente: Acme Corp/i })
    expect(item).toBeInTheDocument()
    expect(item).toHaveAttribute('data-testid', 'cliente-list-item')
  })

  it('invokes onSelect on click', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ClientListItem cliente={cliente} onSelect={onSelect} />)

    await user.click(screen.getByTestId('cliente-list-item'))
    expect(onSelect).toHaveBeenCalledWith('abc')
  })

  it('invokes onSelect on Enter and Space keydown', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ClientListItem cliente={cliente} onSelect={onSelect} />)

    const item = screen.getByTestId('cliente-list-item')
    item.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(onSelect).toHaveBeenCalledTimes(2)
  })

  it('reflects the selected state via aria-pressed and background classes', () => {
    render(<ClientListItem cliente={cliente} isSelected />)
    const item = screen.getByTestId('cliente-list-item')
    expect(item).toHaveAttribute('aria-pressed', 'true')
    expect(item.className).toMatch(/#0e79fd/)
  })

  // ───────────────────────────────────────────────────────────────────────
  // Edge cases / expansions (Story 2.1 automate pass)
  // ───────────────────────────────────────────────────────────────────────

  it('[P1] does not throw when onSelect is undefined and the item is clicked', async () => {
    // GIVEN: The item is rendered WITHOUT an onSelect prop (Story 2.1 stub allows this)
    const user = userEvent.setup()
    render(<ClientListItem cliente={cliente} />)

    // WHEN: The user clicks the item
    const item = screen.getByTestId('cliente-list-item')

    // THEN: The click does not throw (optional chaining `onSelect?.(id)` guards it)
    await expect(user.click(item)).resolves.toBeUndefined()
  })

  it('[P1] does not invoke onSelect on keys other than Enter or Space', async () => {
    // GIVEN: An interactive item with onSelect spy
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ClientListItem cliente={cliente} onSelect={onSelect} />)

    const item = screen.getByTestId('cliente-list-item')
    item.focus()

    // WHEN: The user presses keys that should NOT activate the button
    await user.keyboard('{Tab}')
    await user.keyboard('{Escape}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('a')

    // THEN: onSelect was never called
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('[P2] defaults isSelected to false: aria-pressed="false" and default border classes', () => {
    // GIVEN / WHEN: The item is rendered without isSelected
    render(<ClientListItem cliente={cliente} />)

    // THEN: aria-pressed is "false" (assistive tech reads it as unselected)
    const item = screen.getByTestId('cliente-list-item')
    expect(item).toHaveAttribute('aria-pressed', 'false')
    // AND: The default state uses the transparent left border, not the primary color
    expect(item.className).toMatch(/border-l-transparent/)
    expect(item.className).toMatch(/bg-white/)
    // AND: The primary-color highlight is NOT applied when unselected
    expect(item.className).not.toMatch(/bg-\[#eff8ff\]/)
  })

  it('[P2] applies the WCAG touch-target min-height class (44px)', () => {
    // GIVEN / WHEN: A single item is rendered
    render(<ClientListItem cliente={cliente} />)

    // THEN: The item container declares min-h-[44px] per Story AC #7
    const item = screen.getByTestId('cliente-list-item')
    expect(item.className).toMatch(/min-h-\[44px\]/)
    // AND: It is keyboard-focusable
    expect(item).toHaveAttribute('tabIndex', '0')
  })

  it('[P2] exposes an aria-label that includes the cliente Nombre for screen readers', () => {
    // GIVEN: A cliente with a distinctive name
    const named = makeCliente({ id: 'x', nombre: 'Distribuciones El Éxito' })

    // WHEN: The item is rendered
    render(<ClientListItem cliente={named} />)

    // THEN: The accessible name embeds the cliente name (assistive tech pattern)
    const item = screen.getByRole('button', {
      name: /Ver cliente: Distribuciones El Éxito/i,
    })
    expect(item).toBeInTheDocument()
  })
})
