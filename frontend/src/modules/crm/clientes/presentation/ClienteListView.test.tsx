import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { ClienteListView } from './ClienteListView';
import { clienteApiRepository } from '../infrastructure/clienteApiRepository';
import type { Cliente } from '../domain/Cliente';

vi.mock('../infrastructure/clienteApiRepository');

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
    nit: '900000002',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-06-15T12:00:00Z',
    updatedAt: '2026-06-15T12:00:00Z',
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
      createElement(ClienteListView)
    )
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ClienteListView', () => {
  it('renders the panel with data-testid="clientes-list-panel"', async () => {
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce(mockClientes);

    renderComponent();

    const panel = screen.getByTestId('clientes-list-panel');
    expect(panel).toBeDefined();
  });

  it('renders list items when data is returned', async () => {
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce(mockClientes);

    renderComponent();

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(2);
    });
    expect(screen.getAllByTestId('cliente-list-item')[0].textContent).toContain('Empresa Alpha');
  });

  it('renders EmptyState when API returns empty array', async () => {
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeDefined();
    });
    expect(screen.getByTestId('empty-state').textContent).toContain(
      'No hay clientes registrados. Crea el primero.'
    );
  });

  it('renders ErrorPanel when fetch fails', async () => {
    vi.mocked(clienteApiRepository.getAll).mockRejectedValueOnce(new Error('Server Error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeDefined();
    });
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeDefined();
  });

  it('filters list by search input', async () => {
    const user = userEvent.setup();
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce(mockClientes);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByTestId('search-clientes');
    await user.type(searchInput, 'Alpha');

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });
    expect(screen.getByTestId('cliente-list-item').textContent).toContain('Empresa Alpha');
  });

  it('shows no-results-message when search matches nothing', async () => {
    const user = userEvent.setup();
    vi.mocked(clienteApiRepository.getAll).mockResolvedValueOnce(mockClientes);

    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByTestId('search-clientes');
    await user.type(searchInput, 'zzz-no-existe');

    await waitFor(() => {
      expect(screen.getByTestId('no-results-message')).toBeDefined();
    });
    expect(screen.queryByTestId('empty-state')).toBeNull();
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});
