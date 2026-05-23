/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Unit tests for useClientes hook (Vitest + MSW) — RED Phase
 * Tests fail until useClientes hook and clienteApiRepository are implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — Hook returns list of clients from GET /api/v1/clientes
 *   AC4 — Hook exposes isError flag on network failure (never raw error.message)
 *
 * Test Cases: TC-E2-P1-01 (hook layer), TC-E2-P1-03 (error state)
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// These modules do not exist yet — tests will fail (RED phase)
import { useClientes } from './useClientes';

// ─── MSW Server Setup ────────────────────────────────────────────────────────

const mockClientes = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    nombre: 'Acme Colombia SA',
    nit: '900111222',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    nombre: 'Beta Ltda',
    nit: '800333444',
    telefono: '3109876543',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    nombre: 'Gamma Corp',
    nit: '700555666',
    telefono: '3207654321',
    ciudad: 'Cali',
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-03T00:00:00Z',
  },
];

const server = setupServer(
  http.get('*/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Wrapper ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — useClientes returns data from GET /api/v1/clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — data fetching', () => {
  test('should return 3 clients when GET /api/v1/clientes responds with 3 records', async () => {
    // GIVEN: MSW intercepts GET /api/v1/clientes and returns 3 clients
    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: Hook eventually returns the 3 mock clients
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data![0].nombre).toBe('Acme Colombia SA');
    expect(result.current.data![0].nit).toBe('900111222');
  });

  test('should set isLoading=true initially and isLoading=false after fetch completes', async () => {
    // GIVEN: MSW intercepts GET /api/v1/clientes
    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: Loading state transitions from true to false
    // Initial state is loading
    expect(result.current.isLoading).toBe(true);

    // After resolution loading is false and data is available
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeDefined();
  });

  test('should return clients with all required fields: id, nombre, nit, telefono, ciudad, createdAt, updatedAt', async () => {
    // GIVEN: MSW returns a list of clients with all DTO fields
    // WHEN: useClientes hook resolves
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: Each client has all required domain fields
    const cliente = result.current.data![0];
    expect(cliente).toHaveProperty('id');
    expect(cliente).toHaveProperty('nombre');
    expect(cliente).toHaveProperty('nit');
    expect(cliente).toHaveProperty('telefono');
    expect(cliente).toHaveProperty('ciudad');
    expect(cliente).toHaveProperty('createdAt');
    expect(cliente).toHaveProperty('updatedAt');
  });

  test('should use queryKey ["clientes"] for TanStack Query cache', async () => {
    // GIVEN: A QueryClient with manual cache seeding
    // WHEN: useClientes hook is rendered (validates canonical query key)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Pre-seed the cache with the canonical key
    queryClient.setQueryData(['clientes'], mockClientes);

    const wrapper = function Wrapper({ children }: { children: ReactNode }) {
      return createElement(QueryClientProvider, { client: queryClient }, children);
    };

    const { result } = renderHook(() => useClientes(), { wrapper });

    // THEN: Hook reads from ['clientes'] cache immediately (no fetch needed)
    expect(result.current.data).toHaveLength(3);
    expect(result.current.isLoading).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — useClientes exposes isError flag on network failure
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — error handling', () => {
  test('should set isError=true when GET /api/v1/clientes returns a network error', async () => {
    // GIVEN: MSW simulates a network error for GET /api/v1/clientes
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error();
      })
    );

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: isError flag is set to true (hook never exposes raw error.message)
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  test('should set isError=true when GET /api/v1/clientes returns HTTP 500', async () => {
    // GIVEN: MSW returns a 500 server error
    server.use(
      http.get('*/api/v1/clientes', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: isError flag is true; data remains undefined
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  test('should expose a refetch function for retry capability (AC4)', async () => {
    // GIVEN: useClientes hook rendered with error state
    // WHEN: the hook is inspected for its API surface
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: refetch is a callable function (needed by ErrorPanel's Reintentar button)
    expect(typeof result.current.refetch).toBe('function');
  });
});
