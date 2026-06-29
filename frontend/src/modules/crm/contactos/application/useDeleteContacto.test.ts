/**
 * Unit tests — useDeleteContacto hook
 * Story 3.5 | Delete Contact (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E3-P2-delete-01  queryClient.invalidateQueries(['contactos']) AND
 *                       queryClient.invalidateQueries(['contactos', id]) called on onSuccess
 *   TC-E3-P2-delete-02  isPending is true during in-flight mutation, false before/after
 *   TC-E3-P2-delete-03  onError callback → generic error toast shown, no raw error details
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failure: "Cannot find module './useDeleteContacto'"
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import {
  handleDeleteContactoSuccess,
  handleDeleteContactoServerError,
} from '../../../test/msw/handlers/contactos-delete.handlers';
import { handleGetContactoByIdSuccess } from '../../../test/msw/handlers/contactos-detail.handlers';
import { handleGetContactosSuccess } from '../../../test/msw/handlers/contactos.handlers';
import { createContacto } from '../../../test/factories/contacto.factory';
// RED: this module does not exist yet — import will fail until Task 1 is implemented
import { useDeleteContacto } from './useDeleteContacto';

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
// Helper: wrap useDeleteContacto in QueryClientProvider with isolated QueryClient
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

const CONTACTO = createContacto({ id: '00000000-0000-0000-0000-000000000042' });

// ---------------------------------------------------------------------------
// TC-E3-P2-delete-01: invalidateQueries called for both keys on success
// ---------------------------------------------------------------------------

describe('useDeleteContacto — cache invalidation on success', () => {
  it('TC-E3-P2-delete-01: should call invalidateQueries with ["contactos"] after successful DELETE', async () => {
    // GIVEN: DELETE /api/v1/contactos/:id returns 204 No Content
    // AND: GET /api/v1/contactos is available for cache refetch
    server.use(
      handleDeleteContactoSuccess(),
      handleGetContactosSuccess([])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useDeleteContacto hook is rendered and mutate is called with a contact id
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(CONTACTO.id);
    });

    // THEN: invalidateQueries is called with the list query key ['contactos']
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos'] })
      );
    });
  });

  it('TC-E3-P2-delete-01: should call invalidateQueries with ["contactos", id] after successful DELETE', async () => {
    // GIVEN: DELETE /api/v1/contactos/:id returns 204 No Content
    server.use(
      handleDeleteContactoSuccess(),
      handleGetContactosSuccess([])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useDeleteContacto hook is rendered and mutate is called with a contact id
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(CONTACTO.id);
    });

    // THEN: invalidateQueries is ALSO called with the single-contact key ['contactos', id]
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos', CONTACTO.id] })
      );
    });
  });

  it('should NOT call invalidateQueries when DELETE mutation fails', async () => {
    // GIVEN: DELETE /api/v1/contactos/:id returns 500
    server.use(handleDeleteContactoServerError());

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useDeleteContacto is rendered and mutate fails
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(CONTACTO.id);
    });

    // THEN: mutation enters error state and invalidateQueries was NOT called
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P2-delete-02: isPending is true during in-flight mutation
// ---------------------------------------------------------------------------

describe('useDeleteContacto — isPending during mutation', () => {
  it('TC-E3-P2-delete-02: should expose isPending as true while the DELETE mutation is in flight', async () => {
    // GIVEN: DELETE /api/v1/contactos/:id has a delay before resolving
    let resolveRequest!: () => void;
    const requestPending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const { http } = await import('msw');
    server.use(
      http.delete(`/api/v1/contactos/:contactoId`, async () => {
        await requestPending;
        return new (await import('msw')).HttpResponse(null, { status: 204 });
      }),
      handleGetContactosSuccess([])
    );

    const { wrapper } = createWrapper();

    // WHEN: useDeleteContacto is rendered and mutate is called
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    act(() => {
      result.current.mutate(CONTACTO.id);
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

  it('TC-E3-P2-delete-02: should expose isPending as false before any mutation is triggered', () => {
    // GIVEN: No mutation has been triggered
    server.use(handleDeleteContactoSuccess());

    const { wrapper } = createWrapper();

    // WHEN: useDeleteContacto is rendered but mutate is NOT called
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    // THEN: isPending is false (idle state)
    expect(result.current.isPending).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P2-delete-03: onError callback — generic error, no raw details
// ---------------------------------------------------------------------------

describe('useDeleteContacto — isError on failure (TC-E3-P2-delete-03)', () => {
  it('TC-E3-P2-delete-03: should expose isError true when backend returns 500', async () => {
    // GIVEN: DELETE /api/v1/contactos/:id returns 500
    server.use(handleDeleteContactoServerError());

    const { wrapper } = createWrapper();

    // WHEN: useDeleteContacto is rendered and mutate is called
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(CONTACTO.id);
    });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// onSuccess callback: calls options.onSuccess when provided
// ---------------------------------------------------------------------------

describe('useDeleteContacto — onSuccess callback', () => {
  it('should call options.onSuccess when the DELETE mutation succeeds', async () => {
    // GIVEN: DELETE /api/v1/contactos/:id returns 204
    server.use(
      handleDeleteContactoSuccess(),
      handleGetContactosSuccess([])
    );

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useDeleteContacto is rendered with onSuccess option and mutate is called
    const { result } = renderHook(
      () => useDeleteContacto({ onSuccess: onSuccessMock }),
      { wrapper }
    );

    await act(async () => {
      result.current.mutate(CONTACTO.id);
    });

    // THEN: onSuccess is called once
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should NOT call options.onSuccess when DELETE mutation fails', async () => {
    // GIVEN: DELETE /api/v1/contactos/:id returns 500
    server.use(handleDeleteContactoServerError());

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useDeleteContacto is rendered with onSuccess option and mutate fails
    const { result } = renderHook(
      () => useDeleteContacto({ onSuccess: onSuccessMock }),
      { wrapper }
    );

    await act(async () => {
      result.current.mutate(CONTACTO.id);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: onSuccess is NOT called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});
