/**
 * Integration Tests — Story 2.6: ClienteListView Sort Integration
 * RED PHASE — Tests are intentionally FAILING until implementation is complete.
 *
 * Framework: Vitest + React Testing Library + MSW
 *
 * Acceptance Criteria covered:
 *   AC1 — SortControl rendered in the list view; "Nombre A→Z" reorders list ascending
 *   AC2 — "Nombre Z→A" reorders list descending
 *   AC3 — "Más reciente" orders by createdAt descending
 *   AC4 — "Más antiguo" orders by createdAt ascending
 *   AC5 — Search filter and sort coexist; sort does not clear search input
 *   AC6 — Default sort is "Más reciente" on initial render
 *
 * Required implementation:
 *   - frontend/src/shared/components/SortControl.tsx
 *   - frontend/src/modules/crm/clientes/application/useSortClientes.ts
 *   - frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx (updated)
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createRouter,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
} from '@tanstack/react-router';
import { createElement } from 'react';
import { ClienteListView } from './ClienteListView';
import type { Cliente } from '../domain/Cliente';

// ─────────────────────────────────────────────────────────────────────────────
// Mock siesa-ui-kit (same mock as existing ClienteListView.test.tsx)
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('siesa-ui-kit', () => ({
  Button: ({
    children,
    onClick,
    htmlType,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    htmlType?: string;
    disabled?: boolean;
    [key: string]: unknown;
  }) =>
    createElement('button', { onClick, type: htmlType ?? 'button', disabled, ...props }, children),
  AlertDialog: ({
    isOpen,
    title,
    description,
    onCancel,
    showCloseButton,
  }: {
    isOpen?: boolean;
    title?: string;
    description?: React.ReactNode;
    onCancel?: () => void;
    showCloseButton?: boolean;
    [key: string]: unknown;
  }) => {
    if (!isOpen) return null;
    return createElement(
      'div',
      { role: 'dialog', 'aria-label': title },
      showCloseButton &&
        createElement('button', { onClick: onCancel, 'aria-label': 'Cerrar' }, 'X'),
      description,
    );
  },
  Input: ({
    label,
    id,
    errorMessage,
    error: _error,
    ...props
  }: {
    label?: string;
    id?: string;
    errorMessage?: string;
    error?: boolean;
    [key: string]: unknown;
  }) =>
    createElement(
      'div',
      null,
      label && createElement('label', { htmlFor: id }, label),
      createElement('input', { id, ...props }),
      errorMessage && createElement('p', { role: 'alert' }, errorMessage),
    ),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Test data: clients with deterministic names and dates for sort assertions
// ─────────────────────────────────────────────────────────────────────────────

const mockClientes: Cliente[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Zeta Corp',
    nit: '900111111-1',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2024-01-15T00:00:00Z',   // oldest
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nombre: 'Alfa Corp',
    nit: '900222222-2',
    telefono: '3002222222',
    ciudad: 'Medellín',
    createdAt: '2026-05-20T00:00:00Z',   // newest
    updatedAt: '2026-05-20T00:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nombre: 'Beta SA',
    nit: '900333333-3',
    telefono: '3003333333',
    ciudad: 'Cali',
    createdAt: '2025-03-10T00:00:00Z',   // middle
    updatedAt: '2025-03-10T00:00:00Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MSW server
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('*/api/v1/clientes', () => HttpResponse.json(mockClientes)),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Render helper
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteListView(initialUrl = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: ClienteListView,
  });
  const clienteDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/clientes/$clienteId',
    component: () => null,
  });

  const routeTree = rootRoute.addChildren([indexRoute, clienteDetailRoute]);
  const memoryHistory = createMemoryHistory({ initialEntries: [initialUrl] });
  const router = createRouter({ routeTree, history: memoryHistory });

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RouterProvider, { router }),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — SortControl is present and default is "Más reciente"
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — SortControl renders with default "Más reciente" (fecha-desc)', () => {
  it('should render the SortControl component in the client list view', async () => {
    // GIVEN: Clients are loaded
    renderClienteListView();

    // WHEN: Data loads
    await waitFor(() => {
      expect(screen.getByText('Alfa Corp')).toBeInTheDocument();
    });

    // THEN: SortControl is present
    expect(screen.getByTestId('sort-control')).toBeInTheDocument();
  });

  it('should have "fecha-desc" as the default selected sort value', async () => {
    // GIVEN: Clients are loaded
    renderClienteListView();

    // WHEN: Data loads
    await waitFor(() => {
      expect(screen.getByText('Alfa Corp')).toBeInTheDocument();
    });

    // THEN: SortControl default is 'fecha-desc'
    const sortControl = screen.getByTestId('sort-control') as HTMLSelectElement;
    expect(sortControl.value).toBe('fecha-desc');
  });

  it('should display clients ordered by newest createdAt first on initial load', async () => {
    // GIVEN: Three clients with different dates (Alfa=newest, Beta=middle, Zeta=oldest)
    renderClienteListView();

    // WHEN: Data loads
    await waitFor(() => {
      expect(screen.getByText('Alfa Corp')).toBeInTheDocument();
    });

    // THEN: Alfa Corp (newest, 2026) appears before Beta SA (2025) appears before Zeta Corp (oldest, 2024)
    const items = screen.getAllByRole('option'); // listbox items with role="option"
    const nombres = items.map((el) => el.textContent ?? '');
    const alfaIdx  = nombres.findIndex((n) => n.includes('Alfa Corp'));
    const betaIdx  = nombres.findIndex((n) => n.includes('Beta SA'));
    const zetaIdx  = nombres.findIndex((n) => n.includes('Zeta Corp'));
    expect(alfaIdx).toBeLessThan(betaIdx);
    expect(betaIdx).toBeLessThan(zetaIdx);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — "Nombre A→Z" reorders list ascending
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — Changing sort to "Nombre A→Z" reorders list alphabetically ascending', () => {
  it('should reorder list A→Z when "nombre-asc" is selected', async () => {
    // GIVEN: Clients loaded (default order: newest first = Alfa, Beta, Zeta)
    renderClienteListView();
    await waitFor(() => {
      expect(screen.getByText('Alfa Corp')).toBeInTheDocument();
    });

    // WHEN: User selects "Nombre A→Z"
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    // THEN: Alfa Corp appears before Beta SA, Beta SA before Zeta Corp
    const items = screen.getAllByRole('option');
    const nombres = items.map((el) => el.textContent ?? '');
    const alfaIdx  = nombres.findIndex((n) => n.includes('Alfa Corp'));
    const betaIdx  = nombres.findIndex((n) => n.includes('Beta SA'));
    const zetaIdx  = nombres.findIndex((n) => n.includes('Zeta Corp'));
    expect(alfaIdx).toBeLessThan(betaIdx);
    expect(betaIdx).toBeLessThan(zetaIdx);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — "Nombre Z→A" reorders list descending
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Changing sort to "Nombre Z→A" reorders list alphabetically descending', () => {
  it('should reorder list Z→A when "nombre-desc" is selected', async () => {
    // GIVEN: Clients loaded
    renderClienteListView();
    await waitFor(() => {
      expect(screen.getByText('Zeta Corp')).toBeInTheDocument();
    });

    // WHEN: User selects "Nombre Z→A"
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-desc' } });

    // THEN: Zeta Corp appears before Beta SA, Beta SA before Alfa Corp
    const items = screen.getAllByRole('option');
    const nombres = items.map((el) => el.textContent ?? '');
    const alfaIdx  = nombres.findIndex((n) => n.includes('Alfa Corp'));
    const betaIdx  = nombres.findIndex((n) => n.includes('Beta SA'));
    const zetaIdx  = nombres.findIndex((n) => n.includes('Zeta Corp'));
    expect(zetaIdx).toBeLessThan(betaIdx);
    expect(betaIdx).toBeLessThan(alfaIdx);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — "Más reciente" orders by createdAt descending
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — "Más reciente" (fecha-desc) orders by newest first', () => {
  it('should restore newest-first order when switching back to "fecha-desc"', async () => {
    // GIVEN: Clients loaded, sort changed to nombre-asc
    renderClienteListView();
    await waitFor(() => expect(screen.getByText('Alfa Corp')).toBeInTheDocument());

    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    // WHEN: User switches back to "Más reciente"
    fireEvent.change(sortControl, { target: { value: 'fecha-desc' } });

    // THEN: Alfa Corp (2026) appears before Beta SA (2025) before Zeta Corp (2024)
    const items = screen.getAllByRole('option');
    const nombres = items.map((el) => el.textContent ?? '');
    const alfaIdx  = nombres.findIndex((n) => n.includes('Alfa Corp'));
    const betaIdx  = nombres.findIndex((n) => n.includes('Beta SA'));
    const zetaIdx  = nombres.findIndex((n) => n.includes('Zeta Corp'));
    expect(alfaIdx).toBeLessThan(betaIdx);
    expect(betaIdx).toBeLessThan(zetaIdx);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — "Más antiguo" orders by createdAt ascending
// ─────────────────────────────────────────────────────────────────────────────

describe('AC4 — "Más antiguo" (fecha-asc) orders by oldest first', () => {
  it('should reorder list with oldest createdAt first when "fecha-asc" is selected', async () => {
    // GIVEN: Clients loaded (default fecha-desc)
    renderClienteListView();
    await waitFor(() => expect(screen.getByText('Zeta Corp')).toBeInTheDocument());

    // WHEN: User selects "Más antiguo"
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'fecha-asc' } });

    // THEN: Zeta Corp (2024, oldest) appears before Beta SA (2025) before Alfa Corp (2026)
    const items = screen.getAllByRole('option');
    const nombres = items.map((el) => el.textContent ?? '');
    const alfaIdx  = nombres.findIndex((n) => n.includes('Alfa Corp'));
    const betaIdx  = nombres.findIndex((n) => n.includes('Beta SA'));
    const zetaIdx  = nombres.findIndex((n) => n.includes('Zeta Corp'));
    expect(zetaIdx).toBeLessThan(betaIdx);
    expect(betaIdx).toBeLessThan(alfaIdx);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Search filter and sort coexist
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — Search filter and sort coexist', () => {
  it('should apply sort to the already-filtered result set when search is active', async () => {
    // GIVEN: Clients loaded with search "Corp" (matches Alfa Corp and Zeta Corp)
    renderClienteListView();
    await waitFor(() => expect(screen.getByText('Alfa Corp')).toBeInTheDocument());

    const searchInput = screen.getByTestId('client-search-input');
    fireEvent.change(searchInput, { target: { value: 'Corp' } });

    // Beta SA should be filtered out
    await waitFor(() => {
      expect(screen.queryByText('Beta SA')).not.toBeInTheDocument();
    });

    // WHEN: User selects "Nombre A→Z" sort
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    // THEN: Both Corp clients are visible, Alfa before Zeta
    const items = screen.getAllByRole('option');
    const nombres = items.map((el) => el.textContent ?? '');
    const alfaIdx = nombres.findIndex((n) => n.includes('Alfa Corp'));
    const zetaIdx = nombres.findIndex((n) => n.includes('Zeta Corp'));
    expect(alfaIdx).toBeLessThan(zetaIdx);
    // Beta SA is still absent
    expect(screen.queryByText('Beta SA')).not.toBeInTheDocument();
  });

  it('should NOT clear the search input value when sort option changes', async () => {
    // GIVEN: Search is active
    renderClienteListView();
    await waitFor(() => expect(screen.getByText('Alfa Corp')).toBeInTheDocument());

    const searchInput = screen.getByTestId('client-search-input') as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Corp' } });
    expect(searchInput.value).toBe('Corp');

    // WHEN: Sort is changed
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-desc' } });

    // THEN: Search input value is preserved
    expect(searchInput.value).toBe('Corp');
  });

  it('should display the correct number of visible items when sort and search coexist', async () => {
    // GIVEN: Clients loaded
    renderClienteListView();
    await waitFor(() => expect(screen.getByText('Alfa Corp')).toBeInTheDocument());

    // Apply search filter "Corp" — should yield 2 results (Alfa Corp, Zeta Corp)
    const searchInput = screen.getByTestId('client-search-input');
    fireEvent.change(searchInput, { target: { value: 'Corp' } });

    // WHEN: Sort is applied on top
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    // THEN: Exactly 2 items visible (not 3)
    await waitFor(() => {
      const visibleItems = screen.getAllByRole('option');
      expect(visibleItems).toHaveLength(2);
    });
  });
});
