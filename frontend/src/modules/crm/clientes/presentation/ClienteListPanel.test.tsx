/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Component Tests (Vitest + React Testing Library + MSW) — RED Phase
 * Tests fail until ClienteListPanel, EmptyState, and ErrorPanel are implemented.
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel renders scrollable client list with Nombre and NIT/RUC per item
 *   AC2 — Real-time search filter by Nombre (no extra API call, result < 1s for 500 records)
 *   AC3 — EmptyState shown when API returns empty array
 *   AC4 — ErrorPanel with "Reintentar" button shown on network failure; retry re-fetches
 *   AC5 — Clearing search field restores full client list
 *
 * Test Cases:
 *   TC-E2-P1-01 — List renders all clients from API
 *   TC-E2-P1-02 — EmptyState shown when no clients
 *   TC-E2-P1-03 — ErrorPanel + Reintentar on network error
 *   TC-E2-P1-04 — Real-time search filters by Nombre
 *   TC-E2-P1-05 — Real-time search filters by NIT/RUC; clearing restores full list
 *   TC-E2-P2-06 — Client-side filter over 500 records completes under 1 second (NFR1)
 */

import { describe, test, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// These modules do not exist yet — tests will fail (RED phase)
import { ClienteListPanel } from './ClienteListPanel';

// ─── MSW Server Setup ────────────────────────────────────────────────────────

const mockClientes = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    nombre: 'Acme Colombia SA',
    nit: '900111222',
    telefono: '3001234567',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    nombre: 'Beta Ltda',
    nit: '800333444',
    telefono: '3109876543',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    nombre: 'Gamma Corp',
    nit: '700555666',
    telefono: '3207654321',
    ciudad: 'Cali',
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-01-03T00:00:00Z',
  },
];

const server = setupServer(
  http.get('*/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement, queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return render(ui, { wrapper: Wrapper });
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-01 — AC1: Renders all clients from API
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — TC-E2-P1-01: Client list renders all clients from API', () => {
  test('should render the left panel with data-testid="clientes-list-panel"', async () => {
    // GIVEN: MSW intercepts GET /api/v1/clientes and returns 3 clients
    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: The left panel container is present in the DOM
    await waitFor(() =>
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument()
    );
  });

  test('should render exactly 3 client items when API returns 3 records', async () => {
    // GIVEN: MSW returns 3 clients
    // WHEN: ClienteListPanel is rendered and loading completes
    renderWithProviders(<ClienteListPanel />);

    // THEN: Exactly 3 list items are rendered
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );
  });

  test('should display Nombre for each client item', async () => {
    // GIVEN: MSW returns clients including "Acme Colombia SA"
    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: Nombre is visible per item
    await waitFor(() =>
      expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument()
    );
    expect(screen.getByText('Beta Ltda')).toBeInTheDocument();
    expect(screen.getByText('Gamma Corp')).toBeInTheDocument();
  });

  test('should display NIT/RUC for each client item', async () => {
    // GIVEN: MSW returns clients with NIT values
    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: NIT/RUC is visible per item
    await waitFor(() =>
      expect(screen.getByText('900111222')).toBeInTheDocument()
    );
    expect(screen.getByText('800333444')).toBeInTheDocument();
    expect(screen.getByText('700555666')).toBeInTheDocument();
  });

  test('should render the list container with role="list"', async () => {
    // GIVEN: MSW returns 3 clients
    // WHEN: ClienteListPanel renders its list
    renderWithProviders(<ClienteListPanel />);

    // THEN: Accessible list role is present (WCAG 2.1 AA)
    await waitFor(() =>
      expect(screen.getByRole('list')).toBeInTheDocument()
    );
  });

  test('should render each item with role="listitem"', async () => {
    // GIVEN: MSW returns 3 clients
    // WHEN: ClienteListPanel renders all items
    renderWithProviders(<ClienteListPanel />);

    // THEN: Each item has role="listitem" (WCAG 2.1 AA)
    await waitFor(() =>
      expect(screen.getAllByRole('listitem')).toHaveLength(3)
    );
  });

  test('should render the search input with aria-label="Buscar clientes"', async () => {
    // GIVEN: MSW returns clients
    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: Search input has correct accessible label (WCAG 2.1 AA)
    await waitFor(() =>
      expect(
        screen.getByRole('searchbox', { name: /buscar clientes/i })
      ).toBeInTheDocument()
    );
  });

  test('should render search input with placeholder "Buscar por nombre o NIT/RUC..."', async () => {
    // GIVEN: MSW returns clients
    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: Search placeholder text is present
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i)
      ).toBeInTheDocument()
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-02 — AC3: EmptyState shown when no clients
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — TC-E2-P1-02: EmptyState shown when no clients exist', () => {
  test('should render EmptyState component when API returns empty array', async () => {
    // GIVEN: MSW returns an empty client list
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: EmptyState component is visible
    await waitFor(() =>
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    );
  });

  test('should display a guiding message when no clients exist', async () => {
    // GIVEN: MSW returns an empty client list
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: Message guides user to create their first client (in Spanish)
    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument()
    );
    // Message should contain guidance about creating first client
    const statusEl = screen.getByRole('status');
    expect(statusEl.textContent).toMatch(/primer cliente|crear|nuevo/i);
  });

  test('should NOT render any list items when API returns empty array', async () => {
    // GIVEN: MSW returns empty list
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: No client items are rendered
    await waitFor(() =>
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    );
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-03 — AC4: ErrorPanel + Reintentar on network error
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — TC-E2-P1-03: ErrorPanel with Reintentar on network failure', () => {
  test('should render ErrorPanel when GET /api/v1/clientes returns network error', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: ErrorPanel is rendered with role="alert" (WCAG 2.1 AA)
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    );
  });

  test('should display a "Reintentar" button inside ErrorPanel', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteListPanel renders in error state
    renderWithProviders(<ClienteListPanel />);

    // THEN: A button labeled exactly "Reintentar" is present (AC4 exact wording)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Reintentar' })
      ).toBeInTheDocument()
    );
  });

  test('should re-fetch and render clients when Reintentar is clicked after error', async () => {
    // GIVEN: First request fails with a network error
    let callCount = 0;
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.error();
        }
        return HttpResponse.json(mockClientes);
      })
    );

    // WHEN: ClienteListPanel is rendered in error state
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    // Wait for error panel to appear
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    );

    // AND WHEN: User clicks "Reintentar"
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    // THEN: List renders successfully after retry
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );
  });

  test('should NOT render client list items when in error state', async () => {
    // GIVEN: Network error
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteListPanel is in error state
    renderWithProviders(<ClienteListPanel />);

    // THEN: No client items are rendered
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    );
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-04 — AC2: Real-time search filters by Nombre (no extra API call)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — TC-E2-P1-04: Real-time search filters by Nombre', () => {
  test('should filter list to show only matching client when Nombre is typed', async () => {
    // GIVEN: MSW returns 3 clients: "Acme Colombia SA", "Beta Ltda", "Gamma Corp"
    // WHEN: User types "Acme" in the search field
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    await user.type(screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i), 'Acme');

    // THEN: Only "Acme Colombia SA" is visible
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    );
    expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument();
    expect(screen.queryByText('Beta Ltda')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Corp')).not.toBeInTheDocument();
  });

  test('should perform case-insensitive Nombre filtering', async () => {
    // GIVEN: 3 clients loaded
    // WHEN: User types lowercase "acme"
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    await user.type(screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i), 'acme');

    // THEN: "Acme Colombia SA" is still found (case-insensitive)
    await waitFor(() =>
      expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument()
    );
    expect(screen.queryByText('Beta Ltda')).not.toBeInTheDocument();
  });

  test('should NOT trigger an additional API call when typing in search field (AC2/NFR1)', async () => {
    // GIVEN: MSW intercepts are tracked via a request counter
    let apiCallCount = 0;
    server.use(
      http.get('*/api/v1/clientes', () => {
        apiCallCount++;
        return HttpResponse.json(mockClientes);
      })
    );

    // WHEN: ClienteListPanel loads and user types in search
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    const callsAfterInitialLoad = apiCallCount;

    await user.type(screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i), 'Acme');

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    );

    // THEN: API was called exactly once (initial load only — filter is client-side)
    expect(apiCallCount).toBe(callsAfterInitialLoad);
  });

  test('should show all clients when search term has no match', async () => {
    // GIVEN: 3 clients loaded
    // WHEN: User types a non-matching term
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    await user.type(screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i), 'ZZZNOMATCH');

    // THEN: No items shown (or EmptyState for search result, no error)
    await waitFor(() =>
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-05 — AC2/AC5: Search filters by NIT/RUC; clearing restores full list
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2+AC5 — TC-E2-P1-05: Search filters by NIT/RUC; clear restores full list', () => {
  test('should filter list to show only matching client when NIT/RUC is typed', async () => {
    // GIVEN: 3 clients loaded with distinct NIT values
    // WHEN: User types the NIT of the second client "800333444"
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    await user.type(screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i), '800333444');

    // THEN: Only "Beta Ltda" (with nit 800333444) is visible
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    );
    expect(screen.getByText('Beta Ltda')).toBeInTheDocument();
    expect(screen.queryByText('Acme Colombia SA')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Corp')).not.toBeInTheDocument();
  });

  test('should restore full list when search field is cleared (AC5)', async () => {
    // GIVEN: User has filtered by NIT
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i);

    // Filter first
    await user.type(searchInput, '800333444');
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    );

    // WHEN: User clears the search field
    await user.clear(searchInput);

    // THEN: All 3 clients are visible again (AC5)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );
    expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument();
    expect(screen.getByText('Beta Ltda')).toBeInTheDocument();
    expect(screen.getByText('Gamma Corp')).toBeInTheDocument();
  });

  test('should NOT trigger an extra API call when filtering by NIT/RUC (NFR1)', async () => {
    // GIVEN: MSW tracks call count
    let apiCallCount = 0;
    server.use(
      http.get('*/api/v1/clientes', () => {
        apiCallCount++;
        return HttpResponse.json(mockClientes);
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    const callsAfterLoad = apiCallCount;

    // WHEN: User types NIT in search
    await user.type(screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i), '700555666');

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    );

    // THEN: No additional API call was made
    expect(apiCallCount).toBe(callsAfterLoad);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-06 — NFR1: Client-side filter over 500 records completes under 1 second
// ─────────────────────────────────────────────────────────────────────────────

describe('NFR1 — TC-E2-P2-06: Client-side filter over 500 records under 1 second', () => {
  test('should filter 500 mock clients in under 1000ms (NFR1)', async () => {
    // GIVEN: A mock array of 500 ClienteDTO objects is generated
    const clientes500 = Array.from({ length: 500 }, (_, i) => ({
      id: `${i.toString().padStart(8, '0')}-0000-0000-0000-000000000000`,
      nombre: i % 10 === 0 ? `Test Corp ${i}` : `Cliente ${i}`,
      nit: `9${i.toString().padStart(8, '0')}`,
      telefono: `300${i.toString().padStart(7, '0')}`,
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }));

    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json(clientes500);
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    // Wait for 500 items to load
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500),
      { timeout: 5000 }
    );

    // WHEN: User types a search term over the 500-record cache
    const start = performance.now();

    await user.type(screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i), 'Test Corp');

    // THEN: Filter result is visible (50 items match "Test Corp" in our dataset)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(50)
    );

    const elapsed = performance.now() - start;

    // AND: Total elapsed time is under 1000ms (NFR1)
    expect(elapsed).toBeLessThan(1000);
  });
});
