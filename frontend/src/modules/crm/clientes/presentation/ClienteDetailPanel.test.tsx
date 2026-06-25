/**
 * Story 2.2: ClienteDetailPanel component — Component Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: Detail panel renders Nombre, NIT/RUC, Teléfono, Ciudad when client is loaded
 * - AC4: 404 response shows "Cliente no encontrado" message (Spanish), not ErrorPanel
 * - AC5: Backend error (5xx/network) shows ErrorPanel with "Reintentar" button; clicking triggers refetch
 * - AC6: Loading state shows skeleton screen (react-loading-skeleton) — NOT a spinner
 * - AC7: No clienteId prop → placeholder "Selecciona un cliente para ver el detalle" is shown
 *
 * Framework: Vitest + React Testing Library + MSW (matching Story 2.1 patterns)
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// SUT — will fail until ClienteDetailPanel is implemented
import { ClienteDetailPanel } from './ClienteDetailPanel';

// Mock siesa-ui-kit toast (needed for ClienteForm in edit mode)
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
    createdAt: '2026-03-12T10:30:00Z',
    updatedAt: '2026-03-12T10:30:00Z',
    ...overrides,
  };
}

const server = setupServer(
  http.get(`${API_BASE}/:id`, () => HttpResponse.json(buildClienteDetail())),
  http.put(`${API_BASE}/:id`, () => HttpResponse.json(buildClienteDetail({ nombre: 'Empresa Actualizada S.A.' }))),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

// ─── AC7: Placeholder when no clienteId ───────────────────────────────────────

describe('AC7 — Placeholder when clienteId is undefined', () => {
  it('should render the placeholder text when clienteId is undefined', () => {
    // GIVEN: No clienteId is provided
    // WHEN: ClienteDetailPanel is rendered without a clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: undefined }));

    // THEN: Placeholder message is displayed in Spanish
    expect(
      screen.getByTestId('cliente-detail-placeholder'),
    ).toHaveTextContent('Selecciona un cliente para ver el detalle');
  });

  it('should not render client detail content when clienteId is undefined', () => {
    // GIVEN: No clienteId is provided
    // WHEN: ClienteDetailPanel is rendered without a clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: undefined }));

    // THEN: Client detail content section is not present
    expect(screen.queryByTestId('cliente-detail-content')).not.toBeInTheDocument();
  });

  it('should not make any API request when clienteId is undefined', async () => {
    // GIVEN: MSW server is configured but no request should reach it
    server.use(
      http.get(`${API_BASE}/:id`, () => {
        throw new Error('Detail API should not be called when clienteId is undefined');
      }),
    );

    // WHEN: ClienteDetailPanel is rendered without a clienteId
    // THEN: No fetch is triggered (enabled: false in useQuery)
    expect(() =>
      renderWithQuery(createElement(ClienteDetailPanel, { clienteId: undefined })),
    ).not.toThrow();
  });
});

// ─── AC6: Loading state — skeleton screen ─────────────────────────────────────

describe('AC6 — Skeleton screen during loading (not spinner)', () => {
  it('should display the skeleton screen while loading client detail', async () => {
    // GIVEN: API is slow (never resolves in this test window)
    server.use(
      http.get(`${API_BASE}/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return HttpResponse.json(buildClienteDetail());
      }),
    );

    // WHEN: ClienteDetailPanel is rendered with a clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: Skeleton screen is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument();
    });
  });

  it('should NOT render a spinner while loading client detail', async () => {
    // GIVEN: API is slow
    server.use(
      http.get(`${API_BASE}/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return HttpResponse.json(buildClienteDetail());
      }),
    );

    // WHEN: ClienteDetailPanel is rendered with a clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: No spinner is rendered (company standard: skeleton only)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});

// ─── AC1: Success state — all fields rendered ─────────────────────────────────

describe('AC1 — Client detail fields rendered on success', () => {
  it('should render the client Nombre in the detail panel', async () => {
    // GIVEN: API returns a client with a known Nombre
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ nombre: 'Inversiones Delta S.A.' })),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered with a valid clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: The Nombre is displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toHaveTextContent(
        'Inversiones Delta S.A.',
      );
    });
  });

  it('should render the client NIT/RUC in the detail panel', async () => {
    // GIVEN: API returns a client with a known NIT
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ nit: '800777333-5' })),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered with a valid clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: The NIT is displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toHaveTextContent('800777333-5');
    });
  });

  it('should render the client Telefono in the detail panel', async () => {
    // GIVEN: API returns a client with a known Teléfono
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ telefono: '3109876543' })),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered with a valid clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: The Teléfono is displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toHaveTextContent('3109876543');
    });
  });

  it('should render the client Ciudad in the detail panel', async () => {
    // GIVEN: API returns a client with a known Ciudad
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(buildClienteDetail({ ciudad: 'Cali' })),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered with a valid clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: The Ciudad is displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toHaveTextContent('Cali');
    });
  });

  it('should render Spanish field labels (Nombre, NIT/RUC, Teléfono, Ciudad)', async () => {
    // GIVEN: API returns a client
    // WHEN: ClienteDetailPanel is rendered with a valid clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: Spanish labels are present in the detail content
    await waitFor(() => {
      const content = screen.getByTestId('cliente-detail-content');
      expect(content).toHaveTextContent(/Nombre/i);
      expect(content).toHaveTextContent(/NIT/i);
      expect(content).toHaveTextContent(/Teléfono/i);
      expect(content).toHaveTextContent(/Ciudad/i);
    });
  });
});

// ─── AC4: 404 Not Found — "Cliente no encontrado" (not ErrorPanel) ────────────

describe('AC4 — 404 shows "Cliente no encontrado" message', () => {
  it('should display "Cliente no encontrado" when backend returns 404', async () => {
    // GIVEN: API returns 404 for the client ID
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Not Found',
            status: 404,
            detail: `Cliente con id ${KNOWN_ID} no encontrado.`,
          },
          { status: 404 },
        ),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered with the non-existent clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: The not-found message is displayed in Spanish
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toHaveTextContent(
        'Cliente no encontrado',
      );
    });
  });

  it('should NOT display ErrorPanel when backend returns 404', async () => {
    // GIVEN: API returns 404
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json({ status: 404, title: 'Not Found' }, { status: 404 }),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: ErrorPanel is NOT shown (404 has distinct UI from generic errors)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });
});

// ─── AC5: 5xx / network error — ErrorPanel with "Reintentar" ─────────────────

describe('AC5 — ErrorPanel with Reintentar on 5xx or network error', () => {
  it('should display ErrorPanel when backend returns 500', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 },
        ),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered with a clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  it('should display "Reintentar" button inside ErrorPanel on 5xx', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 },
        ),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered and ErrorPanel is shown
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeInTheDocument());

    // THEN: "Reintentar" button is present inside the ErrorPanel
    expect(screen.getByTestId('error-panel-retry-button')).toBeInTheDocument();
  });

  it('should trigger refetch and display client when "Reintentar" is clicked', async () => {
    // GIVEN: First call returns 500; second call returns client data
    let callCount = 0;
    server.use(
      http.get(`${API_BASE}/:id`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { status: 500, title: 'Internal Server Error' },
            { status: 500 },
          );
        }
        return HttpResponse.json(buildClienteDetail({ nombre: 'Empresa Recuperada S.A.' }));
      }),
    );

    // WHEN: User sees ErrorPanel and clicks Reintentar
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeInTheDocument());

    const retryButton = screen.getByTestId('error-panel-retry-button');
    await userEvent.click(retryButton);

    // THEN: Client detail is now shown after the successful refetch
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toHaveTextContent(
        'Empresa Recuperada S.A.',
      );
    });
  });

  it('should NOT display the 404 not-found message when backend returns 500', async () => {
    // GIVEN: API returns 500 (not 404)
    server.use(
      http.get(`${API_BASE}/:id`, () =>
        HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 },
        ),
      ),
    );

    // WHEN: ClienteDetailPanel is rendered
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeInTheDocument());

    // THEN: The not-found message is NOT shown
    expect(screen.queryByTestId('cliente-not-found')).not.toBeInTheDocument();
  });
});

// ─── Edit Flow (Story 2.4) ────────────────────────────────────────────────────

describe('Edit Flow — "Editar" button and form toggle', () => {
  it('should render "Editar" button when client data is loaded', async () => {
    // GIVEN: API returns client data
    // WHEN: ClienteDetailPanel is rendered with a valid clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: "Editar" button is visible after data loads
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /editar cliente/i })).toBeInTheDocument();
    });
  });

  it('should NOT render "Editar" button during skeleton loading state', async () => {
    // GIVEN: API is slow
    server.use(
      http.get(`${API_BASE}/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10_000));
        return HttpResponse.json(buildClienteDetail());
      }),
    );

    // WHEN: ClienteDetailPanel is rendered with a clienteId
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    // THEN: Skeleton is shown, "Editar" button is NOT present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /editar cliente/i })).not.toBeInTheDocument();
  });

  it('should show ClienteForm in edit mode with pre-filled data when "Editar" is clicked', async () => {
    // GIVEN: API returns client data
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });

    // WHEN: User clicks "Editar"
    await user.click(screen.getByRole('button', { name: /editar cliente/i }));

    // THEN: ClienteForm is shown with pre-filled data
    await waitFor(() => {
      expect(screen.getByRole('form', { name: /editar cliente/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Nombre')).toHaveValue('Empresa Ejemplo S.A.');
    expect(screen.getByLabelText('NIT/RUC')).toHaveValue('900123456-7');
    expect(screen.getByLabelText('Teléfono')).toHaveValue('6011234567');
    expect(screen.getByLabelText('Ciudad')).toHaveValue('Bogotá');
  });

  it('should hide the edit form and show detail view when "Cancelar" is clicked', async () => {
    // GIVEN: Edit form is open
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /editar cliente/i }));
    await waitFor(() => expect(screen.getByRole('form', { name: /editar cliente/i })).toBeInTheDocument());

    // WHEN: User clicks "Cancelar"
    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    // THEN: Detail view is shown again, form is gone
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });
    expect(screen.queryByRole('form', { name: /editar cliente/i })).not.toBeInTheDocument();
  });

  it('should close edit form and show detail view after successful update', async () => {
    // GIVEN: Edit form is open and PUT succeeds
    const user = userEvent.setup();
    renderWithQuery(createElement(ClienteDetailPanel, { clienteId: KNOWN_ID }));

    await waitFor(() => expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /editar cliente/i }));
    await waitFor(() => expect(screen.getByRole('form', { name: /editar cliente/i })).toBeInTheDocument());

    // WHEN: User submits the form
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    // THEN: After success, form is closed and detail view is shown
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-content')).toBeInTheDocument();
    });
    expect(screen.queryByRole('form', { name: /editar cliente/i })).not.toBeInTheDocument();
  });
});
