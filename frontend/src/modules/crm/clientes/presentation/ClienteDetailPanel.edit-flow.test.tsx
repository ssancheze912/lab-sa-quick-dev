/**
 * Story 2.4: ClienteDetailPanel — Edit Flow Tests (ATDD RED Phase)
 * Tests intentionally fail until ClienteDetailPanel edit functionality is implemented.
 *
 * Acceptance Criteria covered:
 * - AC1: "Editar" button renders when client data is loaded; not shown during skeleton/loading or 404/error states
 * - AC2: Clicking "Editar" shows ClienteForm in edit mode with pre-filled data
 * - AC4: Clicking "Cancelar" in edit form hides the form and shows the detail view again
 *
 * Framework: Vitest + React Testing Library + MSW
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ClienteDetailPanel } from './ClienteDetailPanel';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000/api/v1/clientes';
const KNOWN_ID = '550e8400-e29b-41d4-a716-446655440001';

function buildClienteDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: KNOWN_ID,
    nombre: 'Empresa Ejemplo S.A.',
    nit: '900123456-7',
    telefono: '6011234567',
    ciudad: 'Bogotá',
    createdAt: '2026-06-25T10:30:00Z',
    updatedAt: '2026-06-25T11:00:00Z',
    ...overrides,
  };
}

const server = setupServer(
  http.get(`${API_BASE}/:id`, () => HttpResponse.json(buildClienteDetail())),
  http.put(`${API_BASE}/:id`, () => HttpResponse.json(buildClienteDetail(), { status: 200 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

// ─── AC1: "Editar" button renders on successful data load ────────────────────

describe('AC1 — "Editar" button visibility', () => {
  it('should render the "Editar" button when client data is loaded', async () => {
    // GIVEN: API returns client data
    // WHEN: ClienteDetailPanel is rendered with a valid clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: "Editar" button appears once the data is loaded
    await waitFor(() => {
      expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument();
    });
  });

  it('should NOT render "Editar" button during skeleton loading state', async () => {
    // GIVEN: API is slow (loading state visible)
    server.use(
      http.get(`${API_BASE}/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return HttpResponse.json(buildClienteDetail());
      }),
    );

    // WHEN: ClienteDetailPanel is rendered and showing skeleton
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: Skeleton is visible, "Editar" button is NOT present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('cliente-editar-button')).not.toBeInTheDocument();
  });

  it('should NOT render "Editar" button when client returns 404', async () => {
    // GIVEN: API returns 404 for this client ID
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: `Cliente con id ${KNOWN_ID} no encontrado.` },
          { status: 404 },
        ),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: "Editar" button is NOT present in 404 state
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('cliente-editar-button')).not.toBeInTheDocument();
  });

  it('should NOT render "Editar" button when backend returns 500', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: "Editar" button is NOT present in error state
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('cliente-editar-button')).not.toBeInTheDocument();
  });
});

// ─── AC1: Clicking "Editar" opens form pre-filled ─────────────────────────────

describe('AC1 — Clicking "Editar" shows ClienteForm in edit mode with pre-filled data', () => {
  it('should show edit form when "Editar" button is clicked', async () => {
    // GIVEN: Client data is loaded and "Editar" button is visible
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument();
    });

    // WHEN: User clicks "Editar"
    await user.click(screen.getByTestId('cliente-editar-button'));

    // THEN: Edit form is shown
    await waitFor(() => {
      expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument();
    });
  });

  it('should hide the detail view when edit form is shown', async () => {
    // GIVEN: Client data is loaded
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });

    // WHEN: User clicks "Editar"
    await user.click(screen.getByTestId('cliente-editar-button'));

    // THEN: Detail content is hidden (form replaces it)
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-content')).not.toBeInTheDocument();
    });
  });

  it('should pre-fill Nombre in edit form with current client Nombre', async () => {
    // GIVEN: Client data loaded with specific Nombre
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ nombre: 'Inversiones Delta S.A.' })),
      ),
    );

    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());

    // WHEN: User opens edit form
    await user.click(screen.getByTestId('cliente-editar-button'));

    // THEN: Nombre input is pre-filled with current value
    await waitFor(() => {
      const nombreInput = screen.getByLabelText('Nombre') as HTMLInputElement;
      expect(nombreInput.value).toBe('Inversiones Delta S.A.');
    });
  });

  it('should pre-fill NIT/RUC in edit form with current client NIT', async () => {
    // GIVEN: Client data loaded
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());

    // WHEN: User opens edit form
    await user.click(screen.getByTestId('cliente-editar-button'));

    // THEN: NIT/RUC is pre-filled
    await waitFor(() => {
      const nitInput = screen.getByLabelText('NIT/RUC') as HTMLInputElement;
      expect(nitInput.value).toBe('900123456-7');
    });
  });
});

// ─── AC4: Cancelar closes form, shows detail view ────────────────────────────

describe('AC4 — Cancelar closes edit form and restores detail view', () => {
  it('should hide edit form and show detail view again when "Cancelar" is clicked', async () => {
    // GIVEN: User has opened the edit form
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());
    await user.click(screen.getByTestId('cliente-editar-button'));
    await waitFor(() => expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument());

    // WHEN: User clicks "Cancelar" in the edit form
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: Edit form is hidden and detail view is shown again
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-edit-form')).not.toBeInTheDocument();
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });
  });

  it('should NOT send a PUT request when "Cancelar" is clicked', async () => {
    // GIVEN: User has opened the edit form
    const user = userEvent.setup();
    let putCalled = false;

    server.use(
      http.put(`${API_BASE}/:id`, () => {
        putCalled = true;
        return HttpResponse.json(buildClienteDetail(), { status: 200 });
      }),
    );

    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());
    await user.click(screen.getByTestId('cliente-editar-button'));
    await waitFor(() => expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument());

    // WHEN: User clicks Cancelar without submitting
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: No PUT request was made
    expect(putCalled).toBe(false);
  });

  it('should re-display the "Editar" button after Cancelar closes the form', async () => {
    // GIVEN: User opened and then cancelled edit form
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());
    await user.click(screen.getByTestId('cliente-editar-button'));
    await waitFor(() => expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument());

    // WHEN: User clicks Cancelar
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: "Editar" button is visible again
    await waitFor(() => {
      expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument();
    });
  });
});

// ─── AC2: After successful edit, detail view is shown ───────────────────────

describe('AC2 — After successful edit, onSuccess closes form and shows detail view', () => {
  it('should close edit form and show detail content after successful update', async () => {
    // GIVEN: User opened edit form and submits valid data
    const user = userEvent.setup();

    server.use(
      http.put(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ nombre: 'Empresa Actualizada S.A.' }), { status: 200 }),
      ),
    );

    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());
    await user.click(screen.getByTestId('cliente-editar-button'));
    await waitFor(() => expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument());

    // WHEN: User submits the form (data is pre-filled and valid)
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Form closes and detail view is shown again
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-edit-form')).not.toBeInTheDocument();
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });
  });
});
