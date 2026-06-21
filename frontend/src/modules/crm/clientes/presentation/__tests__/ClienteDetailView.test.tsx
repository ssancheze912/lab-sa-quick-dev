/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * Component Tests — RTL + MSW
 *
 * Acceptance Criteria covered:
 *   AC#1 — Right panel shows client details: Nombre, NIT/RUC, Teléfono, Ciudad
 *   AC#2 — Deep link: direct URL /clientes/:clienteId fetches from API
 *   AC#3 — 404 response → Spanish not-found message, no stack trace (NFR6)
 *   AC#4 — Network error → ErrorPanel with "Reintentar" button
 *
 * Test Cases:
 *   TC-2.2-C-01 (P1): Mock valid GET response, assert all fields rendered
 *   TC-2.2-C-02 (P1): Placeholder shown when no clienteId (empty/unselected)
 *   TC-2.2-C-03 (P1): Mock 404 response, assert Spanish not-found message, no stack trace
 *   TC-2.2-C-04 (P1): Mock network error, assert ErrorPanel with "Reintentar"
 *   TC-2.2-C-05 (P1): Skeleton rows rendered during loading (not spinner)
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClienteDetailView } from '../ClienteDetailView';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const mockCliente = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Constructora del Valle SA',
  nit: '900456789-3',
  telefono: '+573157894561',
  ciudad: 'Cali',
  createdAt: '2026-01-15T10:00:00+00:00',
  updatedAt: '2026-01-15T10:00:00+00:00',
};

const server = setupServer(
  http.get(`${BASE_URL}/api/v1/clientes/:id`, ({ params }) => {
    if (params.id === mockCliente.id) {
      return HttpResponse.json(mockCliente);
    }
    return HttpResponse.json(
      { title: 'Cliente no encontrado.', status: 404 },
      { status: 404 }
    );
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-01: All fields rendered on valid response
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#1 — ClienteDetailView renders all client fields', () => {
  it('[P1][TC-2.2-C-01] Given valid clienteId, When component mounts, Then all fields are displayed', async () => {
    // GIVEN: API returns valid client
    renderWithProviders(<ClienteDetailView clienteId={mockCliente.id} />);

    // THEN: All required fields are visible
    await expect(screen.findByText('Constructora del Valle SA')).resolves.toBeInTheDocument();
    expect(screen.getByText('900456789-3')).toBeInTheDocument();
    expect(screen.getByText('+573157894561')).toBeInTheDocument();
    expect(screen.getByText('Cali')).toBeInTheDocument();
  });

  it('[P1][TC-2.2-C-01b] Given valid clienteId, When rendered, Then field labels are present in Spanish', async () => {
    renderWithProviders(<ClienteDetailView clienteId={mockCliente.id} />);

    await screen.findByText('Constructora del Valle SA');

    // Labels in Spanish
    expect(screen.getByText(/NIT\/RUC/i)).toBeInTheDocument();
    expect(screen.getByText(/Teléfono/i)).toBeInTheDocument();
    expect(screen.getByText(/Ciudad/i)).toBeInTheDocument();
  });

  it('[P1][TC-2.2-C-01c] Given rendered detail, When viewed, Then uses semantic dl/dt/dd markup (WCAG)', async () => {
    const { container } = renderWithProviders(
      <ClienteDetailView clienteId={mockCliente.id} />
    );

    await screen.findByText('Constructora del Valle SA');

    // WCAG: semantic definition list
    expect(container.querySelector('dl')).toBeInTheDocument();
    expect(container.querySelectorAll('dt').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('dd').length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-02: Placeholder shown when no clienteId
// ─────────────────────────────────────────────────────────────────────────────

describe('AC — Placeholder shown when no clienteId is selected', () => {
  it('[P1][TC-2.2-C-05] Given no clienteId, When component renders, Then neutral placeholder message is shown', () => {
    renderWithProviders(<ClienteDetailView clienteId={undefined} />);

    expect(
      screen.getByText(/Selecciona un cliente de la lista para ver su detalle/i)
    ).toBeInTheDocument();
  });

  it('[P1][TC-2.2-C-05b] Given no clienteId, When rendered, Then no error panel or loading skeleton is shown', () => {
    renderWithProviders(<ClienteDetailView clienteId={undefined} />);

    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-detail')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-03: 404 not-found message
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#3 — 404 response shows not-found message in Spanish (NFR6)', () => {
  it('[P1][TC-2.2-C-03] Given non-existent clienteId, When API returns 404, Then Spanish not-found message is shown', async () => {
    renderWithProviders(<ClienteDetailView clienteId="non-existent-id" />);

    await expect(
      screen.findByText(/Cliente no encontrado/i)
    ).resolves.toBeInTheDocument();
  });

  it('[P1][TC-2.2-C-03b] Given 404 response, When rendered, Then no stack trace is visible (NFR6)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json(
          {
            title: 'Cliente no encontrado.',
            status: 404,
            stackTrace: 'at SiesaAgents.Infrastructure line 42',
            detail: 'Entity not found in database',
          },
          { status: 404 }
        )
      )
    );

    renderWithProviders(<ClienteDetailView clienteId="any-id" />);

    await screen.findByText(/Cliente no encontrado/i);

    // NFR6: no stack trace visible
    expect(screen.queryByText(/stackTrace|stack trace|at SiesaAgents/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Entity not found in database/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-04: Network error → ErrorPanel with "Reintentar"
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#4 — Network error shows ErrorPanel with Reintentar', () => {
  it('[P1][TC-2.2-C-04] Given network failure, When component mounts, Then ErrorPanel with Reintentar is rendered', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );

    renderWithProviders(<ClienteDetailView clienteId={mockCliente.id} />);

    await expect(screen.findByTestId('error-panel')).resolves.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('[P1][TC-2.2-C-04b] Given ErrorPanel shown, When user clicks Reintentar, Then refetch is triggered', async () => {
    let callCount = 0;

    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Error' }, { status: 500 });
        }
        return HttpResponse.json(mockCliente);
      })
    );

    renderWithProviders(<ClienteDetailView clienteId={mockCliente.id} />);

    await screen.findByTestId('error-panel');
    const retryBtn = screen.getByRole('button', { name: /reintentar/i });

    await userEvent.click(retryBtn);

    // After retry, client data should appear
    await expect(
      screen.findByText('Constructora del Valle SA')
    ).resolves.toBeInTheDocument();
    expect(callCount).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-06: Skeleton rows during loading (not spinner)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC — Loading state shows skeleton (not spinner)', () => {
  it('[P2][TC-2.2-C-06] Given API loading, When component mounts, Then skeleton is shown, no spinner', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json(mockCliente);
      })
    );

    renderWithProviders(<ClienteDetailView clienteId={mockCliente.id} />);

    // Skeleton container is visible during load
    expect(screen.getByTestId('skeleton-detail')).toBeInTheDocument();

    // No spinner
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });
});
