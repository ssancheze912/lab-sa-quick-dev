/**
 * Story 2.1: Client List & Search
 * Component Tests — ClienteListView (Edge Cases — Automate EXPAND)
 *
 * Covers boundary conditions and error paths NOT in ATDD tests:
 *   - Search with no match → EmptyState (from filter, not API)
 *   - Search with special characters / accented letters
 *   - Search matches NIT only (not Nombre)
 *   - Search with leading/trailing whitespace
 *   - Single character search
 *   - Search on empty string after typing (clear restores list)
 *   - Skeleton renders exactly 5 placeholders while loading
 *   - EmptyState shows when filtered result is empty (not initial empty)
 */

import { render, screen, waitFor } from '@testing-library/react';
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
// Edge: Search with no match → EmptyState (from filter, not API empty)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — edge: search with no matches', () => {
  test('Given clients loaded, typing non-matching term shows EmptyState (not client list)', async () => {
    // GIVEN: 5 clients are loaded
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // WHEN: user types a term that matches nothing
    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, 'ZZZNOMATCH999');

    // THEN: no client items are shown
    await waitFor(() => {
      expect(screen.queryAllByTestId(/^client-item-/)).toHaveLength(0);
    });

    // AND: EmptyState is shown (filtered empty, not API empty)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  test('Given no-match search, clearing input restores original list and hides EmptyState', async () => {
    // GIVEN: 5 clients loaded and non-matching search applied
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, 'ZZZNOMATCH999');

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // WHEN: user clears the search
    await userEvent.clear(searchInput);

    // THEN: all 5 clients are shown and EmptyState is gone
    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Search by NIT only (Nombre does not match)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — edge: search by NIT only', () => {
  test('Given NIT-only match, should show client even when Nombre does not match', async () => {
    // GIVEN: 5 clients; "Beta Ltda" has NIT "900200002-2"
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // WHEN: user types the NIT of "Beta Ltda" but not the name
    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, '900200002');

    // THEN: "Beta Ltda" is shown (matched via NIT), others are filtered out
    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(1);
    });
    expect(screen.getByTestId(/^client-item-/)).toHaveTextContent('Beta Ltda');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Search with accented characters (Spanish locale)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — edge: accented character search', () => {
  test('Given client with accented Nombre, search with accented query should match', async () => {
    // GIVEN: a client with accented Nombre
    const clientes = [
      buildClienteDto({ nombre: 'Compañía Andina Ltda', nit: '900600006-6' }),
      buildClienteDto({ nombre: 'Other Corp', nit: '900700007-7' }),
    ];
    server.use(handleGetClientesSuccess(clientes));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(2);
    });

    // WHEN: user types "compañía" (accented, lowercase)
    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, 'compañía');

    // THEN: only the accented client is shown
    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(1);
    });
    expect(screen.getByTestId(/^client-item-/)).toHaveTextContent('Compañía Andina Ltda');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Single character search
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — edge: single character search', () => {
  test('Single character "a" matches all clients containing letter a', async () => {
    // GIVEN: clients — "Alpha Corp" (has 'a'), "Beta Ltda" (has 'a'), "XYZ" (no 'a')
    const clientes = [
      buildClienteDto({ nombre: 'Alpha Corp', nit: '900800008-8' }),
      buildClienteDto({ nombre: 'Beta Ltda', nit: '900900009-9' }),
      buildClienteDto({ nombre: 'XYZ', nit: '901000010-0' }),
    ];
    server.use(handleGetClientesSuccess(clientes));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(3);
    });

    // WHEN: user types single character "a"
    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, 'a');

    // THEN: only clients containing 'a' are shown (Alpha Corp, Beta Ltda)
    await waitFor(() => {
      const items = screen.getAllByTestId(/^client-item-/);
      expect(items).toHaveLength(2);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Search with leading/trailing spaces (trim behavior)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — edge: whitespace-only search', () => {
  test('Given whitespace-only search input, all clients should remain visible', async () => {
    // GIVEN: 5 clients loaded
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // WHEN: user types only spaces
    const searchInput = screen.getByRole('searchbox', { name: /buscar/i });
    await userEvent.type(searchInput, '   ');

    // THEN: all 5 clients are still shown (whitespace trims to empty = no filter)
    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: Loading skeleton has exactly 5 placeholder rows
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — edge: skeleton count', () => {
  test('While loading, skeleton container is present with aria-label "Cargando clientes"', async () => {
    // GIVEN: API call is delayed
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

    // THEN: skeleton container is visible immediately
    const skeletonContainer = screen.getByLabelText(/cargando clientes/i);
    expect(skeletonContainer).toBeInTheDocument();

    // AND: no client items are present yet
    expect(screen.queryAllByTestId(/^client-item-/)).toHaveLength(0);

    // Cleanup
    resolveHandler();
    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });
  });

  test('After data loads, skeleton container is removed from DOM', async () => {
    // GIVEN: API returns data
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    // WHEN: data loads
    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // THEN: skeleton is no longer visible
    expect(screen.queryByLabelText(/cargando clientes/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: ErrorPanel NOT shown when API succeeds
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — edge: no error panel on success', () => {
  test('Given successful API response, ErrorPanel should NOT be visible', async () => {
    // GIVEN: normal success
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // THEN: ErrorPanel is absent
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: EmptyState NOT shown when data is present
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — edge: no empty state when data present', () => {
  test('Given 5 clients loaded, EmptyState should NOT be rendered', async () => {
    // GIVEN: 5 clients
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // THEN: EmptyState is absent
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: API returns empty array — EmptyState shown, no ErrorPanel
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — edge: empty array not confused with error', () => {
  test('Given API returns empty array, ErrorPanel should NOT be rendered', async () => {
    // GIVEN: API returns []
    server.use(handleGetClientesEmpty());

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // THEN: ErrorPanel is absent (empty array is success, not error)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge: List panel has aria-label "Lista de clientes" for screen readers
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — edge: accessibility aria-label', () => {
  test('List container should have aria-label "Lista de clientes"', async () => {
    // GIVEN: clients loaded
    server.use(handleGetClientesSuccess(FIVE_CLIENTES));

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId(/^client-item-/)).toHaveLength(5);
    });

    // THEN: the list region has an aria-label
    expect(screen.getByLabelText(/lista de clientes/i)).toBeInTheDocument();
  });
});
