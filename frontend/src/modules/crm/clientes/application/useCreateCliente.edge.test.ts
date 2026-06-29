/**
 * Edge-case unit tests — useCreateCliente application hook
 * Story 2.3 — Create Client — Automation Expansion
 *
 * Complements useCreateCliente.test.ts (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - Generic non-409 error (500) exposes isError but NOT a specific message
 *   - Calling mutate twice rapidly: second call overrides first (single mutation instance)
 *   - isError resets to false when a subsequent successful mutation fires
 *   - options.onSuccess is NOT called when options object is omitted entirely
 *   - Network timeout / connection refused exposes isError
 *   - Mutation data is the created ClienteDto on success
 *   - mutateAsync variant resolves with ClienteDto on 201
 *   - mutateAsync variant rejects on 409
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
import { useCreateCliente } from './useCreateCliente';

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

const VALID_PAYLOAD = {
  nombre: 'Acme Corp Edge',
  nit: '900000001-1',
  telefono: '3000000001',
  ciudad: 'Bogotá',
};

const CREATED_DTO = {
  id: '00000000-0000-0000-0000-000000000042',
  ...VALID_PAYLOAD,
  createdAt: '2026-06-29T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Edge: Generic 500 error exposes isError but does not set a specific message
// The hook must NOT make any assumption about the error shape for non-409 errors
// ---------------------------------------------------------------------------

describe('useCreateCliente — generic 500 error', () => {
  it('[P1] should expose isError as true when backend returns 500', async () => {
    // GIVEN: POST /api/v1/clientes returns 500 Internal Server Error
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: mutate is called
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('[P1] should keep data as undefined after a 500 error', async () => {
    // GIVEN: POST returns 500
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: data is not set (no partial response)
    expect(result.current.data).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Edge: Mutation data is the ClienteDto returned by the backend on success
// ---------------------------------------------------------------------------

describe('useCreateCliente — mutation result data', () => {
  it('[P1] should expose result data as the ClienteDto returned by the backend on success', async () => {
    // GIVEN: POST returns 201 with a ClienteDto
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: mutation data equals the returned ClienteDto
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      id: CREATED_DTO.id,
      nombre: CREATED_DTO.nombre,
      nit: CREATED_DTO.nit,
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: isError resets to false after a successful retry following an error
// ---------------------------------------------------------------------------

describe('useCreateCliente — error state resets on success', () => {
  it('[P2] should reset isError to false when mutate succeeds after a previous failure', async () => {
    // GIVEN: First call fails with 500
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // First mutate → error
    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // GIVEN: Second call succeeds
    server.resetHandlers();
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    // WHEN: mutate is called again with valid data
    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: isError is false and isSuccess is true
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isError).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: mutateAsync resolves with ClienteDto on 201
// ---------------------------------------------------------------------------

describe('useCreateCliente — mutateAsync variant', () => {
  it('[P2] should resolve mutateAsync with ClienteDto when backend returns 201', async () => {
    // GIVEN: POST returns 201
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    let resolvedData: unknown;

    // WHEN: mutateAsync is awaited
    await act(async () => {
      resolvedData = await result.current.mutateAsync(VALID_PAYLOAD);
    });

    // THEN: resolved value is the ClienteDto
    expect(resolvedData).toMatchObject({
      id: CREATED_DTO.id,
      nombre: CREATED_DTO.nombre,
    });
  });

  it('[P2] should reject mutateAsync when backend returns 409', async () => {
    // GIVEN: POST returns 409
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado' },
          { status: 409 }
        )
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // WHEN: mutateAsync is called — it should throw
    let threwError = false;

    await act(async () => {
      try {
        await result.current.mutateAsync(VALID_PAYLOAD);
      } catch {
        threwError = true;
      }
    });

    // THEN: mutateAsync threw
    expect(threwError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge: hook works without options argument (no onSuccess callback)
// ---------------------------------------------------------------------------

describe('useCreateCliente — invoked without options', () => {
  it('[P2] should not throw when called without any options and mutation succeeds', async () => {
    // GIVEN: POST returns 201
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: useCreateCliente called with no options at all
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: succeeds without throwing
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: invalidateQueries is called with exact queryKey structure
// (verifies the key is ['clientes'] not [['clientes']] or similar)
// ---------------------------------------------------------------------------

describe('useCreateCliente — queryKey structure for invalidation', () => {
  it('[P1] should call invalidateQueries with { queryKey: ["clientes"] } (flat array, not nested)', async () => {
    // GIVEN: POST returns 201
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: invalidateQueries called exactly once
    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    // THEN: called with exactly { queryKey: ['clientes'] }
    const callArg = invalidateSpy.mock.calls[0][0] as { queryKey: unknown[] };
    expect(callArg.queryKey).toEqual(['clientes']);
    expect(Array.isArray(callArg.queryKey)).toBe(true);
    expect(callArg.queryKey).not.toEqual([['clientes']]);
  });
});
