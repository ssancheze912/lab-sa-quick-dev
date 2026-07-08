/**
 * Story 1.2 — AC #6 — Route-active sync hook.
 * useActiveNav returns { activeId, navigate } derived from the current router state.
 * RED until useActiveNav.ts is implemented.
 */
import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterContextProvider,
  Outlet,
} from '@tanstack/react-router'
import { useActiveNav } from './useActiveNav'

async function buildWrapper(initialPath: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> })
  const clientesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes',
    component: () => <div data-testid="clientes-view" />,
  })
  const contactosRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/contactos',
    component: () => <div data-testid="contactos-view" />,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([clientesRoute, contactosRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })
  // Load the router synchronously so its state is populated before the hook mounts.
  await router.load()
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <RouterContextProvider router={router}>{children}</RouterContextProvider>
  )
  return { Wrapper, router }
}

describe('useActiveNav', () => {
  it('GIVEN the URL is /clientes, WHEN the hook mounts, THEN activeId is "clientes"', async () => {
    const { Wrapper } = await buildWrapper('/clientes')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })
    expect(result.current.activeId).toBe('clientes')
  })

  it('GIVEN the URL is /contactos, WHEN the hook mounts, THEN activeId is "contactos"', async () => {
    const { Wrapper } = await buildWrapper('/contactos')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })
    expect(result.current.activeId).toBe('contactos')
  })

  it('GIVEN an unknown URL, WHEN the hook mounts, THEN activeId is null', async () => {
    const { Wrapper } = await buildWrapper('/ruta-desconocida')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })
    expect(result.current.activeId).toBeNull()
  })

  it('GIVEN activeId "clientes", WHEN navigate("contactos") is called, THEN activeId becomes "contactos"', async () => {
    const { Wrapper } = await buildWrapper('/clientes')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })

    await act(async () => {
      result.current.navigate('contactos')
    })

    await waitFor(() => {
      expect(result.current.activeId).toBe('contactos')
    })
  })

  it('GIVEN a navigation, THEN window.location.reload is NOT invoked (SPA behavior)', async () => {
    const { Wrapper } = await buildWrapper('/clientes')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })

    await act(async () => {
      result.current.navigate('contactos')
    })

    expect(window.location.reload).not.toHaveBeenCalled()
  })
})
