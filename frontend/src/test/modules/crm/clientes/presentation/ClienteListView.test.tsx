/**
 * Story 2.1: Client List & Search
 * Epic 2: Gestión de Clientes
 *
 * Component Tests — RED Phase (Vitest + React Testing Library)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — Left panel (280px) shows scrollable list with Nombre and NIT/RUC per item
 *   AC2 — Search field filters list in real time (case-insensitive)
 *   AC3 — Empty data → EmptyState component with Spanish guidance message
 *   AC4 — Fetch error → ErrorPanel with "Reintentar" button that triggers refetch
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

// ─── Test Data Factory ────────────────────────────────────────────────────────

let _counter = 1000;
function nextId() { return String(++_counter); }

function buildClienteFixture(overrides?: Partial<{
  id: string;
  nombre: string;
  nitRuc: string;
  telefono: string | null;
  ciudad: string | null;
  creadoEn: string;
}>) {
  const id = nextId();
  return {
    id: `aaaaaaaa-0000-0000-0000-${id.padStart(12, '0')}`,
    nombre: `Empresa Test ${id}`,
    nitRuc: `900${id.padStart(6, '0')}-1`,
    telefono: null,
    ciudad: null,
    creadoEn: '2026-01-10T08:00:00Z',
    ...overrides,
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock useClientes hook — tests control the returned state
vi.mock('@/modules/crm/clientes/application/useClientes', () => ({
  useClientes: vi.fn(),
}));

// Import the mocked module
import { useClientes } from '@/modules/crm/clientes/application/useClientes';
const mockUseClientes = vi.mocked(useClientes);

// Import the component under test
// This import will fail (RED phase) until the component is created
import { ClienteListView } from '@/modules/crm/clientes/presentation/ClienteListView';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Left panel with client list (Nombre + NIT/RUC per item)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — AC1: List panel with Nombre and NIT/RUC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the clientes-list-panel container', () => {
    // GIVEN: The hook returns 1 client and no errors
    const cliente = buildClienteFixture({ nombre: 'Empresa Ejemplo', nitRuc: '900111222-1' });
    mockUseClientes.mockReturnValue({
      clientes: [cliente],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: The list panel container is in the DOM
    expect(screen.getByTestId('clientes-list-panel')).toBeTruthy();
  });

  it('renders the search input field', () => {
    // GIVEN: The hook returns clients
    mockUseClientes.mockReturnValue({
      clientes: [buildClienteFixture()],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: The search input is present
    expect(screen.getByTestId('clientes-search-input')).toBeTruthy();
  });

  it('renders a ClienteListItem for each client returned by the hook', () => {
    // GIVEN: The hook returns 3 clients
    const clientes = [
      buildClienteFixture({ nombre: 'Empresa Uno' }),
      buildClienteFixture({ nombre: 'Empresa Dos' }),
      buildClienteFixture({ nombre: 'Empresa Tres' }),
    ];
    mockUseClientes.mockReturnValue({
      clientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: Three list items are rendered
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items).toHaveLength(3);
  });

  it('displays the nombre in each list item', () => {
    // GIVEN: One client with nombre "Industrias Beta"
    const cliente = buildClienteFixture({ nombre: 'Industrias Beta', nitRuc: '800200300-5' });
    mockUseClientes.mockReturnValue({
      clientes: [cliente],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: "Industrias Beta" is visible in the list item
    expect(screen.getByText('Industrias Beta')).toBeTruthy();
  });

  it('displays the nitRuc in each list item', () => {
    // GIVEN: One client with nitRuc "800200300-5"
    const cliente = buildClienteFixture({ nombre: 'Industrias Beta', nitRuc: '800200300-5' });
    mockUseClientes.mockReturnValue({
      clientes: [cliente],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: "800200300-5" is visible in the list item
    expect(screen.getByText('800200300-5')).toBeTruthy();
  });

  it('renders skeleton placeholders while data is loading', () => {
    // GIVEN: The hook is in loading state
    mockUseClientes.mockReturnValue({
      clientes: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: Skeleton placeholders are rendered (not client items)
    expect(screen.getByTestId('client-list-skeleton')).toBeTruthy();
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Real-time search filtering (case-insensitive, client-side)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — AC2: Real-time search filtering', () => {
  const clientes = [
    buildClienteFixture({ nombre: 'Empresa Alpha', nitRuc: '900100001-1' }),
    buildClienteFixture({ nombre: 'Beta Servicios', nitRuc: '900200002-2' }),
    buildClienteFixture({ nombre: 'Gamma Corp', nitRuc: '900300003-3' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClientes.mockReturnValue({
      clientes,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('shows all items when search input is empty', () => {
    // GIVEN: Three clients loaded, no search active
    render(<ClienteListView />);

    // WHEN: No text entered in search
    // THEN: All 3 items are visible
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
  });

  it('filters list by nombre when user types in search field', () => {
    // GIVEN: Three clients loaded
    render(<ClienteListView />);

    // WHEN: User types "Alpha" in the search field
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    // THEN: Only "Empresa Alpha" is shown (1 item)
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Empresa Alpha');
  });

  it('filters list by nitRuc when user types a NIT value', () => {
    // GIVEN: Three clients loaded
    render(<ClienteListView />);

    // WHEN: User types "900200002" (NIT of Beta Servicios)
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: '900200002' } });

    // THEN: Only "Beta Servicios" is shown
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Beta Servicios');
  });

  it('performs case-insensitive search', () => {
    // GIVEN: Three clients loaded; "Gamma Corp" exists
    render(<ClienteListView />);

    // WHEN: User types "gamma" (all lowercase)
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'gamma' } });

    // THEN: "Gamma Corp" is visible (case-insensitive match)
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('Gamma Corp');
  });

  it('restores full list when search field is cleared', () => {
    // GIVEN: A filter is active showing only 1 item
    render(<ClienteListView />);
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);

    // WHEN: User clears the search field
    fireEvent.change(searchInput, { target: { value: '' } });

    // THEN: All 3 clients are visible again
    expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
  });

  it('shows no-results EmptyState when search yields zero matches', () => {
    // GIVEN: Three clients loaded, none matching "xyz999"
    render(<ClienteListView />);

    // WHEN: User types a query that matches no client
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'xyz999' } });

    // THEN: EmptyState is shown (no matches found message)
    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — EmptyState when no clients exist
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — AC3: EmptyState with no clients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders EmptyState component when hook returns empty array', () => {
    // GIVEN: The hook returns an empty array
    mockUseClientes.mockReturnValue({
      clientes: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: EmptyState is visible
    expect(screen.getByTestId('empty-state')).toBeTruthy();
  });

  it('does NOT render list items when EmptyState is shown', () => {
    // GIVEN: Empty client list
    mockUseClientes.mockReturnValue({
      clientes: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: No cliente-list-item elements are rendered
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });

  it('displays a Spanish-language message guiding user to create first client', () => {
    // GIVEN: Empty client list
    mockUseClientes.mockReturnValue({
      clientes: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: EmptyState text contains Spanish guidance to create a client
    const emptyState = screen.getByTestId('empty-state');
    expect(emptyState.textContent?.toLowerCase()).toMatch(/registrado|crear|primer cliente|comenzar/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — ErrorPanel when backend is unavailable
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — AC4: ErrorPanel on fetch failure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ErrorPanel when hook returns isError=true', () => {
    // GIVEN: The hook reports an error state
    mockUseClientes.mockReturnValue({
      clientes: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: ErrorPanel is visible
    expect(screen.getByTestId('error-panel')).toBeTruthy();
  });

  it('does NOT render list items when ErrorPanel is displayed', () => {
    // GIVEN: Error state
    mockUseClientes.mockReturnValue({
      clientes: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: No list items are rendered alongside ErrorPanel
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });

  it('renders a "Reintentar" button inside ErrorPanel', () => {
    // GIVEN: Error state
    mockUseClientes.mockReturnValue({
      clientes: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });

    // WHEN: ClienteListView is rendered
    render(<ClienteListView />);

    // THEN: A button with text "Reintentar" is visible inside the ErrorPanel
    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    expect(retryButton).toBeTruthy();
  });

  it('calls refetch when "Reintentar" button is clicked', () => {
    // GIVEN: Error state with a mocked refetch function
    const mockRefetch = vi.fn();
    mockUseClientes.mockReturnValue({
      clientes: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    // WHEN: ClienteListView is rendered and user clicks "Reintentar"
    render(<ClienteListView />);
    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryButton);

    // THEN: refetch was called exactly once
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
