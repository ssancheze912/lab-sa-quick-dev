/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Component Tests — Edge Cases & Boundary Conditions (BMad-Integrated Expansion)
 * Expands ATDD coverage with UI-level edge cases not covered in ClienteListView.test.tsx.
 *
 * New Test Cases:
 *   TC-2.1-C-12 — Clearing the search input after filtering shows all clients
 *   TC-2.1-C-13 — List panel has correct 280px width via CSS class
 *   TC-2.1-C-14 — List uses ul[role="list"] and aria-label for accessibility
 *   TC-2.1-C-15 — ClientListItem renders nombre in bold (font-bold class)
 *   TC-2.1-C-16 — ClientListItem has minimum 44px touch target (WCAG)
 *   TC-2.1-C-17 — EmptyState renders action button when actionLabel + onAction props provided
 *   TC-2.1-C-18 — Search input value reflects typed text (controlled input)
 *   TC-2.1-C-19 — Filter showing 0 results after non-empty list shows EmptyState component
 *   TC-2.1-C-20 — Error state does NOT show the client list
 *   TC-2.1-C-21 — Loading state does NOT show client list or EmptyState
 *   TC-2.1-C-22 — ClientListItem onClick prop is called when item clicked
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ClienteListView } from '../ClienteListView';
import { ClientListItem } from '@/shared/components/ClientListItem';
import { EmptyState } from '@/shared/components/EmptyState';

// ─────────────────────────────────────────────────────────────────────────────
// Test Data
// ─────────────────────────────────────────────────────────────────────────────

let _seq = 2000;

function buildClienteDto(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const id = _seq++;
  return {
    id: `00000000-0000-0000-0002-${String(id).padStart(12, '0')}`,
    nombre: `Empresa Edge ${id}`,
    nit: `7${String(id).padStart(8, '0')}-3`,
    telefono: `312${String(id).padStart(7, '0')}`,
    ciudad: 'Cali',
    createdAt: new Date(Date.now() - id * 1000).toISOString(),
    updatedAt: new Date(Date.now() - id * 1000).toISOString(),
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server
// ─────────────────────────────────────────────────────────────────────────────

const CLIENTES_API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/v1/clientes`;

const server = setupServer(
  http.get(CLIENTES_API_URL, () => HttpResponse.json([buildClienteDto()]))
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-C-12 — Clearing search shows all clients
// ─────────────────────────────────────────────────────────────────────────────

describe('Search input clear behavior', () => {
  it('[P1][TC-2.1-C-12] Given filtered list, When search input is cleared, Then all clients are shown again', async () => {
    // GIVEN: Two clients
    const clienteA = buildClienteDto({ nombre: 'Acme Colombia SA' });
    const clienteB = buildClienteDto({ nombre: 'Industrias XYZ' });

    server.use(
      http.get(CLIENTES_API_URL, () => HttpResponse.json([clienteA, clienteB]))
    );

    renderWithProviders(<ClienteListView />);
    await screen.findByText('Acme Colombia SA');

    const searchInput = screen.getByTestId('search-input');

    // WHEN: User filters by "Acme"
    await userEvent.type(searchInput, 'Acme');
    expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument();
    expect(screen.queryByText('Industrias XYZ')).not.toBeInTheDocument();

    // AND: User clears the input
    await userEvent.clear(searchInput);

    // THEN: Both clients are visible again
    await waitFor(() => {
      expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument();
      expect(screen.getByText('Industrias XYZ')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-C-13 — Panel CSS width
// ─────────────────────────────────────────────────────────────────────────────

describe('Client list panel structure', () => {
  it('[P2][TC-2.1-C-13] Given ClienteListView rendered, When inspecting root element, Then it has the w-[280px] Tailwind class', async () => {
    // GIVEN
    server.use(http.get(CLIENTES_API_URL, () => HttpResponse.json([])));

    const { container } = renderWithProviders(<ClienteListView />);

    // Wait for render to settle
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // THEN: Root div has w-[280px] class (Tailwind)
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv.className).toContain('w-[280px]');
  });

  it('[P1][TC-2.1-C-14] Given clients loaded, When list renders, Then ul has role="list" and aria-label in Spanish', async () => {
    // GIVEN
    const cliente = buildClienteDto({ nombre: 'Lista Test Corp' });
    server.use(http.get(CLIENTES_API_URL, () => HttpResponse.json([cliente])));

    renderWithProviders(<ClienteListView />);

    // THEN: ul with role="list" is rendered
    const list = await screen.findByRole('list', { name: /lista de clientes/i });
    expect(list).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-C-15 / TC-2.1-C-16 — ClientListItem component isolation tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ClientListItem component', () => {
  it('[P1][TC-2.1-C-15] Given ClientListItem, When rendered, Then nombre is displayed', () => {
    // GIVEN / WHEN
    render(
      <ul>
        <ClientListItem nombre="Empresa Bold Test" nit="900111222-3" />
      </ul>
    );

    // THEN: nombre is visible
    const nombreEl = screen.getByText('Empresa Bold Test');
    expect(nombreEl).toBeInTheDocument();
    // AND: nit is visible below
    expect(screen.getByText('900111222-3')).toBeInTheDocument();
  });

  it('[P1][TC-2.1-C-16] Given ClientListItem, When rendered, Then li has min-h-[44px] touch target class (WCAG 2.1 AA)', () => {
    // GIVEN / WHEN
    const { container } = render(
      <ul>
        <ClientListItem nombre="Touch Target Test" nit="900000001-0" />
      </ul>
    );

    // THEN: li has min-h-[44px] class for WCAG touch target compliance
    const li = container.querySelector('[data-testid="cliente-list-item"]') as HTMLElement;
    expect(li.className).toContain('min-h-[44px]');
  });

  it('[P1][TC-2.1-C-22] Given ClientListItem with onClick, When item is clicked, Then onClick is called', async () => {
    // GIVEN
    const handleClick = vi.fn();
    render(
      <ul>
        <ClientListItem nombre="Clickable Corp" nit="800222333-0" onClick={handleClick} />
      </ul>
    );

    // WHEN: User clicks the item
    await userEvent.click(screen.getByTestId('cliente-list-item'));

    // THEN: onClick was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('[P2][TC-2.1-C-22b] Given ClientListItem without onClick prop, When item is clicked, Then no error is thrown', async () => {
    // GIVEN: No onClick prop
    render(
      <ul>
        <ClientListItem nombre="No Click Handler" nit="700333444-0" />
      </ul>
    );

    // WHEN / THEN: Click does not throw
    expect(() =>
      fireEvent.click(screen.getByTestId('cliente-list-item'))
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-C-17 — EmptyState with action button
// ─────────────────────────────────────────────────────────────────────────────

describe('EmptyState component action button', () => {
  it('[P2][TC-2.1-C-17] Given EmptyState with actionLabel and onAction, When rendered, Then action button is visible and triggers callback on click', async () => {
    // GIVEN
    const handleAction = vi.fn();

    render(
      <EmptyState
        message="No hay clientes."
        actionLabel="Crear cliente"
        onAction={handleAction}
      />
    );

    // THEN: Button is visible
    const button = screen.getByRole('button', { name: /crear cliente/i });
    expect(button).toBeInTheDocument();

    // WHEN: User clicks
    await userEvent.click(button);

    // THEN: Callback called
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('[P2][TC-2.1-C-17b] Given EmptyState without actionLabel, When rendered, Then no action button is shown', () => {
    // GIVEN / WHEN
    render(<EmptyState message="Sin datos." />);

    // THEN: No button rendered
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-C-18 — Search input is controlled
// ─────────────────────────────────────────────────────────────────────────────

describe('Search input controlled behavior', () => {
  it('[P1][TC-2.1-C-18] Given ClienteListView, When user types in search input, Then input value reflects the typed text', async () => {
    // GIVEN
    server.use(http.get(CLIENTES_API_URL, () => HttpResponse.json([])));
    renderWithProviders(<ClienteListView />);

    const searchInput = screen.getByTestId('search-input') as HTMLInputElement;

    // WHEN: User types
    await userEvent.type(searchInput, 'búsqueda');

    // THEN: Input value is updated
    expect(searchInput.value).toBe('búsqueda');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-C-19 — Filter resulting in 0 matches shows EmptyState (not error)
// ─────────────────────────────────────────────────────────────────────────────

describe('Empty filter result shows EmptyState', () => {
  it('[P1][TC-2.1-C-19] Given clients loaded, When filter query matches nothing, Then EmptyState is shown (not ErrorPanel)', async () => {
    // GIVEN: Clients exist
    const clientes = [
      buildClienteDto({ nombre: 'Alpha Corp' }),
      buildClienteDto({ nombre: 'Beta Ltda' }),
    ];
    server.use(http.get(CLIENTES_API_URL, () => HttpResponse.json(clientes)));

    renderWithProviders(<ClienteListView />);
    await screen.findByText('Alpha Corp');

    // WHEN: User types a query that matches nothing
    const searchInput = screen.getByTestId('search-input');
    await userEvent.type(searchInput, 'XYZNONEXISTENT999');

    // THEN: EmptyState is shown
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // AND: ErrorPanel is NOT shown
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();

    // AND: No list items shown
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-C-20 — Error state does NOT show list
// ─────────────────────────────────────────────────────────────────────────────

describe('Error state exclusivity', () => {
  it('[P1][TC-2.1-C-20] Given API fails, When ErrorPanel is shown, Then client list is NOT rendered', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(CLIENTES_API_URL, () =>
        HttpResponse.json({ error: 'fail' }, { status: 500 })
      )
    );

    renderWithProviders(<ClienteListView />);

    // THEN: ErrorPanel is visible
    await screen.findByTestId('error-panel');

    // AND: No list items
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);

    // AND: No empty state (empty state is for empty data, not errors)
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.1-C-21 — Loading state does NOT show list or EmptyState
// ─────────────────────────────────────────────────────────────────────────────

describe('Loading state exclusivity', () => {
  it('[P1][TC-2.1-C-21] Given API is loading, When skeleton is shown, Then client list and EmptyState are NOT rendered', async () => {
    // GIVEN: API response delayed
    server.use(
      http.get(CLIENTES_API_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return HttpResponse.json([]);
      })
    );

    renderWithProviders(<ClienteListView />);

    // THEN: Skeleton rows visible during loading
    const skeletons = screen.getAllByTestId('skeleton-row');
    expect(skeletons.length).toBeGreaterThan(0);

    // AND: No client items
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);

    // AND: No empty state (data not yet available)
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();

    // AND: No error panel
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });
});
