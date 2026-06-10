import { render, screen } from '@testing-library/react'
import { RouterProvider, createRouter, createMemoryHistory } from '@tanstack/react-router'
import { routeTree } from '../../routeTree.gen'
import { describe, test, expect } from 'vitest'

describe('Index Route - redirect to /clientes', () => {
  test('redirects / to /clientes and renders clientes view', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    render(<RouterProvider router={router} />)
    // After redirect, clientes-view should be rendered
    expect(await screen.findByTestId('clientes-view')).toBeInTheDocument()
  })

  test('router location is /clientes after / redirect', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    render(<RouterProvider router={router} />)
    await screen.findByTestId('clientes-view')
    expect(router.state.location.pathname).toBe('/clientes')
  })
})
