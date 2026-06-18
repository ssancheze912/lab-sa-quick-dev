/**
 * Component Tests — ClienteListView edge cases (Story 2.1 — Automate Expansion)
 *
 * Expands coverage beyond the ATDD tests with:
 *   - Loading skeleton state
 *   - Search clear restores full list
 *   - ARIA accessibility attributes
 *   - Search input placeholder text
 *   - Case-insensitive search in component context
 *
 * These tests cover UI interaction paths not present in the ATDD red-phase suite.
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterContextProvider } from '@tanstack/react-router';
import { http, HttpResponse } from 'msw';
import { server } from '../../../../../test/mocks/server';
import { clienteFactory } from '../../../../../test/factories/cliente.factory';
import { routeTree } from '../../../../../routeTree.gen';

import { ClienteListView } from '../ClienteListView';

// ---------------------------------------------------------------------------
// MSW lifecycle
// ---------------------------------------------------------------------------
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Router helper — required because ClienteListView uses <Link>
// ---------------------------------------------------------------------------
function createTestRouter() {
  return createRouter({
    routeTree,
    history: {
      subscribe: (_cb: () => void) => () => undefined,
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      createHref: (_location: { pathname: string }) => _location.pathname,
      block: vi.fn(),
      flush: vi.fn(),
      destroy: vi.fn(),
      notify: vi.fn(),
      location: {
        pathname: '/clientes',
        search: '',
        hash: '',
        state: {},
        key: 'default',
      },
      encodeLocation: (location: { pathname: string }) => location,
    },
  });
}

// ---------------------------------------------------------------------------
// Render helper — fresh QueryClient per test (no cross-test caching)
// ---------------------------------------------------------------------------
function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterContextProvider router={createTestRouter()}>
        {ui}
      </RouterContextProvider>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------
describe('ClienteListView — loading state', () => {
  it(
    'GIVEN the API has not yet responded '
    + 'WHEN the component is in loading state '
    + 'THEN the search input is rendered (panel is not blank)',
    async () => {
      // GIVEN: slow API response (never resolves in this test)
      server.use(
        http.get('/api/v1/clientes', async () => {
          await new Promise(() => {}); // hang indefinitely
        }),
      );

      renderWithQuery(<ClienteListView />);

      // THEN: search input is visible during loading
      const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i });
      expect(searchInput).toBeInTheDocument();
    },
  );
});

// ---------------------------------------------------------------------------
// Search clear restores full list
// ---------------------------------------------------------------------------
describe('ClienteListView — search clear restores full list', () => {
  it(
    'GIVEN the user has searched and filtered the list '
    + 'WHEN the user clears the search input '
    + 'THEN all clients are shown again',
    async () => {
      const clienteA = clienteFactory({ nombre: 'Acme Corp', nit: '100000001' });
      const clienteB = clienteFactory({ nombre: 'Beta Ltda', nit: '100000002' });
      const clienteC = clienteFactory({ nombre: 'Gamma SA', nit: '100000003' });

      server.use(
        http.get('/api/v1/clientes', () =>
          HttpResponse.json([clienteA, clienteB, clienteC]),
        ),
      );

      renderWithQuery(<ClienteListView />);

      // Wait for initial list to render
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
      });

      const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i });

      // WHEN: user types a filter that narrows list to 1
      await userEvent.type(searchInput, 'Acme');
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
      });

      // WHEN: user clears the search field
      await userEvent.clear(searchInput);

      // THEN: all 3 clients are visible again
      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
      });
    },
  );
});

// ---------------------------------------------------------------------------
// ARIA accessibility
// ---------------------------------------------------------------------------
describe('ClienteListView — accessibility attributes', () => {
  it(
    'GIVEN the component is rendered '
    + 'WHEN the DOM is inspected '
    + 'THEN the search input has aria-label="Buscar clientes" (WCAG 2.1 AA)',
    async () => {
      server.use(
        http.get('/api/v1/clientes', () => HttpResponse.json([])),
      );

      renderWithQuery(<ClienteListView />);

      // The aria-label must be present regardless of data state
      const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i });
      expect(searchInput).toHaveAttribute('aria-label', 'Buscar clientes');
    },
  );

  it(
    'GIVEN the component is rendered '
    + 'WHEN the DOM is inspected '
    + 'THEN the search input has the correct placeholder text',
    async () => {
      server.use(
        http.get('/api/v1/clientes', () => HttpResponse.json([])),
      );

      renderWithQuery(<ClienteListView />);

      const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i });
      expect(searchInput).toHaveAttribute('placeholder', 'Buscar por nombre o NIT/RUC...');
    },
  );
});

// ---------------------------------------------------------------------------
// Case-insensitive search in component context
// ---------------------------------------------------------------------------
describe('ClienteListView — case-insensitive search', () => {
  it(
    'GIVEN a client named "Acme Corp" '
    + 'WHEN the user types the query in uppercase "ACME" '
    + 'THEN the matching client is shown',
    async () => {
      const clienteA = clienteFactory({ nombre: 'Acme Corp', nit: '100000001' });
      const clienteB = clienteFactory({ nombre: 'Beta Ltda', nit: '100000002' });

      server.use(
        http.get('/api/v1/clientes', () =>
          HttpResponse.json([clienteA, clienteB]),
        ),
      );

      renderWithQuery(<ClienteListView />);

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
      });

      const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i });
      await userEvent.type(searchInput, 'ACME');

      await waitFor(() => {
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
        expect(screen.queryByText('Beta Ltda')).not.toBeInTheDocument();
      });
    },
  );
});

// ---------------------------------------------------------------------------
// EmptyState after search yields no results (different from initial empty)
// ---------------------------------------------------------------------------
describe('ClienteListView — empty state after no-match search', () => {
  it(
    'GIVEN the list has clients '
    + 'WHEN the user types a query that matches nothing '
    + 'THEN the EmptyState component is displayed',
    async () => {
      const clienteA = clienteFactory({ nombre: 'Acme Corp', nit: '100000001' });

      server.use(
        http.get('/api/v1/clientes', () => HttpResponse.json([clienteA])),
      );

      renderWithQuery(<ClienteListView />);

      await waitFor(() => {
        expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
      });

      const searchInput = screen.getByRole('searchbox', { name: /buscar clientes/i });
      await userEvent.type(searchInput, 'XXXXXNOEXISTXXXXX');

      // THEN: no items shown, empty state visible
      await waitFor(() => {
        expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    },
  );
});

// ---------------------------------------------------------------------------
// Error panel message text
// ---------------------------------------------------------------------------
describe('ClienteListView — error panel message text', () => {
  it(
    'GIVEN the API returns 500 '
    + 'WHEN the ErrorPanel is rendered '
    + 'THEN it displays the Spanish error message text',
    async () => {
      server.use(
        http.get('/api/v1/clientes', () =>
          HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 }),
        ),
      );

      renderWithQuery(<ClienteListView />);

      await waitFor(() => {
        expect(screen.getByTestId('error-panel')).toBeInTheDocument();
      });

      expect(
        screen.getByText(/No se pudo cargar la lista/i),
      ).toBeInTheDocument();
    },
  );
});
