/**
 * Component tests — ClienteDetailView delete flow
 * Story 2.5 — Delete Client (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E2-P0-06  Confirmation dialog appears, "Confirmar" triggers DELETE, toast shown,
 *                client removed from list, right panel returns to empty/default state.
 *   TC-E2-P1-10  "Cancelar" closes dialog, DELETE NOT triggered, client still visible.
 *   TC-E2-P1-11  Client with associated contacts: orphan-contact toast shown after deletion.
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failures:
 *   - data-testid="cliente-detail-delete-button" does not exist yet
 *   - data-testid="cliente-detail-delete-dialog" does not exist yet
 *   - data-testid="cliente-detail-delete-confirm" does not exist yet
 *   - data-testid="cliente-detail-delete-cancel" does not exist yet
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import React from 'react';
import {
  handleDeleteClienteSuccess,
} from '../../../../test/msw/handlers/clientes-delete.handlers';
import { handleGetClientesSuccess } from '../../../../test/msw/handlers/clientes.handlers';
import {
  handleGetClienteByIdSuccess,
  handleGetClienteByIdNotFound,
} from '../../../../test/msw/handlers/clientes-detail.handlers';
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { ClienteDetailView } from './ClienteDetailView';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetClienteCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: render ClienteDetailView with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderClienteDetailView(clienteId: string | null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={clienteId} />
      </QueryClientProvider>
    ),
  };
}

const KNOWN_CLIENTE = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Delta SA',
  nit: '888888888-8',
  telefono: '3219876543',
  ciudad: 'Medellín',
  createdAt: '2026-01-01T00:00:00Z',
};

const KNOWN_CLIENTE_WITH_CONTACTS = {
  ...KNOWN_CLIENTE,
  id: '00000000-0000-0000-0000-000000000002',
  nombre: 'Empresa Con Contactos',
  contactCount: 3,
};

// ---------------------------------------------------------------------------
// TC-E2-P0-06: Confirmation dialog appears and deletion flow completes
// ---------------------------------------------------------------------------

describe('ClienteDetailView — delete button opens confirmation dialog', () => {
  it('[P0] TC-E2-P0-06: should show "Eliminar" button in the detail panel when a client is loaded', async () => {
    // GIVEN: MSW returns a valid client
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    // WHEN: ClienteDetailView renders with a valid clienteId
    renderClienteDetailView(KNOWN_CLIENTE.id);

    // THEN: "Eliminar" button is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-button')).toBeInTheDocument();
    });
  });

  it('[P0] TC-E2-P0-06: should open confirmation dialog with "¿Eliminar este cliente?" when "Eliminar" is clicked', async () => {
    // GIVEN: A valid client is loaded in the detail view
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // WHEN: User clicks "Eliminar"
    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    // THEN: Confirmation dialog is visible with the correct title
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-dialog')).toBeInTheDocument();
    });
    expect(screen.getByText(/¿Eliminar este cliente\?/i)).toBeInTheDocument();
  });

  it('[P0] TC-E2-P0-06: should show "Confirmar" and "Cancelar" buttons in the confirmation dialog', async () => {
    // GIVEN: A valid client is loaded and "Eliminar" is clicked
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    // THEN: Both "Confirmar" and "Cancelar" buttons are present in the dialog
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
      expect(screen.getByTestId('cliente-detail-delete-cancel')).toBeInTheDocument();
    });
  });

  it('[P0] TC-E2-P0-06: should call DELETE with correct client ID when "Confirmar" is clicked', async () => {
    // GIVEN: DELETE handler captures the request, client is loaded
    let capturedDeleteId: string | null = null;
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE]),
      http.delete('/api/v1/clientes/:clienteId', ({ params }) => {
        capturedDeleteId = params.clienteId as string;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User clicks "Confirmar"
    fireEvent.click(screen.getByTestId('cliente-detail-delete-confirm'));

    // THEN: DELETE was called with the correct client ID
    await waitFor(() => {
      expect(capturedDeleteId).toBe(KNOWN_CLIENTE.id);
    });
  });

  it('[P0] TC-E2-P0-06: should show toast "Cliente eliminado correctamente" after successful deletion', async () => {
    // GIVEN: DELETE returns 204, client without associated contacts
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE]),
      handleDeleteClienteSuccess()
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms deletion
    fireEvent.click(screen.getByTestId('cliente-detail-delete-confirm'));

    // THEN: Success toast with correct Spanish message is shown
    await waitFor(() => {
      expect(
        screen.getByText(/Cliente eliminado correctamente/i)
      ).toBeInTheDocument();
    });
  });

  it('[P0] TC-E2-P0-06: should return right panel to empty/default state after deletion', async () => {
    // GIVEN: Client is loaded and deletion succeeds
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([]),
      handleDeleteClienteSuccess()
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms deletion
    fireEvent.click(screen.getByTestId('cliente-detail-delete-confirm'));

    // THEN: Right panel returns to empty/default state (detail panel is gone)
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument();
    });
    // AND: Empty state or default state is shown
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-10: "Cancelar" preserves client, no DELETE request
// ---------------------------------------------------------------------------

describe('ClienteDetailView — "Cancelar" in delete dialog preserves client', () => {
  it('[P1] TC-E2-P1-10: should close the confirmation dialog when "Cancelar" is clicked', async () => {
    // GIVEN: Client is loaded and confirmation dialog is open
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-dialog')).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar"
    fireEvent.click(screen.getByTestId('cliente-detail-delete-cancel'));

    // THEN: Dialog is closed
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-delete-dialog')).not.toBeInTheDocument();
    });
  });

  it('[P1] TC-E2-P1-10: should NOT trigger DELETE when "Cancelar" is clicked', async () => {
    // GIVEN: A DELETE handler that tracks calls, client is loaded
    let deleteWasCalled = false;
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE]),
      http.delete('/api/v1/clientes/:clienteId', () => {
        deleteWasCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-cancel')).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar"
    fireEvent.click(screen.getByTestId('cliente-detail-delete-cancel'));

    // THEN: DELETE was NOT called
    expect(deleteWasCalled).toBe(false);
  });

  it('[P1] TC-E2-P1-10: should keep client record in detail panel after "Cancelar"', async () => {
    // GIVEN: Client is loaded and dialog is cancelled
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-cancel')).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar"
    fireEvent.click(screen.getByTestId('cliente-detail-delete-cancel'));

    // THEN: Client detail panel is still visible (record unchanged)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-11: Orphan-contact toast when client has associated contacts
// ---------------------------------------------------------------------------

describe('ClienteDetailView — orphan-contact toast when client has contacts', () => {
  it('[P1] TC-E2-P1-11: should show orphan-contact toast when client with contacts is deleted', async () => {
    // GIVEN: Client has associated contacts (contactCount > 0), DELETE returns 204
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE_WITH_CONTACTS),
      handleGetClientesSuccess([]),
      handleDeleteClienteSuccess()
    );

    renderClienteDetailView(KNOWN_CLIENTE_WITH_CONTACTS.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms deletion of a client that has contacts
    fireEvent.click(screen.getByTestId('cliente-detail-delete-confirm'));

    // THEN: Orphan-contact toast message is shown (not the generic one)
    await waitFor(() => {
      expect(
        screen.getByText(/Cliente eliminado\. Sus contactos asociados quedaron sin cliente asignado\./i)
      ).toBeInTheDocument();
    });
  });

  it('[P1] TC-E2-P1-11: should NOT show orphan-contact toast for client without contacts', async () => {
    // GIVEN: Client has no associated contacts, DELETE returns 204
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([]),
      handleDeleteClienteSuccess()
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms deletion of a client without contacts
    fireEvent.click(screen.getByTestId('cliente-detail-delete-confirm'));

    // THEN: Generic success toast is shown, NOT the orphan-contact message
    await waitFor(() => {
      expect(
        screen.getByText(/Cliente eliminado correctamente/i)
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText(/Sus contactos asociados quedaron sin cliente asignado/i)
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Delete button not visible in empty/null state
// ---------------------------------------------------------------------------

describe('ClienteDetailView — "Eliminar" button not present without a client', () => {
  it('[P1] should NOT show "Eliminar" button when no client is selected (empty state)', () => {
    // GIVEN: clienteId is null
    // WHEN: ClienteDetailView renders with null clienteId
    renderClienteDetailView(null);

    // THEN: "Eliminar" button is NOT present
    expect(screen.queryByTestId('cliente-detail-delete-button')).not.toBeInTheDocument();
  });

  it('[P1] should NOT show "Eliminar" button when client is not found (404 error state)', async () => {
    // GIVEN: MSW returns 404 for the given clienteId
    server.use(handleGetClienteByIdNotFound());

    // WHEN: ClienteDetailView renders with a non-existent clienteId
    renderClienteDetailView('00000000-0000-0000-0000-000000000000');

    // THEN: Not-found state loads, "Eliminar" button is NOT present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-not-found')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('cliente-detail-delete-button')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// "Confirmar" button is disabled while DELETE is in-flight (isPending)
// ---------------------------------------------------------------------------

describe('ClienteDetailView — "Confirmar" disabled during pending DELETE', () => {
  it('[P1] should disable "Confirmar" button while DELETE is in flight', async () => {
    // GIVEN: DELETE has a delay, client is loaded and dialog open
    let resolveDelete!: () => void;
    const deletePending = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([]),
      http.delete('/api/v1/clientes/:clienteId', async () => {
        await deletePending;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User clicks "Confirmar" (DELETE starts, is pending)
    fireEvent.click(screen.getByTestId('cliente-detail-delete-confirm'));

    // THEN: "Confirmar" is disabled while in-flight
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeDisabled();
    });

    // Cleanup: resolve the pending DELETE
    resolveDelete();
  });
});
