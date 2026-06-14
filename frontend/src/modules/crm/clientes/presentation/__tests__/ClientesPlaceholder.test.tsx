/**
 * Story 1.2: Frontend Navigation Shell
 * Unit Tests — ClientesPlaceholder component
 *
 * AC2, AC5 — The Clientes stub view renders the expected data-testid and heading
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ClientesPlaceholder } from '../ClientesPlaceholder'

describe('ClientesPlaceholder', () => {
  it('should render without crashing', () => {
    const { container } = render(<ClientesPlaceholder />)
    expect(container.firstChild).not.toBeNull()
  })

  it('should render the data-testid="clientes-view" container', () => {
    render(<ClientesPlaceholder />)
    expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
  })

  it('should display the "Clientes" heading text', () => {
    render(<ClientesPlaceholder />)
    expect(screen.getByRole('heading', { name: /clientes/i })).toBeInTheDocument()
  })

  it('should render exactly one heading element', () => {
    render(<ClientesPlaceholder />)
    const headings = screen.getAllByRole('heading')
    expect(headings).toHaveLength(1)
  })

  it('should render a heading with level h1', () => {
    render(<ClientesPlaceholder />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })
})
