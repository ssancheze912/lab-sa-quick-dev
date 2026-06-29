/**
 * Edge-case / boundary tests — AsociarContactoDialog component
 * Story 4.2 — Associate & Disassociate Contacts from Client
 *
 * Extends AsociarContactoDialog.test.tsx with cases not covered in ATDD RED phase:
 *
 *   EC-1  Search input filters contacts by partial name (case-insensitive)
 *   EC-2  Clearing search after filtering restores full available list
 *   EC-3  "Asociar" button disabled when NO contact is selected (no selection yet)
 *   EC-4  Selecting a contact, then selecting another — mutation uses the LAST selected
 *   EC-5  Loading state ("Cargando contactos...") shown while contacts are fetched
 *   EC-6  API loading error still renders the search UI after loading completes
 *   EC-7  Search returns zero results — empty state shows while contacts exist globally
 *   EC-8  Contact with special characters in name renders without breaking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createContacto, createContactos, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import { resetClienteCounter } from '../../../../test/factories/cliente.factory';
import {
  handleAssignClienteSuccess,
} from '../../../../test/msw/handlers/contactos-assign-cliente.handlers';
import { AsociarContactoDialog } from '../AsociarContactoDialog';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  resetClienteCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderDialog(props: {
  clienteId: string;
  open?: boolean;
  onClose?: () => void;
}) {
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
        <AsociarContactoDialog
          clienteId={props.clienteId}
          open={props.open ?? true}
          onClose={props.onClose ?? vi.fn()}
        />
      </QueryClientProvider>
    ),
  };
}

const CLIENTE_ID = '20000000-0000-0000-0000-000000000001';

// ---------------------------------------------------------------------------
// EC-1: Search filters contacts by partial name (case-insensitive)
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — EC-1: search filters by name', () => {
  it('should show only contacts matching the search term (case-insensitive)', async () => {
    // GIVEN: Three contacts available
    const contactos = [
      createContacto({ clienteId: null, nombre: 'Ana García' }),
      createContacto({ clienteId: null, nombre: 'Bruno Martínez' }),
      createContacto({ clienteId: null, nombre: 'Carlos Ruiz' }),
    ];

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json(contactos))
    );

    renderDialog({ clienteId: CLIENTE_ID });

    await waitFor(() => {
      expect(screen.getByTestId('asociar-contacto-dialog')).toBeInTheDocument();
    });

    // WHEN: User types "bruno" (lowercase) in the search input
    await userEvent.type(screen.getByPlaceholderText(/Buscar contacto/i), 'bruno');

    // THEN: Only "Bruno Martínez" is shown
    expect(screen.getByText('Bruno Martínez')).toBeInTheDocument();
    expect(screen.queryByText('Ana García')).not.toBeInTheDocument();
    expect(screen.queryByText('Carlos Ruiz')).not.toBeInTheDocument();
  });

  it('should show contacts matching partial first name search', async () => {
    // GIVEN: Contacts with distinct names
    const contactos = [
      createContacto({ clienteId: null, nombre: 'Patricia López' }),
      createContacto({ clienteId: null, nombre: 'Patricia Torres' }),
      createContacto({ clienteId: null, nombre: 'Roberto Gómez' }),
    ];

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json(contactos))
    );

    renderDialog({ clienteId: CLIENTE_ID });

    await waitFor(() => {
      expect(screen.getByTestId('asociar-contacto-dialog')).toBeInTheDocument();
    });

    // WHEN: User types "patricia"
    await userEvent.type(screen.getByPlaceholderText(/Buscar contacto/i), 'patricia');

    // THEN: Both Patricias visible, Roberto not
    expect(screen.getByText('Patricia López')).toBeInTheDocument();
    expect(screen.getByText('Patricia Torres')).toBeInTheDocument();
    expect(screen.queryByText('Roberto Gómez')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-2: Clearing search restores full list
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — EC-2: clearing search restores full list', () => {
  it('should show all available contacts again after clearing the search input', async () => {
    // GIVEN: Two contacts available
    const contactos = [
      createContacto({ clienteId: null, nombre: 'María Fernández' }),
      createContacto({ clienteId: null, nombre: 'Juan Pérez' }),
    ];

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json(contactos))
    );

    renderDialog({ clienteId: CLIENTE_ID });

    await waitFor(() => {
      expect(screen.getByTestId('asociar-contacto-dialog')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar contacto/i);

    // WHEN: User types a filter then clears it
    await userEvent.type(searchInput, 'María');
    expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();

    await userEvent.clear(searchInput);

    // THEN: Both contacts are visible again
    expect(screen.getByText('María Fernández')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-3: "Asociar" button disabled when no contact is selected
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — EC-3: Asociar button disabled without selection', () => {
  it('should have "Asociar" button disabled when no contact has been selected', async () => {
    // GIVEN: Contacts list available
    const contactos = createContactos(2, { clienteId: null });

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json(contactos))
    );

    renderDialog({ clienteId: CLIENTE_ID });

    await waitFor(() => {
      expect(screen.getByTestId('asociar-contacto-dialog')).toBeInTheDocument();
    });

    // THEN: "Asociar" button is disabled (no contact selected yet)
    expect(screen.getByRole('button', { name: /^Asociar$/i })).toBeDisabled();
  });

  it('should enable "Asociar" button after a contact is selected', async () => {
    // GIVEN: One contact available
    const contacto = createContacto({ clienteId: null, nombre: 'Elena Morales' });

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([contacto]))
    );

    renderDialog({ clienteId: CLIENTE_ID });

    await waitFor(() => {
      expect(screen.getByText('Elena Morales')).toBeInTheDocument();
    });

    // WHEN: User clicks the contact item to select it
    await userEvent.click(screen.getByTestId(`contacto-item-${contacto.id}`));

    // THEN: "Asociar" button becomes enabled
    expect(screen.getByRole('button', { name: /^Asociar$/i })).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// EC-4: Selecting a second contact overrides the first selection
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — EC-4: re-selection uses latest contact', () => {
  it('should use the last selected contact when "Asociar" is clicked after re-selecting', async () => {
    // GIVEN: Two contacts available
    const contacto1 = createContacto({ clienteId: null, nombre: 'Primero Test' });
    const contacto2 = createContacto({ clienteId: null, nombre: 'Segundo Test' });

    let capturedContactoId = '';

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([contacto1, contacto2])),
      http.put('/api/v1/contactos/:contactoId/cliente', async ({ params }) => {
        capturedContactoId = params.contactoId as string;
        return HttpResponse.json(
          {
            id: params.contactoId,
            nombre: 'Segundo Test',
            cargo: contacto2.cargo,
            telefono: contacto2.telefono,
            email: contacto2.email,
            clienteId: CLIENTE_ID,
            createdAt: contacto2.createdAt,
            updatedAt: '2026-06-29T10:00:00Z',
          },
          { status: 200 }
        );
      })
    );

    const onClose = vi.fn();
    renderDialog({ clienteId: CLIENTE_ID, onClose });

    await waitFor(() => {
      expect(screen.getByText('Primero Test')).toBeInTheDocument();
    });

    // WHEN: User selects first contact, then selects second contact
    await userEvent.click(screen.getByTestId(`contacto-item-${contacto1.id}`));
    await userEvent.click(screen.getByTestId(`contacto-item-${contacto2.id}`));

    // WHEN: User confirms
    await userEvent.click(screen.getByRole('button', { name: /^Asociar$/i }));

    // THEN: The mutation was called with contacto2's ID (the second selection wins)
    await waitFor(() => {
      expect(capturedContactoId).toBe(contacto2.id);
    });
  });
});

// ---------------------------------------------------------------------------
// EC-5: Loading state while contacts are being fetched
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — EC-5: loading state during contacts fetch', () => {
  it('should show "Cargando contactos..." while the contacts query is loading', async () => {
    // GIVEN: Contacts fetch is delayed
    let resolveContacts!: () => void;
    const contactsReady = new Promise<void>((r) => { resolveContacts = r; });

    server.use(
      http.get('/api/v1/contactos', async () => {
        await contactsReady;
        return HttpResponse.json([]);
      })
    );

    renderDialog({ clienteId: CLIENTE_ID });

    // THEN: Loading indicator is visible before contacts arrive
    expect(screen.getByText(/Cargando contactos/i)).toBeInTheDocument();

    // Cleanup
    resolveContacts();
  });
});

// ---------------------------------------------------------------------------
// EC-7: Search returns zero results — empty state while contacts exist globally
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — EC-7: search with no matches shows empty state', () => {
  it('should show empty state when search term matches no available contacts', async () => {
    // GIVEN: Contacts available but none match the search
    const contactos = [
      createContacto({ clienteId: null, nombre: 'Ana Rodríguez' }),
    ];

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json(contactos))
    );

    renderDialog({ clienteId: CLIENTE_ID });

    await waitFor(() => {
      expect(screen.getByTestId('asociar-contacto-dialog')).toBeInTheDocument();
    });

    // WHEN: User types something that matches no contact
    await userEvent.type(screen.getByPlaceholderText(/Buscar contacto/i), 'xyz12345nomatch');

    // THEN: Empty state message is shown
    await waitFor(() => {
      expect(screen.getByTestId('asociar-contacto-empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/No hay contactos disponibles/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-8: Contact with special characters renders without error
// ---------------------------------------------------------------------------

describe('AsociarContactoDialog — EC-8: special characters in contact name', () => {
  it('should render contact names with accents and special chars without error', async () => {
    // GIVEN: Contact has special characters in the name
    const contacto = createContacto({
      clienteId: null,
      nombre: 'Ángela María Güiñez-O\'Brien',
    });

    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json([contacto])),
      handleAssignClienteSuccess({ clienteId: CLIENTE_ID })
    );

    renderDialog({ clienteId: CLIENTE_ID });

    // THEN: Name renders correctly
    await waitFor(() => {
      expect(screen.getByText("Ángela María Güiñez-O'Brien")).toBeInTheDocument();
    });
  });
});
