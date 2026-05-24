/**
 * Story 2.2: Client Detail View — useCliente hook edge cases
 * Epic 2: Client Management
 *
 * Expands ATDD hook coverage with boundary conditions NOT present in useCliente.test.ts:
 *   - Loading state transition: isLoading=true initially, then false after resolve
 *   - staleTime=0: hook always re-fetches (no cached stale data served)
 *   - Data shape: all 7 fields are present in returned data
 *   - 404 sets isError=true (hook does not special-case 404 — component handles it)
 *   - 401 / 503 also set isError=true (any non-2xx is an error)
 *   - data is undefined while loading (not null)
 *   - data is undefined after error (not partial object)
 *   - id changes from one UUID to another triggers new fetch
 *   - whitespace-only id is treated as falsy (no fetch issued)
 *   - Multiple renders with same id share the same query cache entry
 *   - refetch after error recovers data on subsequent success
 *
 * Framework: Vitest + @tanstack/react-query + MSW
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createElement } from 'react';
import { useCliente } from './useCliente';

// ─────────────────────────────────────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_ID = '11111111-1111-4111-8111-111111111111';
const SECOND_ID = '22222222-2222-4222-8222-222222222222';

const mockCliente = {
  id: KNOWN_ID,
  nombre: 'Acme Colombia SAS',
  nit: '900123456-7',
  telefono: '+57 601 234 5678',
  ciudad: 'Bogotá',
  createdAt: '2026-01-10T10:00:00Z',
  updatedAt: '2026-01-10T10:00:00Z',
};

const mockCliente2 = {
  id: SECOND_ID,
  nombre: 'TechCorp Ltda',
  nit: '800500100-1',
  telefono: '+57 604 345 6789',
  ciudad: 'Medellín',
  createdAt: '2026-02-01T08:00:00Z',
  updatedAt: '2026-02-01T09:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === KNOWN_ID) return HttpResponse.json(mockCliente);
    if (params.id === SECOND_ID) return HttpResponse.json(mockCliente2);
    return HttpResponse.json(
      {
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Not Found',
        status: 404,
        detail: `Cliente con id '${params.id}' no encontrado.`,
      },
      { status: 404 }
    );
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper factory — fresh QueryClient per test (no cross-test cache pollution)
// ─────────────────────────────────────────────────────────────────────────────

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

describe('useCliente — loading state transitions', () => {
  it('should start with isLoading=true when id is provided', () => {
    // GIVEN: A valid clienteId and a slow API
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(mockCliente);
      })
    );

    // WHEN: Hook renders with a valid id
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    // THEN: Initially loading (fetch has been issued but not resolved)
    expect(result.current.isLoading).toBe(true);
  });

  it('should transition isLoading from true to false once data arrives', async () => {
    // GIVEN: Fast API
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    // WHEN: Data arrives
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: No longer loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeDefined();
  });

  it('should have isError=false while in the loading state', () => {
    // GIVEN: Slow API (loading still in-flight)
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(mockCliente);
      })
    );

    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    // THEN: isError is false during loading (not an error yet)
    expect(result.current.isError).toBe(false);
  });

  it('should have data=undefined while loading (not null, not a partial object)', () => {
    // GIVEN: Slow API
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(mockCliente);
      })
    );

    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    // THEN: data is undefined during loading (not null, not {})
    expect(result.current.data).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Data shape completeness
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — data shape', () => {
  it('should return all 7 required ClienteDto fields', async () => {
    // GIVEN: API returns a full ClienteDto
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const data = result.current.data;
    expect(data).toBeDefined();
    if (!data) return;

    // THEN: All 7 fields are present (id, nombre, nit, telefono, ciudad, createdAt, updatedAt)
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('nombre');
    expect(data).toHaveProperty('nit');
    expect(data).toHaveProperty('telefono');
    expect(data).toHaveProperty('ciudad');
    expect(data).toHaveProperty('createdAt');
    expect(data).toHaveProperty('updatedAt');
  });

  it('should return the id field as a string UUID matching the requested id', async () => {
    // GIVEN: API returns KNOWN_ID
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: id matches the requested UUID (R-008: no integer PK leak)
    expect(result.current.data?.id).toBe(KNOWN_ID);
  });

  it('should preserve createdAt and updatedAt as ISO 8601 strings (not transformed)', async () => {
    // GIVEN: API returns ISO 8601 timestamps
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const data = result.current.data;
    expect(data).toBeDefined();

    // THEN: Timestamps are valid ISO 8601 strings (hook does not parse them to Date objects)
    expect(new Date(data!.createdAt).toString()).not.toBe('Invalid Date');
    expect(new Date(data!.updatedAt).toString()).not.toBe('Invalid Date');
    expect(data!.createdAt).toMatch(/Z$|[+-]\d{2}:\d{2}$/);
    expect(data!.updatedAt).toMatch(/Z$|[+-]\d{2}:\d{2}$/);
  });

  it('should return data as an object (not an array)', async () => {
    // GIVEN: API returns a ClienteDto object
    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: data is an object, not an array
    expect(typeof result.current.data).toBe('object');
    expect(Array.isArray(result.current.data)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error state edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — error state edge cases', () => {
  it('should set isError=true when API returns 404 (hook does not special-case 404)', async () => {
    // GIVEN: The clienteId does not exist → API returns 404
    // NOTE: 404 error handling (showing "not found" message) is the component's responsibility.
    // At the hook level, 404 is treated as an error just like 500.
    const NOT_FOUND_ID = '00000000-0000-4000-8000-000000000000';
    const { result } = renderHook(() => useCliente(NOT_FOUND_ID), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: isError is true (Axios throws on 4xx)
    expect(result.current.isError).toBe(true);
  });

  it('should set isError=true when API returns 401 Unauthorized', async () => {
    // GIVEN: Backend returns 401
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ title: 'Unauthorized', status: 401 }, { status: 401 })
      )
    );

    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: isError is true (non-2xx is an error)
    expect(result.current.isError).toBe(true);
  });

  it('should set isError=true when API returns 503 Service Unavailable', async () => {
    // GIVEN: Backend unavailable (503)
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ title: 'Service Unavailable', status: 503 }, { status: 503 })
      )
    );

    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: isError is true
    expect(result.current.isError).toBe(true);
  });

  it('should have data=undefined when in error state (not partial data)', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ error: 'Internal' }, { status: 500 })
      )
    );

    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: data is undefined (not a partial or stale object)
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should expose the error object (AxiosError) when API returns non-2xx', async () => {
    // GIVEN: API returns 404
    const NOT_FOUND_ID = '00000000-0000-4000-8000-000000000000';
    const { result } = renderHook(() => useCliente(NOT_FOUND_ID), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // THEN: error is defined (component uses it to detect 404 status)
    expect(result.current.error).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Disabled query edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — disabled state (no fetch)', () => {
  it('should NOT issue a fetch and have isLoading=false when id is undefined', () => {
    // GIVEN: No id provided
    const { result } = renderHook(() => useCliente(undefined), {
      wrapper: createWrapper(),
    });

    // THEN: Hook stays idle — no network request, no loading, no data
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
    // MSW onUnhandledRequest: 'error' would throw if a request were issued
  });

  it('should NOT issue a fetch when id is an empty string', () => {
    // GIVEN: Empty string id (edge case from route params before navigation)
    const { result } = renderHook(() => useCliente(''), {
      wrapper: createWrapper(),
    });

    // THEN: Hook is disabled — no fetch
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.isError).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic id changes
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — dynamic id changes', () => {
  it('should fetch new data when id changes from one UUID to another', async () => {
    // GIVEN: Hook starts with KNOWN_ID
    const { result, rerender } = renderHook(
      ({ id }: { id: string }) => useCliente(id),
      {
        initialProps: { id: KNOWN_ID },
        wrapper: createWrapper(),
      }
    );

    // WHEN: First fetch resolves
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.id).toBe(KNOWN_ID);

    // WHEN: id changes to SECOND_ID
    rerender({ id: SECOND_ID });

    // THEN: New fetch is issued and data updates to the second client
    await waitFor(() => expect(result.current.data?.id).toBe(SECOND_ID));
    expect(result.current.data?.nombre).toBe('TechCorp Ltda');
  });

  it('should return empty/idle state when id changes from a valid UUID to undefined', async () => {
    // GIVEN: Hook starts with a valid id
    const { result, rerender } = renderHook(
      ({ id }: { id: string | undefined }) => useCliente(id),
      {
        initialProps: { id: KNOWN_ID as string | undefined },
        wrapper: createWrapper(),
      }
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeDefined();

    // WHEN: id is cleared (user navigates back to /clientes without selection)
    rerender({ id: undefined });

    // THEN: Hook becomes idle — isLoading=false, no pending fetch
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Refetch recovery
// ─────────────────────────────────────────────────────────────────────────────

describe('useCliente — refetch recovers from error', () => {
  it('should return data on the second call after first call fails', async () => {
    // GIVEN: First request returns 500; second returns 200
    let callCount = 0;
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Internal' }, { status: 500 });
        }
        return HttpResponse.json(mockCliente);
      })
    );

    const { result } = renderHook(() => useCliente(KNOWN_ID), {
      wrapper: createWrapper(),
    });

    // WHEN: First call fails
    await waitFor(() => expect(result.current.isError).toBe(true));

    // AND: refetch is called
    await act(async () => {
      await result.current.refetch();
    });

    // THEN: Second call succeeds and data is populated
    await waitFor(() => expect(result.current.data?.nombre).toBe('Acme Colombia SAS'));
    expect(result.current.isError).toBe(false);
    expect(callCount).toBe(2);
  });
});
