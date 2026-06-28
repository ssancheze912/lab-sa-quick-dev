/**
 * ATDD component tests — Story 2.5: Delete Client (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/clientes/application/useDeleteCliente.ts
 *   - frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts (delete method)
 *   - frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
 *       (btn-eliminar button + AlertDialog + onClienteDeleted prop)
 *
 * Test IDs:
 *   TC-E2-2-5-CMP-P0-1 (P0) — Confirm delete → DELETE called once, invalidateQueries triggered, onClienteDeleted called
 *   TC-E2-2-5-CMP-P1-1 (P1) — Cancel delete → dialog closes, no DELETE called
 *   TC-E2-2-5-CMP-P1-2 (P1) — Delete (no contacts, 204) → toast "Cliente eliminado correctamente"
 *   TC-E2-2-5-CMP-P2-1 (P2) — Delete (with contacts, 200 hadContacts:true) → toast with "Sus contactos asociados..."
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'sonner';

import { buildCliente, resetClienteCounter } from './clienteFactory';

// ClienteDetailView with delete support does NOT exist yet — import will fail (RED phase)
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
// Test helper: render ClienteDetailView with an authenticated client loaded
// The GET handler must be registered BEFORE render (network-first pattern).
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteDetailWithDeleteSupport(props: {
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
// AC #1 — Confirmation dialog appears with correct content
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — "Eliminar" button triggers confirmation dialog (AC #1)', () => {
  it('should show "Eliminar" button (data-testid="btn-eliminar") in the data-loaded state', async () => {
    // GIVEN: A client is available via the API (network-first: intercept BEFORE render)
    const cliente = buildCliente({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      nombre: 'Empresa Para Eliminar SA',
    });

    // CRITICAL: Intercept GET BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    // WHEN: ClienteDetailView is rendered with a valid clienteId
    renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    // THEN: "Eliminar" button is visible in the data-loaded state
    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });
  });

  it('TC-E2-2-5-CMP-P0-1 (partial): clicking "Eliminar" opens the confirmation dialog with "¿Eliminar este cliente?" title', async () => {
    // GIVEN: A client is loaded (network-first: intercept BEFORE render)
    const cliente = buildCliente({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      nombre: 'Empresa Dialog Test SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    const { onClienteDeleted } = renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    // AND: Client data has loaded (btn-eliminar visible)
    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User clicks "Eliminar"
    await userEvent.click(screen.getByTestId('btn-eliminar'));

    // THEN: Confirmation dialog appears with exact title text (AC #1)
    await waitFor(() => {
      expect(screen.getByText('¿Eliminar este cliente?')).toBeInTheDocument();
    });

    // AND: No delete was triggered yet (just opening the dialog)
    expect(onClienteDeleted).not.toHaveBeenCalled();
  });

  it('should show "Confirmar" and "Cancelar" buttons in the dialog (AC #1)', async () => {
    // GIVEN: A client is loaded (network-first: intercept BEFORE render)
    const cliente = buildCliente({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      nombre: 'Empresa Buttons Test SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: Dialog is opened
    await userEvent.click(screen.getByTestId('btn-eliminar'));

    // THEN: Dialog has both required buttons (AC #1)
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
      expect(screen.getByTestId('btn-cancel-delete')).toBeInTheDocument();
    });

    // AND: "Confirmar" button label is present
    expect(screen.getByTestId('btn-confirm-delete')).toHaveTextContent(/confirmar/i);

    // AND: "Cancelar" button label is present
    expect(screen.getByTestId('btn-cancel-delete')).toHaveTextContent(/cancelar/i);
  });

  it('should NOT show btn-eliminar when clienteId is undefined (empty/placeholder state)', async () => {
    // GIVEN: No client selected — clienteId is undefined
    // No network handler needed — no fetch should occur
    renderClienteDetailWithDeleteSupport({ clienteId: undefined as unknown as string });

    // THEN: btn-eliminar is NOT present in the placeholder state
    expect(screen.queryByTestId('btn-eliminar')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-5-CMP-P1-1 (P1) — Cancel delete → dialog closes, no DELETE called
// AC #3 — clicking "Cancelar" closes dialog without API call
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — cancel delete keeps client unchanged (AC #3, P1)', () => {
  it('TC-E2-2-5-CMP-P1-1: clicking "Cancelar" closes dialog and makes no DELETE API call', async () => {
    // GIVEN: A client is loaded (network-first: intercept BEFORE render)
    const cliente = buildCliente({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      nombre: 'Empresa Cancel Test SA',
    });

    // CRITICAL: Intercept GET BEFORE render AND track if DELETE is called
    let deleteCalled = false;
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { onClienteDeleted } = renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    // AND: Client data is loaded
    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User opens the confirmation dialog
    await userEvent.click(screen.getByTestId('btn-eliminar'));

    await waitFor(() => {
      expect(screen.getByTestId('btn-cancel-delete')).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('btn-cancel-delete'));

    // THEN: Dialog closes (btn-cancel-delete is no longer in the DOM)
    await waitFor(() => {
      expect(screen.queryByTestId('btn-cancel-delete')).not.toBeInTheDocument();
    });

    // AND: DELETE API was NEVER called (AC #3)
    expect(deleteCalled).toBe(false);

    // AND: onClienteDeleted was NEVER called
    expect(onClienteDeleted).not.toHaveBeenCalled();
  });

  it('client remains in the system after clicking "Cancelar" — no mutation triggered', async () => {
    // GIVEN: A client is loaded (network-first: intercept BEFORE render)
    const cliente = buildCliente({
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      nombre: 'Empresa No Borrar SA',
    });

    let deleteCallCount = 0;
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () => {
        deleteCallCount += 1;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User opens dialog then cancels
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-cancel-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-cancel-delete'));

    // THEN: DELETE was never called
    expect(deleteCallCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-5-CMP-P0-1 (P0) — Confirm delete → DELETE called once, invalidateQueries triggered,
// onClienteDeleted called (AC #2, risk R-002)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — confirm delete triggers mutation (AC #2, P0)', () => {
  it('TC-E2-2-5-CMP-P0-1: clicking "Confirmar" calls DELETE API exactly once and calls onClienteDeleted', async () => {
    // GIVEN: A client is loaded (network-first: intercept BEFORE render)
    const cliente = buildCliente({
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      nombre: 'Empresa A Eliminar SA',
    });

    let deleteCallCount = 0;
    // CRITICAL: Intercept GET AND DELETE BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () => {
        deleteCallCount += 1;
        // 204 = success, no contacts
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { onClienteDeleted } = renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    // AND: Client data is loaded
    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User opens dialog
    await userEvent.click(screen.getByTestId('btn-eliminar'));

    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });

    // WHEN: User confirms deletion
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: DELETE API was called exactly once
    await waitFor(() => {
      expect(deleteCallCount).toBe(1);
    });

    // AND: onClienteDeleted callback was called (navigates to empty state — AC #2)
    await waitFor(() => {
      expect(onClienteDeleted).toHaveBeenCalledTimes(1);
    });
  });

  it('should close the dialog after confirming deletion', async () => {
    // GIVEN: A client is loaded (network-first: intercept BEFORE render)
    const cliente = buildCliente({
      id: '11111111-2222-3333-4444-555555555555',
      nombre: 'Empresa Dialog Close Test SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });

    // WHEN: User confirms
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Dialog closes (Confirmar button removed from DOM)
    await waitFor(() => {
      expect(screen.queryByTestId('btn-confirm-delete')).not.toBeInTheDocument();
    });
  });

  it('should disable "Confirmar" button while DELETE mutation is pending (isPending guard)', async () => {
    // GIVEN: A client is loaded (network-first: intercept BEFORE render)
    // DELETE handler is delayed to simulate in-flight mutation
    const cliente = buildCliente({
      id: '22222222-3333-4444-5555-666666666666',
      nombre: 'Empresa Pending Delete SA',
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

    renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });

    // WHEN: User clicks "Confirmar" (mutation starts, is pending)
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: "Confirmar" button is disabled while DELETE is in-flight
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeDisabled();
    });

    // Cleanup: resolve the pending request
    resolveDelete();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-5-CMP-P1-2 (P1) — Delete (no contacts, 204) → toast "Cliente eliminado correctamente"
// AC #2, risk R-010
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — delete without contacts shows correct toast (AC #2, R-010, P1)', () => {
  it('TC-E2-2-5-CMP-P1-2: should show toast "Cliente eliminado correctamente" when DELETE returns 204 (no contacts)', async () => {
    // GIVEN: A client is loaded, DELETE returns 204 (no contacts) (network-first)
    const cliente = buildCliente({
      id: '33333333-4444-5555-6666-777777777777',
      nombre: 'Empresa Sin Contactos SA',
    });

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        // 204 No Content = client deleted, no contacts were associated
        new HttpResponse(null, { status: 204 })
      )
    );

    renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User opens dialog and confirms
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Toast "Cliente eliminado correctamente" appears (exact text — AC #2, R-010 enforcement)
    await waitFor(() => {
      expect(screen.getByText('Cliente eliminado correctamente')).toBeInTheDocument();
    });
  });

  it('should NOT show contacts-associated toast when DELETE returns 204', async () => {
    // GIVEN: DELETE returns 204 (hadContacts: false path)
    const cliente = buildCliente({
      id: '44444444-5555-6666-7777-888888888888',
      nombre: 'Empresa Sin Contactos 2 SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: The contacts-associated toast variant is NOT shown
    await waitFor(() => {
      expect(screen.getByText('Cliente eliminado correctamente')).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/sus contactos asociados quedaron sin cliente asignado/i)
    ).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-5-CMP-P2-1 (P2) — Delete (with contacts) → toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado."
// AC #4
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — delete with contacts shows contact-associated toast (AC #4, P2)', () => {
  it('TC-E2-2-5-CMP-P2-1: should show contacts-associated toast when DELETE returns 200 + { hadContacts: true }', async () => {
    // GIVEN: A client with contacts is loaded, DELETE returns 200 + { hadContacts: true }
    // (network-first: intercept BEFORE render)
    const cliente = buildCliente({
      id: '55555555-6666-7777-8888-999999999999',
      nombre: 'Empresa Con Contactos SA',
    });

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        // 200 OK + { hadContacts: true } = client deleted, contacts are now clienteId=null (AC #4)
        HttpResponse.json({ hadContacts: true }, { status: 200 })
      )
    );

    renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User opens dialog and confirms
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Toast with contacts-associated message appears (AC #4, exact text enforcement)
    await waitFor(() => {
      expect(
        screen.getByText('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
      ).toBeInTheDocument();
    });
  });

  it('should NOT show generic toast when DELETE returns 200 + { hadContacts: true }', async () => {
    // GIVEN: DELETE returns 200 + hadContacts:true
    const cliente = buildCliente({
      id: '66666666-7777-8888-9999-aaaaaaaaaaaa',
      nombre: 'Empresa Con Contactos 2 SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        HttpResponse.json({ hadContacts: true }, { status: 200 })
      )
    );

    renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: The generic toast "Cliente eliminado correctamente" is NOT shown
    await waitFor(() => {
      expect(
        screen.getByText('Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado.')
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Cliente eliminado correctamente')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error handling — DELETE fails → toast error (AC #2)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — delete error handling', () => {
  it('should show error toast "No se pudo eliminar el cliente." when DELETE fails', async () => {
    // GIVEN: A client is loaded but DELETE returns 500
    const cliente = buildCliente({
      id: '77777777-8888-9999-aaaa-bbbbbbbbbbbb',
      nombre: 'Empresa Error Delete SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

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
      expect(
        screen.getByText(/no se pudo eliminar el cliente/i)
      ).toBeInTheDocument();
    });
  });

  it('should NOT call onClienteDeleted when DELETE fails with 500', async () => {
    // GIVEN: DELETE returns 500
    const cliente = buildCliente({
      id: '88888888-9999-aaaa-bbbb-cccccccccccc',
      nombre: 'Empresa Error No Navigate SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.delete(`${CLIENTES_URL}/${cliente.id}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    const { onClienteDeleted } = renderClienteDetailWithDeleteSupport({ clienteId: cliente.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: onClienteDeleted is NOT called (navigation only happens on success)
    await waitFor(() => {
      expect(screen.getByText(/no se pudo eliminar el cliente/i)).toBeInTheDocument();
    });
    expect(onClienteDeleted).not.toHaveBeenCalled();
  });
});
