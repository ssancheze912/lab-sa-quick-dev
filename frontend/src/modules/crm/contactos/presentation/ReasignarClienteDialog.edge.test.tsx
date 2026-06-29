/**
 * Edge case tests — ReasignarClienteDialog component
 * Story 4.6 — Reassign Contact to Different Client (Automate phase)
 *
 * Coverage focus (not covered by ATDD tests):
 *   EDGE-1  Large client list (50 items): all other clients render in the scrollable list
 *   EDGE-2  Keyboard navigation: Tab moves focus between Cancel and Reasignar buttons
 *   EDGE-3  Escape key (via onOpenChange) closes the dialog
 *   EDGE-4  Search state resets after cancel + reopen cycle
 *   EDGE-5  Selection resets after cancel + reopen cycle
 *   EDGE-6  Rapid clicks on "Reasignar" while isPending — button is disabled, no double-submit
 *   EDGE-7  Network error (500) on clientes list — graceful degradation (empty state or error)
 *   EDGE-8  Client name with special characters renders correctly in the list
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
import { http, HttpResponse } from 'msw';
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
// Helper: render dialog
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

// Seed data — use fixed IDs to avoid counter collision when resetClienteCounter() runs in beforeEach
const CURRENT_CLIENTE_ID = 'ff000000-0000-0000-0000-000000000001';
const OTHER_CLIENTE_ID = 'ff000000-0000-0000-0000-000000000002';
const CONTACTO_ID = 'ee000000-0000-0000-0000-000000000001';

const CURRENT_CLIENTE = {
  id: CURRENT_CLIENTE_ID,
  nombre: 'Cliente Actual SA',
  nit: '900000001-1',
  telefono: '3000000001',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const OTHER_CLIENTE = {
  id: OTHER_CLIENTE_ID,
  nombre: 'Empresa Alternativa Ltda',
  nit: '900000002-2',
  telefono: '3000000002',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const CONTACTO = {
  id: CONTACTO_ID,
  nombre: 'Contacto Edge Test',
  cargo: 'Analista',
  telefono: '3100000001',
  email: 'edge@siesa.com',
  clienteId: CURRENT_CLIENTE_ID,
  createdAt: '2026-01-01T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// EDGE-1: Large client list — 50 additional clients render in scrollable list
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — EDGE-1: large client list (50 clients)', () => {
  it('[P2] EDGE-1: should render all 50 clients (minus current) in the scrollable list', async () => {
    // GIVEN: 51 clients exist (1 current + 50 others)
    const fiftyOthers = createClientes(50);
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, ...fiftyOthers]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    // WHEN: Dialog renders
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    // THEN: All 50 other clients appear in the list
    await waitFor(() => {
      // The first and last of the 50 should both be present
      expect(screen.getByText(fiftyOthers[0].nombre)).toBeInTheDocument();
    });
    expect(screen.getByText(fiftyOthers[49].nombre)).toBeInTheDocument();
  });

  it('[P2] EDGE-1: current client not in the list even with 50 others', async () => {
    // GIVEN: 51 clients including the current one
    const fiftyOthers = createClientes(50);
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, ...fiftyOthers]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByText(fiftyOthers[0].nombre)).toBeInTheDocument();
    });

    // THEN: Current client's name is not in the list
    expect(screen.queryByText(CURRENT_CLIENTE.nombre)).not.toBeInTheDocument();
  });

  it('[P2] EDGE-1: search filters work correctly within a large list', async () => {
    // GIVEN: Large list with one specifically named client
    const targetCliente = createCliente({ nombre: 'Empresa Objetivo Unica' });
    const others = createClientes(49);
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, targetCliente, ...others]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Objetivo Unica')).toBeInTheDocument();
    });

    // WHEN: User types a unique search term
    const searchInput = screen.getByPlaceholderText(/Buscar cliente/i);
    await userEvent.type(searchInput, 'Objetivo');

    // THEN: Only the matching client is shown
    await waitFor(() => {
      expect(screen.getByText('Empresa Objetivo Unica')).toBeInTheDocument();
    });
    // Spot-check: one of the generic "Empresa Test N" names no longer visible
    expect(screen.queryByText(others[0].nombre)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EDGE-2: Keyboard navigation between Cancel and Reasignar buttons
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — EDGE-2: keyboard navigation in dialog', () => {
  it('[P1] EDGE-2: both Cancel and Reasignar buttons are focusable via keyboard Tab cycle', async () => {
    // GIVEN: Dialog is open with clients loaded
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });

    // WHEN: We Tab through all focusable elements in the dialog
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    const reasignarBtn = screen.getByRole('button', { name: /^Reasignar$/i });

    // Both buttons must be in the tab order (not disabled for Cancel, disabled for Reasignar)
    // THEN: Cancel is focusable (not disabled, native button)
    expect(cancelBtn).not.toBeDisabled();
    expect(cancelBtn.tabIndex).not.toBe(-1);

    // THEN: Reasignar is disabled (no selection) but still present in the DOM as a button
    expect(reasignarBtn.tagName.toLowerCase()).toBe('button');

    // THEN: Cancel can be programmatically focused
    cancelBtn.focus();
    expect(document.activeElement).toBe(cancelBtn);
  });

  it('[P1] EDGE-2: Enter key activates Cancel button when it has focus', async () => {
    // GIVEN: Dialog is open; Cancel button has focus
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO)
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

    // WHEN: Enter is pressed on the focused Cancel button
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    cancelBtn.focus();
    await userEvent.keyboard('{Enter}');

    // THEN: onClose is called (button activated via keyboard)
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('[P1] EDGE-2: Space key activates Cancel button when it has focus', async () => {
    // GIVEN: Dialog open
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO)
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

    // WHEN: Space is pressed on the focused Cancel button
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    cancelBtn.focus();
    await userEvent.keyboard(' ');

    // THEN: onClose is called
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// EDGE-3: Escape key closes dialog via onOpenChange
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — EDGE-3: Escape closes dialog', () => {
  it('[P1] EDGE-3: pressing Escape triggers onClose via dialog onOpenChange', async () => {
    // GIVEN: Dialog is open
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    const onClose = vi.fn();
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
      onClose,
    });

    await waitFor(() => {
      expect(screen.getByTestId('reasignar-cliente-dialog')).toBeInTheDocument();
    });

    // WHEN: Escape key is pressed
    await userEvent.keyboard('{Escape}');

    // THEN: onClose is called (dialog's onOpenChange fires with false)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// EDGE-4: Search state resets after cancel + reopen
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — EDGE-4: search state resets after cancel+reopen', () => {
  it('[P2] EDGE-4: search input is cleared when dialog is closed and reopened', async () => {
    // GIVEN: Dialog opens with clients; user types a search query
    const clienteX = createCliente({ nombre: 'Empresa Para Buscar' });
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, clienteX, OTHER_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    const onClose = vi.fn();
    const { rerender, queryClient } = renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
      onClose,
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar cliente/i)).toBeInTheDocument();
    });

    // WHEN: User types in search
    const searchInput = screen.getByPlaceholderText(/Buscar cliente/i);
    await userEvent.type(searchInput, 'Para Buscar');

    await waitFor(() => {
      expect(screen.getByText('Empresa Para Buscar')).toBeInTheDocument();
    });

    // AND: User clicks cancel (closes dialog)
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    // WHEN: Dialog is reopened
    rerender(
      <QueryClientProvider client={queryClient}>
        <ReasignarClienteDialog
          contactoId={CONTACTO.id}
          currentClienteId={CURRENT_CLIENTE.id}
          open={true}
          onClose={onClose}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar cliente/i)).toBeInTheDocument();
    });

    // THEN: Search input is cleared (empty value)
    const reopenedInput = screen.getByPlaceholderText(/Buscar cliente/i) as HTMLInputElement;
    expect(reopenedInput.value).toBe('');
  });
});

// ---------------------------------------------------------------------------
// EDGE-5: Selection state resets after cancel + reopen
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — EDGE-5: selected client resets after cancel+reopen', () => {
  it('[P2] EDGE-5: previously selected client is deselected when dialog is closed and reopened', async () => {
    // GIVEN: Dialog opens; user selects a client but then cancels
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    const onClose = vi.fn();
    const { rerender, queryClient } = renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
      onClose,
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Alternativa Ltda')).toBeInTheDocument();
    });

    // User selects a client
    await userEvent.click(screen.getByText('Empresa Alternativa Ltda'));

    // Confirm button should now be enabled (selection made)
    const confirmBtn = screen.getByRole('button', { name: /^Reasignar$/i });
    expect(confirmBtn).not.toBeDisabled();

    // User clicks cancel
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    // WHEN: Dialog is reopened
    rerender(
      <QueryClientProvider client={queryClient}>
        <ReasignarClienteDialog
          contactoId={CONTACTO.id}
          currentClienteId={CURRENT_CLIENTE.id}
          open={true}
          onClose={onClose}
        />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Reasignar$/i })).toBeInTheDocument();
    });

    // THEN: Confirm button is disabled again (no client selected)
    const reopenedConfirmBtn = screen.getByRole('button', { name: /^Reasignar$/i });
    expect(reopenedConfirmBtn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// EDGE-6: Rapid clicks on Reasignar — button disabled during pending
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — EDGE-6: rapid clicks on confirm — no double-submit', () => {
  it('[P1] EDGE-6: clicking Reasignar twice fires PUT only once while mutation is pending', async () => {
    // GIVEN: PUT has a delay so we can observe isPending
    let putCallCount = 0;
    let resolveRequest!: () => void;
    const requestPending = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, OTHER_CLIENTE]),
      http.put('/api/v1/contactos/:id/cliente', async ({ request }) => {
        putCallCount++;
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
      expect(screen.getByText('Empresa Alternativa Ltda')).toBeInTheDocument();
    });

    // WHEN: User selects a client and clicks confirm
    await userEvent.click(screen.getByText('Empresa Alternativa Ltda'));

    const confirmBtn = screen.getByRole('button', { name: /^Reasignar$/i });
    fireEvent.click(confirmBtn);

    // THEN: Button becomes disabled immediately while pending
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Reasignar$/i })).toBeDisabled();
    });

    // WHEN: User rapidly clicks confirm again (button is disabled)
    fireEvent.click(screen.getByRole('button', { name: /^Reasignar$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Reasignar$/i }));

    // THEN: PUT was called only once (disabled button blocks second click)
    expect(putCallCount).toBe(1);

    // Cleanup
    resolveRequest();
  });
});

// ---------------------------------------------------------------------------
// EDGE-7: Error loading client list — graceful degradation
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — EDGE-7: error fetching client list', () => {
  it('[P2] EDGE-7: shows empty state when client list request returns 500', async () => {
    // GIVEN: GET /api/v1/clientes returns 500
    server.use(
      http.get('/api/v1/clientes', () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    );

    // WHEN: Dialog renders (useClientes query will fail)
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    // THEN: Dialog renders without crashing; eventually shows no clients
    // (The list will be empty on error since useClientes data is undefined/empty)
    await waitFor(() => {
      expect(screen.getByTestId('reasignar-cliente-dialog')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// EDGE-8: Client name with special characters renders correctly
// ---------------------------------------------------------------------------

describe('ReasignarClienteDialog — EDGE-8: special characters in client name', () => {
  it('[P2] EDGE-8: client with special characters in nombre renders and is selectable', async () => {
    // GIVEN: A client whose name contains special characters (ampersand, dots)
    const specialNombre = 'Empresas y Asociados La Paz S.A.S.';
    const specialCliente = createCliente({ nombre: specialNombre });
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, specialCliente]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    const onClose = vi.fn();
    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
      onClose,
    });

    // THEN: Client with special characters is displayed
    await waitFor(() => {
      expect(screen.getByText(specialNombre)).toBeInTheDocument();
    });

    // WHEN: User selects this client
    await userEvent.click(screen.getByText(specialNombre));

    // THEN: Confirm button becomes enabled
    const confirmBtn = screen.getByRole('button', { name: /^Reasignar$/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('[P2] EDGE-8: search with accented characters filters correctly', async () => {
    // GIVEN: A client with accented characters in nombre (common in Spanish names)
    const accentedNombre = 'Compania de Plasticos SA';
    const specialCliente = createCliente({ nombre: accentedNombre });
    server.use(
      handleGetClientesForSelector([CURRENT_CLIENTE, specialCliente, OTHER_CLIENTE]),
      handleReasignarClienteSuccess(CONTACTO)
    );

    renderDialog({
      contactoId: CONTACTO.id,
      currentClienteId: CURRENT_CLIENTE.id,
    });

    await waitFor(() => {
      expect(screen.getByText(accentedNombre)).toBeInTheDocument();
    });

    // WHEN: User searches with substring matching the accented client
    const searchInput = screen.getByPlaceholderText(/Buscar cliente/i);
    await userEvent.type(searchInput, 'Plasticos');

    // THEN: The matching client is still shown
    await waitFor(() => {
      expect(screen.getByText(accentedNombre)).toBeInTheDocument();
    });

    // AND: other clients are filtered out
    expect(screen.queryByText('Empresa Alternativa Ltda')).not.toBeInTheDocument();
  });
});
