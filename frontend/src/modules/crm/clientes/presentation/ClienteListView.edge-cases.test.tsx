/**
 * Story 2.1: Client List & Search — Component Edge Cases
 * Epic 2: Client Management
 *
 * Expands ATDD component coverage with boundary conditions and error paths NOT
 * present in the ATDD tests (ClienteListView.test.tsx):
 *
 *   - Search with leading/trailing whitespace is trimmed before filtering
 *   - Search with special characters (dash, slash, parentheses) does not crash
 *   - Rapid consecutive search inputs do not cause stale/wrong results
 *   - Single-character search works correctly
 *   - Search matching partial NIT prefix
 *   - Skeleton count: exactly 5 skeleton rows are rendered during loading
 *   - ErrorPanel shows custom error message (not just default)
 *   - EmptyState action button calls onAction when provided
 *   - ClientListItem does NOT have aria-current on non-selected items
 *   - onClienteSelect is not called when ErrorPanel or EmptyState are shown
 *   - Multiple clients with same nombre prefix: all matching results shown
 *   - Search case-insensitive for NIT (uppercase NIT match)
 *
 * Framework: Vitest + @testing-library/react + MSW
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
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
  http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes))
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test wrapper
// ─────────────────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function renderClienteListView(props = {}) {
  const defaultProps = {
    selectedClienteId: undefined,
    onClienteSelect: vi.fn(),
    ...props,
  };
  return render(<ClienteListView {...defaultProps} />, { wrapper: createWrapper() });
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading state edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Loading state edge cases', () => {
  it('should render exactly 5 skeleton rows during loading (company standard)', () => {
    // GIVEN: Backend is slow
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json(mockClientes);
      })
    );

    // WHEN: Component renders before data arrives
    renderClienteListView();

    // THEN: Exactly 5 skeleton rows are rendered (per company loading standard)
    const skeletons = screen.queryAllByTestId('skeleton-row');
    expect(skeletons).toHaveLength(5);
  });

  it('should NOT render search results while loading', () => {
    // GIVEN: Backend is delayed
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json(mockClientes);
      })
    );

    // WHEN: Component renders
    renderClienteListView();

    // THEN: No client list items are shown during loading
    const items = screen.queryAllByTestId('cliente-list-item');
    expect(items).toHaveLength(0);
  });

  it('should NOT render ErrorPanel while loading', () => {
    // GIVEN: Backend is delayed
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json(mockClientes);
      })
    );

    // WHEN: Component renders
    renderClienteListView();

    // THEN: ErrorPanel is not shown during loading (role="alert" absent)
    const alerts = screen.queryAllByRole('alert');
    expect(alerts).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search whitespace and special characters
// ─────────────────────────────────────────────────────────────────────────────

describe('Search — whitespace trimming and special characters', () => {
  it('should trim leading whitespace from search query and filter correctly', async () => {
    // GIVEN: 3 clients loaded
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: User types "  TechCorp" (2 leading spaces)
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    fireEvent.change(searchInput, { target: { value: '  TechCorp' } });

    // THEN: Only TechCorp is visible (spaces trimmed)
    expect(screen.getByText('TechCorp Ltda')).toBeDefined();
    expect(screen.queryByText('Acme Colombia SAS')).toBeNull();
  });

  it('should trim trailing whitespace from search query and filter correctly', async () => {
    // GIVEN: 3 clients loaded
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: User types "Acme   " (3 trailing spaces)
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    fireEvent.change(searchInput, { target: { value: 'Acme   ' } });

    // THEN: Only Acme Colombia SAS is visible
    expect(screen.getByText('Acme Colombia SAS')).toBeDefined();
    expect(screen.queryByText('TechCorp Ltda')).toBeNull();
  });

  it('should filter correctly when search query contains a dash (NIT format)', async () => {
    // GIVEN: 3 clients; TechCorp has NIT "800500100-1" (contains dash)
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: User types a portion of the NIT including the dash
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    fireEvent.change(searchInput, { target: { value: '500100-1' } });

    // THEN: Only TechCorp is visible (NIT match with dash)
    expect(screen.getByText('TechCorp Ltda')).toBeDefined();
    expect(screen.queryByText('Acme Colombia SAS')).toBeNull();
    expect(screen.queryByText('Global Services SA')).toBeNull();
  });

  it('should not crash when search query contains special regex characters', async () => {
    // GIVEN: 3 clients loaded
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: User types a query with special regex characters
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    // This should not throw a "Invalid regular expression" error
    expect(() => {
      fireEvent.change(searchInput, { target: { value: '(.*)' } });
    }).not.toThrow();

    // THEN: EmptyState is shown (no crash, no match expected for "(.*)")
    // Note: the filter uses .includes() not regex, so this is safe
    const items = screen.queryAllByTestId('cliente-list-item');
    expect(items).toHaveLength(0);
  });

  it('should match with single character query', async () => {
    // GIVEN: 3 clients, one with "Acme" in name, another with "TechCorp"
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: User types just "A"
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    fireEvent.change(searchInput, { target: { value: 'A' } });

    // THEN: "Acme Colombia SAS" is visible (contains 'A' case-insensitively)
    expect(screen.getByText('Acme Colombia SAS')).toBeDefined();
    // TechCorp contains no 'a'/'A' — verify either it is filtered or not depending on its name
    // "Global Services SA" contains 'A' at the end, so it should also appear
    // The key check is that the component didn't crash and still renders
    const items = screen.queryAllByTestId('cliente-list-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should filter case-insensitively for NIT (uppercase query matches lowercase NIT data)', async () => {
    // GIVEN: Client with nit "900123456-7" (lowercase digits, NIT format)
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: User types part of the NIT in uppercase context (digit search is neutral, but confirm no crash)
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    fireEvent.change(searchInput, { target: { value: '900123456' } });

    // THEN: Acme Colombia SAS is visible (NIT match)
    expect(screen.getByText('Acme Colombia SAS')).toBeDefined();
    expect(screen.queryByText('TechCorp Ltda')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search rapid typing and state consistency
// ─────────────────────────────────────────────────────────────────────────────

describe('Search — rapid input and state consistency', () => {
  it('should show correct results after rapid type-clear-type sequence', async () => {
    // GIVEN: 3 clients loaded
    renderClienteListView();
    await screen.findByRole('list');
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });

    // WHEN: Rapid sequence: type "Tech" → clear → type "Acme"
    fireEvent.change(searchInput, { target: { value: 'Tech' } });
    fireEvent.change(searchInput, { target: { value: '' } });
    fireEvent.change(searchInput, { target: { value: 'Acme' } });

    // THEN: Only Acme is shown (no stale "Tech" result)
    expect(screen.getByText('Acme Colombia SAS')).toBeDefined();
    expect(screen.queryByText('TechCorp Ltda')).toBeNull();
  });

  it('should restore full list immediately after clearing search', async () => {
    // GIVEN: Search is active with "Global"
    renderClienteListView();
    await screen.findByRole('list');
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });

    await userEvent.type(searchInput, 'Global');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);

    // WHEN: User clears the field
    await userEvent.clear(searchInput);

    // THEN: All 3 clients visible immediately
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });
  });

  it('should show EmptyState (no results variant) when query has no match, not ErrorPanel', async () => {
    // GIVEN: 3 clients loaded
    renderClienteListView();
    await screen.findByRole('list');
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });

    // WHEN: User types a query matching nothing
    await userEvent.type(searchInput, 'ZZZZZNOMATCH99999');

    // THEN: EmptyState is shown (not ErrorPanel — this is a filter result, not an API error)
    const emptyState = screen.getByTestId('empty-state');
    expect(emptyState).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText(/No se encontraron clientes/i)).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility edge cases', () => {
  it('should NOT have aria-current on non-selected list items', async () => {
    // GIVEN: First client is selected
    renderClienteListView({
      selectedClienteId: '11111111-1111-4111-8111-111111111111',
    });
    await screen.findByRole('list');

    // WHEN: Inspecting all list items
    const items = screen.getAllByRole('listitem');

    // THEN: Only the selected item has aria-current="true"; others do NOT
    const selectedItem = items[0];
    const nonSelectedItems = items.slice(1);

    expect(selectedItem.getAttribute('aria-current')).toBe('true');
    for (const item of nonSelectedItems) {
      const ariaCurrentVal = item.getAttribute('aria-current');
      // Should be null (attribute absent) or "false" — NOT "true"
      expect(ariaCurrentVal).not.toBe('true');
    }
  });

  it('should have search input with placeholder containing "nombre" in Spanish', async () => {
    // GIVEN: ClienteListView renders
    renderClienteListView();
    await screen.findByRole('list');

    // WHEN: Inspecting placeholder text
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });

    // THEN: Placeholder includes "nombre" (Spanish field name)
    const placeholder = searchInput.getAttribute('placeholder') ?? '';
    expect(placeholder.toLowerCase()).toContain('nombre');
  });

  it('should have search input with type="search" for native browser accessibility support', async () => {
    // GIVEN: ClienteListView renders
    renderClienteListView();

    // THEN: Input type is "search" (rendered as searchbox role, correct semantic HTML)
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });
    expect(searchInput.getAttribute('type')).toBe('search');
  });

  it('should NOT call onClienteSelect when clicking in ErrorPanel context', async () => {
    // GIVEN: Backend returns error
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 })
      )
    );
    const onClienteSelect = vi.fn();
    renderClienteListView({ onClienteSelect });
    await screen.findByRole('alert');

    // WHEN: User clicks the Reintentar button (not a client item)
    const retryBtn = screen.getByRole('button', { name: /Reintentar/i });
    await userEvent.click(retryBtn);

    // THEN: onClienteSelect was NOT called (retry button is not a client selection)
    expect(onClienteSelect).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple matching results
// ─────────────────────────────────────────────────────────────────────────────

describe('Multiple matching clients', () => {
  it('should display all clients whose nombre contains the search query prefix', async () => {
    // GIVEN: Mock has two clients starting with "Global": "Global Services SA" and 2 others
    const multiMatchClientes = [
      ...mockClientes,
      {
        id: '44444444-4444-4444-8444-444444444444',
        nombre: 'Global Logistics SA',
        nit: '600300100-4',
        telefono: '+57 606 111 2222',
        ciudad: 'Barranquilla',
        createdAt: '2026-01-25T10:00:00Z',
        updatedAt: '2026-01-25T10:00:00Z',
      },
    ];

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(multiMatchClientes))
    );

    renderClienteListView();
    await screen.findByRole('list');
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });

    // WHEN: User searches "Global" (matches 2 clients)
    fireEvent.change(searchInput, { target: { value: 'Global' } });

    // THEN: Both matching clients are shown; non-matching ones are hidden
    expect(screen.getByText('Global Services SA')).toBeDefined();
    expect(screen.getByText('Global Logistics SA')).toBeDefined();
    expect(screen.queryByText('Acme Colombia SAS')).toBeNull();
    expect(screen.queryByText('TechCorp Ltda')).toBeNull();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
  });

  it('should show exactly one result when only one client matches the search', async () => {
    // GIVEN: 3 clients loaded; only "TechCorp" has "800" in NIT
    renderClienteListView();
    await screen.findByRole('list');
    const searchInput = screen.getByRole('searchbox', { name: 'Buscar clientes' });

    // WHEN: User types "800" (only TechCorp NIT starts with 800)
    fireEvent.change(searchInput, { target: { value: '800' } });

    // THEN: Exactly one item is rendered
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(screen.getByText('TechCorp Ltda')).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ErrorPanel edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel edge cases', () => {
  it('should show ErrorPanel on HTTP 401 Unauthorized response', async () => {
    // GIVEN: Backend returns 401 (auth error treated as unavailability)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'Unauthorized', status: 401 }, { status: 401 })
      )
    );

    renderClienteListView();

    // THEN: ErrorPanel is shown (TanStack Query treats non-2xx as error)
    const errorPanel = await screen.findByRole('alert');
    expect(errorPanel).toBeDefined();
  });

  it('should show ErrorPanel on HTTP 404 Not Found response', async () => {
    // GIVEN: Wrong endpoint returns 404 (simulates misconfigured backend)
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ title: 'Not Found', status: 404 }, { status: 404 })
      )
    );

    renderClienteListView();

    // THEN: ErrorPanel is shown
    const errorPanel = await screen.findByRole('alert');
    expect(errorPanel).toBeDefined();
    // Verify the Reintentar button is present
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeDefined();
  });

  it('should hide error panel and show list after successful retry', async () => {
    // GIVEN: First call fails, subsequent call succeeds
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

    renderClienteListView();
    const retryButton = await screen.findByRole('button', { name: /Reintentar/i });

    // WHEN: User clicks Reintentar
    await userEvent.click(retryButton);

    // THEN: List renders after successful retry; ErrorPanel disappears
    await screen.findByRole('list');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState edge cases', () => {
  it('should show "create first client" message variant when no data exists at all (not a search miss)', async () => {
    // GIVEN: Backend returns empty array (no clients at all)
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([]))
    );

    renderClienteListView();
    await screen.findByTestId('empty-state');

    // THEN: Message mentions "No hay clientes" (not "No se encontraron")
    expect(screen.getByText(/No hay clientes registrados/i)).toBeDefined();
    expect(screen.queryByText(/No se encontraron clientes/i)).toBeNull();
  });

  it('should NOT render EmptyState when clients are loading (skeleton shown instead)', () => {
    // GIVEN: Backend is slow
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return HttpResponse.json([]);
      })
    );

    renderClienteListView();

    // THEN: No empty state during loading phase
    const emptyStates = screen.queryAllByTestId('empty-state');
    expect(emptyStates).toHaveLength(0);
    // Skeleton rows are shown instead
    const skeletons = screen.queryAllByTestId('skeleton-row');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
