/**
 * Edge-case unit tests — useUpdateContacto application hook
 * Story 3.4 — Edit Contact — Automation Expansion
 *
 * Complements useUpdateContacto.test.ts (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - mutateAsync resolves with updated ContactoDto on 200
 *   - mutateAsync rejects on 500 error
 *   - isError resets to false after a subsequent successful mutation
 *   - hook works without options argument (no onSuccess callback)
 *   - error object is defined (not null/undefined) after PUT failure
 *   - Both queryKeys invalidated with exact flat structure (not nested array)
 *   - invalidateQueries called exactly twice on success
 *   - Mutation data is the updated ContactoDto on success
 *   - isSuccess transitions correctly after successful PUT
 *   - error object is null before any mutation is triggered
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
  handlePutContactoSuccess,
  handlePutContactoServerError,
} from '../../../../test/msw/handlers/contactos-update.handlers';
import { handleGetContactosSuccess } from '../../../../test/msw/handlers/contactos.handlers';
import { useUpdateContacto } from './useUpdateContacto';

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

const CONTACT_ID = '00000000-0000-0000-0000-000000000042';

const VALID_PAYLOAD = {
  nombre: 'Ana López',
  cargo: 'Gerente',
  telefono: '3001234567',
  email: 'ana.lopez@siesa.com',
};

const UPDATED_CONTACTO = {
  id: CONTACT_ID,
  ...VALID_PAYLOAD,
  clienteId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-29T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Edge: mutateAsync resolves with updated ContactoDto on 200
// ---------------------------------------------------------------------------

describe('useUpdateContacto — mutateAsync variant', () => {
  it('[P2] should resolve mutateAsync with the updated ContactoDto when backend returns 200', async () => {
    // GIVEN: PUT /api/v1/contactos/:id returns 200 with updated dto
    server.use(
      handlePutContactoSuccess(),
      handleGetContactosSuccess([UPDATED_CONTACTO])
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    let resolvedData: unknown;

    // WHEN: mutateAsync is awaited
    await act(async () => {
      resolvedData = await result.current.mutateAsync({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    // THEN: resolved value is the updated ContactoDto
    expect(resolvedData).toMatchObject({
      id: CONTACT_ID,
      nombre: VALID_PAYLOAD.nombre,
      cargo: VALID_PAYLOAD.cargo,
    });
  });

  it('[P2] should reject mutateAsync when backend returns 500', async () => {
    // GIVEN: PUT /api/v1/contactos/:id returns 500
    server.use(handlePutContactoServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    let threwError = false;

    // WHEN: mutateAsync is called — it should throw
    await act(async () => {
      try {
        await result.current.mutateAsync({ id: CONTACT_ID, data: VALID_PAYLOAD });
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

describe('useUpdateContacto — error state resets on success', () => {
  it('[P2] should reset isError to false when mutate succeeds after a previous failure', async () => {
    // GIVEN: First call fails with 500
    server.use(handlePutContactoServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    // First mutate → error
    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // GIVEN: Second call succeeds
    server.resetHandlers();
    server.use(
      handlePutContactoSuccess(),
      handleGetContactosSuccess([UPDATED_CONTACTO])
    );

    // WHEN: mutate is called again with valid data
    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
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

describe('useUpdateContacto — invoked without options', () => {
  it('[P2] should not throw when called without any options and mutation succeeds', async () => {
    // GIVEN: PUT returns 200
    server.use(
      handlePutContactoSuccess(),
      handleGetContactosSuccess([UPDATED_CONTACTO])
    );

    const { wrapper } = createWrapper();

    // WHEN: useUpdateContacto called with no options at all
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
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

describe('useUpdateContacto — error object on failure', () => {
  it('[P1] should expose a non-null error object when PUT mutation fails', async () => {
    // GIVEN: PUT returns 500
    server.use(handlePutContactoServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    // WHEN: mutate is called and fails
    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
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
    server.use(handlePutContactoSuccess());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    // THEN: error is null in idle state
    expect(result.current.error).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Edge: Both queryKeys invalidated with exact flat structure
// ---------------------------------------------------------------------------

describe('useUpdateContacto — queryKey structure for invalidation', () => {
  it('[P1] should call invalidateQueries with { queryKey: ["contactos"] } (flat array, not nested)', async () => {
    // GIVEN: PUT returns 200
    server.use(
      handlePutContactoSuccess(),
      handleGetContactosSuccess([UPDATED_CONTACTO])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: At least one call with the list queryKey as a flat array
    const listCall = invalidateSpy.mock.calls.find(
      (call) => {
        const arg = call[0] as { queryKey: unknown[] };
        return JSON.stringify(arg.queryKey) === JSON.stringify(['contactos']);
      }
    );
    expect(listCall).toBeDefined();

    // THEN: The list queryKey is a flat array, NOT nested
    if (listCall) {
      const arg = listCall[0] as { queryKey: unknown[] };
      expect(Array.isArray(arg.queryKey)).toBe(true);
      expect(arg.queryKey).not.toEqual([['contactos']]);
      expect(arg.queryKey).toEqual(['contactos']);
    }
  });

  it('[P1] should call invalidateQueries with { queryKey: ["contactos", id] } including the exact contacto id', async () => {
    // GIVEN: PUT returns 200
    server.use(
      handlePutContactoSuccess(),
      handleGetContactosSuccess([UPDATED_CONTACTO])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: One call with the detail queryKey containing the exact id
    const detailCall = invalidateSpy.mock.calls.find(
      (call) => {
        const arg = call[0] as { queryKey: unknown[] };
        return JSON.stringify(arg.queryKey) === JSON.stringify(['contactos', CONTACT_ID]);
      }
    );
    expect(detailCall).toBeDefined();
  });

  it('[P1] should call invalidateQueries exactly twice on success (once per queryKey)', async () => {
    // GIVEN: PUT returns 200
    server.use(
      handlePutContactoSuccess(),
      handleGetContactosSuccess([UPDATED_CONTACTO])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: invalidateQueries called exactly twice (once for list, once for detail)
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Edge: Mutation data is the updated ContactoDto on success
// ---------------------------------------------------------------------------

describe('useUpdateContacto — mutation result data', () => {
  it('[P1] should expose result data as the updated ContactoDto returned by the backend on success', async () => {
    // GIVEN: PUT returns 200 with updated dto
    server.use(
      handlePutContactoSuccess(),
      handleGetContactosSuccess([UPDATED_CONTACTO])
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    // THEN: mutation data matches the returned ContactoDto
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      id: CONTACT_ID,
      nombre: VALID_PAYLOAD.nombre,
      email: VALID_PAYLOAD.email,
    });
  });

  it('[P2] should keep data as undefined after a 500 error', async () => {
    // GIVEN: PUT returns 500
    server.use(handlePutContactoServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: data is not set (no partial response)
    expect(result.current.data).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Edge: isSuccess transition
// ---------------------------------------------------------------------------

describe('useUpdateContacto — isSuccess transitions', () => {
  it('[P2] should transition isSuccess from false to true on successful PUT', async () => {
    // GIVEN: PUT returns 200
    server.use(
      handlePutContactoSuccess(),
      handleGetContactosSuccess([UPDATED_CONTACTO])
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    // WHEN: isSuccess is false before mutation
    expect(result.current.isSuccess).toBe(false);

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    // THEN: isSuccess becomes true after mutation succeeds
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('[P2] should expose isSuccess as false when mutation fails', async () => {
    // GIVEN: PUT returns 500
    server.use(handlePutContactoServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: isSuccess is false (mutation did not succeed)
    expect(result.current.isSuccess).toBe(false);
  });
});
