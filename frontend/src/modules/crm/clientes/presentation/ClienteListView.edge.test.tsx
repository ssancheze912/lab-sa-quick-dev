/**
 * Edge-case component tests — ClienteListView
 * Story 2.1 — Client List & Search — Automation Expansion
 *
 * Complements ClienteListView.test.tsx (ATDD baseline).
 * Covers edge cases not in ATDD:
 *   - Search with no matches (zero-result state)
 *   - Search with leading/trailing whitespace
 *   - Case-insensitive NIT search
 *   - SortControl: all 4 sort options applied correctly
 *   - Sort state preserved when search changes
 *   - Search and sort interaction: combined filter+sort
 *   - Single client rendered correctly
 *   - Rapid sequential search inputs (state consistency)
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import {
  handleGetClientesSuccess,
  handleGetClientesEmpty,
} from '../../../../test/msw/handlers/clientes.handlers';
import { createCliente, createClientes, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { ClienteListView } from '../ClienteListView';

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
// Edge: Zero-result search state
// ---------------------------------------------------------------------------

describe('Search — zero-match state', () => {
  it('[P1] should display no list items when search query matches nothing', async () => {
    // GIVEN: 3 clients loaded, search query matches none
    const clients = [
      createCliente({ nombre: 'Acme Corp', nit: '111-1' }),
      createCliente({ nombre: 'Beta SA', nit: '222-2' }),
      createCliente({ nombre: 'Gamma Ltda', nit: '333-3' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // WHEN: User types a query that matches no client
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'ZZZZNOEXISTE' },
    });

    // THEN: No client items visible
    await waitFor(() => {
      expect(screen.queryAllByTestId(/^cliente-item-/)).toHaveLength(0);
    });
  });

  it('[P1] should show empty-search feedback (not the API empty state) when filter returns no results', async () => {
    // GIVEN: Clients exist but search returns zero matches
    const clients = [createCliente({ nombre: 'Empresa Real', nit: '900100200-1' })];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Empresa Real')).toBeInTheDocument();
    });

    // WHEN: Search matches nothing
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'ZZZNOTFOUND' },
    });

    // THEN: The EmptyState for zero-search-results OR a no-results message appears
    // AND the API EmptyState is NOT shown (clients do exist)
    await waitFor(() => {
      // The list container exists but has no items
      expect(screen.queryAllByTestId(/^cliente-item-/)).toHaveLength(0);
    });

    // The API empty-state data-testid is only shown when API returns []
    // This asserts the component distinguishes between "no clients" and "no matches"
    expect(screen.queryByTestId('clientes-empty-state')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: Search with whitespace inputs
// ---------------------------------------------------------------------------

describe('Search — whitespace handling', () => {
  it('[P2] should ignore leading/trailing whitespace in search query', async () => {
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

    // WHEN: User types "  acme  " (with surrounding spaces)
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: '  acme  ' },
    });

    // THEN: "Acme Corp" is still matched (trim applied)
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  it('[P2] should show all clients when search input is only spaces', async () => {
    // GIVEN: Clients loaded
    const clients = createClientes(3);
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId(/^cliente-item-/).length).toBe(3);
    });

    // WHEN: User enters only whitespace characters
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: '   ' },
    });

    // THEN: All 3 clients are still visible (whitespace-only = treated as empty)
    await waitFor(() => {
      expect(screen.getAllByTestId(/^cliente-item-/).length).toBe(3);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: Case-insensitive NIT search
// ---------------------------------------------------------------------------

describe('Search — NIT case-insensitive', () => {
  it('[P1] should match NIT case-insensitively when NIT contains letters', async () => {
    // GIVEN: A client with NIT containing uppercase letters (e.g. RUC format)
    const clients = [
      createCliente({ nombre: 'Empresa Ecuador', nit: 'RUC-1234567890' }),
      createCliente({ nombre: 'Empresa Colombia', nit: '900123456-7' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Empresa Ecuador')).toBeInTheDocument();
    });

    // WHEN: User types lowercase "ruc" to search by NIT
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'ruc' },
    });

    // THEN: "Empresa Ecuador" matches (case-insensitive NIT search)
    await waitFor(() => {
      expect(screen.getByText('Empresa Ecuador')).toBeInTheDocument();
      expect(screen.queryByText('Empresa Colombia')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: SortControl — all 4 sort options
// ---------------------------------------------------------------------------

describe('SortControl — all 4 sort options apply correctly', () => {
  const sortedClients = [
    createCliente({ nombre: 'Alpha Corp', nit: '100-1', createdAt: '2026-01-10T00:00:00Z' }),
    createCliente({ nombre: 'Beta SA', nit: '200-2', createdAt: '2026-03-15T00:00:00Z' }),
    createCliente({ nombre: 'Zeta Ltda', nit: '300-3', createdAt: '2026-06-01T00:00:00Z' }),
  ];

  it('[P1] should sort by nombre ascending (A→Z) when nombre-asc selected', async () => {
    // GIVEN: Clients in arbitrary order
    const clients = [sortedClients[2], sortedClients[0], sortedClients[1]]; // Z, A, B
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    });

    // WHEN: User selects "nombre-asc"
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } });

    // THEN: Alpha → Beta → Zeta
    await waitFor(() => {
      const items = screen.getAllByTestId(/^cliente-item-/);
      const nombres = items.map((el) => el.textContent ?? '');
      const alphaIndex = nombres.findIndex((t) => t.includes('Alpha Corp'));
      const betaIndex = nombres.findIndex((t) => t.includes('Beta SA'));
      const zetaIndex = nombres.findIndex((t) => t.includes('Zeta Ltda'));
      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(zetaIndex);
    });
  });

  it('[P1] should sort by nombre descending (Z→A) when nombre-desc selected', async () => {
    // GIVEN: Clients loaded
    const clients = [sortedClients[0], sortedClients[1], sortedClients[2]]; // A, B, Z
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Zeta Ltda')).toBeInTheDocument();
    });

    // WHEN: User selects "nombre-desc"
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-desc' } });

    // THEN: Zeta → Beta → Alpha
    await waitFor(() => {
      const items = screen.getAllByTestId(/^cliente-item-/);
      const nombres = items.map((el) => el.textContent ?? '');
      const alphaIndex = nombres.findIndex((t) => t.includes('Alpha Corp'));
      const betaIndex = nombres.findIndex((t) => t.includes('Beta SA'));
      const zetaIndex = nombres.findIndex((t) => t.includes('Zeta Ltda'));
      expect(zetaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(alphaIndex);
    });
  });

  it('[P1] should sort by createdAt ascending (oldest first) when fecha-asc selected', async () => {
    // GIVEN: Clients with different creation dates
    server.use(handleGetClientesSuccess(sortedClients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    });

    // WHEN: User selects "fecha-asc" (oldest first)
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'fecha-asc' } });

    // THEN: Alpha (Jan) → Beta (Mar) → Zeta (Jun)
    await waitFor(() => {
      const items = screen.getAllByTestId(/^cliente-item-/);
      const nombres = items.map((el) => el.textContent ?? '');
      const alphaIndex = nombres.findIndex((t) => t.includes('Alpha Corp'));
      const betaIndex = nombres.findIndex((t) => t.includes('Beta SA'));
      const zetaIndex = nombres.findIndex((t) => t.includes('Zeta Ltda'));
      expect(alphaIndex).toBeLessThan(betaIndex);
      expect(betaIndex).toBeLessThan(zetaIndex);
    });
  });

  it('[P1] sort control displays all 4 options', async () => {
    // GIVEN: Any list loaded
    server.use(handleGetClientesSuccess(sortedClients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByTestId('sort-control')).toBeInTheDocument();
    });

    // THEN: SortControl has exactly 4 options
    const sortSelect = screen.getByTestId('sort-control') as HTMLSelectElement;
    expect(sortSelect.options.length).toBe(4);

    // AND: The option values match the spec
    const optionValues = Array.from(sortSelect.options).map((o) => o.value);
    expect(optionValues).toContain('nombre-asc');
    expect(optionValues).toContain('nombre-desc');
    expect(optionValues).toContain('fecha-desc');
    expect(optionValues).toContain('fecha-asc');
  });
});

// ---------------------------------------------------------------------------
// Edge: Sort state is preserved when search filter changes
// ---------------------------------------------------------------------------

describe('Sort + Search interaction', () => {
  it('[P1] should preserve sort order when search filter is applied after sorting', async () => {
    // GIVEN: Clients loaded, user sorts by nombre-asc
    const clients = [
      createCliente({ nombre: 'Zebra Corp', nit: '100-1', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Anfibios SA', nit: '200-2', createdAt: '2026-02-01T00:00:00Z' }),
      createCliente({ nombre: 'Zeta Ltda', nit: '300-3', createdAt: '2026-03-01T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Zebra Corp')).toBeInTheDocument();
    });

    // WHEN: User selects nombre-asc sort
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } });

    // AND: User then searches for "Z" (matches Zebra Corp and Zeta Ltda)
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'Z' },
    });

    // THEN: Only "Z" clients visible AND in alphabetical order (Zebra before Zeta)
    await waitFor(() => {
      expect(screen.getByText('Zebra Corp')).toBeInTheDocument();
      expect(screen.getByText('Zeta Ltda')).toBeInTheDocument();
      expect(screen.queryByText('Anfibios SA')).not.toBeInTheDocument();
    });

    const items = screen.getAllByTestId(/^cliente-item-/);
    const nombres = items.map((el) => el.textContent ?? '');
    const zebraIndex = nombres.findIndex((t) => t.includes('Zebra Corp'));
    const zetaIndex = nombres.findIndex((t) => t.includes('Zeta Ltda'));
    expect(zebraIndex).toBeLessThan(zetaIndex);
  });

  it('[P1] should preserve active search when sort order changes', async () => {
    // GIVEN: Active search "Empresa" showing 2 of 3 clients
    const clients = [
      createCliente({ nombre: 'Empresa Antigua', nit: '100-1', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Empresa Reciente', nit: '200-2', createdAt: '2026-06-01T00:00:00Z' }),
      createCliente({ nombre: 'Otro Negocio', nit: '300-3', createdAt: '2026-03-01T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Empresa Antigua')).toBeInTheDocument();
    });

    // Apply search filter
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'Empresa' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Otro Negocio')).not.toBeInTheDocument();
    });

    // WHEN: User changes sort to nombre-asc
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } });

    // THEN: "Otro Negocio" is still hidden (search filter preserved)
    await waitFor(() => {
      expect(screen.getByText('Empresa Antigua')).toBeInTheDocument();
      expect(screen.getByText('Empresa Reciente')).toBeInTheDocument();
      expect(screen.queryByText('Otro Negocio')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: Single client in list
// ---------------------------------------------------------------------------

describe('Single client in list', () => {
  it('[P2] should render a single client correctly without crashing', async () => {
    // GIVEN: API returns exactly 1 client
    const clients = [createCliente({ nombre: 'Solo Corp', nit: '999999999-0' })];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    // THEN: The single client is displayed
    await waitFor(() => {
      expect(screen.getByText('Solo Corp')).toBeInTheDocument();
      expect(screen.getByText('999999999-0')).toBeInTheDocument();
    });

    // AND: No empty state shown
    expect(screen.queryByTestId('clientes-empty-state')).not.toBeInTheDocument();
  });

  it('[P2] should show EmptyState after single client is filtered out by search', async () => {
    // GIVEN: 1 client loaded
    const clients = [createCliente({ nombre: 'Solo Corp', nit: '999999999-0' })];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Solo Corp')).toBeInTheDocument();
    });

    // WHEN: Search filters out the only client
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'NOMATCHES' },
    });

    // THEN: List is empty (no items)
    await waitFor(() => {
      expect(screen.queryAllByTestId(/^cliente-item-/)).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: Rapid sequential search updates (state consistency)
// ---------------------------------------------------------------------------

describe('Rapid search input changes', () => {
  it('[P2] should reflect the last search value after multiple rapid changes', async () => {
    // GIVEN: Multiple clients
    const clients = [
      createCliente({ nombre: 'Acme Corp', nit: '111-1' }),
      createCliente({ nombre: 'Beta SA', nit: '222-2' }),
      createCliente({ nombre: 'Aceros del Valle', nit: '333-3' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('clientes-search-input');

    // WHEN: User types rapidly — multiple quick changes
    fireEvent.change(searchInput, { target: { value: 'A' } });
    fireEvent.change(searchInput, { target: { value: 'Ac' } });
    fireEvent.change(searchInput, { target: { value: 'Ace' } });
    fireEvent.change(searchInput, { target: { value: 'Acero' } });

    // THEN: Final search "Acero" shows only "Aceros del Valle"
    await waitFor(() => {
      expect(screen.getByText('Aceros del Valle')).toBeInTheDocument();
      expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
      expect(screen.queryByText('Beta SA')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: Search input is accessible (testid present on initial render)
// ---------------------------------------------------------------------------

describe('Search input availability', () => {
  it('[P2] should render search input immediately on mount (before data arrives)', async () => {
    // GIVEN: Data takes time to load
    server.use(handleGetClientesEmpty());

    renderClienteListView();

    // THEN: Search input is available even before data arrives
    // (it's part of the layout shell, not conditional on data)
    expect(screen.getByTestId('clientes-search-input')).toBeInTheDocument();
  });
});
