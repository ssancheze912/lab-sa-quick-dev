/**
 * ATDD component tests — Story 3.5: Delete Contact (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/contactos/application/useDeleteContacto.ts
 *   - frontend/src/modules/crm/contactos/infrastructure/contactoApiRepository.ts (delete method)
 *   - frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx
 *       (btn-eliminar button + AlertDialog + onContactoDeleted prop)
 *
 * Test IDs:
 *   TC-E3-3-5-CMP-1 (P0) — Click "Eliminar" → dialog with "¿Eliminar este contacto?", "Confirmar", "Cancelar"
 *   TC-E3-3-5-CMP-2 (P1) — Click "Cancelar" → dialog closes, no DELETE called
 *   TC-E3-3-5-CMP-3 (P0) — Click "Confirmar" → DELETE called once, invalidateQueries triggered, onContactoDeleted called
 *   TC-E3-3-5-CMP-4 (P2) — Click "Confirmar" → toast "Contacto eliminado correctamente"
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

import { buildContacto, resetContactoCounter } from './contactoFactory';

// ContactoDetailView with delete support does NOT exist yet — import will fail (RED phase)
import { ContactoDetailView } from '../presentation/ContactoDetailView';

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
const CONTACTOS_URL = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup (network-first: handlers registered BEFORE render)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetContactoCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ContactoDetailView with an authenticated contact loaded.
// The GET handler must be registered BEFORE render (network-first pattern).
// ─────────────────────────────────────────────────────────────────────────────

function renderContactoDetailWithDeleteSupport(props: {
  contactoId: string;
  onContactoDeleted?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const onContactoDeleted = props.onContactoDeleted ?? vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ContactoDetailView
        contactoId={props.contactoId}
        onContactoDeleted={onContactoDeleted}
      />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onContactoDeleted };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-5-CMP-1 (P0) — Confirmation dialog appears with correct content (AC #1)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — "Eliminar" button triggers confirmation dialog (AC #1, P0)', () => {
  it('should show "Eliminar" button (data-testid="btn-eliminar") in the data-loaded state', async () => {
    // GIVEN: A contact is available via the API (network-first: intercept BEFORE render)
    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      nombre: 'Contacto Para Eliminar',
    });

    // CRITICAL: Intercept GET BEFORE render
    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: ContactoDetailView is rendered with a valid contactoId
    renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

    // THEN: "Eliminar" button is visible in the data-loaded state
    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });
  });

  it('TC-E3-3-5-CMP-1: clicking "Eliminar" opens the confirmation dialog with "¿Eliminar este contacto?" title', async () => {
    // GIVEN: A contact is loaded (network-first: intercept BEFORE render)
    const contacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      nombre: 'Contacto Dialog Test',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    const { onContactoDeleted } = renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

    // AND: Contact data has loaded (btn-eliminar visible)
    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User clicks "Eliminar"
    await userEvent.click(screen.getByTestId('btn-eliminar'));

    // THEN: Confirmation dialog appears with exact title text (AC #1)
    await waitFor(() => {
      expect(screen.getByText('¿Eliminar este contacto?')).toBeInTheDocument();
    });

    // AND: No delete was triggered yet (just opening the dialog)
    expect(onContactoDeleted).not.toHaveBeenCalled();
  });

  it('should show "Confirmar" and "Cancelar" buttons in the dialog (AC #1)', async () => {
    // GIVEN: A contact is loaded (network-first: intercept BEFORE render)
    const contacto = buildContacto({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      nombre: 'Contacto Buttons Test',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

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

  it('should NOT show btn-eliminar when contactoId is undefined (empty/placeholder state)', async () => {
    // GIVEN: No contact selected — contactoId is undefined
    // No network handler needed — no fetch should occur
    renderContactoDetailWithDeleteSupport({ contactoId: undefined as unknown as string });

    // THEN: btn-eliminar is NOT present in the placeholder state
    expect(screen.queryByTestId('btn-eliminar')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-5-CMP-2 (P1) — Cancel delete → dialog closes, no DELETE called (AC #3)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — cancel delete keeps contact unchanged (AC #3, P1)', () => {
  it('TC-E3-3-5-CMP-2: clicking "Cancelar" closes dialog and makes no DELETE API call', async () => {
    // GIVEN: A contact is loaded (network-first: intercept BEFORE render)
    const contacto = buildContacto({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      nombre: 'Contacto Cancel Test',
    });

    // CRITICAL: Intercept GET AND track if DELETE is called BEFORE render
    let deleteCalled = false;
    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { onContactoDeleted } = renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

    // AND: Contact data is loaded
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

    // AND: onContactoDeleted was NEVER called
    expect(onContactoDeleted).not.toHaveBeenCalled();
  });

  it('contact remains in the system after clicking "Cancelar" — no mutation triggered', async () => {
    // GIVEN: A contact is loaded (network-first: intercept BEFORE render)
    const contacto = buildContacto({
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      nombre: 'Contacto No Borrar',
    });

    let deleteCallCount = 0;
    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () => {
        deleteCallCount += 1;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

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
// TC-E3-3-5-CMP-3 (P0) — Confirm delete → DELETE called once, invalidateQueries triggered,
// onContactoDeleted called (AC #2, risk R-002)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — confirm delete triggers mutation (AC #2, P0)', () => {
  it('TC-E3-3-5-CMP-3: clicking "Confirmar" calls DELETE API exactly once and calls onContactoDeleted', async () => {
    // GIVEN: A contact is loaded (network-first: intercept BEFORE render)
    const contacto = buildContacto({
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      nombre: 'Contacto A Eliminar',
    });

    let deleteCallCount = 0;
    // CRITICAL: Intercept GET AND DELETE BEFORE render
    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () => {
        deleteCallCount += 1;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const { onContactoDeleted } = renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

    // AND: Contact data is loaded
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

    // AND: onContactoDeleted callback was called (navigates to /contactos — AC #2)
    await waitFor(() => {
      expect(onContactoDeleted).toHaveBeenCalledTimes(1);
    });
  });

  it('should close the dialog after confirming deletion', async () => {
    // GIVEN: A contact is loaded (network-first: intercept BEFORE render)
    const contacto = buildContacto({
      id: '11111111-2222-3333-4444-555555555555',
      nombre: 'Contacto Dialog Close Test',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

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
    // GIVEN: A contact is loaded (network-first: intercept BEFORE render)
    // DELETE handler is delayed to simulate in-flight mutation
    const contacto = buildContacto({
      id: '22222222-3333-4444-5555-666666666666',
      nombre: 'Contacto Pending Delete',
    });

    let resolveDelete!: () => void;
    const delayedDelete = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, async () => {
        await delayedDelete;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

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
// TC-E3-3-5-CMP-4 (P2) — Confirm delete → toast "Contacto eliminado correctamente" (AC #2, R-010)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — delete shows correct toast (AC #2, R-010, P2)', () => {
  it('TC-E3-3-5-CMP-4: should show toast "Contacto eliminado correctamente" when DELETE returns 204', async () => {
    // GIVEN: A contact is loaded, DELETE returns 204 (network-first)
    const contacto = buildContacto({
      id: '33333333-4444-5555-6666-777777777777',
      nombre: 'Contacto Toast Test',
    });

    // CRITICAL: Intercept BEFORE render
    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User opens dialog and confirms
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Toast "Contacto eliminado correctamente" appears (exact text — R-010 enforcement)
    await waitFor(() => {
      expect(screen.getByText('Contacto eliminado correctamente')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Error handling — DELETE fails → toast error (AC #2)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoDetailView — delete error handling', () => {
  it('should show error toast when DELETE fails with 500', async () => {
    // GIVEN: A contact is loaded but DELETE returns 500
    const contacto = buildContacto({
      id: '44444444-5555-6666-7777-888888888888',
      nombre: 'Contacto Error Delete',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

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
        screen.getByText(/no se pudo eliminar el contacto/i)
      ).toBeInTheDocument();
    });
  });

  it('should NOT call onContactoDeleted when DELETE fails with 500', async () => {
    // GIVEN: DELETE returns 500
    const contacto = buildContacto({
      id: '55555555-6666-7777-8888-999999999999',
      nombre: 'Contacto Error No Navigate',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    const { onContactoDeleted } = renderContactoDetailWithDeleteSupport({ contactoId: contacto.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: onContactoDeleted is NOT called (navigation only happens on success)
    await waitFor(() => {
      expect(screen.getByText(/no se pudo eliminar el contacto/i)).toBeInTheDocument();
    });
    expect(onContactoDeleted).not.toHaveBeenCalled();
  });
});
