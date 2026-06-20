import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { QueryProvider } from '../../app/providers/QueryProvider'
import { routeTree } from '../../routeTree.gen'

function renderWithRouter(initialPath: string) {
  const history = createMemoryHistory({ initialEntries: [initialPath] })
  const router = createRouter({ routeTree, history })
  return render(
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>,
  )
}

describe('Navigation Shell', () => {
  it('redirects root / to /clientes', async () => {
    renderWithRouter('/')
    // After redirect, clientes view should be visible with the search input
    expect(await screen.findByRole('textbox', { name: 'Buscar clientes' })).toBeInTheDocument()
  })

  it('renders Clientes view on /clientes', async () => {
    renderWithRouter('/clientes')
    expect(await screen.findByRole('textbox', { name: 'Buscar clientes' })).toBeInTheDocument()
  })

  it('renders Contactos view on /contactos', async () => {
    renderWithRouter('/contactos')
    expect(await screen.findByText('Contactos')).toBeInTheDocument()
  })

  it('displays Spanish not-found message on unknown route', async () => {
    renderWithRouter('/ruta-desconocida')
    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument()
    expect(
      screen.getByText('La ruta solicitada no existe.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Volver a Clientes' }),
    ).toBeInTheDocument()
  })

  it('not-found page link points to /clientes', async () => {
    renderWithRouter('/ruta-desconocida')
    const link = await screen.findByRole('link', { name: 'Volver a Clientes' })
    expect(link).toHaveAttribute('href', '/clientes')
  })

  it('navigation entries render with correct aria-labels', async () => {
    renderWithRouter('/clientes')
    await screen.findByRole('textbox', { name: 'Buscar clientes' })
    // Icons should have aria-label for accessibility
    const clientesIcons = document.querySelectorAll('[aria-label="Clientes"]')
    expect(clientesIcons.length).toBeGreaterThan(0)
    const contactosIcons = document.querySelectorAll('[aria-label="Contactos"]')
    expect(contactosIcons.length).toBeGreaterThan(0)
  })
})
