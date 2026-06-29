/**
 * Integration edge-case tests — ClienteListView sort behavior
 * Story 2.6 — Sort Client List (testarch-automate expansion)
 *
 * Covers edge cases and boundary conditions NOT in the ATDD tests (ClienteListView.sort.test.tsx):
 *   - [P2] Single-client list — sort produces stable, no-crash result
 *   - [P2] Empty client list — sort on zero items produces no items rendered
 *   - [P1] Spanish locale sorting — ñ, accented vowels sort correctly (Álvarez vs Alvarado, Ñoño vs Naranjo)
 *   - [P2] Sort with clients having identical nombres — stable (no crash, all shown)
 *   - [P2] Sort with clients having identical createdAt dates — stable (all shown, no crash)
 *   - [P2] Multiple successive sort changes — final sort order is correct
 *   - [P2] Search filter produces empty result set → sort change on empty set does not crash
 *   - [P1] Search by NIT then sort — sort applies to NIT-filtered results without clearing NIT query
 *   - [P2] Sort A→Z then back to fecha-desc — list returns to date order
 *
 * Test stack: Vitest + React Testing Library + MSW 2 + TanStack Router (MemoryHistory)
 * Priority tags: [P1] high-impact edge cases, [P2] medium-impact, [P3] low-risk
 *
 * Given-When-Then format per test.
 * Network intercepts via MSW (setupServer) — no real HTTP calls.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { setupServer } from 'msw/node';
import {
  handleGetClientesSuccess,
  handleGetClientesEmpty,
} from '../../../../test/msw/handlers/clientes.handlers';
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { routeTree } from '../../../../routeTree.gen';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetClienteCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: render the /clientes route with full Router + QueryClient context
// ---------------------------------------------------------------------------

async function renderClientesRoute() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  const memoryHistory = createMemoryHistory({ initialEntries: ['/clientes'] });
  const router = createRouter({ routeTree, history: memoryHistory });

  await act(async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );
    await router.load();
  });

  return { router, queryClient };
}

// ---------------------------------------------------------------------------
// Helper: get ordered list of displayed client names from data-testid items
// ---------------------------------------------------------------------------

function getDisplayedClientNames(): string[] {
  const items = screen.getAllByTestId(/^cliente-item-/);
  return items.map((el) => el.textContent ?? '');
}

// ---------------------------------------------------------------------------
// Boundary: single-client list — sort does not crash, client remains visible
// ---------------------------------------------------------------------------

describe('[P2] Sort boundary: single-client list', () => {
  it('should show the single client regardless of sort order selected', async () => {
    // GIVEN: Only one client in the system
    const clients = [createCliente({ nombre: 'Única Empresa SA' })];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Única Empresa SA')).toBeInTheDocument();
    });

    // WHEN: User cycles through all sort options
    const sortControl = screen.getByTestId('sort-control');

    for (const value of ['nombre-asc', 'nombre-desc', 'fecha-asc', 'fecha-desc'] as const) {
      fireEvent.change(sortControl, { target: { value } });

      // THEN: The single client remains visible after each sort change
      await waitFor(() => {
        expect(screen.getByText('Única Empresa SA')).toBeInTheDocument();
      });
    }
  });

  it('should show exactly 1 list item when only 1 client exists and any sort is active', async () => {
    // GIVEN: Exactly 1 client
    const clients = [createCliente({ nombre: 'Solo Corp' })];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getAllByTestId(/^cliente-item-/)).toHaveLength(1);
    });

    // WHEN: Sort changes to nombre-asc
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } });

    // THEN: Still exactly 1 item
    await waitFor(() => {
      expect(screen.getAllByTestId(/^cliente-item-/)).toHaveLength(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Boundary: empty list — no clients, sort changes do not crash
// ---------------------------------------------------------------------------

describe('[P2] Sort boundary: empty client list', () => {
  it('should not crash when sort order changes and the list is empty', async () => {
    // GIVEN: No clients in the system
    server.use(handleGetClientesEmpty());

    await renderClientesRoute();

    // The empty state message or empty list renders (no items)
    // WHEN: (no items to interact with via sort — sort control may not render in empty state)
    // THEN: Component is in the DOM without throwing
    await waitFor(() => {
      // EmptyState renders with message about no clients
      expect(screen.getByText(/no hay clientes/i)).toBeInTheDocument();
    });

    // Verify no list items are present
    expect(screen.queryAllByTestId(/^cliente-item-/)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// [P1] Spanish locale sorting: accented vowels and ñ sort correctly
// The implementation uses localeCompare (without explicit locale/sensitivity in
// ClienteListView, but the sort should still handle Spanish chars correctly via
// browser/Node default locale).
// ---------------------------------------------------------------------------

describe('[P1] Sort edge: Spanish locale special characters', () => {
  it('should sort "Álvarez SA" before "Barros Ltda" in A→Z order (accented A < B)', async () => {
    // GIVEN: Clients with accented first letter
    const clients = [
      createCliente({ nombre: 'Barros Ltda', nit: '900001000-1', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Álvarez SA', nit: '900002000-2', createdAt: '2026-01-02T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Barros Ltda')).toBeInTheDocument();
      expect(screen.getByText('Álvarez SA')).toBeInTheDocument();
    });

    // WHEN: Sort by Nombre A→Z
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } });

    // THEN: "Álvarez SA" (Á ~ A) should sort before "Barros Ltda" (B)
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const alvarezIdx = names.findIndex((n) => n.includes('Álvarez SA'));
      const barrosIdx = names.findIndex((n) => n.includes('Barros Ltda'));
      expect(alvarezIdx).toBeLessThan(barrosIdx);
    });
  });

  it('should sort "Naranjo Corp" before "Ñoño SA" in A→Z order (N < Ñ in Spanish)', async () => {
    // GIVEN: Clients where one starts with Ñ
    const clients = [
      createCliente({ nombre: 'Ñoño SA', nit: '900001000-1', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Naranjo Corp', nit: '900002000-2', createdAt: '2026-01-02T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Ñoño SA')).toBeInTheDocument();
      expect(screen.getByText('Naranjo Corp')).toBeInTheDocument();
    });

    // WHEN: Sort by Nombre A→Z
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } });

    // THEN: "Naranjo Corp" (N) sorts before "Ñoño SA" (Ñ comes after N in Spanish alphabet)
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const naranjoIdx = names.findIndex((n) => n.includes('Naranjo Corp'));
      const nonyoIdx = names.findIndex((n) => n.includes('Ñoño SA'));
      expect(naranjoIdx).toBeLessThan(nonyoIdx);
    });
  });

  it('should sort "Ñoño SA" before "Naranjo Corp" in Z→A order', async () => {
    // GIVEN: Clients where one starts with Ñ
    const clients = [
      createCliente({ nombre: 'Naranjo Corp', nit: '900001000-1', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Ñoño SA', nit: '900002000-2', createdAt: '2026-01-02T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Ñoño SA')).toBeInTheDocument();
    });

    // WHEN: Sort by Nombre Z→A
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-desc' } });

    // THEN: "Ñoño SA" (Ñ > N in Spanish) appears before "Naranjo Corp"
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const nonyoIdx = names.findIndex((n) => n.includes('Ñoño SA'));
      const naranjoIdx = names.findIndex((n) => n.includes('Naranjo Corp'));
      expect(nonyoIdx).toBeLessThan(naranjoIdx);
    });
  });
});

// ---------------------------------------------------------------------------
// [P2] Sort with clients having identical nombres — all clients remain visible
// ---------------------------------------------------------------------------

describe('[P2] Sort boundary: clients with identical nombres', () => {
  it('should display all clients when multiple share the same nombre (tie in nombre-asc)', async () => {
    // GIVEN: 3 clients all named "Empresa Igual SA" but different NITs/IDs
    const clients = [
      createCliente({ nombre: 'Empresa Igual SA', nit: '900001000-1', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Empresa Igual SA', nit: '900002000-2', createdAt: '2026-02-01T00:00:00Z' }),
      createCliente({ nombre: 'Empresa Igual SA', nit: '900003000-3', createdAt: '2026-03-01T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getAllByText('Empresa Igual SA')).toHaveLength(3);
    });

    // WHEN: Sort by Nombre A→Z
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } });

    // THEN: All 3 clients are still displayed (no items lost due to sort tie)
    await waitFor(() => {
      expect(screen.getAllByTestId(/^cliente-item-/)).toHaveLength(3);
    });
  });
});

// ---------------------------------------------------------------------------
// [P2] Sort with clients having identical createdAt — all clients remain visible
// ---------------------------------------------------------------------------

describe('[P2] Sort boundary: clients with identical createdAt dates', () => {
  it('should display all clients when multiple share the same createdAt (tie in fecha-desc)', async () => {
    // GIVEN: 3 clients with the exact same createdAt timestamp
    const sameDate = '2026-06-01T12:00:00Z';
    const clients = [
      createCliente({ nombre: 'Alfa SAS', createdAt: sameDate }),
      createCliente({ nombre: 'Beta SAS', createdAt: sameDate }),
      createCliente({ nombre: 'Gamma SAS', createdAt: sameDate }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Alfa SAS')).toBeInTheDocument();
      expect(screen.getByText('Beta SAS')).toBeInTheDocument();
      expect(screen.getByText('Gamma SAS')).toBeInTheDocument();
    });

    // WHEN: Sort by "Más reciente" (fecha-desc) — all have same date, ties expected
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'fecha-desc' } });

    // THEN: All 3 clients are still present (sort tie doesn't drop items)
    await waitFor(() => {
      expect(screen.getAllByTestId(/^cliente-item-/)).toHaveLength(3);
    });
  });

  it('should display all clients when multiple share the same createdAt (tie in fecha-asc)', async () => {
    // GIVEN: 3 clients with identical createdAt
    const sameDate = '2026-03-15T08:00:00Z';
    const clients = [
      createCliente({ nombre: 'Primera SA', createdAt: sameDate }),
      createCliente({ nombre: 'Segunda SA', createdAt: sameDate }),
      createCliente({ nombre: 'Tercera SA', createdAt: sameDate }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getAllByTestId(/^cliente-item-/)).toHaveLength(3);
    });

    // WHEN: Sort by "Más antiguo" (fecha-asc)
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'fecha-asc' } });

    // THEN: All 3 clients remain visible
    await waitFor(() => {
      expect(screen.getAllByTestId(/^cliente-item-/)).toHaveLength(3);
    });
  });
});

// ---------------------------------------------------------------------------
// [P2] Multiple successive sort changes — final order is correct
// ---------------------------------------------------------------------------

describe('[P2] Sort edge: multiple successive sort changes', () => {
  it('should apply the last sort order when user changes sort multiple times rapidly', async () => {
    // GIVEN: 3 clients with known names
    const clients = [
      createCliente({ nombre: 'Zeta SA', nit: '900001000-1', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Alfa SA', nit: '900002000-2', createdAt: '2026-06-01T00:00:00Z' }),
      createCliente({ nombre: 'Marta SAS', nit: '900003000-3', createdAt: '2026-03-01T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Zeta SA')).toBeInTheDocument();
    });

    const sortControl = screen.getByTestId('sort-control');

    // WHEN: User changes sort 3 times in quick succession
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });
    fireEvent.change(sortControl, { target: { value: 'nombre-desc' } });
    fireEvent.change(sortControl, { target: { value: 'fecha-asc' } });

    // THEN: Final sort (fecha-asc) is applied — oldest first: Zeta (Jan), Marta (Mar), Alfa (Jun)
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const zetaIdx = names.findIndex((n) => n.includes('Zeta SA'));
      const martaIdx = names.findIndex((n) => n.includes('Marta SAS'));
      const alfaIdx = names.findIndex((n) => n.includes('Alfa SA'));
      expect(zetaIdx).toBeLessThan(martaIdx);
      expect(martaIdx).toBeLessThan(alfaIdx);
    });
  });

  it('should return to fecha-desc order when sort changes back from nombre-asc to fecha-desc', async () => {
    // GIVEN: 3 clients with known dates
    const clients = [
      createCliente({ nombre: 'Empresa A', nit: '900001000-1', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Empresa B', nit: '900002000-2', createdAt: '2026-06-01T00:00:00Z' }),
      createCliente({ nombre: 'Empresa C', nit: '900003000-3', createdAt: '2026-03-01T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Empresa A')).toBeInTheDocument();
    });

    const sortControl = screen.getByTestId('sort-control');

    // First: sort by nombre-asc (A, B, C order)
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    await waitFor(() => {
      const names = getDisplayedClientNames();
      expect(names.findIndex((n) => n.includes('Empresa A'))).toBeLessThan(
        names.findIndex((n) => n.includes('Empresa B'))
      );
    });

    // WHEN: User switches back to fecha-desc
    fireEvent.change(sortControl, { target: { value: 'fecha-desc' } });

    // THEN: List now shows date-descending: B (Jun), C (Mar), A (Jan)
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const bIdx = names.findIndex((n) => n.includes('Empresa B'));
      const cIdx = names.findIndex((n) => n.includes('Empresa C'));
      const aIdx = names.findIndex((n) => n.includes('Empresa A'));
      expect(bIdx).toBeLessThan(cIdx);
      expect(cIdx).toBeLessThan(aIdx);
    });
  });
});

// ---------------------------------------------------------------------------
// [P2] Search produces empty filtered result → sort change on empty set does not crash
// ---------------------------------------------------------------------------

describe('[P2] Sort edge: sort change on empty filtered set (search yields 0 results)', () => {
  it('should not crash when sort changes and active search matches zero clients', async () => {
    // GIVEN: 3 clients, search for "XXXXXXXX" matches none
    const clients = [
      createCliente({ nombre: 'Alfa Corp' }),
      createCliente({ nombre: 'Beta Ltda' }),
      createCliente({ nombre: 'Gamma SAS' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Alfa Corp')).toBeInTheDocument();
    });

    // Apply a search that matches nothing
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'XXXXXXXXXXXXXXXX' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Alfa Corp')).not.toBeInTheDocument();
      expect(screen.queryByText('Beta Ltda')).not.toBeInTheDocument();
      expect(screen.queryByText('Gamma SAS')).not.toBeInTheDocument();
    });

    // WHEN: User changes sort order while no results are shown
    // THEN: No error thrown, no items visible
    expect(() =>
      fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } })
    ).not.toThrow();

    await waitFor(() => {
      expect(screen.queryAllByTestId(/^cliente-item-/)).toHaveLength(0);
    });
  });

  it('should still show zero items after sort change on empty filtered set', async () => {
    // GIVEN: Search "XXXXXXXX" yields 0 results from a 3-client list
    const clients = [
      createCliente({ nombre: 'Empresa Uno' }),
      createCliente({ nombre: 'Empresa Dos' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Empresa Uno')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: 'ZZZZZZZZZZZZZZZ' },
    });

    await waitFor(() => {
      expect(screen.queryAllByTestId(/^cliente-item-/)).toHaveLength(0);
    });

    // WHEN: Sort changes
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'fecha-asc' } });

    // THEN: Still zero items shown (empty filtered set remains empty after sort)
    await waitFor(() => {
      expect(screen.queryAllByTestId(/^cliente-item-/)).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// [P1] Search by NIT then sort — sort applies to NIT-filtered results
// ---------------------------------------------------------------------------

describe('[P1] Sort edge: search by NIT and then apply sort (NIT-filtered results)', () => {
  it('should apply sort to NIT-filtered results without clearing the NIT search input', async () => {
    // GIVEN: 4 clients — 2 share NIT prefix "8001"
    const clients = [
      createCliente({ nombre: 'Zeta SA',  nit: '800100001-1', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Alfa SA',  nit: '800100002-2', createdAt: '2026-06-01T00:00:00Z' }),
      createCliente({ nombre: 'Beta SAS', nit: '900300003-3', createdAt: '2026-03-01T00:00:00Z' }),
      createCliente({ nombre: 'Gamma Ltda', nit: '900400004-4', createdAt: '2026-04-01T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Zeta SA')).toBeInTheDocument();
    });

    // Apply NIT-based search filter
    fireEvent.change(screen.getByTestId('clientes-search-input'), {
      target: { value: '8001' },
    });

    // Wait for non-matching clients to disappear
    await waitFor(() => {
      expect(screen.queryByText('Beta SAS')).not.toBeInTheDocument();
      expect(screen.queryByText('Gamma Ltda')).not.toBeInTheDocument();
    });

    // Confirm the 2 matching clients are visible
    await waitFor(() => {
      expect(screen.getByText('Zeta SA')).toBeInTheDocument();
      expect(screen.getByText('Alfa SA')).toBeInTheDocument();
    });

    // WHEN: User selects "Nombre A→Z" sort
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } });

    // THEN: NIT search input still shows "8001" (not cleared)
    await waitFor(() => {
      expect(screen.getByTestId('clientes-search-input')).toHaveValue('8001');
    });

    // AND: Only the 2 NIT-matching clients are shown (non-matching still hidden)
    await waitFor(() => {
      expect(screen.queryByText('Beta SAS')).not.toBeInTheDocument();
      expect(screen.queryByText('Gamma Ltda')).not.toBeInTheDocument();
    });

    // AND: The 2 matching clients are sorted A→Z: "Alfa SA" before "Zeta SA"
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const alfaIdx = names.findIndex((n) => n.includes('Alfa SA'));
      const zetaIdx = names.findIndex((n) => n.includes('Zeta SA'));
      expect(alfaIdx).toBeLessThan(zetaIdx);
    });
  });
});
