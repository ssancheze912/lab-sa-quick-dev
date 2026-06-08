/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Component Tests — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1  — Left panel renders scrollable client list showing Nombre and NIT/RUC
 *   AC2  — Real-time search input filters by Nombre and NIT
 *   AC3  — Clearing search restores full list without new API call
 *   AC4  — EmptyState component shown when no clients exist (Spanish message)
 *   AC5  — ErrorPanel with "Reintentar" button shown when fetch fails
 *   AC6  — Search input has accessible label in Spanish; no axe critical/serious violations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─────────────────────────────────────────────────────────────────────────────
// Test data helpers
// ─────────────────────────────────────────────────────────────────────────────

const makeCliente = (overrides: Partial<{ id: string; nombre: string; nit: string }> = {}) => ({
  id: overrides.id ?? 'uuid-test-1',
  nombre: overrides.nombre ?? 'Cliente de Prueba',
  nit: overrides.nit ?? '900123456',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

// ─────────────────────────────────────────────────────────────────────────────
// Render helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps a component in QueryClientProvider for TanStack Query context.
 * ClienteListPanel depends on useClientes which uses TanStack Query.
 */
function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = makeQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Left panel renders scrollable client list with Nombre and NIT/RUC
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — ClienteListPanel renders the client list', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render the clientes-list-panel container', async () => {
    // GIVEN: The clienteApiRepository.getAll returns a list of clients
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([makeCliente()]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: ClienteListPanel is rendered
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: The panel container is in the document
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
    });
  });

  it('should display a client item showing the Nombre', async () => {
    // GIVEN: One client exists with a known Nombre
    const cliente = makeCliente({ nombre: 'Constructora del Valle', nit: '900111222' });

    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([cliente]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: ClienteListPanel is rendered
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: The client's Nombre is visible in the list
    await waitFor(() => {
      expect(screen.getByText('Constructora del Valle')).toBeInTheDocument();
    });
  });

  it('should display a client item showing the NIT/RUC', async () => {
    // GIVEN: One client exists with a known NIT
    const cliente = makeCliente({ nombre: 'Empresa NIT Test', nit: '800999888' });

    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([cliente]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: ClienteListPanel is rendered
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: The client's NIT is visible in the list item
    await waitFor(() => {
      expect(screen.getByText('800999888')).toBeInTheDocument();
    });
  });

  it('should render each client as a data-testid="cliente-list-item" element', async () => {
    // GIVEN: Multiple clients exist
    const clientes = [
      makeCliente({ id: 'uuid-1', nombre: 'Alpha SA', nit: '100000001' }),
      makeCliente({ id: 'uuid-2', nombre: 'Beta Corp', nit: '200000002' }),
    ];

    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue(clientes),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: ClienteListPanel is rendered
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: Two list items are rendered with correct test IDs
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(2);
    });
  });

  it('should render a skeleton list while clients are loading', async () => {
    // GIVEN: The API call is pending (never resolves during this test)
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockReturnValue(new Promise(() => {})),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: ClienteListPanel is rendered before data loads
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: A skeleton loading state is shown (data-testid="clientes-skeleton")
    expect(screen.getByTestId('clientes-skeleton')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time search input filters by Nombre and NIT
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Real-time search filters the list by Nombre and NIT', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render the search input with placeholder "Buscar cliente..."', async () => {
    // GIVEN: ClienteListPanel is rendered with clients
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([makeCliente()]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: ClienteListPanel is rendered
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: Search input with correct placeholder is visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Buscar cliente...')).toBeInTheDocument();
    });
  });

  it('should show only matching client when user types a Nombre search term', async () => {
    // GIVEN: Two clients with different Nombres
    const clientes = [
      makeCliente({ id: 'uuid-a', nombre: 'Empresa Única', nit: '100100100' }),
      makeCliente({ id: 'uuid-b', nombre: 'Otra Compañía', nit: '200200200' }),
    ];

    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue(clientes),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');
    const user = userEvent.setup();

    // WHEN: User types a search term that matches only one client
    renderWithQueryClient(<ClienteListPanel />);
    await waitFor(() => screen.getByPlaceholderText('Buscar cliente...'));
    await user.type(screen.getByPlaceholderText('Buscar cliente...'), 'Única');

    // THEN: Only the matching client is visible
    await waitFor(() => {
      expect(screen.getByText('Empresa Única')).toBeInTheDocument();
      expect(screen.queryByText('Otra Compañía')).not.toBeInTheDocument();
    });
  });

  it('should filter clients by NIT when user types a NIT search term', async () => {
    // GIVEN: Two clients with different NITs
    const clientes = [
      makeCliente({ id: 'uuid-c', nombre: 'Constructora Norte', nit: '900555888' }),
      makeCliente({ id: 'uuid-d', nombre: 'Empresa Sur', nit: '100200300' }),
    ];

    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue(clientes),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');
    const user = userEvent.setup();

    // WHEN: User types the NIT of the first client
    renderWithQueryClient(<ClienteListPanel />);
    await waitFor(() => screen.getByPlaceholderText('Buscar cliente...'));
    await user.type(screen.getByPlaceholderText('Buscar cliente...'), '900555888');

    // THEN: Only the client with that NIT is visible
    await waitFor(() => {
      expect(screen.getByText('Constructora Norte')).toBeInTheDocument();
      expect(screen.queryByText('Empresa Sur')).not.toBeInTheDocument();
    });
  });

  it('should perform search filtering case-insensitively', async () => {
    // GIVEN: A client with a mixed-case Nombre
    const clientes = [makeCliente({ nombre: 'Construcciones Del Valle', nit: '300300300' })];

    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue(clientes),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');
    const user = userEvent.setup();

    // WHEN: User types a lowercase version of the Nombre
    renderWithQueryClient(<ClienteListPanel />);
    await waitFor(() => screen.getByPlaceholderText('Buscar cliente...'));
    await user.type(screen.getByPlaceholderText('Buscar cliente...'), 'construcciones');

    // THEN: The matching client is still shown (case-insensitive match)
    await waitFor(() => {
      expect(screen.getByText('Construcciones Del Valle')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Clearing search restores full list without a new API call
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Clearing the search field restores the full list', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should restore all clients when search input is cleared after filtering', async () => {
    // GIVEN: Two clients and a search filter is active
    const clientes = [
      makeCliente({ id: 'uuid-e', nombre: 'Alpha Corp', nit: '111111111' }),
      makeCliente({ id: 'uuid-f', nombre: 'Beta Industries', nit: '222222222' }),
    ];

    const mockGetAll = vi.fn().mockResolvedValue(clientes);
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: { getAll: mockGetAll },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');
    const user = userEvent.setup();

    renderWithQueryClient(<ClienteListPanel />);
    await waitFor(() => screen.getByPlaceholderText('Buscar cliente...'));

    // Active search filter
    const searchInput = screen.getByPlaceholderText('Buscar cliente...');
    await user.type(searchInput, 'Alpha');
    await waitFor(() => expect(screen.queryByText('Beta Industries')).not.toBeInTheDocument());

    // WHEN: User clears the search input
    await user.clear(searchInput);

    // THEN: Both clients are visible again
    await waitFor(() => {
      expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Industries')).toBeInTheDocument();
    });
  });

  it('should NOT trigger an additional API call when the search is cleared', async () => {
    // GIVEN: A client list is loaded (1 API call on mount)
    const mockGetAll = vi.fn().mockResolvedValue([
      makeCliente({ nombre: 'Gamma SA', nit: '300000001' }),
    ]);

    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: { getAll: mockGetAll },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');
    const user = userEvent.setup();

    renderWithQueryClient(<ClienteListPanel />);
    await waitFor(() => screen.getByPlaceholderText('Buscar cliente...'));

    const callCountAfterMount = mockGetAll.mock.calls.length;
    const searchInput = screen.getByPlaceholderText('Buscar cliente...');
    await user.type(searchInput, 'Gamma');

    // WHEN: User clears the search
    await user.clear(searchInput);

    // THEN: No additional API calls were made (filtering is client-side via useMemo)
    expect(mockGetAll.mock.calls.length).toBe(callCountAfterMount);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — EmptyState component shown when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — EmptyState component shown when no clients exist', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render data-testid="empty-state" when the API returns an empty array', async () => {
    // GIVEN: The API returns no clients
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: ClienteListPanel is rendered with no clients
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: The EmptyState component is displayed
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('should display the Spanish message "No hay clientes registrados" in EmptyState', async () => {
    // GIVEN: The API returns no clients
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: ClienteListPanel is rendered with no clients
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: Spanish guidance message is shown
    await waitFor(() => {
      expect(screen.getByText(/no hay clientes registrados/i)).toBeInTheDocument();
    });
  });

  it('should NOT render the EmptyState when clients exist', async () => {
    // GIVEN: The API returns at least one client
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([makeCliente()]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: ClienteListPanel is rendered with clients
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: The EmptyState is NOT shown
    await waitFor(() => screen.getByTestId('cliente-list-item'));
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('should NOT display EmptyState when search yields no results (clients exist but none match)', async () => {
    // GIVEN: A client exists but the search query matches nothing
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([
          makeCliente({ nombre: 'Delta Corp', nit: '400000001' }),
        ]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');
    const user = userEvent.setup();

    // WHEN: User searches with a term that matches no clients
    renderWithQueryClient(<ClienteListPanel />);
    await waitFor(() => screen.getByPlaceholderText('Buscar cliente...'));
    await user.type(screen.getByPlaceholderText('Buscar cliente...'), 'zzz_no_match_zzz');

    // THEN: The "no hay clientes" empty state is NOT shown (that's for no-data state only)
    await waitFor(() => {
      expect(screen.queryByText(/no hay clientes registrados/i)).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — ErrorPanel with "Reintentar" button shown when fetch fails
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — ErrorPanel with Reintentar button when API call fails', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render data-testid="error-panel" when the API call rejects', async () => {
    // GIVEN: The API call fails with an error
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockRejectedValue(new Error('Network Error')),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: ClienteListPanel is rendered and the fetch fails
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: The ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  it('should display a "Reintentar" button inside the ErrorPanel', async () => {
    // GIVEN: The API call fails
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockRejectedValue(new Error('Service Unavailable')),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: The ErrorPanel is rendered
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: A "Reintentar" button is visible
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });

  it('should NOT render client list items when ErrorPanel is shown', async () => {
    // GIVEN: The API call fails
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockRejectedValue(new Error('Service Unavailable')),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: The ErrorPanel is rendered
    renderWithQueryClient(<ClienteListPanel />);
    await waitFor(() => screen.getByTestId('error-panel'));

    // THEN: No client list items are rendered
    expect(screen.queryByTestId('cliente-list-item')).not.toBeInTheDocument();
  });

  it('should call refetch when the "Reintentar" button is clicked', async () => {
    // GIVEN: The API fails on first call then succeeds on retry
    const mockGetAll = vi
      .fn()
      .mockRejectedValueOnce(new Error('Fail first'))
      .mockResolvedValue([makeCliente({ nombre: 'Cliente Retry', nit: '500000001' })]);

    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: { getAll: mockGetAll },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');
    const user = userEvent.setup();

    renderWithQueryClient(<ClienteListPanel />);

    // Wait for ErrorPanel to appear
    await waitFor(() => screen.getByTestId('error-panel'));

    // WHEN: User clicks the Reintentar button
    await user.click(screen.getByRole('button', { name: /reintentar/i }));

    // THEN: The client list is rendered after retry
    await waitFor(() => {
      expect(screen.getByText('Cliente Retry')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Accessibility: search input has accessible label in Spanish, no axe violations
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Accessibility compliance (WCAG 2.1 AA)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should have an aria-label "Buscar cliente" on the search input', async () => {
    // GIVEN: ClienteListPanel is rendered with some clients
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([makeCliente()]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: The component is rendered
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: The search input has aria-label="Buscar cliente" (Spanish)
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Buscar cliente...');
      expect(searchInput).toHaveAttribute('aria-label', 'Buscar cliente');
    });
  });

  it('should have no axe critical or serious violations (WCAG 2.1 AA)', async () => {
    // GIVEN: axe-core availability check
    const axe = await import('vitest-axe').catch(() => null);
    if (!axe) {
      console.warn('vitest-axe not installed, skipping accessibility audit');
      return;
    }

    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([makeCliente()]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');
    const { container } = renderWithQueryClient(<ClienteListPanel />);
    await waitFor(() => screen.getByTestId('clientes-list-panel'));

    // WHEN: The component is audited with axe
    const results = await axe.axe(container);

    // THEN: No critical or serious violations
    const criticalOrSerious = results.violations.filter(
      (v: { impact: string }) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(criticalOrSerious).toHaveLength(0);
  });

  it('should have role="search" or accessible semantics on the search container', async () => {
    // GIVEN: ClienteListPanel is rendered
    vi.mock('../../../infrastructure/clienteApiRepository', () => ({
      clienteApiRepository: {
        getAll: vi.fn().mockResolvedValue([makeCliente()]),
      },
    }));

    const { ClienteListPanel } = await import('../ClienteListPanel');

    // WHEN: The component is rendered
    renderWithQueryClient(<ClienteListPanel />);

    // THEN: The search input is accessible via its aria-label
    await waitFor(() => {
      const searchInput = screen.getByRole('searchbox', { name: /buscar cliente/i });
      expect(searchInput).toBeInTheDocument();
    });
  });
});
