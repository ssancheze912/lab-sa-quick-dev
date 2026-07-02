import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the search-empty variant with title and subtitle', () => {
    render(
      <EmptyState
        variant="search-empty"
        title="No se encontró ningún cliente"
        subtitle="Intenta con otro nombre o NIT"
      />,
    )

    const root = screen.getByTestId('empty-state-search-empty')
    expect(root).toBeInTheDocument()
    expect(root).toHaveAttribute('role', 'status')
    expect(root).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText(/No se encontró ningún cliente/i)).toBeInTheDocument()
    expect(screen.getByText(/Intenta con otro nombre o NIT/i)).toBeInTheDocument()
  })

  it('renders the no-clients variant with a CTA that invokes onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(
      <EmptyState
        variant="no-clients"
        title="No hay clientes registrados"
        subtitle="Crea el primer cliente del sistema"
        cta={{ label: 'Nuevo cliente', onClick }}
      />,
    )

    expect(screen.getByTestId('empty-state-no-clients')).toBeInTheDocument()
    const cta = screen.getByRole('button', { name: /nuevo cliente/i })
    expect(cta).toBeInTheDocument()

    await user.click(cta)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('accepts a custom icon override', () => {
    render(
      <EmptyState
        variant="no-contacts"
        title="Sin contactos"
        icon={<span data-testid="custom-icon">*</span>}
      />,
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})
