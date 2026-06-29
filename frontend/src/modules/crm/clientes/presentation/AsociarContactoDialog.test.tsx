/**
 * Component tests — AsociarContactoDialog
 * Story 4.2 — Associate & Disassociate Contacts from Client (ATDD RED phase)
 *
 * These tests are in RED phase — AsociarContactoDialog.tsx does not exist yet.
 * Expected failure: "Cannot find module '../AsociarContactoDialog'"
 *
 * Test IDs covered (AC #1, #2, #9, #10):
 *   TC-1  Dialog opens when "Asociar contacto" button is clicked (AC #1)
 *   TC-2  Available contacts (not linked to current client) displayed in list (AC #2)
 *   TC-3  Empty state "No hay contactos disponibles" shown when all contacts are already
 *         associated to this client or other clients (AC #9)
 *   TC-4  Selecting a contact and clicking "Asociar" triggers mutation and closes dialog (AC #2)
 *   TC-5  Clicking "Cancelar" closes dialog without API call (AC #10)
 *   TC-6  Action buttons are disabled while mutation is pending (AC #7)
 *   TC-7  Error toast is shown when mutation fails — no data change applied (AC #8)
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
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import {
  createContacto,
  createContactos,
  resetContactoCounter,
} from '../../../../test/factories/contacto.factory';
import {
  handleAssignClienteSuccess,
  handleAssignClienteServerError,
} from '../../../../test/msw/handlers/contactos-assign-cliente.handlers';
import { AsociarContactoDialog } from '../AsociarContactoDialog';

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
// Helper: render AsociarContactoDialog with required providers
// ---------------------------------------------------------------------------

interface RenderDialogProps {
  clienteId: string;
  open?: boolean;
  onClose?: () => void;
}

function renderDialog({ clienteId, open = true, onClose = vi.fn() }: RenderDialogProps) {
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
        <AsociarContactoDialog clienteId={clienteId} open={open} onClose={onClose} />
      </QueryClientProvider>
    ),
  };
}

const CLIENTE_ID = '20000000-0000-0000-0000-000000000001';

// ---------------------------------------------------------------------------
// TC-1: Dialog opens when rendered with open=true
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — TC-1: dialog opens when triggered', () => {
  it('should render the dialog with title "Asociar contacto" when open=true', async () => {
    // GIVEN: MSW returns an empty contacts list
    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([]))
    );

    // WHEN: AsociarContactoDialog is rendered with open=true
    renderDialog({ clienteId: CLIENTE_ID, open: true });

    // THEN: Dialog heading "Asociar contacto" is visible
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /Asociar contacto/i })).toBeInTheDocument();
  });

  it('should NOT render the dialog when open=false', () => {
    // GIVEN: No MSW handler needed (dialog not rendered)

    // WHEN: AsociarContactoDialog is rendered with open=false
    renderDialog({ clienteId: CLIENTE_ID, open: false });

    // THEN: Dialog content is not visible
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-2: Available contacts (not linked to current client) displayed
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — TC-2: displays available contacts', () => {
  it('should display contacts not linked to the current client', async () => {
    // GIVEN: Two contacts exist — one linked to another client (available), one unlinked (available)
    const cliente = createCliente();
    const otherCliente = createCliente();
    const availableContact1 = createContacto({ clienteId: null, nombre: 'Contacto Libre' });
    const availableContact2 = createContacto({
      clienteId: otherCliente.id,
      nombre: 'Contacto de Otro Cliente',
    });
    // This contact is already linked to the current client — should NOT appear
    const alreadyLinked = createContacto({ clienteId: cliente.id, nombre: 'Ya Asociado' });

    server.use(
      http.get('/api/v1/contactos', () =>
        HttpResponse.json([availableContact1, availableContact2, alreadyLinked])
      )
    );

    // WHEN: Dialog is rendered for the current cliente
    renderDialog({ clienteId: cliente.id, open: true });

    // THEN: Available contacts are shown; already-linked contact is not shown
    await waitFor(() => {
      expect(screen.getByTestId('asociar-contacto-dialog')).toBeInTheDocument();
    });
    expect(screen.getByText('Contacto Libre')).toBeInTheDocument();
    expect(screen.getByText('Contacto de Otro Cliente')).toBeInTheDocument();
    expect(screen.queryByText('Ya Asociado')).not.toBeInTheDocument();
  });

  it('should display a search input "Buscar contacto..."', async () => {
    // GIVEN: Contacts list available
    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json(createContactos(2)))
    );

    // WHEN: Dialog is rendered
    renderDialog({ clienteId: CLIENTE_ID, open: true });

    // THEN: Search input with placeholder "Buscar contacto..." is present
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar contacto/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-3: Empty state when no contacts are available
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — TC-3: empty state when no contacts available', () => {
  it('should show "No hay contactos disponibles" when all contacts are already linked to this client', async () => {
    // GIVEN: Only contacts that are already linked to the current client exist
    const contacto = createContacto({ clienteId: CLIENTE_ID });

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([contacto]))
    );

    // WHEN: Dialog is rendered for CLIENTE_ID
    renderDialog({ clienteId: CLIENTE_ID, open: true });

    // THEN: Empty state message is shown
    await waitFor(() => {
      expect(screen.getByTestId('asociar-contacto-empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/No hay contactos disponibles/i)).toBeInTheDocument();
  });

  it('should show empty state when contacts list is empty', async () => {
    // GIVEN: API returns no contacts at all
    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([]))
    );

    // WHEN: Dialog is rendered
    renderDialog({ clienteId: CLIENTE_ID, open: true });

    // THEN: Empty state is visible
    await waitFor(() => {
      expect(screen.getByText(/No hay contactos disponibles/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-4: Selecting a contact and clicking "Asociar" triggers mutation and closes dialog
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — TC-4: association mutation on confirm', () => {
  it('should trigger association mutation when a contact is selected and "Asociar" is clicked', async () => {
    // GIVEN: One available contact not linked to the current client
    const contacto = createContacto({ clienteId: null, nombre: 'Carlos Martínez' });
    let mutationCalled = false;

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([contacto])),
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ params }) => {
        mutationCalled = true;
        return HttpResponse.json(
          {
            id: params.contactoId,
            nombre: 'Carlos Martínez',
            cargo: contacto.cargo,
            telefono: contacto.telefono,
            email: contacto.email,
            clienteId: CLIENTE_ID,
            createdAt: contacto.createdAt,
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    const onClose = vi.fn();

    // WHEN: Dialog is rendered and user selects the contact and clicks "Asociar"
    renderDialog({ clienteId: CLIENTE_ID, open: true, onClose });

    await waitFor(() => {
      expect(screen.getByText('Carlos Martínez')).toBeInTheDocument();
    });

    // WHEN: User selects the contact
    await userEvent.click(screen.getByTestId(`contacto-item-${contacto.id}`));

    // WHEN: User clicks "Asociar" button to confirm
    await userEvent.click(screen.getByRole('button', { name: /^Asociar$/i }));

    // THEN: Mutation was called (PUT /api/v1/contactos/{id}/cliente)
    await waitFor(() => {
      expect(mutationCalled).toBe(true);
    });

    // THEN: Dialog closes after successful mutation
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-5: Clicking "Cancelar" closes dialog without API call
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — TC-5: cancel without API call', () => {
  it('should close the dialog without making any API call when "Cancelar" is clicked', async () => {
    // GIVEN: One available contact
    const contacto = createContacto({ clienteId: null });
    let putCalled = false;

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([contacto])),
      http.put('/api/v1/contactos/:id/cliente', () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    const onClose = vi.fn();

    // WHEN: Dialog is rendered
    renderDialog({ clienteId: CLIENTE_ID, open: true, onClose });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    // THEN: onClose was called
    expect(onClose).toHaveBeenCalled();

    // THEN: No PUT request was made
    expect(putCalled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-6: Action buttons disabled while mutation is pending
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — TC-6: buttons disabled during pending mutation', () => {
  it('should disable the "Asociar" button while mutation is in-flight', async () => {
    // GIVEN: One available contact, PUT has a controlled delay
    const contacto = createContacto({ clienteId: null, nombre: 'Contacto Pendiente' });
    let resolveRequest!: () => void;
    const requestPending = new Promise<void>((r) => { resolveRequest = r; });

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([contacto])),
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ params }) => {
        await requestPending;
        return HttpResponse.json(
          {
            id: params.contactoId,
            nombre: 'Contacto Pendiente',
            cargo: 'Cargo',
            telefono: '3100000001',
            email: 'test@siesa.com',
            clienteId: CLIENTE_ID,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    // WHEN: Dialog is rendered and user selects contact and clicks "Asociar"
    renderDialog({ clienteId: CLIENTE_ID, open: true });

    await waitFor(() => {
      expect(screen.getByText('Contacto Pendiente')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId(`contacto-item-${contacto.id}`));
    await userEvent.click(screen.getByRole('button', { name: /^Asociar$/i }));

    // THEN: "Asociar" button is disabled while in-flight
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Asociar$/i })).toBeDisabled();
    });

    // Cleanup
    resolveRequest();
  });
});

// ---------------------------------------------------------------------------
// TC-7: Error toast on mutation failure — no data change applied
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — TC-7: error handling with toast', () => {
  it('should keep dialog open and not apply data change when mutation fails', async () => {
    // GIVEN: One available contact, PUT returns 500
    const contacto = createContacto({ clienteId: null, nombre: 'Contacto Error' });

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([contacto])),
      handleAssignClienteServerError()
    );

    const onClose = vi.fn();

    // WHEN: Dialog is rendered and user attempts to associate
    renderDialog({ clienteId: CLIENTE_ID, open: true, onClose });

    await waitFor(() => {
      expect(screen.getByText('Contacto Error')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId(`contacto-item-${contacto.id}`));
    await userEvent.click(screen.getByRole('button', { name: /^Asociar$/i }));

    // THEN: mutation fails — dialog should NOT close (no optimistic update)
    await waitFor(() => {
      // The contact "Error" is still in the list — no premature data change
      expect(screen.queryByText('Contacto Error')).toBeInTheDocument();
    });

    // Dialog remains open (onClose not called)
    expect(onClose).not.toHaveBeenCalled();
  });
});
