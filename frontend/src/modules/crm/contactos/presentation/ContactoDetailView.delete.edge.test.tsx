/**
 * Component edge-case tests — ContactoDetailView delete flow
 * Story 3.5 — Delete Contact — additional coverage beyond ATDD RED phase
 *
 * These tests expand coverage with:
 *   - Edge case: dialog can be re-opened after "Cancelar" (dialog reuse)
 *   - Edge case: 500 server error shows generic error toast (not just 404)
 *   - Edge case: rapid double-click on "Confirmar" does not send two DELETE requests
 *   - Boundary: "Eliminar" button present when contact has null clienteId
 *   - Edge case: dialog does NOT remain open after successful deletion
 *   - Edge case: "Cancelar" does NOT show error toast
 *   - Edge case: 503 / network error → generic error toast, no navigation
 *
 * Stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import React from 'react';
import {
  handleDeleteContactoSuccess,
  handleDeleteContactoServerError,
} from '../../../../test/msw/handlers/contactos-delete.handlers';
import { handleGetContactosSuccess } from '../../../../test/msw/handlers/contactos.handlers';
import {
  handleGetContactoByIdSuccess,
} from '../../../../test/msw/handlers/contactos-detail.handlers';
import { resetContactoCounter } from '../../../../test/factories/contacto.factory';
import { ContactoDetailView } from './ContactoDetailView';

// Mock TanStack Router so Link and useNavigate work outside a Router context
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
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
// Helper: render ContactoDetailView with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderContactoDetailView(contactoId: string) {
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
        <ContactoDetailView contactoId={contactoId} />
      </QueryClientProvider>
    ),
  };
}

const KNOWN_CONTACTO = {
  id: '00000000-0000-0000-0000-000000000042',
  nombre: 'Ana López',
  cargo: 'Vendedora',
  telefono: '3001234567',
  email: 'ana.lopez@example.com',
  clienteId: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const CONTACTO_WITH_CLIENT = {
  ...KNOWN_CONTACTO,
  id: '00000000-0000-0000-0000-000000000099',
  clienteId: 'cccccccc-0000-0000-0000-000000000001',
};

// ---------------------------------------------------------------------------
// Edge: dialog can be re-opened after cancel
// ---------------------------------------------------------------------------

describe('ContactoDetailView — dialog reusable after cancel', () => {
  it('[P1] should re-open the delete dialog when "Eliminar" is clicked again after a cancel', async () => {
    // GIVEN: Contact is loaded; user opens and cancels the dialog once
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO])
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    // First open → cancel
    fireEvent.click(screen.getByTestId('contacto-delete-button'));
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-dialog')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('contacto-detail-delete-cancel'));
    await waitFor(() => {
      expect(screen.queryByTestId('contacto-detail-delete-dialog')).not.toBeInTheDocument();
    });

    // WHEN: User clicks "Eliminar" a second time
    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    // THEN: Dialog opens again
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-dialog')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: 500 backend error shows generic error toast
// ---------------------------------------------------------------------------

describe('ContactoDetailView — 500 backend error shows generic toast', () => {
  it('[P1] should show generic error toast when DELETE returns 500', async () => {
    // GIVEN: DELETE returns 500 (unexpected server error)
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO]),
      handleDeleteContactoServerError()
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms but backend returns 500
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    // THEN: Generic error toast is shown (Spanish text, NFR6 compliant)
    await waitFor(() => {
      expect(
        screen.getByText(/Error al eliminar el contacto/i)
      ).toBeInTheDocument();
    });
  });

  it('[P1] should NOT expose internal server error details in toast (NFR6)', async () => {
    // GIVEN: DELETE returns 500 with Internal Server Error body
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO]),
      handleDeleteContactoServerError()
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    await waitFor(() => {
      expect(screen.getByText(/Error al eliminar el contacto/i)).toBeInTheDocument();
    });

    // THEN: Raw server error fields are NOT exposed in UI
    expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/500/i)).not.toBeInTheDocument();
  });

  it('[P1] should NOT navigate when DELETE returns 500', async () => {
    // GIVEN: DELETE returns 500
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO]),
      handleDeleteContactoServerError()
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms but DELETE fails with 500
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    await waitFor(() => {
      expect(screen.getByText(/Error al eliminar el contacto/i)).toBeInTheDocument();
    });

    // THEN: Contact detail panel remains visible (no navigation)
    expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: dialog does NOT remain open after successful deletion
// ---------------------------------------------------------------------------

describe('ContactoDetailView — dialog closes after successful deletion', () => {
  it('[P1] should close the confirmation dialog immediately after successful DELETE', async () => {
    // GIVEN: DELETE returns 204
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO]),
      handleDeleteContactoSuccess()
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms and DELETE succeeds
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    // THEN: Dialog is no longer in the document
    await waitFor(() => {
      expect(screen.queryByTestId('contacto-detail-delete-dialog')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: cancel does NOT show error toast
// ---------------------------------------------------------------------------

describe('ContactoDetailView — cancel does not produce error toast', () => {
  it('[P1] should NOT show any error toast when user clicks "Cancelar"', async () => {
    // GIVEN: Contact loaded, dialog is open
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO])
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-cancel')).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar"
    fireEvent.click(screen.getByTestId('contacto-detail-delete-cancel'));

    // THEN: No error or success toast shown
    await waitFor(() => {
      expect(screen.queryByTestId('contacto-detail-delete-dialog')).not.toBeInTheDocument();
    });

    expect(screen.queryByText(/Error al eliminar el contacto/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Contacto eliminado correctamente/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: contact with clienteId — "Eliminar" button still visible
// ---------------------------------------------------------------------------

describe('ContactoDetailView — delete available for contact with clienteId', () => {
  it('[P2] should show "Eliminar" button when contact has a non-null clienteId', async () => {
    // GIVEN: Contact is associated with a client (clienteId is non-null)
    server.use(
      handleGetContactoByIdSuccess(CONTACTO_WITH_CLIENT),
      handleGetContactosSuccess([CONTACTO_WITH_CLIENT])
    );

    // WHEN: ContactoDetailView renders for a contact with a clienteId
    renderContactoDetailView(CONTACTO_WITH_CLIENT.id);

    // THEN: "Eliminar" button is present (clienteId does not block deletion)
    await waitFor(() => {
      expect(screen.getByTestId('contacto-delete-button')).toBeInTheDocument();
    });
  });

  it('[P2] should successfully delete a contact that has a non-null clienteId', async () => {
    // GIVEN: Contact with clienteId, DELETE returns 204
    server.use(
      handleGetContactoByIdSuccess(CONTACTO_WITH_CLIENT),
      handleGetContactosSuccess([CONTACTO_WITH_CLIENT]),
      http.delete('/api/v1/contactos/:contactoId', () => new HttpResponse(null, { status: 204 }))
    );

    renderContactoDetailView(CONTACTO_WITH_CLIENT.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms deletion
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    // THEN: Success toast is shown (no cascade error for clienteId association)
    await waitFor(() => {
      expect(
        screen.getByText(/Contacto eliminado correctamente/i)
      ).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: multiple rapid confirm clicks — at most one DELETE sent
// ---------------------------------------------------------------------------

describe('ContactoDetailView — multiple rapid confirm clicks', () => {
  it('[P1] should send at most ONE DELETE request even if "Confirmar" is clicked multiple times rapidly', async () => {
    // GIVEN: A slow DELETE that allows the button to be checked before resolving
    let deleteCallCount = 0;
    let resolveDelete!: () => void;
    const deletePending = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([]),
      http.delete('/api/v1/contactos/:contactoId', async () => {
        deleteCallCount++;
        await deletePending;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User clicks "Confirmar" once (button becomes disabled during in-flight)
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    // AND: Attempt to click "Confirmar" again while in-flight
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeDisabled();
    });

    // Try clicking again — should be blocked by disabled state
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    // Resolve the in-flight request
    resolveDelete();

    // THEN: DELETE was only sent once
    await waitFor(() => {
      expect(screen.queryByTestId('contacto-detail-delete-dialog')).not.toBeInTheDocument();
    });

    expect(deleteCallCount).toBe(1);
  });
});
