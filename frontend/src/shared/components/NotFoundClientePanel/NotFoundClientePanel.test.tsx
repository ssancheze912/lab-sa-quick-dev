import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotFoundClientePanel } from './NotFoundClientePanel'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  )
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('NotFoundClientePanel', () => {
  it('renders role="alert" with title, subtitle and CTA', () => {
    render(<NotFoundClientePanel />)

    const panel = screen.getByTestId('cliente-not-found')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute('role', 'alert')
    expect(panel).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('heading', { name: /cliente no encontrado/i })).toBeInTheDocument()
    expect(screen.getByText(/el cliente que buscas no existe o fue eliminado/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /volver a clientes/i })).toBeInTheDocument()
  })

  it('invokes navigate({ to: "/clientes" }) when the CTA is clicked', async () => {
    navigateMock.mockClear()
    const user = userEvent.setup()

    render(<NotFoundClientePanel />)

    await user.click(screen.getByRole('button', { name: /volver a clientes/i }))

    expect(navigateMock).toHaveBeenCalledTimes(1)
    expect(navigateMock).toHaveBeenCalledWith({ to: '/clientes' })
  })

  it('honours the onBack prop and does NOT call navigate when it is provided', async () => {
    navigateMock.mockClear()
    const onBack = vi.fn()
    const user = userEvent.setup()

    render(<NotFoundClientePanel onBack={onBack} />)

    await user.click(screen.getByRole('button', { name: /volver a clientes/i }))

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
