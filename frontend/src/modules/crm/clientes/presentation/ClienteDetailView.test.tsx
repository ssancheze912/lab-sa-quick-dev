/**
 * Component Tests — ClienteDetailView (Story 2.2)
 * RED phase: all tests fail until ClienteDetailView component is implemented.
 *
 * Acceptance Criteria covered:
 *   AC-1: right panel shows Nombre, NIT/RUC, Teléfono, Ciudad when client is selected
 *   AC-2: component renders correct data when mounted with a valid clienteId
 *   AC-3: "Cliente no encontrado." message shown on 404 — no crash or blank screen
 *
 * Test matrix (test-design-epic-2.md — Story 2.2):
 *   C-01 — Renders skeleton while loading (P0)
 *   C-02 — Renders all four fields (Nombre, NIT/RUC, Teléfono, Ciudad) on success (P0)
 *   C-03 — Renders "Cliente no encontrado." on 404 (P2)
 *   C-04 — Renders <ErrorPanel> with "Reintentar" on non-404 error (P1)
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { server } from '../../../../../test/mocks/server';
import { clienteFactory } from '../../../../../test/factories/cliente.factory';

// SUT — does NOT exist yet; import will fail at compile time (RED phase)
import { ClienteDetailView } from './ClienteDetailView';

// ---------------------------------------------------------------------------
// MSW lifecycle
// ---------------------------------------------------------------------------
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Test helper: wrap with QueryClientProvider + MemoryRouter
// ---------------------------------------------------------------------------
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// C-01 — Renders skeleton while loading (P0)
// ---------------------------------------------------------------------------
describe('ClienteDetailView — loading state', () => {
  it(
    'GIVEN the API call is in-flight '
    + 'WHEN ClienteDetailView is mounted '
    + 'THEN skeleton blocks are displayed while waiting for data',
    async () => {
      const cliente = clienteFactory();

      // Delay response to ensure loading state is visible
      server.use(
        http.get(`/api/v1/clientes/${cliente.id}`, async () => {
          await new Promise((r) => setTimeout(r, 200));
          return HttpResponse.json(cliente);
        }),
      );

      renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

      // THEN: skeleton is rendered (react-loading-skeleton renders aria-busy or specific test-id)
      // The root element with data-testid="cliente-detail-panel" is present
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();

      // THEN: no field labels shown while loading (data not yet present)
      expect(screen.queryByText('Detail Corp')).not.toBeInTheDocument();
    },
  );
});

// ---------------------------------------------------------------------------
// C-02 — Renders all four fields (Nombre, NIT/RUC, Teléfono, Ciudad) on success (P0)
// ---------------------------------------------------------------------------
describe('ClienteDetailView — success state', () => {
  it(
    'GIVEN the API returns a valid ClienteDto '
    + 'WHEN ClienteDetailView is mounted with a valid clienteId '
    + 'THEN all four fields (Nombre, NIT/RUC, Teléfono, Ciudad) are displayed with Spanish labels',
    async () => {
      const cliente = clienteFactory({
        nombre: 'Acme Detail SA',
        nit: '900456789',
        telefono: '3005551234',
        ciudad: 'Barranquilla',
      });

      server.use(
        http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      );

      renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

      // THEN: root panel is present
      await waitFor(() => {
        expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
      });

      // THEN: Nombre field and value visible
      expect(screen.getByText('Nombre')).toBeInTheDocument();
      expect(screen.getByText('Acme Detail SA')).toBeInTheDocument();

      // THEN: NIT/RUC field and value visible
      expect(screen.getByText('NIT/RUC')).toBeInTheDocument();
      expect(screen.getByText('900456789')).toBeInTheDocument();

      // THEN: Teléfono field and value visible
      expect(screen.getByText('Teléfono')).toBeInTheDocument();
      expect(screen.getByText('3005551234')).toBeInTheDocument();

      // THEN: Ciudad field and value visible
      expect(screen.getByText('Ciudad')).toBeInTheDocument();
      expect(screen.getByText('Barranquilla')).toBeInTheDocument();
    },
  );
});

// ---------------------------------------------------------------------------
// C-03 — Renders "Cliente no encontrado." on 404 (P2)
// ---------------------------------------------------------------------------
describe('ClienteDetailView — 404 not found state', () => {
  it(
    'GIVEN the API returns 404 for the provided clienteId '
    + 'WHEN ClienteDetailView is mounted '
    + 'THEN the message "Cliente no encontrado." is displayed — no crash or blank screen',
    async () => {
      const unknownId = '00000000-0000-0000-0000-888888888888';

      server.use(
        http.get(`/api/v1/clientes/${unknownId}`, () =>
          HttpResponse.json(
            { status: 404, title: 'Not Found', detail: 'Cliente no encontrado.' },
            { status: 404 },
          ),
        ),
      );

      renderWithProviders(<ClienteDetailView clienteId={unknownId} />);

      // THEN: "Cliente no encontrado." message is shown in the right panel
      await waitFor(() => {
        expect(screen.getByText('Cliente no encontrado.')).toBeInTheDocument();
      });

      // THEN: root panel is still rendered (no crash/blank screen)
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    },
  );
});

// ---------------------------------------------------------------------------
// C-04 — Renders <ErrorPanel> with "Reintentar" on non-404 error (P1)
// ---------------------------------------------------------------------------
describe('ClienteDetailView — non-404 error state', () => {
  it(
    'GIVEN the API returns a 500 server error '
    + 'WHEN ClienteDetailView is mounted '
    + 'THEN an ErrorPanel is displayed with a "Reintentar" button',
    async () => {
      const cliente = clienteFactory();

      server.use(
        http.get(`/api/v1/clientes/${cliente.id}`, () =>
          HttpResponse.json(
            { title: 'Internal Server Error', status: 500 },
            { status: 500 },
          ),
        ),
      );

      renderWithProviders(<ClienteDetailView clienteId={cliente.id} />);

      // THEN: ErrorPanel is shown (data-testid="error-panel")
      await waitFor(() => {
        expect(screen.getByTestId('error-panel')).toBeInTheDocument();
      });

      // THEN: "Reintentar" button is present
      expect(
        screen.getByRole('button', { name: /reintentar/i }),
      ).toBeInTheDocument();
    },
  );
});
