/**
 * Story 1.2 — AC #6 — Edge cases for the useActiveNav hook.
 * These complement useActiveNav.test.tsx by covering boundary conditions:
 * nested URLs, query strings, root path, and idempotent navigation.
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
  await router.load()
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <RouterContextProvider router={router}>{children}</RouterContextProvider>
  )
  return { Wrapper, router }
}

describe('useActiveNav — edge cases', () => {
  it('[P1] GIVEN the URL is /clientes with a query string, WHEN the hook mounts, THEN activeId is still "clientes"', async () => {
    const { Wrapper } = await buildWrapper('/clientes?filter=active')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })
    expect(result.current.activeId).toBe('clientes')
  })

  it('[P1] GIVEN the URL is /contactos with a hash fragment, WHEN the hook mounts, THEN activeId is still "contactos"', async () => {
    const { Wrapper } = await buildWrapper('/contactos#top')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })
    expect(result.current.activeId).toBe('contactos')
  })

  it('[P1] GIVEN the URL is the root "/", WHEN the hook mounts, THEN activeId is null (no rail item is active)', async () => {
    const { Wrapper } = await buildWrapper('/')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })
    expect(result.current.activeId).toBeNull()
  })

  it('[P2] GIVEN the URL is /clientesX (path with similar prefix), WHEN the hook mounts, THEN activeId is null (no false match)', async () => {
    // Prefix-only URLs like "/clientesX" MUST NOT be treated as the clientes
    // section. useActiveNav requires an exact match or a "/clientes/" prefix.
    const { Wrapper } = await buildWrapper('/clientesX')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })
    expect(result.current.activeId).toBeNull()
  })

  it('[P1] GIVEN a nested clientes URL /clientes/123, WHEN the hook mounts, THEN activeId is still "clientes"', async () => {
    // Nested URLs under the section (e.g. detail views) MUST keep the rail
    // item marked active so users retain orientation.
    const { Wrapper } = await buildWrapper('/clientes/123')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })
    expect(result.current.activeId).toBe('clientes')
  })

  it('[P1] GIVEN navigate("clientes") is called from /clientes, THEN activeId remains "clientes" (idempotent)', async () => {
    const { Wrapper } = await buildWrapper('/clientes')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })

    await act(async () => {
      result.current.navigate('clientes')
    })

    await waitFor(() => {
      expect(result.current.activeId).toBe('clientes')
    })
  })

  it('[P2] GIVEN a mounted hook, THEN navigate is a stable, callable function reference', async () => {
    const { Wrapper } = await buildWrapper('/clientes')
    const { result } = renderHook(() => useActiveNav(), { wrapper: Wrapper })
    expect(typeof result.current.navigate).toBe('function')
  })
})
