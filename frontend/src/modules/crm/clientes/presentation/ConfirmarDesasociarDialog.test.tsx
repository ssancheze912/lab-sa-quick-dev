/**
 * Component tests — ConfirmarDesasociarDialog
 * Story 4.2 — Associate & Disassociate Contacts from Client (ATDD RED phase)
 *
 * These tests are in RED phase — ConfirmarDesasociarDialog.tsx does not exist yet.
 * Expected failure: "Cannot find module '../ConfirmarDesasociarDialog'"
 *
 * Test IDs covered (AC #4, #5, #10):
 *   TC-1  Dialog opens when "Desasociar" button is clicked (AC #4)
 *   TC-2  Contact name is displayed in confirmation message (AC #4)
 *   TC-3  Clicking "Desasociar" triggers PUT with { clienteId: null } and closes dialog (AC #5)
 *   TC-4  Clicking "Cancelar" closes dialog without API call (AC #10)
 *   TC-5  Action buttons disabled while mutation is pending (AC #7)
 *   TC-6  Error toast shown when mutation fails (AC #8)
 *
 * Stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format per test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { resetContactoCounter } from '../../../../test/factories/contacto.factory';
import {
  handleAssignClienteSuccess,
  handleAssignClienteServerError,
} from '../../../../test/msw/handlers/contactos-assign-cliente.handlers';
import { ConfirmarDesasociarDialog } from '../ConfirmarDesasociarDialog';

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
// Helper: render ConfirmarDesasociarDialog with required providers
// ---------------------------------------------------------------------------

interface RenderDialogProps {
  contactoId: string;
  contactoNombre: string;
  clienteId: string;
  open?: boolean;
  onClose?: () => void;
}

function renderDialog({
  contactoId,
  contactoNombre,
  clienteId,
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
        <ConfirmarDesasociarDialog
          contactoId={contactoId}
          contactoNombre={contactoNombre}
          clienteId={clienteId}
          open={open}
          onClose={onClose}
        />
      </QueryClientProvider>
    ),
  };
}

const CONTACTO_ID = '10000000-0000-0000-0000-000000000001';
const CLIENTE_ID = '20000000-0000-0000-0000-000000000001';
const CONTACTO_NOMBRE = 'María López';

// ---------------------------------------------------------------------------
// TC-1: Dialog renders when open=true
// ---------------------------------------------------------------------------

describe('ConfirmarDesasociarDialog — TC-1: dialog renders when open', () => {
  it('should render the dialog with heading "Desasociar contacto" when open=true', () => {
    // GIVEN: No network handlers needed for rendering only
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    // WHEN: ConfirmarDesasociarDialog is rendered with open=true
    renderDialog({ contactoId: CONTACTO_ID, contactoNombre: CONTACTO_NOMBRE, clienteId: CLIENTE_ID, open: true });

    // THEN: Dialog is visible with Spanish heading
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Desasociar contacto/i })).toBeInTheDocument();
  });

  it('should NOT render the dialog when open=false', () => {
    // WHEN: ConfirmarDesasociarDialog is rendered with open=false
    renderDialog({ contactoId: CONTACTO_ID, contactoNombre: CONTACTO_NOMBRE, clienteId: CLIENTE_ID, open: false });

    // THEN: Dialog is not visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-2: Contact name shown in confirmation message
// ---------------------------------------------------------------------------

describe('ConfirmarDesasociarDialog — TC-2: contact name in confirmation message', () => {
  it('should display the contact name in the confirmation message', () => {
    // GIVEN: Dialog rendered with contactoNombre "María López"
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    // WHEN: ConfirmarDesasociarDialog is rendered
    renderDialog({ contactoId: CONTACTO_ID, contactoNombre: 'María López', clienteId: CLIENTE_ID, open: true });

    // THEN: Confirmation message contains the contact name
    expect(screen.getByText(/María López/i)).toBeInTheDocument();
  });

  it('should include the safety message that the contact is not deleted', () => {
    // GIVEN: Dialog rendered for disassociation
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    // WHEN: ConfirmarDesasociarDialog is rendered
    renderDialog({ contactoId: CONTACTO_ID, contactoNombre: CONTACTO_NOMBRE, clienteId: CLIENTE_ID, open: true });

    // THEN: Safety message is present (contact will not be deleted)
    expect(screen.getByText(/no será eliminado/i)).toBeInTheDocument();
  });

  it('should have both "Desasociar" confirm button and "Cancelar" cancel button', () => {
    // GIVEN: Dialog rendered open
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    // WHEN: ConfirmarDesasociarDialog is rendered
    renderDialog({ contactoId: CONTACTO_ID, contactoNombre: CONTACTO_NOMBRE, clienteId: CLIENTE_ID, open: true });

    // THEN: Both action buttons are present in Spanish
    expect(screen.getByRole('button', { name: /^Desasociar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-3: Clicking "Desasociar" triggers PUT { clienteId: null } and closes dialog
// ---------------------------------------------------------------------------

describe('ConfirmarDesasociarDialog — TC-3: disassociation mutation on confirm', () => {
  it('should call PUT /api/v1/contactos/{id}/cliente with { clienteId: null } when "Desasociar" is clicked', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 200 OK with null clienteId
    let capturedBody: Record<string, unknown> | null = null;
    let capturedContactoId = '';

    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ request, params }) => {
        capturedContactoId = params.contactoId as string;
        capturedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: params.contactoId,
            nombre: CONTACTO_NOMBRE,
            cargo: 'Analista',
            telefono: '3100000001',
            email: 'maria@siesa.com',
            clienteId: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    const onClose = vi.fn();

    // WHEN: ConfirmarDesasociarDialog is rendered and user clicks "Desasociar"
    renderDialog({ contactoId: CONTACTO_ID, contactoNombre: CONTACTO_NOMBRE, clienteId: CLIENTE_ID, open: true, onClose });

    await userEvent.click(screen.getByRole('button', { name: /^Desasociar$/i }));

    // THEN: PUT was called with correct contactoId and body { clienteId: null }
    await waitFor(() => {
      expect(capturedContactoId).toBe(CONTACTO_ID);
      expect(capturedBody).toEqual({ clienteId: null });
    });

    // THEN: Dialog closes after successful mutation
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should invalidate contactos cache after successful disassociation', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 200 OK
    server.use(handleAssignClienteSuccess({ clienteId: null }));

    const onClose = vi.fn();
    const { queryClient } = renderDialog({ contactoId: CONTACTO_ID, contactoNombre: CONTACTO_NOMBRE, clienteId: CLIENTE_ID, open: true, onClose });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: User clicks "Desasociar"
    await userEvent.click(screen.getByRole('button', { name: /^Desasociar$/i }));

    // THEN: ['contactos'] query key is invalidated
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['contactos'] })
      );
    });
  });
});

// ---------------------------------------------------------------------------
// TC-4: Clicking "Cancelar" closes dialog without API call
// ---------------------------------------------------------------------------

describe('ConfirmarDesasociarDialog — TC-4: cancel without API call', () => {
  it('should close dialog without calling PUT when "Cancelar" is clicked', async () => {
    // GIVEN: PUT handler available but should NOT be called
    let putCalled = false;
    server.use(
      http.put('/api/v1/contactos/:id/cliente', () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    const onClose = vi.fn();

    // WHEN: ConfirmarDesasociarDialog is rendered
    renderDialog({ contactoId: CONTACTO_ID, contactoNombre: CONTACTO_NOMBRE, clienteId: CLIENTE_ID, open: true, onClose });

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    // THEN: onClose was called
    expect(onClose).toHaveBeenCalled();

    // THEN: No PUT request was made
    expect(putCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-5: Action buttons disabled while mutation is pending
// ---------------------------------------------------------------------------

describe('ConfirmarDesasociarDialog — TC-5: buttons disabled during pending mutation', () => {
  it('should disable the "Desasociar" button while mutation is in-flight', async () => {
    // GIVEN: PUT has a controlled delay
    let resolveRequest!: () => void;
    const requestPending = new Promise<void>((r) => { resolveRequest = r; });

    server.use(
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ params }) => {
        await requestPending;
        return HttpResponse.json(
          {
            id: params.contactoId,
            nombre: CONTACTO_NOMBRE,
            cargo: 'Analista',
            telefono: '3100000001',
            email: 'maria@siesa.com',
            clienteId: null,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    // WHEN: Dialog rendered and "Desasociar" is clicked
    renderDialog({ contactoId: CONTACTO_ID, contactoNombre: CONTACTO_NOMBRE, clienteId: CLIENTE_ID, open: true });

    await userEvent.click(screen.getByRole('button', { name: /^Desasociar$/i }));

    // THEN: "Desasociar" button is disabled while in-flight
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Desasociar$/i })).toBeDisabled();
    });

    // Cleanup
    resolveRequest();
  });
});

// ---------------------------------------------------------------------------
// TC-6: Error toast shown when mutation fails
// ---------------------------------------------------------------------------

describe('ConfirmarDesasociarDialog — TC-6: error handling', () => {
  it('should keep dialog open when disassociation mutation fails (no premature close)', async () => {
    // GIVEN: PUT /api/v1/contactos/{id}/cliente returns 500
    server.use(handleAssignClienteServerError());

    const onClose = vi.fn();

    // WHEN: Dialog rendered and user attempts to disassociate
    renderDialog({ contactoId: CONTACTO_ID, contactoNombre: CONTACTO_NOMBRE, clienteId: CLIENTE_ID, open: true, onClose });

    await userEvent.click(screen.getByRole('button', { name: /^Desasociar$/i }));

    // THEN: mutation fails — dialog remains open (no automatic close on error)
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    // THEN: onClose was NOT called
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should re-enable the "Desasociar" button after mutation failure', async () => {
    // GIVEN: PUT returns 500
    server.use(handleAssignClienteServerError());

    // WHEN: Dialog rendered and user clicks "Desasociar" (fails)
    renderDialog({ contactoId: CONTACTO_ID, contactoNombre: CONTACTO_NOMBRE, clienteId: CLIENTE_ID, open: true });

    await userEvent.click(screen.getByRole('button', { name: /^Desasociar$/i }));

    // THEN: After error, the "Desasociar" button is re-enabled (retry possible)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Desasociar$/i })).not.toBeDisabled();
    });
  });
});
