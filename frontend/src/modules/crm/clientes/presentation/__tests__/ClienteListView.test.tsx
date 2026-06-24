/**
 * Component Tests — Story 2.1: ClienteListView
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * Framework: Vitest + React Testing Library + MSW (in-process)
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel renders scrollable list with Nombre + NIT/RUC per item
 *   AC2 — Real-time client-side search (Nombre or NIT/RUC, case-insensitive, no new API call)
 *   AC3 — EmptyState rendered when API returns empty array
 *   AC4 — ErrorPanel with "Reintentar" when API fails; retry triggers refetch
 *   AC7 — Skeleton loader (react-loading-skeleton) during fetch; no spinner
 *   Accessibility — <aside aria-label="Lista de clientes">; items have aria-selected
 *
 * Required components (must be created during implementation):
 *   - frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
 *   - frontend/src/shared/components/ClientListItem.tsx
 *   - frontend/src/shared/components/EmptyState.tsx
 *   - frontend/src/shared/components/ErrorPanel.tsx
 *
 * Required data-testid attributes:
 *   - cliente-list-view          → <aside> wrapper
 *   - client-search-input        → <input> search field
 *   - client-list-item-{id}      → each ClientListItem
 *   - cliente-list-skeleton      → skeleton loader container
 *   - empty-state                → EmptyState component
 *   - error-panel                → ErrorPanel component
 *   - retry-button               → "Reintentar" button
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// NOTE: These imports will FAIL (RED phase) until the files are created.
// Implementation paths defined in story Dev Notes.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — module does not exist yet (RED phase)
import { ClienteListView } from '../ClienteListView';

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

interface ClienteDto {
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}

function makeCliente(overrides: Partial<ClienteDto> = {}): ClienteDto {
  const id = Math.random().toString(36).slice(2, 10);
  const now = new Date().toISOString();
  return {
    id: `cliente-${id}`,
    nombre: `Empresa ${id}`,
    nit: `900${id}`,
    telefono: `300${id}`,
    ciudad: 'Bogotá',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeClientes(count: number): ClienteDto[] {
  return Array.from({ length: count }, () => makeCliente());
}

/**
 * Renders ClienteListView inside a fresh QueryClient provider.
 * MSW intercepts the underlying fetch calls.
 */
function renderClienteListView(queryClient?: QueryClient) {
  const qc = queryClient ?? new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,        // disable retries so error tests are deterministic
        staleTime: 0,
      },
    },
  });

  // Mock navigate function (TanStack Router navigate not available in Vitest jsdom)
  const mockNavigate = vi.fn();

  return {
    ...render(
      <QueryClientProvider client={qc}>
        <ClienteListView navigate={mockNavigate} />
      </QueryClientProvider>
    ),
    mockNavigate,
    qc,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup — intercept GET /api/v1/clientes
// ─────────────────────────────────────────────────────────────────────────────

// NOTE: Full MSW setup would use setupServer from 'msw/node'.
// In RED phase we mock the underlying useClientes hook directly to keep tests
// deterministic without a running backend.

vi.mock('../../application/useClientes', () => ({
  useClientes: vi.fn(),
}));

// We need access to the mock inside each test
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — module does not exist yet (RED phase)
import { useClientes } from '../../application/useClientes';

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Skeleton loader during fetch
// ─────────────────────────────────────────────────────────────────────────────

describe('AC7 — Skeleton loader during data fetch', () => {
  beforeEach(() => {
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the skeleton loader when isLoading is true', () => {
    // GIVEN: Data is loading (isLoading: true)
    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: Skeleton loader container is present
    expect(screen.getByTestId('cliente-list-skeleton')).toBeTruthy();
  });

  it('should NOT render a spinner when isLoading is true (skeleton only)', () => {
    // GIVEN: Data is loading
    // WHEN: ClienteListView is rendered
    const { container } = renderClienteListView();

    // THEN: No spinner element (role="progressbar") in the DOM
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.querySelector('[data-testid="spinner"]')).toBeNull();
  });

  it('should NOT render client list items while loading', () => {
    // GIVEN: Data is loading
    // WHEN: ClienteListView is rendered
    const { container } = renderClienteListView();

    // THEN: No list item elements rendered
    expect(container.querySelectorAll('[data-testid^="client-list-item-"]')).toHaveLength(0);
  });

  it('should NOT render EmptyState while loading', () => {
    // GIVEN: Data is loading
    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: EmptyState is not present
    expect(screen.queryByTestId('empty-state')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState when API returns empty array
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — EmptyState rendered on empty client list', () => {
  beforeEach(() => {
    vi.mocked(useClientes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the EmptyState component when data is an empty array', () => {
    // GIVEN: API returned an empty array (data: [])
    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: EmptyState is present
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('should display the Spanish guidance message in EmptyState', () => {
    // GIVEN: API returned empty array
    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: Guidance text is in Spanish
    expect(screen.getByTestId('empty-state').textContent).toMatch(
      /No hay clientes registrados/i
    );
  });

  it('should NOT render any client list items when the list is empty', () => {
    // GIVEN: Empty list (data: [])
    // WHEN: ClienteListView renders
    const { container } = renderClienteListView();

    // THEN: Zero list items
    expect(container.querySelectorAll('[data-testid^="client-list-item-"]')).toHaveLength(0);
  });

  it('should NOT render ErrorPanel when the list is empty (empty is not an error)', () => {
    // GIVEN: Empty list (data: [])
    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: ErrorPanel is not shown
    expect(screen.queryByTestId('error-panel')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel on API failure + retry
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — ErrorPanel on fetch failure', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the ErrorPanel when isError is true', () => {
    // GIVEN: Fetch failed (isError: true)
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: ErrorPanel is shown
    expect(screen.getByTestId('error-panel')).toBeTruthy();
  });

  it('should render the "Reintentar" button inside the ErrorPanel', () => {
    // GIVEN: Fetch failed
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: Retry button present
    expect(screen.getByTestId('retry-button')).toBeTruthy();
  });

  it('should call refetch when "Reintentar" button is clicked', async () => {
    // GIVEN: Fetch failed and refetch is a spy
    const mockRefetch = vi.fn();
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    // WHEN: ClienteListView renders and user clicks Reintentar
    renderClienteListView();
    await userEvent.click(screen.getByTestId('retry-button'));

    // THEN: refetch was called once
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('should NOT render client list items when in error state', () => {
    // GIVEN: Fetch failed
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    const { container } = renderClienteListView();

    // THEN: No list items
    expect(container.querySelectorAll('[data-testid^="client-list-item-"]')).toHaveLength(0);
  });

  it('should NOT render EmptyState when in error state', () => {
    // GIVEN: Fetch failed
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    renderClienteListView();

    // THEN: EmptyState not shown
    expect(screen.queryByTestId('empty-state')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — List rendering with Nombre and NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — List rendering with client data', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render a ClientListItem for each client returned by the API', () => {
    // GIVEN: Three clients returned by the hook
    const clientes = makeClientes(3);
    vi.mocked(useClientes).mockReturnValue({
      data: clientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView renders
    const { container } = renderClienteListView();

    // THEN: Three list items are present
    expect(container.querySelectorAll('[data-testid^="client-list-item-"]')).toHaveLength(3);
  });

  it('should display each client Nombre inside the list item', () => {
    // GIVEN: A client with a specific Nombre
    const cliente = makeCliente({ nombre: 'Empresa Nombre Visible' });
    vi.mocked(useClientes).mockReturnValue({
      data: [cliente],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: Nombre is visible
    expect(screen.getByTestId(`client-list-item-${cliente.id}`).textContent).toContain(
      'Empresa Nombre Visible'
    );
  });

  it('should display each client NIT/RUC inside the list item', () => {
    // GIVEN: A client with a specific NIT
    const cliente = makeCliente({ nit: '900123456' });
    vi.mocked(useClientes).mockReturnValue({
      data: [cliente],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: NIT is visible in the list item
    expect(screen.getByTestId(`client-list-item-${cliente.id}`).textContent).toContain(
      '900123456'
    );
  });

  it('should render the list panel as an <aside> with aria-label="Lista de clientes"', () => {
    // GIVEN: Clients are loaded
    vi.mocked(useClientes).mockReturnValue({
      data: makeClientes(1),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView renders
    const { container } = renderClienteListView();

    // THEN: <aside aria-label="Lista de clientes"> exists
    const aside = container.querySelector('aside[aria-label="Lista de clientes"]');
    expect(aside).toBeTruthy();
  });

  it('should render the items container as a <ul role="listbox">', () => {
    // GIVEN: Clients are loaded
    vi.mocked(useClientes).mockReturnValue({
      data: makeClientes(2),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView renders
    const { container } = renderClienteListView();

    // THEN: <ul role="listbox"> is present
    const listbox = container.querySelector('ul[role="listbox"]');
    expect(listbox).toBeTruthy();
  });

  it('should render the data-testid="cliente-list-view" on the root aside element', () => {
    // GIVEN: Clients are loaded
    vi.mocked(useClientes).mockReturnValue({
      data: makeClientes(1),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: data-testid="cliente-list-view" is present
    expect(screen.getByTestId('cliente-list-view')).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time client-side search
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Real-time client-side search', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the search input with data-testid="client-search-input"', () => {
    // GIVEN: Data loaded
    vi.mocked(useClientes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: Search input exists
    expect(screen.getByTestId('client-search-input')).toBeTruthy();
  });

  it('should filter clients by Nombre when the user types in the search input', async () => {
    // GIVEN: Two clients with different names
    const match = makeCliente({ nombre: 'Empresa Buscable' });
    const noMatch = makeCliente({ nombre: 'Compania Diferente' });
    vi.mocked(useClientes).mockReturnValue({
      data: [match, noMatch],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: User types partial Nombre into search
    renderClienteListView();
    await userEvent.type(screen.getByTestId('client-search-input'), 'Buscable');

    // THEN: Only the matching item is visible
    expect(screen.getByTestId(`client-list-item-${match.id}`)).toBeTruthy();
    expect(screen.queryByTestId(`client-list-item-${noMatch.id}`)).toBeNull();
  });

  it('should filter clients by NIT/RUC when user types in the search input', async () => {
    // GIVEN: Two clients with different NITs
    const match = makeCliente({ nit: '555111222' });
    const noMatch = makeCliente({ nit: '999888777' });
    vi.mocked(useClientes).mockReturnValue({
      data: [match, noMatch],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: User types partial NIT
    renderClienteListView();
    await userEvent.type(screen.getByTestId('client-search-input'), '555111');

    // THEN: Only the matching item is visible
    expect(screen.getByTestId(`client-list-item-${match.id}`)).toBeTruthy();
    expect(screen.queryByTestId(`client-list-item-${noMatch.id}`)).toBeNull();
  });

  it('should perform case-insensitive filtering', async () => {
    // GIVEN: Client with uppercase Nombre
    const cliente = makeCliente({ nombre: 'EMPRESA MAYUSCULAS' });
    vi.mocked(useClientes).mockReturnValue({
      data: [cliente],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: User types lowercase search term
    renderClienteListView();
    await userEvent.type(screen.getByTestId('client-search-input'), 'mayusculas');

    // THEN: Client is still visible (case-insensitive match)
    expect(screen.getByTestId(`client-list-item-${cliente.id}`)).toBeTruthy();
  });

  it('should show all clients when the search input is cleared', async () => {
    // GIVEN: Two clients, search input has text
    const clienteA = makeCliente({ nombre: 'Alpha Corp' });
    const clienteB = makeCliente({ nombre: 'Beta Industries' });
    vi.mocked(useClientes).mockReturnValue({
      data: [clienteA, clienteB],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: User types then clears search
    renderClienteListView();
    const input = screen.getByTestId('client-search-input');
    await userEvent.type(input, 'Alpha');

    // clienteB should be filtered out
    expect(screen.queryByTestId(`client-list-item-${clienteB.id}`)).toBeNull();

    await userEvent.clear(input);

    // THEN: Both clients visible again
    expect(screen.getByTestId(`client-list-item-${clienteA.id}`)).toBeTruthy();
    expect(screen.getByTestId(`client-list-item-${clienteB.id}`)).toBeTruthy();
  });

  it('should NOT call refetch when the user types in the search (client-side only)', async () => {
    // GIVEN: Data is loaded and refetch spy is set
    const mockRefetch = vi.fn();
    vi.mocked(useClientes).mockReturnValue({
      data: makeClientes(3),
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });

    // WHEN: User types in search multiple times
    renderClienteListView();
    const input = screen.getByTestId('client-search-input');
    await userEvent.type(input, 'empresa');

    // THEN: refetch was never called (purely client-side filtering)
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — WCAG 2.1 AA
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — WCAG 2.1 AA compliance', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should apply aria-selected="false" to unselected list items', () => {
    // GIVEN: Two clients loaded, none selected
    const clientes = makeClientes(2);
    vi.mocked(useClientes).mockReturnValue({
      data: clientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView renders without any selection
    renderClienteListView();

    // THEN: Each item has aria-selected="false"
    for (const c of clientes) {
      const item = screen.getByTestId(`client-list-item-${c.id}`);
      expect(item.getAttribute('aria-selected')).toBe('false');
    }
  });

  it('should have a visible search input with an accessible placeholder in Spanish', () => {
    // GIVEN: Data loaded
    vi.mocked(useClientes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView renders
    renderClienteListView();

    // THEN: Input placeholder is in Spanish
    const input = screen.getByTestId('client-search-input') as HTMLInputElement;
    expect(input.placeholder).toMatch(/buscar/i);
  });
});
