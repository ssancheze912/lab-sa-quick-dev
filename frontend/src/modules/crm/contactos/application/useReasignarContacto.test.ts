/**
 * Unit tests — useReasignarContacto hook
 * Story 4.6 | Reassign Contact to Different Client (ATDD RED phase)
 *
 * Acceptance Criteria covered:
 *   AC #3  PUT /api/v1/contactos/{id}/cliente called with { clienteId: newClienteId }
 *   AC #4  TanStack Query keys invalidated + toast "Contacto reasignado correctamente"
 *   AC #7  isPending is true while mutation is in flight (confirm button disableable)
 *   AC #8  Error toast "No se pudo reasignar el contacto. Intenta de nuevo." on failure
 *
 * Test IDs (RED phase — useReasignarContacto.ts does not exist yet):
 *   TC-1  Calls PUT /api/v1/contactos/{id}/cliente with body { clienteId: newClienteId }
 *   TC-2  Invalidates ['contactos'], ['contactos', { clienteId: oldId }],
 *         ['contactos', { clienteId: newId }], ['contactos', contactoId] on success
 *   TC-3  Toast "Contacto reasignado correctamente" shown on success
 *   TC-4  Toast "No se pudo reasignar el contacto. Intenta de nuevo." shown on error
 *   TC-5  isPending is true while mutation is in flight, false before
 *   TC-6  isError is true when backend returns 500
 *
 * Expected RED failure:
 *   "Cannot find module './useReasignarContacto'"
 *
 * Stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import {
  handleReasignarClienteSuccess,
  handleReasignarClienteCapture,
  handleReasignarClienteServerError,
} from '../../../test/msw/handlers/contactos-reasignar-cliente.handlers';
import { createContacto, resetContactoCounter } from '../../../test/factories/contacto.factory';
// RED: this module does not exist yet — import will fail until Task 3 is implemented
import { useReasignarContacto } from './useReasignarContacto';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: wrap useReasignarContacto in QueryClientProvider with isolated QueryClient
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

const OLD_CLIENTE_ID = '00000000-0000-0000-aaaa-000000000001';
const NEW_CLIENTE_ID = '00000000-0000-0000-bbbb-000000000002';
const CONTACTO = createContacto({ clienteId: OLD_CLIENTE_ID });

// ---------------------------------------------------------------------------
// TC-1: Calls PUT with correct body { clienteId: newClienteId } (AC #3)
// ---------------------------------------------------------------------------

describe('useReasignarContacto — TC-1: calls PUT with correct body', () => {
  it('TC-1: should call PUT /api/v1/contactos/{id}/cliente with { clienteId: newClienteId }', async () => {
    // GIVEN: PUT /api/v1/contactos/:id/cliente returns 200 OK and captures request body
    const captureRef = { clienteId: null as string | null };
    server.use(handleReasignarClienteCapture(CONTACTO, captureRef));

    const { wrapper } = createWrapper();

    // WHEN: useReasignarContacto is rendered and mutate is called
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    // THEN: The request body contained the new clienteId
    await waitFor(() => {
      expect(captureRef.clienteId).toBe(NEW_CLIENTE_ID);
    });
  });

  it('TC-1: should NOT call PUT with the old clienteId in the body', async () => {
    // GIVEN: PUT returns 200 and we capture the sent clienteId
    const captureRef = { clienteId: null as string | null };
    server.use(handleReasignarClienteCapture(CONTACTO, captureRef));

    const { wrapper } = createWrapper();

    // WHEN: mutate is called with a different new clienteId
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    await waitFor(() => {
      expect(captureRef.clienteId).not.toBeNull();
    });

    // THEN: The sent clienteId is the NEW one, not the old one
    expect(captureRef.clienteId).not.toBe(OLD_CLIENTE_ID);
  });
});

// ---------------------------------------------------------------------------
// TC-2: Cache invalidation on success (AC #4)
// ---------------------------------------------------------------------------

describe('useReasignarContacto — TC-2: cache invalidation on success', () => {
  it("TC-2a: should invalidate ['contactos'] after successful reassignment", async () => {
    // GIVEN: PUT returns 200 OK
    server.use(handleReasignarClienteSuccess(CONTACTO));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: mutate is called
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    // THEN: invalidateQueries called with global contactos prefix
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos'] })
      );
    });
  });

  it("TC-2b: should invalidate ['contactos', { clienteId: oldClienteId }] on success", async () => {
    // GIVEN: PUT returns 200 OK
    server.use(handleReasignarClienteSuccess(CONTACTO));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: mutate is called
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    // THEN: old client's contact panel is invalidated
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos', { clienteId: OLD_CLIENTE_ID }] })
      );
    });
  });

  it("TC-2c: should invalidate ['contactos', { clienteId: newClienteId }] on success", async () => {
    // GIVEN: PUT returns 200 OK
    server.use(handleReasignarClienteSuccess(CONTACTO));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: mutate is called
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    // THEN: new client's contact panel is invalidated
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos', { clienteId: NEW_CLIENTE_ID }] })
      );
    });
  });

  it("TC-2d: should invalidate ['contactos', contactoId] on success", async () => {
    // GIVEN: PUT returns 200 OK
    server.use(handleReasignarClienteSuccess(CONTACTO));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: mutate is called
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    // THEN: single contact detail cache is invalidated
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos', CONTACTO.id] })
      );
    });
  });

  it('TC-2e: should NOT call invalidateQueries when mutation fails', async () => {
    // GIVEN: PUT returns 500
    server.use(handleReasignarClienteServerError());

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: mutate fails
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: no cache invalidation occurs
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-3: Success toast (AC #4)
// ---------------------------------------------------------------------------

describe('useReasignarContacto — TC-3: success toast', () => {
  it('TC-3: should show "Contacto reasignado correctamente" toast on success', async () => {
    // GIVEN: PUT returns 200 OK
    server.use(handleReasignarClienteSuccess(CONTACTO));

    // Spy on toast module before rendering the hook
    const toastModule = await import('siesa-ui-kit');
    const toastSpy = vi.spyOn(toastModule.toast, 'success');

    const { wrapper } = createWrapper();

    // WHEN: mutate is called and succeeds
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    // THEN: success toast with Spanish text is shown
    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalledWith('Contacto reasignado correctamente');
    });
  });
});

// ---------------------------------------------------------------------------
// TC-4: Error toast (AC #8)
// ---------------------------------------------------------------------------

describe('useReasignarContacto — TC-4: error toast', () => {
  it('TC-4: should show "No se pudo reasignar el contacto. Intenta de nuevo." toast on error', async () => {
    // GIVEN: PUT returns 500
    server.use(handleReasignarClienteServerError());

    // Spy on toast module before rendering the hook
    const toastModule = await import('siesa-ui-kit');
    const toastErrorSpy = vi.spyOn(toastModule.toast, 'error');

    const { wrapper } = createWrapper();

    // WHEN: mutate is called and fails
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: error toast with Spanish text is shown
    expect(toastErrorSpy).toHaveBeenCalledWith(
      'No se pudo reasignar el contacto. Intenta de nuevo.'
    );
  });

  it('TC-4: should NOT show success toast when mutation fails', async () => {
    // GIVEN: PUT returns 500
    server.use(handleReasignarClienteServerError());

    const toastModule = await import('siesa-ui-kit');
    const toastSuccessSpy = vi.spyOn(toastModule.toast, 'success');

    const { wrapper } = createWrapper();

    // WHEN: mutate fails
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: success toast is never shown
    expect(toastSuccessSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-5: isPending is true during in-flight mutation (AC #7)
// ---------------------------------------------------------------------------

describe('useReasignarContacto — TC-5: isPending state', () => {
  it('TC-5: should expose isPending as true while the PUT mutation is in flight', async () => {
    // GIVEN: PUT /api/v1/contactos/:id/cliente has a delay before resolving
    let resolveRequest!: () => void;
    const requestPending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const { http } = await import('msw');
    const { HttpResponse } = await import('msw');
    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ request }) => {
        await requestPending;
        const body = (await request.json()) as Record<string, string | null>;
        return HttpResponse.json(
          {
            id: CONTACTO.id,
            nombre: CONTACTO.nombre,
            cargo: CONTACTO.cargo,
            telefono: CONTACTO.telefono,
            email: CONTACTO.email,
            clienteId: body.clienteId ?? null,
            createdAt: CONTACTO.createdAt,
            updatedAt: new Date().toISOString(),
          },
          { status: 200 }
        );
      })
    );

    const { wrapper } = createWrapper();

    // WHEN: mutate is called
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    act(() => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    // THEN: isPending is true while waiting
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Cleanup: resolve the pending request
    resolveRequest();
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('TC-5: should expose isPending as false before any mutation is triggered', () => {
    // GIVEN: No mutation has been triggered
    server.use(handleReasignarClienteSuccess(CONTACTO));

    const { wrapper } = createWrapper();

    // WHEN: hook is rendered but mutate is NOT called
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    // THEN: isPending is false (idle state)
    expect(result.current.isPending).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-6: isError state (AC #8)
// ---------------------------------------------------------------------------

describe('useReasignarContacto — TC-6: isError state on failure', () => {
  it('TC-6: should expose isError as true when PUT returns 500', async () => {
    // GIVEN: PUT returns 500
    server.use(handleReasignarClienteServerError());

    const { wrapper } = createWrapper();

    // WHEN: mutate is called and fails
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_CLIENTE_ID,
        oldClienteId: OLD_CLIENTE_ID,
      });
    });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: data remains undefined — no optimistic update applied
    expect(result.current.data).toBeUndefined();
  });
});
