/**
 * ATDD Component Tests — Story 2.6: Sort Client List (RED phase)
 *
 * Tests FAIL until the following are implemented:
 *   - frontend/src/shared/components/SortControl.tsx
 *   - frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
 *     (sortOption state + SortControl wiring replacing hardcoded 'fecha-desc')
 *
 * Test IDs (from test-design-epic-2.md):
 *   TC-E2-2-6-CMP-P1-1 (P1) — Default sort on mount is "Más reciente" (fecha-desc)
 *   TC-E2-2-6-CMP-P1-2 (P1) — Select "nombre-asc" → list ordered alphabetically ascending
 *   TC-E2-2-6-CMP-P1-3 (P1) — Select "nombre-desc" → list ordered alphabetically descending
 *   TC-E2-2-6-CMP-P1-4 (P1) — Select "fecha-asc" → oldest client appears first
 *   TC-E2-2-6-CMP-P1-5 (P1) — Search "Test" then change sort → search input unchanged, list filtered+sorted
 *   TC-E2-2-6-CMP-P2-1 (P2) — Sort change does NOT trigger a new GET /api/v1/clientes request
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

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ClienteListView />
    </QueryClientProvider>
  );

  return { ...result, queryClient };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-6-CMP-P1-1 (P1) — Default sort on initial mount is "Más reciente"
//
// AC #6: When no sort preference has been set, the default sort order is
// "Más reciente" (fecha-desc) and the newest client appears first.
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — TC-E2-2-6-CMP-P1-1: default sort on mount', () => {
  it('should show SortControl with "Más reciente" selected by default on initial render', async () => {
    // GIVEN: NETWORK intercepted BEFORE render (network-first pattern)
    const oldest = buildCliente({
      nombre: 'Empresa Antigua',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    });
    const newest = buildCliente({
      nombre: 'Empresa Nueva',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });

    // CRITICAL: Route intercept BEFORE render
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([oldest, newest]))
    );

    renderClienteListView();

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: Page has loaded with no explicit sort selection

    // THEN: SortControl is present and shows "Más reciente" as the selected value
    const sortControl = screen.getByTestId('sort-control') as HTMLSelectElement;
    expect(sortControl).toBeInTheDocument();
    expect(sortControl.value).toBe('fecha-desc');

    // AND: The newest client appears first in the list
    const items = screen.getAllByTestId('cliente-list-item');
    expect(items[0]).toHaveTextContent('Empresa Nueva');
    expect(items[1]).toHaveTextContent('Empresa Antigua');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-6-CMP-P1-2 (P1) — Select "nombre-asc" → alphabetically ascending
//
// AC #1: When the user selects "Nombre A→Z" from the SortControl, the client
// list reorders alphabetically ascending by Nombre without a new API call.
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — TC-E2-2-6-CMP-P1-2: sort nombre-asc', () => {
  it('should reorder list alphabetically ascending when "nombre-asc" is selected', async () => {
    // GIVEN: NETWORK intercepted BEFORE render with clients in non-alphabetical order
    const clienteC = buildCliente({
      nombre: 'Zeta Corp',
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    });
    const clienteA = buildCliente({
      nombre: 'Alpha S.A.',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
    const clienteB = buildCliente({
      nombre: 'Mango Ltda.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    // CRITICAL: Route intercept BEFORE render
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([clienteC, clienteA, clienteB]))
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    // WHEN: User selects "Nombre A→Z" from SortControl
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    // THEN: List reorders alphabetically ascending (Alpha, Mango, Zeta)
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Alpha S.A.');
      expect(items[1]).toHaveTextContent('Mango Ltda.');
      expect(items[2]).toHaveTextContent('Zeta Corp');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-6-CMP-P1-3 (P1) — Select "nombre-desc" → alphabetically descending
//
// AC #2: When the user selects "Nombre Z→A" from the SortControl, the client
// list reorders alphabetically descending by Nombre without a new API call.
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — TC-E2-2-6-CMP-P1-3: sort nombre-desc', () => {
  it('should reorder list alphabetically descending when "nombre-desc" is selected', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const clienteA = buildCliente({
      nombre: 'Alpha S.A.',
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    });
    const clienteB = buildCliente({
      nombre: 'Mango Ltda.',
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });
    const clienteC = buildCliente({
      nombre: 'Zeta Corp',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    // CRITICAL: Route intercept BEFORE render
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([clienteA, clienteB, clienteC]))
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    // WHEN: User selects "Nombre Z→A" from SortControl
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-desc' } });

    // THEN: List reorders alphabetically descending (Zeta, Mango, Alpha)
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Zeta Corp');
      expect(items[1]).toHaveTextContent('Mango Ltda.');
      expect(items[2]).toHaveTextContent('Alpha S.A.');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-6-CMP-P1-4 (P1) — Select "fecha-asc" → oldest client appears first
//
// AC #4: When the user selects "Más antiguo", the client list orders by
// creation date ascending (oldest client appears first).
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — TC-E2-2-6-CMP-P1-4: sort fecha-asc', () => {
  it('should show oldest client first when "fecha-asc" is selected', async () => {
    // GIVEN: NETWORK intercepted BEFORE render with clients having distinct dates
    const newest = buildCliente({
      nombre: 'Cliente Nuevo',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });
    const oldest = buildCliente({
      nombre: 'Cliente Antiguo',
      createdAt: '2022-01-01T00:00:00.000Z',
      updatedAt: '2022-01-01T00:00:00.000Z',
    });
    const middle = buildCliente({
      nombre: 'Cliente Intermedio',
      createdAt: '2024-06-15T00:00:00.000Z',
      updatedAt: '2024-06-15T00:00:00.000Z',
    });

    // CRITICAL: Route intercept BEFORE render
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([newest, oldest, middle]))
    );

    renderClienteListView();

    // Default is fecha-desc, so newest appears first
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    // WHEN: User selects "Más antiguo" from SortControl
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'fecha-asc' } });

    // THEN: List reorders so the oldest client appears first
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Cliente Antiguo');
      expect(items[1]).toHaveTextContent('Cliente Intermedio');
      expect(items[2]).toHaveTextContent('Cliente Nuevo');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-6-CMP-P1-5 (P1) — Sort with active search filter (R-006)
//
// AC #5: When an active search filter is applied and the user changes sort order,
// the sort is applied to the already-filtered result WITHOUT clearing the search input.
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — TC-E2-2-6-CMP-P1-5: sort + search independence (R-006)', () => {
  it('should preserve search input and filter results when sort order changes', async () => {
    // GIVEN: NETWORK intercepted BEFORE render with clients — some contain "Test" in their name
    const testClientA = buildCliente({
      nombre: 'Test Zeta S.A.',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    });
    const testClientB = buildCliente({
      nombre: 'Test Alpha Ltda.',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const nonMatchingClient = buildCliente({
      nombre: 'Empresa Sin Match',
      createdAt: '2025-06-01T00:00:00.000Z',
      updatedAt: '2025-06-01T00:00:00.000Z',
    });

    // CRITICAL: Route intercept BEFORE render
    server.use(
      http.get(CLIENTES_URL, () =>
        HttpResponse.json([testClientA, testClientB, nonMatchingClient])
      )
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    // Apply search filter "Test"
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    // Wait for filter to apply — only 2 matching items
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: User changes sort order to "nombre-asc" while search is active
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    // THEN: Search input still contains "Test" (not cleared)
    expect((searchInput as HTMLInputElement).value).toBe('Test');

    // AND: Only the two "Test" clients are shown (filter preserved)
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(2);

      // AND: They are sorted alphabetically ascending
      expect(items[0]).toHaveTextContent('Test Alpha Ltda.');
      expect(items[1]).toHaveTextContent('Test Zeta S.A.');
    });

    // AND: The non-matching client is not in the DOM
    expect(screen.queryByText('Empresa Sin Match')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-6-CMP-P2-1 (P2) — Sort change does NOT trigger a new API GET request
//
// AC #1, #2, #3, #4: Sorting operates exclusively over the TanStack Query cache.
// No new GET /api/v1/clientes call should be made when the sort changes.
// ─────────────────────────────────────────────────────────────────────────────

describe('SortControl — TC-E2-2-6-CMP-P2-1: no extra API call on sort change', () => {
  it('should NOT trigger a new GET /api/v1/clientes request when sort order changes', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — track request count
    let requestCount = 0;

    server.use(
      http.get(CLIENTES_URL, () => {
        requestCount += 1;
        return HttpResponse.json([
          buildCliente({
            nombre: 'Alpha S.A.',
            createdAt: '2026-01-02T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          }),
          buildCliente({
            nombre: 'Zeta Corp',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
        ]);
      })
    );

    renderClienteListView();

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // Capture request count after initial load (exactly 1)
    const countAfterInitialLoad = requestCount;
    expect(countAfterInitialLoad).toBe(1);

    // WHEN: User changes sort order multiple times
    const sortControl = screen.getByTestId('sort-control');

    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Alpha S.A.');
    });

    fireEvent.change(sortControl, { target: { value: 'nombre-desc' } });
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items[0]).toHaveTextContent('Zeta Corp');
    });

    fireEvent.change(sortControl, { target: { value: 'fecha-asc' } });

    // THEN: The GET handler was called exactly once (initial load only)
    // Sort changes must NOT trigger additional API calls
    expect(requestCount).toBe(1);
  });
});
