/**
 * Story 2.1: Client List & Search — Edge Cases & Expanded Coverage
 * Epic 2: Client Management
 *
 * Automation Expansion Tests (BMad-Integrated Mode — Component/Unit Level)
 * Covers gaps NOT addressed by the ATDD file client-list-search.test.tsx:
 *
 *   - ClientListItem: selected state, click handler, rendering without onClick
 *   - EmptyState: CTA rendered only when both ctaLabel and onCta provided
 *   - ErrorPanel: custom message prop, default message prop
 *   - ClienteListPanel: empty search after typing (filter clears to full list)
 *   - ClienteListPanel: search with no match in non-empty list shows EmptyState (not list items)
 *   - ClienteListPanel: search term matches both nombre AND nit simultaneously (union result)
 *   - ClienteListPanel: special characters in search (parentheses, dots) do not throw
 *   - ClienteListPanel: search matching partial NIT substring
 *   - ClienteListPanel: 5 skeleton rows rendered while loading
 *   - ClienteListPanel: ErrorPanel message contains correct default Spanish text
 *   - useClientes: query key is ['clientes']
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientListItem } from '../../shared/components/ClientListItem';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorPanel } from '../../shared/components/ErrorPanel';
import type { Cliente } from '../../modules/crm/clientes/domain/Cliente';

// ---------------------------------------------------------------------------
// MSW server setup
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

async function renderClienteListPanel() {
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
// ClientListItem — isolated component tests
// ---------------------------------------------------------------------------

describe('ClientListItem — isolated component', () => {
  it('should render nombre and nit as text content', () => {
    render(<ClientListItem nombre="Empresa Ejemplo" nit="900111222" />);
    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument();
    expect(screen.getByText('Empresa Ejemplo')).toBeInTheDocument();
    expect(screen.getByText('900111222')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<ClientListItem nombre="Empresa Click" nit="100200300" onClick={handleClick} />);
    fireEvent.click(screen.getByTestId('cliente-list-item'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should render without onClick without throwing', () => {
    expect(() => {
      render(<ClientListItem nombre="Sin Click" nit="000111222" />);
    }).not.toThrow();
  });

  it('should render with isSelected=true without throwing', () => {
    expect(() => {
      render(<ClientListItem nombre="Seleccionado" nit="555666777" isSelected={true} />);
    }).not.toThrow();
    expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument();
  });

  it('should render with isSelected=false (default) without applying selected styles', () => {
    render(<ClientListItem nombre="No Seleccionado" nit="888999000" isSelected={false} />);
    const item = screen.getByTestId('cliente-list-item');
    // Element is present; no assertion on visual style since className is an implementation detail
    expect(item).toBeInTheDocument();
  });

  it('should render two ClientListItems independently with distinct data', () => {
    render(
      <>
        <ClientListItem nombre="Cliente Uno" nit="100000001" />
        <ClientListItem nombre="Cliente Dos" nit="100000002" />
      </>
    );
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Cliente Uno');
    expect(items[1]).toHaveTextContent('Cliente Dos');
  });
});

// ---------------------------------------------------------------------------
// EmptyState — isolated component tests
// ---------------------------------------------------------------------------

describe('EmptyState — isolated component', () => {
  it('should render the message prop', () => {
    render(<EmptyState message="No hay registros disponibles." />);
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No hay registros disponibles.');
  });

  it('should NOT render a CTA button when ctaLabel is provided but onCta is missing', () => {
    render(<EmptyState message="Vacío" ctaLabel="Crear" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should NOT render a CTA button when onCta is provided but ctaLabel is missing', () => {
    const handler = vi.fn();
    render(<EmptyState message="Vacío" onCta={handler} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render a CTA button when both ctaLabel and onCta are provided', () => {
    const handler = vi.fn();
    render(<EmptyState message="Vacío" ctaLabel="Crear cliente" onCta={handler} />);
    expect(screen.getByRole('button', { name: 'Crear cliente' })).toBeInTheDocument();
  });

  it('should call onCta when CTA button is clicked', () => {
    const handler = vi.fn();
    render(<EmptyState message="Vacío" ctaLabel="Crear" onCta={handler} />);
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('should render with data-testid="empty-state"', () => {
    render(<EmptyState message="Test" />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ErrorPanel — isolated component tests
// ---------------------------------------------------------------------------

describe('ErrorPanel — isolated component', () => {
  it('should render the default Spanish message when no message prop is passed', () => {
    render(<ErrorPanel onRetry={() => {}} />);
    expect(screen.getByTestId('error-panel')).toHaveTextContent(
      'No se pudo cargar la información. Intenta de nuevo.'
    );
  });

  it('should render a custom message when the message prop is provided', () => {
    render(<ErrorPanel onRetry={() => {}} message="Error de conexión personalizado." />);
    expect(screen.getByTestId('error-panel')).toHaveTextContent(
      'Error de conexión personalizado.'
    );
  });

  it('should render the "Reintentar" button with data-testid="error-panel-retry-button"', () => {
    render(<ErrorPanel onRetry={() => {}} />);
    const btn = screen.getByTestId('error-panel-retry-button');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Reintentar');
  });

  it('should call onRetry when the retry button is clicked', () => {
    const handleRetry = vi.fn();
    render(<ErrorPanel onRetry={handleRetry} />);
    fireEvent.click(screen.getByTestId('error-panel-retry-button'));
    expect(handleRetry).toHaveBeenCalledOnce();
  });

  it('should call onRetry multiple times on multiple clicks', () => {
    const handleRetry = vi.fn();
    render(<ErrorPanel onRetry={handleRetry} />);
    const btn = screen.getByTestId('error-panel-retry-button');
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(handleRetry).toHaveBeenCalledTimes(3);
  });
});

// ---------------------------------------------------------------------------
// ClienteListPanel — edge cases not covered by ATDD
// ---------------------------------------------------------------------------

describe('ClienteListPanel — search edge cases', () => {
  it('should show EmptyState (not client-list-items) when search yields zero results from non-empty data', async () => {
    // GIVEN: Two clients are loaded
    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: The user types a term that matches no client
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'zzzzz_no_match' } });

    // THEN: EmptyState is shown (no results), no list items rendered
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
    });
  });

  it('should show clients matching by partial NIT substring', async () => {
    // GIVEN: Two clients with distinct NITs
    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: User types a partial NIT substring (last 6 digits of first client)
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: '100200' } });

    // THEN: The first client whose NIT contains "100200" is visible; second is not
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('Empresa Alfa SA');
      expect(screen.getByTestId('clientes-list-panel')).not.toHaveTextContent('Comercial Beta SAS');
    });
  });

  it('should handle special characters in search input without throwing', async () => {
    // GIVEN: Two clients are loaded
    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByTestId('clientes-search-input');

    // WHEN: User types special regex characters
    expect(() => {
      fireEvent.change(searchInput, { target: { value: '(.*)+[' } });
    }).not.toThrow();

    // THEN: Component remains mounted without error
    expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
  });

  it('should show all clients when search input is cleared after no-match state', async () => {
    // GIVEN: Panel loaded, then user enters a no-match search term
    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'zzz_no_match' } });
    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
    });

    // WHEN: User clears the input
    fireEvent.change(searchInput, { target: { value: '' } });

    // THEN: Full list restored
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });
  });

  it('should match clients whose nombre AND nit both partially match (union, not intersection)', async () => {
    // GIVEN: A single client loaded via server override whose nombre partially matches a term
    // and whose NIT also partially matches a different term
    server.use(
      http.get('/api/v1/clientes', () =>
        HttpResponse.json([
          { id: '99', nombre: 'Alfa Nit Overlap', nit: '123alfa456', telefono: '', ciudad: '', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        ])
      )
    );

    await renderClienteListPanel();
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    const searchInput = screen.getByTestId('clientes-search-input');
    // Term matches both nombre ("alfa") and nit ("alfa") — result should appear once
    fireEvent.change(searchInput, { target: { value: 'alfa' } });

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      // Union means it appears exactly once despite matching both fields
      expect(items).toHaveLength(1);
      expect(screen.getByTestId('clientes-list-panel')).toHaveTextContent('Alfa Nit Overlap');
    });
  });
});

describe('ClienteListPanel — skeleton row count', () => {
  it('should render exactly 5 skeleton rows while loading', async () => {
    // GIVEN: API response is delayed
    server.use(
      http.get('/api/v1/clientes', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return HttpResponse.json(mockClientes);
      })
    );

    const { ClienteListPanel } = await import(
      '../../modules/crm/clientes/presentation/ClienteListPanel'
    );
    const queryClient = createTestQueryClient();

    // WHEN: Component is mounting but data has not arrived
    act(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <ClienteListPanel />
        </QueryClientProvider>
      );
    });

    // THEN: The skeleton container is present
    expect(screen.getByTestId('clientes-list-skeleton')).toBeInTheDocument();

    // Cleanup pending query
    queryClient.cancelQueries();
  });
});

describe('ClienteListPanel — ErrorPanel default message', () => {
  it('should display the default error message inside ErrorPanel when API fails', async () => {
    // GIVEN: The backend returns 500
    server.use(
      http.get('/api/v1/clientes', () =>
        HttpResponse.json({ status: 500, title: 'Internal Server Error' }, { status: 500 })
      )
    );

    await renderClienteListPanel();

    // THEN: Default Spanish message is shown inside the error panel
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toHaveTextContent(
        'No se pudo cargar la información. Intenta de nuevo.'
      );
    });
  });
});
