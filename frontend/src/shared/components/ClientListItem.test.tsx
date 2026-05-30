// Story 2.1: Client List & Search — Automate expansion
// Unit tests for ClientListItem shared component
// Coverage: rendering, props, ARIA, interaction, selection state
// Level: Component/Unit | Priority: P1-P2

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientListItem } from './ClientListItem'
import type { Cliente } from '../../modules/crm/clientes/domain/Cliente'

const baseCliente: Cliente = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  nombre: 'Ana García',
  nit: '900-111-001',
  telefono: '3001111111',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00+00:00',
  updatedAt: '2026-01-01T00:00:00+00:00',
}

// ---------------------------------------------------------------------------
// [P1] Renders nombre and nit correctly
// ---------------------------------------------------------------------------
describe('ClientListItem — [P1] renders content', () => {
  it('Given a cliente prop When rendered Then nombre is displayed', () => {
    render(<ClientListItem cliente={baseCliente} nombre={baseCliente.nombre} nit={baseCliente.nit} />)
    expect(screen.getByText('Ana García')).toBeInTheDocument()
  })

  it('Given a cliente prop When rendered Then nit is displayed', () => {
    render(<ClientListItem cliente={baseCliente} nombre={baseCliente.nombre} nit={baseCliente.nit} />)
    expect(screen.getByText('900-111-001')).toBeInTheDocument()
  })

  it('Given id prop and nombre/nit props When rendered Then data-testid is set to "cliente-list-item-{id}"', () => {
    render(
      <ClientListItem
        id="a1b2c3d4-0000-0000-0000-000000000001"
        nombre="Ana García"
        nit="900-111-001"
      />,
    )
    expect(
      screen.getByTestId('cliente-list-item-a1b2c3d4-0000-0000-0000-000000000001'),
    ).toBeInTheDocument()
  })

  it('Given cliente object prop When rendered Then data-testid uses cliente.id', () => {
    render(<ClientListItem cliente={baseCliente} nombre={baseCliente.nombre} nit={baseCliente.nit} />)
    expect(
      screen.getByTestId(`cliente-list-item-${baseCliente.id}`),
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// [P1] ARIA attributes
// AC task 17: role="button", aria-label in Spanish, aria-current when selected
// ---------------------------------------------------------------------------
describe('ClientListItem — [P1] ARIA accessibility', () => {
  it('Given default state When rendered Then element has role "button"', () => {
    render(<ClientListItem nombre="Ana García" nit="900-1" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('Given rendered When inspected Then aria-label contains the nombre', () => {
    render(<ClientListItem nombre="Ana García" nit="900-1" />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-label', expect.stringContaining('Ana García'))
  })

  it('Given isSelected=true When rendered Then aria-current="page" is set', () => {
    render(<ClientListItem nombre="Ana García" nit="900-1" isSelected />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-current', 'page')
  })

  it('Given isSelected=false When rendered Then aria-current is absent', () => {
    render(<ClientListItem nombre="Ana García" nit="900-1" isSelected={false} />)
    const btn = screen.getByRole('button')
    expect(btn).not.toHaveAttribute('aria-current')
  })

  it('Given isActive=true When rendered Then aria-current="page" is set (alias for isSelected)', () => {
    render(<ClientListItem nombre="Ana García" nit="900-1" isActive />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-current', 'page')
  })
})

// ---------------------------------------------------------------------------
// [P1] onClick interaction
// AC task 17: onClick callback on click
// ---------------------------------------------------------------------------
describe('ClientListItem — [P1] click interaction', () => {
  it('Given an onClick handler When user clicks the item Then handler is called', async () => {
    const onClickMock = vi.fn()
    const user = userEvent.setup()

    render(<ClientListItem nombre="Ana García" nit="900-1" onClick={onClickMock} />)
    const btn = screen.getByRole('button')
    await user.click(btn)

    expect(onClickMock).toHaveBeenCalledTimes(1)
  })

  it('Given no onClick handler When user clicks Then no error is thrown', async () => {
    const user = userEvent.setup()
    render(<ClientListItem nombre="Ana García" nit="900-1" />)
    const btn = screen.getByRole('button')
    // Should not throw
    await expect(user.click(btn)).resolves.not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// [P2] Touch target size — min 44px (WCAG 2.1 AA)
// ---------------------------------------------------------------------------
describe('ClientListItem — [P2] WCAG touch target', () => {
  it('Given the component When rendered Then the button element has min-h-[44px] class ensuring touch target', () => {
    render(<ClientListItem nombre="Ana García" nit="900-1" />)
    const btn = screen.getByRole('button')
    // Check the class list includes the min height token
    expect(btn.className).toMatch(/min-h-\[44px\]/)
  })
})

// ---------------------------------------------------------------------------
// [P2] Selected vs default visual classes
// ---------------------------------------------------------------------------
describe('ClientListItem — [P2] selection visual state', () => {
  it('Given isSelected=true When rendered Then selected class is applied', () => {
    render(<ClientListItem nombre="Ana García" nit="900-1" isSelected />)
    const btn = screen.getByRole('button')
    // The selected item should have a highlighted background class
    expect(btn.className).toMatch(/bg-blue-50|primary-50/)
  })

  it('Given isSelected=false When rendered Then default hover class is present', () => {
    render(<ClientListItem nombre="Ana García" nit="900-1" isSelected={false} />)
    const btn = screen.getByRole('button')
    expect(btn.className).toMatch(/hover:bg-slate-50/)
  })
})

// ---------------------------------------------------------------------------
// [P2] Long nombre — text truncation class present
// ---------------------------------------------------------------------------
describe('ClientListItem — [P2] long text truncation', () => {
  it('Given a very long nombre When rendered Then truncate class is applied to the nombre span', () => {
    const longName = 'A'.repeat(100)
    render(<ClientListItem nombre={longName} nit="900-1" />)
    const nameEl = screen.getByText(longName)
    expect(nameEl.className).toContain('truncate')
  })
})
