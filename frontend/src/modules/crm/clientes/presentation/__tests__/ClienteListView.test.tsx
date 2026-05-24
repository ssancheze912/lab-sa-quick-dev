/**
 * Story 2.1: Client List & Search
 * Component Tests — ClienteListView (RED Phase — ATDD)
 *
 * Test cases covered:
 *   TC-E2-P1-07 — Real-time search by Nombre and NIT/RUC, no extra API calls
 *   TC-E2-P1-08 — EmptyState when API returns []
 *   TC-E2-P1-09 — ErrorPanel + Reintentar on network failure
 *
 * Acceptance Criteria:
 *   AC1 — Left panel (280px) shows scrollable list with Nombre and NIT/RUC per item
 *   AC2 — Real-time filter by Nombre or NIT/RUC (case-insensitive substring), < 1s with 500 records
 *   AC3 — EmptyState component shown when no clients exist
 *   AC4 — ErrorPanel with "Reintentar" on backend unavailable; clicking Reintentar triggers new fetch
 *
 * Tests will FAIL until ClienteListView, EmptyState, and ErrorPanel are implemented.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import React from 'react';
import { ClienteListView } from '../ClienteListView';
import {
  handleGetClientesSuccess,
  handleGetClientesEmpty,
  handleGetClientesNetworkError,
  FIVE_CLIENTES,
  buildClienteDto,
} from '../../../../../tests/handlers/clienteHandlers';

// ─── MSW server setup ────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Test wrapper ─────────────────────────────────────────────────────────────

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
  return render(
    React.createElement(QueryClientProvider, { client: qc }, ui),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-07: Real-time search by Nombre and NIT/RUC — no extra API calls
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P1-07: Real-time search', () => {
  test('Given 5 clients, should render all 5 client items on initial load', async () => {
    // GIVEN: MSW returns 5 clients
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    // WHEN: data loads
    // THEN: 5 items are visible
    await waitFor(() => {
      const items = screen.getAllByTestId(/^client-item-/);
      expect(items).toHaveLength(5);
    });
  });

  test('Given 5 clients, typing "Alpha" should filter list to matching items only', async () => {
    // GIVEN: MSW returns 5 clients — only "Empresa Alpha SA" matches "Alpha"
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // WHEN: user types "Alpha" in search field
    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, 'Alpha');

    // THEN: only the matching client is shown
    await waitFor(() => {
      const items = screen.getAllByTestId(/^client-item-/);
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Empresa Alpha SA');
    });
  });

  test('Given filtered results, clearing search restores all 5 clients', async () => {
    // GIVEN: 5 clients loaded and "Alpha" typed
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, 'Alpha');

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(1);
    });

    // WHEN: user clears the search field
    await userEvent.clear(searchInput);

    // THEN: all 5 clients are restored
    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });
  });

  test('Given 5 clients, searching by NIT substring "900100001" should filter to matching client', async () => {
    // GIVEN: 5 clients where only "Empresa Alpha SA" has NIT "900100001-1"
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // WHEN: user types NIT substring
    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, '900100001');

    // THEN: only the matching client is shown
    await waitFor(() => {
      const items = screen.getAllByTestId(/^client-item-/);
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Empresa Alpha SA');
    });
  });

  test('Search should be case-insensitive', async () => {
    // GIVEN: client with Nombre "Empresa Alpha SA"
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // WHEN: user types lowercase "alpha"
    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, 'alpha');

    // THEN: "Empresa Alpha SA" is still matched
    await waitFor(() => {
      const items = screen.getAllByTestId(/^client-item-/);
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Empresa Alpha SA');
    });
  });

  test('Search should NOT trigger additional GET /api/v1/clientes API calls during typing', async () => {
    // GIVEN: API is intercepted, tracking call count
    let apiCallCount = 0;
    server.use(
      http.get('http://localhost:5000/api/v1/clientes', () => {
        apiCallCount++;
        return HttpResponse.json(FIVE_CLIENTES);
      }),
    );

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    const initialCallCount = apiCallCount;

    // WHEN: user types 5 characters in search (5 keystrokes)
    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, 'Alpha');

    // THEN: no additional API calls were made during typing
    expect(apiCallCount).toBe(initialCallCount);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-08: EmptyState displayed when API returns []
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P1-08: EmptyState when no clients exist', () => {
  test('Given API returns [], should render EmptyState component', async () => {
    // GIVEN: MSW returns empty array
    server.use(handleGetClientesEmpty());

    renderWithProviders(<ClienteListView />);

    // WHEN: data loads
    // THEN: EmptyState is visible
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  test('Given API returns [], should NOT render any client list items', async () => {
    // GIVEN: MSW returns empty array
    server.use(handleGetClientesEmpty());

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // THEN: no client items are rendered
    expect(screen.queryAllByTestId(/^client-item-/)).toHaveLength(0);
  });

  test('Given API returns [], EmptyState should show Spanish guidance message', async () => {
    // GIVEN: MSW returns empty array
    server.use(handleGetClientesEmpty());

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // THEN: message guides user to create first client (in Spanish)
    const emptyState = screen.getByTestId('empty-state');
    expect(emptyState).toHaveTextContent(/no hay clientes/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-09: ErrorPanel + Reintentar on network failure
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — TC-E2-P1-09: ErrorPanel on fetch failure', () => {
  test('Given network error, should render ErrorPanel instead of list', async () => {
    // GIVEN: MSW returns a network error
    server.use(handleGetClientesNetworkError());

    renderWithProviders(<ClienteListView />);

    // WHEN: fetch fails
    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  test('Given network error, should render "Reintentar" button in ErrorPanel', async () => {
    // GIVEN: MSW returns a network error
    server.use(handleGetClientesNetworkError());

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // THEN: "Reintentar" button is present
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toHaveTextContent(/reintentar/i);
  });

  test('Given network error, should NOT render client list items', async () => {
    // GIVEN: MSW returns a network error
    server.use(handleGetClientesNetworkError());

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // THEN: no client items are in the DOM
    expect(screen.queryAllByTestId(/^client-item-/)).toHaveLength(0);
  });

  test('Given network error and clicking Reintentar, should reload and show client list', async () => {
    // GIVEN: first request fails with network error
    server.use(handleGetClientesNetworkError());

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // WHEN: MSW is updated to return success and user clicks "Reintentar"
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    const retryButton = screen.getByTestId('retry-button');
    await userEvent.click(retryButton);

    // THEN: client list loads successfully
    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // AND: ErrorPanel is no longer visible
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Panel width and scrollability
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — AC1: Panel width and structure', () => {
  test('Should render a list panel with data-testid "clientes-list-panel"', async () => {
    // GIVEN: API returns clients
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
    });
  });

  test('Each client item should show Nombre and NIT/RUC text', async () => {
    // GIVEN: 5 clients including "Empresa Alpha SA" with NIT "900100001-1"
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // THEN: each item shows at minimum Nombre and NIT
    const alphaItem = screen.getByTestId('client-item-11111111-0000-0000-0000-000000000001');
    expect(alphaItem).toHaveTextContent('Empresa Alpha SA');
    expect(alphaItem).toHaveTextContent('900100001-1');
  });

  test('Search input should have aria-label for accessibility (WCAG 2.1 AA)', async () => {
    // GIVEN: view is rendered
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
    });

    // THEN: search input has an accessible label in Spanish
    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    expect(searchInput).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton state
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — Loading skeleton state', () => {
  test('While loading, should show skeleton placeholder and not the client list', async () => {
    // GIVEN: API call is delayed to observe loading state
    let resolveHandler!: () => void;
    const delayPromise = new Promise<void>((resolve) => {
      resolveHandler = resolve;
    });

    server.use(
      http.get('http://localhost:5000/api/v1/clientes', async () => {
        await delayPromise;
        return HttpResponse.json(FIVE_CLIENTES);
      }),
    );

    renderWithProviders(<ClienteListView />);

    // THEN: while loading, skeleton is visible
    expect(screen.getByLabelText(/cargando clientes/i)).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^client-item-/)).toHaveLength(0);

    // Cleanup: resolve the pending request
    resolveHandler();
    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });
  });
});
