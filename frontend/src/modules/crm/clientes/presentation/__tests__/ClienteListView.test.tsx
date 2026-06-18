/**
 * Component Tests — ClienteListView (Story 2.1)
 * RED phase: all tests fail until ClienteListView is implemented.
 *
 * Acceptance Criteria covered:
 *   AC-1: list panel shows scrollable list with Nombre + NIT/RUC per item
 *   AC-2: real-time search filter by Nombre or NIT/RUC
 *   AC-3: EmptyState when no clients exist
 *   AC-4: ErrorPanel with "Reintentar" button on backend failure; retry triggers refetch
 *
 * Test matrix (test-design-epic-2.md — Story 2.1):
 *   C-01 — Renders list of clients from API (P0, R-202)
 *   C-02 — Client-side search filter (P1)
 *   C-03 — EmptyState when query returns [] (P1)
 *   C-04 — ErrorPanel + "Reintentar" on MSW 500 error (P1, R-209)
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../../test/mocks/server';
import { clienteFactory } from '../../../../../test/factories/cliente.factory';

// SUT — does NOT exist yet; import will fail at compile time (RED phase)
import { ClienteListView } from '../ClienteListView';

// ---------------------------------------------------------------------------
// MSW lifecycle
// ---------------------------------------------------------------------------
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Test helper: wrap in QueryClientProvider with fresh client per test
// ---------------------------------------------------------------------------
function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Do not retry on failure — tests need predictable behavior
        staleTime: 0,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// C-01 — Renders list of clients when API returns data (P0)
// ---------------------------------------------------------------------------
describe('ClienteListView — AC-1: lista de clientes', () => {
  it(
    'GIVEN there are clients in the system '
    + 'WHEN the user navigates to /clientes '
    + 'THEN the list panel shows all clients with Nombre and NIT/RUC visible',
    async () => {
      // GIVEN: MSW returns 2 known clients
      const clienteA = clienteFactory({ nombre: 'Acme Corp', nit: '900111222' });
      const clienteB = clienteFactory({ nombre: 'Beta Ltda', nit: '900333444' });

      server.use(
        http.get('/api/v1/clientes', () => HttpResponse.json([clienteA, clienteB])),
      );

      // WHEN: component renders
      renderWithQuery(<ClienteListView />);

      // THEN: both client names appear in the list
      await waitFor(() => {
        expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
      });

      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Ltda')).toBeInTheDocument();
    },
  );

  it(
    'GIVEN clients exist '
    + 'WHEN the list renders '
    + 'THEN each item shows NIT/RUC alongside Nombre',
    async () => {
      // GIVEN: MSW returns 1 client with known NIT
      const cliente = clienteFactory({ nombre: 'Gamma SA', nit: '800555666' });
      server.use(
        http.get('/api/v1/clientes', () => HttpResponse.json([cliente])),
      );

      // WHEN: component renders
      renderWithQuery(<ClienteListView />);

      // THEN: the NIT is visible in the list item
      await waitFor(() => {
        expect(screen.getByText('800555666')).toBeInTheDocument();
      });
    },
  );
});

// ---------------------------------------------------------------------------
// C-02 — Real-time search filter by Nombre or NIT/RUC (P1)
// ---------------------------------------------------------------------------
describe('ClienteListView — AC-2: búsqueda en tiempo real', () => {
  it(
    'GIVEN the client list is loaded '
    + 'WHEN the user types in the search field '
    + 'THEN only clients whose Nombre matches the input are visible',
    async () => {
      // GIVEN: 3 clients, only one matches the query
      const clienteA = clienteFactory({ nombre: 'Acme Corp', nit: '100000001' });
      const clienteB = clienteFactory({ nombre: 'Beta Ltda', nit: '100000002' });
      const clienteC = clienteFactory({ nombre: 'Gamma SA',  nit: '100000003' });

      server.use(
        http.get('/api/v1/clientes', () =>
          HttpResponse.json([clienteA, clienteB, clienteC]),
        ),
      );

      renderWithQuery(<ClienteListView />);

      // Wait for list to populate
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
      });

      // WHEN: user types in search field
      const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i });
      await userEvent.type(searchInput, 'Beta');

      // THEN: only Beta Ltda is visible
      await waitFor(() => {
        expect(screen.getByText('Beta Ltda')).toBeInTheDocument();
        expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
        expect(screen.queryByText('Gamma SA')).not.toBeInTheDocument();
      });
    },
  );

  it(
    'GIVEN the client list is loaded '
    + 'WHEN the user searches by NIT/RUC '
    + 'THEN only the matching client is visible',
    async () => {
      // GIVEN: 2 clients with distinct NITs
      const clienteA = clienteFactory({ nombre: 'Delta Cia', nit: '999888777' });
      const clienteB = clienteFactory({ nombre: 'Epsilon SAS', nit: '111222333' });

      server.use(
        http.get('/api/v1/clientes', () =>
          HttpResponse.json([clienteA, clienteB]),
        ),
      );

      renderWithQuery(<ClienteListView />);

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
      });

      // WHEN: user searches by NIT of clienteA
      const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i });
      await userEvent.type(searchInput, '999888777');

      // THEN: only Delta Cia matches
      await waitFor(() => {
        expect(screen.getByText('Delta Cia')).toBeInTheDocument();
        expect(screen.queryByText('Epsilon SAS')).not.toBeInTheDocument();
      });
    },
  );
});

// ---------------------------------------------------------------------------
// C-03 — EmptyState when no clients exist (P1)
// ---------------------------------------------------------------------------
describe('ClienteListView — AC-3: estado vacío', () => {
  it(
    'GIVEN there are no clients in the system '
    + 'WHEN the user navigates to /clientes '
    + 'THEN an EmptyState component is displayed guiding the user to create the first client',
    async () => {
      // GIVEN: API returns empty array
      server.use(
        http.get('/api/v1/clientes', () => HttpResponse.json([])),
      );

      // WHEN: component renders
      renderWithQuery(<ClienteListView />);

      // THEN: EmptyState is shown with the expected message
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/No hay clientes registrados/i),
      ).toBeInTheDocument();
    },
  );
});

// ---------------------------------------------------------------------------
// C-04 — ErrorPanel with retry button on backend failure (P1, R-209)
// ---------------------------------------------------------------------------
describe('ClienteListView — AC-4: panel de error con reintento', () => {
  it(
    'GIVEN the backend is unavailable '
    + 'WHEN GET /api/v1/clientes returns 500 '
    + 'THEN ErrorPanel is displayed with a "Reintentar" button',
    async () => {
      // GIVEN: API returns 500
      server.use(
        http.get('/api/v1/clientes', () =>
          HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 }),
        ),
      );

      // WHEN: component renders
      renderWithQuery(<ClienteListView />);

      // THEN: ErrorPanel with "Reintentar" button is shown
      await waitFor(() => {
        expect(screen.getByTestId('error-panel')).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: /reintentar/i }),
      ).toBeInTheDocument();
    },
  );

  it(
    'GIVEN the ErrorPanel is visible '
    + 'WHEN the user clicks "Reintentar" '
    + 'THEN a new GET /api/v1/clientes request is triggered',
    async () => {
      // GIVEN: first call fails, second call succeeds
      let callCount = 0;
      const cliente = clienteFactory({ nombre: 'Recover Corp', nit: '777000111' });

      server.use(
        http.get('/api/v1/clientes', () => {
          callCount += 1;
          if (callCount === 1) {
            return HttpResponse.json(
              { title: 'Internal Server Error', status: 500 },
              { status: 500 },
            );
          }
          return HttpResponse.json([cliente]);
        }),
      );

      renderWithQuery(<ClienteListView />);

      // Wait for ErrorPanel
      await waitFor(() => {
        expect(screen.getByTestId('error-panel')).toBeInTheDocument();
      });

      // WHEN: user clicks "Reintentar"
      const retryButton = screen.getByRole('button', { name: /reintentar/i });
      await userEvent.click(retryButton);

      // THEN: API was called again and data eventually appears
      await waitFor(() => {
        expect(screen.getByText('Recover Corp')).toBeInTheDocument();
      });

      expect(callCount).toBeGreaterThanOrEqual(2);
    },
  );
});
