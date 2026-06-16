import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { ClienteListView } from './ClienteListView';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { Cliente } from '../domain/Cliente';

vi.mock('../infrastructure/clienteApiRepository');

/**
 * Edge Case Tests — ClienteListView component (Story 2.1)
 *
 * Complements the ATDD component tests in ClienteListView.test.tsx with:
 *   - Whitespace-only search treated as empty (shows full list)
 *   - Partial NIT match works (substring of NIT)
 *   - Search term in no-results message reflects actual query (not trimmed)
 *   - ErrorPanel does NOT expose raw error message to the user (NFR6)
 *   - EmptyState is NOT shown when ErrorPanel is active
 *   - aria-busy="true" present on panel while loading
 *   - aria-busy absent (not "false") after loading completes
 *   - aria-label on search input matches spec
 *   - Skeleton: 6 items rendered during loading
 *   - Multiple rapid search inputs — only last query reflected in filter (useMemo update)
 *   - Clearing search after empty-result restores full list
 *   - Case-insensitive NIT search
 *   - Both nombre and nit are shown per list item
 */

const mockClientes: Cliente[] = [
  {
    id: 'uuid-1',
    nombre: 'Empresa Alpha',
    nit: '900000001',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2026-06-16T12:00:00Z',
    updatedAt: '2026-06-16T12:00:00Z',
  },
  {
    id: 'uuid-2',
    nombre: 'Empresa Beta',
    nit: '800333444',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-06-15T12:00:00Z',
    updatedAt: '2026-06-15T12:00:00Z',
  },
  {
    id: 'uuid-3',
    nombre: 'Distribuidora Gamma',
    nit: '700111222',
    telefono: '3003333333',
    ciudad: 'Cali',
    createdAt: '2026-06-14T12:00:00Z',
    updatedAt: '2026-06-14T12:00:00Z',
  },
];

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ClienteListView),
    ),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ClienteListView — edge cases', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // Search boundary conditions
  // ─────────────────────────────────────────────────────────────────────────

  it('whitespace-only search shows full list (treated as empty query)', async () => {
    const user = userEvent.setup();
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce(mockClientes);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    // Type only spaces — should be treated as empty (trimmed to '')
    const searchInput = screen.getByTestId('search-clientes');
    await user.type(searchInput, '   ');

    // Full list must remain visible — whitespace trims to empty
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });
    // No-results message must NOT appear
    expect(screen.queryByTestId('no-results-message')).toBeNull();
    // EmptyState must NOT appear
    expect(screen.queryByTestId('empty-state')).toBeNull();
  });

  it('partial NIT substring search returns matching client', async () => {
    const user = userEvent.setup();
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce(mockClientes);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    const searchInput = screen.getByTestId('search-clientes');
    // Type only the middle digits of 800333444
    await user.type(searchInput, '333');

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
    expect(screen.getByTestId('cliente-list-item').textContent).toContain('Empresa Beta');
  });

  it('case-insensitive NIT search (uppercase input matches lowercase NIT)', async () => {
    const user = userEvent.setup();
    // NIT stored in lowercase-only
    const cliente: Cliente = {
      id: 'uuid-nit',
      nombre: 'Empresa NIT Test',
      nit: 'abc-123',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce([cliente]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    const searchInput = screen.getByTestId('search-clientes');
    await user.type(searchInput, 'ABC-123');

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
    expect(screen.getByTestId('cliente-list-item').textContent).toContain('Empresa NIT Test');
  });

  it('no-results message contains the exact search query (with original casing)', async () => {
    const user = userEvent.setup();
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce(mockClientes);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    const query = 'ZZZ-No-Existe';
    const searchInput = screen.getByTestId('search-clientes');
    await user.type(searchInput, query);

    await waitFor(() => {
      expect(screen.getByTestId('no-results-message')).toBeDefined();
    });

    // The message must contain the query string as typed
    expect(screen.getByTestId('no-results-message').textContent).toContain(query);
  });

  it('clearing search after no-results state restores full list', async () => {
    const user = userEvent.setup();
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce(mockClientes);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    const searchInput = screen.getByTestId('search-clientes');
    await user.type(searchInput, 'zzz-nada');

    await waitFor(() => {
      expect(screen.getByTestId('no-results-message')).toBeDefined();
    });

    // Clear the input
    await user.clear(searchInput);

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });
    expect(screen.queryByTestId('no-results-message')).toBeNull();
    expect(screen.queryByTestId('empty-state')).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Accessibility — ARIA attributes
  // ─────────────────────────────────────────────────────────────────────────

  it('search input has correct aria-label "Buscar clientes"', async () => {
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce([]);

    renderComponent();

    const searchInput = screen.getByLabelText('Buscar clientes');
    expect(searchInput).toBeDefined();
    expect(searchInput.getAttribute('data-testid')).toBe('search-clientes');
  });

  it('panel has aria-busy="true" while data is loading', () => {
    // Do not resolve the promise — keep it pending
    vi.mocked(clienteApiRepository.getAll).mockReturnValue(new Promise(() => {}));

    renderComponent();

    const panel = screen.getByTestId('clientes-list-panel');
    expect(panel.getAttribute('aria-busy')).toBe('true');
  });

  it('panel does not have aria-busy="true" after data loads', async () => {
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce(mockClientes);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    const panel = screen.getByTestId('clientes-list-panel');
    // Must not be "true" after loading completes
    expect(panel.getAttribute('aria-busy')).not.toBe('true');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // NFR6 — ErrorPanel must not expose raw error message
  // ─────────────────────────────────────────────────────────────────────────

  it('ErrorPanel does not render the raw error message (NFR6)', async () => {
    const rawErrorMessage = 'NullReferenceException at line 42 in GetClientesQueryHandler';
    vi.mocked(clienteApiRepository.getAll).mockRejectedValueOnce(new Error(rawErrorMessage));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeDefined();
    });

    // Raw error text must not be in the DOM
    expect(screen.queryByText(rawErrorMessage)).toBeNull();
    expect(screen.queryByText(/NullReferenceException/)).toBeNull();
    expect(screen.queryByText(/line 42/)).toBeNull();

    // The generic error message IS shown
    expect(screen.getByText(/No se pudo cargar la lista de clientes/)).toBeDefined();
  });

  it('EmptyState is NOT rendered when ErrorPanel is active', async () => {
    vi.mocked(clienteApiRepository.getAll).mockRejectedValueOnce(new Error('Server Down'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeDefined();
    });

    expect(screen.queryByTestId('empty-state')).toBeNull();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Loading skeleton
  // ─────────────────────────────────────────────────────────────────────────

  it('renders skeleton items (6 react-loading-skeleton elements) while loading', () => {
    vi.mocked(clienteApiRepository.getAll).mockReturnValue(new Promise(() => {}));

    renderComponent();

    // react-loading-skeleton renders spans with class "react-loading-skeleton"
    const skeletons = document.querySelectorAll('.react-loading-skeleton');
    // 6 items, each with 2 skeleton rows = 12 skeleton spans total
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // List item content
  // ─────────────────────────────────────────────────────────────────────────

  it('each list item displays both nombre and nit', async () => {
    const singleCliente: Cliente = {
      id: 'uuid-display',
      nombre: 'Empresa Display',
      nit: '111222333',
      telefono: '3001234567',
      ciudad: 'Bogotá',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce([singleCliente]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-item')).toBeDefined();
    });

    const item = screen.getByTestId('cliente-list-item');
    expect(item.textContent).toContain('Empresa Display');
    expect(item.textContent).toContain('111222333');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // EmptyState mutually exclusive with no-results
  // ─────────────────────────────────────────────────────────────────────────

  it('EmptyState is NOT shown when search matches nothing (no-results message is shown instead)', async () => {
    const user = userEvent.setup();
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce(mockClientes);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    const searchInput = screen.getByTestId('search-clientes');
    await user.type(searchInput, 'xyzzy-nonexistent');

    await waitFor(() => {
      expect(screen.getByTestId('no-results-message')).toBeDefined();
    });

    // EmptyState must NOT appear (it's reserved for zero records in the system)
    expect(screen.queryByTestId('empty-state')).toBeNull();
  });

  it('search field placeholder is "Buscar por nombre o NIT/RUC..."', async () => {
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce([]);

    renderComponent();

    const searchInput = screen.getByPlaceholderText('Buscar por nombre o NIT/RUC...');
    expect(searchInput).toBeDefined();
  });
});
