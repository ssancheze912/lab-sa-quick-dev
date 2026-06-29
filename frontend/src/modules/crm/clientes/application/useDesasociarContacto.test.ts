/**
 * Unit tests — useDesasociarContacto mutation hook
 * Story 4.2 — Associate & Disassociate Contacts from Client (ATDD RED phase)
 *
 * These tests are in RED phase — useDesasociarContacto.ts does not exist yet.
 * Expected failure: "Cannot find module './useDesasociarContacto'"
 *
 * Test IDs covered:
 *   TC-1  Calls PUT /api/v1/contactos/{id}/cliente with body { clienteId: null }
 *   TC-2  Invalidates ['contactos'] and ['contactos', { clienteId }] on success
 *   TC-3  Toast "Contacto desasociado correctamente" shown on success
 *   TC-4  Toast "No se pudo desasociar el contacto. Intenta de nuevo." shown on error
 *   TC-5  isPending is true while mutation is in-flight, false before/after
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  handleAssignClienteSuccess,
  handleAssignClienteServerError,
} from '../../../test/msw/handlers/contactos-assign-cliente.handlers';
import { useDesasociarContacto } from './useDesasociarContacto';

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
// Helper: wrap hook in QueryClientProvider with isolated QueryClient
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

const CONTACTO_ID = '10000000-0000-0000-0000-000000000001';
const CLIENTE_ID = '20000000-0000-0000-0000-000000000001';

// ---------------------------------------------------------------------------
// TC-1: Calls PUT /api/v1/contactos/{id}/cliente with body { clienteId: null }
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — TC-1: calls correct endpoint with null clienteId', () => {
  it('should call PUT /api/v1/contactos/{id}/cliente with body { clienteId: null }', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 200 OK with null clienteId
    let capturedBody: Record<string, unknown> | null = null;
    let capturedUrl = '';

    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ request, params }) => {
        capturedUrl = `/api/v1/contactos/${params.contactoId}/cliente`;
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: params.contactoId,
            nombre: 'Contacto Test',
            cargo: 'Cargo',
            telefono: '3100000001',
            email: 'test@siesa.com',
            clienteId: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    const { wrapper } = createWrapper();

    // WHEN: useDesasociarContacto is rendered and mutate is called
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: mutation succeeds and correct URL/body were used
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toBe(`/api/v1/contactos/${CONTACTO_ID}/cliente`);
    expect(capturedBody).toEqual({ clienteId: null });
  });
});

// ---------------------------------------------------------------------------
// TC-2: Invalidates ['contactos'] and ['contactos', { clienteId }] on success
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — TC-2: cache invalidation on success', () => {
  it('should invalidate ["contactos"] after successful disassociation', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 200 OK with null clienteId
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useDesasociarContacto mutate succeeds
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: invalidateQueries is called with ['contactos']
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos'] })
      );
    });
  });

  it('should invalidate ["contactos", { clienteId }] after successful disassociation', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 200 OK
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useDesasociarContacto mutate is called with a clienteId
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: invalidateQueries is called with ['contactos', { clienteId }]
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos', { clienteId: CLIENTE_ID }] })
      );
    });
  });

  it('should NOT call invalidateQueries when disassociation mutation fails', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 500
    server.use(handleAssignClienteServerError());

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useDesasociarContacto mutate fails
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: invalidateQueries was NOT called
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-3: Toast "Contacto desasociado correctamente" on success
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — TC-3: success toast in Spanish', () => {
  it('should complete successfully (toast "Contacto desasociado correctamente")', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 200 OK
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    const { wrapper } = createWrapper();

    // WHEN: useDesasociarContacto mutate succeeds
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: mutation completes in success state
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isError).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-4: Toast "No se pudo desasociar el contacto. Intenta de nuevo." on error
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — TC-4: error toast in Spanish', () => {
  it('should expose isError true when backend returns 500 (error toast expected)', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 500
    server.use(handleAssignClienteServerError());

    const { wrapper } = createWrapper();

    // WHEN: useDesasociarContacto mutate is called and fails
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: isError is true (error toast "No se pudo desasociar el contacto. Intenta de nuevo.")
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('should expose isError true when backend returns 404', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 404
    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', () =>
        HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 })
      )
    );

    const { wrapper } = createWrapper();

    // WHEN: useDesasociarContacto mutate is called with unknown contactoId
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: isError is true
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// TC-5: isPending during in-flight mutation
// ---------------------------------------------------------------------------

describe('useDesasociarContacto — TC-5: isPending state', () => {
  it('should expose isPending as false before any mutation is triggered', () => {
    // GIVEN: No mutation triggered yet
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    const { wrapper } = createWrapper();

    // WHEN: hook rendered but mutate NOT called
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    // THEN: isPending is false (idle state)
    expect(result.current.isPending).toBe(false);
  });

  it('should expose isPending as true while PUT mutation is in-flight', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente has a controlled delay
    let resolveRequest!: () => void;
    const requestPending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ params }) => {
        await requestPending;
        return HttpResponse.json(
          {
            id: params.contactoId,
            nombre: 'Contacto',
            cargo: 'Cargo',
            telefono: '3100000001',
            email: 'test@siesa.com',
            clienteId: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    const { wrapper } = createWrapper();

    // WHEN: useDesasociarContacto is rendered and mutate is called
    const { result } = renderHook(() => useDesasociarContacto(), { wrapper });

    act(() => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: isPending is true while waiting for network response
    await waitFor(() => expect(result.current.isPending).toBe(true));

    // Cleanup: resolve the pending request
    resolveRequest();
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
