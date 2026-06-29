/**
 * Unit edge-case tests — useDeleteCliente hook
 * Story 2.5 | Delete Client (Automation Expansion — BMad-Integrated)
 *
 * Covers edge cases NOT in ATDD:
 *   - Hook called without options (undefined options — null-safety for options?.onSuccess)
 *   - isError resets to false between successive mutations (second call after first error)
 *   - DELETE 404 (client already deleted): isError becomes true, invalidateQueries NOT called
 *
 * Stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  handleDeleteClienteSuccess,
  handleDeleteClienteServerError,
  handleDeleteClienteNotFound,
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
// Edge: Hook called without options (undefined options — null-safety)
// ---------------------------------------------------------------------------

describe('useDeleteCliente — no options provided (null-safety)', () => {
  it('[P2] should succeed without throwing when called with no options argument', async () => {
    // GIVEN: DELETE returns 204, hook is instantiated with no options
    server.use(
      handleDeleteClienteSuccess(),
      handleGetClientesSuccess([])
    );

    const { wrapper } = createWrapper();

    // WHEN: useDeleteCliente is called without any options
    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(CLIENT_ID);
    });

    // THEN: Mutation completes successfully, no error thrown
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isError).toBe(false);
  });

  it('[P2] should still call invalidateQueries when no options are provided', async () => {
    // GIVEN: DELETE returns 204, no options passed
    server.use(
      handleDeleteClienteSuccess(),
      handleGetClientesSuccess([])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useDeleteCliente called without options, mutate triggered
    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(CLIENT_ID);
    });

    // THEN: invalidateQueries is still called with ['clientes'] key
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes'] })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: isError resets between successive mutations
// ---------------------------------------------------------------------------

describe('useDeleteCliente — isError resets between successive mutations', () => {
  it('[P2] should reset isError to false when a second mutation succeeds after a first that failed', async () => {
    // GIVEN: First DELETE returns 500, then second DELETE returns 204
    server.use(handleDeleteClienteServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    // Trigger first mutation (will fail)
    await act(async () => {
      result.current.mutate(CLIENT_ID);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Switch handler to success for second mutation
    server.resetHandlers();
    server.use(
      handleDeleteClienteSuccess(),
      handleGetClientesSuccess([])
    );

    // WHEN: Second mutation is triggered
    await act(async () => {
      result.current.mutate(CLIENT_ID);
    });

    // THEN: isError resets to false after successful second mutation
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isError).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: DELETE 404 — client already deleted before mutation fires
// ---------------------------------------------------------------------------

describe('useDeleteCliente — DELETE 404 (client already deleted)', () => {
  it('[P2] should expose isError true and NOT call invalidateQueries when DELETE returns 404', async () => {
    // GIVEN: DELETE returns 404 (client was already deleted — race condition)
    server.use(handleDeleteClienteNotFound());

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: mutate is called with a client ID that no longer exists
    const { result } = renderHook(() => useDeleteCliente(), { wrapper });

    await act(async () => {
      result.current.mutate(CLIENT_ID);
    });

    // THEN: isError is true (404 is a non-2xx response)
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // AND: invalidateQueries was NOT called (no successful deletion)
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
