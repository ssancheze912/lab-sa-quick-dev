/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * ATDD Component Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Uses: Vitest + React Testing Library + MSW (msw 2.x)
 *
 * Acceptance Criteria covered:
 *   AC#1 — Left panel (280px) shows scrollable list with Nombre and NIT/RUC per item
 *   AC#2 — Real-time filter by Nombre or NIT/RUC; < 1s with 500 records
 *   AC#3 — EmptyState displayed with guidance message when no clients
 *   AC#4 — ErrorPanel with "Reintentar" button on fetch failure
 *
 * Test Cases:
 *   TC-2.1-C-01 (AC#1)  — List renders client items with Nombre and NIT/RUC
 *   TC-2.1-C-02 (AC#1)  — Loading state shows skeleton rows (not spinner)
 *   TC-2.1-C-03 (AC#1)  — Search input has aria-label for accessibility (WCAG 2.1 AA)
 *   TC-2.1-C-04 (AC#2)  — Typing in search filters by Nombre (case-insensitive)
 *   TC-2.1-C-05 (AC#2)  — Typing in search filters by NIT/RUC (case-insensitive)
 *   TC-2.1-C-06 (AC#2)  — Filter updates on every keystroke without debounce
 *   TC-2.1-P0-01 (AC#2) — Filter over 500-item cache executes in < 200ms (R-003)
 *   TC-2.1-C-07 (AC#3)  — EmptyState rendered when API returns empty array
 *   TC-2.1-C-08 (AC#3)  — EmptyState shows guidance message for first client creation
 *   TC-2.1-C-09 (AC#4)  — ErrorPanel rendered when fetch fails
 *   TC-2.1-C-10 (AC#4)  — "Reintentar" button calls refetch
 *   TC-2.1-C-11 (AC#4)  — No technical error details shown (NFR6)
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock TanStack Router to avoid requiring router context in component tests
vi.mock('@tanstack/react-router', async () => {
  const { createElement } = await import('react');
  return {
    Link: ({ children, className, to, params }: { children: React.ReactNode; className?: string; to?: string; params?: Record<string, string> }) =>
      createElement('a', { href: to ? String(to) : '#', className }, children),
  };
});

// Component under test — does not exist yet (RED phase)
// Import will fail until implementation is complete
import { ClienteListView } from '../ClienteListView';

// ─────────────────────────────────────────────────────────────────────────────
// Test Data Factories
// ─────────────────────────────────────────────────────────────────────────────

let _idCounter = 1;

function buildClienteDto(overrides: Partial<{
  id: string;
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
  createdAt: string;
  updatedAt: string;
}> = {}) {
  const id = _idCounter++;
  return {
    id: `00000000-0000-0000-0000-${String(id).padStart(12, '0')}`,
    nombre: `Empresa Test ${id}`,
    nit: `9${String(id).padStart(8, '0')}-1`,
    telefono: `300${String(id).padStart(7, '0')}`,
    ciudad: 'Bogotá',
    createdAt: new Date(Date.now() - id * 1000).toISOString(),
    updatedAt: new Date(Date.now() - id * 1000).toISOString(),
    ...overrides,
  };
}

function buildClientesDto(count: number) {
  return Array.from({ length: count }, () => buildClienteDto());
}

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server Setup
// ─────────────────────────────────────────────────────────────────────────────

const CLIENTES_API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/v1/clientes`;

const server = setupServer(
  http.get(CLIENTES_API_URL, () => {
    return HttpResponse.json([buildClienteDto()]);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AC#1 — List renders client items with Nombre and NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#1 — Client list renders with Nombre and NIT/RUC per item', () => {
  it('[P0][TC-2.1-C-01] Given API returns clients, When ClienteListView mounts, Then each item shows Nombre and NIT/RUC', async () => {
    // GIVEN: API returns a list with one client
    const cliente = buildClienteDto({ nombre: 'Industrias Colombia SA', nit: '900123456-7' });

    server.use(
      http.get(CLIENTES_API_URL, () => HttpResponse.json([cliente]))
    );

    // WHEN: ClienteListView mounts
    renderWithProviders(<ClienteListView />);

    // THEN: Client Nombre is visible
    await expect(
      screen.findByText('Industrias Colombia SA')
    ).resolves.toBeInTheDocument();

    // AND: Client NIT is visible
    expect(screen.getByText('900123456-7')).toBeInTheDocument();
  });

  it('[P1][TC-2.1-C-02] Given API loading, When ClienteListView mounts, Then skeleton rows are shown (not a spinner)', async () => {
    // GIVEN: API has not responded yet (slow response)
    server.use(
      http.get(CLIENTES_API_URL, async () => {
        // Delay to keep loading state visible during assertion
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListView mounts
    renderWithProviders(<ClienteListView />);

    // THEN: Skeleton rows are shown (react-loading-skeleton)
    const skeletons = screen.getAllByTestId('skeleton-row');
    expect(skeletons.length).toBeGreaterThan(0);

    // AND: A spinner is NOT shown (use skeleton, not spinner per company-standards)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('[P1][TC-2.1-C-03] Given ClienteListView rendered, When page loads, Then search input has aria-label for accessibility', async () => {
    // GIVEN: API returns clients
    server.use(
      http.get(CLIENTES_API_URL, () => HttpResponse.json([buildClienteDto()]))
    );

    // WHEN: ClienteListView mounts
    renderWithProviders(<ClienteListView />);

    // THEN: Search input has aria-label (WCAG 2.1 AA)
    await waitFor(() => {
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('aria-label');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#2 — Real-time filter by Nombre and NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#2 — Real-time search filters client list', () => {
  it('[P0][TC-2.1-C-04] Given clients loaded, When user types Nombre in search, Then only matching clients remain visible', async () => {
    // GIVEN: API returns two clients
    const matching = buildClienteDto({ nombre: 'Acme Colombia', nit: '100200300-4' });
    const nonMatching = buildClienteDto({ nombre: 'Industrias XYZ', nit: '500600700-8' });

    server.use(
      http.get(CLIENTES_API_URL, () => HttpResponse.json([matching, nonMatching]))
    );

    renderWithProviders(<ClienteListView />);

    // Wait for the list to load
    await screen.findByText('Acme Colombia');
    await screen.findByText('Industrias XYZ');

    // WHEN: User types "Acme" in the search field
    const searchInput = screen.getByTestId('search-input');
    await userEvent.type(searchInput, 'Acme');

    // THEN: Matching client is visible
    expect(screen.getByText('Acme Colombia')).toBeInTheDocument();

    // AND: Non-matching client is not visible
    expect(screen.queryByText('Industrias XYZ')).not.toBeInTheDocument();
  });

  it('[P0][TC-2.1-C-05] Given clients loaded, When user types NIT in search, Then only clients with matching NIT are shown', async () => {
    // GIVEN: API returns two clients
    const matching = buildClienteDto({ nombre: 'Empresa A', nit: '900555666-3' });
    const nonMatching = buildClienteDto({ nombre: 'Empresa B', nit: '100222333-9' });

    server.use(
      http.get(CLIENTES_API_URL, () => HttpResponse.json([matching, nonMatching]))
    );

    renderWithProviders(<ClienteListView />);

    await screen.findByText('Empresa A');

    // WHEN: User types part of the NIT
    const searchInput = screen.getByTestId('search-input');
    await userEvent.type(searchInput, '900555');

    // THEN: Matching client is visible
    expect(screen.getByText('Empresa A')).toBeInTheDocument();

    // AND: Non-matching client is hidden
    expect(screen.queryByText('Empresa B')).not.toBeInTheDocument();
  });

  it('[P2][TC-2.1-C-06] Given clients loaded, When user types progressively, Then list updates on each keystroke without debounce', async () => {
    // GIVEN: API returns multiple clients
    const clienteA = buildClienteDto({ nombre: 'Alpha Corp' });
    const clienteB = buildClienteDto({ nombre: 'Beta Ltda' });
    const clienteC = buildClienteDto({ nombre: 'Alfa Solutions' });

    server.use(
      http.get(CLIENTES_API_URL, () =>
        HttpResponse.json([clienteA, clienteB, clienteC])
      )
    );

    renderWithProviders(<ClienteListView />);

    await screen.findByText('Alpha Corp');

    const searchInput = screen.getByTestId('search-input');

    // WHEN: User types "A" — expect two matches (Alpha Corp, Alfa Solutions)
    await userEvent.type(searchInput, 'A');
    expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    expect(screen.getByText('Alfa Solutions')).toBeInTheDocument();
    expect(screen.queryByText('Beta Ltda')).not.toBeInTheDocument();

    // AND: Type "l" — still two matches
    await userEvent.type(searchInput, 'l');
    expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    expect(screen.getByText('Alfa Solutions')).toBeInTheDocument();

    // AND: Type "ph" — only "Alpha Corp" matches
    await userEvent.type(searchInput, 'ph');
    expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    expect(screen.queryByText('Alfa Solutions')).not.toBeInTheDocument();
  });

  it('[P0][TC-2.1-P0-01] Given 500 clients in cache, When filter is triggered, Then filtered list renders in < 200ms (R-003 performance)', async () => {
    // GIVEN: 500 clients returned from API
    const clientes500 = buildClientesDto(500);
    // Ensure the target client is in the list
    clientes500[250] = buildClienteDto({ nombre: 'Target Performance Cliente', nit: '777888999-0' });

    server.use(
      http.get(CLIENTES_API_URL, () => HttpResponse.json(clientes500))
    );

    renderWithProviders(<ClienteListView />);

    // Wait for all items to load
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item').length).toBeGreaterThan(0);
    }, { timeout: 5000 });

    const searchInput = screen.getByTestId('search-input');

    // WHEN: Filter is triggered — measure time
    const start = performance.now();
    fireEvent.change(searchInput, { target: { value: 'Target Performance' } });

    // THEN: The DOM updates synchronously (useMemo)
    await waitFor(() => {
      expect(screen.getByText('Target Performance Cliente')).toBeInTheDocument();
    });

    const elapsed = performance.now() - start;

    // AND: Filter completes in < 200ms (conservative threshold — target < 50ms, R-003)
    expect(elapsed).toBeLessThan(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#3 — EmptyState displayed when no clients in system
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#3 — EmptyState shown when API returns empty array', () => {
  it('[P1][TC-2.1-C-07] Given no clients in system, When ClienteListView mounts, Then EmptyState is rendered', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get(CLIENTES_API_URL, () => HttpResponse.json([]))
    );

    // WHEN: ClienteListView mounts
    renderWithProviders(<ClienteListView />);

    // THEN: EmptyState is visible
    await expect(
      screen.findByTestId('empty-state')
    ).resolves.toBeInTheDocument();
  });

  it('[P1][TC-2.1-C-08] Given EmptyState shown, When rendered, Then it contains a guidance message for creating the first client', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get(CLIENTES_API_URL, () => HttpResponse.json([]))
    );

    // WHEN: ClienteListView mounts and EmptyState renders
    renderWithProviders(<ClienteListView />);

    const emptyState = await screen.findByTestId('empty-state');

    // THEN: EmptyState contains guidance text (Spanish) about creating first client
    expect(emptyState).toHaveTextContent(/cliente|crea|primer/i);
  });

  it('[P1][TC-2.1-C-07b] Given EmptyState shown, When rendered, Then NO client list items are rendered', async () => {
    // GIVEN: API returns empty array
    server.use(
      http.get(CLIENTES_API_URL, () => HttpResponse.json([]))
    );

    // WHEN: ClienteListView mounts
    renderWithProviders(<ClienteListView />);

    // Wait for loading to complete
    await screen.findByTestId('empty-state');

    // THEN: No client items are in the DOM
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC#4 — ErrorPanel with "Reintentar" on fetch failure
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#4 — ErrorPanel displayed when fetch fails', () => {
  it('[P1][TC-2.1-C-09] Given API returns 500, When ClienteListView mounts, Then ErrorPanel is rendered', async () => {
    // GIVEN: API returns a server error
    server.use(
      http.get(CLIENTES_API_URL, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );

    // WHEN: ClienteListView mounts
    renderWithProviders(<ClienteListView />);

    // THEN: ErrorPanel is visible
    await expect(
      screen.findByTestId('error-panel')
    ).resolves.toBeInTheDocument();
  });

  it('[P1][TC-2.1-C-10] Given ErrorPanel shown, When rendered, Then "Reintentar" button is visible and triggers refetch on click', async () => {
    let callCount = 0;

    // GIVEN: First call fails, second call succeeds with empty list
    server.use(
      http.get(CLIENTES_API_URL, () => {
        callCount += 1;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Error' }, { status: 500 });
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListView mounts
    renderWithProviders(<ClienteListView />);

    // THEN: ErrorPanel is visible after first failed fetch
    const errorPanel = await screen.findByTestId('error-panel');
    expect(errorPanel).toBeInTheDocument();

    // AND: "Reintentar" button is visible
    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    expect(retryButton).toBeInTheDocument();

    // WHEN: User clicks "Reintentar"
    await userEvent.click(retryButton);

    // THEN: ErrorPanel disappears (retry succeeded with empty list → EmptyState shown)
    await waitFor(() => {
      expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
    });

    // AND: The API was called twice (initial + retry)
    expect(callCount).toBe(2);
  });

  it('[P1][TC-2.1-C-11] Given fetch fails, When ErrorPanel renders, Then no technical error details or stack trace are shown (NFR6)', async () => {
    // GIVEN: API returns error with technical details
    server.use(
      http.get(CLIENTES_API_URL, () =>
        HttpResponse.json(
          {
            error: 'Database connection failed',
            stackTrace: 'at System.Data.SqlClient line 42',
            detail: 'Connection string is invalid',
          },
          { status: 500 }
        )
      )
    );

    // WHEN: ClienteListView mounts
    renderWithProviders(<ClienteListView />);

    await screen.findByTestId('error-panel');

    // THEN: No stack trace is visible
    expect(screen.queryByText(/stackTrace|stack trace|at System/i)).not.toBeInTheDocument();

    // AND: No raw technical error message visible
    expect(screen.queryByText(/Database connection failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Connection string is invalid/i)).not.toBeInTheDocument();
  });
});
