/**
 * Story 2.1 — ATDD (RED phase).
 *
 * Covers AC #1 (list item shape) and AC #7 (selection contract).
 *
 * RED until `src/shared/components/ClienteListItem.tsx` exists.
 */
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { buildCliente } from '@/test/factories/cliente.factory'
import { ClienteListItem } from './ClienteListItem'

describe('ClienteListItem', () => {
  it('renders the cliente nombre on the first visual line', () => {
    const cliente = buildCliente({ nombre: 'Acme Corp', nit: '900123456' })
    render(<ClienteListItem cliente={cliente} selected={false} onSelect={vi.fn()} />)

    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('renders the NIT prefixed with "NIT: " on the second visual line', () => {
    const cliente = buildCliente({ nombre: 'Acme Corp', nit: '900123456' })
    render(<ClienteListItem cliente={cliente} selected={false} onSelect={vi.fn()} />)

    expect(screen.getByText(/NIT:\s*900123456/i)).toBeInTheDocument()
  })

  it('exposes a Spanish aria-label of the form "Ver cliente: {nombre}"', () => {
    const cliente = buildCliente({ nombre: 'Acme Corp' })
    render(<ClienteListItem cliente={cliente} selected={false} onSelect={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: /ver cliente:\s*acme corp/i }),
    ).toBeInTheDocument()
  })

  it('GIVEN a click, WHEN the button fires, THEN onSelect is called with the cliente id', () => {
    const cliente = buildCliente({ nombre: 'Acme Corp' })
    const onSelect = vi.fn()
    render(<ClienteListItem cliente={cliente} selected={false} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /ver cliente/i }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(cliente.id)
  })

  it('GIVEN selected=true, THEN the root element carries data-selected="true"', () => {
    const cliente = buildCliente({ nombre: 'Acme Corp' })
    render(<ClienteListItem cliente={cliente} selected onSelect={vi.fn()} />)

    const el = screen.getByRole('button', { name: /ver cliente/i })
    expect(el).toHaveAttribute('data-selected', 'true')
  })

  it('GIVEN selected=false, THEN the root element carries data-selected="false"', () => {
    const cliente = buildCliente({ nombre: 'Acme Corp' })
    render(<ClienteListItem cliente={cliente} selected={false} onSelect={vi.fn()} />)

    const el = screen.getByRole('button', { name: /ver cliente/i })
    expect(el).toHaveAttribute('data-selected', 'false')
  })
})
