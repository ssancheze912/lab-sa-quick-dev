/**
 * Story 2.4: Edit Client
 * Epic 2: Client Management
 *
 * Component Tests — ClienteDetailView (edit button and dialog)
 * Uses: Vitest + React Testing Library + MSW (msw 2.x)
 *
 * Test Cases (edit functionality added to detail view):
 *   TC-2.4-C-07 (P1): "Editar" button is rendered when client data is loaded
 *   TC-2.4-C-08 (P1): Clicking "Editar" opens Dialog with ClienteForm pre-filled with client's values
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ClienteDetailView } from '../ClienteDetailView';

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const MOCK_CLIENTE = {
  id: '00000000-0000-0000-0000-000000000099',
  nombre: 'Empresa Para Editar SA',
  nit: '900777888-1',
  telefono: '+573009876543',
  ciudad: 'Cali',
  createdAt: '2026-01-15T10:00:00+00:00',
  updatedAt: '2026-01-15T10:00:00+00:00',
};

const server = setupServer(
  http.get(`${BASE_URL}/api/v1/clientes/:id`, ({ params }) => {
    if (params.id === MOCK_CLIENTE.id) {
      return HttpResponse.json(MOCK_CLIENTE);
    }
    return HttpResponse.json(
      { title: 'Cliente no encontrado.', status: 404 },
      { status: 404 }
    );
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return {
    queryClient,
    ...render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        ui
      )
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-C-07 (P1): "Editar" button is rendered when client data is loaded
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.4-C-07 (P1): ClienteDetailView — "Editar" button visible when data is loaded', () => {
  it('renders "Editar" button in the detail header when client data is successfully loaded', async () => {
    // GIVEN: ClienteDetailView with a valid clienteId
    renderWithProviders(
      React.createElement(ClienteDetailView, { clienteId: MOCK_CLIENTE.id })
    );

    // WHEN: Client data loads
    await screen.findByText(MOCK_CLIENTE.nombre);

    // THEN: "Editar" button is visible in the detail panel
    const editButton = screen.getByTestId('cliente-edit-button');
    expect(editButton).toBeInTheDocument();
    expect(editButton).toBeVisible();
  });

  it('does NOT render "Editar" button when no clienteId is provided', () => {
    // GIVEN: ClienteDetailView without a clienteId (placeholder state)
    renderWithProviders(
      React.createElement(ClienteDetailView, { clienteId: undefined })
    );

    // THEN: No "Editar" button present
    expect(screen.queryByTestId('cliente-edit-button')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.4-C-08 (P1): Clicking "Editar" opens Dialog with pre-filled ClienteForm
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-2.4-C-08 (P1): ClienteDetailView — clicking "Editar" opens dialog with pre-filled form', () => {
  it('opens "Editar cliente" dialog with ClienteForm when user clicks "Editar" button', async () => {
    // GIVEN: Client detail is loaded
    renderWithProviders(
      React.createElement(ClienteDetailView, { clienteId: MOCK_CLIENTE.id })
    );

    await screen.findByText(MOCK_CLIENTE.nombre);

    // WHEN: User clicks "Editar" button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('cliente-edit-button'));

    // THEN: Edit dialog is open
    await waitFor(() => {
      expect(screen.getByTestId('cliente-edit-dialog')).toBeInTheDocument();
    });

    // AND: Dialog title is "Editar cliente"
    expect(screen.getByText('Editar cliente')).toBeInTheDocument();
  });

  it('pre-fills form fields with current client values when edit dialog opens', async () => {
    // GIVEN: Client detail is loaded with known values
    renderWithProviders(
      React.createElement(ClienteDetailView, { clienteId: MOCK_CLIENTE.id })
    );

    await screen.findByText(MOCK_CLIENTE.nombre);

    // WHEN: User clicks "Editar" button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('cliente-edit-button'));

    // THEN: Edit dialog opens
    await waitFor(() => {
      expect(screen.getByTestId('cliente-edit-dialog')).toBeInTheDocument();
    });

    // AND: Form fields are pre-filled with the client's current values
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe(MOCK_CLIENTE.nombre);
    expect((screen.getByLabelText('NIT/RUC') as HTMLInputElement).value).toBe(MOCK_CLIENTE.nit);
    expect((screen.getByLabelText('Teléfono') as HTMLInputElement).value).toBe(MOCK_CLIENTE.telefono);
    expect((screen.getByLabelText('Ciudad') as HTMLInputElement).value).toBe(MOCK_CLIENTE.ciudad);
  });

  it('closes the edit dialog when "Cancelar" is clicked from within the form', async () => {
    // GIVEN: Edit dialog is open
    renderWithProviders(
      React.createElement(ClienteDetailView, { clienteId: MOCK_CLIENTE.id })
    );

    await screen.findByText(MOCK_CLIENTE.nombre);

    const user = userEvent.setup();
    await user.click(screen.getByTestId('cliente-edit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-edit-dialog')).toBeInTheDocument();
    });

    // WHEN: User clicks "Cancelar" inside the form
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: Edit dialog is no longer visible (isEditing = false)
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-edit-dialog')).not.toBeInTheDocument();
    });
  });
});
