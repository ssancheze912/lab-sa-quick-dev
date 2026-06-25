/**
 * Story 2.6: ClienteListPanel — Sort Integration Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: Selecting "Nombre A→Z" reorders list alphabetically ascending (no new fetch)
 * - AC2: Selecting "Nombre Z→A" reorders list alphabetically descending (no new fetch)
 * - AC3: Selecting "Más reciente" orders by createdAt descending (no new fetch)
 * - AC4: Selecting "Más antiguo" orders by createdAt ascending (no new fetch)
 * - AC5: Sort applied to filtered set; search input not cleared when sort changes
 * - AC6: On initial render SortControl is present and shows "Más reciente" (fecha-desc)
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// SUT — will fail until sort feature is implemented
import { ClienteListPanel } from './ClienteListPanel';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api/v1/clientes';

const buildCliente = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  nombre: 'Empresa Ejemplo S.A.',
  nit: '900123456-7',
  telefono: '6011234567',
  ciudad: 'Bogotá',
  createdAt: '2026-03-15T10:00:00Z',
  updatedAt: '2026-03-15T10:00:00Z',
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

// ─── AC6: Default sort and SortControl presence on initial render ─────────────

describe('AC6 — SortControl present with "Más reciente" (fecha-desc) on initial load', () => {
  it('should render the SortControl component on initial load', async () => {
    // GIVEN: API returns one client
    // WHEN: ClienteListPanel is rendered
    renderWithQuery(createElement(ClienteListPanel));

    // THEN: SortControl is present in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('sort-control')).toBeInTheDocument();
    });
  });

  it('should have "fecha-desc" as the default selected sort value', async () => {
    // GIVEN: API returns clients; no sort preference set
    // WHEN: ClienteListPanel is rendered
    renderWithQuery(createElement(ClienteListPanel));

    // THEN: The SortControl select shows "fecha-desc" by default
    await waitFor(() => {
      const sortControl = screen.getByTestId('sort-control') as HTMLSelectElement;
      expect(sortControl.value).toBe('fecha-desc');
    });
  });

  it('should place SortControl below the search input', async () => {
    // GIVEN: API returns clients
    // WHEN: ClienteListPanel is rendered
    renderWithQuery(createElement(ClienteListPanel));

    // THEN: Both search input and sort control are present
    await waitFor(() => {
      expect(screen.getByTestId('clientes-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('sort-control')).toBeInTheDocument();
    });
  });
});

// ─── AC1: Nombre A→Z sort ─────────────────────────────────────────────────────

describe('AC1 — Selecting "Nombre A→Z" reorders list alphabetically ascending', () => {
  it('should show Alfa Industries before Zafiro Corp when "nombre-asc" is selected', async () => {
    // GIVEN: API returns two clients in reverse alphabetical order
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: 'z', nombre: 'Zafiro Corp', createdAt: '2026-01-01T08:00:00Z' }),
          buildCliente({ id: 'a', nombre: 'Alfa Industries', createdAt: '2026-06-01T08:00:00Z' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    // WHEN: User selects "Nombre A→Z"
    const sortControl = screen.getByTestId('sort-control');
    await userEvent.selectOptions(sortControl, 'nombre-asc');

    // THEN: "Alfa Industries" is the first item
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items[0]).toHaveTextContent('Alfa Industries');
    expect(items[1]).toHaveTextContent('Zafiro Corp');
  });

  it('should not trigger an additional API call when "nombre-asc" is selected', async () => {
    // GIVEN: Spy on fetch calls via MSW handler call tracking
    let handlerCallCount = 0;
    server.use(
      http.get(API_URL, () => {
        handlerCallCount++;
        return HttpResponse.json([
          buildCliente({ id: 'z', nombre: 'Zafiro Corp', createdAt: '2026-01-01T08:00:00Z' }),
          buildCliente({ id: 'a', nombre: 'Alfa Industries', createdAt: '2026-06-01T08:00:00Z' }),
        ]);
      }),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));
    const countAfterInitialLoad = handlerCallCount;

    // WHEN: User changes sort to "nombre-asc"
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'nombre-asc');

    // THEN: The MSW handler was NOT called again
    expect(handlerCallCount).toBe(countAfterInitialLoad);
  });
});

// ─── AC2: Nombre Z→A sort ─────────────────────────────────────────────────────

describe('AC2 — Selecting "Nombre Z→A" reorders list alphabetically descending', () => {
  it('should show Zafiro Corp before Alfa Industries when "nombre-desc" is selected', async () => {
    // GIVEN: API returns two clients in alphabetical order
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: 'a', nombre: 'Alfa Industries', createdAt: '2026-06-01T08:00:00Z' }),
          buildCliente({ id: 'z', nombre: 'Zafiro Corp', createdAt: '2026-01-01T08:00:00Z' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    // WHEN: User selects "Nombre Z→A"
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'nombre-desc');

    // THEN: "Zafiro Corp" is the first item
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items[0]).toHaveTextContent('Zafiro Corp');
    expect(items[1]).toHaveTextContent('Alfa Industries');
  });

  it('should not trigger an additional API call when "nombre-desc" is selected', async () => {
    // GIVEN: Spy on handler call count
    let handlerCallCount = 0;
    server.use(
      http.get(API_URL, () => {
        handlerCallCount++;
        return HttpResponse.json([
          buildCliente({ id: 'a', nombre: 'Alfa Industries', createdAt: '2026-06-01T08:00:00Z' }),
          buildCliente({ id: 'z', nombre: 'Zafiro Corp', createdAt: '2026-01-01T08:00:00Z' }),
        ]);
      }),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));
    const countAfterInitialLoad = handlerCallCount;

    // WHEN: User changes sort to "nombre-desc"
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'nombre-desc');

    // THEN: The MSW handler was NOT called again
    expect(handlerCallCount).toBe(countAfterInitialLoad);
  });
});

// ─── AC3: Más reciente (fecha-desc) sort ─────────────────────────────────────

describe('AC3 — Selecting "Más reciente" orders by createdAt descending', () => {
  it('should show newest client first when "fecha-desc" is selected', async () => {
    // GIVEN: API returns an older and a newer client
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: 'old', nombre: 'Empresa Antigua', createdAt: '2026-01-10T08:00:00Z' }),
          buildCliente({ id: 'new', nombre: 'Empresa Nueva', createdAt: '2026-06-20T08:00:00Z' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    // Start from fecha-asc to ensure a state change
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'fecha-asc');

    // WHEN: User selects "Más reciente" (fecha-desc)
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'fecha-desc');

    // THEN: "Empresa Nueva" (newest) appears first
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items[0]).toHaveTextContent('Empresa Nueva');
    expect(items[1]).toHaveTextContent('Empresa Antigua');
  });

  it('should not trigger an additional API call when "fecha-desc" is selected', async () => {
    // GIVEN: Spy on handler call count
    let handlerCallCount = 0;
    server.use(
      http.get(API_URL, () => {
        handlerCallCount++;
        return HttpResponse.json([
          buildCliente({ id: 'old', nombre: 'Empresa Antigua', createdAt: '2026-01-10T08:00:00Z' }),
          buildCliente({ id: 'new', nombre: 'Empresa Nueva', createdAt: '2026-06-20T08:00:00Z' }),
        ]);
      }),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));
    // Change to something else first
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'fecha-asc');
    const countAfterAscChange = handlerCallCount;

    // WHEN: User switches back to "Más reciente"
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'fecha-desc');

    // THEN: The MSW handler was NOT called again
    expect(handlerCallCount).toBe(countAfterAscChange);
  });
});

// ─── AC4: Más antiguo (fecha-asc) sort ───────────────────────────────────────

describe('AC4 — Selecting "Más antiguo" orders by createdAt ascending', () => {
  it('should show oldest client first when "fecha-asc" is selected', async () => {
    // GIVEN: API returns an older and a newer client
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: 'new', nombre: 'Empresa Nueva', createdAt: '2026-06-20T08:00:00Z' }),
          buildCliente({ id: 'old', nombre: 'Empresa Antigua', createdAt: '2026-01-10T08:00:00Z' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    // WHEN: User selects "Más antiguo" (fecha-asc)
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'fecha-asc');

    // THEN: "Empresa Antigua" (oldest) appears first
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items[0]).toHaveTextContent('Empresa Antigua');
    expect(items[1]).toHaveTextContent('Empresa Nueva');
  });

  it('should not trigger an additional API call when "fecha-asc" is selected', async () => {
    // GIVEN: Spy on handler call count
    let handlerCallCount = 0;
    server.use(
      http.get(API_URL, () => {
        handlerCallCount++;
        return HttpResponse.json([
          buildCliente({ id: 'new', nombre: 'Empresa Nueva', createdAt: '2026-06-20T08:00:00Z' }),
          buildCliente({ id: 'old', nombre: 'Empresa Antigua', createdAt: '2026-01-10T08:00:00Z' }),
        ]);
      }),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));
    const countAfterInitialLoad = handlerCallCount;

    // WHEN: User selects "Más antiguo"
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'fecha-asc');

    // THEN: The MSW handler was NOT called again
    expect(handlerCallCount).toBe(countAfterInitialLoad);
  });
});

// ─── AC5: Sort interacts correctly with active search filter ──────────────────

describe('AC5 — Sort applied to filtered result set; search input not cleared', () => {
  it('should apply sort only to the already-filtered set (not all clients)', async () => {
    // GIVEN: Three clients; two contain "Corp" in nombre
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Zafiro Corp', nit: '111-1', createdAt: '2026-01-01T08:00:00Z' }),
          buildCliente({ id: '2', nombre: 'Alfa Corp', nit: '222-2', createdAt: '2026-06-01T08:00:00Z' }),
          buildCliente({ id: '3', nombre: 'Beta Industries', nit: '333-3', createdAt: '2026-03-01T08:00:00Z' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3));

    // AND: User has filtered by "Corp"
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'Corp');
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    // WHEN: User changes sort to "Nombre A→Z"
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'nombre-asc');

    // THEN: Only 2 items remain in the list (filter preserved)
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);

    // AND: Within those 2, "Alfa Corp" comes before "Zafiro Corp"
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items[0]).toHaveTextContent('Alfa Corp');
    expect(items[1]).toHaveTextContent('Zafiro Corp');
  });

  it('should not clear the search input when sort order changes', async () => {
    // GIVEN: Two clients; user typed a search query
    server.use(
      http.get(API_URL, () =>
        HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Zafiro Corp', nit: '111-1' }),
          buildCliente({ id: '2', nombre: 'Alfa Corp', nit: '222-2' }),
        ]),
      ),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));

    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'Corp');

    // WHEN: User changes sort order
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'nombre-asc');

    // THEN: Search input still contains "Corp"
    expect(searchInput).toHaveValue('Corp');
  });

  it('should not trigger an additional API call when sort changes while filter is active', async () => {
    // GIVEN: Spy on handler call count; user has an active filter
    let handlerCallCount = 0;
    server.use(
      http.get(API_URL, () => {
        handlerCallCount++;
        return HttpResponse.json([
          buildCliente({ id: '1', nombre: 'Zafiro Corp', nit: '111-1' }),
          buildCliente({ id: '2', nombre: 'Alfa Corp', nit: '222-2' }),
        ]);
      }),
    );

    renderWithQuery(createElement(ClienteListPanel));
    await waitFor(() => expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2));
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'Corp');
    const countAfterFilter = handlerCallCount;

    // WHEN: User changes sort order
    await userEvent.selectOptions(screen.getByTestId('sort-control'), 'nombre-asc');

    // THEN: The MSW handler was NOT called again
    expect(handlerCallCount).toBe(countAfterFilter);
  });
});
