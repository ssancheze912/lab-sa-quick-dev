/**
 * Component tests — ContactoDetailView delete flow
 * Story 3.5 — Delete Contact (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E3-P0-delete-01  "Eliminar" button visible; clicking opens dialog "¿Eliminar este contacto?";
 *                       "Confirmar" calls DELETE with correct ID; toast "Contacto eliminado correctamente";
 *                       list cache invalidated; navigation to /contactos.
 *   TC-E3-P1-delete-01  Open dialog, click "Cancelar"; dialog closes; DELETE NOT called;
 *                       contact still visible in detail panel.
 *   TC-E3-P1-delete-02  DELETE returns 404; generic error toast shown; no navigation triggered.
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failures:
 *   - data-testid="contacto-delete-button" does not trigger dialog yet (placeholder only)
 *   - data-testid="contacto-detail-delete-dialog" does not exist yet
 *   - data-testid="contacto-detail-delete-confirm" does not exist yet
 *   - data-testid="contacto-detail-delete-cancel" does not exist yet
 *   - useDeleteContacto module does not exist yet
 *   - Toast "Contacto eliminado correctamente" not emitted yet
 *   - Navigation to /contactos not triggered yet
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import React from 'react';

// Mock TanStack Router so useNavigate and Link work outside a Router context in tests
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
import {
  handleDeleteContactoSuccess,
  handleDeleteContactoNotFound,
} from '../../../../test/msw/handlers/contactos-delete.handlers';
import { handleGetContactosSuccess } from '../../../../test/msw/handlers/contactos.handlers';
import {
  handleGetContactoByIdSuccess,
} from '../../../../test/msw/handlers/contactos-detail.handlers';
import { createContacto, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import { ContactoDetailView } from './ContactoDetailView';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  mockNavigate.mockClear();
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

// ---------------------------------------------------------------------------
// TC-E3-P0-delete-01: Confirm dialog + deletion flow + toast + navigation
// ---------------------------------------------------------------------------

describe('TC-E3-P0-delete-01: ContactoDetailView — delete button opens confirmation dialog', () => {
  it('[P0] should show "Eliminar" button when a contact is loaded', async () => {
    // GIVEN: MSW returns a valid contact
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO])
    );

    // WHEN: ContactoDetailView renders with a valid contactoId
    renderContactoDetailView(KNOWN_CONTACTO.id);

    // THEN: "Eliminar" button is visible
    await waitFor(() => {
      expect(screen.getByTestId('contacto-delete-button')).toBeInTheDocument();
    });
  });

  it('[P0] should open confirmation dialog with "¿Eliminar este contacto?" when "Eliminar" is clicked', async () => {
    // GIVEN: A valid contact is loaded in the detail view
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO])
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    // WHEN: User clicks "Eliminar"
    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    // THEN: Confirmation dialog is visible with the correct Spanish title
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-dialog')).toBeInTheDocument();
    });
    expect(screen.getByText(/¿Eliminar este contacto\?/i)).toBeInTheDocument();
  });

  it('[P0] should show "Confirmar" and "Cancelar" buttons inside the confirmation dialog', async () => {
    // GIVEN: A valid contact is loaded and "Eliminar" is clicked
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO])
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    // THEN: Both action buttons are present in the dialog
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeInTheDocument();
      expect(screen.getByTestId('contacto-detail-delete-cancel')).toBeInTheDocument();
    });
  });

  it('[P0] should call DELETE with the correct contact ID when "Confirmar" is clicked', async () => {
    // GIVEN: DELETE handler captures the request id, contact is loaded
    let capturedDeleteId: string | null = null;
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO]),
      http.delete('/api/v1/contactos/:contactoId', ({ params }) => {
        capturedDeleteId = params.contactoId as string;
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

    // WHEN: User clicks "Confirmar"
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    // THEN: DELETE was called with the correct contact ID
    await waitFor(() => {
      expect(capturedDeleteId).toBe(KNOWN_CONTACTO.id);
    });
  });

  it('[P0] should show toast "Contacto eliminado correctamente" after successful deletion', async () => {
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

    // WHEN: User confirms deletion
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    // THEN: Success toast with correct Spanish message is shown
    await waitFor(() => {
      expect(
        screen.getByText(/Contacto eliminado correctamente/i)
      ).toBeInTheDocument();
    });
  });

  it('[P0] should describe irreversible action in dialog description', async () => {
    // GIVEN: A valid contact loaded and "Eliminar" clicked
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO])
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    // THEN: Dialog description states the action cannot be undone
    await waitFor(() => {
      expect(screen.getByText(/Esta acción no se puede deshacer/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P1-delete-01: "Cancelar" closes dialog, no DELETE, contact unchanged
// ---------------------------------------------------------------------------

describe('TC-E3-P1-delete-01: "Cancelar" in delete dialog preserves contact', () => {
  it('[P1] should close the confirmation dialog when "Cancelar" is clicked', async () => {
    // GIVEN: Contact is loaded and confirmation dialog is open
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
      expect(screen.getByTestId('contacto-detail-delete-dialog')).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar"
    fireEvent.click(screen.getByTestId('contacto-detail-delete-cancel'));

    // THEN: Dialog is closed
    await waitFor(() => {
      expect(screen.queryByTestId('contacto-detail-delete-dialog')).not.toBeInTheDocument();
    });
  });

  it('[P1] should NOT trigger DELETE when "Cancelar" is clicked', async () => {
    // GIVEN: A DELETE handler that tracks calls, contact is loaded
    let deleteWasCalled = false;
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO]),
      http.delete('/api/v1/contactos/:contactoId', () => {
        deleteWasCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
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

    // THEN: DELETE was NOT called
    expect(deleteWasCalled).toBe(false);
  });

  it('[P1] should keep contact record visible in detail panel after "Cancelar"', async () => {
    // GIVEN: Contact is loaded and dialog is cancelled
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

    // THEN: Contact detail panel is still visible (record unchanged)
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E3-P1-delete-02: Backend 404 → generic error toast, no navigation
// ---------------------------------------------------------------------------

describe('TC-E3-P1-delete-02: Backend 404 on DELETE shows error toast without navigation', () => {
  it('[P1] should display generic error toast when DELETE returns 404', async () => {
    // GIVEN: DELETE returns 404 Not Found
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO]),
      handleDeleteContactoNotFound()
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms but DELETE returns 404
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    // THEN: Generic error toast is shown (Spanish, no technical details)
    await waitFor(() => {
      expect(
        screen.getByText(/Error al eliminar el contacto/i)
      ).toBeInTheDocument();
    });
  });

  it('[P1] should NOT navigate to /contactos when DELETE returns 404', async () => {
    // GIVEN: DELETE returns 404; track pathname
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO]),
      handleDeleteContactoNotFound()
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms but DELETE fails
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    // THEN: Contact detail panel remains visible (no navigation away)
    await waitFor(() => {
      expect(screen.getByText(/Error al eliminar el contacto/i)).toBeInTheDocument();
    });

    // Detail panel remains in document (no navigation to /contactos)
    expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
  });

  it('[P1] should NOT expose stack trace or technical details in error toast (NFR6)', async () => {
    // GIVEN: DELETE returns 404 with Problem Details body
    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([KNOWN_CONTACTO]),
      handleDeleteContactoNotFound()
    );

    renderContactoDetailView(KNOWN_CONTACTO.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('contacto-delete-button'));

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeInTheDocument();
    });

    // WHEN: User confirms but DELETE fails with 404
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    await waitFor(() => {
      expect(screen.getByText(/Error al eliminar el contacto/i)).toBeInTheDocument();
    });

    // THEN: No raw error details shown in UI (NFR6)
    expect(screen.queryByText(/stackTrace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/innerException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/exception/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Contacto no encontrado/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// "Confirmar" button disabled while DELETE is in-flight (isPending)
// ---------------------------------------------------------------------------

describe('ContactoDetailView — "Confirmar" disabled during pending DELETE', () => {
  it('[P1] should disable "Confirmar" button while DELETE is in flight', async () => {
    // GIVEN: DELETE has a delay, contact is loaded and dialog open
    let resolveDelete!: () => void;
    const deletePending = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    server.use(
      handleGetContactoByIdSuccess(KNOWN_CONTACTO),
      handleGetContactosSuccess([]),
      http.delete('/api/v1/contactos/:contactoId', async () => {
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

    // WHEN: User clicks "Confirmar" (DELETE starts, is pending)
    fireEvent.click(screen.getByTestId('contacto-detail-delete-confirm'));

    // THEN: "Confirmar" is disabled while in-flight
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-delete-confirm')).toBeDisabled();
    });

    // Cleanup: resolve the pending DELETE
    resolveDelete();
  });
});
