/**
 * Story 2.1: Client List & Search — useClientes hook unit tests
 * Epic 2: Client Management
 *
 * Automation Expansion Tests (BMad-Integrated Mode — Unit Level)
 * Covers gaps NOT addressed by component-level ATDD tests:
 *
 *   - useClientes returns data as typed Cliente[] on successful API response
 *   - useClientes returns empty array when API returns []
 *   - useClientes returns isLoading=true while fetch is pending
 *   - useClientes returns isError=true on 500 response
 *   - useClientes exposes a refetch function
 *   - useClientes refetch triggers a new API call and updates data
 *
 * Uses renderHook from @testing-library/react with MSW.
 * No real HTTP traffic — all requests intercepted at the node layer.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';
import { useClientes } from '../../modules/crm/clientes/application/useClientes';

// ---------------------------------------------------------------------------
// MSW server — intercepts GET /api/v1/clientes
// ---------------------------------------------------------------------------

const mockClientes: Cliente[] = [
  {
    id: 'hook-test-1',
    nombre: 'Hook Test Alfa',
    nit: '800100200',
    telefono: '3001000001',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'hook-test-2',
    nombre: 'Hook Test Beta',
    nit: '800200300',
    telefono: '3001000002',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];

const server = setupServer(
  http.get('/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Test utility — createWrapper with isolated QueryClient
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  }

  return { Wrapper, queryClient };
}

// ---------------------------------------------------------------------------
// useClientes — hook return shape and data
// ---------------------------------------------------------------------------

describe('useClientes — hook return shape and data', () => {
  it('should return data as Cliente[] when API responds with clients', async () => {
    // GIVEN: MSW returns two clients
    const { Wrapper } = createWrapper();

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper });

    // THEN: data is populated with typed Cliente[]
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveLength(2);
    });
  });

  it('should return data with correct Cliente field values', async () => {
    // GIVEN: MSW returns mockClientes
    const { Wrapper } = createWrapper();

    // WHEN: Hook fetches data
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper });

    // THEN: First item has correct fields
    await waitFor(() => {
      const first = result.current.data?.[0];
      expect(first?.id).toBe('hook-test-1');
      expect(first?.nombre).toBe('Hook Test Alfa');
      expect(first?.nit).toBe('800100200');
      expect(first?.telefono).toBe('3001000001');
      expect(first?.ciudad).toBe('Bogotá');
    });
  });

  it('should return isLoading=true while fetch is in progress', async () => {
    // GIVEN: API response is delayed
    server.use(
      http.get('/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(mockClientes);
      })
    );

    const { Wrapper, queryClient } = createWrapper();

    // WHEN: Hook first mounts (before data arrives)
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper });

    // THEN: isLoading is true at the start
    expect(result.current.isLoading).toBe(true);

    // Cleanup pending query
    queryClient.cancelQueries();
  });

  it('should return isError=true when API returns 500', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get('/api/v1/clientes', () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    );

    const { Wrapper } = createWrapper();

    // WHEN: Hook fetches and receives error
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should expose a refetch function on the result', async () => {
    // GIVEN: MSW returns clients
    const { Wrapper } = createWrapper();

    // WHEN: Hook is rendered
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper });

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should return an empty array when API responds with []', async () => {
    // GIVEN: API returns empty list (no clients exist)
    server.use(
      http.get('/api/v1/clientes', () => HttpResponse.json([]))
    );

    const { Wrapper } = createWrapper();

    // WHEN: Hook fetches empty list
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper });

    // THEN: data is an empty array (not undefined, not null)
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// useClientes — refetch behavior
// ---------------------------------------------------------------------------

describe('useClientes — refetch triggers new API call', () => {
  it('should fetch new data when refetch is called after initial load', async () => {
    // GIVEN: First call returns one client; subsequent calls return two clients
    let callCount = 0;
    server.use(
      http.get('/api/v1/clientes', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json([mockClientes[0]]);
        }
        return HttpResponse.json(mockClientes);
      })
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper: Wrapper });

    // Wait for initial data (1 client)
    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    // WHEN: refetch is called
    await act(async () => {
      await result.current.refetch();
    });

    // THEN: Data updated with new result (2 clients from second call)
    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });
  });
});
