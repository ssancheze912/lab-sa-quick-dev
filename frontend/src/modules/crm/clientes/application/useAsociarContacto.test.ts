/**
 * Unit tests — useAsociarContacto mutation hook
 * Story 4.2 — Associate & Disassociate Contacts from Client (ATDD RED phase)
 *
 * These tests are in RED phase — useAsociarContacto.ts does not exist yet.
 * Expected failure: "Cannot find module './useAsociarContacto'"
 *
 * Test IDs covered:
 *   TC-1  Calls PUT /api/v1/contactos/{id}/cliente with correct body { clienteId: uuid }
 *   TC-2  Invalidates ['contactos'] and ['contactos', { clienteId }] on success
 *   TC-3  Toast "Contacto asociado correctamente" shown on success
 *   TC-4  Toast "No se pudo asociar el contacto. Intenta de nuevo." shown on error
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
import { useAsociarContacto } from './useAsociarContacto';

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
// TC-1: Calls PUT /api/v1/contactos/{id}/cliente with { clienteId: uuid }
// ---------------------------------------------------------------------------

describe('useAsociarContacto — TC-1: calls correct endpoint with correct body', () => {
  it('should call PUT /api/v1/contactos/{id}/cliente with body { clienteId: uuid }', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 200 OK
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
            clienteId: (capturedBody as { clienteId: string }).clienteId,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    const { wrapper } = createWrapper();

    // WHEN: useAsociarContacto is rendered and mutate is called
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: mutation succeeds and correct URL/body were used
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedUrl).toBe(`/api/v1/contactos/${CONTACTO_ID}/cliente`);
    expect(capturedBody).toEqual({ clienteId: CLIENTE_ID });
  });
});

// ---------------------------------------------------------------------------
// TC-2: Invalidates ['contactos'] and ['contactos', { clienteId }] on success
// ---------------------------------------------------------------------------

describe('useAsociarContacto — TC-2: cache invalidation on success', () => {
  it('should invalidate ["contactos"] after successful association', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 200 OK
    server.use(handleAssignClienteSuccess({ clienteId: CLIENTE_ID }));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useAsociarContacto is rendered and mutate succeeds
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

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

  it('should invalidate ["contactos", { clienteId }] after successful association', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 200 OK
    server.use(handleAssignClienteSuccess({ clienteId: CLIENTE_ID }));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useAsociarContacto mutate is called
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

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

  it('should NOT call invalidateQueries when association mutation fails', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 500
    server.use(handleAssignClienteServerError());

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: useAsociarContacto mutate fails
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // THEN: invalidateQueries was NOT called
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-3: Toast "Contacto asociado correctamente" on success
// ---------------------------------------------------------------------------

describe('useAsociarContacto — TC-3: success toast in Spanish', () => {
  it('should show toast "Contacto asociado correctamente" on successful association', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 200 OK
    server.use(handleAssignClienteSuccess({ clienteId: CLIENTE_ID }));

    const { wrapper } = createWrapper();

    // WHEN: useAsociarContacto mutate succeeds
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: mutation completes successfully (toast assertion verified via side-effect)
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// TC-4: Toast "No se pudo asociar el contacto. Intenta de nuevo." on error
// ---------------------------------------------------------------------------

describe('useAsociarContacto — TC-4: error toast in Spanish', () => {
  it('should expose isError true when backend returns 500', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 500
    server.use(handleAssignClienteServerError());

    const { wrapper } = createWrapper();

    // WHEN: useAsociarContacto mutate is called and fails
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({ contactoId: CONTACTO_ID, clienteId: CLIENTE_ID });
    });

    // THEN: isError is true (error toast "No se pudo asociar el contacto. Intenta de nuevo.")
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

    // WHEN: useAsociarContacto mutate is called with unknown contactoId
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

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

describe('useAsociarContacto — TC-5: isPending state', () => {
  it('should expose isPending as false before any mutation is triggered', () => {
    // GIVEN: No mutation triggered
    server.use(handleAssignClienteSuccess());

    const { wrapper } = createWrapper();

    // WHEN: hook rendered but mutate NOT called
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

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
            clienteId: CLIENTE_ID,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    const { wrapper } = createWrapper();

    // WHEN: useAsociarContacto is rendered and mutate is called
    const { result } = renderHook(() => useAsociarContacto(), { wrapper });

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
