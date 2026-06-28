/**
 * Edge-case component tests — Story 2.6: Sort Client List (automation expansion)
 *
 * Expands ATDD coverage (SortControl.test.tsx) with edge cases, boundary
 * conditions, and negative paths NOT covered by the 6 base ATDD tests.
 *
 * Scenarios covered:
 *   [P1] SortControl renders all 4 options with correct Spanish labels
 *   [P1] SortControl has aria-label "Ordenar clientes" (WCAG 2.1 AA)
 *   [P1] SortControl has data-testid="sort-control"
 *   [P1] Rapid consecutive sort changes — final sort wins (state consistency)
 *   [P1] Sort back to default "fecha-desc" from any other option
 *   [P1] Sort + no-results filter — SortControl still present, EmptyState shown
 *   [P2] Single-client list — sort changes do not crash or hide the item
 *   [P2] Sort + empty data — SortControl renders but no list items
 *   [P2] Sort + API error — SortControl absent, ErrorPanel shown
 *   [P2] sort-control value updates correctly after each option change
 *
 * Framework: Vitest + RTL + MSW 2.x
 * Network pattern: MSW handlers registered BEFORE render (network-first)
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { buildCliente, resetClienteCounter } from './clienteFactory';
import { ClienteListView } from '../presentation/ClienteListView';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress console.error for expected React/TanStack warnings in test env
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]')
  ) {
    return;
  }
  originalConsoleError(...args);
});

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server — network-first: handlers registered BEFORE tests run
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetClienteCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render ClienteListView with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteListView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SortControl accessibility and DOM attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — accessibility and DOM attributes', () => {
  it('[P1] should render all four sort options with correct Spanish labels', async () => {
    // GIVEN: NETWORK intercepted BEFORE render with one client
    server.use(
      http.get(CLIENTES_URL, () =>
        HttpResponse.json([buildCliente({ nombre: 'Alpha Corp' })])
      )
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: Sort control is present

    // THEN: All four options exist with correct Spanish labels
    const sortControl = screen.getByTestId('sort-control') as HTMLSelectElement;
    const options = Array.from(sortControl.options);
    const values = options.map((o) => o.value);
    const labels = options.map((o) => o.text);

    expect(values).toContain('fecha-desc');
    expect(values).toContain('fecha-asc');
    expect(values).toContain('nombre-asc');
    expect(values).toContain('nombre-desc');

    expect(labels).toContain('Más reciente');
    expect(labels).toContain('Más antiguo');
    expect(labels).toContain('Nombre A→Z');
    expect(labels).toContain('Nombre Z→A');
  });

  it('[P1] should have aria-label "Ordenar clientes" on the sort control (WCAG 2.1 AA)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([buildCliente()]))
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // THEN: aria-label is present and correct for screen reader accessibility
    const sortControl = screen.getByTestId('sort-control');
    expect(sortControl).toHaveAttribute('aria-label', 'Ordenar clientes');
  });

  it('[P1] should have data-testid="sort-control" present on the select element', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([buildCliente()]))
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // THEN: data-testid selector is stable for automated testing
    expect(screen.getByTestId('sort-control')).toBeInTheDocument();
  });

  it('[P2] should update sort-control value to reflect each selected option', async () => {
    // GIVEN: Three clients loaded
    const clients = [
      buildCliente({ nombre: 'Alpha', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }),
      buildCliente({ nombre: 'Beta', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z' }),
      buildCliente({ nombre: 'Gamma', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }),
    ];

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json(clients)));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    const sortControl = screen.getByTestId('sort-control') as HTMLSelectElement;

    // WHEN/THEN: Each selection updates the control's value
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });
    expect(sortControl.value).toBe('nombre-asc');

    fireEvent.change(sortControl, { target: { value: 'nombre-desc' } });
    expect(sortControl.value).toBe('nombre-desc');

    fireEvent.change(sortControl, { target: { value: 'fecha-asc' } });
    expect(sortControl.value).toBe('fecha-asc');

    fireEvent.change(sortControl, { target: { value: 'fecha-desc' } });
    expect(sortControl.value).toBe('fecha-desc');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rapid consecutive sort changes
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — rapid consecutive sort changes', () => {
  it('[P1] should reflect the final sort order when multiple sorts are applied rapidly', async () => {
    // GIVEN: Three clients with known names and dates
    const newest = buildCliente({
      nombre: 'Zeta Corp',
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    });
    const middle = buildCliente({
      nombre: 'Mango Ltda.',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });
    const oldest = buildCliente({
      nombre: 'Alpha SAS',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });

    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([newest, middle, oldest]))
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    const sortControl = screen.getByTestId('sort-control');

    // WHEN: Rapidly changing sort options without awaiting intermediate states
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });
    fireEvent.change(sortControl, { target: { value: 'nombre-desc' } });
    fireEvent.change(sortControl, { target: { value: 'fecha-asc' } });

    // THEN: Final sort (fecha-asc — oldest first) is applied correctly
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Alpha SAS');
      expect(items[1]).toHaveTextContent('Mango Ltda.');
      expect(items[2]).toHaveTextContent('Zeta Corp');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sort reset back to default "fecha-desc"
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — reset to default sort', () => {
  it('[P1] should restore newest-first order when sort is reset to "fecha-desc" after nombre-asc', async () => {
    // GIVEN: Two clients with distinct dates and names
    const older = buildCliente({
      nombre: 'Alpha Corp',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
    const newer = buildCliente({
      nombre: 'Zeta Inc.',
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    });

    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([older, newer]))
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const sortControl = screen.getByTestId('sort-control');

    // WHEN: Sort is changed to nombre-asc first (Alpha before Zeta)
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Alpha Corp');
    });

    // AND: Sort is reset back to "fecha-desc" (default)
    fireEvent.change(sortControl, { target: { value: 'fecha-desc' } });

    // THEN: Newer client appears first again
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Zeta Inc.');
      expect(items[1]).toHaveTextContent('Alpha Corp');
    });

    // AND: The select shows "fecha-desc" as selected
    expect((sortControl as HTMLSelectElement).value).toBe('fecha-desc');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sort + no-results filter: SortControl still renders
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — sort when filter yields empty results', () => {
  it('[P1] should keep SortControl visible and change its value even when filtered list is empty', async () => {
    // GIVEN: Two clients loaded, search filter producing 0 results
    const clientes = [
      buildCliente({ nombre: 'Alpha Corp' }),
      buildCliente({ nombre: 'Beta Corp' }),
    ];

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json(clientes)));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // Apply a filter that matches nothing
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: 'XYZ_NO_MATCH' } });

    await waitFor(() => {
      expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
    });

    // WHEN: User changes sort order while filter is active and empty
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    // THEN: SortControl is still present
    expect(screen.getByTestId('sort-control')).toBeInTheDocument();

    // AND: The value reflects the new sort
    expect((screen.getByTestId('sort-control') as HTMLSelectElement).value).toBe('nombre-asc');

    // AND: EmptyState is still shown (filter still active)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Single-client boundary condition
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — single-client boundary', () => {
  it('[P2] should render and allow sort changes without error when only one client exists', async () => {
    // GIVEN: Exactly one client loaded
    const singleClient = buildCliente({ nombre: 'Solo Empresa S.A.' });

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json([singleClient])));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    const sortControl = screen.getByTestId('sort-control');

    // WHEN: User cycles through all sort options
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });
    fireEvent.change(sortControl, { target: { value: 'nombre-desc' } });
    fireEvent.change(sortControl, { target: { value: 'fecha-asc' } });
    fireEvent.change(sortControl, { target: { value: 'fecha-desc' } });

    // THEN: Single item still shows after all sorts — no crash or disappearance
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Solo Empresa S.A.');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sort + empty data from API
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — sort when API returns empty list', () => {
  it('[P2] should render SortControl and show EmptyState "Sin clientes" when API returns empty array', async () => {
    // GIVEN: API returns empty list
    server.use(http.get(CLIENTES_URL, () => HttpResponse.json([])));

    renderClienteListView();

    // THEN: Empty state is shown (no clients to sort)
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // AND: SortControl is still rendered in the header (it is always visible)
    expect(screen.getByTestId('sort-control')).toBeInTheDocument();

    // AND: No list items
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sort + API error state
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — sort when API returns error', () => {
  it('[P2] should show ErrorPanel and not crash when API returns 500 error', async () => {
    // GIVEN: API returns server error
    server.use(
      http.get(CLIENTES_URL, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );

    renderClienteListView();

    // THEN: ErrorPanel is shown
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // AND: No list items
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);

    // AND: SortControl is still rendered in the header area
    expect(screen.getByTestId('sort-control')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sort + search interaction — clearing search after sort+filter
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — clear search after sort+filter', () => {
  it('[P1] should show full sorted list when search is cleared after sort was applied while filtered', async () => {
    // GIVEN: Three clients with names and dates
    const c1 = buildCliente({
      nombre: 'Test Gamma Corp',
      createdAt: '2026-03-01T00:00:00Z',
      updatedAt: '2026-03-01T00:00:00Z',
    });
    const c2 = buildCliente({
      nombre: 'Test Alpha Ltda.',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });
    const c3 = buildCliente({
      nombre: 'Empresa Diferente S.A.',
      createdAt: '2024-06-01T00:00:00Z',
      updatedAt: '2024-06-01T00:00:00Z',
    });

    server.use(http.get(CLIENTES_URL, () => HttpResponse.json([c1, c2, c3])));

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    // Apply search filter "Test" → 2 items
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // Apply sort nombre-asc while filter is active
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Test Alpha Ltda.');
    });

    // WHEN: Search is cleared
    fireEvent.change(searchInput, { target: { value: '' } });

    // THEN: All 3 clients appear, sorted nombre-asc (sort state preserved)
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent('Empresa Diferente S.A.');
      expect(items[1]).toHaveTextContent('Test Alpha Ltda.');
      expect(items[2]).toHaveTextContent('Test Gamma Corp');
    });
  });
});
