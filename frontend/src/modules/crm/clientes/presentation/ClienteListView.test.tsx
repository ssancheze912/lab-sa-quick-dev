/**
 * Component Tests — Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * RED PHASE: These tests are intentionally written to FAIL until the implementation
 * described in story 2-1-client-list-search.md is complete.
 *
 * Test level: Component (Vitest + React Testing Library + MSW)
 *
 * Acceptance Criteria covered:
 *   AC#1 — Left panel renders scrollable list with Nombre + NIT per item
 *   AC#2 — Real-time search filters by Nombre or NIT/RUC (no extra API call)
 *   AC#3 — EmptyState shown when no clients exist
 *   AC#4 — ErrorPanel + "Reintentar" button on fetch failure
 *   AC#5 — Clearing search shows all clients without a new API call
 *
 * Test cases:
 *   TC-E2-P1-01: List renders Nombre + NIT per item
 *   TC-E2-P1-02: Real-time search filters by Nombre (no extra fetch)
 *   TC-E2-P1-03: Real-time search filters by NIT/RUC
 *   TC-E2-P1-04: EmptyState shown when data is []
 *   TC-E2-P1-05: ErrorPanel + "Reintentar" on fetch failure
 *   TC-E2-P2-06: Filter 500 records < 150ms
 */

import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll } from 'vitest';
import { ClienteListView } from './ClienteListView';

// ---------------------------------------------------------------------------
// MSW Server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderClienteListView() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>,
  );
}

function buildMockCliente(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
}> = {}) {
  const id = overrides.id ?? `test-id-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    nombre: overrides.nombre ?? `Cliente ${id}`,
    nit: overrides.nit ?? `900${id.slice(0, 6).padStart(6, '0')}-1`,
    telefono: overrides.telefono ?? '3001234567',
    ciudad: overrides.ciudad ?? 'Bogotá',
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00Z',
  };
}

// ---------------------------------------------------------------------------
// TC-E2-P1-01: List renders Nombre + NIT per item
// ---------------------------------------------------------------------------

describe('TC-E2-P1-01 — List renders Nombre and NIT for each client', () => {
  test('should render 3 client items when API returns 3 clients', async () => {
    // GIVEN: The API returns 3 clients
    const clientes = [
      buildMockCliente({ nombre: 'Acme SA', nit: '900111222-1' }),
      buildMockCliente({ nombre: 'Beta Ltda', nit: '900333444-2' }),
      buildMockCliente({ nombre: 'Gamma Corp', nit: '900555666-3' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes),
      ),
    );

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: 3 client list items are visible
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });
  });

  test('should display Nombre for each client in the list', async () => {
    // GIVEN: The API returns a client named "Acme Global SA"
    const clientes = [buildMockCliente({ nombre: 'Acme Global SA', nit: '900111000-1' })];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes),
      ),
    );

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: The Nombre "Acme Global SA" is visible in the list
    await waitFor(() => {
      expect(screen.getByText('Acme Global SA')).toBeInTheDocument();
    });
  });

  test('should display NIT for each client in the list', async () => {
    // GIVEN: The API returns a client with NIT "900111000-1"
    const clientes = [buildMockCliente({ nombre: 'Test Corp', nit: '900111000-1' })];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes),
      ),
    );

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: The NIT "900111000-1" is visible
    await waitFor(() => {
      expect(screen.getByText('900111000-1')).toBeInTheDocument();
    });
  });

  test('should render loading skeleton while data is being fetched', async () => {
    // GIVEN: The API is slow to respond
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((r) => setTimeout(r, 10000));
        return HttpResponse.json([]);
      }),
    );

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: A loading skeleton is displayed (not a spinner)
    expect(screen.getByTestId('clientes-loading-skeleton')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-02: Real-time search filters by Nombre (no extra API call)
// ---------------------------------------------------------------------------

describe('TC-E2-P1-02 — Real-time search filters by Nombre without extra API call', () => {
  test('should filter list to show only matching clients when user types in search field', async () => {
    // GIVEN: 5 clients loaded, 2 with "Acme" in nombre
    const clientes = [
      buildMockCliente({ nombre: 'Acme Global Corp', nit: '900100200-1' }),
      buildMockCliente({ nombre: 'Acme Solutions SAS', nit: '900100201-2' }),
      buildMockCliente({ nombre: 'Beta Services Ltda', nit: '900200300-3' }),
      buildMockCliente({ nombre: 'Gamma Industries SA', nit: '900300400-4' }),
      buildMockCliente({ nombre: 'Delta Ventures Corp', nit: '900400500-5' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes),
      ),
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(5);
    });

    // WHEN: User types "Acme" in the search field
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'Acme');

    // THEN: Only 2 clients matching "Acme" are visible
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });
    expect(screen.getByText('Acme Global Corp')).toBeInTheDocument();
    expect(screen.getByText('Acme Solutions SAS')).toBeInTheDocument();
    expect(screen.queryByText('Beta Services Ltda')).not.toBeInTheDocument();
  });

  test('should NOT trigger a new API call when user types in the search field', async () => {
    // GIVEN: Clients list is loaded
    let apiCallCount = 0;
    const clientes = [
      buildMockCliente({ nombre: 'Acme Corp' }),
      buildMockCliente({ nombre: 'Beta Corp' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () => {
        apiCallCount++;
        return HttpResponse.json(clientes);
      }),
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const initialCallCount = apiCallCount;

    // WHEN: User types in search field
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'Acme');

    // THEN: No additional API calls were made
    expect(apiCallCount).toBe(initialCallCount);
  });

  test('search is case-insensitive for Nombre matching', async () => {
    // GIVEN: A client named "Acme Global Corp" exists
    const clientes = [
      buildMockCliente({ nombre: 'Acme Global Corp' }),
      buildMockCliente({ nombre: 'Beta Corp' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes),
      ),
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: User types lowercase "acme"
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'acme');

    // THEN: "Acme Global Corp" is still found (case-insensitive match)
    await waitFor(() => {
      expect(screen.getByText('Acme Global Corp')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-03: Real-time search filters by NIT/RUC
// ---------------------------------------------------------------------------

describe('TC-E2-P1-03 — Real-time search filters by NIT/RUC', () => {
  test('should filter list to show only client matching partial NIT input', async () => {
    // GIVEN: Two clients with distinct NITs
    const clientes = [
      buildMockCliente({ nombre: 'Empresa Alfa', nit: '999888777-6' }),
      buildMockCliente({ nombre: 'Empresa Beta', nit: '111222333-4' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes),
      ),
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: User types partial NIT "999888" in the search field
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, '999888');

    // THEN: Only "Empresa Alfa" (matching NIT) is visible
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
    expect(screen.getByText('Empresa Alfa')).toBeInTheDocument();
    expect(screen.queryByText('Empresa Beta')).not.toBeInTheDocument();
  });

  test('search is case-insensitive for NIT matching', async () => {
    // GIVEN: A client with NIT containing letters (e.g., Colombian NIT format)
    const clientes = [
      buildMockCliente({ nombre: 'Test Corp', nit: 'ABC-123456-7' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes),
      ),
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User types lowercase "abc" in the search field
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'abc');

    // THEN: The client is still visible (case-insensitive match)
    await waitFor(() => {
      expect(screen.getByText('Test Corp')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-04: EmptyState shown when data is []
// ---------------------------------------------------------------------------

describe('TC-E2-P1-04 — EmptyState component shown when no clients exist', () => {
  test('should display EmptyState component when API returns an empty array', async () => {
    // GIVEN: The API returns an empty array
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([]),
      ),
    );

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: EmptyState component with data-testid="empty-state" is displayed
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  test('should display Spanish guidance message in the EmptyState component', async () => {
    // GIVEN: No clients exist
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([]),
      ),
    );

    // WHEN: ClienteListView is rendered and EmptyState is shown
    renderClienteListView();

    // THEN: EmptyState contains a Spanish message guiding user to create first client
    await waitFor(() => {
      const emptyState = screen.getByTestId('empty-state');
      expect(emptyState.textContent).toMatch(/cliente|crear|primero/i);
    });
  });

  test('should NOT display any client list items when EmptyState is shown', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([]),
      ),
    );

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: No client items are rendered
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-05: ErrorPanel + "Reintentar" on fetch failure
// ---------------------------------------------------------------------------

describe('TC-E2-P1-05 — ErrorPanel shown with "Reintentar" button on fetch failure', () => {
  test('should display ErrorPanel component when the API returns 500', async () => {
    // GIVEN: The API returns a 500 error
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ detail: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: ErrorPanel component with data-testid="error-panel" is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  test('should display a "Reintentar" button inside the ErrorPanel', async () => {
    // GIVEN: The API returns a 500 error
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ detail: 'Error' }, { status: 500 }),
      ),
    );

    // WHEN: ClienteListView is rendered and ErrorPanel is shown
    renderClienteListView();

    // THEN: A button with label "Reintentar" is visible inside the ErrorPanel
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /reintentar/i }),
      ).toBeInTheDocument();
    });
  });

  test('should trigger a refetch when user clicks the "Reintentar" button', async () => {
    // GIVEN: First request fails with 500
    let callCount = 0;

    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ detail: 'Error' }, { status: 500 });
        }
        return HttpResponse.json([]);
      }),
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    const initialCallCount = callCount;

    // WHEN: User clicks "Reintentar"
    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    await userEvent.click(retryButton);

    // THEN: A second API call was triggered (refetch happened)
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(initialCallCount);
    });
  });

  test('should NOT display raw error.message to the user inside the ErrorPanel', async () => {
    // GIVEN: The API returns an error with internal message details
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(
          { detail: 'Internal server error: NullReferenceException at line 42' },
          { status: 500 },
        ),
      ),
    );

    // WHEN: ClienteListView renders with error state
    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // THEN: Raw internal error detail is NOT exposed in the UI (NFR6)
    expect(screen.queryByText(/NullReferenceException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/line 42/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC#5 — Clearing search shows all clients without extra API call
// ---------------------------------------------------------------------------

describe('AC#5 — Clearing search field restores full list without extra API call', () => {
  test('should show all clients again when search field is cleared', async () => {
    // GIVEN: Two clients loaded
    let apiCallCount = 0;
    const clientes = [
      buildMockCliente({ nombre: 'Empresa Alfa SAS', nit: '800100200-1' }),
      buildMockCliente({ nombre: 'Empresa Beta Ltda', nit: '900200300-2' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () => {
        apiCallCount++;
        return HttpResponse.json(clientes);
      }),
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const initialCallCount = apiCallCount;

    // WHEN: User types to filter
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'Alfa');

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // AND: User clears the search field
    await userEvent.clear(searchInput);

    // THEN: All clients are visible again
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });
    expect(screen.getByText('Empresa Alfa SAS')).toBeInTheDocument();
    expect(screen.getByText('Empresa Beta Ltda')).toBeInTheDocument();

    // AND: No extra API call was triggered
    expect(apiCallCount).toBe(initialCallCount);
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P2-06: Filter 500 records < 150ms (performance)
// ---------------------------------------------------------------------------

describe('TC-E2-P2-06 — Filter performance: 500 clients filtered in under 150ms', () => {
  test('should filter 500 clients within 150ms using useMemo client-side filter', async () => {
    // GIVEN: 500 mock clients loaded
    const clientes = Array.from({ length: 500 }, (_, i) =>
      buildMockCliente({
        id: `perf-id-${i}`,
        nombre: i % 10 === 0 ? `Acme Client ${i}` : `Other Corp ${i}`,
        nit: `${900000000 + i}-${i % 10}`,
      }),
    );

    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json(clientes),
      ),
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500);
    });

    const searchInput = screen.getByTestId('clientes-search-input');

    // WHEN: User types "Acme" to filter 500 records
    const start = performance.now();
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Acme' } });
    });
    const elapsed = performance.now() - start;

    // THEN: Filter completes in under 150ms (NFR1 requirement)
    expect(elapsed).toBeLessThan(150);

    // AND: Only the 50 "Acme" clients are visible (every 10th)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(50);
    });
  });
});

// ---------------------------------------------------------------------------
// Search input — Spanish placeholder
// ---------------------------------------------------------------------------

describe('Search input — Spanish placeholder text', () => {
  test('should have the Spanish placeholder "Buscar por nombre o NIT/RUC..."', async () => {
    // GIVEN: The API returns some clients
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json([buildMockCliente()]),
      ),
    );

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    await waitFor(() => {
      expect(screen.getByTestId('clientes-search-input')).toBeInTheDocument();
    });

    // THEN: The search input has the Spanish placeholder
    expect(screen.getByTestId('clientes-search-input')).toHaveAttribute(
      'placeholder',
      expect.stringMatching(/buscar por nombre o nit/i),
    );
  });
});
