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
})
