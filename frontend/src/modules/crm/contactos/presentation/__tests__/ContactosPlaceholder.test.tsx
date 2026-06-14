/**
 * Story 1.2: Frontend Navigation Shell
 * Unit Tests — ContactosPlaceholder component
 *
 * AC3, AC6 — The Contactos stub view renders the expected data-testid and heading
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactosPlaceholder } from '../ContactosPlaceholder'

describe('ContactosPlaceholder', () => {
  it('should render without crashing', () => {
    const { container } = render(<ContactosPlaceholder />)
    expect(container.firstChild).not.toBeNull()
  })

  it('should render the data-testid="contactos-view" container', () => {
    render(<ContactosPlaceholder />)
    expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
  })

  it('should display the "Contactos" heading text', () => {
    render(<ContactosPlaceholder />)
    expect(screen.getByRole('heading', { name: /contactos/i })).toBeInTheDocument()
  })

  it('should render exactly one heading element', () => {
    render(<ContactosPlaceholder />)
    const headings = screen.getAllByRole('heading')
    expect(headings).toHaveLength(1)
  })

  it('should render a heading with level h1', () => {
    render(<ContactosPlaceholder />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
  })
})
