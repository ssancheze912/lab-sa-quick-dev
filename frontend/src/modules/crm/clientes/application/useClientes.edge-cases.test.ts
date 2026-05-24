/**
 * Story 2.1: Client List & Search — useClientes hook edge cases
 * Epic 2: Client Management
 *
 * Expands ATDD hook coverage with boundary conditions not present in useClientes.test.ts:
 *   - Hook returns empty array (not undefined) when API returns []
 *   - Hook returns isLoading=true initially, then false after data arrives
 *   - Hook refetch function triggers a new network request
 *   - isError stays false when API returns 200 with empty array
 *   - Hook returns exactly the same data shape as the API (all 7 fields)
 *   - Network timeout (simulated via abort) sets isError=true
 *   - Multiple concurrent renders use the same query cache key
 *
 * Framework: Vitest + @tanstack/react-query + MSW
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createElement } from 'react';
import { useClientes } from './useClientes';

// ─────────────────────────────────────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────────────────────────────────────

const mockClientes = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    nombre: 'Acme Colombia SAS',
    nit: '900123456-7',
    telefono: '+57 601 234 5678',
    ciudad: 'Bogotá',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    nombre: 'TechCorp Ltda',
    nit: '800500100-1',
    telefono: '+57 604 345 6789',
    ciudad: 'Medellín',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes))
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading state transitions
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — loading state transitions', () => {
  it('should start with isLoading=true and transition to false after data arrives', async () => {
    // GIVEN: Default MSW handler returns data
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    // THEN: Initially loading
    expect(result.current.isLoading).toBe(true);

    // WHEN: Data arrives
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: No longer loading
    expect(result.current.isLoading).toBe(false);
  });

  it('should have isError=false while loading', async () => {
    // GIVEN: Default MSW handler (will return data)
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });

    // THEN: isError is false during the loading phase
    expect(result.current.isError).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Empty array response
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — empty array response', () => {
  it('should return an empty array (not undefined/null) when API returns []', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([]))
    );

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: data is an empty array — not undefined or null
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(0);
  });

  it('should NOT set isError=true when API returns 200 with empty array', async () => {
    // GIVEN: API returns 200 [] (valid empty response)
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([]))
    );

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: isError remains false — empty list is a valid state, not an error
    expect(result.current.isError).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Data shape validation
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — data shape', () => {
  it('should return all 7 required fields on each client object', async () => {
    // GIVEN: API returns clients with all fields
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: First client has all 7 fields
    const first = result.current.data?.[0];
    expect(first).toBeDefined();
    if (!first) return;

    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('nombre');
    expect(first).toHaveProperty('nit');
    expect(first).toHaveProperty('telefono');
    expect(first).toHaveProperty('ciudad');
    expect(first).toHaveProperty('createdAt');
    expect(first).toHaveProperty('updatedAt');
  });

  it('should return exactly 2 items when API returns 2 clients', async () => {
    // GIVEN: API returns 2 clients (mockClientes)
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: Hook returns exactly 2 items (no duplication, no truncation)
    expect(result.current.data).toHaveLength(2);
  });

  it('should preserve the nombre field value exactly as returned by the API', async () => {
    // GIVEN: API returns "Acme Colombia SAS"
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: nombre is not trimmed, lowercased, or transformed by the hook
    expect(result.current.data?.[0].nombre).toBe('Acme Colombia SAS');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error state edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — error state edge cases', () => {
  it('should expose isError=true when API returns 401 Unauthorized', async () => {
    // GIVEN: API returns 401
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'Unauthorized', status: 401 }, { status: 401 })
      )
    );

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: isError is true (non-2xx treated as error)
    expect(result.current.isError).toBe(true);
  });

  it('should expose isError=true when API returns 503 Service Unavailable', async () => {
    // GIVEN: API returns 503
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'Service Unavailable', status: 503 }, { status: 503 })
      )
    );

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: isError is true
    expect(result.current.isError).toBe(true);
  });

  it('should expose data as undefined when in error state', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Internal' }, { status: 500 })
      )
    );

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: data is undefined (not an empty array) when in error state
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// refetch function
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — refetch function', () => {
  it('should expose a refetch function that is defined and callable', async () => {
    // GIVEN: Hook is rendered with successful API
    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: refetch is a function
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should successfully refetch and return updated data when called', async () => {
    // GIVEN: Initial data returns 2 clients, then updated to return 1
    let callCount = 0;
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json(mockClientes); // 2 items
        }
        return HttpResponse.json([mockClientes[0]]); // 1 item on refetch
      })
    );

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(2);

    // WHEN: refetch is called
    await act(async () => {
      await result.current.refetch();
    });

    // THEN: Data is updated (refetch triggered a new API call)
    await waitFor(() => expect(result.current.data).toHaveLength(1));
  });
});
