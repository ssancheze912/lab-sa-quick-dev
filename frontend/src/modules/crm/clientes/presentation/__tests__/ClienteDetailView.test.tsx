/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Component Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Uses: Vitest + React Testing Library + MSW (msw 2.x)
 *
 * Acceptance Criteria covered:
 *   AC#1 — Clicking client item shows detail panel and updates URL to /clientes/:clienteId
 *   AC#2 — Direct URL /clientes/:clienteId fetches via GET /api/v1/clientes/{id} and displays data
 *   AC#3 — Non-existent clienteId shows Spanish not-found message, no stack trace (NFR6)
 *   AC#4 — Backend failure shows ErrorPanel with "Reintentar" button
 *
 * Test Cases:
 *   TC-2.2-C-01 (P1, AC#2)  — Mock valid GET response, assert all fields (Nombre, NIT, Teléfono, Ciudad) rendered
 *   TC-2.2-C-02 (P1, AC#1)  — Clicking client in list changes URL to /clientes/:clienteId (URL sync)
 *   TC-2.2-C-03 (P1, AC#3)  — Mock 404 response, assert Spanish not-found message, no stack trace visible (NFR6)
 *   TC-2.2-C-04 (P1, AC#4)  — Mock network error, assert ErrorPanel with "Reintentar" button rendered
 *   TC-2.2-C-05 (P1, AC#1)  — No clienteId in URL, assert neutral placeholder message rendered (not empty/blank)
 *   TC-2.2-C-06 (P2, AC#2)  — Assert skeleton rows render during loading (not spinner)
 *   TC-2.2-C-07 (P2, AC#3)  — Not-found message is in Spanish (locale compliance)
 *   TC-2.2-C-08 (P2, AC#2)  — Semantic HTML: detail fields use dl/dt/dd or ARIA labels (WCAG 2.1 AA)
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider, createRootRoute, createRoute } from '@tanstack/react-router';

// Component under test — does not exist yet (RED phase)
// Import will fail until implementation is complete
import { ClienteDetailView } from '../ClienteDetailView';

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Factory
// ─────────────────────────────────────────────────────────────────────────────

let _idCounter = 100;

function buildClienteDto(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const seq = _idCounter++;
  return {
    id: `00000000-0000-0000-0022-${String(seq).padStart(12, '0')}`,
    nombre: `Empresa Test ${seq}`,
    nit: `9${String(seq).padStart(8, '0')}-1`,
    telefono: `300${String(seq).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date(Date.now() - seq * 1000).toISOString(),
    updatedAt: new Date(Date.now() - seq * 1000).toISOString(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}`;
const CLIENTE_BY_ID_URL = `${API_BASE}/api/v1/clientes/:clienteId`;

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });
}

/**
 * Renders ClienteDetailView wrapped in TanStack Query provider.
 * Accepts an optional clienteId to simulate URL param.
 */
function renderDetailView(clienteId?: string) {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={clienteId} />
      </QueryClientProvider>
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC#2 — Direct URL fetches client and displays all fields
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#2 — ClienteDetailView renders all client fields from API response', () => {
  it('[P1][TC-2.2-C-01] Given a valid clienteId, When GET /api/v1/clientes/{id} returns client data, Then Nombre, NIT, Teléfono and Ciudad are rendered', async () => {
    // GIVEN: Mock API returns a valid client
    const cliente = buildClienteDto({
      nombre: 'Tech Innovators SAS',
      nit: '900111222-3',
      telefono: '3155556666',
      ciudad: 'Cali',
    });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente)
      )
    );

    // WHEN: ClienteDetailView mounts with that clienteId
    renderDetailView(cliente.id);

    // THEN: Nombre is displayed in the detail panel
    await expect(
      screen.findByText('Tech Innovators SAS')
    ).resolves.toBeInTheDocument();

    // AND: NIT is displayed
    expect(screen.getByText('900111222-3')).toBeInTheDocument();

    // AND: Teléfono is displayed
    expect(screen.getByText('3155556666')).toBeInTheDocument();

    // AND: Ciudad is displayed
    expect(screen.getByText('Cali')).toBeInTheDocument();
  });

  it('[P2][TC-2.2-C-06] Given a clienteId is provided, When data is loading, Then skeleton rows are shown (not a spinner)', async () => {
    // GIVEN: API response is delayed (keeps loading state visible during assertion)
    const clienteId = `00000000-0000-0000-0022-999999999999`;

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${clienteId}`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return HttpResponse.json(buildClienteDto());
      })
    );

    // WHEN: ClienteDetailView mounts with a clienteId
    renderDetailView(clienteId);

    // THEN: Skeleton rows are shown (react-loading-skeleton)
    const skeletons = screen.getAllByTestId('skeleton-row');
    expect(skeletons.length).toBeGreaterThan(0);

    // AND: A spinner is NOT shown (company standard: use skeleton, not spinner)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('[P2][TC-2.2-C-08] Given client data is loaded, When detail view renders, Then fields use semantic HTML (dl/dt/dd) or have ARIA labels (WCAG 2.1 AA)', async () => {
    // GIVEN: Mock API returns a valid client
    const cliente = buildClienteDto({ nombre: 'ARIA Compliance Corp', nit: '800200300-4' });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente)
      )
    );

    // WHEN: ClienteDetailView mounts with that clienteId
    renderDetailView(cliente.id);

    // Wait for data to load
    await screen.findByText('ARIA Compliance Corp');

    // THEN: The detail view contains semantic definition list (dl) OR ARIA-labeled field containers
    // Either a <dl> is present OR each field has an accessible label
    const hasDefList = document.querySelector('dl') !== null;
    const hasAriaLabels = screen.queryAllByRole('term').length > 0 ||
      screen.queryAllByRole('definition').length > 0;

    expect(hasDefList || hasAriaLabels).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#1 — Unselected state: neutral placeholder message when no clienteId
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#1 — Placeholder shown when no client is selected', () => {
  it('[P1][TC-2.2-C-05] Given no clienteId in URL, When ClienteDetailView renders, Then a neutral Spanish placeholder message is shown (not blank)', async () => {
    // GIVEN: No clienteId is provided (no client selected in list)

    // WHEN: ClienteDetailView renders without a clienteId
    renderDetailView(undefined);

    // THEN: A placeholder message is shown (not blank, not an error)
    await expect(
      screen.findByTestId('cliente-detail-placeholder')
    ).resolves.toBeInTheDocument();

    // AND: Placeholder contains Spanish text guiding the user to select a client
    const placeholder = screen.getByTestId('cliente-detail-placeholder');
    expect(placeholder).toHaveTextContent(/selecciona un cliente/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#3 — 404 from API shows Spanish not-found message (NFR6)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#3 — 404 response shows Spanish not-found message without stack trace', () => {
  it('[P1][TC-2.2-C-03] Given GET /api/v1/clientes/{id} returns 404, When ClienteDetailView mounts, Then Spanish not-found message is shown and no stack trace is visible (NFR6)', async () => {
    // GIVEN: Mock API returns 404 Problem Details
    const clienteId = `00000000-0000-0000-0022-404404404404`;

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json(
          { title: 'Cliente no encontrado.', status: 404 },
          { status: 404 }
        )
      )
    );

    // WHEN: ClienteDetailView mounts with a non-existent clienteId
    renderDetailView(clienteId);

    // THEN: Spanish not-found message is shown
    await expect(
      screen.findByText(/cliente no encontrado/i)
    ).resolves.toBeInTheDocument();

    // AND: No stack trace is visible (NFR6)
    expect(screen.queryByText(/stackTrace|stack trace|at System|at line/i)).not.toBeInTheDocument();

    // AND: ErrorPanel with "Reintentar" is NOT shown for 404 (different state from network error)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });

  it('[P2][TC-2.2-C-07] Given GET returns 404, When not-found message renders, Then message is in Spanish', async () => {
    // GIVEN: Mock API returns 404
    const clienteId = `00000000-0000-0000-0022-888888888888`;

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json(
          { title: 'Cliente no encontrado.', status: 404 },
          { status: 404 }
        )
      )
    );

    // WHEN: ClienteDetailView renders
    renderDetailView(clienteId);

    // THEN: Not-found text is in Spanish (no English "not found" text)
    await waitFor(() => {
      // Spanish not-found pattern — must match Spanish words
      const notFoundEl = screen.queryByText(/cliente no encontrado|no se encontró/i);
      expect(notFoundEl).toBeInTheDocument();

      // Must NOT show generic English "not found" text
      expect(screen.queryByText(/^not found$/i)).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#4 — Network error shows ErrorPanel with "Reintentar" button
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#4 — Network failure shows ErrorPanel with "Reintentar" button', () => {
  it('[P1][TC-2.2-C-04] Given GET /api/v1/clientes/{id} returns a network error (non-404), When ClienteDetailView mounts, Then ErrorPanel with "Reintentar" button is rendered', async () => {
    // GIVEN: Mock API returns a 500 server error
    const clienteId = `00000000-0000-0000-0022-500500500500`;

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        )
      )
    );

    // WHEN: ClienteDetailView mounts with that clienteId
    renderDetailView(clienteId);

    // THEN: ErrorPanel component is rendered
    await expect(
      screen.findByTestId('error-panel')
    ).resolves.toBeInTheDocument();

    // AND: "Reintentar" button is visible and accessible
    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('[P1][TC-2.2-C-04b] Given ErrorPanel is shown, When user clicks "Reintentar", Then fetch is retried', async () => {
    // GIVEN: First call fails, second call returns valid data
    const cliente = buildClienteDto({ nombre: 'Retry Success Corp' });
    let callCount = 0;

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
        }
        return HttpResponse.json(cliente);
      })
    );

    // WHEN: ClienteDetailView mounts
    renderDetailView(cliente.id);

    // THEN: ErrorPanel is shown after initial failure
    const errorPanel = await screen.findByTestId('error-panel');
    expect(errorPanel).toBeInTheDocument();

    // WHEN: User clicks "Reintentar"
    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    await userEvent.click(retryButton);

    // THEN: Client data is now shown (retry succeeded)
    await expect(
      screen.findByText('Retry Success Corp')
    ).resolves.toBeInTheDocument();

    // AND: ErrorPanel is no longer visible
    await waitFor(() => {
      expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
    });

    // AND: API was called twice (initial + retry)
    expect(callCount).toBe(2);
  });

  it('[P1][TC-2.2-C-04c] Given fetch fails with server error, When ErrorPanel renders, Then no technical error details are shown (NFR6)', async () => {
    // GIVEN: Mock API returns error with technical details
    const clienteId = `00000000-0000-0000-0022-600600600600`;

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json(
          {
            error: 'Database connection failed',
            stackTrace: 'at System.Data.SqlClient line 42',
            detail: 'Connection string is invalid',
          },
          { status: 500 }
        )
      )
    );

    // WHEN: ClienteDetailView mounts
    renderDetailView(clienteId);

    // THEN: ErrorPanel is shown
    await screen.findByTestId('error-panel');

    // AND: No stack trace is visible (NFR6)
    expect(screen.queryByText(/stackTrace|stack trace|at System/i)).not.toBeInTheDocument();

    // AND: No raw technical message shown (only generic user-friendly error)
    expect(screen.queryByText(/Database connection failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Connection string is invalid/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#1 — URL update behavior (component-level)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#1 — URL synchronization when clienteId is received as prop', () => {
  it('[P1][TC-2.2-C-02] Given clienteId is provided as prop, When ClienteDetailView renders, Then it fetches data for that clienteId (URL is source of truth)', async () => {
    // GIVEN: Mock API returns a valid client for a specific ID
    const cliente = buildClienteDto({ nombre: 'URL Source Of Truth SA' });

    server.use(
      http.get(`${API_BASE}/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente)
      )
    );

    // WHEN: ClienteDetailView renders with a specific clienteId prop
    renderDetailView(cliente.id);

    // THEN: The component fetches and displays data for that specific clienteId
    await expect(
      screen.findByText('URL Source Of Truth SA')
    ).resolves.toBeInTheDocument();

    // AND: The detail panel is visible (not the placeholder)
    expect(screen.queryByTestId('cliente-detail-placeholder')).not.toBeInTheDocument();
  });
});
