/**
 * Unit Tests — ClientListItem shared component
 * Story 2.1: Client List & Search (edge-case expansion)
 *
 * Covers: rendering nombre + nit, selected/unselected styling (aria-selected),
 * click callback invocation, keyboard accessibility, long text truncation path,
 * special characters in nombre/nit, isSelected default value.
 *
 * Stack: Vitest + React Testing Library
 */

import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientListItem } from '../ClientListItem'
import type { Cliente } from '../../../modules/crm/clientes/domain/Cliente'

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: 'abc-001',
    nombre: 'Empresa de Prueba',
    nit: '900123456',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Rendering — baseline content
// ---------------------------------------------------------------------------

describe('ClientListItem — content rendering', () => {
  test('renders data-testid="client-list-item"', () => {
    render(<ClientListItem cliente={makeCliente()} isSelected={false} onClick={vi.fn()} />)
    expect(screen.getByTestId('client-list-item')).toBeInTheDocument()
  })

  test('displays the client nombre as primary text', () => {
    render(<ClientListItem cliente={makeCliente({ nombre: 'Acme Corp' })} onClick={vi.fn()} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  test('displays the client nit as secondary text', () => {
    render(<ClientListItem cliente={makeCliente({ nit: '800987654' })} onClick={vi.fn()} />)
    expect(screen.getByText('800987654')).toBeInTheDocument()
  })

  test('renders nombre with special characters (accents, ñ, &)', () => {
    render(<ClientListItem cliente={makeCliente({ nombre: 'Compañía & Asociados Ltda.' })} onClick={vi.fn()} />)
    expect(screen.getByText('Compañía & Asociados Ltda.')).toBeInTheDocument()
  })

  test('renders NIT composed entirely of numbers', () => {
    render(<ClientListItem cliente={makeCliente({ nit: '123000000' })} onClick={vi.fn()} />)
    expect(screen.getByText('123000000')).toBeInTheDocument()
  })

  test('renders NIT with hyphen format (e.g., Colombian NIT with check digit)', () => {
    render(<ClientListItem cliente={makeCliente({ nit: '900123456-7' })} onClick={vi.fn()} />)
    expect(screen.getByText('900123456-7')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Selected state — aria-selected and styling
// ---------------------------------------------------------------------------

describe('ClientListItem — selected/unselected state', () => {
  test('aria-selected is "false" when isSelected is false', () => {
    render(<ClientListItem cliente={makeCliente()} isSelected={false} onClick={vi.fn()} />)
    expect(screen.getByTestId('client-list-item')).toHaveAttribute('aria-selected', 'false')
  })

  test('aria-selected is "true" when isSelected is true', () => {
    render(<ClientListItem cliente={makeCliente()} isSelected={true} onClick={vi.fn()} />)
    expect(screen.getByTestId('client-list-item')).toHaveAttribute('aria-selected', 'true')
  })

  test('isSelected defaults to false (no aria-selected="true") when prop is omitted', () => {
    render(<ClientListItem cliente={makeCliente()} onClick={vi.fn()} />)
    const el = screen.getByTestId('client-list-item')
    // aria-selected should be "false" (or absent), never "true"
    expect(el.getAttribute('aria-selected')).not.toBe('true')
  })

  test('selected item has visually distinct class (bg-blue-50 or similar)', () => {
    render(<ClientListItem cliente={makeCliente()} isSelected={true} onClick={vi.fn()} />)
    const el = screen.getByTestId('client-list-item')
    // bg-blue-50 is applied for selected state per implementation
    expect(el.className).toMatch(/bg-blue-50|primary-50/)
  })

  test('unselected item does not apply the selected background class', () => {
    render(<ClientListItem cliente={makeCliente()} isSelected={false} onClick={vi.fn()} />)
    const el = screen.getByTestId('client-list-item')
    expect(el.className).not.toMatch(/bg-blue-50|primary-50/)
  })
})

// ---------------------------------------------------------------------------
// Interaction — click callback
// ---------------------------------------------------------------------------

describe('ClientListItem — click interaction', () => {
  test('invokes onClick when the item is clicked', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<ClientListItem cliente={makeCliente()} onClick={onClick} />)

    await user.click(screen.getByTestId('client-list-item'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('does not invoke onClick for an unrelated click outside the element', async () => {
    const onClick = vi.fn()
    render(
      <div>
        <ClientListItem cliente={makeCliente()} onClick={onClick} />
        <span data-testid="outside">outside</span>
      </div>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByTestId('outside'))
    expect(onClick).not.toHaveBeenCalled()
  })

  test('onClick can be triggered via keyboard Enter (button element is keyboard-accessible)', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<ClientListItem cliente={makeCliente()} onClick={onClick} />)

    screen.getByTestId('client-list-item').focus()
    await user.keyboard('{Enter}')

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('onClick can be triggered via keyboard Space', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<ClientListItem cliente={makeCliente()} onClick={onClick} />)

    screen.getByTestId('client-list-item').focus()
    await user.keyboard(' ')

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Edge: boundary strings
// ---------------------------------------------------------------------------

describe('ClientListItem — boundary string inputs', () => {
  test('renders without crash when nombre is a single character', () => {
    render(<ClientListItem cliente={makeCliente({ nombre: 'A' })} onClick={vi.fn()} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  test('renders without crash when nombre is 200 characters long', () => {
    const longName = 'B'.repeat(200)
    render(<ClientListItem cliente={makeCliente({ nombre: longName })} onClick={vi.fn()} />)
    expect(screen.getByTestId('client-list-item')).toBeInTheDocument()
  })

  test('renders without crash when nit is an empty string', () => {
    render(<ClientListItem cliente={makeCliente({ nit: '' })} onClick={vi.fn()} />)
    expect(screen.getByTestId('client-list-item')).toBeInTheDocument()
  })
})
