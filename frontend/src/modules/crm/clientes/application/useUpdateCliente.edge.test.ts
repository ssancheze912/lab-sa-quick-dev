/**
 * Edge-case unit tests — useUpdateCliente application hook
 * Story 2.4 — Edit Client — Automation Expansion
 *
 * Complements useUpdateCliente.test.ts (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - mutateAsync resolves with updated ClienteDto on 200
 *   - mutateAsync rejects on 500 error
 *   - isError resets to false after a subsequent successful mutation
 *   - hook works without options argument (no onSuccess callback)
 *   - error object is defined (not null/undefined) after PUT failure
 *   - Both queryKeys invalidated with exact structure (not nested array)
 *   - Mutation data is the updated ClienteDto on success
 *   - isSuccess transitions correctly after successful PUT
 *
 * Test stack: Vitest + @testing-library/react + MSW 2
 * Given-When-Then format.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  handlePutClienteSuccess,
  handlePutClienteServerError,
} from '../../../test/msw/handlers/clientes-update.handlers';
import { handleGetClientesSuccess } from '../../../test/msw/handlers/clientes.handlers';
import { useUpdateCliente } from './useUpdateCliente';

// ---------------------------------------------------------------------------
// MSW server
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
// Helpers
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

const CLIENT_ID = '00000000-0000-0000-0000-000000000001';

const VALID_PAYLOAD = {
  nombre: 'Delta SA',
  nit: '888888888-8',
  telefono: '3219876543',
  ciudad: 'Medellín',
};

const UPDATED_CLIENTE = {
  id: CLIENT_ID,
  ...VALID_PAYLOAD,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-29T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Edge: mutateAsync resolves with updated ClienteDto on 200
// ---------------------------------------------------------------------------

describe('useUpdateCliente — mutateAsync variant', () => {
  it('[P2] should resolve mutateAsync with the updated ClienteDto when backend returns 200', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 200 with updated dto
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    let resolvedData: unknown;

    // WHEN: mutateAsync is awaited
    await act(async () => {
      resolvedData = await result.current.mutateAsync({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    // THEN: resolved value is the updated ClienteDto
    expect(resolvedData).toMatchObject({
      id: CLIENT_ID,
      nombre: VALID_PAYLOAD.nombre,
      ciudad: VALID_PAYLOAD.ciudad,
    });
  });

  it('[P2] should reject mutateAsync when backend returns 500', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 500
    server.use(handlePutClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    let threwError = false;

    // WHEN: mutateAsync is called — it should throw
    await act(async () => {
      try {
        await result.current.mutateAsync({ id: CLIENT_ID, data: VALID_PAYLOAD });
      } catch {
        threwError = true;
      }
    });

    // THEN: mutateAsync rejected with an error
    expect(threwError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge: isError resets to false after successful retry following an error
// ---------------------------------------------------------------------------

describe('useUpdateCliente — error state resets on success', () => {
  it('[P2] should reset isError to false when mutate succeeds after a previous failure', async () => {
    // GIVEN: First call fails with 500
    server.use(handlePutClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    // First mutate → error
    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // GIVEN: Second call succeeds
    server.resetHandlers();
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    // WHEN: mutate is called again with valid data
    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    // THEN: isError is false and isSuccess is true
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isError).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: hook works without options argument
// ---------------------------------------------------------------------------

describe('useUpdateCliente — invoked without options', () => {
  it('[P2] should not throw when called without any options and mutation succeeds', async () => {
    // GIVEN: PUT returns 200
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    const { wrapper } = createWrapper();

    // WHEN: useUpdateCliente called with no options at all
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    // THEN: succeeds without throwing
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: error object is defined after PUT failure
// ---------------------------------------------------------------------------

describe('useUpdateCliente — error object on failure', () => {
  it('[P1] should expose a non-null error object when PUT mutation fails', async () => {
    // GIVEN: PUT returns 500
    server.use(handlePutClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    // WHEN: mutate is called and fails
    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    // THEN: error is defined
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error).toBeDefined();
  });

  it('[P2] should have null error object before any mutation is triggered', () => {
    // GIVEN: No mutation has been triggered
    server.use(handlePutClienteSuccess());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    // THEN: error is null in idle state
    expect(result.current.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Edge: Both queryKeys invalidated with exact structure
// ---------------------------------------------------------------------------

describe('useUpdateCliente — queryKey structure for invalidation', () => {
  it('[P1] should call invalidateQueries with { queryKey: ["clientes"] } (flat array, not nested)', async () => {
    // GIVEN: PUT returns 200
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: At least one call with the list queryKey
    const listCall = invalidateSpy.mock.calls.find(
      (call) => {
        const arg = call[0] as { queryKey: unknown[] };
        return JSON.stringify(arg.queryKey) === JSON.stringify(['clientes']);
      }
    );
    expect(listCall).toBeDefined();

    // THEN: The list queryKey is a flat array, NOT nested
    if (listCall) {
      const arg = listCall[0] as { queryKey: unknown[] };
      expect(Array.isArray(arg.queryKey)).toBe(true);
      expect(arg.queryKey).not.toEqual([['clientes']]);
      expect(arg.queryKey).toEqual(['clientes']);
    }
  });

  it('[P1] should call invalidateQueries with { queryKey: ["clientes", id] } including the exact id', async () => {
    // GIVEN: PUT returns 200
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: One call with the detail queryKey containing the exact id
    const detailCall = invalidateSpy.mock.calls.find(
      (call) => {
        const arg = call[0] as { queryKey: unknown[] };
        return JSON.stringify(arg.queryKey) === JSON.stringify(['clientes', CLIENT_ID]);
      }
    );
    expect(detailCall).toBeDefined();
  });

  it('[P1] should call invalidateQueries exactly twice on success (once per queryKey)', async () => {
    // GIVEN: PUT returns 200
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: invalidateQueries called exactly twice (once for list, once for detail)
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Edge: Mutation data is the updated ClienteDto on success
// ---------------------------------------------------------------------------

describe('useUpdateCliente — mutation result data', () => {
  it('[P1] should expose result data as the updated ClienteDto returned by the backend on success', async () => {
    // GIVEN: PUT returns 200 with updated dto
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    // THEN: mutation data matches the returned ClienteDto
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      id: CLIENT_ID,
      nombre: VALID_PAYLOAD.nombre,
      nit: VALID_PAYLOAD.nit,
    });
  });

  it('[P2] should keep data as undefined after a 500 error', async () => {
    // GIVEN: PUT returns 500
    server.use(handlePutClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: data is not set (no partial response)
    expect(result.current.data).toBeUndefined();
  });
});
