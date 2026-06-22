import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ClientListItem } from '../ClientListItem'

/**
 * Unit tests for ClientListItem component — Story 2.1 edge case expansion.
 *
 * Test IDs: UNIT-C-FE-CLI-01 … UNIT-C-FE-CLI-07
 */
describe('ClientListItem', () => {
  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLI-01: Renders nombre and nit text
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLI-01 — renders nombre and nit text', () => {
    render(<ClientListItem nombre="Empresa Alpha SAS" nit="900100001-0" />)

    expect(screen.getByText('Empresa Alpha SAS')).toBeInTheDocument()
    expect(screen.getByText('900100001-0')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLI-02: Has data-testid="cliente-list-item" for E2E selectors
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLI-02 — has data-testid="cliente-list-item"', () => {
    render(<ClientListItem nombre="Empresa Beta" nit="900100002-1" />)

    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLI-03: Has role="listitem" for accessibility
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLI-03 — has role="listitem"', () => {
    render(<ClientListItem nombre="Empresa Gamma" nit="900100003-2" />)

    expect(screen.getByRole('listitem')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLI-04: When isActive=true, sets aria-current="true"
  // Boundary: active item must signal current page/selection to screen readers.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLI-04 — when isActive=true sets aria-current="true"', () => {
    render(<ClientListItem nombre="Empresa Activa" nit="900100004-3" isActive />)

    const item = screen.getByTestId('cliente-list-item')
    expect(item).toHaveAttribute('aria-current', 'true')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLI-05: When isActive=false (default), aria-current is not set
  // Boundary: inactive items must not mislead screen readers.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLI-05 — when isActive=false does not set aria-current', () => {
    render(<ClientListItem nombre="Empresa Inactiva" nit="900100005-4" isActive={false} />)

    const item = screen.getByTestId('cliente-list-item')
    expect(item).not.toHaveAttribute('aria-current')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLI-06: When isActive is not provided (undefined), no aria-current
  // Boundary: default behavior when prop is omitted.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLI-06 — when isActive is omitted does not set aria-current', () => {
    render(<ClientListItem nombre="Empresa Sin Prop" nit="900100006-5" />)

    const item = screen.getByTestId('cliente-list-item')
    expect(item).not.toHaveAttribute('aria-current')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-CLI-07: Renders with empty string values without throwing
  // Boundary: guard against empty nombre/nit being passed from a malformed API response.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-CLI-07 — renders without throwing when nombre and nit are empty strings', () => {
    expect(() => {
      render(<ClientListItem nombre="" nit="" />)
    }).not.toThrow()

    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument()
  })
})
