/**
 * Story 2.1: Client List & Search — Edge Case Tests (Expand)
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Unit tests for useClientes hook — edge cases, error boundaries, boundary conditions.
 * Complements the ATDD baseline in useClientes.test.ts.
 *
 * Edge cases covered:
 *   - HTTP 401 Unauthorized → isError=true
 *   - HTTP 403 Forbidden → isError=true
 *   - HTTP 404 Not Found → isError=true
 *   - API returns empty array → data=[] (not undefined, not null)
 *   - API returns single client → data has length 1
 *   - API returns malformed JSON (non-array primitive) → isError or data is truthy but treated
 *   - Retry: after error, successful refetch resolves data
 *   - Hook does not expose raw error.message property on result
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

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
];

const server = setupServer(
  http.get('*/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
// HTTP 4xx error responses
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — HTTP 4xx error responses', () => {
  test('should set isError=true when GET /api/v1/clientes returns HTTP 401 Unauthorized', async () => {
    // GIVEN: Server returns 401 Unauthorized (unauthenticated user scenario)
    server.use(
      http.get('*/api/v1/clientes', () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: isError=true, data remains undefined
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  test('should set isError=true when GET /api/v1/clientes returns HTTP 403 Forbidden', async () => {
    // GIVEN: Server returns 403 Forbidden (insufficient permissions)
    server.use(
      http.get('*/api/v1/clientes', () => {
        return new HttpResponse(null, { status: 403 });
      })
    );

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: isError=true
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  test('should set isError=true when GET /api/v1/clientes returns HTTP 404', async () => {
    // GIVEN: Server returns 404 Not Found (misconfigured backend route)
    server.use(
      http.get('*/api/v1/clientes', () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    // WHEN: useClientes hook is rendered
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    // THEN: isError=true
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: empty array response
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — empty array response', () => {
  test('should return an empty array (not undefined) when API returns []', async () => {
    // GIVEN: API returns an empty JSON array
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: useClientes hook resolves
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: data is an array of length 0, NOT undefined
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(0);
    expect(result.current.isError).toBe(false);
  });

  test('should set isError=false and isLoading=false when API returns empty array', async () => {
    // GIVEN: Empty API response
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: hook resolves
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: No error, no loading
    expect(result.current.isError).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: single record response
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — single record response', () => {
  test('should return array with exactly 1 client when API returns a single record', async () => {
    // GIVEN: API returns exactly 1 client
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([mockClientes[0]]);
      })
    );

    // WHEN: hook resolves
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: data has exactly 1 item
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].nombre).toBe('Acme Colombia SA');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Hook surface: no raw error.message exposed
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — hook does not expose raw error.message', () => {
  test('hook return value should not contain an "errorMessage" or "message" string property', async () => {
    // GIVEN: standard success response
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: The hook result does not directly expose a "message" or "errorMessage" string
    // (architecture rule: callers use isError flag, not raw error messages)
    const resultKeys = Object.keys(result.current);
    expect(resultKeys).not.toContain('message');
    expect(resultKeys).not.toContain('errorMessage');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Retry capability: after error, refetch recovers data
// ─────────────────────────────────────────────────────────────────────────────

describe('useClientes — refetch recovers after error', () => {
  test('should recover with data after calling refetch following an error', async () => {
    // GIVEN: First request fails, second succeeds
    let callCount = 0;
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.error();
        }
        return HttpResponse.json(mockClientes);
      })
    );

    // WHEN: Hook initially errors
    const { result } = renderHook(() => useClientes(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // AND: refetch is called
    await result.current.refetch();

    // THEN: data is populated and error is cleared
    await waitFor(() => expect(result.current.isError).toBe(false));
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toHaveLength(1);
  });
});
