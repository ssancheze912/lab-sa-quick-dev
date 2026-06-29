/**
 * Edge-case unit tests — useCreateContacto application hook
 * Story 3.3 — Create Contact — Automation Expansion
 *
 * Complements useCreateContacto.test.ts (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - Generic 500 error exposes isError but does NOT call options.onSuccess
 *   - Mutation result data is the ContactoDto returned by the backend on success
 *   - isError resets to false when a subsequent successful mutation fires after a failure
 *   - mutateAsync variant resolves with ContactoDto on 201
 *   - mutateAsync variant rejects (throws) on 500
 *   - Hook works without options argument (no callback — no crash)
 *   - invalidateQueries is called with the flat ['contactos'] key (not nested)
 *   - isPending is false in idle state (never called mutate)
 *   - Multiple fields in the mutation payload are all forwarded to the API
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
import { useCreateContacto } from './useCreateContacto';

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
  nombre: 'Luis Pérez Edge',
  cargo: 'Analista Senior',
  telefono: '3009876543',
  email: 'luis.perez.edge@empresa.co',
};

const CREATED_DTO = {
  id: '00000000-0000-0000-0000-000000000042',
  ...VALID_PAYLOAD,
  clienteId: null,
  createdAt: '2026-06-29T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Edge: Generic 500 error exposes isError, does NOT call onSuccess
// ---------------------------------------------------------------------------

describe('useCreateContacto — generic 500 error', () => {
  it('[P1] should expose isError as true when backend returns 500', async () => {
    // GIVEN: POST /api/v1/contactos returns 500
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: mutate is called
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('[P1] should NOT call options.onSuccess when backend returns 500', async () => {
    // GIVEN: POST returns 500
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCreateContacto({ onSuccess: onSuccessMock }), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: onSuccess was not called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });

  it('[P1] should keep data as undefined after a 500 error', async () => {
    // GIVEN: POST returns 500
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: data is undefined (no partial response stored)
    expect(result.current.data).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Edge: Mutation result data is the ContactoDto on success
// ---------------------------------------------------------------------------

describe('useCreateContacto — mutation result data on success', () => {
  it('[P1] should expose result data as the ContactoDto returned by the backend on 201', async () => {
    // GIVEN: POST returns 201 with a ContactoDto
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: mutation data equals the returned ContactoDto
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      id: CREATED_DTO.id,
      nombre: CREATED_DTO.nombre,
      cargo: CREATED_DTO.cargo,
      clienteId: null,
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: isError resets to false after a successful retry following an error
// ---------------------------------------------------------------------------

describe('useCreateContacto — error state resets on successful retry', () => {
  it('[P2] should reset isError to false when mutate succeeds after a previous failure', async () => {
    // GIVEN: First call fails with 500
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

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
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    // WHEN: mutate called again with valid data
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
// Edge: mutateAsync variant
// ---------------------------------------------------------------------------

describe('useCreateContacto — mutateAsync variant', () => {
  it('[P2] should resolve mutateAsync with ContactoDto when backend returns 201', async () => {
    // GIVEN: POST returns 201
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    let resolvedData: unknown;

    // WHEN: mutateAsync is awaited
    await act(async () => {
      resolvedData = await result.current.mutateAsync(VALID_PAYLOAD);
    });

    // THEN: resolved value is the ContactoDto
    expect(resolvedData).toMatchObject({
      id: CREATED_DTO.id,
      nombre: CREATED_DTO.nombre,
      clienteId: null,
    });
  });

  it('[P2] should reject mutateAsync (throw) when backend returns 500', async () => {
    // GIVEN: POST returns 500
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

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
// Edge: hook works without options argument
// ---------------------------------------------------------------------------

describe('useCreateContacto — invoked without options', () => {
  it('[P2] should not throw when called without any options and mutation succeeds', async () => {
    // GIVEN: POST returns 201
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: useCreateContacto called with no options at all
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

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
// Edge: invalidateQueries called with the correct flat queryKey structure
// ---------------------------------------------------------------------------

describe('useCreateContacto — queryKey structure for cache invalidation', () => {
  it('[P1] should call invalidateQueries with { queryKey: ["contactos"] } (flat array, not nested)', async () => {
    // GIVEN: POST returns 201
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: invalidateQueries called exactly once
    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    // THEN: called with exactly { queryKey: ['contactos'] }
    const callArg = invalidateSpy.mock.calls[0][0] as { queryKey: unknown[] };
    expect(callArg.queryKey).toEqual(['contactos']);
    expect(Array.isArray(callArg.queryKey)).toBe(true);
    expect(callArg.queryKey).not.toEqual([['contactos']]);
  });

  it('[P1] should NOT call invalidateQueries when mutation fails (500)', async () => {
    // GIVEN: POST returns 500
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: invalidateQueries was NOT called
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Edge: all 4 payload fields are forwarded to the API
// ---------------------------------------------------------------------------

describe('useCreateContacto — full payload forwarded to API', () => {
  it('[P1] should send all 4 fields (nombre, cargo, telefono, email) in the POST body', async () => {
    // GIVEN: POST captures the request body
    let capturedBody: Record<string, string> | null = null;

    server.use(
      http.post('/api/v1/contactos', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, string>;
        return HttpResponse.json(
          { id: '00000000-0000-0000-0000-999999999999', ...capturedBody, clienteId: null, createdAt: '2026-06-29T10:00:00Z' },
          { status: 201 }
        );
      })
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: All 4 fields present in the request
    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.nombre).toBe(VALID_PAYLOAD.nombre);
    expect(capturedBody!.cargo).toBe(VALID_PAYLOAD.cargo);
    expect(capturedBody!.telefono).toBe(VALID_PAYLOAD.telefono);
    expect(capturedBody!.email).toBe(VALID_PAYLOAD.email);
  });
});

// ---------------------------------------------------------------------------
// Edge: isPending is false in idle state (never called mutate)
// ---------------------------------------------------------------------------

describe('useCreateContacto — idle state', () => {
  it('[P2] should have isPending false and isError false before any mutation is triggered', () => {
    // GIVEN: Server can handle the request if ever sent
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(CREATED_DTO, { status: 201 })
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: Hook rendered but mutate never called
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    // THEN: Both isPending and isError are false in idle state
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });
});
