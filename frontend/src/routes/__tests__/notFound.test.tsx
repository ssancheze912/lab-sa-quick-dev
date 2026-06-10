import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
import { describe, test, expect } from 'vitest'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
}

describe('NotFoundView', () => {
  test('renders not-found-view for unknown routes', async () => {
    const router = createTestRouter('/ruta-desconocida')
    render(<RouterProvider router={router} />)
    expect(await screen.findByTestId('not-found-view')).toBeInTheDocument()
  })

  test('displays Spanish not-found message', async () => {
    const router = createTestRouter('/pagina-inexistente')
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument()
  })

  test('contains link to /clientes', async () => {
    const router = createTestRouter('/desconocido')
    render(<RouterProvider router={router} />)
    const link = await screen.findByRole('link', { name: /Ir a Clientes/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/clientes')
  })
})
