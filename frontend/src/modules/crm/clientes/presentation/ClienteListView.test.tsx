/**
 * Story 2.1: Client List & Search — Component Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) renders scrollable list with Nombre + NIT/RUC per item
 *   AC2 — Real-time search filters by Nombre or NIT/RUC (case-insensitive, ≤1s with 500 records)
 *   AC3 — EmptyState shown when backend returns empty array
 *   AC4 — ErrorPanel with "Reintentar" button on backend failure, retry triggers refetch
 *   AC6 — Accessibility: aria-label="Buscar clientes", role="list", role="listitem"
 *
 * Test status: RED — tests will fail until implementation is complete.
 * Framework: Vitest + @testing-library/react + MSW
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Component under test — does not exist yet (RED phase)
// @ts-expect-error — module does not exist until implementation
import { ClienteListView } from './ClienteListView';

// ─────────────────────────────────────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────────────────────────────────────

const mockClientes = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    nombre: 'Acme Colombia SAS',
    nit: '900123456-7',
    telefono: '+57 601 234 5678',
    ciudad: 'Bogotá',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    nombre: 'TechCorp Ltda',
    nit: '800500100-1',
    telefono: '+57 604 345 6789',
    ciudad: 'Medellín',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    nombre: 'Global Services SA',
    nit: '700400200-3',
    telefono: '+57 605 456 7890',
    ciudad: 'Cali',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('*/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test wrapper
// ─────────────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function renderClienteListView(props = {}) {
  const defaultProps = {
    selectedClienteId: undefined,
    onClienteSelect: vi.fn(),
    ...props,
  };
  return render(
    <ClienteListView {...defaultProps} />,
    { wrapper: createWrapper() }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Left panel renders scrollable list with Nombre + NIT/RUC per item
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Client list renders with correct structure', () => {
  it('should render the list panel container with data-testid="clientes-list-panel"', async () => {
    // GIVEN: Backend returns a list of clients
    // (MSW default handler returns mockClientes)

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: The list panel container is present
    expect(screen.getByTestId('clientes-list-panel')).toBeDefined();
  });

  it('should render a ul element with role="list" after clients load', async () => {
    // GIVEN: Backend returns clients
    renderClienteListView();

    // WHEN: Data loads
    const listElement = await screen.findByRole('list');

    // THEN: The list container has role="list"
    expect(listElement).toBeDefined();
  });

  it('should render a list item for each client returned by the API', async () => {
    // GIVEN: Backend returns 3 clients
    renderClienteListView();

    // WHEN: Data loads
    const items = await screen.findAllByRole('listitem');

    // THEN: 3 list items are rendered
    expect(items).toHaveLength(3);
  });

  it('should display client Nombre in each list item', async () => {
    // GIVEN: Backend returns clients including "Acme Colombia SAS"
    renderClienteListView();

    // WHEN: Data loads
    await screen.findByRole('list');

    // THEN: Client name is visible
    expect(screen.getByText('Acme Colombia SAS')).toBeDefined();
  });

  it('should display client NIT/RUC in each list item', async () => {
    // GIVEN: Backend returns clients including NIT "900123456-7"
    renderClienteListView();

    // WHEN: Data loads
    await screen.findByRole('list');

    // THEN: NIT is visible in the list
    expect(screen.getByText('900123456-7')).toBeDefined();
  });

  it('should render list items with role="listitem"', async () => {
    // GIVEN: Backend returns clients
    renderClienteListView();

    // WHEN: Data loads
    const items = await screen.findAllByTestId('cliente-list-item');

    // THEN: Each item exists
    expect(items.length).toBeGreaterThan(0);
  });

  it('should render skeleton rows when data is loading (isLoading state)', () => {
    // GIVEN: Backend is slow (handler delays response)
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return HttpResponse.json(mockClientes);
      })
    );

    // WHEN: ClienteListView renders before data arrives
    renderClienteListView();

    // THEN: Skeleton loading rows are rendered (no spinner)
    const skeletons = screen.queryAllByTestId('skeleton-row');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time search filters by Nombre or NIT/RUC (case-insensitive)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Real-time search filters client list', () => {
  it('should render the search input with aria-label="Buscar clientes"', async () => {
    // GIVEN: ClienteListView is rendered
    renderClienteListView();

    // WHEN: Component is mounted
    await screen.findByRole('list');

    // THEN: Search input has correct aria-label
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    expect(searchInput).toBeDefined();
  });

  it('should render the search input with placeholder text in Spanish', async () => {
    // GIVEN: ClienteListView is rendered
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: Inspecting the search input
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });

    // THEN: Placeholder is in Spanish
    expect(searchInput.getAttribute('placeholder')).toContain('nombre');
  });

  it('should filter list to show only matching clients when user types by Nombre', async () => {
    // GIVEN: List is loaded with 3 clients
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: User types "TechCorp" in the search field
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    await userEvent.type(searchInput, 'TechCorp');

    // THEN: Only "TechCorp Ltda" is visible
    expect(screen.getByText('TechCorp Ltda')).toBeDefined();
    expect(screen.queryByText('Acme Colombia SAS')).toBeNull();
    expect(screen.queryByText('Global Services SA')).toBeNull();
  });

  it('should filter list to show only matching clients when user types by NIT', async () => {
    // GIVEN: List is loaded with 3 clients
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: User types "800500100" (NIT of TechCorp) in the search field
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    await userEvent.type(searchInput, '800500100');

    // THEN: Only "TechCorp Ltda" is visible (matched by NIT)
    expect(screen.getByText('TechCorp Ltda')).toBeDefined();
    expect(screen.queryByText('Acme Colombia SAS')).toBeNull();
  });

  it('should filter case-insensitively (uppercase query matches lowercase data)', async () => {
    // GIVEN: List is loaded with 3 clients
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: User types uppercase "ACME"
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    await userEvent.type(searchInput, 'ACME');

    // THEN: "Acme Colombia SAS" is still visible
    expect(screen.getByText('Acme Colombia SAS')).toBeDefined();
  });

  it('should show all clients again when search field is cleared', async () => {
    // GIVEN: User had typed a filter and then clears it
    renderClienteListView();
    await screen.findByRole('list');
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    await userEvent.type(searchInput, 'TechCorp');

    // WHEN: User clears the search field
    await userEvent.clear(searchInput);

    // THEN: All 3 clients are visible again
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('should complete filtering within 1000ms for 500 records (performance — AC2 NFR1)', async () => {
    // GIVEN: 500 mock clients in the list
    const clients500 = Array.from({ length: 500 }, (_, i) => ({
      id: `${i}-${i}-4${i}-8${i}-${i}${i}`,
      nombre: `Cliente Empresa ${i}`,
      nit: `9${String(i).padStart(8, '0')}-${i % 9}`,
      telefono: `300${String(i).padStart(7, '0')}`,
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }));

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clients500))
    );

    renderClienteListView();
    await screen.findByRole('list');

    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });

    // WHEN: User types a 3-character query over 500 records
    const start = performance.now();
    fireEvent.change(searchInput, { target: { value: 'acm' } });
    const elapsed = performance.now() - start;

    // THEN: Filter completes within 1000ms
    expect(elapsed).toBeLessThan(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState shown when backend returns empty array
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — EmptyState when no clients exist', () => {
  it('should render EmptyState component when API returns empty array', async () => {
    // GIVEN: Backend returns empty array
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([]))
    );

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: EmptyState is rendered with data-testid="empty-state"
    const emptyState = await screen.findByTestId('empty-state');
    expect(emptyState).toBeDefined();
  });

  it('should display Spanish guidance message in EmptyState', async () => {
    // GIVEN: Backend returns empty array
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([]))
    );

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: Spanish message appears in the empty state
    const message = await screen.findByText(/No hay clientes registrados/i);
    expect(message).toBeDefined();
  });

  it('should NOT render any list items when EmptyState is displayed', async () => {
    // GIVEN: Backend returns empty array
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([]))
    );

    // WHEN: ClienteListView renders
    renderClienteListView();
    await screen.findByTestId('empty-state');

    // THEN: No list items rendered
    const items = screen.queryAllByTestId('cliente-list-item');
    expect(items).toHaveLength(0);
  });

  it('should display EmptyState with "no results" message when search yields no matches', async () => {
    // GIVEN: 3 clients loaded, none matching "ZZZZZ"
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: User types "ZZZZZ" — no match
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    await userEvent.type(searchInput, 'ZZZZZ');

    // THEN: EmptyState is shown with "no results" message (not the "create first" variant)
    const emptyState = screen.getByTestId('empty-state');
    expect(emptyState).toBeDefined();
    expect(screen.getByText(/No se encontraron clientes/i)).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel with "Reintentar" shown on backend failure
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — ErrorPanel when backend is unavailable', () => {
  it('should render ErrorPanel component when GET /api/v1/clientes returns 500', async () => {
    // GIVEN: Backend is unavailable (returns 500)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 })
      )
    );

    // WHEN: ClienteListView renders and fetch fails
    renderClienteListView();

    // THEN: ErrorPanel is rendered (role="alert")
    const errorPanel = await screen.findByRole('alert');
    expect(errorPanel).toBeDefined();
  });

  it('should display "Reintentar" button inside ErrorPanel', async () => {
    // GIVEN: Backend returns network error
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.error())
    );

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: "Reintentar" button is visible
    const retryButton = await screen.findByRole('button', { name: /Reintentar/i });
    expect(retryButton).toBeDefined();
  });

  it('should NOT render any client list items when ErrorPanel is displayed', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({}, { status: 500 })
      )
    );

    // WHEN: ClienteListView renders
    renderClienteListView();
    await screen.findByRole('alert');

    // THEN: No client items are rendered
    const items = screen.queryAllByTestId('cliente-list-item');
    expect(items).toHaveLength(0);
  });

  it('should trigger a refetch when "Reintentar" button is clicked', async () => {
    // GIVEN: Backend initially returns 500, then succeeds on retry
    let callCount = 0;
    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json({}, { status: 500 });
        }
        return HttpResponse.json(mockClientes);
      })
    );

    // WHEN: User clicks "Reintentar"
    renderClienteListView();
    const retryButton = await screen.findByRole('button', { name: /Reintentar/i });
    await userEvent.click(retryButton);

    // THEN: A second GET /api/v1/clientes request is triggered (callCount >= 2)
    await screen.findByRole('list');
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Accessibility: aria-label, role="list", role="listitem", aria-label per item
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Accessibility requirements', () => {
  it('should have search input with aria-label="Buscar clientes"', async () => {
    // GIVEN: ClienteListView is rendered
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: Inspecting the search input
    // THEN: aria-label is correctly set
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    expect(searchInput.getAttribute('aria-label')).toBe('Buscar clientes');
  });

  it('should have list container with role="list"', async () => {
    // GIVEN: Clients are loaded
    renderClienteListView();

    // WHEN: Data loads
    const list = await screen.findByRole('list');

    // THEN: List has role="list"
    expect(list).toBeDefined();
  });

  it('should have each list item with role="listitem"', async () => {
    // GIVEN: Clients are loaded
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: Inspecting items
    const items = screen.getAllByRole('listitem');

    // THEN: Each item has role="listitem"
    expect(items.length).toBe(3);
  });

  it('should have aria-label on each list item combining Nombre and NIT/RUC in Spanish', async () => {
    // GIVEN: Client "Acme Colombia SAS" with NIT "900123456-7" is loaded
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: Inspecting the first list item's accessible label
    const firstItem = screen.getAllByRole('listitem')[0];

    // THEN: aria-label contains both name and NIT in Spanish format
    const ariaLabel = firstItem.getAttribute('aria-label') ?? '';
    expect(ariaLabel).toContain('Acme Colombia SAS');
    expect(ariaLabel).toContain('NIT');
    expect(ariaLabel).toContain('900123456-7');
  });

  it('should set aria-current="true" on the selected client list item', async () => {
    // GIVEN: Client "11111111-1111-4111-8111-111111111111" is selected
    renderClienteListView({
      selectedClienteId: '11111111-1111-4111-8111-111111111111',
    });
    await screen.findByRole('list');

    // WHEN: Inspecting the first item
    const firstItem = screen.getAllByRole('listitem')[0];

    // THEN: aria-current is "true" on the selected item
    expect(firstItem.getAttribute('aria-current')).toBe('true');
  });

  it('should call onClienteSelect with client id when a list item is clicked', async () => {
    // GIVEN: ClienteListView is rendered with a mock callback
    const onClienteSelect = vi.fn();
    renderClienteListView({ onClienteSelect });
    await screen.findByRole('list');

    // WHEN: User clicks on the first client
    const firstItem = screen.getAllByRole('listitem')[0];
    await userEvent.click(firstItem);

    // THEN: onClienteSelect is called with the client's id
    expect(onClienteSelect).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });
});
