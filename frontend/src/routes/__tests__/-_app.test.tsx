import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'

function createTestRouter(initialPath: string) {
  return createRouter({
    routeTree,
    history: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      subscribe: (_cb: () => void) => () => undefined,
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      createHref: (_location: { pathname: string }) => _location.pathname,
      block: vi.fn(),
      flush: vi.fn(),
      destroy: vi.fn(),
      notify: vi.fn(),
      location: {
        pathname: initialPath,
        search: '',
        hash: '',
        state: {},
        key: 'default',
      },
      encodeLocation: (location: { pathname: string }) => location,
    },
  })
}

describe('AppShell Navigation', () => {
  it('renders navigation with Clientes label', async () => {
    const router = createTestRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)

    expect(screen.getByText('Clientes')).toBeInTheDocument()
  })

  it('renders navigation with Contactos label', async () => {
    const router = createTestRouter('/contactos')
    await router.load()
    render(<RouterProvider router={router} />)

    expect(screen.getByText('Contactos')).toBeInTheDocument()
  })

  it('renders clientes view on /clientes route', async () => {
    const router = createTestRouter('/clientes')
    await router.load()
    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('clientes-view')).toBeInTheDocument()
  })

  it('renders contactos view on /contactos route', async () => {
    const router = createTestRouter('/contactos')
    await router.load()
    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('contactos-view')).toBeInTheDocument()
  })

  it('renders 404 page for unknown route', async () => {
    const router = createTestRouter('/ruta-desconocida')
    await router.load()
    render(<RouterProvider router={router} />)

    expect(screen.getByTestId('not-found-page')).toBeInTheDocument()
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
  })

  it('not found page contains link to Clientes', async () => {
    const router = createTestRouter('/ruta-desconocida')
    await router.load()
    render(<RouterProvider router={router} />)

    expect(screen.getByText('Ir a Clientes')).toBeInTheDocument()
  })
})

describe('NotFoundPage', () => {
  it('shows Spanish text content', async () => {
    const router = createTestRouter('/algo-desconocido')
    await router.load()
    render(<RouterProvider router={router} />)

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
    expect(screen.getByText('La ruta solicitada no existe.')).toBeInTheDocument()
  })
})
