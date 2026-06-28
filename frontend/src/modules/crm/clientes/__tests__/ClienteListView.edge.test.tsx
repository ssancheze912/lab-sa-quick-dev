/**
 * Edge-case component tests — ClienteListView — Story 2.1 automation expansion.
 *
 * Expands ATDD coverage (ClienteListView.test.tsx) with:
 *   - Case-insensitive search (lowercase input matches uppercase nombre)
 *   - Search with leading/trailing whitespace
 *   - Search matching NIT case-insensitively
 *   - No-results state when filter yields empty result set
 *   - Loading skeleton rendered during fetch
 *   - onClienteSelect callback called when item is clicked
 *   - selectedClienteId activates the matching item
 */

import React from 'react';
import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { buildCliente, buildClientes, resetClienteCounter } from './clienteFactory';
import { ClienteListView } from '../presentation/ClienteListView';

const API_BASE = 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server (network-first: handlers registered before tests run)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetClienteCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render ClienteListView with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteListView(props: {
  onClienteSelect?: (c: ReturnType<typeof buildCliente>) => void;
  selectedClienteId?: string;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView {...props} />
    </QueryClientProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Case-insensitive search
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — case-insensitive search', () => {
  it('[P1] should match clients when search input is lowercase and nombre is mixed case', async () => {
    // GIVEN: Client with mixed-case nombre, NETWORK intercepted BEFORE render
    const clientes = [
      buildCliente({ nombre: 'ACME CORPORATION', nit: '900111000-1' }),
      buildCliente({ nombre: 'Beta Ltda.', nit: '900222000-2' }),
    ];

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json(clientes)));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: User types lowercase search
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: 'acme' } });

    // THEN: "ACME CORPORATION" matches despite case difference
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('ACME CORPORATION');
    });
  });

  it('[P1] should match clients when search input is uppercase and nombre is lowercase', async () => {
    // GIVEN: Client with lowercase nombre
    const clientes = [buildCliente({ nombre: 'acme s.a.' })];

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json(clientes)));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: Uppercase search
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: 'ACME' } });

    // THEN: Match found
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search with leading/trailing whitespace
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — search whitespace trimming', () => {
  it('[P1] should match clients when search input has leading/trailing whitespace', async () => {
    // GIVEN: Client "Gamma SAS", search with surrounding spaces
    const clientes = [
      buildCliente({ nombre: 'Gamma SAS' }),
      buildCliente({ nombre: 'Delta Corp' }),
    ];

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json(clientes)));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: Search with surrounding whitespace
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: '  Gamma  ' } });

    // THEN: Gamma SAS is found (filter trims the query)
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Gamma SAS');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// No-results state when search matches nothing
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — no-results state', () => {
  it('[P1] should show EmptyState with "Sin resultados" when search matches no clients', async () => {
    // GIVEN: Two clients, none matching the search term
    const clientes = [
      buildCliente({ nombre: 'Alpha SAS' }),
      buildCliente({ nombre: 'Beta Corp' }),
    ];

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json(clientes)));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: Search term that matches nothing
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NO_MATCH_XYZ' } });

    // THEN: No list items; EmptyState shown
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('[P1] should restore full list when search is cleared after no-results', async () => {
    // GIVEN: Search has returned no results
    const clientes = [
      buildCliente({ nombre: 'Alpha SAS' }),
      buildCliente({ nombre: 'Beta Corp' }),
    ];

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json(clientes)));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: 'ZZZ_NO_MATCH' } });

    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
    });

    // WHEN: Search is cleared
    fireEvent.change(searchInput, { target: { value: '' } });

    // THEN: Full list restored
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — loading state', () => {
  it('[P1] should show loading skeleton and not show client items during fetch', async () => {
    // GIVEN: Server delays response (loading state observable)
    let resolveResponse: () => void;
    const responseDelay = new Promise<void>((res) => {
      resolveResponse = res;
    });

    server.use(
      http.get(CLIENTES_URL, async () => {
        await responseDelay;
        return HttpResponse.json([]);
      })
    );

    renderClienteListView();

    // THEN: Loading indicator present, no list items
    // (skeleton uses aria-label "Cargando clientes...")
    await waitFor(() => {
      expect(screen.getByLabelText(/cargando clientes/i)).toBeInTheDocument();
    });

    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();

    // Cleanup: resolve the hanging request
    resolveResponse!();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// onClienteSelect callback
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — onClienteSelect callback', () => {
  it('[P1] should call onClienteSelect with the clicked cliente object', async () => {
    // GIVEN: One client, mock onClienteSelect handler
    const handleSelect = vi.fn();
    const cliente = buildCliente({ nombre: 'Select Me Corp' });

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json([cliente])));

    renderClienteListView({ onClienteSelect: handleSelect });

    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument();
    });

    // WHEN: User clicks the item
    fireEvent.click(screen.getByTestId('cliente-list-item'));

    // THEN: onClienteSelect called with the correct cliente
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: cliente.id, nombre: cliente.nombre })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// selectedClienteId — active item highlighting
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — selectedClienteId active state', () => {
  it('[P1] should apply active highlighting to the item matching selectedClienteId', async () => {
    // GIVEN: Two clients, one selected
    const c1 = buildCliente({ nombre: 'Active One' });
    const c2 = buildCliente({ nombre: 'Inactive Two' });

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json([c1, c2])));

    renderClienteListView({ selectedClienteId: c1.id });

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // THEN: The active item has the active class
    const items = screen.getAllByTestId('cliente-list-item');
    const activeItem = items.find((el) => el.textContent?.includes('Active One'));
    const inactiveItem = items.find((el) => el.textContent?.includes('Inactive Two'));

    expect(activeItem?.className).toContain('bg-slate-100');
    expect(inactiveItem?.className).not.toMatch(/\bbg-slate-100\b/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search by NIT case-insensitive
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — NIT search edge cases', () => {
  it('[P1] should match clients when searching by NIT with uppercase letters', async () => {
    // GIVEN: Client with NIT "900ABC123-5" (hypothetical mixed-case NIT)
    const clientes = [
      buildCliente({ nombre: 'Empresa A', nit: '900abc123-5' }),
      buildCliente({ nombre: 'Empresa B', nit: '900xyz456-6' }),
    ];

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json(clientes)));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: Search with uppercase
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: '900ABC' } });

    // THEN: Match found despite case difference
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
      expect(screen.getByTestId('cliente-list-item')).toHaveTextContent('Empresa A');
    });
  });

  it('[P2] should show clientes-list-panel data-testid on the root container', async () => {
    // GIVEN: Any state
    server.use(http.get(CLIENTES_URL, () => HttpResponse.json([])));

    renderClienteListView();

    // THEN: Root panel has data-testid
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Suppress console.error for expected TanStack Query/MSW noise
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]')
  ) {
    return;
  }
  originalConsoleError(...args);
});
