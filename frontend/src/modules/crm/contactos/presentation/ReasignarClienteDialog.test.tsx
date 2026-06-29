/**
 * Component tests — ReasignarClienteDialog
 * Story 4.6 — Reassign Contact to Different Client (ATDD RED phase)
 *
 * These tests are in RED phase — ReasignarClienteDialog.tsx does not exist yet.
 * Expected failure: "Cannot find module '../ReasignarClienteDialog'"
 *
 * Acceptance Criteria covered:
 *   AC #2  Dialog lists all available clients except the currently assigned one
 *   AC #3  Selecting a different client and confirming triggers PUT with correct body
 *   AC #6  Clicking "Cancelar" closes dialog without API call
 *   AC #7  Confirm button is disabled while mutation is pending
 *   AC #8  Error toast shown on failure, dialog remains open
 *   AC #10 Empty state "No hay otros clientes disponibles" when no other clients
 *   AC #11 Keyboard accessible — confirm button is a <button> element
 *
 * Test IDs:
 *   TC-1  Dialog renders client list excluding the current client (AC #2)
 *   TC-2  Searching by name filters the client list (AC #2)
 *   TC-3  "Reasignar" button is disabled when no client is selected (AC #7)
 *   TC-4  Selecting a client and clicking "Reasignar" triggers mutation and closes dialog (AC #3)
 *   TC-5  Clicking "Cancelar" closes dialog without API call (AC #6)
 *   TC-6  Empty state "No hay otros clientes disponibles" when all clients are filtered out (AC #10)
 *   TC-7  Confirm button is disabled while mutation is pending (AC #7)
 *   TC-8  Error toast shown on failure and dialog stays open (AC #8)
 *   TC-9  Confirm button is a <button> element (keyboard-accessible, WCAG 2.1 AA) (AC #11)
 *
 * Stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { setupServer } from 'msw/node';
import {
  createCliente,
  createClientes,
  resetClienteCounter,
} from '../../../../test/factories/cliente.factory';
import { createContacto, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import {
  handleReasignarClienteSuccess,
  handleReasignarClienteServerError,
  handleGetClientesForSelector,
  handleGetClientesForSelectorEmpty,
} from '../../../../test/msw/handlers/contactos-reasignar-cliente.handlers';
// RED: this module does not exist yet — import will fail until Task 4 is implemented
import { ReasignarClienteDialog } from './ReasignarClienteDialog';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetClienteCounter();
  resetContactoCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: render ReasignarClienteDialog with required providers
// ---------------------------------------------------------------------------

interface RenderDialogProps {
  contactoId: string;
  currentClienteId: string;
  open?: boolean;
  onClose?: () => void;
}

function renderDialog({
  contactoId,
  currentClienteId,
  open = true,
  onClose = vi.fn(),
}: RenderDialogProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    onClose,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ReasignarClienteDialog
          contactoId={contactoId}
          currentClienteId={currentClienteId}
          open={open}
          onClose={onClose}
        />
      </QueryClientProvider>
    ),
  };
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const CURRENT_CLIENTE = createCliente({ nombre: 'Cliente Actual SA' });
const OTHER_CLIENTE_1 = createCliente({ nombre: 'Empresa Nueva Ltda' });
const OTHER_CLIENTE_2 = createCliente({ nombre: 'Corporacion ABC' });
const CONTACTO = createContacto({ clienteId: CURRENT_CLIENTE.id });

// ---------------------------------------------------------------------------
// TC-1: Dialog lists clients excluding the current one (AC #2)
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — TC-1: client list excludes current client', () => {
  it('TC-1: should render available clients excluding the currently assigned one', async () => {
    // GIVEN: Three clients exist; one is the current client of this contact
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1, OTHER_CLIENTE_2]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    // WHEN: ReasignarClienteDialog is rendered for a contact with currentClienteId
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    // THEN: The other two clients appear in the selector list
    await waitFor(() => {
      expect(screen.getByText('Empresa Nueva Ltda')).toBeInTheDocument();
    });
    expect(screen.getByText('Corporacion ABC')).toBeInTheDocument();
  });

  it('TC-1: should NOT show the currently assigned client in the selector', async () => {
    // GIVEN: Three clients exist; one is the current client
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1, OTHER_CLIENTE_2]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    // WHEN: Dialog renders
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Nueva Ltda')).toBeInTheDocument();
    });

    // THEN: The current client is NOT shown in the list
    expect(screen.queryByText('Cliente Actual SA')).not.toBeInTheDocument();
  });

  it('TC-1: should render [data-testid="reasignar-cliente-dialog"]', async () => {
    // GIVEN: Clients loaded
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    // WHEN: Dialog opens
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    // THEN: Dialog container is present with the expected data-testid
    await waitFor(() => {
      expect(screen.getByTestId('reasignar-cliente-dialog')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-2: Search filter by name (AC #2)
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — TC-2: search filter by name', () => {
  it('TC-2: should filter the client list when user types in the search input', async () => {
    // GIVEN: Multiple clients loaded; search input is rendered
    const clienteA = createCliente({ nombre: 'Siesa Colombia SAS' });
    const clienteB = createCliente({ nombre: 'TechCorp Bogota' });
    const clienteC = createCliente({ nombre: 'Grupo Industrial Norte' });

    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, clienteA, clienteB, clienteC]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByText('Siesa Colombia SAS')).toBeInTheDocument();
    });

    // WHEN: User types in the search input
    const searchInput = screen.getByPlaceholderText(/Buscar cliente/i);
    await userEvent.type(searchInput, 'Siesa');

    // THEN: Only the matching client is shown
    await waitFor(() => {
      expect(screen.getByText('Siesa Colombia SAS')).toBeInTheDocument();
    });
    expect(screen.queryByText('TechCorp Bogota')).not.toBeInTheDocument();
    expect(screen.queryByText('Grupo Industrial Norte')).not.toBeInTheDocument();
  });

  it('TC-2: should be case-insensitive when filtering by name', async () => {
    // GIVEN: Clients loaded
    const clienteX = createCliente({ nombre: 'Empresa Global SA' });
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, clienteX]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Global SA')).toBeInTheDocument();
    });

    // WHEN: User searches in lowercase
    const searchInput = screen.getByPlaceholderText(/Buscar cliente/i);
    await userEvent.type(searchInput, 'empresa global');

    // THEN: The client is still visible (case-insensitive match)
    await waitFor(() => {
      expect(screen.getByText('Empresa Global SA')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-3: "Reasignar" button is disabled when no client selected (AC #7)
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — TC-3: confirm button disabled with no selection', () => {
  it('TC-3: should render "Reasignar" confirm button as disabled when no client is selected', async () => {
    // GIVEN: Clients are loaded; no client has been selected yet
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    // WHEN: Dialog renders (user has not selected any client yet)
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Nueva Ltda')).toBeInTheDocument();
    });

    // THEN: The "Reasignar" confirm button is disabled
    const confirmBtn = screen.getByRole('button', { name: /^Reasignar$/i });
    expect(confirmBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// TC-4: Selecting a client and confirming triggers mutation and closes dialog (AC #3)
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — TC-4: select client and confirm triggers mutation', () => {
  it('TC-4: should call mutation and close dialog when user selects a client and confirms', async () => {
    // GIVEN: Clients loaded; PUT will succeed
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    const onClose = vi.fn();
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
      onClose,
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Nueva Ltda')).toBeInTheDocument();
    });

    // WHEN: User clicks on a client in the list to select it
    await userEvent.click(screen.getByText('Empresa Nueva Ltda'));

    // AND: User clicks the "Reasignar" confirm button
    const confirmBtn = screen.getByRole('button', { name: /^Reasignar$/i });
    expect(confirmBtn).not.toBeDisabled();
    await userEvent.click(confirmBtn);

    // THEN: The dialog is closed after successful mutation
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// TC-5: Clicking "Cancelar" closes dialog without API call (AC #6)
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — TC-5: cancel does not trigger API call', () => {
  it('TC-5: should close dialog without calling PUT when user clicks "Cancelar"', async () => {
    // GIVEN: Clients loaded; no API call should be made
    let putCallCount = 0;
    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1]),
      http.put('/api/v1/contactos/:id/cliente', () => {
        putCallCount++;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    const onClose = vi.fn();
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
      onClose,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    // THEN: onClose is called
    expect(onClose).toHaveBeenCalledTimes(1);

    // THEN: No PUT call was made
    expect(putCallCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TC-6: Empty state when no other clients are available (AC #10)
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — TC-6: empty state when no other clients', () => {
  it('TC-6: should show "No hay otros clientes disponibles" when the only existing client is the current one', async () => {
    // GIVEN: Only the current client exists — no other clients to reassign to
    server.use(handleGetClientesForSelector([CURRENT_CLIENTE]));

    // WHEN: Dialog renders
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    // THEN: Empty state message is shown
    await waitFor(() => {
      expect(
        screen.getByText('No hay otros clientes disponibles')
      ).toBeInTheDocument();
    });
  });

  it('TC-6: should show empty state when the client list is empty', async () => {
    // GIVEN: No clients exist in the system
    server.use(handleGetClientesForSelectorEmpty());

    // WHEN: Dialog renders
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    // THEN: Empty state message is shown
    await waitFor(() => {
      expect(
        screen.getByText('No hay otros clientes disponibles')
      ).toBeInTheDocument();
    });
  });

  it('TC-6: should show empty state after search produces no matches', async () => {
    // GIVEN: Clients loaded
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Nueva Ltda')).toBeInTheDocument();
    });

    // WHEN: User types a search that matches nothing
    const searchInput = screen.getByPlaceholderText(/Buscar cliente/i);
    await userEvent.type(searchInput, 'ZZZZZ_NO_MATCH');

    // THEN: Empty state message is shown
    await waitFor(() => {
      expect(
        screen.getByText('No hay otros clientes disponibles')
      ).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-7: Confirm button disabled while mutation is pending (AC #7)
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — TC-7: confirm button disabled while pending', () => {
  it('TC-7: should disable the "Reasignar" button while mutation is in flight', async () => {
    // GIVEN: PUT returns 200 after a delay
    let resolveRequest!: () => void;
    const requestPending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1]),
      http.put('/api/v1/contactos/:id/cliente', async ({ request }) => {
        await requestPending;
        const body = (await request.json()) as Record<string, string | null>;
        return HttpResponse.json(
          { ...CONTACTO, clienteId: body.clienteId },
          { status: 200 }
        );
      })
    );

    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Nueva Ltda')).toBeInTheDocument();
    });

    // Select a client and click confirm
    await userEvent.click(screen.getByText('Empresa Nueva Ltda'));

    const confirmBtn = screen.getByRole('button', { name: /^Reasignar$/i });
    expect(confirmBtn).not.toBeDisabled();

    // WHEN: Confirm is clicked (mutation starts)
    fireEvent.click(confirmBtn);

    // THEN: Confirm button becomes disabled while pending
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Reasignar$/i })).toBeDisabled();
    });

    // Cleanup
    resolveRequest();
  });
});

// ---------------------------------------------------------------------------
// TC-8: Error toast on failure, dialog stays open (AC #8)
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — TC-8: error toast and dialog stays open on failure', () => {
  it('TC-8: should show error toast and keep dialog open when PUT returns 500', async () => {
    // GIVEN: PUT returns 500
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1]),
      handleReasignarClienteServerError()
    );

    const onClose = vi.fn();
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
      onClose,
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Nueva Ltda')).toBeInTheDocument();
    });

    // WHEN: User selects a client and confirms
    await userEvent.click(screen.getByText('Empresa Nueva Ltda'));
    await userEvent.click(screen.getByRole('button', { name: /^Reasignar$/i }));

    // THEN: Error toast with Spanish message is shown
    await waitFor(() => {
      expect(
        screen.getByText(/No se pudo reasignar el contacto/i)
      ).toBeInTheDocument();
    });

    // THEN: Dialog is NOT closed — onClose not called
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// TC-9: Confirm button is a <button> element (keyboard-accessible) (AC #11)
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — TC-9: confirm button is keyboard-accessible', () => {
  it('TC-9: should render the confirm button as a native <button> element', async () => {
    // GIVEN: Clients loaded
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    // WHEN: Dialog renders
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Reasignar$/i })).toBeInTheDocument();
    });

    // THEN: The confirm element is a native <button> (natively focusable, Enter/Space activatable)
    const confirmBtn = screen.getByRole('button', { name: /^Reasignar$/i });
    expect(confirmBtn.tagName.toLowerCase()).toBe('button');
  });

  it('TC-9: should render the cancel button as a native <button> element', async () => {
    // GIVEN: Clients loaded
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE_1]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    // WHEN: Dialog renders
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });

    // THEN: Cancel is also a native <button>
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    expect(cancelBtn.tagName.toLowerCase()).toBe('button');
  });
});
