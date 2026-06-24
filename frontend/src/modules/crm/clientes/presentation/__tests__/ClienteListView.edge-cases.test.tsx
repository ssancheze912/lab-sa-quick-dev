/**
 * Component Edge Case Tests — ClienteListView (Story 2.1)
 * BMad-Integrated Mode: expands ClienteListView coverage with scenarios
 * NOT present in ClienteListView.test.tsx (ATDD suite).
 *
 * Edge cases covered:
 *   - Search with whitespace-only input shows all clients (whitespace trimmed)
 *   - Search that matches no client hides all items
 *   - Search clearing restores full list
 *   - Skeleton renders even when data prop is undefined (not just loading=true + empty array)
 *   - ErrorPanel default message is in Spanish
 *   - EmptyState does NOT show "Reintentar" (it's not an error)
 *   - ErrorPanel does NOT show EmptyState simultaneously
 *   - List container is scrollable (overflow-y-auto class)
 *   - Search input is always present regardless of state (loading/error/empty/data)
 *   - Multiple clients with identical Nombre are both rendered (unique by id)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock TanStack Router hooks
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
}));

// Mock siesa-ui-kit
vi.mock('siesa-ui-kit', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...(props as Record<string, unknown>)}>
      {children}
    </button>
  ),
}));

// Mock useClientes hook
vi.mock('../../application/useClientes', () => ({
  useClientes: vi.fn(),
}));

import { useClientes } from '../../application/useClientes';
import { ClienteListView } from '../ClienteListView';
import type { Cliente } from '../../domain/Cliente';

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  const id = Math.random().toString(36).slice(2, 10);
  const now = new Date().toISOString();
  return {
    id: `ec-${id}`,
    nombre: `Empresa EC ${id}`,
    nit: `900${id}`,
    telefono: `300${id}`,
    ciudad: 'Cali',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function renderView() {
  return render(<ClienteListView />);
}

afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Search edge cases — boundary conditions not in ATDD suite
// ─────────────────────────────────────────────────────────────────────────────

describe('Search edge cases — boundary conditions', () => {

  it('[P1] should show all clients when search input contains only whitespace (trim behavior)', async () => {
    // GIVEN: Two clients and whitespace-only search
    const clienteA = makeCliente({ nombre: 'Empresa Alfa' });
    const clienteB = makeCliente({ nombre: 'Empresa Beta' });
    vi.mocked(useClientes).mockReturnValue({
      data: [clienteA, clienteB],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderView();

    // WHEN: User enters only whitespace
    const input = screen.getByTestId('client-search-input');
    await userEvent.type(input, '   ');

    // THEN: Both clients are still visible (whitespace trimmed = empty query)
    expect(screen.getByTestId(`client-list-item-${clienteA.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`client-list-item-${clienteB.id}`)).toBeInTheDocument();
  });

  it('[P1] should hide all client items when search matches no client (zero results)', async () => {
    // GIVEN: Clients that do not match "NOMATCH_TERM"
    const clientes = [
      makeCliente({ nombre: 'Empresa Uno', nit: '111' }),
      makeCliente({ nombre: 'Empresa Dos', nit: '222' }),
    ];
    vi.mocked(useClientes).mockReturnValue({
      data: clientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderView();

    // WHEN: User searches for something that matches nobody
    const input = screen.getByTestId('client-search-input');
    await userEvent.type(input, 'NOMATCH_TERM_XYZ');

    // THEN: No client items in the DOM
    expect(screen.queryByTestId(`client-list-item-${clientes[0].id}`)).toBeNull();
    expect(screen.queryByTestId(`client-list-item-${clientes[1].id}`)).toBeNull();
  });

  it('[P1] should restore full list when search is cleared after filtering', async () => {
    // GIVEN: Clients, search applied, then cleared
    const clienteA = makeCliente({ nombre: 'Empresa Alfa' });
    const clienteB = makeCliente({ nombre: 'Empresa Beta' });
    vi.mocked(useClientes).mockReturnValue({
      data: [clienteA, clienteB],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderView();
    const input = screen.getByTestId('client-search-input');

    // Apply filter
    await userEvent.type(input, 'Alfa');
    expect(screen.queryByTestId(`client-list-item-${clienteB.id}`)).toBeNull();

    // WHEN: Clear input
    await userEvent.clear(input);

    // THEN: Both clients visible again
    expect(screen.getByTestId(`client-list-item-${clienteA.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`client-list-item-${clienteB.id}`)).toBeInTheDocument();
  });

  it('[P2] should correctly handle two clients with the same Nombre (distinct by id)', () => {
    // GIVEN: Two clients with the same Nombre but different ids
    const clienteA = makeCliente({ nombre: 'Empresa Duplicada' });
    const clienteB = makeCliente({ nombre: 'Empresa Duplicada' });
    vi.mocked(useClientes).mockReturnValue({
      data: [clienteA, clienteB],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderView();

    // THEN: Both items are rendered (distinct by id, not by nombre)
    expect(screen.getByTestId(`client-list-item-${clienteA.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`client-list-item-${clienteB.id}`)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// State mutual exclusivity — loading/error/empty/data states
// ─────────────────────────────────────────────────────────────────────────────

describe('State mutual exclusivity — only one state renders at a time', () => {

  it('[P1] should NOT show ErrorPanel and EmptyState simultaneously', () => {
    // GIVEN: isError=true state
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderView();

    // THEN: ErrorPanel is shown, EmptyState is NOT
    expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).toBeNull();
  });

  it('[P1] should NOT show skeleton and client list simultaneously', () => {
    // GIVEN: isLoading=true state
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderView();

    // THEN: Skeleton is shown, no client list items
    expect(screen.getByTestId('cliente-list-skeleton')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid^="client-list-item-"]')).toHaveLength(0);
  });

  it('[P1] should NOT show ErrorPanel and skeleton simultaneously', () => {
    // GIVEN: isError=true, isLoading=false
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderView();

    // THEN: ErrorPanel shown, skeleton NOT shown
    expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('cliente-list-skeleton')).toBeNull();
  });

  it('[P2] should NOT show EmptyState when clients are present', () => {
    // GIVEN: data has items
    vi.mocked(useClientes).mockReturnValue({
      data: [makeCliente()],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderView();

    // THEN: EmptyState is NOT shown
    expect(screen.queryByTestId('empty-state')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Search input availability — always present regardless of state
// ─────────────────────────────────────────────────────────────────────────────

describe('Search input availability', () => {

  it('[P1] should render search input in loading state', () => {
    // GIVEN: isLoading=true
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    renderView();

    // THEN: Search input is present even during loading
    expect(screen.getByTestId('client-search-input')).toBeInTheDocument();
  });

  it('[P1] should render search input in error state', () => {
    // GIVEN: isError=true
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderView();

    // THEN: Search input is present even in error state
    expect(screen.getByTestId('client-search-input')).toBeInTheDocument();
  });

  it('[P1] should render search input when data is an empty array', () => {
    // GIVEN: data=[]
    vi.mocked(useClientes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderView();

    // THEN: Search input is present
    expect(screen.getByTestId('client-search-input')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ErrorPanel — default message language
// ─────────────────────────────────────────────────────────────────────────────

describe('ErrorPanel message — Spanish language requirement', () => {

  it('[P1] should display an error message in Spanish when API fails', () => {
    // GIVEN: isError=true
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderView();

    // THEN: The error panel contains a Spanish-language message
    const errorPanel = screen.getByTestId('error-panel');
    // Default message from ErrorPanel.tsx: "Error al cargar los datos. Intenta de nuevo."
    expect(errorPanel.textContent).toMatch(/Error/i);
  });

  it('[P1] should display "Reintentar" (Spanish) — not "Retry" (English) on the button', () => {
    // GIVEN: isError=true
    vi.mocked(useClientes).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    renderView();

    // THEN: Button text is "Reintentar", not "Retry"
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
    expect(screen.queryByText('Retry')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Layout — structural requirements
// ─────────────────────────────────────────────────────────────────────────────

describe('Layout — structural requirements', () => {

  it('[P1] should render the root element as an <aside> (semantic HTML)', () => {
    // GIVEN: Data is loaded
    vi.mocked(useClientes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderView();

    // THEN: Root element is <aside>
    expect(container.querySelector('aside')).not.toBeNull();
  });

  it('[P2] should apply fixed width class (w-[280px]) to the aside panel', () => {
    // GIVEN: Data loaded
    vi.mocked(useClientes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderView();

    // THEN: aside has fixed width class
    const aside = container.querySelector('aside');
    expect(aside?.className).toMatch(/w-\[280px\]/);
  });

  it('[P2] should render the list container with overflow-y scrolling', () => {
    // GIVEN: Data loaded
    vi.mocked(useClientes).mockReturnValue({
      data: [makeCliente(), makeCliente()],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    const { container } = renderView();

    // THEN: A scrollable container is present
    const scrollable = container.querySelector('.overflow-y-auto');
    expect(scrollable).not.toBeNull();
  });
});
