/**
 * Story 2.1: Client List & Search
 * Edge Case Tests — ClientListItem component (Vitest + RTL)
 *
 * Covers scenarios NOT addressed by the ATDD ClienteListView tests:
 *   - Keyboard activation (Enter / Space triggers onClick)
 *   - Selected state applies correct CSS class and border
 *   - aria-label contains the client nombre
 *   - Long nombre and NIT strings truncate without breaking layout
 *   - Special characters in NIT are displayed verbatim
 *   - onClick is called exactly once per click
 *   - When onClick is not provided, no error is thrown
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientListItem } from '../ClientListItem'
import type { Cliente } from '../../../modules/crm/clientes/domain/Cliente'

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

function buildCliente(overrides?: Partial<Cliente>): Cliente {
  return {
    id: '00000000-0000-7000-0000-000000000001',
    nombre: 'Empresa Test SAS',
    nit: '900100200-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard navigation — edge cases not in ATDD suite
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — keyboard activation', () => {
  it('should call onClick when Enter key is pressed', async () => {
    const onClick = vi.fn()
    const cliente = buildCliente()
    render(<ClientListItem cliente={cliente} onClick={onClick} />)

    const item = screen.getByTestId('cliente-item')
    fireEvent.keyDown(item, { key: 'Enter' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should call onClick when Space key is pressed', async () => {
    const onClick = vi.fn()
    const cliente = buildCliente()
    render(<ClientListItem cliente={cliente} onClick={onClick} />)

    const item = screen.getByTestId('cliente-item')
    fireEvent.keyDown(item, { key: ' ' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should NOT call onClick for other keys (e.g., Tab, Escape)', () => {
    const onClick = vi.fn()
    const cliente = buildCliente()
    render(<ClientListItem cliente={cliente} onClick={onClick} />)

    const item = screen.getByTestId('cliente-item')
    fireEvent.keyDown(item, { key: 'Tab' })
    fireEvent.keyDown(item, { key: 'Escape' })
    fireEvent.keyDown(item, { key: 'ArrowDown' })

    expect(onClick).not.toHaveBeenCalled()
  })

  it('should NOT throw when onClick is not provided and Enter is pressed', () => {
    const cliente = buildCliente()
    render(<ClientListItem cliente={cliente} />)

    const item = screen.getByTestId('cliente-item')
    expect(() => fireEvent.keyDown(item, { key: 'Enter' })).not.toThrow()
  })

  it('should NOT throw when onClick is not provided and Space is pressed', () => {
    const cliente = buildCliente()
    render(<ClientListItem cliente={cliente} />)

    const item = screen.getByTestId('cliente-item')
    expect(() => fireEvent.keyDown(item, { key: ' ' })).not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Click behavior
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — click behavior', () => {
  it('should call onClick exactly once per click', async () => {
    const onClick = vi.fn()
    const cliente = buildCliente()
    const user = userEvent.setup()
    render(<ClientListItem cliente={cliente} onClick={onClick} />)

    await user.click(screen.getByTestId('cliente-item'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should call onClick twice when clicked twice', async () => {
    const onClick = vi.fn()
    const cliente = buildCliente()
    const user = userEvent.setup()
    render(<ClientListItem cliente={cliente} onClick={onClick} />)

    await user.click(screen.getByTestId('cliente-item'))
    await user.click(screen.getByTestId('cliente-item'))

    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('should NOT throw when onClick is not provided and item is clicked', async () => {
    const cliente = buildCliente()
    const user = userEvent.setup()
    render(<ClientListItem cliente={cliente} />)

    await expect(user.click(screen.getByTestId('cliente-item'))).resolves.not.toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Selected state — visual indicator
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — selected state', () => {
  it('should apply bg-blue-50 class when isSelected=true', () => {
    const cliente = buildCliente()
    render(<ClientListItem cliente={cliente} isSelected />)

    const item = screen.getByTestId('cliente-item')
    expect(item.className).toContain('bg-blue-50')
  })

  it('should NOT apply bg-blue-50 when isSelected=false (default)', () => {
    const cliente = buildCliente()
    render(<ClientListItem cliente={cliente} />)

    const item = screen.getByTestId('cliente-item')
    expect(item.className).not.toContain('bg-blue-50')
  })

  it('should apply Siesa Blue border class when isSelected=true', () => {
    const cliente = buildCliente()
    render(<ClientListItem cliente={cliente} isSelected />)

    const item = screen.getByTestId('cliente-item')
    // The selected state adds border-l-[#0e79fd] or similar
    expect(item.className).toContain('border-l-')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — aria-label
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — accessibility', () => {
  it('should include the client nombre in aria-label', () => {
    const cliente = buildCliente({ nombre: 'Empresa Siesa SAS' })
    render(<ClientListItem cliente={cliente} />)

    const item = screen.getByTestId('cliente-item')
    expect(item.getAttribute('aria-label')).toContain('Empresa Siesa SAS')
  })

  it('should have role="button"', () => {
    const cliente = buildCliente()
    render(<ClientListItem cliente={cliente} />)

    const item = screen.getByTestId('cliente-item')
    expect(item.getAttribute('role')).toBe('button')
  })

  it('should have tabIndex=0', () => {
    const cliente = buildCliente()
    render(<ClientListItem cliente={cliente} />)

    const item = screen.getByTestId('cliente-item')
    expect(item.getAttribute('tabindex')).toBe('0')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: special characters in NIT
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — NIT special characters', () => {
  it('should display NIT with hyphens verbatim', () => {
    const cliente = buildCliente({ nit: '900-100-200-1' })
    render(<ClientListItem cliente={cliente} />)

    expect(screen.getByTestId('cliente-item').textContent).toContain('900-100-200-1')
  })

  it('should display NIT with dots verbatim (some regions use dots)', () => {
    const cliente = buildCliente({ nit: '900.100.200-1' })
    render(<ClientListItem cliente={cliente} />)

    expect(screen.getByTestId('cliente-item').textContent).toContain('900.100.200-1')
  })

  it('should display NIT with slashes verbatim', () => {
    const cliente = buildCliente({ nit: '20/12345678/9' })
    render(<ClientListItem cliente={cliente} />)

    expect(screen.getByTestId('cliente-item').textContent).toContain('20/12345678/9')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: long strings (truncation without layout break)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — long text boundary', () => {
  it('should render without error when nombre is very long (100+ chars)', () => {
    const nombre = 'A'.repeat(120)
    const cliente = buildCliente({ nombre })
    render(<ClientListItem cliente={cliente} />)

    const item = screen.getByTestId('cliente-item')
    expect(item).toBeDefined()
    // text should be in the DOM even if visually truncated
    expect(item.textContent).toContain(nombre)
  })

  it('should render without error when NIT is very long (30+ chars)', () => {
    const nit = '9'.repeat(30) + '-1'
    const cliente = buildCliente({ nit })
    render(<ClientListItem cliente={cliente} />)

    const item = screen.getByTestId('cliente-item')
    expect(item.textContent).toContain(nit)
  })

  it('should apply truncate CSS to nombre paragraph', () => {
    const cliente = buildCliente({ nombre: 'A'.repeat(100) })
    render(<ClientListItem cliente={cliente} />)

    // The nombre paragraph should have the 'truncate' class from Tailwind
    const item = screen.getByTestId('cliente-item')
    const nombreParagraph = item.querySelector('p')
    expect(nombreParagraph?.className).toContain('truncate')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: empty strings (defensive — API may return malformed data)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem — empty string edge cases', () => {
  it('should render without crashing when nombre is empty string', () => {
    const cliente = buildCliente({ nombre: '' })
    expect(() => render(<ClientListItem cliente={cliente} />)).not.toThrow()
  })

  it('should render without crashing when NIT is empty string', () => {
    const cliente = buildCliente({ nit: '' })
    expect(() => render(<ClientListItem cliente={cliente} />)).not.toThrow()
  })
})
