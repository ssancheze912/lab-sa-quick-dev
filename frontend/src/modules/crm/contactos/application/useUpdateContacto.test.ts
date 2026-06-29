/**
 * Unit tests — useUpdateContacto hook
 * Story 3.4 | Edit Contact | TC-E3-P2-update-01, TC-E3-P2-update-02, TC-E3-P2-update-03
 *
 * RED phase — useUpdateContacto.ts does not exist yet.
 * Expected failure: "Cannot find module './useUpdateContacto'"
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useUpdateContacto } from './useUpdateContacto';

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
// Helper: wrap useUpdateContacto in QueryClientProvider with isolated QueryClient
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
// TC-E3-P2-update-01: Both queryKeys invalidated on onSuccess
// ---------------------------------------------------------------------------

describe('useUpdateContacto — cache invalidation on success (TC-E3-P2-update-01)', () => {
  it('TC-E3-P2-update-01: should call queryClient.invalidateQueries with key ["contactos"] after successful mutation', async () => {
    // GIVEN: PUT /api/v1/contactos/:id returns 200 with the updated contacto
    server.use(
      http.put(`/api/v1/contactos/${CONTACT_ID}`, () =>
        HttpResponse.json(UPDATED_CONTACTO, { status: 200 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useUpdateContacto hook is rendered and mutate is called
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    // THEN: invalidateQueries is called with queryKey ['contactos'] (list)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos'] })
      );
    });
  });

  it('TC-E3-P2-update-01: should call queryClient.invalidateQueries with key ["contactos", id] after successful mutation', async () => {
    // GIVEN: PUT /api/v1/contactos/:id returns 200 with the updated contacto
    server.use(
      http.put(`/api/v1/contactos/${CONTACT_ID}`, () =>
        HttpResponse.json(UPDATED_CONTACTO, { status: 200 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useUpdateContacto hook is rendered and mutate is called
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    // THEN: invalidateQueries is ALSO called with queryKey ['contactos', id] (detail)
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos', CONTACT_ID] })
      );
    });
  });

  it('should NOT call invalidateQueries when mutation fails', async () => {
    // GIVEN: PUT /api/v1/contactos/:id returns 500
    server.use(
      http.put(`/api/v1/contactos/${CONTACT_ID}`, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useUpdateContacto hook is rendered and mutate fails
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    // THEN: Wait for mutation to settle — invalidateQueries must NOT have been called
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P2-update-02: isPending is true during in-flight mutation
// ---------------------------------------------------------------------------

describe('useUpdateContacto — isPending during mutation (TC-E3-P2-update-02)', () => {
  it('TC-E3-P2-update-02: should expose isPending as true while the mutation is in flight', async () => {
    // GIVEN: PUT /api/v1/contactos/:id has a delay before resolving
    let resolveRequest: () => void;
    const requestPending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.put(`/api/v1/contactos/${CONTACT_ID}`, async () => {
        await requestPending;
        return HttpResponse.json(UPDATED_CONTACTO, { status: 200 });
      })
    );

    const { wrapper } = createWrapper();

    // WHEN: useUpdateContacto is rendered and mutate is called
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    act(() => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
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
      http.put(`/api/v1/contactos/${CONTACT_ID}`, () =>
        HttpResponse.json(UPDATED_CONTACTO, { status: 200 })
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: useUpdateContacto is rendered but mutate is NOT called
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    // THEN: isPending is false (idle state)
    expect(result.current.isPending).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P2-update-03: onError callback — generic error, no raw details
// ---------------------------------------------------------------------------

describe('useUpdateContacto — onError generic message (TC-E3-P2-update-03)', () => {
  it('TC-E3-P2-update-03: should expose isError true when backend returns 404', async () => {
    // GIVEN: PUT /api/v1/contactos/:id returns 404 Not Found
    server.use(
      http.put(`/api/v1/contactos/${CONTACT_ID}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'Contacto no encontrado' },
          { status: 404 }
        )
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: useUpdateContacto is rendered and mutate is called
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    // THEN: isError becomes true (hook surfaces the 404 as an error)
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it('TC-E3-P2-update-03: should expose isError true when backend returns 400', async () => {
    // GIVEN: PUT /api/v1/contactos/:id returns 400 Validation Error
    server.use(
      http.put(`/api/v1/contactos/${CONTACT_ID}`, () =>
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

    // WHEN: useUpdateContacto is rendered and mutate is called
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    // THEN: isError becomes true (hook surfaces the 400 as an error)
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// onSuccess callback: calls options.onSuccess when provided
// ---------------------------------------------------------------------------

describe('useUpdateContacto — onSuccess callback', () => {
  it('should call options.onSuccess when the mutation succeeds', async () => {
    // GIVEN: PUT /api/v1/contactos/:id returns 200
    server.use(
      http.put(`/api/v1/contactos/${CONTACT_ID}`, () =>
        HttpResponse.json(UPDATED_CONTACTO, { status: 200 })
      )
    );

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useUpdateContacto is rendered with onSuccess option and mutate is called
    const { result } = renderHook(() => useUpdateContacto({ onSuccess: onSuccessMock }), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    // THEN: onSuccess is called once
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it('should NOT call options.onSuccess when mutation fails', async () => {
    // GIVEN: PUT /api/v1/contactos/:id returns 500
    server.use(
      http.put(`/api/v1/contactos/${CONTACT_ID}`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 })
      )
    );

    const onSuccessMock = vi.fn();
    const { wrapper } = createWrapper();

    // WHEN: useUpdateContacto is rendered with onSuccess option and mutate fails
    const { result } = renderHook(() => useUpdateContacto({ onSuccess: onSuccessMock }), { wrapper });

    await act(async () => {
      result.current.mutate({ id: CONTACT_ID, data: VALID_PAYLOAD });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: onSuccess is NOT called
    expect(onSuccessMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// isError state: exposes error correctly
// ---------------------------------------------------------------------------

describe('useUpdateContacto — isError state', () => {
  it('should expose isError as false before mutation is triggered', () => {
    // GIVEN: No mutation triggered yet
    server.use(
      http.put(`/api/v1/contactos/${CONTACT_ID}`, () =>
        HttpResponse.json(UPDATED_CONTACTO, { status: 200 })
      )
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateContacto(), { wrapper });

    // THEN: isError is false in idle state
    expect(result.current.isError).toBe(false);
  });
});
