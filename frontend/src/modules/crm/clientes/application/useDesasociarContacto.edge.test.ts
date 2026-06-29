/**
 * Edge-case / boundary tests — useDesasociarContacto mutation hook
 * Story 4.2 — Associate & Disassociate Contacts from Client
 *
 * This file extends the ATDD tests in useDesasociarContacto.test.ts with cases
 * that were not covered in the RED phase:
 *
 *   EC-1  Mutation returns error object (not just isError flag)
 *   EC-2  mutateAsync rejects on server error (allows caller to catch)
 *   EC-3  Always sends { clienteId: null } regardless of clienteId in variables
 *   EC-4  Network failure (fetch error) triggers isError
 *   EC-5  Cache invalidation uses the exact clienteId from variables
 *   EC-6  Mutation state resets after calling reset()
 *   EC-7  Disassociating a contact already without a client still returns 200 (idempotent)
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
import { useDesasociarContacto } from './useDesasociarContacto';

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
// Helper
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

describe('useDesasociarContacto — EC-1: error object is exposed', () => {
  it('should expose a non-null error object when PUT returns 500', async () => {
    // GIVEN: PUT returns 500
    server.use(handleAssignClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).not.toBeNull();
  });

  it('should expose a non-null error object when PUT returns 404', async () => {
    // GIVEN: PUT returns 404 (contact not found)
    server.use(handleAssignClienteNotFound());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// EC-2: mutateAsync rejects on failure / resolves on success
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — EC-2: mutateAsync promise behavior', () => {
  it('should reject the Promise returned by mutateAsync when PUT returns 500', async () => {
    // GIVEN: PUT returns 500
    server.use(handleAssignClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.mutateAsync({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
      } catch (err) {
        thrown = err;
      }
    });

    expect(thrown).toBeDefined();
  });

  it('should resolve when PUT returns 200', async () => {
    // GIVEN: PUT returns 200 OK with null clienteId
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.mutateAsync({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    expect(resolved).toBeDefined();
    expect(result.current.isSuccess).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// EC-3: Hook always sends { clienteId: null } regardless of variables.clienteId
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — EC-3: always sends null clienteId in body', () => {
  it('should send { clienteId: null } in PUT body even when a clienteId is provided in variables', async () => {
    // GIVEN: We capture what body was sent
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ request, params }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: params.contactoId,
            nombre: 'Contacto Test',
            cargo: 'Cargo',
            telefono: '3100000001',
            email: 'test@siesa.com',
            clienteId: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    // WHEN: mutate is called with a clienteId in variables (should be ignored in body)
    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // THEN: body always contains { clienteId: null } — disassociation invariant
    expect(capturedBody).toEqual({ clienteId: null });
  });
});

// ---------------------------------------------------------------------------
// EC-4: Network failure triggers isError
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — EC-4: network failure', () => {
  it('should expose isError true when PUT fails with a network error', async () => {
    // GIVEN: PUT throws a network error
    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', () => HttpResponse.error())
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// EC-5: Cache invalidation uses the exact clienteId from variables
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — EC-5: correct clienteId in cache invalidation', () => {
  it('should invalidate ["contactos", { clienteId }] with the exact clienteId from variables', async () => {
    // GIVEN: PUT succeeds
    const SPECIFIC_CLIENTE_ID = 'aabbccdd-0000-0000-0000-000000000099';
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    // WHEN: mutate is called with a specific clienteId
    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: SPECIFIC_CLIENTE_ID });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos', { clienteId: SPECIFIC_CLIENTE_ID }] })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// EC-6: Mutation state resets after calling reset()
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — EC-6: mutation reset', () => {
  it('should return to idle after reset() is called following a success', async () => {
    // GIVEN: PUT returns 200 OK
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      result.current.reset();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should return to idle after reset() is called following an error', async () => {
    // GIVEN: PUT returns 500
    server.use(handleAssignClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    await act(async () => {
      result.current.reset();
    });

    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// EC-7: Idempotent disassociation — calling disassociate on already-null clienteId
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — EC-7: idempotent disassociation', () => {
  it('should succeed and return null clienteId even if contact was already disassociated', async () => {
    // GIVEN: Contact already has clienteId: null; PUT still returns 200 OK
    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ params }) => {
        return HttpResponse.json(
          {
            id: params.contactoId,
            nombre: 'Contacto Sin Cliente',
            cargo: 'Cargo',
            telefono: '3100000001',
            email: 'test@siesa.com',
            clienteId: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    // WHEN: disassociate is called on a contact with no client
    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: hook reports success (server accepted the idempotent operation)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });
});
