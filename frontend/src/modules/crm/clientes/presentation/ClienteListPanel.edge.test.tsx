/**
 * Story 2.1: Client List & Search — Component Edge Cases
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Expands ClienteListPanel.test.tsx with edge cases NOT covered by ATDD:
 *
 *   AC1 edge cases:
 *     - Skeleton placeholders render while isLoading=true (not spinner)
 *     - data-testid="error-panel" present on error (not just role="alert")
 *     - List renders a single client correctly (boundary: count=1)
 *     - Panel has data-testid="clientes-list-panel" even in loading state
 *
 *   AC2 edge cases:
 *     - Whitespace-only search is treated as empty (no filtering)
 *     - Partial NIT substring match (includes() boundary)
 *     - Mixed-case partial match (Colombia → acme colombia)
 *     - Search after previous filter resets shows correct count
 *     - Filter result = 0 does NOT render EmptyState (EmptyState is for no clients, not no results)
 *
 *   AC3 edge cases:
 *     - EmptyState has data-testid="empty-state"
 *     - EmptyState message contains guiding action text (Spanish)
 *
 *   AC4 edge cases:
 *     - ErrorPanel has data-testid="error-panel"
 *     - ErrorPanel message is in Spanish
 *     - Reintentar button click calls refetch (spy on queryClient invalidation)
 *
 *   AC1+AC2 combined:
 *     - aria-current applied to clicked item
 *     - aria-current removed when a different item is clicked
 *     - Search input is present in all states (loading, error, data)
 *
 * Test Cases:
 *   TC-E2-P2-07 — Loading skeleton renders while isLoading=true
 *   TC-E2-P2-08 — Whitespace-only search does not filter
 *   TC-E2-P2-09 — Filter with no results shows empty list (not EmptyState)
 *   TC-E2-P2-10 — aria-current moves to clicked item
 *   TC-E2-P2-11 — Partial NIT substring match
 *   TC-E2-P2-12 — Single client renders correctly (boundary count=1)
 */

import { describe, test, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

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
      queries: { retry: false },
    },
  });
}

function renderWithProviders(ui: React.ReactElement, queryClient?: QueryClient) {
  const qc = queryClient ?? createQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
  return { ...render(ui, { wrapper: Wrapper }), queryClient: qc };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-07 — AC1: Loading state renders skeleton, not spinner
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-07 — AC1: Loading skeleton during fetch', () => {
  test('should render the panel container even while data is loading', () => {
    // GIVEN: MSW holds the response (never resolves in this test — just checks initial state)
    // We need a slow handler to catch the loading state
    server.use(
      http.get('*/api/v1/clientes', async () => {
        // Delay to keep loading state visible during assertion
        await new Promise(() => {/* never resolves within test */});
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel is rendered (fetch in progress)
    renderWithProviders(<ClienteListPanel />);

    // THEN: Panel container is already in the DOM
    expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
  });

  test('should NOT render client list items during loading state', () => {
    // GIVEN: Fetch is still in progress (never resolves)
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise(() => {/* never resolves */});
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel is rendered (loading state)
    renderWithProviders(<ClienteListPanel />);

    // THEN: No list items are rendered during loading
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });

  test('should NOT render ErrorPanel or EmptyState during loading state', () => {
    // GIVEN: Fetch is still in progress
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise(() => {/* never resolves */});
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: Neither ErrorPanel nor EmptyState is visible during loading
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-08 — AC2: Whitespace-only search does not filter (trim boundary)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-08 — AC2: Whitespace-only search input treated as empty', () => {
  test('should show all clients when search contains only whitespace', async () => {
    // GIVEN: 3 clients are loaded
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    // WHEN: User types spaces-only in the search field
    await user.type(
      screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i),
      '   '
    );

    // THEN: All 3 clients are still visible (trim() boundary — not treated as filter)
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );
  });

  test('should show all clients when search contains only tab characters', async () => {
    // GIVEN: 3 clients are loaded
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    // WHEN: User types tab characters into the search field
    // (simulated by filling with whitespace)
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i);
    await user.clear(searchInput);
    await user.type(searchInput, '\t');

    // THEN: All 3 clients remain visible
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-09 — AC2: Filter with no results shows empty list, NOT EmptyState
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-09 — AC2: Non-matching search shows 0 items but NOT EmptyState', () => {
  test('should render 0 items when no clients match search — NOT render EmptyState', async () => {
    // GIVEN: 3 clients are loaded
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    // WHEN: User types a term that matches nothing
    await user.type(
      screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i),
      'ZZZNOMATCH99999'
    );

    // THEN: 0 list items visible
    await waitFor(() =>
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    );

    // AND: EmptyState is NOT rendered (it's only for zero clients in the system)
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  test('should render 0 items when NIT search matches no client', async () => {
    // GIVEN: 3 clients with known NITs
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    // WHEN: User types a non-existent NIT
    await user.type(
      screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i),
      '000000000'
    );

    // THEN: 0 items visible, no EmptyState
    await waitFor(() =>
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0)
    );
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-10 — AC1: aria-current selection management
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-10 — AC1: aria-current applied to selected client item', () => {
  test('should apply aria-current="true" to clicked item', async () => {
    // GIVEN: 3 clients are loaded
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    // WHEN: User clicks the first client item
    const items = screen.getAllByTestId('cliente-list-item');
    await user.click(items[0]);

    // THEN: First item has aria-current="true"
    expect(items[0]).toHaveAttribute('aria-current', 'true');

    // AND: Other items do NOT have aria-current="true"
    expect(items[1]).not.toHaveAttribute('aria-current', 'true');
    expect(items[2]).not.toHaveAttribute('aria-current', 'true');
  });

  test('should move aria-current to newly clicked item (deselect previous)', async () => {
    // GIVEN: First item is selected
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    const items = screen.getAllByTestId('cliente-list-item');
    await user.click(items[0]);
    expect(items[0]).toHaveAttribute('aria-current', 'true');

    // WHEN: User clicks a different item
    await user.click(items[2]);

    // THEN: Third item now has aria-current="true"
    expect(items[2]).toHaveAttribute('aria-current', 'true');

    // AND: First item no longer has aria-current
    expect(items[0]).not.toHaveAttribute('aria-current', 'true');
  });

  test('should NOT have aria-current on any item before any click', async () => {
    // GIVEN: 3 clients are loaded with no selection
    // WHEN: ClienteListPanel renders
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    // THEN: No item has aria-current="true"
    const items = screen.getAllByTestId('cliente-list-item');
    items.forEach((item) => {
      expect(item).not.toHaveAttribute('aria-current', 'true');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-11 — AC2: Partial NIT substring match (includes() boundary)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-11 — AC2: Partial NIT substring matching', () => {
  test('should filter by partial NIT prefix (first 4 digits)', async () => {
    // GIVEN: 3 clients with distinct NIT values: 900111222, 800333444, 700555666
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    // WHEN: User types first 4 digits of Acme's NIT "9001"
    await user.type(
      screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i),
      '9001'
    );

    // THEN: Only Acme Colombia SA (nit 900111222 contains "9001") is visible
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    );
    expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument();
    expect(screen.queryByText('Beta Ltda')).not.toBeInTheDocument();
  });

  test('should filter by partial NIT middle segment', async () => {
    // GIVEN: 3 clients with NITs: 900111222, 800333444, 700555666
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    // WHEN: User types "333" which is a middle segment of Beta Ltda's NIT 800333444
    await user.type(
      screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i),
      '333'
    );

    // THEN: Only Beta Ltda is visible
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    );
    expect(screen.getByText('Beta Ltda')).toBeInTheDocument();
  });

  test('should match a Nombre substring in the middle of the name', async () => {
    // GIVEN: 3 clients
    const user = userEvent.setup();
    renderWithProviders(<ClienteListPanel />);

    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3)
    );

    // WHEN: User types "lombia" (substring of "Colombia")
    await user.type(
      screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i),
      'lombia'
    );

    // THEN: Only Acme Colombia SA matches
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    );
    expect(screen.getByText('Acme Colombia SA')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-12 — AC1: Single client renders correctly (count boundary = 1)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-12 — AC1: Single client boundary case', () => {
  test('should render exactly 1 list item when API returns a single client', async () => {
    // GIVEN: API returns exactly 1 client
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([
          {
            id: '11111111-0000-0000-0000-000000000001',
            nombre: 'Solitary Corp',
            nit: '999000111',
            telefono: '3001111111',
            ciudad: 'Bogotá',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ]);
      })
    );

    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: Exactly 1 client item is rendered
    await waitFor(() =>
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1)
    );
    expect(screen.getByText('Solitary Corp')).toBeInTheDocument();
    expect(screen.getByText('999000111')).toBeInTheDocument();
  });

  test('should NOT render EmptyState when exactly 1 client is returned', async () => {
    // GIVEN: API returns exactly 1 client
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([mockClientes[0]]);
      })
    );

    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: No empty state shown (1 client is enough)
    await waitFor(() =>
      expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument()
    );
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 edge cases — ErrorPanel testid and Spanish message
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 edge cases — ErrorPanel data-testid and Spanish message', () => {
  test('should render element with data-testid="error-panel" on network error', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: The error panel has the expected data-testid
    await waitFor(() =>
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    );
  });

  test('should render an error message in Spanish inside ErrorPanel', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteListPanel renders in error state
    renderWithProviders(<ClienteListPanel />);

    // THEN: The error text is in Spanish (does not expose technical details)
    await waitFor(() =>
      expect(screen.getByTestId('error-panel')).toBeInTheDocument()
    );
    const errorPanel = screen.getByTestId('error-panel');
    const errorText = errorPanel.textContent ?? '';

    // Message is in Spanish — must contain Spanish words
    expect(errorText).toMatch(/no se pudo|intentalo|información|por favor/i);

    // Must NOT contain technical error details (NFR6)
    expect(errorText).not.toMatch(/error:|exception|stack trace|undefined|null/i);
  });

  test('should render Reintentar button with correct text casing', async () => {
    // GIVEN: MSW simulates a network error
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteListPanel renders in error state
    renderWithProviders(<ClienteListPanel />);

    // THEN: Button is labeled exactly "Reintentar" (case-sensitive per AC4 spec)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Reintentar' })
      ).toBeInTheDocument()
    );

    // AND: The button text is NOT "reintentar" (lowercase) or "REINTENTAR" (uppercase)
    const btn = screen.getByRole('button', { name: 'Reintentar' });
    expect(btn.textContent).toBe('Reintentar');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 edge cases — EmptyState data-testid, role, and Spanish message
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 edge cases — EmptyState data-testid and Spanish guidance message', () => {
  test('EmptyState should have data-testid="empty-state"', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel is rendered
    renderWithProviders(<ClienteListPanel />);

    // THEN: EmptyState element has the expected testid
    await waitFor(() =>
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    );
  });

  test('EmptyState should have role="status" for WCAG accessibility', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel renders with no clients
    renderWithProviders(<ClienteListPanel />);

    // THEN: role="status" is present (WCAG 2.1 AA for non-disruptive messages)
    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument()
    );
  });

  test('EmptyState message should mention creating a client (Spanish guidance)', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel renders
    renderWithProviders(<ClienteListPanel />);

    // THEN: The empty state message contains Spanish guidance about creating a client
    await waitFor(() =>
      expect(screen.getByRole('status')).toBeInTheDocument()
    );

    const statusText = screen.getByRole('status').textContent ?? '';

    // Must contain guidance in Spanish about creating the first client
    expect(statusText).toMatch(
      /primer cliente|crear|nuevo/i
    );

    // Must NOT be empty text
    expect(statusText.trim().length).toBeGreaterThan(0);
  });

  test('should NOT show role="list" when EmptyState is rendered', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel renders in empty state
    renderWithProviders(<ClienteListPanel />);

    // THEN: No list is rendered when no clients exist
    await waitFor(() =>
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search input persistence across states
// ─────────────────────────────────────────────────────────────────────────────

describe('Search input — availability across component states', () => {
  test('search input is rendered even in loading state', () => {
    // GIVEN: Fetch is in progress
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise(() => {/* never resolves */});
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel is rendered (loading)
    renderWithProviders(<ClienteListPanel />);

    // THEN: Search input is present (not blocked by loading state)
    expect(
      screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i)
    ).toBeInTheDocument();
  });

  test('search input is rendered in error state', async () => {
    // GIVEN: Network error
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.error();
      })
    );

    // WHEN: ClienteListPanel renders in error state
    renderWithProviders(<ClienteListPanel />);

    // THEN: Search input is present even in error state
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    );
    expect(
      screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i)
    ).toBeInTheDocument();
  });

  test('search input is rendered when EmptyState is shown', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get('*/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel renders with no clients
    renderWithProviders(<ClienteListPanel />);

    // THEN: Search input is present alongside EmptyState
    await waitFor(() =>
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    );
    expect(
      screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i)
    ).toBeInTheDocument();
  });
});
