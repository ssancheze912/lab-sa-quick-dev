/**
 * Unit Tests — ClientListItem component
 *
 * Covers:
 *   - Renders nombre text
 *   - Renders nit text
 *   - Has data-testid="cliente-list-item"
 *   - Minimum touch target height (44px via Tailwind min-h-[44px])
 *   - Renders both nombre and nit simultaneously
 *   - Long nombre and nit render without crash
 *   - Empty string props render without crash
 *   - Unicode / accented characters render correctly
 *
 * Pattern: Vitest + @testing-library/react (no MSW — pure presentational)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClientListItem } from '../ClientListItem'

describe('ClientListItem — rendering', () => {
  it('Renders the nombre text', () => {
    render(<ClientListItem nombre="Empresa Alpha" nit="111000111-1" />)
    expect(screen.getByText('Empresa Alpha')).toBeInTheDocument()
  })

  it('Renders the nit text', () => {
    render(<ClientListItem nombre="Empresa Alpha" nit="111000111-1" />)
    expect(screen.getByText('111000111-1')).toBeInTheDocument()
  })

  it('Has data-testid="cliente-list-item"', () => {
    render(<ClientListItem nombre="Empresa Alpha" nit="111000111-1" />)
    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument()
  })

  it('Has min-h-[44px] Tailwind class for minimum touch target (WCAG 2.1)', () => {
    render(<ClientListItem nombre="Empresa Alpha" nit="111000111-1" />)
    const item = screen.getByTestId('cliente-list-item')
    expect(item.className).toContain('min-h-[44px]')
  })

  it('Renders both nombre and nit simultaneously in the same item', () => {
    render(<ClientListItem nombre="Beta Corp" nit="222333444-2" />)
    expect(screen.getByText('Beta Corp')).toBeInTheDocument()
    expect(screen.getByText('222333444-2')).toBeInTheDocument()
  })

  it('Renders a very long nombre without crashing', () => {
    const longNombre = 'Empresa '.repeat(30)
    expect(() =>
      render(<ClientListItem nombre={longNombre} nit="900123456-1" />)
    ).not.toThrow()
  })

  it('Renders an empty nombre and nit without crashing', () => {
    expect(() =>
      render(<ClientListItem nombre="" nit="" />)
    ).not.toThrow()
    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument()
  })

  it('Renders unicode / accented characters in nombre', () => {
    render(<ClientListItem nombre="Única Ñoño S.A.S." nit="800777666-5" />)
    expect(screen.getByText('Única Ñoño S.A.S.')).toBeInTheDocument()
  })

  it('Renders NIT with trailing digit after hyphen', () => {
    render(<ClientListItem nombre="Gamma SA" nit="333444555-3" />)
    expect(screen.getByText('333444555-3')).toBeInTheDocument()
  })
})
