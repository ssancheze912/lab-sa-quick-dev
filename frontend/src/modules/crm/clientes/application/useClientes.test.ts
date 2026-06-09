/**
 * Hook Unit Tests — Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * RED PHASE: These tests are intentionally written to FAIL until the implementation
 * described in story 2-1-client-list-search.md is complete.
 *
 * Test level: Unit (Vitest + React Testing Library renderHook + MSW)
 *
 * Test cases:
 *   TC-E2-P3-04: useClientes hook returns typed Cliente[] with correct fields
 */

import { describe, test, expect, afterEach, afterAll, beforeAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useClientes } from './useClientes';

// ---------------------------------------------------------------------------
// MSW Server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

// ---------------------------------------------------------------------------
// TC-E2-P3-04 — useClientes returns typed Cliente[] with correct fields
// ---------------------------------------------------------------------------

describe('TC-E2-P3-04 — useClientes hook returns typed Cliente[]', () => {
  test('should return data as an array of Cliente objects when API succeeds', async () => {
    // GIVEN: The API returns 2 clients
    const mockClientes = [
      {
        id: 'aaaaaaaa-0001-0000-0000-000000000001',
        nombre: 'Test Corp SA',
        nit: '900100200-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'bbbbbbbb-0002-0000-0000-000000000002',
        nombre: 'Demo Ltda',
        nit: '900200300-2',
        telefono: '3107654321',
        ciudad: 'Medellín',
        createdAt: '2026-01-02T00:00:00Z',
      },
    ];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(mockClientes),
      ),
    );

    // WHEN: useClientes hook is invoked
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: data is a Cliente[] with 2 items
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(2);
  });

  test('each Cliente in data must have an "id" field (string)', async () => {
    // GIVEN: API returns a client with a UUID id
    const mockClientes = [
      {
        id: 'cccccccc-0003-0000-0000-000000000003',
        nombre: 'Shape Test Corp',
        nit: '900300400-3',
        telefono: '3001112223',
        ciudad: 'Cali',
        createdAt: '2026-01-03T00:00:00Z',
      },
    ];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(mockClientes),
      ),
    );

    // WHEN: useClientes hook resolves
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // THEN: Each item has an "id" of type string
    const cliente = result.current.data![0];
    expect(typeof cliente.id).toBe('string');
    expect(cliente.id).toBe('cccccccc-0003-0000-0000-000000000003');
  });

  test('each Cliente in data must have a "nombre" field (string)', async () => {
    // GIVEN: API returns a client with nombre "Shape Test Corp"
    const mockClientes = [
      {
        id: 'dddddddd-0004-0000-0000-000000000004',
        nombre: 'Shape Test Corp',
        nit: '900400500-4',
        telefono: '3001112224',
        ciudad: 'Barranquilla',
        createdAt: '2026-01-04T00:00:00Z',
      },
    ];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(mockClientes),
      ),
    );

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // THEN: Each item has a "nombre" string field
    const cliente = result.current.data![0];
    expect(typeof cliente.nombre).toBe('string');
    expect(cliente.nombre).toBe('Shape Test Corp');
  });

  test('each Cliente in data must have a "nit" field (string)', async () => {
    // GIVEN: API returns a client with nit "900400500-4"
    const mockClientes = [
      {
        id: 'eeeeeeee-0005-0000-0000-000000000005',
        nombre: 'NIT Shape Corp',
        nit: '900400500-4',
        telefono: '3001112225',
        ciudad: 'Pereira',
        createdAt: '2026-01-05T00:00:00Z',
      },
    ];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(mockClientes),
      ),
    );

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // THEN: Each item has a "nit" string field
    const cliente = result.current.data![0];
    expect(typeof cliente.nit).toBe('string');
    expect(cliente.nit).toBe('900400500-4');
  });

  test('each Cliente in data must have a "createdAt" field (string)', async () => {
    // GIVEN: API returns a client with a createdAt timestamp
    const mockClientes = [
      {
        id: 'ffffffff-0006-0000-0000-000000000006',
        nombre: 'CreatedAt Test Corp',
        nit: '900500600-5',
        telefono: '3001112226',
        ciudad: 'Bucaramanga',
        createdAt: '2026-06-09T12:00:00Z',
      },
    ];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(mockClientes),
      ),
    );

    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // THEN: Each item has a "createdAt" string field
    const cliente = result.current.data![0];
    expect(typeof cliente.createdAt).toBe('string');
    expect(cliente.createdAt).toBe('2026-06-09T12:00:00Z');
  });

  test('should expose isLoading: true while data is being fetched', async () => {
    // GIVEN: The API takes time to respond
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((r) => setTimeout(r, 5000));
        return HttpResponse.json([]);
      }),
    );

    // WHEN: useClientes is first called
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: isLoading is true before data arrives
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  test('should expose isError: true when the API call fails', async () => {
    // GIVEN: The API returns a 500 error
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ detail: 'Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: useClientes resolves with an error
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: isError is true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.data).toBeUndefined();
  });

  test('should expose a refetch function for manual retry', async () => {
    // GIVEN: The API returns clients successfully
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([
          {
            id: 'a1a1a1a1-0001-0000-0000-000000000001',
            nombre: 'Refetch Test',
            nit: '900700800-1',
            telefono: '3001112227',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ]),
      ),
    );

    // WHEN: useClientes is invoked
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function');
  });

  test('should use queryKey ["clientes"] for TanStack Query cache', async () => {
    // GIVEN: A client list is loaded
    let requestCount = 0;
    server.use(
      http.get('*/api/v1/clientes', () => {
        requestCount++;
        return HttpResponse.json([]);
      }),
    );

    // WHEN: Two instances of useClientes are rendered with same QueryClient
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    const { result: result1 } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => {
      expect(result1.current.data).toBeDefined();
    });

    const { result: result2 } = renderHook(() => useClientes(), { wrapper });

    await waitFor(() => {
      expect(result2.current.data).toBeDefined();
    });

    // THEN: Only 1 API call is made (cache hit for second instance with same queryKey)
    expect(requestCount).toBe(1);
  });
});
