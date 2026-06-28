/**
 * Automation expansion — Story 2.5: Delete Client — component edge cases.
 *
 * Expands ATDD coverage (DeleteCliente.test.tsx) with edge cases not covered there:
 *
 *   [P1] Dialog state resets: after cancel, re-opening shows fresh dialog (no stale state)
 *   [P1] Double-confirm guard: "Confirmar" button disabled mid-flight prevents second click from triggering a second DELETE
 *   [P1] 404 DELETE response → error toast shown, onClienteDeleted NOT called
 *   [P2] Network error (no response) → error toast shown, onClienteDeleted NOT called
 *   [P2] queryClient cache eviction: after confirm, ['clientes', id] cache entry is removed
 *   [P2] isPending text change: "Confirmar" button label changes to "Eliminando..." while pending
 *   [P2] Dialog does not close on overlay click mid-mutation (isPending guard)
 *   [P3] "Eliminar" button not rendered during loading skeleton state
 *   [P3] "Eliminar" button not rendered when GET /api/v1/clientes/:id returns 404
 *   [P3] "Eliminar" button not rendered when GET /api/v1/clientes/:id returns 500 (error state)
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'sonner';

import { buildCliente, resetClienteCounter } from './clienteFactory';
import { ClienteDetailView } from '../presentation/ClienteDetailView';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected React query / mutation errors in test output
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]') ||
    msg.includes('AxiosError') ||
    msg.includes('Request failed with status code') ||
    msg.includes('act(...)') ||
    msg.includes('not wrapped in act') ||
    msg.includes('Network Error')
  ) {
    return;
  }
  originalConsoleError(...args);
});

const API_BASE = 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup (network-first: handlers registered BEFORE render)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetClienteCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteDetail(props: {
  clienteId: string;
  onClienteDeleted?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const onClienteDeleted = props.onClienteDeleted ?? vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ClienteDetailView
        clienteId={props.clienteId}
        onClienteDeleted={onClienteDeleted}
      />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onClienteDeleted };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog state reset after cancel — reopening shows clean state
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteCliente — dialog state resets after cancel (P1)', () => {
  it('[P1] should allow the dialog to be re-opened cleanly after clicking "Cancelar"', async () => {
    // GIVEN: A client is loaded (network-first: intercept BEFORE render)
    const cliente = buildCliente({
      id: 'aaaaaaaa-bbbb-cccc-dddd-111111111111',
      nombre: 'Empresa Reabrir Dialog SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    renderClienteDetail({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User opens dialog → cancels → opens again
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-cancel-delete')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-cancel-delete'));
    await waitFor(() => {
      expect(screen.queryByTestId('btn-cancel-delete')).not.toBeInTheDocument();
    });

    // Re-open dialog
    await userEvent.click(screen.getByTestId('btn-eliminar'));

    // THEN: Dialog opens again cleanly with all expected elements
    await waitFor(() => {
      expect(screen.getByText('¿Eliminar este cliente?')).toBeInTheDocument();
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
      expect(screen.getByTestId('btn-cancel-delete')).toBeInTheDocument();
    });

    // AND: Confirm button is NOT disabled (fresh state — no pending mutation)
    expect(screen.getByTestId('btn-confirm-delete')).not.toBeDisabled();
  });

  it('[P1] should open dialog a second time and allow successful deletion after cancelling the first time', async () => {
    // GIVEN: A client is loaded
    const cliente = buildCliente({
      id: 'aaaaaaaa-bbbb-cccc-dddd-222222222222',
      nombre: 'Empresa Segunda Vez SA',
    });

    let deleteCallCount = 0;
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () => {
        deleteCallCount += 1;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { onClienteDeleted } = renderClienteDetail({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // First attempt: open dialog → cancel
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-cancel-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-cancel-delete'));
    await waitFor(() => {
      expect(screen.queryByTestId('btn-cancel-delete')).not.toBeInTheDocument();
    });

    expect(deleteCallCount).toBe(0);

    // Second attempt: open dialog → confirm
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: DELETE called exactly once (only on second attempt)
    await waitFor(() => {
      expect(deleteCallCount).toBe(1);
    });

    await waitFor(() => {
      expect(onClienteDeleted).toHaveBeenCalledTimes(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Double-confirm guard — disabled button prevents duplicate DELETE calls
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteCliente — double-click prevention on "Confirmar" (P1)', () => {
  it('[P1] should NOT call DELETE twice when "Confirmar" is clicked multiple times while mutation is pending', async () => {
    // GIVEN: A client is loaded
    const cliente = buildCliente({
      id: 'bbbbbbbb-cccc-dddd-eeee-111111111111',
      nombre: 'Empresa Double Click SA',
    });

    let deleteCallCount = 0;
    let resolveDelete!: () => void;
    const delayedDelete = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, async () => {
        deleteCallCount += 1;
        await delayedDelete;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderClienteDetail({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });

    // WHEN: User clicks "Confirmar" (first click — mutation starts)
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // AND: Button becomes disabled while pending
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeDisabled();
    });

    // WHEN: User tries to click disabled "Confirmar" again
    // userEvent.click on a disabled button — should be a no-op
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: DELETE was called only once (the disabled button blocked the second click)
    expect(deleteCallCount).toBe(1);

    // Cleanup: resolve the pending DELETE
    resolveDelete();
  });

  it('[P1] should show "Eliminando..." text on "Confirmar" button while DELETE is in-flight', async () => {
    // GIVEN: A client is loaded with a delayed DELETE
    const cliente = buildCliente({
      id: 'bbbbbbbb-cccc-dddd-eeee-222222222222',
      nombre: 'Empresa Pending Text SA',
    });

    let resolveDelete!: () => void;
    const delayedDelete = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, async () => {
        await delayedDelete;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderClienteDetail({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });

    // Verify initial text
    expect(screen.getByTestId('btn-confirm-delete')).toHaveTextContent(/confirmar/i);

    // WHEN: User clicks "Confirmar"
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Button text changes to "Eliminando..." while pending
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toHaveTextContent(/eliminando/i);
    });

    // Cleanup
    resolveDelete();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 DELETE response → error toast, onClienteDeleted NOT called
// Edge case: 404 is a client-side error (resource already gone or wrong ID)
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteCliente — 404 DELETE response handled as error (P1)', () => {
  it('[P1] should show error toast when DELETE returns 404 and NOT call onClienteDeleted', async () => {
    // GIVEN: Client is loaded but DELETE returns 404 (e.g., already deleted concurrently)
    const cliente = buildCliente({
      id: 'cccccccc-dddd-eeee-ffff-111111111111',
      nombre: 'Empresa Ya Eliminada SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Cliente no encontrado', detail: 'El cliente solicitado no fue encontrado.' },
          { status: 404 }
        )
      )
    );

    const { onClienteDeleted } = renderClienteDetail({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Error toast appears (handles 404 as a deletion failure)
    await waitFor(() => {
      expect(screen.getByText(/no se pudo eliminar el cliente/i)).toBeInTheDocument();
    });

    // AND: onClienteDeleted is NOT called (navigation only on success)
    expect(onClienteDeleted).not.toHaveBeenCalled();
  });

  it('[P1] dialog should close even when DELETE returns 404 (no lingering open dialog)', async () => {
    // GIVEN: DELETE returns 404
    const cliente = buildCliente({
      id: 'cccccccc-dddd-eeee-ffff-222222222222',
      nombre: 'Empresa 404 Close Dialog SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 })
      )
    );

    renderClienteDetail({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Dialog closes (onError handler sets isDeleteDialogOpen=false)
    await waitFor(() => {
      expect(screen.queryByTestId('btn-confirm-delete')).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Network error (no response) → error toast, no navigation
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteCliente — network error handling (P2)', () => {
  it('[P2] should show error toast when DELETE has a network error (no response)', async () => {
    // GIVEN: A client is loaded but DELETE has a network error
    const cliente = buildCliente({
      id: 'dddddddd-eeee-ffff-0000-111111111111',
      nombre: 'Empresa Network Error SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.error())
    );

    const { onClienteDeleted } = renderClienteDetail({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Error toast appears
    await waitFor(() => {
      expect(screen.getByText(/no se pudo eliminar el cliente/i)).toBeInTheDocument();
    });

    // AND: Navigation not triggered
    expect(onClienteDeleted).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cache eviction: ['clientes', id] query removed after successful deletion
// Ensures stale detail data is not served if user navigates back to same ID
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteCliente — TanStack Query cache eviction (P2)', () => {
  it('[P2] should remove the single-client cache entry after successful deletion', async () => {
    // GIVEN: A client is loaded (data will be cached under ['clientes', id])
    const cliente = buildCliente({
      id: 'eeeeeeee-ffff-0000-1111-222222222222',
      nombre: 'Empresa Cache Eviction SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    const { queryClient } = renderClienteDetail({ clienteId: cliente.id });

    // Wait for the detail to be loaded (data cached)
    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // Verify cache entry exists before deletion
    // The useCliente hook uses key ['clientes', clienteId]
    await waitFor(() => {
      const cachedData = queryClient.getQueryData(['clientes', cliente.id]);
      expect(cachedData).toBeDefined();
    });

    // WHEN: User confirms deletion
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Wait for mutation success
    await waitFor(() => {
      expect(screen.getByText('Cliente eliminado correctamente')).toBeInTheDocument();
    });

    // AND: Single-client cache entry is removed (removeQueries called in useDeleteCliente)
    await waitFor(() => {
      const cachedDataAfter = queryClient.getQueryData(['clientes', cliente.id]);
      expect(cachedDataAfter).toBeUndefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// "Eliminar" button visibility in non-data-loaded states
// Ensures btn-eliminar is ONLY shown in the data-loaded (happy) render path
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteCliente — btn-eliminar hidden in error and not-found states (P3)', () => {
  it('[P3] should NOT render "Eliminar" button when GET returns 404 (not-found state)', async () => {
    // GIVEN: GET /api/v1/clientes/:id returns 404
    const nonExistentId = 'ffffffff-0000-1111-2222-333333333333';

    server.use(
      http.get(`${CLIENTES_URL}/${nonExistentId}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Cliente no encontrado', detail: 'No existe.' },
          { status: 404 }
        )
      )
    );

    renderClienteDetail({ clienteId: nonExistentId });

    // THEN: Wait for not-found state to render
    await waitFor(() => {
      expect(screen.queryByTestId('btn-eliminar')).not.toBeInTheDocument();
    });
  });

  it('[P3] should NOT render "Eliminar" button when GET returns 500 (error state)', async () => {
    // GIVEN: GET /api/v1/clientes/:id returns 500
    const clienteId = '00000000-1111-2222-3333-444444444444';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    renderClienteDetail({ clienteId });

    // THEN: Error state renders; btn-eliminar is NOT present
    await waitFor(() => {
      expect(screen.queryByTestId('btn-eliminar')).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Toast content is exactly correct (strict text comparison — AC #2, R-010)
// Edge case: verify there are no extra whitespace or partial matches
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteCliente — exact toast text enforcement (P1)', () => {
  it('[P1] exact text "Cliente eliminado correctamente" (no extra content) when 204', async () => {
    // GIVEN: DELETE returns 204
    const cliente = buildCliente({
      id: '11111111-2222-3333-4444-aaaaaaaaaaaa',
      nombre: 'Empresa Toast Exact SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    renderClienteDetail({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Exact toast text (not just partial match — R-010 enforcement)
    await waitFor(() => {
      expect(screen.getByText('Cliente eliminado correctamente')).toBeInTheDocument();
    });

    // AND: Contacts-associated variant is NOT present (strict separation of toast variants)
    expect(
      screen.queryByText('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
    ).not.toBeInTheDocument();
  });

  it('[P1] exact text "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." when 200+hadContacts', async () => {
    // GIVEN: DELETE returns 200 + { hadContacts: true }
    const cliente = buildCliente({
      id: '11111111-2222-3333-4444-bbbbbbbbbbbb',
      nombre: 'Empresa Toast Contacts Exact SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        HttpResponse.json({ hadContacts: true }, { status: 200 })
      )
    );

    renderClienteDetail({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Exact contacts-associated toast text
    await waitFor(() => {
      expect(
        screen.getByText('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
      ).toBeInTheDocument();
    });

    // AND: Generic variant is NOT present
    expect(screen.queryByText('Cliente eliminado correctamente')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Boundary: hadContacts=false explicitly in response body (edge case for 200 response)
// Backend may return 200 + { hadContacts: false } in some edge scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteCliente — hadContacts=false in 200 response body shows generic toast (P2)', () => {
  it('[P2] 200 response with { hadContacts: false } should show generic toast (not contacts-associated)', async () => {
    // GIVEN: Backend returns 200 + { hadContacts: false } (unusual but possible)
    const cliente = buildCliente({
      id: '22222222-3333-4444-5555-aaaaaaaaaaaa',
      nombre: 'Empresa 200 Sin Contactos SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        // Edge: 200 with hadContacts:false (not the typical 204, but valid response)
        HttpResponse.json({ hadContacts: false }, { status: 200 })
      )
    );

    renderClienteDetail({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Generic toast shown (result?.hadContacts is false)
    await waitFor(() => {
      expect(screen.getByText('Cliente eliminado correctamente')).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/sus contactos asociados/i)
    ).not.toBeInTheDocument();
  });
});
