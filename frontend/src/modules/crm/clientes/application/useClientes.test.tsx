import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { server } from '@/test/msw/server'
import { seedClientes } from '@/test/msw/handlers'
import { useClientes } from './useClientes'

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

describe('useClientes', () => {
  it('resolves with the seed data on success (200)', async () => {
    const { result } = renderHook(() => useClientes(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(seedClientes)
  })

  it('transitions to isError on 500 responses', async () => {
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'boom', status: 500 }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useClientes(), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
