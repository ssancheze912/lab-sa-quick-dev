/**
 * Unit Edge Case Tests — useClientes hook (Story 2.1)
 * BMad-Integrated Mode: expands coverage beyond the ATDD useClientes.test.ts.
 *
 * Edge cases covered:
 *   - queryKey is ['clientes'] (canonical key for cache invalidation in Stories 2.3-2.5)
 *   - refetch function is available in the returned object
 *   - Returns empty array data when API returns []
 *   - Returns correct data shape (all 7 fields present per client)
 *   - isSuccess becomes true after data is loaded
 *   - isLoading transitions from true to false after data arrives
 *   - 404 response causes isError=true
 *   - 500 response causes isError=true
 *   - data is undefined before the first successful fetch
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useClientes } from './useClientes';
import type { Cliente } from '../domain/Cliente';

// ─────────────────────────────────────────────────────────────────────────────
// MSW server
// ─────────────────────────────────────────────────────────────────────────────

const mockClientes: Cliente[] = [
  {
    id: 'ec-11111111-1111-1111-1111-111111111111',
    nombre: 'Empresa Edge Alpha',
    nit: '900000001-1',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'ec-22222222-2222-2222-2222-222222222222',
    nombre: 'Empresa Edge Beta',
    nit: '900000002-2',
    telefono: '3002222222',
    ciudad: 'Cali',
    createdAt: '2026-03-02T00:00:00Z',
    updatedAt: '2026-03-02T00:00:00Z',
  },
];

const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

// ─────────────────────────────────────────────────────────────────────────────
// Query key — canonical ['clientes'] cache key
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] useClientes — queryKey correctness', () => {

  it('[P0] should use queryKey ["clientes"] for cache storage', async () => {
    // GIVEN: A fresh QueryClient
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    // WHEN: useClientes is called and data is fetched
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: The cache has data under the ['clientes'] key
    const cachedData = queryClient.getQueryData(['clientes']);
    expect(cachedData).toBeDefined();
    expect(Array.isArray(cachedData)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Return value completeness
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useClientes — return value completeness', () => {

  it('[P1] should expose a refetch function in the return value', async () => {
    // GIVEN: useClientes hook
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    // WHEN: Hook is mounted
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: refetch is a callable function
    expect(typeof result.current.refetch).toBe('function');
  });

  it('[P1] should expose isLoading in the return value', async () => {
    // GIVEN: useClientes hook
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    // THEN: isLoading is a boolean
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('[P1] should expose isError in the return value', async () => {
    // GIVEN: useClientes hook
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: isError is a boolean and false after success
    expect(typeof result.current.isError).toBe('boolean');
    expect(result.current.isError).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Data shape — field validation
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useClientes — returned data shape', () => {

  it('[P1] should return an array of clientes with all 7 required fields', async () => {
    // GIVEN: useClientes hook with 2 mock clients
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    // WHEN: Data is fetched
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: Each client has all required fields
    const data = result.current.data!;
    expect(data.length).toBeGreaterThan(0);

    for (const cliente of data) {
      expect(cliente).toHaveProperty('id');
      expect(cliente).toHaveProperty('nombre');
      expect(cliente).toHaveProperty('nit');
      expect(cliente).toHaveProperty('telefono');
      expect(cliente).toHaveProperty('ciudad');
      expect(cliente).toHaveProperty('createdAt');
      expect(cliente).toHaveProperty('updatedAt');
    }
  });

  it('[P1] should return data as an empty array when API returns []', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([]))
    );
    const wrapper = createWrapper();

    // WHEN: useClientes is called
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: data is an empty array (not undefined/null)
    expect(result.current.data).toEqual([]);
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('[P2] should return data where all id fields are strings', async () => {
    // GIVEN: Mock clients with UUID string ids
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: All ids are strings (not numbers)
    for (const cliente of result.current.data!) {
      expect(typeof cliente.id).toBe('string');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error states — HTTP error codes
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useClientes — error state handling', () => {

  it('[P1] should set isError=true when API returns HTTP 500', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        new HttpResponse(null, { status: 500 })
      )
    );
    const wrapper = createWrapper();

    // WHEN: useClientes is called
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true, data is undefined
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('[P1] should set isError=true when API returns HTTP 404', async () => {
    // GIVEN: API returns 404
    server.use(
      http.get('*/api/v1/clientes', () =>
        new HttpResponse(null, { status: 404 })
      )
    );
    const wrapper = createWrapper();

    // WHEN: useClientes is called
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true
    expect(result.current.isError).toBe(true);
  });

  it('[P1] should set isError=true on network failure', async () => {
    // GIVEN: Network error
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.error())
    );
    const wrapper = createWrapper();

    // WHEN: useClientes is called
    const { result } = renderHook(() => useClientes(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: isError is true
    expect(result.current.isError).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Loading state transitions
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] useClientes — loading state transitions', () => {

  it('[P2] should transition isLoading from true to false after data loads', async () => {
    // GIVEN: useClientes hook
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // WHEN: Data arrives
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: isLoading is false
    expect(result.current.isLoading).toBe(false);
  });

  it('[P2] should have data=undefined before the first successful fetch completes', () => {
    // GIVEN: useClientes hook just mounted
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClientes(), { wrapper });

    // THEN: data is undefined while loading (not null, not [])
    // This is important so components distinguish loading from empty
    if (result.current.isLoading) {
      expect(result.current.data).toBeUndefined();
    }
  });
});
