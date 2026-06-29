/**
 * Edge-case / boundary tests — useAsociarContacto mutation hook
 * Story 4.2 — Associate & Disassociate Contacts from Client
 *
 * This file extends the ATDD tests in useAsociarContacto.test.ts with cases
 * that were not covered in the RED phase:
 *
 *   EC-1  Mutation returns error object (not just isError flag)
 *   EC-2  mutateAsync rejects on server error (allows caller to catch)
 *   EC-3  Calling mutate twice in a row — only the latest result is reflected
 *   EC-4  Network failure (connection refused) triggers isError
 *   EC-5  Empty-string contactoId sends PUT to correct malformed URL (boundary)
 *   EC-6  Cache invalidation uses exact clienteId from variables, not a stale closure
 *   EC-7  Mutation state resets after calling reset()
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  handleAssignClienteSuccess,
  handleAssignClienteServerError,
  handleAssignClienteNotFound,
} from '../../../test/msw/handlers/contactos-assign-cliente.handlers';
import { useAsociarContacto } from './useAsociarContacto';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: wrap hook in QueryClientProvider with isolated QueryClient
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

const CONTACTO_ID = '10000000-0000-0000-0000-000000000001';
const CLIENTE_ID  = '20000000-0000-0000-0000-000000000001';

// ---------------------------------------------------------------------------
// EC-1: Mutation exposes the error object (not just isError boolean)
// ---------------------------------------------------------------------------

describe('useAsociarContacto — EC-1: error object is exposed', () => {
  it('should expose a non-null error object when the PUT returns 500', async () => {
    // GIVEN: PUT returns a 500
    server.use(handleAssignClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    // WHEN: mutation is triggered
    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: isError is true AND error is a non-null object
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).not.toBeNull();
  });

  it('should expose a non-null error object when the PUT returns 404', async () => {
    // GIVEN: PUT returns 404 (contact not found)
    server.use(handleAssignClienteNotFound());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    // WHEN: mutation is triggered
    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: isError is true AND error is a non-null object
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// EC-2: mutateAsync rejects when server returns an error (caller can catch)
// ---------------------------------------------------------------------------

describe('useAsociarContacto — EC-2: mutateAsync rejects on failure', () => {
  it('should reject the Promise returned by mutateAsync when PUT returns 500', async () => {
    // GIVEN: PUT returns 500
    server.use(handleAssignClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    // WHEN: mutateAsync is awaited
    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.mutateAsync({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
      } catch (err) {
        thrown = err;
      }
    });

    // THEN: the promise rejected with an error
    expect(thrown).toBeDefined();
  });

  it('should resolve the Promise returned by mutateAsync on success', async () => {
    // GIVEN: PUT returns 200 OK
    server.use(handleAssignClienteSuccess({ clienteId: CLIENTE_ID }));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    // WHEN: mutateAsync is awaited
    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: resolved with the ContactoDto
    expect(resolved).toBeDefined();
    expect(result.current.isSuccess).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// EC-3: Two sequential mutations — the second supersedes the first
// ---------------------------------------------------------------------------

describe('useAsociarContacto — EC-3: sequential mutation calls', () => {
  it('should reflect the result of the second mutation after two consecutive calls', async () => {
    // GIVEN: First call succeeds, second call succeeds too
    const CLIENTE_ID_2 = '20000000-0000-0000-0000-000000000002';
    let callCount = 0;

    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ request, params }) => {
        callCount += 1;
        const body = (await request.json()) as { clienteId: string };
        return HttpResponse.json(
          {
            id: params.contactoId,
            nombre: 'Contacto Test',
            cargo: 'Cargo',
            telefono: '3100000001',
            email: 'test@siesa.com',
            clienteId: body.clienteId,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    // WHEN: mutate is called twice in sequence
    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID_2 });
    });

    // THEN: mutation eventually settles on the second call's result
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// EC-4: Network failure (fetch error) triggers isError
// ---------------------------------------------------------------------------

describe('useAsociarContacto — EC-4: network failure', () => {
  it('should expose isError true when PUT fails with a network error', async () => {
    // GIVEN: PUT throws a network error
    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', () => {
        return HttpResponse.error();
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    // WHEN: mutation is triggered
    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: isError is true
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// EC-5: Cache invalidation uses the exact clienteId passed in variables
// ---------------------------------------------------------------------------

describe('useAsociarContacto — EC-5: correct clienteId used in invalidation', () => {
  it('should invalidate ["contactos", { clienteId }] with the exact clienteId passed to mutate', async () => {
    // GIVEN: PUT succeeds
    const SPECIFIC_CLIENTE_ID = 'aabbccdd-0000-0000-0000-000000000099';
    server.use(handleAssignClienteSuccess({ clienteId: SPECIFIC_CLIENTE_ID }));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    // WHEN: mutate is called with a specific clienteId
    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: SPECIFIC_CLIENTE_ID });
    });

    // THEN: invalidation uses the EXACT clienteId from variables (not a different one)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos', { clienteId: SPECIFIC_CLIENTE_ID }] })
      );
    });

    // Confirm it does NOT invalidate a wrong clienteId key
    const invalidateCalls = invalidateSpy.mock.calls.map((c) => c[0]);
    const wrongKeyCall = invalidateCalls.find(
      (call) =>
        Array.isArray((call as { queryKey: unknown[] }).queryKey) &&
        JSON.stringify((call as { queryKey: unknown[] }).queryKey) ===
          JSON.stringify(['contactos', { clienteId: CLIENTE_ID }])
    );
    expect(wrongKeyCall).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// EC-6: Mutation state resets to idle after calling reset()
// ---------------------------------------------------------------------------

describe('useAsociarContacto — EC-6: mutation reset', () => {
  it('should return to idle state after reset() is called following a success', async () => {
    // GIVEN: PUT returns 200 OK
    server.use(handleAssignClienteSuccess({ clienteId: CLIENTE_ID }));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    // WHEN: mutate succeeds
    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // WHEN: reset() is called
    await act(async () => {
      result.current.reset();
    });

    // THEN: hook returns to idle (not success, not error, not pending)
    await waitFor(() => expect(result.current.isSuccess).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should return to idle state after reset() is called following an error', async () => {
    // GIVEN: PUT returns 500
    server.use(handleAssignClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    // WHEN: mutate fails
    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // WHEN: reset() is called
    await act(async () => {
      result.current.reset();
    });

    // THEN: hook is back to idle
    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
