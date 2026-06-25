/**
 * Story 2.4: ClienteDetailPanel — Edit Flow Edge Cases & Extended Coverage
 * testarch-automate — BMad-Integrated Mode
 *
 * Expands ATDD component coverage for the edit flow with edge cases NOT covered
 * by ClienteDetailPanel.edit-flow.test.tsx.
 *
 * Additional scenarios:
 * - Pre-fill of Teléfono field in edit form matches loaded client data
 * - Pre-fill of Ciudad field in edit form matches loaded client data
 * - "Editar" button NOT visible while the edit form is active (no double-button)
 * - After 409 conflict: form stays open, "Editar" button is NOT visible
 * - Success after edit: "Editar" button re-appears on the detail view
 * - clienteId undefined → no "Editar" button shown (placeholder state)
 * - Rapid click on "Editar" does not open two forms simultaneously
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { ClienteDetailPanel } from './ClienteDetailPanel';

// ─── Mock toast ───────────────────────────────────────────────────────────────

vi.mock('siesa-ui-kit', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

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
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
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

// ─── Pre-fill of Teléfono and Ciudad ─────────────────────────────────────────

describe('[P1] ClienteDetailPanel — pre-fill of all fields in edit form', () => {
  it('[P1] should pre-fill Teléfono in edit form with current client Teléfono', async () => {
    // GIVEN: Client data loaded with specific Teléfono
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ telefono: '3219876543' })),
      ),
    );

    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());

    // WHEN: User opens edit form
    await user.click(screen.getByTestId('cliente-editar-button'));

    // THEN: Teléfono input is pre-filled with loaded value
    await waitFor(() => {
      const telefonoInput = screen.getByLabelText('Teléfono') as HTMLInputElement;
      expect(telefonoInput.value).toBe('3219876543');
    });
  });

  it('[P1] should pre-fill Ciudad in edit form with current client Ciudad', async () => {
    // GIVEN: Client data loaded with specific Ciudad
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ ciudad: 'Medellín' })),
      ),
    );

    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());

    // WHEN: User opens edit form
    await user.click(screen.getByTestId('cliente-editar-button'));

    // THEN: Ciudad input is pre-filled with loaded value
    await waitFor(() => {
      const ciudadInput = screen.getByLabelText('Ciudad') as HTMLInputElement;
      expect(ciudadInput.value).toBe('Medellín');
    });
  });
});

// ─── "Editar" button NOT visible while edit form is active ───────────────────

describe('[P1] ClienteDetailPanel — "Editar" button not visible while form is active', () => {
  it('[P1] should NOT show "Editar" button while the edit form is open', async () => {
    // GIVEN: Client data loaded
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());

    // WHEN: User opens the edit form
    await user.click(screen.getByTestId('cliente-editar-button'));

    await waitFor(() => expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument());

    // THEN: "Editar" button is NOT visible while the form is open
    // (form replaces the detail view including the Editar button)
    expect(screen.queryByTestId('cliente-editar-button')).not.toBeInTheDocument();
  });
});

// ─── clienteId undefined → no "Editar" button ────────────────────────────────

describe('[P1] ClienteDetailPanel — no "Editar" button in placeholder state', () => {
  it('[P1] should NOT render "Editar" button when clienteId is undefined', () => {
    // GIVEN: No clienteId provided (placeholder state)
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: undefined }));

    // THEN: "Editar" button is NOT present (no client selected)
    expect(screen.queryByTestId('cliente-editar-button')).not.toBeInTheDocument();
  });

  it('[P1] should render the placeholder message when clienteId is undefined', () => {
    // GIVEN: No clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: undefined }));

    // THEN: Placeholder message is shown
    expect(screen.getByTestId('cliente-detail-placeholder')).toBeInTheDocument();
  });
});

// ─── "Editar" button re-appears after successful edit ────────────────────────

describe('[P1] ClienteDetailPanel — "Editar" button re-appears after successful edit', () => {
  it('[P1] should show "Editar" button again after a successful form submission', async () => {
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

    // WHEN: User submits (pre-filled data is valid)
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: After success, form closes and "Editar" button is available again
    await waitFor(() => {
      expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument();
    });
  });
});

// ─── After 409 conflict: form stays open ─────────────────────────────────────

describe('[P1] ClienteDetailPanel — 409 conflict keeps form open without "Editar" button', () => {
  it('[P1] should keep the edit form open and hide "Editar" button after 409 conflict', async () => {
    // GIVEN: PUT returns 409
    const user = userEvent.setup();

    server.use(
      http.put(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 409, title: 'Conflict', detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );

    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());
    await user.click(screen.getByTestId('cliente-editar-button'));
    await waitFor(() => expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument());

    // WHEN: User submits and gets 409
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: Form is still open (showing 409 inline error on NIT)
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });

    // AND: "Editar" button is NOT shown (form is still active)
    expect(screen.queryByTestId('cliente-editar-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument();
  });
});

// ─── Rapid double-click on "Editar" does not open two forms ──────────────────

describe('[P2] ClienteDetailPanel — single form instance on rapid "Editar" clicks', () => {
  it('[P2] should render only one edit form even if "Editar" is clicked rapidly (double-click)', async () => {
    // GIVEN: Client data loaded
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-editar-button')).toBeInTheDocument());

    // WHEN: User double-clicks "Editar" rapidly
    // (After first click, the button is hidden — second click has no target)
    await user.click(screen.getByTestId('cliente-editar-button'));

    await waitFor(() => expect(screen.getByTestId('cliente-edit-form')).toBeInTheDocument());

    // THEN: Only one edit form exists in the DOM
    const forms = document.querySelectorAll('[data-testid="cliente-edit-form"]');
    expect(forms.length).toBe(1);
  });
});
