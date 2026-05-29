/**
 * Component Tests — Story 2.1: Client List & Search
 * Epic 2: Client Management (Gestión de Clientes)
 *
 * Tools: Vitest + @testing-library/react + MSW 2+
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel shows scrollable list of clients with Nombre and NIT/RUC per item
 *   AC2 — Real-time search filters by Nombre or NIT/RUC (case-insensitive, < 1s for 500 records)
 *   AC3 — EmptyState shown when no clients exist (no empty list element)
 *   AC4 — ErrorPanel with "Reintentar" button on fetch failure; clicking Reintentar calls refetch
 *   AC5 — Left panel has fixed width of 280px on desktop viewport (>= 1024px)
 *
 * Test cases aligned with test-design-epic-2.md:
 *   TC-E2-P1-01: Real-time search filters list
 *   TC-E2-P1-02: Performance — filter < 1s with 500 records
 *   TC-E2-P1-03: EmptyState shown when MSW returns []
 *   TC-E2-P1-04: ErrorPanel with "Reintentar" shown on MSW 500 error; click retry calls refetch
 *   TC-E2-P3-01: Each list item shows Nombre and NIT/RUC
 *   TC-E2-P3-02: Panel has class w-[280px] at desktop viewport
 *
 * RED PHASE: All tests fail — ClienteListView and supporting components are not yet implemented.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { createCliente, createClientes } from '../../../../../test/factories/cliente.factory';

// Component under test — NOT YET IMPLEMENTED (RED phase)
import { ClienteListView } from './ClienteListView';

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Test Helpers ─────────────────────────────────────────────────────────────

/**
 * Creates a fresh QueryClient per test (no retry to fail fast).
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
}

/**
 * Wraps the component under test with a QueryClientProvider.
 */
function renderWithProviders(ui: React.ReactElement, queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

// ─── AC1 / TC-E2-P3-01 — List items show Nombre and NIT/RUC ─────────────────

describe('TC-E2-P3-01 — AC1: Lista de clientes con Nombre y NIT/RUC por item', () => {
  it('debe renderizar el panel de lista de clientes', async () => {
    // GIVEN: The backend returns two clients
    const clientes = [
      createCliente({ nombre: 'Empresa Alpha SAS', nit: '900111222' }),
      createCliente({ nombre: 'Distribuidora Beta Ltda', nit: '800333444' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    // THEN: The list panel container is present
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
    });
  });

  it('debe mostrar el nombre de cada cliente en su item de lista', async () => {
    // GIVEN: A client with a known nombre
    const cliente = createCliente({ nombre: 'Empresa Alpha SAS', nit: '900111222' });

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    // THEN: The nombre is visible in the list item
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SAS')).toBeInTheDocument();
    });
  });

  it('debe mostrar el NIT/RUC de cada cliente en su item de lista', async () => {
    // GIVEN: A client with a known NIT
    const cliente = createCliente({ nombre: 'Empresa Alpha SAS', nit: '900111222' });

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    // THEN: The NIT is visible in the list item
    await waitFor(() => {
      expect(screen.getByText(/900111222/)).toBeInTheDocument();
    });
  });

  it('debe renderizar el item correcto con data-testid="cliente-list-item"', async () => {
    // GIVEN: Two clients are loaded
    const clientes = [
      createCliente({ nombre: 'Empresa Alpha', nit: '900111222' }),
      createCliente({ nombre: 'Empresa Beta', nit: '800333444' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    // THEN: Two items are rendered with the correct testid
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });
  });

  it('debe mostrar un skeleton de carga mientras se obtienen los datos', async () => {
    // GIVEN: The backend has a delayed response
    server.use(
      http.get('*/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json([]);
      }),
    );

    // WHEN: ClienteListView is rendered before data resolves
    renderWithProviders(<ClienteListView />);

    // THEN: A loading skeleton is visible during the fetch
    expect(screen.getByTestId('clientes-loading-skeleton')).toBeInTheDocument();
  });
});

// ─── AC2 / TC-E2-P1-01 — Real-time search filter ─────────────────────────────

describe('TC-E2-P1-01 — AC2: Búsqueda en tiempo real filtra la lista', () => {
  it('debe filtrar la lista por nombre cuando el usuario escribe en el campo de búsqueda', async () => {
    // GIVEN: Two clients are loaded — one matches search, other does not
    const clientes = [
      createCliente({ id: 'id-match', nombre: 'Empresa Filtro Especial', nit: '900111000' }),
      createCliente({ id: 'id-nomatch', nombre: 'Otra Empresa SAS', nit: '800222000' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    );

    renderWithProviders(<ClienteListView />);

    // Wait for initial list to load
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: User types in the search field
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'Filtro Especial');

    // THEN: Only the matching client is shown
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
      expect(screen.getByText('Empresa Filtro Especial')).toBeInTheDocument();
    });
  });

  it('debe filtrar la lista por NIT/RUC cuando el usuario escribe en el campo de búsqueda', async () => {
    // GIVEN: Two clients with distinct NITs
    const clientes = [
      createCliente({ id: 'id-nit', nombre: 'Empresa Alpha', nit: '999888777' }),
      createCliente({ id: 'id-other', nombre: 'Empresa Beta', nit: '111222333' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    );

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: User types the NIT of the first client
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, '999888777');

    // THEN: Only the matching client is shown
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
    });
  });

  it('la búsqueda debe ser insensible a mayúsculas', async () => {
    // GIVEN: A client with upper-case nombre
    const cliente = createCliente({ nombre: 'Empresa Alpha SAS', nit: '900111222' });

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])),
    );

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User types in lowercase
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'empresa alpha');

    // THEN: The client is still found (case-insensitive)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
  });

  it('debe mostrar la lista completa cuando se borra el campo de búsqueda', async () => {
    // GIVEN: Three clients loaded, search filters to one
    const clientes = [
      createCliente({ id: 'id-1', nombre: 'Empresa Alpha', nit: '900111000' }),
      createCliente({ id: 'id-2', nombre: 'Empresa Beta', nit: '800222000' }),
      createCliente({ id: 'id-3', nombre: 'Empresa Gamma', nit: '700333000' }),
    ];

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    );

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'Alpha');

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User clears the search input
    await userEvent.clear(searchInput);

    // THEN: All 3 clients are shown again
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });
  });

  it('debe tener campo de búsqueda con placeholder en español', async () => {
    // GIVEN: The component is rendered
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    renderWithProviders(<ClienteListView />);

    // WHEN: Search input is rendered
    const searchInput = await screen.findByTestId('clientes-search-input');

    // THEN: Placeholder is in Spanish
    expect(searchInput).toHaveAttribute('placeholder', 'Buscar por nombre o NIT/RUC...');
  });
});

// ─── AC2 / TC-E2-P1-02 — Search performance < 1s with 500 records ────────────

describe('TC-E2-P1-02 — AC2: El filtro debe aplicarse en < 1 segundo con 500 registros', () => {
  it('debe filtrar 500 registros en menos de 1 segundo (NFR1)', async () => {
    // GIVEN: 500 clients are pre-loaded in the query cache
    const queryClient = createTestQueryClient();
    const clientes = createClientes(500);

    // Pre-populate query cache to avoid network latency in this perf test
    queryClient.setQueryData(['clientes'], clientes);

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json(clientes)),
    );

    renderWithProviders(<ClienteListView />, queryClient);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500);
    });

    const searchInput = screen.getByTestId('clientes-search-input');

    // WHEN: User types a search term (measured for performance)
    const start = performance.now();
    fireEvent.change(searchInput, { target: { value: 'Empresa Alpha' } });
    const elapsed = performance.now() - start;

    // THEN: Filter completes in < 1000ms
    expect(elapsed).toBeLessThan(1000);
  });
});

// ─── AC3 / TC-E2-P1-03 — EmptyState when no clients ─────────────────────────

describe('TC-E2-P1-03 — AC3: EmptyState cuando no hay clientes', () => {
  it('debe mostrar el componente EmptyState cuando la API retorna una lista vacía', async () => {
    // GIVEN: The backend returns an empty array
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    // THEN: EmptyState component is visible
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('no debe renderizar elemento de lista vacío cuando no hay clientes', async () => {
    // GIVEN: No clients in the system
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // THEN: No client list items are rendered
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });

  it('EmptyState debe mostrar mensaje guía en español', async () => {
    // GIVEN: No clients exist
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    // THEN: EmptyState contains a Spanish message guiding user to create first client
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // Message should mention "cliente" (Spanish word) to guide the user
    const emptyState = screen.getByTestId('empty-state');
    expect(emptyState).toHaveTextContent(/cliente/i);
  });

  it('debe mostrar EmptyState cuando el filtro de búsqueda no tiene coincidencias', async () => {
    // GIVEN: One client exists
    const cliente = createCliente({ nombre: 'Empresa Alpha', nit: '900111222' });

    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([cliente])),
    );

    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: User types a search term with no matches
    const searchInput = screen.getByTestId('clientes-search-input');
    await userEvent.type(searchInput, 'XXXXXX_NO_MATCH');

    // THEN: EmptyState is shown (no client matches, no empty list element)
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ─── AC4 / TC-E2-P1-04 — ErrorPanel on 500 error + Reintentar ───────────────

describe('TC-E2-P1-04 — AC4: ErrorPanel con "Reintentar" en error de backend', () => {
  it('debe mostrar el componente ErrorPanel cuando el fetch falla con 500', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón "Reintentar" dentro del ErrorPanel', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    // THEN: "Reintentar" button is visible inside ErrorPanel
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('no debe mostrar la lista de clientes cuando ocurre un error de fetch', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // THEN: No client list items are rendered
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });

  it('debe llamar a refetch cuando el usuario hace clic en "Reintentar"', async () => {
    // GIVEN: First request fails, second succeeds (simulating retry)
    let callCount = 0;
    const clientes = [createCliente({ nombre: 'Empresa Alpha', nit: '900111222' })];

    server.use(
      http.get('*/api/v1/clientes', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Server Error' }, { status: 500 });
        }
        return HttpResponse.json(clientes);
      }),
    );

    // WHEN: ClienteListView is rendered (first call fails)
    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // AND: User clicks "Reintentar"
    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    await userEvent.click(retryButton);

    // THEN: The API was called again (refetch triggered) and list is now shown
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
    expect(callCount).toBe(2);
  });

  it('el ErrorPanel debe mostrar un mensaje de error en español', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get('*/api/v1/clientes', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
      ),
    );

    // WHEN: ClienteListView is rendered
    renderWithProviders(<ClienteListView />);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // THEN: Error message is in Spanish (not technical details)
    const errorPanel = screen.getByTestId('error-panel');
    expect(errorPanel).toHaveTextContent(/no se pudo cargar/i);
  });
});

// ─── AC5 / TC-E2-P3-02 — Panel has class w-[280px] ──────────────────────────

describe('TC-E2-P3-02 — AC5: Panel izquierdo con clase w-[280px] en escritorio', () => {
  it('el panel de lista debe tener la clase CSS w-[280px]', async () => {
    // GIVEN: ClienteListView is rendered on desktop viewport
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    // WHEN: Component is rendered
    renderWithProviders(<ClienteListView />);

    // THEN: The list panel has the w-[280px] Tailwind class
    await waitFor(() => {
      const panel = screen.getByTestId('clientes-list-panel');
      expect(panel).toHaveClass('w-[280px]');
    });
  });

  it('el panel de lista debe tener overflow-y-auto para scroll', async () => {
    // GIVEN: ClienteListView is rendered
    server.use(
      http.get('*/api/v1/clientes', () => HttpResponse.json([])),
    );

    // WHEN: Component is rendered
    renderWithProviders(<ClienteListView />);

    // THEN: The panel has overflow scroll class
    await waitFor(() => {
      const panel = screen.getByTestId('clientes-list-panel');
      // Should have one of: overflow-y-auto, overflow-y-scroll, overflow-auto
      const classList = panel.className;
      const hasScrollClass =
        classList.includes('overflow-y-auto') ||
        classList.includes('overflow-y-scroll') ||
        classList.includes('overflow-auto');
      expect(hasScrollClass).toBe(true);
    });
  });
});
