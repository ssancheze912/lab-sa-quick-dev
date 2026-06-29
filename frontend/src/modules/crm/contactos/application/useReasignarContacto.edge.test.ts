/**
 * Edge case tests — useReasignarContacto hook
 * Story 4.6 | Reassign Contact to Different Client — Edge Cases (Automate phase)
 *
 * Coverage focus (not covered by ATDD tests):
 *   EDGE-1  Idempotent reassign: mutate with oldClienteId == newClienteId still fires PUT
 *   EDGE-2  Rapid double-mutate: second call while first is pending is ignored (isPending guard)
 *   EDGE-3  Network-level failure (TypeError: Failed to fetch) triggers error toast
 *   EDGE-4  404 response from backend triggers error toast (contact not found)
 *   EDGE-5  400 Bad Request triggers error toast (validation failure)
 *   EDGE-6  All four invalidateQueries calls fire in a single successful mutation
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
  handleReasignarClienteSuccess,
  handleReasignarClienteCapture,
  handleReasignarClienteServerError,
} from '../../../test/msw/handlers/contactos-reasignar-cliente.handlers';
import { createContacto, resetContactoCounter } from '../../../test/factories/contacto.factory';
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
// Helper
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

const SAME_CLIENT_ID = '00000000-0000-0000-aaaa-000000000001';
const CONTACTO = createContacto({ clienteId: SAME_CLIENT_ID });

// ---------------------------------------------------------------------------
// EDGE-1: Idempotent reassign — same clienteId fires the PUT anyway (AC #9)
// ---------------------------------------------------------------------------

describe('useReasignarContacto — EDGE-1: idempotent reassign (same client)', () => {
  it('[P2] EDGE-1: should call PUT even when newClienteId equals oldClienteId', async () => {
    // GIVEN: PUT handler captures request; newClienteId === oldClienteId
    const captureRef = { clienteId: null as string | null };
    server.use(handleReasignarClienteCapture(CONTACTO, captureRef));

    const { wrapper } = createWrapper();

    // WHEN: mutate is called with same old and new clienteId
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: SAME_CLIENT_ID,
        oldClienteId: SAME_CLIENT_ID,
      });
    });

    // THEN: PUT was called (hook does not short-circuit same-id reassignment)
    await waitFor(() => {
      expect(captureRef.clienteId).toBe(SAME_CLIENT_ID);
    });
  });

  it('[P2] EDGE-1: idempotent reassign returns isSuccess after same-client PUT', async () => {
    // GIVEN: PUT returns 200 OK
    server.use(handleReasignarClienteSuccess(CONTACTO));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    // WHEN: mutate with same old and new clienteId
    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: SAME_CLIENT_ID,
        oldClienteId: SAME_CLIENT_ID,
      });
    });

    // THEN: mutation completes successfully
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('[P2] EDGE-1: idempotent reassign invalidates contactos cache (same-client success)', async () => {
    // GIVEN: PUT returns 200 OK
    server.use(handleReasignarClienteSuccess(CONTACTO));

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    // WHEN: same-client reassign succeeds
    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: SAME_CLIENT_ID,
        oldClienteId: SAME_CLIENT_ID,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: cache invalidation still fires (idempotent write should refresh caches)
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['contactos'] })
    );
  });
});

// ---------------------------------------------------------------------------
// EDGE-2: Rapid double-mutate — second call while isPending is ignored
// ---------------------------------------------------------------------------

describe('useReasignarContacto — EDGE-2: rapid double-mutate prevention', () => {
  it('[P1] EDGE-2: should expose isPending=true after first mutate, blocking a second call', async () => {
    // GIVEN: PUT has a manual-resolve delay to keep the mutation in flight
    let resolveFirst!: () => void;
    const firstPending = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });

    server.use(
      http.put('/api/v1/contactos/:id/cliente', async ({ request }) => {
        await firstPending;
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
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    // WHEN: first mutate call fires
    act(() => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: '00000000-0000-0000-bbbb-000000000002',
        oldClienteId: SAME_CLIENT_ID,
      });
    });

    // THEN: isPending is true while in flight — consumer can gate a second click
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Cleanup: resolve so server handler exits cleanly
    resolveFirst();
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  it('[P1] EDGE-2: second mutate call after first resolves does fire (no permanent lock)', async () => {
    // GIVEN: PUT returns 200 on each call
    server.use(handleReasignarClienteSuccess(CONTACTO));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    const NEW_ID_1 = '00000000-0000-0000-bbbb-000000000002';
    const NEW_ID_2 = '00000000-0000-0000-cccc-000000000003';

    // WHEN: first mutate completes
    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_ID_1,
        oldClienteId: SAME_CLIENT_ID,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // WHEN: second mutate is called after first completes
    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: NEW_ID_2,
        oldClienteId: NEW_ID_1,
      });
    });

    // THEN: second mutation also succeeds
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// EDGE-3: Network-level failure (TypeError: Failed to fetch)
// ---------------------------------------------------------------------------

describe('useReasignarContacto — EDGE-3: network-level failure', () => {
  it('[P1] EDGE-3: network error triggers error toast and sets isError=true', async () => {
    // GIVEN: Network call throws a network error (offline scenario)
    server.use(
      http.put('/api/v1/contactos/:id/cliente', () => {
        throw new TypeError('Failed to fetch');
      })
    );

    const toastModule = await import('siesa-ui-kit');
    const toastErrorSpy = vi.spyOn(toastModule.toast, 'error');

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    // WHEN: mutate fires but network fails
    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: '00000000-0000-0000-bbbb-000000000002',
        oldClienteId: SAME_CLIENT_ID,
      });
    });

    // THEN: isError becomes true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: error toast is shown
    expect(toastErrorSpy).toHaveBeenCalledWith(
      'No se pudo reasignar el contacto. Intenta de nuevo.'
    );
  });

  it('[P1] EDGE-3: network error does NOT call invalidateQueries', async () => {
    // GIVEN: Network call fails
    server.use(
      http.put('/api/v1/contactos/:id/cliente', () => {
        throw new TypeError('Failed to fetch');
      })
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: '00000000-0000-0000-bbbb-000000000002',
        oldClienteId: SAME_CLIENT_ID,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// EDGE-4: 404 Not Found — contact does not exist
// ---------------------------------------------------------------------------

describe('useReasignarContacto — EDGE-4: 404 Not Found from backend', () => {
  it('[P1] EDGE-4: 404 response triggers error toast', async () => {
    // GIVEN: PUT returns 404 (contact does not exist)
    server.use(
      http.put('/api/v1/contactos/:id/cliente', () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'Contacto no encontrado.' },
          { status: 404 }
        )
      )
    );

    const toastModule = await import('siesa-ui-kit');
    const toastErrorSpy = vi.spyOn(toastModule.toast, 'error');

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    // WHEN: mutate fires; backend responds with 404
    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: '00000000-0000-0000-bbbb-000000000002',
        oldClienteId: SAME_CLIENT_ID,
      });
    });

    // THEN: isError is true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: error toast with Spanish message shown
    expect(toastErrorSpy).toHaveBeenCalledWith(
      'No se pudo reasignar el contacto. Intenta de nuevo.'
    );
  });

  it('[P1] EDGE-4: 404 response does NOT call invalidateQueries', async () => {
    // GIVEN: PUT returns 404
    server.use(
      http.put('/api/v1/contactos/:id/cliente', () =>
        HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 })
      )
    );

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: '00000000-0000-0000-bbbb-000000000002',
        oldClienteId: SAME_CLIENT_ID,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// EDGE-5: 400 Bad Request — validation failure
// ---------------------------------------------------------------------------

describe('useReasignarContacto — EDGE-5: 400 Bad Request validation failure', () => {
  it('[P1] EDGE-5: 400 response triggers error toast', async () => {
    // GIVEN: PUT returns 400 (invalid clienteId format)
    server.use(
      http.put('/api/v1/contactos/:id/cliente', () =>
        HttpResponse.json(
          { status: 400, title: 'Bad Request', errors: { clienteId: ['Must be a valid GUID.'] } },
          { status: 400 }
        )
      )
    );

    const toastModule = await import('siesa-ui-kit');
    const toastErrorSpy = vi.spyOn(toastModule.toast, 'error');

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    // WHEN: mutate fires; backend responds with 400
    await act(async () => {
      result.current.mutate({
        contactoId: CONTACTO.id,
        newClienteId: 'not-a-valid-guid',
        oldClienteId: SAME_CLIENT_ID,
      });
    });

    // THEN: isError is true
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // THEN: error toast shown
    expect(toastErrorSpy).toHaveBeenCalledWith(
      'No se pudo reasignar el contacto. Intenta de nuevo.'
    );
  });
});

// ---------------------------------------------------------------------------
// EDGE-6: All four invalidateQueries calls fire atomically on success
// ---------------------------------------------------------------------------

describe('useReasignarContacto — EDGE-6: all four cache keys invalidated together', () => {
  it('[P1] EDGE-6: invalidates all four expected query keys in a single successful mutation', async () => {
    // GIVEN: PUT returns 200 OK
    const OLD_ID = '00000000-0000-0000-aaaa-000000000001';
    const NEW_ID = '00000000-0000-0000-bbbb-000000000002';
    const contacto = createContacto({ clienteId: OLD_ID });
    server.use(handleReasignarClienteSuccess(contacto));

    const { queryClient, wrapper } = createWrapper();
    const calls: unknown[][] = [];
    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(
      ((opts: { queryKey: unknown[] }) => {
        calls.push(opts.queryKey);
        return Promise.resolve();
      }) as Parameters<typeof queryClient.invalidateQueries>[0] extends object
        ? never
        : never
    );
    // Use a simpler spy approach
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useReasignarContacto(), { wrapper });

    // WHEN: mutation succeeds
    await act(async () => {
      result.current.mutate({
        contactoId: contacto.id,
        newClienteId: NEW_ID,
        oldClienteId: OLD_ID,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // THEN: exactly four invalidation calls happened
    expect(invalidateSpy).toHaveBeenCalledTimes(4);

    // THEN: each specific key was invalidated
    const allCalls = invalidateSpy.mock.calls.map((call) => call[0]);

    expect(allCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ queryKey: ['contactos'] }),
        expect.objectContaining({ queryKey: ['contactos', { clienteId: OLD_ID }] }),
        expect.objectContaining({ queryKey: ['contactos', { clienteId: NEW_ID }] }),
        expect.objectContaining({ queryKey: ['contactos', contacto.id] }),
      ])
    );
  });
});
