/**
 * ATDD component tests — Story 2.1: ClienteListView (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/clientes/domain/Cliente.ts
 *   - frontend/src/modules/crm/clientes/application/useClientes.ts
 *   - frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts
 *   - frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx
 *   - frontend/src/shared/components/EmptyState.tsx
 *   - frontend/src/shared/components/ErrorPanel.tsx
 *   - frontend/src/shared/components/ClienteListItem.tsx
 *
 * Test IDs:
 *   TC-E2-2-1-CMP-1 (P1) — Search "Acme" filters to matching items only
 *   TC-E2-2-1-CMP-2 (P1) — Empty data shows EmptyState, no list items
 *   TC-E2-2-1-CMP-3 (P1) — MSW 500 shows ErrorPanel + "Reintentar" button
 *   TC-E2-2-1-CMP-4 (P1) — Click "Reintentar" triggers new GET request
 *   TC-E2-2-1-CMP-5 (P2) — 500 records filter completes ≤150ms (NFR1)
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

import { buildCliente, buildClientes, resetClienteCounter } from './clienteFactory';

// ClienteListView does NOT exist yet — import will fail (RED phase)
import { ClienteListView } from '../presentation/ClienteListView';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress console.error for expected React query errors in test environment
// Must be declared at module scope BEFORE describe blocks so it applies to all tests
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  // Suppress React act() warnings and TanStack Query network errors in tests
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]')
  ) {
    return;
  }
  originalConsoleError(...args);
});

const API_BASE = 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup (network-first pattern: handlers registered before tests run)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetClienteCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ClienteListView with isolated QueryClient
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
// TC-E2-2-1-CMP-1 (P1) — Search "Acme" filters to matching items only
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — search filter', () => {
  it('TC-E2-2-1-CMP-1: should show only matching items when user types "Acme" in search field', async () => {
    // GIVEN: NETWORK intercepted BEFORE render (network-first pattern)
    const clientes = [
      buildCliente({ nombre: 'Acme S.A.', nit: '900111111-1' }),
      buildCliente({ nombre: 'Beta Corp', nit: '900222222-2' }),
      buildCliente({ nombre: 'Gamma Ltda.', nit: '900333333-3' }),
    ];

    // CRITICAL: Route intercept BEFORE navigation/render
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json(clientes))
    );

    renderClienteListView();

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(3);
    });

    // WHEN: User types "Acme" in the search field
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: 'Acme' } });

    // THEN: Only "Acme S.A." is visible; "Beta Corp" and "Gamma Ltda." are hidden
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Acme S.A.');
    });

    expect(screen.queryByText('Beta Corp')).not.toBeInTheDocument();
    expect(screen.queryByText('Gamma Ltda.')).not.toBeInTheDocument();
  });

  it('should filter by NIT when user searches a partial NIT string', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const clientes = [
      buildCliente({ nombre: 'Acme S.A.', nit: '900111111-1' }),
      buildCliente({ nombre: 'Beta Corp', nit: '900222222-2' }),
    ];

    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json(clientes))
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    // WHEN: User types NIT fragment that only matches "Beta Corp"
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: '900222222' } });

    // THEN: Only Beta Corp is visible
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Beta Corp');
    });
  });

  it('should show all items when search field is cleared', async () => {
    // GIVEN: Two clientes loaded, search has been applied
    const clientes = [
      buildCliente({ nombre: 'Acme S.A.' }),
      buildCliente({ nombre: 'Beta Corp' }),
    ];

    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json(clientes))
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);
    fireEvent.change(searchInput, { target: { value: 'Acme' } });

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(1);
    });

    // WHEN: Search field is cleared
    fireEvent.change(searchInput, { target: { value: '' } });

    // THEN: All clients are shown again
    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(2);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-1-CMP-2 (P1) — Empty data shows EmptyState, no list items
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — empty state', () => {
  it('TC-E2-2-1-CMP-2: should show EmptyState component and no list items when data is empty', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, returning empty array
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([]))
    );

    renderClienteListView();

    // THEN: EmptyState is displayed
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // AND: No client list items are rendered
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-1-CMP-3 (P1) — MSW 500 shows ErrorPanel + "Reintentar" button
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — error state', () => {
  it('TC-E2-2-1-CMP-3: should show ErrorPanel with "Reintentar" button when fetch returns 500', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, returning 500 error
    server.use(
      http.get(CLIENTES_URL, () => new HttpResponse(null, { status: 500 }))
    );

    renderClienteListView();

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // AND: "Reintentar" button is visible
    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    expect(retryButton).toBeInTheDocument();

    // AND: No client list items are rendered
    expect(screen.queryAllByTestId('cliente-list-item')).toHaveLength(0);
  });

  it('should show ErrorPanel when network request fails completely', async () => {
    // GIVEN: NETWORK intercepted BEFORE render, throwing network error
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.error())
    );

    renderClienteListView();

    // THEN: ErrorPanel is displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TC-E2-2-1-CMP-4 (P1) — Click "Reintentar" triggers new GET request
  // ─────────────────────────────────────────────────────────────────────────

  it('TC-E2-2-1-CMP-4: should trigger a new GET request when "Reintentar" button is clicked', async () => {
    // GIVEN: First request fails with 500
    let requestCount = 0;

    server.use(
      http.get(CLIENTES_URL, () => {
        requestCount += 1;
        if (requestCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        // Second request succeeds
        return HttpResponse.json([buildCliente({ nombre: 'Acme S.A.' })]);
      })
    );

    renderClienteListView();

    // Wait for ErrorPanel to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    const initialRequestCount = requestCount;

    // WHEN: User clicks "Reintentar"
    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryButton);

    // THEN: A new GET /api/v1/clientes request is triggered
    await waitFor(() => {
      expect(requestCount).toBeGreaterThan(initialRequestCount);
    });

    // AND: The list is now populated (retry succeeded)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-list-item')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-1-CMP-5 (P2) — 500 records filter completes ≤150ms (NFR1)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — performance (NFR1)', () => {
  it('TC-E2-2-1-CMP-5: should filter 500 records in ≤150ms when user types in search field', async () => {
    // GIVEN: 500 clientes loaded (NETWORK intercepted BEFORE render)
    const largeList = buildClientes(500);

    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json(largeList))
    );

    renderClienteListView();

    await waitFor(() => {
      expect(screen.getAllByTestId('cliente-list-item')).toHaveLength(500);
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre o nit/i);

    // WHEN: User types a search term (triggers useMemo filter over 500 records)
    const start = performance.now();
    fireEvent.change(searchInput, { target: { value: 'Acme' } });
    const elapsed = performance.now() - start;

    // Wait for React state update to settle — DOM must reflect the filtered result
    await waitFor(() => {
      // After filtering "Acme" across 500 generated records, the list should be shorter
      // than 500 (buildClientes generates names from EMPRESAS[], "Acme S.A." is index 0)
      const items = screen.queryAllByTestId('cliente-list-item');
      const emptyState = screen.queryByTestId('empty-state');
      // The render must have updated: either <500 items visible or EmptyState shown
      expect(items.length < 500 || emptyState !== null).toBe(true);
    });

    // THEN: Filter execution completed in ≤150ms (NFR1)
    expect(elapsed).toBeLessThanOrEqual(150);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ClienteListView — default sort order (AC #5)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — default sort order', () => {
  it('should display clientes ordered by createdAt descending (most recent first) by default', async () => {
    // GIVEN: Three clientes with distinct creation dates
    const older = buildCliente({
      nombre: 'Empresa Antigua',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    });
    const newer = buildCliente({
      nombre: 'Empresa Nueva',
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    });

    // NETWORK intercepted BEFORE render
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([older, newer]))
    );

    renderClienteListView();

    // THEN: Items are loaded and newest appears first
    await waitFor(() => {
      const items = screen.getAllByTestId('cliente-list-item');
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent('Empresa Nueva');
      expect(items[1]).toHaveTextContent('Empresa Antigua');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ClienteListView — list panel structure (AC #1)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteListView — list panel structure', () => {
  it('should render each client item with Nombre and NIT/RUC visible', async () => {
    // GIVEN: One client with a known Nombre and NIT
    const cliente = buildCliente({ nombre: 'Acme S.A.', nit: '900123456-1' });

    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([cliente]))
    );

    renderClienteListView();

    // THEN: The item displays both Nombre and NIT
    await waitFor(() => {
      const item = screen.getByTestId('cliente-list-item');
      expect(item).toHaveTextContent('Acme S.A.');
      expect(item).toHaveTextContent('900123456-1');
    });
  });

  it('should render the search input with Spanish placeholder text', async () => {
    // GIVEN: Empty clientes list
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([]))
    );

    renderClienteListView();

    // THEN: Search input has Spanish placeholder
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/buscar por nombre o nit\/ruc/i);
      expect(input).toBeInTheDocument();
    });
  });

  it('should render the section heading "Clientes" in Spanish', async () => {
    // GIVEN: Any state
    server.use(
      http.get(CLIENTES_URL, () => HttpResponse.json([]))
    );

    renderClienteListView();

    // THEN: Heading "Clientes" is present
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /clientes/i })).toBeInTheDocument();
    });
  });
});

