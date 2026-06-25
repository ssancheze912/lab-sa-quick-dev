/**
 * Story 2.1 + 2.6: ClienteListPanel component — Component Tests
 *
 * Acceptance Criteria covered:
 * - AC1: Panel renders with list of clients (nombre + nit visible)
 * - AC2: Search input filters list in real time, case-insensitive
 * - AC3: EmptyState shown when data array is empty
 * - AC4: ErrorPanel shown on fetch failure; "Reintentar" triggers refetch
 * - Story 2.6 AC1-6: SortControl integration and sort behavior
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// SUT — will fail until implemented
import { ClienteListPanel } from './ClienteListPanel';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api/v1/clientes';

const buildCliente = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  nombre: 'Empresa Ejemplo S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-12T10:30:00Z',
  updatedAt: '2026-03-12T10:30:00Z',
  ...overrides,
});

const server = setupServer(
  http.get(API_URL, () => HttpResponse.json([buildCliente()])),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

// ─── AC1: List renders when data present ─────────────────────────────────────

describe('AC1 — ClienteListPanel renders client list', () => {
  it('should render list panel container', async () => {
    // GIVEN: API returns one client
    // WHEN: Component is rendered
    renderWithQuery(createElement(ClienteListPanel));

    // THEN: The list panel container is present
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
    });
  });

  it('should render client nombre in list item', async () => {
    // GIVEN: API returns a client with nombre "Acme Corp"
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildCliente({ nombre: 'Acme Corp' })]),
      ),
    );

    // WHEN: Component is rendered
    renderWithQuery(createElement(ClienteListPanel));

    // THEN: Client nombre is visible
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  it('should render client NIT in list item', async () => {
    // GIVEN: API returns a client with NIT '900-1'
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildCliente({ nit: '900-1' })]),
      ),
    );

    // WHEN: Component is rendered
    renderWithQuery(createElement(ClienteListPanel));

    // THEN: Client NIT is visible
    await waitFor(() => {
      expect(screen.getByText('900-1')).toBeInTheDocument();
    });
  });

  it('should render the search input with accessible label', async () => {
    // GIVEN: API returns clients
    // WHEN: Component is rendered
    renderWithQuery(createElement(ClienteListPanel));

    // THEN: Search input is present with data-testid
    await waitFor(() => {
      expect(screen.getByTestId('clientes-search-input')).toBeInTheDocument();
    });
  });
});

// ─── AC2: Real-time search ────────────────────────────────────────────────────

describe('AC2 — ClienteListPanel search filtering', () => {
  it('should filter list items by nombre substring', async () => {
    // GIVEN: API returns two clients with different nombres
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Alpha SA', nit: '111-1' }),
          buildCliente({ id: '2', nombre: 'Beta Ltda', nit: '222-2' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    // WHEN: User types 'Alpha' in search
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'Alpha');

    // THEN: Only Alpha SA is shown
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    expect(screen.getByText('Alpha SA')).toBeInTheDocument();
  });

  it('should filter list items by NIT substring', async () => {
    // GIVEN: API returns two clients with different NITs
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Empresa Uno', nit: '900111-1' }),
          buildCliente({ id: '2', nombre: 'Empresa Dos', nit: '800333-2' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    // WHEN: User types a NIT substring
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, '800333');

    // THEN: Only Empresa Dos is shown
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    expect(screen.getByText('Empresa Dos')).toBeInTheDocument();
  });

  it('should perform case-insensitive filtering', async () => {
    // GIVEN: API returns a client with mixed-case nombre
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildCliente({ nombre: 'Tecnologías Avanzadas' })]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1));

    // WHEN: User types lowercase 'tecnologías'
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'tecnologías');

    // THEN: The client is still displayed
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
  });

  it('should show zero items when search matches nothing', async () => {
    // GIVEN: API returns one client
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([buildCliente({ nombre: 'Empresa XYZ' })]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1));

    // WHEN: User types a non-matching term
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'ZZZNOMATCH');

    // THEN: No items displayed
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ─── AC3: EmptyState when data is empty ───────────────────────────────────────

describe('AC3 — EmptyState when no clients', () => {
  it('should display EmptyState when API returns empty array', async () => {
    // GIVEN: API returns empty array
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    // WHEN: Component is rendered
    renderWithQuery(createElement(ClienteListPanel));

    // THEN: EmptyState component is visible
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('should not show client list items when data is empty', async () => {
    // GIVEN: API returns empty array
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    // WHEN: Component is rendered
    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument());

    // THEN: No list items are rendered
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });

  it('should still render search input when data is empty', async () => {
    // GIVEN: API returns empty array
    server.use(http.get(API_URL, () => HttpResponse.json([])));

    // WHEN: Component is rendered
    renderWithQuery(createElement(ClienteListPanel));

    // THEN: Search input is still present
    await waitFor(() => {
      expect(screen.getByTestId('clientes-search-input')).toBeInTheDocument();
    });
  });
});

// ─── AC4: ErrorPanel and retry ────────────────────────────────────────────────

describe('AC4 — ErrorPanel on fetch failure', () => {
  it('should display ErrorPanel when API returns 500', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: Component is rendered
    renderWithQuery(createElement(ClienteListPanel));

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  it('should display "Reintentar" button inside ErrorPanel', async () => {
    // GIVEN: API returns 500
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: Component is rendered and error panel shown
    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeInTheDocument());

    // THEN: "Reintentar" button is present
    const retryBtn = screen.getByTestId('error-panel-retry-button');
    expect(retryBtn).toBeInTheDocument();
  });

  it('should call refetch when "Reintentar" button is clicked', async () => {
    // GIVEN: API returns 500 on first call, then 200 on second call
    let callCount = 0;
    server.use(
      http.get(API_URL, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { status: 500, title: 'Internal Server Error' },
            { status: 500 },
          );
        }
        return HttpResponse.json([buildCliente({ nombre: 'Cliente Recuperado' })]);
      }),
    );

    // WHEN: User sees ErrorPanel and clicks Reintentar
    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getByTestId('error-panel')).toBeInTheDocument());

    const retryBtn = screen.getByTestId('error-panel-retry-button');
    await userEvent.click(retryBtn);

    // THEN: A second fetch is triggered and the list is shown
    await waitFor(() => {
      expect(screen.getByText('Cliente Recuperado')).toBeInTheDocument();
    });
  });
});

// ─── Story 2.6: Sort Integration ──────────────────────────────────────────────

describe('Story 2.6 — SortControl integration in ClienteListPanel', () => {
  it('should render SortControl on initial load', async () => {
    renderWithQuery(createElement(ClienteListPanel));

    await waitFor(() => {
      expect(screen.getByText('Ordenar por:')).toBeInTheDocument();
    });
  });

  it('should show "Más reciente" selected by default (fecha-desc)', async () => {
    renderWithQuery(createElement(ClienteListPanel));

    await waitFor(() => {
      // The siesa-ui-kit Select renders the selected value label
      expect(screen.getAllByText('Más reciente').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should reorder list alphabetically ascending when "Nombre A→Z" is selected', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Zaragoza SA', createdAt: '2026-01-01T00:00:00Z' }),
          buildCliente({ id: '2', nombre: 'Acme Corp', createdAt: '2026-01-02T00:00:00Z' }),
          buildCliente({ id: '3', nombre: 'Mundo Tech', createdAt: '2026-01-03T00:00:00Z' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3));

    // Click the SortControl trigger to open options
    // The siesa-ui-kit Select renders options; we look for "Nombre A→Z" option
    const trigger = screen.getByLabelText('Ordenar por:');
    await userEvent.click(trigger);

    const option = screen.getByText('Nombre A→Z');
    await userEvent.click(option);

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Acme Corp');
      expect(items[1]).toHaveTextContent('Mundo Tech');
      expect(items[2]).toHaveTextContent('Zaragoza SA');
    });
  });

  it('should reorder list alphabetically descending when "Nombre Z→A" is selected', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Acme Corp', createdAt: '2026-01-01T00:00:00Z' }),
          buildCliente({ id: '2', nombre: 'Zaragoza SA', createdAt: '2026-01-02T00:00:00Z' }),
          buildCliente({ id: '3', nombre: 'Mundo Tech', createdAt: '2026-01-03T00:00:00Z' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3));

    const trigger = screen.getByLabelText('Ordenar por:');
    await userEvent.click(trigger);
    const option = screen.getByText('Nombre Z→A');
    await userEvent.click(option);

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Zaragoza SA');
      expect(items[1]).toHaveTextContent('Mundo Tech');
      expect(items[2]).toHaveTextContent('Acme Corp');
    });
  });

  it('should order clients by createdAt ascending when "Más antiguo" is selected', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Nuevo', createdAt: '2026-06-01T00:00:00Z' }),
          buildCliente({ id: '2', nombre: 'Antiguo', createdAt: '2024-01-01T00:00:00Z' }),
          buildCliente({ id: '3', nombre: 'Medio', createdAt: '2025-03-01T00:00:00Z' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3));

    const trigger = screen.getByLabelText('Ordenar por:');
    await userEvent.click(trigger);
    const option = screen.getByText('Más antiguo');
    await userEvent.click(option);

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Antiguo');
      expect(items[1]).toHaveTextContent('Medio');
      expect(items[2]).toHaveTextContent('Nuevo');
    });
  });

  it('should order clients by createdAt descending when "Más reciente" is selected', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Antiguo', createdAt: '2024-01-01T00:00:00Z' }),
          buildCliente({ id: '2', nombre: 'Nuevo', createdAt: '2026-06-01T00:00:00Z' }),
          buildCliente({ id: '3', nombre: 'Medio', createdAt: '2025-03-01T00:00:00Z' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3));

    // Select "Más antiguo" first, then switch back to "Más reciente"
    const trigger = screen.getByLabelText('Ordenar por:');
    await userEvent.click(trigger);
    await userEvent.click(screen.getByText('Más antiguo'));

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Antiguo');
    });

    await userEvent.click(trigger);
    await userEvent.click(screen.getByText('Más reciente'));

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Nuevo');
      expect(items[1]).toHaveTextContent('Medio');
      expect(items[2]).toHaveTextContent('Antiguo');
    });
  });

  it('should apply sort to filtered result set without clearing search input (AC5)', async () => {
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Zeta Empresa', nit: '111-1', createdAt: '2026-01-01T00:00:00Z' }),
          buildCliente({ id: '2', nombre: 'Alpha Empresa', nit: '222-2', createdAt: '2026-01-02T00:00:00Z' }),
          buildCliente({ id: '3', nombre: 'Otro Corp', nit: '333-3', createdAt: '2026-01-03T00:00:00Z' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3));

    // Apply search filter (only "Empresa" clients shown)
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'Empresa');

    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    // Now change sort to "Nombre A→Z"
    const trigger = screen.getByLabelText('Ordenar por:');
    await userEvent.click(trigger);
    await userEvent.click(screen.getByText('Nombre A→Z'));

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      // Only 2 filtered items remain (search not cleared)
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent('Alpha Empresa');
      expect(items[1]).toHaveTextContent('Zeta Empresa');
    });

    // Search input is NOT cleared
    expect(screen.getByTestId('clientes-search-input')).toHaveValue('Empresa');
  });

  it('should not trigger additional API calls when sort order changes (AC1-4)', async () => {
    let callCount = 0;
    server.use(
      http.get(API_URL, () => {
        callCount++;
        return HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Beta', createdAt: '2026-01-01T00:00:00Z' }),
          buildCliente({ id: '2', nombre: 'Alpha', createdAt: '2026-01-02T00:00:00Z' }),
        ]);
      }),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    const initialCallCount = callCount;

    // Change sort order twice
    const trigger = screen.getByLabelText('Ordenar por:');
    await userEvent.click(trigger);
    await userEvent.click(screen.getByText('Nombre A→Z'));

    await userEvent.click(trigger);
    await userEvent.click(screen.getByText('Nombre Z→A'));

    // No additional fetch calls should have occurred
    expect(callCount).toBe(initialCallCount);
  });
});
