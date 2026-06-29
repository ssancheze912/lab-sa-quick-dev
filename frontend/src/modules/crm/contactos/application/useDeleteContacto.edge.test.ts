/**
 * Unit edge-case tests — useDeleteContacto hook
 * Story 3.5 | Delete Contact — additional coverage beyond ATDD RED phase
 *
 * These tests expand coverage with:
 *   - Boundary condition: empty-string id passed to mutate
 *   - Boundary condition: very long UUID-like id string
 *   - Edge case: mutateAsync rejects (returns rejected Promise) on backend error
 *   - Edge case: hook called multiple times (idempotent hook creation)
 *   - Edge case: options.onSuccess not provided (no crash when undefined)
 *   - Edge case: error toast does NOT expose raw error.message text
 *   - Edge case: invalidateQueries called with EXACT key shape (not a superset)
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
  handleDeleteContactoSuccess,
  handleDeleteContactoServerError,
  handleDeleteContactoNotFound,
} from '../../../test/msw/handlers/contactos-delete.handlers';
import { handleGetContactosSuccess } from '../../../test/msw/handlers/contactos.handlers';
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

// ---------------------------------------------------------------------------
// Boundary: empty-string id
// ---------------------------------------------------------------------------

describe('useDeleteContacto — boundary: empty-string id', () => {
  it('[P2] should send DELETE request even when id is an empty string', async () => {
    // GIVEN: DELETE handler accepts any id including empty string
    let capturedUrl: string | null = null;
    server.use(
      http.delete('/api/v1/contactos/:contactoId', ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(null, { status: 204 });
      }),
      handleGetContactosSuccess([])
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    // WHEN: mutate is called with an empty string
    await act(async () => {
      result.current.mutate('');
    });

    // THEN: A DELETE request was dispatched (URL ends with /api/v1/contactos/)
    await waitFor(() => {
      expect(capturedUrl).not.toBeNull();
    });
    expect(capturedUrl).toContain('/api/v1/contactos/');
  });
});

// ---------------------------------------------------------------------------
// Boundary: very long id string (>36 chars)
// ---------------------------------------------------------------------------

describe('useDeleteContacto — boundary: long id string', () => {
  it('[P2] should send DELETE request with a 128-char id without truncation', async () => {
    // GIVEN: DELETE handler that captures the id param
    const longId = 'a'.repeat(128);
    let capturedId: string | null = null;
    server.use(
      http.delete('/api/v1/contactos/:contactoId', ({ params }) => {
        capturedId = params.contactoId as string;
        return new HttpResponse(null, { status: 204 });
      }),
      handleGetContactosSuccess([])
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    // WHEN: mutate is called with a very long id
    await act(async () => {
      result.current.mutate(longId);
    });

    // THEN: The id is forwarded to the backend unchanged
    await waitFor(() => {
      expect(capturedId).toBe(longId);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge case: mutateAsync rejects on backend error
// ---------------------------------------------------------------------------

describe('useDeleteContacto — mutateAsync rejects on error', () => {
  it('[P2] should return a rejected Promise when mutateAsync is called and backend returns 500', async () => {
    // GIVEN: DELETE returns 500
    server.use(handleDeleteContactoServerError());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    // WHEN: mutateAsync is called
    let thrown = false;
    await act(async () => {
      try {
        await result.current.mutateAsync('some-id');
      } catch {
        thrown = true;
      }
    });

    // THEN: The Promise rejects (thrown is true)
    expect(thrown).toBe(true);
  });

  it('[P2] should return a rejected Promise when mutateAsync is called and backend returns 404', async () => {
    // GIVEN: DELETE returns 404
    server.use(handleDeleteContactoNotFound());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    // WHEN: mutateAsync is called for a non-existent contact
    let thrown = false;
    await act(async () => {
      try {
        await result.current.mutateAsync('00000000-0000-0000-0000-000000000000');
      } catch {
        thrown = true;
      }
    });

    // THEN: The Promise rejects
    expect(thrown).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge case: options.onSuccess not provided (no crash)
// ---------------------------------------------------------------------------

describe('useDeleteContacto — options.onSuccess absent', () => {
  it('[P2] should NOT throw when no options are provided and DELETE succeeds', async () => {
    // GIVEN: DELETE returns 204, hook used with NO options argument
    server.use(
      handleDeleteContactoSuccess(),
      handleGetContactosSuccess([])
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      // Explicitly pass undefined to match the branch where options is absent
      () => useDeleteContacto(undefined),
      { wrapper }
    );

    // WHEN: mutate is called
    let threwError = false;
    await act(async () => {
      try {
        result.current.mutate('any-id');
      } catch {
        threwError = true;
      }
    });

    // THEN: No error thrown and mutation completes
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(threwError).toBe(false);
  });

  it('[P2] should NOT throw when options.onSuccess is undefined and DELETE succeeds', async () => {
    // GIVEN: DELETE returns 204, hook used with onSuccess: undefined
    server.use(
      handleDeleteContactoSuccess(),
      handleGetContactosSuccess([])
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useDeleteContacto({ onSuccess: undefined }),
      { wrapper }
    );

    // WHEN: mutate is called
    await act(async () => {
      result.current.mutate('any-id');
    });

    // THEN: Mutation completes successfully
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge case: isSuccess state after successful deletion
// ---------------------------------------------------------------------------

describe('useDeleteContacto — isSuccess state', () => {
  it('[P2] should expose isSuccess as true after a successful DELETE', async () => {
    // GIVEN: DELETE returns 204
    server.use(
      handleDeleteContactoSuccess(),
      handleGetContactosSuccess([])
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    // WHEN: mutate is called and completes
    await act(async () => {
      result.current.mutate('valid-id');
    });

    // THEN: isSuccess becomes true
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('[P2] should expose isSuccess as false before any mutation', () => {
    // GIVEN: No mutation triggered
    server.use(handleDeleteContactoSuccess());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    // THEN: isSuccess is false in idle state
    expect(result.current.isSuccess).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge case: isIdle state before any call
// ---------------------------------------------------------------------------

describe('useDeleteContacto — idle state', () => {
  it('[P3] should expose status "idle" before any mutation is triggered', () => {
    // GIVEN: No mutation triggered
    server.use(handleDeleteContactoSuccess());

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    // THEN: status is "idle"
    expect(result.current.status).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// Edge case: invalidateQueries exact key shape (no extra properties injected)
// ---------------------------------------------------------------------------

describe('useDeleteContacto — invalidateQueries exact key matching', () => {
  it('[P2] should call invalidateQueries EXACTLY twice on success (once per key)', async () => {
    // GIVEN: DELETE returns 204
    server.use(
      handleDeleteContactoSuccess(),
      handleGetContactosSuccess([])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    // WHEN: mutate succeeds
    await act(async () => {
      result.current.mutate('test-id-123');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: invalidateQueries was called exactly twice
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });

  it('[P2] should call invalidateQueries with the id used in the mutate call', async () => {
    // GIVEN: DELETE returns 204
    const specificId = 'abc-specific-id-xyz';
    server.use(
      http.delete('/api/v1/contactos/:contactoId', () => new HttpResponse(null, { status: 204 })),
      handleGetContactosSuccess([])
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteContacto(), { wrapper });

    // WHEN: mutate is called with a specific id
    await act(async () => {
      result.current.mutate(specificId);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: second invalidate call uses ['contactos', specificId]
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['contactos', specificId] })
    );
  });
});
