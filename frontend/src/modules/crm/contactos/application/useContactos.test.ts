import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useContactos } from './useContactos'
import type { Contacto } from '../domain/Contacto'

const mockContactos: Contacto[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    nombre: 'Juan Pérez',
    cargo: 'Gerente',
    telefono: '3001234567',
    email: 'juan.perez@empresa.com',
    clienteId: '11111111-1111-1111-1111-111111111111',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    nombre: 'María López',
    cargo: 'Directora',
    telefono: '3119876543',
    email: 'maria.lopez@otra.com',
    clienteId: null,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
]

const server = setupServer(
  http.get('*/api/v1/contactos', () => {
    return HttpResponse.json(mockContactos)
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useContactos', () => {
  it('returns contact data on successful fetch', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useContactos(), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].nombre).toBe('Juan Pérez')
    expect(result.current.data![0].email).toBe('juan.perez@empresa.com')
  })

  it('isLoading is true while fetching', async () => {
    // Arrange
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useContactos(), { wrapper })

    // Assert — initial state should be loading
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('isError is true on API failure', async () => {
    // Arrange
    server.use(
      http.get('*/api/v1/contactos', () => {
        return HttpResponse.error()
      }),
    )
    const wrapper = createWrapper()

    // Act
    const { result } = renderHook(() => useContactos(), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
