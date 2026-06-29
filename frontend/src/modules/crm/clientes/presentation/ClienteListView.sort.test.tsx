/**
 * Component tests — ClienteListView sort integration
 * Story 2.6 — Sort Client List (ATDD phase)
 *
 * Test IDs covered:
 *   TC-E2-P1-12  Sort A→Z (Nombre A→Z) — client-side, no new API call
 *   TC-E2-P1-13  Sort Z→A (Nombre Z→A) — client-side, no new API call
 *   TC-E2-P1-14  Sort by date: "Más reciente" (fecha-desc) and "Más antiguo" (fecha-asc)
 *   TC-E2-P1-15  Sort + active search interaction — sort applied to filtered set, search NOT cleared (R-E2-04)
 *   TC-E2-P1-16  Default sort is "Más reciente" (fecha-desc) on initial page load
 *
 * Test stack: Vitest + React Testing Library + MSW 2 + TanStack Router (MemoryHistory)
 *
 * AC references:
 *   AC#1 — Nombre A→Z sort without new API call
 *   AC#2 — Nombre Z→A sort without new API call
 *   AC#3 — Más reciente (fecha-desc) sort without new API call
 *   AC#4 — Más antiguo (fecha-asc) sort without new API call
 *   AC#5 — Sort + search: search input preserved, filtered set sorted
 *   AC#6 — Default sort is "Más reciente" on load
 *
 * Given-When-Then format per test.
 * Network intercepts via MSW (setupServer) — no real HTTP calls.
 * Router: createMemoryHistory + RouterProvider (TanStack Router requires context for <Link>).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { setupServer } from 'msw/node';
import {
  handleGetClientesSuccess,
} from '../../../../test/msw/handlers/clientes.handlers';
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { routeTree } from '../../../../routeTree.gen';

// ---------------------------------------------------------------------------
// MSW server setup — intercepts GET /api/v1/clientes at Node level
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
// ClienteListView uses <Link> which requires TanStack Router context.
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
// TC-E2-P1-12: Sort A→Z reorders list alphabetically ascending by Nombre
// AC#1 — Nombre A→Z, no new API call
// ---------------------------------------------------------------------------

describe('TC-E2-P1-12: Sort "Nombre A→Z" orders list alphabetically ascending', () => {
  it('should reorder the list alphabetically ascending when "Nombre A→Z" is selected', async () => {
    // GIVEN: The client list is loaded with 3 clients in arbitrary order
    const clients = [
      createCliente({ nombre: 'Zeta Corp', nit: '900001000-1' }),
      createCliente({ nombre: 'Alpha SA', nit: '900002000-2' }),
      createCliente({ nombre: 'Mango Ltda', nit: '900003000-3' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    // Wait for clients to render
    await waitFor(() => {
      expect(screen.getByText('Zeta Corp')).toBeInTheDocument();
      expect(screen.getByText('Alpha SA')).toBeInTheDocument();
      expect(screen.getByText('Mango Ltda')).toBeInTheDocument();
    });

    // WHEN: User selects "Nombre A→Z" from the SortControl
    const sortControl = screen.getByTestId('sort-control');
    fireEvent.change(sortControl, { target: { value: 'nombre-asc' } });

    // THEN: The list reorders alphabetically ascending: Alpha, Mango, Zeta
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const alphaIndex = names.findIndex((n) => n.includes('Alpha SA'));
      const mangoIndex = names.findIndex((n) => n.includes('Mango Ltda'));
      const zetaIndex = names.findIndex((n) => n.includes('Zeta Corp'));

      expect(alphaIndex).toBeLessThan(mangoIndex);
      expect(mangoIndex).toBeLessThan(zetaIndex);
    });
  });

  it('should show Alpha SA before Mango Ltda in A→Z order', async () => {
    // GIVEN: 3 clients with names starting with different letters
    const clients = [
      createCliente({ nombre: 'Zeta Corp', nit: '900001000-1' }),
      createCliente({ nombre: 'Alpha SA', nit: '900002000-2' }),
      createCliente({ nombre: 'Mango Ltda', nit: '900003000-3' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Alpha SA')).toBeInTheDocument();
    });

    // WHEN: User selects "Nombre A→Z"
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-asc' } });

    // THEN: Alpha SA appears before Mango Ltda
    await waitFor(() => {
      const names = getDisplayedClientNames();
      expect(names.findIndex((n) => n.includes('Alpha SA'))).toBeLessThan(
        names.findIndex((n) => n.includes('Mango Ltda'))
      );
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-13: Sort Z→A reorders list alphabetically descending by Nombre
// AC#2 — Nombre Z→A, no new API call
// ---------------------------------------------------------------------------

describe('TC-E2-P1-13: Sort "Nombre Z→A" orders list alphabetically descending', () => {
  it('should reorder the list alphabetically descending when "Nombre Z→A" is selected', async () => {
    // GIVEN: The client list is loaded with 3 clients in arbitrary order
    const clients = [
      createCliente({ nombre: 'Zeta Corp', nit: '900001000-1' }),
      createCliente({ nombre: 'Alpha SA', nit: '900002000-2' }),
      createCliente({ nombre: 'Mango Ltda', nit: '900003000-3' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Zeta Corp')).toBeInTheDocument();
      expect(screen.getByText('Alpha SA')).toBeInTheDocument();
    });

    // WHEN: User selects "Nombre Z→A" from the SortControl
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-desc' } });

    // THEN: The list reorders alphabetically descending: Zeta, Mango, Alpha
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const zetaIndex = names.findIndex((n) => n.includes('Zeta Corp'));
      const mangoIndex = names.findIndex((n) => n.includes('Mango Ltda'));
      const alphaIndex = names.findIndex((n) => n.includes('Alpha SA'));

      expect(zetaIndex).toBeLessThan(mangoIndex);
      expect(mangoIndex).toBeLessThan(alphaIndex);
    });
  });

  it('should show Zeta Corp before Alpha SA in Z→A order', async () => {
    // GIVEN: 3 clients with names starting with different letters
    const clients = [
      createCliente({ nombre: 'Zeta Corp', nit: '900001000-1' }),
      createCliente({ nombre: 'Alpha SA', nit: '900002000-2' }),
      createCliente({ nombre: 'Mango Ltda', nit: '900003000-3' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Zeta Corp')).toBeInTheDocument();
    });

    // WHEN: User selects "Nombre Z→A"
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-desc' } });

    // THEN: Zeta Corp appears before Alpha SA
    await waitFor(() => {
      const names = getDisplayedClientNames();
      expect(names.findIndex((n) => n.includes('Zeta Corp'))).toBeLessThan(
        names.findIndex((n) => n.includes('Alpha SA'))
      );
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-14: Sort by creation date — "Más reciente" and "Más antiguo"
// AC#3 — fecha-desc (newest first); AC#4 — fecha-asc (oldest first)
// ---------------------------------------------------------------------------

describe('TC-E2-P1-14: Sort by creation date (Más reciente / Más antiguo)', () => {
  const clientA = {
    id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Cliente Enero',
    nit: '900001111-1',
    telefono: '3001111111',
    ciudad: 'Bogotá',
    createdAt: '2026-01-01T00:00:00Z', // oldest
  };
  const clientB = {
    id: '00000000-0000-0000-0000-000000000002',
    nombre: 'Cliente Junio',
    nit: '900002222-2',
    telefono: '3002222222',
    ciudad: 'Bogotá',
    createdAt: '2026-06-01T00:00:00Z', // newest
  };
  const clientC = {
    id: '00000000-0000-0000-0000-000000000003',
    nombre: 'Cliente Marzo',
    nit: '900003333-3',
    telefono: '3003333333',
    ciudad: 'Bogotá',
    createdAt: '2026-03-01T00:00:00Z', // middle
  };

  it('should show newest client first when "Más reciente" (fecha-desc) is selected', async () => {
    // GIVEN: 3 clients with known createdAt dates (A=Jan, B=Jun, C=Mar)
    server.use(handleGetClientesSuccess([clientA, clientC, clientB]));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Cliente Junio')).toBeInTheDocument();
    });

    // WHEN: User selects "Más reciente" (fecha-desc)
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'fecha-desc' } });

    // THEN: Order is: B (Jun), C (Mar), A (Jan) — newest first
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const idxB = names.findIndex((n) => n.includes('Cliente Junio'));
      const idxC = names.findIndex((n) => n.includes('Cliente Marzo'));
      const idxA = names.findIndex((n) => n.includes('Cliente Enero'));

      expect(idxB).toBeLessThan(idxC);
      expect(idxC).toBeLessThan(idxA);
    });
  });

  it('should show oldest client first when "Más antiguo" (fecha-asc) is selected', async () => {
    // GIVEN: 3 clients with known createdAt dates (A=Jan, B=Jun, C=Mar)
    server.use(handleGetClientesSuccess([clientB, clientC, clientA]));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Cliente Enero')).toBeInTheDocument();
    });

    // WHEN: User selects "Más antiguo" (fecha-asc)
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'fecha-asc' } });

    // THEN: Order is: A (Jan), C (Mar), B (Jun) — oldest first
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const idxA = names.findIndex((n) => n.includes('Cliente Enero'));
      const idxC = names.findIndex((n) => n.includes('Cliente Marzo'));
      const idxB = names.findIndex((n) => n.includes('Cliente Junio'));

      expect(idxA).toBeLessThan(idxC);
      expect(idxC).toBeLessThan(idxB);
    });
  });

  it('should switch from fecha-desc to fecha-asc and reverse the order', async () => {
    // GIVEN: 3 clients, default sort is fecha-desc
    server.use(handleGetClientesSuccess([clientA, clientB, clientC]));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Cliente Enero')).toBeInTheDocument();
      expect(screen.getByText('Cliente Junio')).toBeInTheDocument();
      expect(screen.getByText('Cliente Marzo')).toBeInTheDocument();
    });

    // Verify default fecha-desc baseline: Jun before Jan
    await waitFor(() => {
      const names = getDisplayedClientNames();
      expect(names.findIndex((n) => n.includes('Cliente Junio'))).toBeLessThan(
        names.findIndex((n) => n.includes('Cliente Enero'))
      );
    });

    // WHEN: User switches to "Más antiguo" (fecha-asc)
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'fecha-asc' } });

    // THEN: Order reverses — oldest (Jan) now first
    await waitFor(() => {
      const names = getDisplayedClientNames();
      expect(names.findIndex((n) => n.includes('Cliente Enero'))).toBeLessThan(
        names.findIndex((n) => n.includes('Cliente Junio'))
      );
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-15: Sort + active search — sort applied to filtered set (R-E2-04)
// AC#5 — sort does NOT clear search input; applies to already-filtered set
// ---------------------------------------------------------------------------

describe('TC-E2-P1-15: Sort with active search — filtered set sorted, search not cleared', () => {
  it('should preserve the search input text when sort order changes', async () => {
    // GIVEN: 5 clients loaded, search "Ac" is active (matches "Acme" and "Aceros")
    const clients = [
      createCliente({ nombre: 'Acme Corp', nit: '900001000-1' }),
      createCliente({ nombre: 'Aceros del Valle', nit: '900002000-2' }),
      createCliente({ nombre: 'Beta SA', nit: '900003000-3' }),
      createCliente({ nombre: 'Gamma Ltda', nit: '900004000-4' }),
      createCliente({ nombre: 'Delta SAS', nit: '900005000-5' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Apply search filter "Ac"
    const searchInput = screen.getByTestId('clientes-search-input');
    fireEvent.change(searchInput, { target: { value: 'Ac' } });

    await waitFor(() => {
      expect(screen.getByText('Aceros del Valle')).toBeInTheDocument();
      expect(screen.queryByText('Beta SA')).not.toBeInTheDocument();
    });

    // WHEN: User selects "Nombre Z→A" sort
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-desc' } });

    // THEN: Search input still shows "Ac" (not cleared) — R-E2-04 compliance
    await waitFor(() => {
      expect(screen.getByTestId('clientes-search-input')).toHaveValue('Ac');
    });
  });

  it('should only show filtered clients ("Ac" matches) after sort change', async () => {
    // GIVEN: 5 clients, search "Ac" active
    const clients = [
      createCliente({ nombre: 'Acme Corp', nit: '900001000-1' }),
      createCliente({ nombre: 'Aceros del Valle', nit: '900002000-2' }),
      createCliente({ nombre: 'Beta SA', nit: '900003000-3' }),
      createCliente({ nombre: 'Gamma Ltda', nit: '900004000-4' }),
      createCliente({ nombre: 'Delta SAS', nit: '900005000-5' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    // Apply search filter
    fireEvent.change(screen.getByTestId('clientes-search-input'), { target: { value: 'Ac' } });

    await waitFor(() => {
      expect(screen.queryByText('Beta SA')).not.toBeInTheDocument();
    });

    // WHEN: User selects "Nombre Z→A" sort
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-desc' } });

    // THEN: Only "Aceros del Valle" and "Acme Corp" are visible (filtered set)
    await waitFor(() => {
      expect(screen.getByText('Aceros del Valle')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.queryByText('Beta SA')).not.toBeInTheDocument();
      expect(screen.queryByText('Gamma Ltda')).not.toBeInTheDocument();
      expect(screen.queryByText('Delta SAS')).not.toBeInTheDocument();
    });
  });

  it('should show "Acme Corp" before "Aceros del Valle" when Z→A and search "Ac" is active', async () => {
    // GIVEN: 2 matching clients: "Acme Corp" and "Aceros del Valle"
    const clients = [
      createCliente({ nombre: 'Acme Corp', nit: '900001000-1' }),
      createCliente({ nombre: 'Aceros del Valle', nit: '900002000-2' }),
      createCliente({ nombre: 'Beta SA', nit: '900003000-3' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Aceros del Valle')).toBeInTheDocument();
    });

    // Apply search filter "Ac"
    fireEvent.change(screen.getByTestId('clientes-search-input'), { target: { value: 'Ac' } });

    // WHEN: User selects "Nombre Z→A"
    fireEvent.change(screen.getByTestId('sort-control'), { target: { value: 'nombre-desc' } });

    // THEN: "Acme Corp" appears before "Aceros del Valle" in Z→A order
    // Alphabetical comparison: 'Acme' vs 'Aceros'
    //   A=A, c=c, m vs e -> 'm' > 'e' -> 'Acme' > 'Aceros' in A→Z
    //   Therefore in Z→A: 'Acme' comes BEFORE 'Aceros'
    await waitFor(() => {
      const names = getDisplayedClientNames();
      const acmIndex = names.findIndex((n) => n.includes('Acme Corp'));
      const aceIndex = names.findIndex((n) => n.includes('Aceros del Valle'));

      expect(acmIndex).toBeLessThan(aceIndex);
    });
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-16: Default sort is "Más reciente" (fecha-desc) on initial page load
// AC#6 — default sort order is fecha-desc on first render
// ---------------------------------------------------------------------------

describe('TC-E2-P1-16: Default sort is "Más reciente" on initial page load', () => {
  it('should show SortControl with "fecha-desc" selected on initial render', async () => {
    // GIVEN: ClienteListView is rendered fresh with no sort preference set
    const clients = [
      createCliente({ nombre: 'Empresa Antigua', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Empresa Reciente', createdAt: '2026-06-29T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    // WHEN: Route renders without any prior sort preference
    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByTestId('sort-control')).toBeInTheDocument();
    });

    // THEN: SortControl shows "fecha-desc" as the selected value ("Más reciente")
    expect(screen.getByTestId('sort-control')).toHaveValue('fecha-desc');
  });

  it('should display the newest client first by default (createdAt descending)', async () => {
    // GIVEN: 2 clients with known dates — "Reciente" is newer than "Antigua"
    const clients = [
      createCliente({ nombre: 'Empresa Antigua', createdAt: '2026-01-01T00:00:00Z' }),
      createCliente({ nombre: 'Empresa Reciente', createdAt: '2026-06-29T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    // WHEN: Route renders (no sort selection made)
    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Empresa Reciente')).toBeInTheDocument();
    });

    // THEN: "Empresa Reciente" appears before "Empresa Antigua" in the list
    const names = getDisplayedClientNames();
    expect(names.findIndex((n) => n.includes('Empresa Reciente'))).toBeLessThan(
      names.findIndex((n) => n.includes('Empresa Antigua'))
    );
  });

  it('should not require user interaction to apply default fecha-desc sort', async () => {
    // GIVEN: 3 clients with dates Jan, Jun, Mar
    const clients = [
      createCliente({ nombre: 'Enero SA', createdAt: '2026-01-15T00:00:00Z' }),
      createCliente({ nombre: 'Junio Corp', createdAt: '2026-06-15T00:00:00Z' }),
      createCliente({ nombre: 'Marzo Ltda', createdAt: '2026-03-15T00:00:00Z' }),
    ];
    server.use(handleGetClientesSuccess(clients));

    // WHEN: Component renders — no user interaction
    await renderClientesRoute();

    await waitFor(() => {
      expect(screen.getByText('Enero SA')).toBeInTheDocument();
      expect(screen.getByText('Junio Corp')).toBeInTheDocument();
      expect(screen.getByText('Marzo Ltda')).toBeInTheDocument();
    });

    // THEN: Order is Junio (newest), Marzo, Enero (oldest) — default fecha-desc applied automatically
    const names = getDisplayedClientNames();
    const idxJunio = names.findIndex((n) => n.includes('Junio Corp'));
    const idxMarzo = names.findIndex((n) => n.includes('Marzo Ltda'));
    const idxEnero = names.findIndex((n) => n.includes('Enero SA'));

    expect(idxJunio).toBeLessThan(idxMarzo);
    expect(idxMarzo).toBeLessThan(idxEnero);
  });
});
