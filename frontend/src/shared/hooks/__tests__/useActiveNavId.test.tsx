/**
 * Story 1.2: Frontend Navigation Shell — Expanded Coverage (testarch-automate)
 *
 * Unit tests for `useActiveNavId` (P2)
 *
 * Edge cases:
 *   - Root path returns null
 *   - Nested paths under /clientes/* and /contactos/* still resolve correctly
 *   - Unknown paths return null
 *   - Trailing slash handling
 *
 * These tests are NOT covered by ATDD — they exercise the hook in isolation
 * with stubbed router context.
 */

import { describe, expect, test, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useActiveNavId } from '@/shared/hooks/useActiveNavId'

// Mock @tanstack/react-router useLocation for deterministic path control.
vi.mock('@tanstack/react-router', () => ({
  useLocation: vi.fn(),
}))

import { useLocation } from '@tanstack/react-router'

describe('useActiveNavId — pathname-derived active id (P2)', () => {
  test('[P2] GIVEN pathname /clientes WHEN hook runs THEN returns "clientes"', () => {
    vi.mocked(useLocation).mockReturnValue({ pathname: '/clientes' } as ReturnType<
      typeof useLocation
    >)

    const { result } = renderHook(() => useActiveNavId())
    expect(result.current).toBe('clientes')
  })

  test('[P2] GIVEN pathname /contactos WHEN hook runs THEN returns "contactos"', () => {
    vi.mocked(useLocation).mockReturnValue({ pathname: '/contactos' } as ReturnType<
      typeof useLocation
    >)

    const { result } = renderHook(() => useActiveNavId())
    expect(result.current).toBe('contactos')
  })

  test('[P2] GIVEN nested pathname /clientes/123 WHEN hook runs THEN returns "clientes" (startsWith)', () => {
    // Edge: nested detail/list routes should still highlight the parent section.
    vi.mocked(useLocation).mockReturnValue({ pathname: '/clientes/123' } as ReturnType<
      typeof useLocation
    >)

    const { result } = renderHook(() => useActiveNavId())
    expect(result.current).toBe('clientes')
  })

  test('[P2] GIVEN nested pathname /contactos/abc/edit WHEN hook runs THEN returns "contactos"', () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/contactos/abc/edit',
    } as ReturnType<typeof useLocation>)

    const { result } = renderHook(() => useActiveNavId())
    expect(result.current).toBe('contactos')
  })

  test('[P2] GIVEN root pathname / WHEN hook runs THEN returns null (no active section)', () => {
    // Root is a redirect target — momentary state should not flag any nav item active.
    vi.mocked(useLocation).mockReturnValue({ pathname: '/' } as ReturnType<typeof useLocation>)

    const { result } = renderHook(() => useActiveNavId())
    expect(result.current).toBeNull()
  })

  test('[P2] GIVEN unknown pathname /ruta-que-no-existe WHEN hook runs THEN returns null', () => {
    vi.mocked(useLocation).mockReturnValue({
      pathname: '/ruta-que-no-existe',
    } as ReturnType<typeof useLocation>)

    const { result } = renderHook(() => useActiveNavId())
    expect(result.current).toBeNull()
  })

  test('[P2] GIVEN trailing slash pathname /clientes/ WHEN hook runs THEN returns "clientes"', () => {
    vi.mocked(useLocation).mockReturnValue({ pathname: '/clientes/' } as ReturnType<
      typeof useLocation
    >)

    const { result } = renderHook(() => useActiveNavId())
    expect(result.current).toBe('clientes')
  })

  test('[P3] GIVEN empty pathname WHEN hook runs THEN returns null (defensive)', () => {
    vi.mocked(useLocation).mockReturnValue({ pathname: '' } as ReturnType<typeof useLocation>)

    const { result } = renderHook(() => useActiveNavId())
    expect(result.current).toBeNull()
  })
})
