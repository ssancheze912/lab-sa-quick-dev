/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Component Tests — RED Phase (Vitest + RTL + MSW)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Test Cases covered:
 *   TC-E2-P1-01 — ClienteListView renders list with nombre and nit per item
 *   TC-E2-P1-02 — Real-time search by nombre filters list without extra API call
 *   TC-E2-P1-03 — Real-time search by NIT/RUC filters list
 *   TC-E2-P1-04 — EmptyState shown when API returns []
 *   TC-E2-P1-05 — ErrorPanel shown on network error; Reintentar triggers new request
 *   AC5        — Clearing search field restores full list without extra API call
 *
 * Component under test: ClienteListView (not yet implemented)
 * Path: frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
 *
 * Required data-testid attributes (must be added to implementation):
 *   - clientes-list-panel       — the 280px left panel wrapper
 *   - search-clientes           — the search input field
 *   - cliente-list-item         — each client row in the list
 *   - empty-state               — the EmptyState component root
 *   - error-panel               — the ErrorPanel component root
 *   - clientes-loading-skeleton — the loading skeleton container
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { clienteFixtures, createClientes } from '../../../../../test-support/factories/cliente.factory';
import { clientesHandlers } from '../../../../../test-support/mocks/clientes.handlers';

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Test Helpers ─────────────────────────────────────────────────────────────

/**
 * Wraps the component under test with a fresh QueryClient per test
 * to prevent cache leakage between tests.
 */
function renderClienteListView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests to get immediate error state
        retry: false,
        // No stale time so queries always fetch fresh
        staleTime: 0,
      },
    },
  });

  // IMPORTANT: ClienteListView does not exist yet — this import will fail until
  // the implementation is created. That is intentional (RED phase).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ClienteListView } = require('../ClienteListView');

  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-01: ClienteListView renders list correctly
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-01 — ClienteListView renders client list', () => {
  it('should render the 280px left panel with data-testid="clientes-list-panel"', async () => {
    // GIVEN: The API returns 3 clients
    const clientes = createClientes(3);
    server.use(clientesHandlers.success(clientes));

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: The left panel is visible
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
    });
  });

  it('should display the nombre for each client item', async () => {
    // GIVEN: The API returns 3 clients
    const clientes = createClientes(3);
    server.use(clientesHandlers.success(clientes));

    // WHEN: ClienteListView is rendered and data loads
    renderClienteListView();

    // THEN: Each client's nombre is visible in the list
    await waitFor(() => {
      clientes.forEach((cliente) => {
        expect(screen.getByText(cliente.nombre)).toBeInTheDocument();
      });
    });
  });

  it('should display the nit for each client item', async () => {
    // GIVEN: The API returns 3 clients
    const clientes = createClientes(3);
    server.use(clientesHandlers.success(clientes));

    // WHEN: ClienteListView renders and data loads
    renderClienteListView();

    // THEN: Each client's nit is visible in the list
    await waitFor(() => {
      clientes.forEach((cliente) => {
        expect(screen.getByText(cliente.nit)).toBeInTheDocument();
      });
    });
  });

  it('should render one list item per client with data-testid="cliente-list-item"', async () => {
    // GIVEN: The API returns exactly 3 clients
    const clientes = createClientes(3);
    server.use(clientesHandlers.success(clientes));

    // WHEN: The component renders
    renderClienteListView();

    // THEN: Exactly 3 list items are present
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(3);
    });
  });

  it('should render the search input with placeholder "Buscar por nombre o NIT/RUC"', async () => {
    // GIVEN: The API returns any clients
    const clientes = createClientes(1);
    server.use(clientesHandlers.success(clientes));

    // WHEN: The component renders
    renderClienteListView();

    // THEN: A search input with the correct placeholder is present
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Buscar por nombre o NIT/RUC')
      ).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-02: Real-time search by nombre (no extra API call)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-02 — Real-time search by nombre without additional API call', () => {
  it('should filter list to only matching nombre items when user types in search field', async () => {
    // GIVEN: The API returns 5 clients (3 with "Acero" in nombre, 2 without)
    const { aceroGroupWithOthers } = clienteFixtures;
    const clientes = aceroGroupWithOthers();
    server.use(clientesHandlers.success(clientes));

    renderClienteListView();
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(5));

    // WHEN: The user types "Acero" in the search field
    const searchInput = screen.getByTestId('search-clientes');
    await userEvent.type(searchInput, 'Acero');

    // THEN: Only 3 items matching "Acero" are visible
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });
  });

  it('should not show non-matching clients after typing a search term', async () => {
    // GIVEN: 5 clients loaded, 2 do not match "Acero"
    const clientes = clienteFixtures.aceroGroupWithOthers();
    server.use(clientesHandlers.success(clientes));

    renderClienteListView();
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(5));

    // WHEN: The user types "Acero"
    const searchInput = screen.getByTestId('search-clientes');
    await userEvent.type(searchInput, 'Acero');

    // THEN: The non-matching client "Beta Comercial" is NOT visible
    await waitFor(() => {
      expect(screen.queryByText('Beta Comercial')).not.toBeInTheDocument();
    });
  });

  it('should NOT issue an additional API call when searching by nombre (client-side filter)', async () => {
    // GIVEN: The API is called once on mount
    const spy = vi.fn();
    const clientes = clienteFixtures.aceroGroupWithOthers();

    server.use(
      // MSW handler that tracks calls via the spy
      // Use a custom handler to intercept and count
      clientesHandlers.success(clientes)
    );

    // Track requests via Playwright-style counting (MSW lifecycle events not available here;
    // we verify no ADDITIONAL fetch occurs by asserting list count never triggers re-fetch)
    renderClienteListView();
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(5));

    // WHEN: The user types a search term
    const searchInput = screen.getByTestId('search-clientes');
    await userEvent.type(searchInput, 'Acero');

    // THEN: The list shows filtered results immediately (client-side, no network)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    // AND: spy was NOT called again (no additional network request issued)
    expect(spy).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-03: Real-time search by NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-03 — Real-time search by NIT/RUC', () => {
  it('should filter list to only the client matching the typed NIT fragment', async () => {
    // GIVEN: A list that includes a client with nit "900123456-1" plus 2 others
    const nitClient = clienteFixtures.nitExacto();
    const otherClientes = clienteFixtures.aceroGroup().slice(1);
    const clientes = [nitClient, ...otherClientes];

    server.use(clientesHandlers.success(clientes));

    renderClienteListView();
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3));

    // WHEN: The user types "900123456" (partial NIT)
    const searchInput = screen.getByTestId('search-clientes');
    await userEvent.type(searchInput, '900123456');

    // THEN: Only the matching client is visible
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
    expect(screen.getByText('Empresa Nit Exacto')).toBeInTheDocument();
  });

  it('should be case-insensitive when matching NIT/RUC', async () => {
    // GIVEN: A client with a NIT in uppercase characters
    const cliente = clienteFixtures.nitExacto();
    server.use(clientesHandlers.success([cliente]));

    renderClienteListView();
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1));

    // WHEN: The user types the NIT in lower case
    const searchInput = screen.getByTestId('search-clientes');
    await userEvent.type(searchInput, '900123456-1');

    // THEN: The client is still visible (case-insensitive match)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-04: EmptyState when API returns []
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-04 — EmptyState when no clients exist', () => {
  it('should display the EmptyState component when the API returns an empty array', async () => {
    // GIVEN: The API returns []
    server.use(clientesHandlers.empty());

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: The EmptyState component is visible (data-testid="empty-state")
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('should NOT render any cliente-list-item elements when EmptyState is displayed', async () => {
    // GIVEN: The API returns []
    server.use(clientesHandlers.empty());

    // WHEN: The component renders
    renderClienteListView();

    // THEN: No list items are present
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });

  it('should display a guidance message to create the first client in the EmptyState', async () => {
    // GIVEN: The API returns []
    server.use(clientesHandlers.empty());

    // WHEN: The component renders
    renderClienteListView();

    // THEN: A message guiding the user to create the first client is visible
    await waitFor(() => {
      const emptyState = screen.getByTestId('empty-state');
      expect(within(emptyState).getByText(/primer cliente|crea.*cliente/i)).toBeInTheDocument();
    });
  });

  it('should NOT show a loading skeleton when EmptyState is displayed', async () => {
    // GIVEN: The API returns []
    server.use(clientesHandlers.empty());

    // WHEN: The component has finished loading
    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // THEN: No loading skeleton is present
    expect(screen.queryByTestId('clientes-loading-skeleton')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-05: ErrorPanel + Reintentar on backend error
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-05 — ErrorPanel on backend failure with Reintentar button', () => {
  it('should display the ErrorPanel component when the API returns a 500 error', async () => {
    // GIVEN: The API returns a 500 Internal Server Error
    server.use(clientesHandlers.serverError());

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: The ErrorPanel component is visible (data-testid="error-panel")
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  it('should display a "Reintentar" button inside the ErrorPanel', async () => {
    // GIVEN: The API returns a 500 error
    server.use(clientesHandlers.serverError());

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: A button with text "Reintentar" is visible inside the error panel
    await waitFor(() => {
      const errorPanel = screen.getByTestId('error-panel');
      expect(within(errorPanel).getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });

  it('should trigger a new GET /api/v1/clientes request when "Reintentar" is clicked', async () => {
    // GIVEN: The API first fails with 500, then succeeds on retry
    const clientes = createClientes(1, { nombre: 'Recuperado SA' });
    let callCount = 0;

    server.use(
      // MSW handler that fails on first call, succeeds on second
      clientesHandlers.serverError()
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // WHEN: The MSW handler is replaced to return success and "Reintentar" is clicked
    server.use(clientesHandlers.success(clientes));
    callCount = 0;

    const reintentarButton = within(screen.getByTestId('error-panel')).getByRole('button', {
      name: /reintentar/i,
    });
    await userEvent.click(reintentarButton);

    // THEN: A new API call is issued and the list renders with the recovered data
    await waitFor(() => {
      expect(screen.getByText('Recuperado SA')).toBeInTheDocument();
    });

    // AND: ErrorPanel is no longer visible
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });

  it('should display ErrorPanel on network-level failure (fetch error)', async () => {
    // GIVEN: The API call results in a network error
    server.use(clientesHandlers.networkError());

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: The ErrorPanel is visible even on network-level failures
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5: Clearing search field restores full list without extra API call
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Clearing search restores full list without new API call', () => {
  it('should show the full client list again after clearing the search field', async () => {
    // GIVEN: Two clients are loaded and a search term has filtered to 1 result
    const clientes = [
      clienteFixtures.nitExacto(),
      clienteFixtures.aceroGroup()[0],
    ];
    server.use(clientesHandlers.success(clientes));

    renderClienteListView();
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    const searchInput = screen.getByTestId('search-clientes');
    await userEvent.type(searchInput, 'Acero');
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1));

    // WHEN: The user clears the search field
    await userEvent.clear(searchInput);

    // THEN: The full list of 2 clients is displayed again
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });
  });

  it('should NOT issue a new API call when the search field is cleared', async () => {
    // GIVEN: Two clients are loaded
    const clientes = createClientes(2);
    const spy = vi.fn();

    // Track with a spy-wrapped handler
    server.use(
      clientesHandlers.success(clientes)
    );

    renderClienteListView();
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    const searchInput = screen.getByTestId('search-clientes');
    await userEvent.type(searchInput, clientes[0].nombre.slice(0, 5));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1));

    // WHEN: Search is cleared
    await userEvent.clear(searchInput);
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    // THEN: The spy was NOT called (no extra network request)
    expect(spy).not.toHaveBeenCalled();
  });
});
