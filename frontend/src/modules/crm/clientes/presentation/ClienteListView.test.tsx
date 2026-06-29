/**
 * Component tests — ClienteListView
 * Story 2.1 — Client List & Search
 *
 * Test IDs covered (all in RED phase — component does not exist yet):
 *   TC-E2-P0-01  Client list renders all clients from API
 *   TC-E2-P0-02  Empty state when no clients
 *   TC-E2-P0-03  ErrorPanel + retry button triggers re-fetch
 *   TC-E2-P1-01  Real-time search filters list by Nombre
 *   TC-E2-P1-02  Real-time search filters list by NIT/RUC
 *   TC-E2-P1-03  Search performance: 500 records filter < 150ms
 *   TC-E2-P2-04  Loading skeleton shown during initial fetch (200ms delay)
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failure: "Cannot find module '../ClienteListView'"
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import {
  handleGetClientesSuccess,
  handleGetClientesEmpty,
  handleGetClientesError,
  handleGetClientes500,
  handleGetClientesDelayed,
} from '../../../../test/msw/handlers/clientes.handlers';
import { createClientes, createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { ClienteListView } from './ClienteListView';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetClienteCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: render ClienteListView with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderClienteListView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Disable automatic refetch for deterministic tests
        refetchOnWindowFocus: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// TC-E2-P0-01: Client list renders all clients from API
// ---------------------------------------------------------------------------

describe('TC-E2-P0-01: Client list renders all clients from API', () => {
  it('should show loading skeleton before data arrives', async () => {
    // GIVEN: MSW returns 3 clients with a small delay
    const clients = createClientes(3);
    server.use(handleGetClientesDelayed(clients, 50));

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: Loading skeleton is visible before response resolves
    expect(screen.getByTestId('clientes-list-skeleton')).toBeInTheDocument();
  });

  it('should render all 3 clients after data arrives', async () => {
    // GIVEN: MSW returns 3 clients
    const clients = createClientes(3);
    server.use(handleGetClientesSuccess(clients));

    // WHEN: ClienteListView renders and data resolves
    renderClienteListView();

    // THEN: All 3 client names appear in the list
    for (const client of clients) {
      await waitFor(() => {
        expect(screen.getByTestId(`cliente-item-${client.id}`)).toBeInTheDocument();
      });
    }
  });

  it('should display Nombre and NIT/RUC for each client item', async () => {
    // GIVEN: MSW returns 3 clients
    const clients = createClientes(3);
    server.use(handleGetClientesSuccess(clients));

    // WHEN: ClienteListView renders and data resolves
    renderClienteListView();

    // THEN: Each list item shows Nombre and NIT
    const firstClient = clients[0];
    await waitFor(() => {
      expect(screen.getByText(firstClient.nombre)).toBeInTheDocument();
      expect(screen.getByText(firstClient.nit)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P0-02: Empty state when no clients
// ---------------------------------------------------------------------------

describe('TC-E2-P0-02: Empty state when no clients exist', () => {
  it('should render EmptyState component when API returns empty array', async () => {
    // GIVEN: MSW returns empty array
    server.use(handleGetClientesEmpty());

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: EmptyState is rendered with Spanish guidance text
    await waitFor(() => {
      expect(screen.getByTestId('clientes-empty-state')).toBeInTheDocument();
    });
  });

  it('should show zero client list items when empty', async () => {
    // GIVEN: MSW returns empty array
    server.use(handleGetClientesEmpty());

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: No client items in DOM
    await waitFor(() => {
      expect(screen.queryAllByTestId(/^cliente-item-/)).toHaveLength(0);
    });
  });

  it('should display Spanish creation-prompt message in EmptyState', async () => {
    // GIVEN: MSW returns empty array
    server.use(handleGetClientesEmpty());

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: EmptyState contains Spanish text guiding user to create first client
    await waitFor(() => {
      const emptyState = screen.getByTestId('clientes-empty-state');
      expect(emptyState).toHaveTextContent(/cliente/i);
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P0-03: ErrorPanel + retry button triggers re-fetch
// ---------------------------------------------------------------------------

describe('TC-E2-P0-03: ErrorPanel with Reintentar on API failure', () => {
  it('should render ErrorPanel when GET /api/v1/clientes returns 500', async () => {
    // GIVEN: MSW returns HTTP 500
    server.use(handleGetClientesError());

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: ErrorPanel is shown
    await waitFor(() => {
      expect(screen.getByTestId('clientes-error-panel')).toBeInTheDocument();
    });
  });

  it('should display Reintentar button in ErrorPanel', async () => {
    // GIVEN: MSW returns HTTP 500
    server.use(handleGetClientesError());

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: "Reintentar" button is visible
    await waitFor(() => {
      expect(screen.getByTestId('clientes-retry-button')).toBeInTheDocument();
      expect(screen.getByTestId('clientes-retry-button')).toHaveTextContent(/reintentar/i);
    });
  });

  it('should trigger a new fetch when Reintentar button is clicked', async () => {
    // GIVEN: MSW starts with 500 then returns success on second request
    const clients = createClientes(2);

    server.use(
      handleGetClientesError() // first call fails
    );

    // WHEN: ClienteListView renders and error panel appears
    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByTestId('clientes-retry-button')).toBeInTheDocument();
    });

    // Switch handler to success for the retry
    server.resetHandlers();
    server.use(handleGetClientesSuccess(clients));

    // WHEN: User clicks Reintentar
    fireEvent.click(screen.getByTestId('clientes-retry-button'));

    // THEN: The list eventually shows clients (fetch was retried)
    await waitFor(() => {
      expect(screen.queryByTestId('clientes-error-panel')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-01: Real-time search filters list by Nombre
// ---------------------------------------------------------------------------

describe('TC-E2-P1-01: Real-time search filters by Nombre', () => {
  it('should show only matching clients when searching by partial Nombre', async () => {
    // GIVEN: MSW returns 3 clients with distinct names
    const clients = [
      createCliente({ nombre: 'Acme Corp', nit: '111-1' }),
      createCliente({ nombre: 'Beta SA', nit: '222-2' }),
      createCliente({ nombre: 'Aceros del Valle', nit: '333-3' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    // Wait for list to render
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // WHEN: User types "Ace" in the search field
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'Ace' },
    });

    // THEN: Only "Acme Corp" and "Aceros del Valle" are visible
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Aceros del Valle')).toBeInTheDocument();
    });

    // THEN: "Beta SA" is NOT visible
    expect(screen.queryByText('Beta SA')).not.toBeInTheDocument();
  });

  it('should restore full list when search is cleared', async () => {
    // GIVEN: MSW returns 3 clients
    const clients = [
      createCliente({ nombre: 'Acme Corp', nit: '111-1' }),
      createCliente({ nombre: 'Beta SA', nit: '222-2' }),
      createCliente({ nombre: 'Aceros del Valle', nit: '333-3' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Beta SA')).toBeInTheDocument();
    });

    // WHEN: Search filters then is cleared
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'Ace' } });
    fireEvent.change(searchInput, { target: { value: '' } });

    // THEN: All 3 clients visible again
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta SA')).toBeInTheDocument();
      expect(screen.getByText('Aceros del Valle')).toBeInTheDocument();
    });
  });

  it('should perform case-insensitive search on Nombre', async () => {
    // GIVEN: A client named "Acme Corp"
    const clients = [
      createCliente({ nombre: 'Acme Corp', nit: '111-1' }),
      createCliente({ nombre: 'Beta SA', nit: '222-2' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // WHEN: User types lowercase "acme"
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'acme' },
    });

    // THEN: "Acme Corp" still matches (case-insensitive)
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.queryByText('Beta SA')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-02: Real-time search filters by NIT/RUC
// ---------------------------------------------------------------------------

describe('TC-E2-P1-02: Real-time search filters by NIT/RUC', () => {
  it('should show only matching clients when searching by partial NIT', async () => {
    // GIVEN: 3 clients with distinct NITs
    const clients = [
      createCliente({ nombre: 'Empresa A', nit: '900111000-1' }),
      createCliente({ nombre: 'Empresa B', nit: '900222000-2' }),
      createCliente({ nombre: 'Empresa C', nit: '900333000-3' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Empresa A')).toBeInTheDocument();
    });

    // WHEN: User types a partial NIT that only matches Empresa B
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: '222' },
    });

    // THEN: Only Empresa B is visible
    await waitFor(() => {
      expect(screen.getByText('Empresa B')).toBeInTheDocument();
    });
    expect(screen.queryByText('Empresa A')).not.toBeInTheDocument();
    expect(screen.queryByText('Empresa C')).not.toBeInTheDocument();
  });

  it('should match NIT substring (not only prefix)', async () => {
    // GIVEN: A client with NIT "900123456-7"
    const clients = [
      createCliente({ nombre: 'Empresa X', nit: '900123456-7' }),
      createCliente({ nombre: 'Empresa Y', nit: '800999888-0' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Empresa X')).toBeInTheDocument();
    });

    // WHEN: User types a middle part of the NIT (not the prefix)
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: '3456' },
    });

    // THEN: Empresa X matches (substring match)
    await waitFor(() => {
      expect(screen.getByText('Empresa X')).toBeInTheDocument();
      expect(screen.queryByText('Empresa Y')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-03: Search performance with 500 records < 150ms
// ---------------------------------------------------------------------------

describe('TC-E2-P1-03: Search performance with 500 clients', () => {
  it('should filter 500 clients in under 150ms', async () => {
    // GIVEN: MSW returns 500 clients (some matching "Test 0" pattern)
    server.use(handleGetClientes500());

    renderClienteListView();

    // Wait for all 500 to load
    await waitFor(
      () => {
        expect(screen.getAllByTestId(/^cliente-item-/).length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );

    const searchInput = screen.getByTestId('clientes-search-input');

    // WHEN: Measure filter time
    const start = performance.now();
    fireEvent.change(searchInput, { target: { value: 'Empresa Test 000' } });
    const elapsed = performance.now() - start;

    // THEN: Filter completes in under 150ms
    expect(elapsed).toBeLessThan(150);
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P2-04: Loading state shown during initial fetch
// ---------------------------------------------------------------------------

describe('TC-E2-P2-04: Loading skeleton during initial fetch', () => {
  it('should display loading indicator before data arrives (200ms delay)', async () => {
    // GIVEN: MSW delays response by 200ms
    const clients = createClientes(2);
    server.use(handleGetClientesDelayed(clients, 200));

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: Loading skeleton is visible immediately
    expect(screen.getByTestId('clientes-list-skeleton')).toBeInTheDocument();

    // THEN: After data arrives, loading skeleton is gone and list appears
    await waitFor(
      () => {
        expect(screen.queryByTestId('clientes-list-skeleton')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByText(clients[0].nombre)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// AC #5: Default sort is "Más reciente" on initial load
// ---------------------------------------------------------------------------

describe('AC#5: Default sort is Más reciente on initial load', () => {
  it('should show SortControl defaulting to fecha-desc on initial render', async () => {
    // GIVEN: MSW returns clients with different createdAt dates
    const clients = [
      createCliente({ nombre: 'Empresa Antigua', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Empresa Reciente', createdAt: '2026-06-29T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    // WHEN: ClienteListView renders with no sort preference
    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByTestId('sort-control')).toBeInTheDocument();
    });

    // THEN: SortControl shows "Más reciente" as selected
    const sortControl = screen.getByTestId('sort-control');
    expect(sortControl).toHaveValue('fecha-desc');
  });

  it('should display newest client first by default (createdAt descending)', async () => {
    // GIVEN: MSW returns clients in arbitrary order
    const clients = [
      createCliente({ nombre: 'Empresa Antigua', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Empresa Reciente', createdAt: '2026-06-29T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    // WHEN: ClienteListView renders
    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Empresa Reciente')).toBeInTheDocument();
    });

    // THEN: "Empresa Reciente" appears before "Empresa Antigua" in the DOM
    const items = screen.getAllByTestId(/^cliente-item-/);
    const nombres = items.map((el) => el.textContent);
    const recienteIndex = nombres.findIndex((t) => t?.includes('Empresa Reciente'));
    const antiguaIndex = nombres.findIndex((t) => t?.includes('Empresa Antigua'));
    expect(recienteIndex).toBeLessThan(antiguaIndex);
  });
});
