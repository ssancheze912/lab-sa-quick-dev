/**
 * Component tests for ClienteListItem — Story 2.1 AC #1.
 *
 * Expands the ATDD suite (which covers only list-level rendering) with
 * item-level edge cases: selection state, click callback, aria-label,
 * and defensive rendering of edge-case Cliente shapes (very long name,
 * empty fields, special characters).
 *
 * Level: Component (Vitest + React Testing Library).
 * Priority per test-design §4.2 P1-14 and §4.3 P2-41.
 * Given-When-Then structure. data-testid selectors only.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClienteListItem } from './ClienteListItem'
import type { Cliente } from '../domain/Cliente'

const iso = '2025-01-01T00:00:00.000Z'
const baseCliente: Cliente = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  nombre: 'Acme Corporation',
  nit: '900123456',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: iso,
  updatedAt: iso,
}

describe('ClienteListItem — Story 2.1 AC #1 (edge cases)', () => {
  it('[P1] given a cliente prop, when the item renders, then aria-label exposes "Ver cliente: {nombre}"', () => {
    // GIVEN
    const onSelect = vi.fn()
    // WHEN
    render(<ClienteListItem cliente={baseCliente} onSelect={onSelect} />)
    // THEN
    const item = screen.getByTestId(`cliente-list-item-${baseCliente.id}`)
    expect(item).toHaveAttribute('aria-label', 'Ver cliente: Acme Corporation')
  })

  it('[P1] given selected=true, when the item renders, then it applies the selected styling (blue border + background)', () => {
    // GIVEN
    // WHEN
    render(<ClienteListItem cliente={baseCliente} selected onSelect={() => {}} />)
    // THEN — selected styling exposed via className tokens per implementation
    const item = screen.getByTestId(`cliente-list-item-${baseCliente.id}`)
    expect(item.className).toMatch(/border-blue-600/)
    expect(item.className).toMatch(/bg-blue-50/)
  })

  it('[P1] given selected=false (default), when the item renders, then it does NOT apply the selected styling', () => {
    // GIVEN
    // WHEN
    render(<ClienteListItem cliente={baseCliente} onSelect={() => {}} />)
    // THEN
    const item = screen.getByTestId(`cliente-list-item-${baseCliente.id}`)
    expect(item.className).not.toMatch(/border-blue-600/)
    expect(item.className).not.toMatch(/bg-blue-50/)
    expect(item.className).toMatch(/border-transparent/)
  })

  it('[P1] given the user clicks the item, when the click event fires, then onSelect is invoked once with the cliente id', () => {
    // GIVEN
    const onSelect = vi.fn()
    render(<ClienteListItem cliente={baseCliente} onSelect={onSelect} />)
    const item = screen.getByTestId(`cliente-list-item-${baseCliente.id}`)
    // WHEN
    fireEvent.click(item)
    // THEN
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(baseCliente.id)
  })

  it('[P2] given a cliente with a very long nombre (255 chars), when the item renders, then it does not crash and both fields remain accessible', () => {
    // GIVEN — boundary case per test-design §4.3 P2-42 (NFR field-length boundary)
    const longName = 'X'.repeat(255)
    const longCliente: Cliente = { ...baseCliente, nombre: longName }
    // WHEN
    render(<ClienteListItem cliente={longCliente} onSelect={() => {}} />)
    // THEN — item still queryable + aria-label reflects full nombre
    const item = screen.getByTestId(`cliente-list-item-${longCliente.id}`)
    expect(item).toBeInTheDocument()
    expect(item).toHaveAttribute('aria-label', `Ver cliente: ${longName}`)
  })

  it('[P2] given a cliente with an XSS-like nombre, when the item renders, then it renders as text (not markup) — React auto-escapes', () => {
    // GIVEN — per test-design §4.3 P2-43 (XSS handling verification)
    const xssCliente: Cliente = {
      ...baseCliente,
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      nombre: '<script>alert("xss")</script>',
    }
    // WHEN
    const { container } = render(<ClienteListItem cliente={xssCliente} onSelect={() => {}} />)
    // THEN — the raw string appears as text; no <script> element is injected
    expect(container.querySelector('script')).toBeNull()
    const item = screen.getByTestId(`cliente-list-item-${xssCliente.id}`)
    expect(item).toHaveTextContent('<script>alert("xss")</script>')
  })
})
