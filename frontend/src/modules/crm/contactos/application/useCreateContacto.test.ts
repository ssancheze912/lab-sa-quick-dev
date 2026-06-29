/**
 * Unit tests — useCreateContacto hook
 * Story 3.3 | Create Contact | TC-E3-P2-05, isPending
 *
 * RED phase — useCreateContacto.ts does not exist yet.
 * Expected failure: "Cannot find module '../useCreateContacto'"
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useCreateContacto } from './useCreateContacto';

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
// Helper: wrap useCreateContacto in QueryClientProvider with isolated QueryClient
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
  nombre: 'Ana García',
  cargo: 'Directora Comercial',
  telefono: '3101234567',
  email: 'ana.garcia@siesa.com',
};

const CREATED_CONTACTO = {
  id: '00000000-0000-0000-0000-000000000001',
  ...VALID_PAYLOAD,
  clienteId: null,
  createdAt: '2026-06-29T10:00:00Z',
};

// ---------------------------------------------------------------------------
// TC-E3-P2-05: queryClient.invalidateQueries(['contactos']) called on onSuccess
// ---------------------------------------------------------------------------

describe('useCreateContacto — cache invalidation on success', () => {
  it('TC-E3-P2-05: should call queryClient.invalidateQueries with key ["contactos"] after successful mutation', async () => {
    // GIVEN: POST /api/v1/contactos returns 201 with the created contact
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(CREATED_CONTACTO, { status: 201 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useCreateContacto hook is rendered and mutate is called
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: invalidateQueries is called with queryKey ['contactos']
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos'] })
      );
    });
  });

  it('should NOT call invalidateQueries when mutation fails', async () => {
    // GIVEN: POST /api/v1/contactos returns 500
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useCreateContacto hook is rendered and mutate fails
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

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

describe('useCreateContacto — isPending during mutation', () => {
  it('should expose isPending as true while the mutation is in flight', async () => {
    // GIVEN: POST /api/v1/contactos has a delay before resolving
    let resolveRequest: () => void;
    const requestPending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.post('/api/v1/contactos', async () => {
        await requestPending;
        return HttpResponse.json(CREATED_CONTACTO, { status: 201 });
      })
    );

    const { wrapper } = createWrapper();

    // WHEN: useCreateContacto is rendered and mutate is called
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

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
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(CREATED_CONTACTO, { status: 201 })
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: useCreateContacto is rendered but mutate is NOT called
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    // THEN: isPending is false (idle state)
    expect(result.current.isPending).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// onSuccess callback: calls options.onSuccess when provided
// ---------------------------------------------------------------------------

describe('useCreateContacto — onSuccess callback', () => {
  it('should call options.onSuccess when the mutation succeeds', async () => {
    // GIVEN: POST /api/v1/contactos returns 201
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(CREATED_CONTACTO, { status: 201 })
      )
    );

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useCreateContacto is rendered with onSuccess option and mutate is called
    const { result } = renderHook(() => useCreateContacto({ onSuccess: onSuccessMock }), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: onSuccess is called once
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should NOT call options.onSuccess when mutation fails', async () => {
    // GIVEN: POST /api/v1/contactos returns 500
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useCreateContacto is rendered with onSuccess option and mutate fails
    const { result } = renderHook(() => useCreateContacto({ onSuccess: onSuccessMock }), { wrapper });

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
// 400 Validation error exposure
// ---------------------------------------------------------------------------

describe('useCreateContacto — 400 validation error', () => {
  it('should expose isError true when backend returns 400', async () => {
    // GIVEN: POST /api/v1/contactos returns 400 Validation Error
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Validation Error',
            errors: { email: ["'Email' is not a valid email address."] },
          },
          { status: 400 }
        )
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: useCreateContacto is rendered and mutate is called
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate(VALID_PAYLOAD);
    });

    // THEN: isError becomes true (hook surfaces the 400 as an error)
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isError state: exposes error correctly
// ---------------------------------------------------------------------------

describe('useCreateContacto — isError state', () => {
  it('should expose isError as false before mutation is triggered', () => {
    // GIVEN: No mutation triggered yet
    server.use(
      http.post('/api/v1/contactos', () =>
        HttpResponse.json(CREATED_CONTACTO, { status: 201 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateContacto(), { wrapper });

    // THEN: isError is false in idle state
    expect(result.current.isError).toBe(false);
  });
});
