import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  // UNIT-C-FE-03: EmptyState renders title and description props
  it('UNIT-C-FE-03 — renders title and description props', () => {
    render(
      <EmptyState
        title="No hay clientes registrados"
        description="Crea el primer cliente para comenzar."
      />,
    )
    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
    expect(
      screen.getByText('Crea el primer cliente para comenzar.'),
    ).toBeInTheDocument()
  })

  it('renders with default title when no props passed', () => {
    render(<EmptyState />)
    expect(screen.getByText('No hay clientes registrados')).toBeInTheDocument()
  })

  it('has data-testid="empty-state"', () => {
    render(<EmptyState />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })
})
