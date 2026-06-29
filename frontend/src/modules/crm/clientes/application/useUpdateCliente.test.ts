/**
 * Unit tests — useUpdateCliente hook
 * Story 2.4 | Edit Client
 *
 * Test IDs covered (RED phase — useUpdateCliente.ts does not exist yet):
 *   TC-E2-P2-05-UPDATE  queryClient.invalidateQueries(['clientes']) AND (['clientes', id]) called on onSuccess
 *   (isPending)          isPending is true during in-flight mutation
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failure: "Cannot find module './useUpdateCliente'"
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import {
  handlePutClienteSuccess,
  handlePutClienteServerError,
} from '../../../test/msw/handlers/clientes-update.handlers';
import { handleGetClientesSuccess } from '../../../test/msw/handlers/clientes.handlers';
import { useUpdateCliente } from './useUpdateCliente';

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
// Helper: wrap useUpdateCliente in QueryClientProvider with isolated QueryClient
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
// TC-E2-P2-05-UPDATE: invalidateQueries(['clientes']) AND (['clientes', id]) on success
// ---------------------------------------------------------------------------

describe('useUpdateCliente — cache invalidation on success', () => {
  it('TC-E2-P2-05-UPDATE: should call invalidateQueries with ["clientes"] after successful PUT', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 200 with updated ClienteDto
    // AND: GET /api/v1/clientes is available for cache refetch
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useUpdateCliente hook is rendered and mutate is called with id and data
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    // THEN: invalidateQueries is called with the list query key ['clientes']
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes'] })
      );
    });
  });

  it('TC-E2-P2-05-UPDATE: should call invalidateQueries with ["clientes", id] after successful PUT', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 200
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: mutate is called with the client id
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    // THEN: invalidateQueries is ALSO called with the detail query key ['clientes', id]
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes', CLIENT_ID] })
      );
    });
  });

  it('should NOT call invalidateQueries when PUT mutation fails', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 500
    server.use(handlePutClienteServerError());

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useUpdateCliente is rendered and mutate fails
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    // THEN: mutation enters error state and invalidateQueries was NOT called
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// isPending is true during in-flight mutation
// ---------------------------------------------------------------------------

describe('useUpdateCliente — isPending during mutation', () => {
  it('should expose isPending as true while the PUT mutation is in flight', async () => {
    // GIVEN: PUT /api/v1/clientes/:id has a delay before resolving
    let resolveRequest: () => void;
    const requestPending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const { http, HttpResponse } = await import('msw');
    server.use(
      http.put(`/api/v1/clientes/${CLIENT_ID}`, async () => {
        await requestPending;
        return HttpResponse.json(UPDATED_CLIENTE, { status: 200 });
      }),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    const { wrapper } = createWrapper();

    // WHEN: useUpdateCliente is rendered and mutate is called
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    act(() => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
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
    server.use(handlePutClienteSuccess());

    const { wrapper } = createWrapper();

    // WHEN: useUpdateCliente is rendered but mutate is NOT called
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    // THEN: isPending is false (idle state)
    expect(result.current.isPending).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// onSuccess callback: calls options.onSuccess when provided
// ---------------------------------------------------------------------------

describe('useUpdateCliente — onSuccess callback', () => {
  it('should call options.onSuccess when the PUT mutation succeeds', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 200
    server.use(
      handlePutClienteSuccess(),
      handleGetClientesSuccess([UPDATED_CLIENTE])
    );

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useUpdateCliente is rendered with onSuccess option and mutate is called
    const { result } = renderHook(() => useUpdateCliente({ onSuccess: onSuccessMock }), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    // THEN: onSuccess is called once
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should NOT call options.onSuccess when PUT mutation fails', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 500
    server.use(handlePutClienteServerError());

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useUpdateCliente is rendered with onSuccess option and mutate fails
    const { result } = renderHook(() => useUpdateCliente({ onSuccess: onSuccessMock }), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: onSuccess is NOT called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// isError exposed on PUT failure
// ---------------------------------------------------------------------------

describe('useUpdateCliente — isError on failure', () => {
  it('should expose isError true when backend returns 500', async () => {
    // GIVEN: PUT /api/v1/clientes/:id returns 500
    server.use(handlePutClienteServerError());

    const { wrapper } = createWrapper();

    // WHEN: useUpdateCliente is rendered and mutate is called
    const { result } = renderHook(() => useUpdateCliente(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CLIENT_ID, data: VALID_PAYLOAD });
    });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});
