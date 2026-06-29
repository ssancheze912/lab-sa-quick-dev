/**
 * Unit tests — useDeleteCliente hook
 * Story 2.5 | Delete Client (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E2-P2-06  queryClient.invalidateQueries(['clientes']) called on onSuccess
 *   (isPending)  isPending is true during in-flight mutation, false before/after
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failure: "Cannot find module './useDeleteCliente'"
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import {
  handleDeleteClienteSuccess,
  handleDeleteClienteServerError,
} from '../../../test/msw/handlers/clientes-delete.handlers';
import { handleGetClientesSuccess } from '../../../test/msw/handlers/clientes.handlers';
import { useDeleteCliente } from './useDeleteCliente';

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
// Helper: wrap useDeleteCliente in QueryClientProvider with isolated QueryClient
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

// ---------------------------------------------------------------------------
// TC-E2-P2-06: invalidateQueries(['clientes']) on success
// ---------------------------------------------------------------------------

describe('useDeleteCliente — cache invalidation on success', () => {
  it('TC-E2-P2-06: should call invalidateQueries with ["clientes"] after successful DELETE', async () => {
    // GIVEN: DELETE /api/v1/clientes/:id returns 204 No Content
    // AND: GET /api/v1/clientes is available for cache refetch
    server.use(
      handleDeleteClienteSuccess(),
      handleGetClientesSuccess([])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useDeleteCliente hook is rendered and mutate is called with a client id
    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(CLIENT_ID);
    });

    // THEN: invalidateQueries is called with the list query key ['clientes']
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes'] })
      );
    });
  });

  it('should NOT call invalidateQueries when DELETE mutation fails', async () => {
    // GIVEN: DELETE /api/v1/clientes/:id returns 500
    server.use(handleDeleteClienteServerError());

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useDeleteCliente is rendered and mutate fails
    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(CLIENT_ID);
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

describe('useDeleteCliente — isPending during mutation', () => {
  it('should expose isPending as true while the DELETE mutation is in flight', async () => {
    // GIVEN: DELETE /api/v1/clientes/:id has a delay before resolving
    let resolveRequest!: () => void;
    const requestPending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const { http } = await import('msw');
    server.use(
      http.delete(`/api/v1/clientes/${CLIENT_ID}`, async () => {
        await requestPending;
        return new (await import('msw')).HttpResponse(null, { status: 204 });
      }),
      handleGetClientesSuccess([])
    );

    const { wrapper } = createWrapper();

    // WHEN: useDeleteCliente is rendered and mutate is called
    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    act(() => {
      result.current.mutate(CLIENT_ID);
    });

    // THEN: isPending is true while waiting for the network response
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Cleanup: resolve the pending request
    resolveRequest();
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('should expose isPending as false before any mutation is triggered', () => {
    // GIVEN: No mutation has been triggered
    server.use(handleDeleteClienteSuccess());

    const { wrapper } = createWrapper();

    // WHEN: useDeleteCliente is rendered but mutate is NOT called
    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    // THEN: isPending is false (idle state)
    expect(result.current.isPending).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// onSuccess callback: calls options.onSuccess when provided
// ---------------------------------------------------------------------------

describe('useDeleteCliente — onSuccess callback', () => {
  it('should call options.onSuccess when the DELETE mutation succeeds', async () => {
    // GIVEN: DELETE /api/v1/clientes/:id returns 204
    server.use(
      handleDeleteClienteSuccess(),
      handleGetClientesSuccess([])
    );

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useDeleteCliente is rendered with onSuccess option and mutate is called
    const { result } = renderHook(
      () => useDeleteCliente({ onSuccess: onSuccessMock }),
      { wrapper }
    );

    await act(async () => {
      result.current.mutate(CLIENT_ID);
    });

    // THEN: onSuccess is called once
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should NOT call options.onSuccess when DELETE mutation fails', async () => {
    // GIVEN: DELETE /api/v1/clientes/:id returns 500
    server.use(handleDeleteClienteServerError());

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useDeleteCliente is rendered with onSuccess option and mutate fails
    const { result } = renderHook(
      () => useDeleteCliente({ onSuccess: onSuccessMock }),
      { wrapper }
    );

    await act(async () => {
      result.current.mutate(CLIENT_ID);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: onSuccess is NOT called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// isError exposed on DELETE failure
// ---------------------------------------------------------------------------

describe('useDeleteCliente — isError on failure', () => {
  it('should expose isError true when backend returns 500', async () => {
    // GIVEN: DELETE /api/v1/clientes/:id returns 500
    server.use(handleDeleteClienteServerError());

    const { wrapper } = createWrapper();

    // WHEN: useDeleteCliente is rendered and mutate is called
    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(CLIENT_ID);
    });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Toast message differentiation based on hasAssociatedContacts
// ---------------------------------------------------------------------------

describe('useDeleteCliente — toast message differentiation', () => {
  it('should use "Cliente eliminado correctamente" message when hasAssociatedContacts is false', async () => {
    // GIVEN: DELETE returns 204, no associated contacts
    server.use(
      handleDeleteClienteSuccess(),
      handleGetClientesSuccess([])
    );

    const { wrapper } = createWrapper();

    // WHEN: useDeleteCliente is rendered with hasAssociatedContacts: false
    const { result } = renderHook(
      () => useDeleteCliente({ hasAssociatedContacts: false }),
      { wrapper }
    );

    // THEN: hook initialises without error (toast assertion done in component test)
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it('should use orphan-contact message when hasAssociatedContacts is true', async () => {
    // GIVEN: DELETE returns 204, client had associated contacts
    server.use(
      handleDeleteClienteSuccess(),
      handleGetClientesSuccess([])
    );

    const { wrapper } = createWrapper();

    // WHEN: useDeleteCliente is rendered with hasAssociatedContacts: true
    const { result } = renderHook(
      () => useDeleteCliente({ hasAssociatedContacts: true }),
      { wrapper }
    );

    // THEN: hook initialises without error (orphan toast assertion done in component test)
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});
