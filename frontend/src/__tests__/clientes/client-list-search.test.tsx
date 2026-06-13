/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Component Tests — RED Phase (Vitest + React Testing Library + MSW)
 *
 * Acceptance Criteria covered:
 *   AC1 — Renders a left panel (280px) with a scrollable list showing Nombre and NIT/RUC per item
 *   AC2 — Typing in search input filters the list in real time (case-insensitive)
 *   AC3 — When no clients exist, an EmptyState component is shown with a guiding message
 *   AC4 — When GET /api/v1/clientes fails, ErrorPanel with "Reintentar" button; clicking retries
 *   AC5 — Clearing the search input restores the full unfiltered list immediately
 *   AC6 — Search input is empty when page remounts (no persisted search state)
 *
 * Tests are in RED phase — all will fail until implementation is complete.
 * MSW intercepts HTTP requests at the network layer (no real HTTP traffic).
 * Selectors use data-testid for stability.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';

// ---------------------------------------------------------------------------
// MSW server setup — intercepts GET /api/v1/clientes
// ---------------------------------------------------------------------------

const mockClientes: Cliente[] = [
  {
    id: '1',
    nombre: 'Empresa Alfa SA',
    nit: '900100200',
    telefono: '3001000001',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    nombre: 'Comercial Beta SAS',
    nit: '900200300',
    telefono: '3001000002',
    ciudad: 'Medellín',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];

const server = setupServer(
  http.get('/api/v1/clientes', () => {
    return HttpResponse.json(mockClientes);
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

/**
 * Creates a fresh QueryClient for each test to avoid cache contamination.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
}

/**
 * Renders ClienteListPanel wrapped with a fresh QueryClient provider.
 */
async function renderClienteListPanel() {
  // Dynamic import deferred intentionally — component does not exist yet (RED phase).
  // This import will fail with MODULE_NOT_FOUND until implementation is complete.
  const { ClienteListPanel } = await import(
    '../../modules/crm/clientes/presentation/ClienteListPanel'
  );

  const queryClient = createTestQueryClient();

  await act(async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ClienteListPanel />
      </QueryClientProvider>
    );
  });

  return { queryClient };
}

// ---------------------------------------------------------------------------
// AC1 — Left panel renders scrollable list with Nombre and NIT/RUC
// ---------------------------------------------------------------------------

describe('AC1 — Client list panel renders at /clientes', () => {
  it('should render the clientes-list-panel container element', async () => {
    // GIVEN: The backend returns a list of clients
    // WHEN: ClienteListPanel mounts and fetches data
    await renderClienteListPanel();

    // THEN: The panel container is present in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
    });
  });

  it('should render client list items when data is loaded', async () => {
    // GIVEN: The backend returns two clients
    // WHEN: ClienteListPanel mounts and receives data
    await renderClienteListPanel();

    // THEN: List items are rendered
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(2);
    });
  });

  it('should display the Nombre of each client in the list', async () => {
    // GIVEN: The backend returns clients including "Empresa Alfa SA"
    // WHEN: ClienteListPanel renders with data
    await renderClienteListPanel();

    // THEN: The client name is visible
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('Empresa Alfa SA');
    });
  });

  it('should display the NIT/RUC of each client in the list', async () => {
    // GIVEN: The backend returns clients with NIT "900100200"
    // WHEN: ClienteListPanel renders with data
    await renderClienteListPanel();

    // THEN: The NIT is visible in the panel
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('900100200');
    });
  });

  it('should render the search input with aria-label="Buscar clientes" for WCAG 2.1 AA', async () => {
    // GIVEN: ClienteListPanel mounts
    // WHEN: The panel renders
    await renderClienteListPanel();

    // THEN: Search input has the required aria-label
    await waitFor(() => {
      const input = screen.getByTestId('clientes-search-input');
      expect(input).toHaveAttribute('aria-label', 'Buscar clientes');
    });
  });

  it('should render skeleton placeholders while data is loading', async () => {
    // GIVEN: API response is delayed (loading state)
    server.use(
      http.get('/api/v1/clientes', async () => {
        // Deliberately slow response to observe loading state
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json(mockClientes);
      })
    );

    // WHEN: ClienteListPanel mounts but data has not yet arrived
    const { queryClient } = await renderClienteListPanel();

    // THEN: Skeleton placeholders are shown (not a spinner per company standards)
    // NOTE: Implementation must render exactly 5 skeleton rows as specified in story
    expect(screen.getByTestId('clientes-list-skeleton')).toBeInTheDocument();

    // Cleanup pending query
    queryClient.cancelQueries();
  });
});

// ---------------------------------------------------------------------------
// AC2 — Real-time search filtering (case-insensitive, client-side)
// ---------------------------------------------------------------------------

describe('AC2 — Real-time search filtering', () => {
  it('should show only clients matching the search term by Nombre', async () => {
    // GIVEN: Two clients are loaded
    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: The user types a search term matching only the first client
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'Alfa' } });

    // THEN: Only the matching client is shown; the other is hidden
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('Empresa Alfa SA');
      expect(screen.getByTestId('clientes-list-panel')).not.toHaveTextContent('Comercial Beta SAS');
    });
  });

  it('should show only clients matching the search term by NIT/RUC', async () => {
    // GIVEN: Two clients are loaded
    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: The user types the NIT of the second client
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: '900200300' } });

    // THEN: Only the matching client (Comercial Beta SAS) is shown
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('Comercial Beta SAS');
      expect(screen.getByTestId('clientes-list-panel')).not.toHaveTextContent('Empresa Alfa SA');
    });
  });

  it('should perform case-insensitive matching (uppercase input matches mixed-case data)', async () => {
    // GIVEN: A client named "Empresa Alfa SA" is loaded
    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: The user types in uppercase
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'EMPRESA' } });

    // THEN: The matching client is found despite case difference
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('Empresa Alfa SA');
    });
  });

  it('should perform case-insensitive matching (lowercase input matches uppercase data)', async () => {
    // GIVEN: A client named "Empresa Alfa SA" is loaded
    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: The user types in lowercase
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'alfa sa' } });

    // THEN: The matching client is found
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('Empresa Alfa SA');
    });
  });

  it('should NOT trigger an additional API call when the search input changes', async () => {
    // GIVEN: A single initial GET /api/v1/clientes call is made on mount
    let callCount = 0;
    server.use(
      http.get('/api/v1/clientes', () => {
        callCount++;
        return HttpResponse.json(mockClientes);
      })
    );

    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const initialCallCount = callCount;

    // WHEN: The user types in the search input
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'Alfa' } });

    // THEN: No additional API call is made (filtering is purely client-side)
    expect(callCount).toBe(initialCallCount);
  });
});

// ---------------------------------------------------------------------------
// AC3 — EmptyState shown when no clients exist
// ---------------------------------------------------------------------------

describe('AC3 — EmptyState when no clients exist', () => {
  it('should render the EmptyState component when the API returns an empty array', async () => {
    // GIVEN: The backend returns an empty list
    server.use(
      http.get('/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteListPanel mounts and receives empty data
    await renderClienteListPanel();

    // THEN: The EmptyState component is shown
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('should show a guiding message to create the first client in the EmptyState', async () => {
    // GIVEN: The backend returns an empty list
    server.use(
      http.get('/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: EmptyState renders
    await renderClienteListPanel();

    // THEN: The guiding message is visible (in Spanish)
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toHaveTextContent(/No hay clientes registrados/i);
    });
  });

  it('should NOT render any client-list-item elements when EmptyState is displayed', async () => {
    // GIVEN: The backend returns an empty list
    server.use(
      http.get('/api/v1/clientes', () => {
        return HttpResponse.json([]);
      })
    );

    // WHEN: EmptyState renders
    await renderClienteListPanel();

    // THEN: No list items are rendered
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// AC4 — ErrorPanel on API failure with "Reintentar" retry button
// ---------------------------------------------------------------------------

describe('AC4 — ErrorPanel on API failure with retry', () => {
  it('should render the ErrorPanel component when GET /api/v1/clientes returns 500', async () => {
    // GIVEN: The backend returns a 500 error
    server.use(
      http.get('/api/v1/clientes', () => {
        return HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    // WHEN: ClienteListPanel mounts and the fetch fails
    await renderClienteListPanel();

    // THEN: The ErrorPanel is displayed instead of the list
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  it('should render a "Reintentar" button inside the ErrorPanel', async () => {
    // GIVEN: The backend returns a 500 error
    server.use(
      http.get('/api/v1/clientes', () => {
        return HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 }
        );
      })
    );

    // WHEN: ErrorPanel renders
    await renderClienteListPanel();

    // THEN: A "Reintentar" button is present
    await waitFor(() => {
      const retryBtn = screen.getByTestId('error-panel-retry-button');
      expect(retryBtn).toBeInTheDocument();
      expect(retryBtn).toHaveTextContent('Reintentar');
    });
  });

  it('should trigger a new GET /api/v1/clientes fetch when "Reintentar" is clicked', async () => {
    // GIVEN: The first call fails, subsequent calls succeed
    let callCount = 0;
    server.use(
      http.get('/api/v1/clientes', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ status: 500, title: 'Error' }, { status: 500 });
        }
        return HttpResponse.json(mockClientes);
      })
    );

    await renderClienteListPanel();

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    const callCountBeforeRetry = callCount;

    // WHEN: The user clicks "Reintentar"
    const retryBtn = screen.getByTestId('error-panel-retry-button');
    fireEvent.click(retryBtn);

    // THEN: A new API call was made and the client list is now visible
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(callCountBeforeRetry);
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('Empresa Alfa SA');
    });
  });

  it('should NOT render client-list-item elements when ErrorPanel is displayed', async () => {
    // GIVEN: The backend fails
    server.use(
      http.get('/api/v1/clientes', () => {
        return HttpResponse.json({ status: 500 }, { status: 500 });
      })
    );

    // WHEN: ErrorPanel renders
    await renderClienteListPanel();

    // THEN: No list items are rendered alongside the error panel
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// AC5 — Clearing search restores the full unfiltered list
// ---------------------------------------------------------------------------

describe('AC5 — Clearing search restores full list', () => {
  it('should restore all items when the search input is cleared after filtering', async () => {
    // GIVEN: Two clients are loaded and a search filter is active
    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByTestId('clientes-search-input');

    // Apply filter
    fireEvent.change(searchInput, { target: { value: 'Alfa' } });
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).not.toHaveTextContent('Comercial Beta SAS');
    });

    // WHEN: The user clears the search input
    fireEvent.change(searchInput, { target: { value: '' } });

    // THEN: Both clients are visible again
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('Empresa Alfa SA');
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('Comercial Beta SAS');
    });
  });

  it('should show all items when search input has only whitespace (treated as empty)', async () => {
    // GIVEN: Two clients are loaded
    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByTestId('clientes-search-input');

    // WHEN: The user types only whitespace
    fireEvent.change(searchInput, { target: { value: '   ' } });

    // THEN: The full list is shown (whitespace-only is equivalent to empty)
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });
  });
});

// ---------------------------------------------------------------------------
// AC6 — Search input starts empty on component mount (no persisted state)
// ---------------------------------------------------------------------------

describe('AC6 — Search input resets on component mount', () => {
  it('should start with an empty search input when ClienteListPanel first mounts', async () => {
    // GIVEN: ClienteListPanel is freshly mounted (no prior state)
    // WHEN: The component renders
    await renderClienteListPanel();

    // THEN: The search input value is empty
    await waitFor(() => {
      const searchInput = screen.getByTestId('clientes-search-input');
      expect(searchInput).toHaveValue('');
    });
  });
});
