/**
 * Component edge-case tests — ClienteDetailView delete flow
 * Story 2.5 — Delete Client (Automation Expansion — BMad-Integrated)
 *
 * Covers edge cases NOT in ATDD component tests:
 *   - [P1] DELETE 500 server error: dialog remains open and error toast shown
 *   - [P1] DELETE 404 (already deleted): dialog remains open and error toast shown
 *   - [P1] Dialog can be reopened after cancel (idempotency of open/close cycle)
 *   - [P2] "Confirmar" button text visible (not blank) in initial dialog state
 *   - [P2] Navigation rail element not affected by delete dialog opening
 *
 * Stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, params, children, className, ...rest }: {
    to: string;
    params?: Record<string, string>;
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => {
    let href = to;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        href = href.replace(`$${key}`, value);
      }
    }
    return <a href={href} className={className} {...rest}>{children}</a>;
  },
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import {
  handleDeleteClienteServerError,
  handleDeleteClienteNotFound,
  handleDeleteClienteSuccess,
} from '../../../../test/msw/handlers/clientes-delete.handlers';
import { handleGetClientesSuccess } from '../../../../test/msw/handlers/clientes.handlers';
import {
  handleGetClienteByIdSuccess,
} from '../../../../test/msw/handlers/clientes-detail.handlers';
import { resetClienteCounter } from '../../../../test/factories/cliente.factory';
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

// ---------------------------------------------------------------------------
// Edge: DELETE 500 — dialog stays open, error toast shown
// ---------------------------------------------------------------------------

describe('ClienteDetailView — DELETE 500 keeps dialog open', () => {
  it('[P1] should keep the confirmation dialog open when DELETE returns 500', async () => {
    // GIVEN: DELETE returns 500 Internal Server Error
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE]),
      handleDeleteClienteServerError()
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-dialog')).toBeInTheDocument();
    });

    // WHEN: User clicks "Confirmar" and DELETE fails with 500
    fireEvent.click(screen.getByTestId('cliente-detail-delete-confirm'));

    // THEN: Dialog remains open (mutation errored — do not close on failure)
    await waitFor(() => {
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('cliente-detail-delete-dialog')).toBeInTheDocument();
  });

  it('[P1] should show an error toast when DELETE returns 500', async () => {

    // GIVEN: DELETE returns 500, client is loaded
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE]),
      handleDeleteClienteServerError()
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms but backend returns 500
    fireEvent.click(screen.getByTestId('cliente-detail-delete-confirm'));

    // THEN: Error toast is shown (Spanish message per NFR6 / security notes)
    await waitFor(() => {
      expect(
        screen.getByText(/Error al eliminar el cliente/i)
      ).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: DELETE 404 (client already deleted) — dialog stays open
// ---------------------------------------------------------------------------

describe('ClienteDetailView — DELETE 404 (already-deleted race condition)', () => {
  it('[P1] should keep the confirmation dialog open when DELETE returns 404 (client already gone)', async () => {
    // GIVEN: DELETE returns 404 (another user deleted this client concurrently)
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE]),
      handleDeleteClienteNotFound()
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms but DELETE returns 404
    fireEvent.click(screen.getByTestId('cliente-detail-delete-confirm'));

    // THEN: Dialog stays open (error path, not success path)
    await waitFor(() => {
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId('cliente-detail-delete-dialog')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: Dialog idempotency — can be reopened after cancel
// ---------------------------------------------------------------------------

describe('ClienteDetailView — delete dialog can be reopened after cancel', () => {
  it('[P1] should show dialog again when "Eliminar" is clicked after a previous cancel', async () => {
    // GIVEN: Client loaded, dialog opened and then cancelled
    server.use(
      handleGetClienteByIdSuccess(KNOWN_CLIENTE),
      handleGetClientesSuccess([KNOWN_CLIENTE])
    );

    renderClienteDetailView(KNOWN_CLIENTE.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // Open dialog first time
    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-dialog')).toBeInTheDocument();
    });

    // Cancel (close dialog)
    fireEvent.click(screen.getByTestId('cliente-detail-delete-cancel'));

    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-delete-dialog')).not.toBeInTheDocument();
    });

    // WHEN: "Eliminar" is clicked a second time
    fireEvent.click(screen.getByTestId('cliente-detail-delete-button'));

    // THEN: Dialog reopens correctly
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-delete-dialog')).toBeInTheDocument();
    });

    expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-detail-delete-cancel')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: "Confirmar" button has visible label text in initial state
// ---------------------------------------------------------------------------

describe('ClienteDetailView — "Confirmar" button has correct label', () => {
  it('[P2] should display "Confirmar" text in the confirmation button before any action', async () => {
    // GIVEN: Client is loaded and dialog is open
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
      expect(screen.getByTestId('cliente-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: Dialog is open and no mutation has been triggered yet
    const confirmButton = screen.getByTestId('cliente-detail-delete-confirm');

    // THEN: "Confirmar" button is enabled and has the correct label
    expect(confirmButton).toBeEnabled();
    expect(confirmButton).toHaveTextContent('Confirmar');
  });
});

// ---------------------------------------------------------------------------
// Edge: "Cancelar" button in dialog does NOT call mutate via synthetic events
// ---------------------------------------------------------------------------

describe('ClienteDetailView — "Cancelar" is isolated from mutation (boundary)', () => {
  it('[P2] should NOT emit a DELETE request even if "Cancelar" is fired via Enter key simulation', async () => {
    // GIVEN: Dialog is open, DELETE tracker active
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

    // WHEN: "Cancelar" button is activated via keyboard (Enter key simulation)
    fireEvent.keyDown(screen.getByTestId('cliente-detail-delete-cancel'), { key: 'Enter', code: 'Enter' });
    fireEvent.click(screen.getByTestId('cliente-detail-delete-cancel'));

    // THEN: DELETE was NOT called
    expect(deleteWasCalled).toBe(false);

    // AND: Dialog is closed
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-delete-dialog')).not.toBeInTheDocument();
    });
  });
});
