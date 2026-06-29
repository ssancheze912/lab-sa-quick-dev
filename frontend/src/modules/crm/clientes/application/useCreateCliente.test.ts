/**
 * Unit tests — useCreateCliente hook
 * Story 2.3 | Create Client | TC-E2-P2-05, TC-E2-P2-07 (cache invalidation + isPending)
 *
 * These tests are in the RED phase — useCreateCliente.ts does not exist yet.
 * Expected failure: "Cannot find module '../useCreateCliente'"
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useCreateCliente } from './useCreateCliente';

// ---------------------------------------------------------------------------
// MSW server for this unit test file
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
// Helper: wrap useCreateCliente in QueryClientProvider with isolated QueryClient
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
  nombre: 'Acme Corp',
  nit: '900123456-7',
  telefono: '3001234567',
  ciudad: 'Bogotá',
};

const CREATED_CLIENTE = {
  id: '00000000-0000-0000-0000-000000000001',
  ...VALID_PAYLOAD,
  createdAt: '2026-06-29T10:00:00Z',
};

// ---------------------------------------------------------------------------
// TC-E2-P2-05: queryClient.invalidateQueries(['clientes']) called on onSuccess
// ---------------------------------------------------------------------------

describe('useCreateCliente — cache invalidation on success', () => {
  it('TC-E2-P2-05: should call queryClient.invalidateQueries with key ["clientes"] after successful mutation', async () => {
    // GIVEN: POST /api/v1/clientes returns 201 with the created client
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(CREATED_CLIENTE, { status: 201 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useCreateCliente hook is rendered and mutate is called
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: invalidateQueries is called with queryKey ['clientes']
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes'] })
      );
    });
  });

  it('should NOT call invalidateQueries when mutation fails', async () => {
    // GIVEN: POST /api/v1/clientes returns 500
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useCreateCliente hook is rendered and mutate fails
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: Wait for mutation to settle, invalidateQueries must NOT have been called
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// isPending is true during in-flight mutation
// ---------------------------------------------------------------------------

describe('useCreateCliente — isPending during mutation', () => {
  it('should expose isPending as true while the mutation is in flight', async () => {
    // GIVEN: POST /api/v1/clientes has a small delay before resolving
    let resolveRequest: () => void;
    const requestPending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.post('/api/v1/clientes', async () => {
        await requestPending;
        return HttpResponse.json(CREATED_CLIENTE, { status: 201 });
      })
    );

    const { wrapper } = createWrapper();

    // WHEN: useCreateCliente is rendered and mutate is called
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    act(() => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: isPending is true while waiting for the network response
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Cleanup: resolve the pending request
    resolveRequest!();
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('should expose isPending as false before any mutation is triggered', () => {
    // GIVEN: No mutation has been triggered
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(CREATED_CLIENTE, { status: 201 })
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: useCreateCliente is rendered but mutate is NOT called
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    // THEN: isPending is false (idle state)
    expect(result.current.isPending).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// onSuccess callback: calls options.onSuccess when provided
// ---------------------------------------------------------------------------

describe('useCreateCliente — onSuccess callback', () => {
  it('should call options.onSuccess when the mutation succeeds', async () => {
    // GIVEN: POST /api/v1/clientes returns 201
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(CREATED_CLIENTE, { status: 201 })
      )
    );

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useCreateCliente is rendered with onSuccess option and mutate is called
    const { result } = renderHook(() => useCreateCliente({ onSuccess: onSuccessMock }), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: onSuccess is called once
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should NOT call options.onSuccess when mutation fails', async () => {
    // GIVEN: POST /api/v1/clientes returns 500
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useCreateCliente is rendered with onSuccess option and mutate fails
    const { result } = renderHook(() => useCreateCliente({ onSuccess: onSuccessMock }), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: onSuccess is NOT called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 409 Conflict error exposure
// ---------------------------------------------------------------------------

describe('useCreateCliente — 409 NIT conflict error', () => {
  it('TC-E2-P2-03: should expose isError true when backend returns 409', async () => {
    // GIVEN: POST /api/v1/clientes returns 409 Conflict (duplicate NIT)
    server.use(
      http.post('/api/v1/clientes', () =>
        HttpResponse.json(
          {
            status: 409,
            title: 'Conflict',
            detail: 'El NIT/RUC ya está registrado',
          },
          { status: 409 }
        )
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: useCreateCliente is rendered and mutate is called with a duplicate NIT
    const { result } = renderHook(() => useCreateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: isError becomes true (hook surfaces the 409 as an error)
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});
