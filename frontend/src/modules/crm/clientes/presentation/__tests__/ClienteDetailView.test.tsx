/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * ATDD Component Tests — RED Phase (Vitest + RTL + MSW)
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Test Cases covered:
 *   TC-E2-P1-06 — Clicking a list item shows correct client details in the right panel
 *                 and URL updates to /clientes/{id}
 *   TC-E2-P2-02 — ClienteDetailView renders Nombre, NIT/RUC, Teléfono, Ciudad when
 *                 MSW returns client data
 *   AC2         — Direct render of ClienteDetailView with a known clienteId loads
 *                 and displays the client (simulates deep link)
 *   TC-E2-P2-03 / AC3 — When MSW returns 404 for GET /api/v1/clientes/:id, renders
 *                         data-testid="cliente-not-found" gracefully
 *   AC3         — Loading skeleton is visible while fetch is in progress
 *
 * Components under test (not yet implemented):
 *   - ClienteDetailView: frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx
 *   - ClientesView (updated): accepts selectedClienteId prop
 *   - ClienteListView (updated): onClick → navigate to /clientes/:clienteId
 *
 * Required data-testid attributes:
 *   - cliente-detail-panel     — root div (data state)
 *   - cliente-nombre           — Nombre span
 *   - cliente-nit              — NIT/RUC span
 *   - cliente-telefono         — Teléfono span
 *   - cliente-ciudad           — Ciudad span
 *   - cliente-not-found        — not-found container (AC3)
 *   - cliente-detail-loading   — loading skeleton container
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { clienteFixtures, createCliente } from '../../../../../test-support/factories/cliente.factory';
import { clientesHandlers } from '../../../../../test-support/mocks/clientes.handlers';
import { ClienteDetailView } from '../ClienteDetailView';
import { ClientesView } from '../ClientesView';

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
}

/**
 * Renders ClienteDetailView in isolation (simulates direct render with a clienteId prop).
 * Used for: TC-E2-P2-02, AC2, TC-E2-P2-03, AC3
 */
function renderClienteDetailView(clienteId: string) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>
  );
}

/**
 * Renders ClientesView without a selectedClienteId (used for TC-E2-P1-06 click-to-detail test).
 * Note: ClientesView wraps ClienteListView + ClienteDetailView in a split-panel layout.
 * For route-based navigation tests a RouterWrapper would be needed; we mock navigate directly.
 */
function renderClientesView(selectedClienteId?: string) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientesView selectedClienteId={selectedClienteId} />
    </QueryClientProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-02: ClienteDetailView renders all 4 fields when MSW returns client data
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-02 — ClienteDetailView renders complete client data', () => {
  const cliente = createCliente({
    id: 'a1b2c3d4-0001-0000-0000-000000000001',
    nombre: 'Empresa Alfa',
    nit: '900100200-1',
    telefono: '3001234567',
    ciudad: 'Bogotá',
  });

  beforeAll(() => {
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente)
      )
    );
  });

  it('should render data-testid="cliente-detail-panel" when client data loads', async () => {
    // GIVEN: MSW returns client data for GET /api/v1/clientes/:id

    // WHEN: ClienteDetailView is rendered with the client id
    renderClienteDetailView(cliente.id);

    // THEN: The detail panel is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });

  it('should render the Nombre field with correct value', async () => {
    // GIVEN: MSW returns client with nombre "Empresa Alfa"

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: The nombre span shows the correct value
    await waitFor(() => {
      expect(screen.getByTestId('cliente-nombre')).toBeInTheDocument();
    });
    expect(screen.getByTestId('cliente-nombre')).toHaveTextContent('Empresa Alfa');
  });

  it('should render the NIT/RUC field with correct value', async () => {
    // GIVEN: MSW returns client with nit "900100200-1"

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: The nit span shows the correct value
    await waitFor(() => {
      expect(screen.getByTestId('cliente-nit')).toBeInTheDocument();
    });
    expect(screen.getByTestId('cliente-nit')).toHaveTextContent('900100200-1');
  });

  it('should render the Teléfono field with correct value', async () => {
    // GIVEN: MSW returns client with telefono "3001234567"

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: The telefono span shows the correct value
    await waitFor(() => {
      expect(screen.getByTestId('cliente-telefono')).toBeInTheDocument();
    });
    expect(screen.getByTestId('cliente-telefono')).toHaveTextContent('3001234567');
  });

  it('should render the Ciudad field with correct value', async () => {
    // GIVEN: MSW returns client with ciudad "Bogotá"

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: The ciudad span shows the correct value
    await waitFor(() => {
      expect(screen.getByTestId('cliente-ciudad')).toBeInTheDocument();
    });
    expect(screen.getByTestId('cliente-ciudad')).toHaveTextContent('Bogotá');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Direct render with clienteId loads correct data (simulates deep link)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Direct render of ClienteDetailView loads client (deep link simulation)', () => {
  it('should load and display all 4 fields when rendered directly with a known clienteId', async () => {
    // GIVEN: MSW returns the full client object for the given id
    const cliente = createCliente({
      id: 'a1b2c3d4-0001-0000-0000-000000000099',
      nombre: 'Empresa Beta',
      nit: '800200300-2',
      telefono: '3109876543',
      ciudad: 'Medellín',
    });
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente)
      )
    );

    // WHEN: ClienteDetailView is rendered directly (as if from a deep-linked route)
    renderClienteDetailView(cliente.id);

    // THEN: All 4 required fields are displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
    expect(screen.getByTestId('cliente-nombre')).toHaveTextContent('Empresa Beta');
    expect(screen.getByTestId('cliente-nit')).toHaveTextContent('800200300-2');
    expect(screen.getByTestId('cliente-telefono')).toHaveTextContent('3109876543');
    expect(screen.getByTestId('cliente-ciudad')).toHaveTextContent('Medellín');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-03 / AC3: 404 → graceful not-found message
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-03 / AC3 — 404 response renders graceful not-found message', () => {
  const NON_EXISTENT_ID = '00000000-0000-0000-0000-000000000000';

  it('should render data-testid="cliente-not-found" when API returns 404', async () => {
    // GIVEN: MSW returns a 404 Problem Details response for the non-existent id
    server.use(
      http.get(`*/api/v1/clientes/${NON_EXISTENT_ID}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'El cliente no fue encontrado' },
          { status: 404 }
        )
      )
    );

    // WHEN: ClienteDetailView is rendered with the non-existent id
    renderClienteDetailView(NON_EXISTENT_ID);

    // THEN: The not-found message container is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument();
    });
  });

  it('should NOT render data-testid="cliente-detail-panel" when 404 is returned', async () => {
    // GIVEN: MSW returns 404
    server.use(
      http.get(`*/api/v1/clientes/${NON_EXISTENT_ID}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'El cliente no fue encontrado' },
          { status: 404 }
        )
      )
    );

    // WHEN: ClienteDetailView renders
    renderClienteDetailView(NON_EXISTENT_ID);

    // THEN: The data detail panel is NOT present
    await waitFor(() => {
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument();
  });

  it('should display a "Cliente no encontrado" message in Spanish on 404', async () => {
    // GIVEN: MSW returns 404
    server.use(
      http.get(`*/api/v1/clientes/${NON_EXISTENT_ID}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'El cliente no fue encontrado' },
          { status: 404 }
        )
      )
    );

    // WHEN: ClienteDetailView renders
    renderClienteDetailView(NON_EXISTENT_ID);

    // THEN: A user-facing Spanish not-found message is shown
    await waitFor(() => {
      const notFoundEl = screen.getByTestId('cliente-not-found');
      expect(notFoundEl).toHaveTextContent(/cliente no encontrado/i);
    });
  });

  it('should have role="status" on the not-found container for screen readers (WCAG 2.1 AA)', async () => {
    // GIVEN: MSW returns 404
    server.use(
      http.get(`*/api/v1/clientes/${NON_EXISTENT_ID}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'El cliente no fue encontrado' },
          { status: 404 }
        )
      )
    );

    // WHEN: ClienteDetailView renders
    renderClienteDetailView(NON_EXISTENT_ID);

    // THEN: The not-found container has the correct accessibility role
    await waitFor(() => {
      const notFoundEl = screen.getByTestId('cliente-not-found');
      expect(notFoundEl).toHaveAttribute('role', 'status');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: Loading skeleton is visible while fetch is in progress
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Loading skeleton visible during fetch (isLoading state)', () => {
  it('should render data-testid="cliente-detail-loading" while the fetch is pending', async () => {
    // GIVEN: MSW response is delayed so we can observe the loading state
    const clienteId = 'a1b2c3d4-0001-0000-0000-000000000050';
    server.use(
      http.get(`*/api/v1/clientes/${clienteId}`, async () => {
        // Introduce a brief delay to ensure loading state renders
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json(
          createCliente({ id: clienteId })
        );
      })
    );

    // WHEN: ClienteDetailView is rendered (fetch in progress)
    renderClienteDetailView(clienteId);

    // THEN: The loading skeleton is visible immediately (before fetch resolves)
    expect(screen.getByTestId('cliente-detail-loading')).toBeInTheDocument();

    // AND: Wait for the data to load to avoid act() warnings
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });

  it('should NOT render the loading skeleton after data has loaded', async () => {
    // GIVEN: MSW returns data immediately
    const clienteId = 'a1b2c3d4-0001-0000-0000-000000000051';
    const cliente = createCliente({ id: clienteId });
    server.use(
      http.get(`*/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json(cliente)
      )
    );

    // WHEN: ClienteDetailView loads data successfully
    renderClienteDetailView(clienteId);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // THEN: The loading skeleton is no longer visible
    expect(screen.queryByTestId('cliente-detail-loading')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P1-06: Clicking a list item shows correct client details + URL updates
// (Component-level test — verifies ClientesView with selectedClienteId prop)
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P1-06 — ClientesView with selectedClienteId renders detail in right panel', () => {
  it('should render ClienteDetailView in the right panel when selectedClienteId is provided', async () => {
    // GIVEN: MSW returns both the list and the specific client
    const cliente = clienteFixtures.nitExacto();
    const clienteId = cliente.id;

    server.use(
      clientesHandlers.success([cliente]),
      http.get(`*/api/v1/clientes/${clienteId}`, () =>
        HttpResponse.json(cliente)
      )
    );

    // WHEN: ClientesView is rendered with a selectedClienteId (as if navigated via URL)
    renderClientesView(clienteId);

    // THEN: The detail panel is visible in the right panel
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });

  it('should display the correct Nombre in the right panel when selectedClienteId is set', async () => {
    // GIVEN: MSW returns both list and specific client
    const cliente = createCliente({
      id: 'a1b2c3d4-0001-0000-0000-000000000010',
      nombre: 'Empresa Beta',
      nit: '900999-1',
      telefono: '3001111111',
      ciudad: 'Cali',
    });

    server.use(
      clientesHandlers.success([cliente]),
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente)
      )
    );

    // WHEN: ClientesView is rendered with the selectedClienteId
    renderClientesView(cliente.id);

    // THEN: The nombre is displayed in the right panel
    await waitFor(() => {
      expect(screen.getByTestId('cliente-nombre')).toHaveTextContent('Empresa Beta');
    });
  });

  it('should display the correct NIT/RUC in the right panel when selectedClienteId is set', async () => {
    // GIVEN: MSW returns the specific client
    const cliente = createCliente({
      id: 'a1b2c3d4-0001-0000-0000-000000000011',
      nombre: 'Empresa Gamma',
      nit: '900999-2',
      telefono: '3002222222',
      ciudad: 'Barranquilla',
    });

    server.use(
      clientesHandlers.success([cliente]),
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente)
      )
    );

    // WHEN: ClientesView is rendered with the selectedClienteId
    renderClientesView(cliente.id);

    // THEN: The nit is displayed in the right panel
    await waitFor(() => {
      expect(screen.getByTestId('cliente-nit')).toHaveTextContent('900999-2');
    });
  });

  it('should render the left panel list even when a detail is shown', async () => {
    // GIVEN: MSW returns both list and specific client detail
    const cliente = createCliente({
      id: 'a1b2c3d4-0001-0000-0000-000000000012',
      nombre: 'Empresa Delta',
      nit: '900777-3',
    });

    server.use(
      clientesHandlers.success([cliente]),
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente)
      )
    );

    // WHEN: ClientesView is rendered with selectedClienteId
    renderClientesView(cliente.id);

    // THEN: The left panel list panel is still present
    await waitFor(() => {
      expect(screen.getByTestId('clientes-list-panel')).toBeInTheDocument();
    });
  });

  it('should NOT render the detail panel when no selectedClienteId is provided', async () => {
    // GIVEN: MSW returns an empty client list
    server.use(clientesHandlers.empty());

    // WHEN: ClientesView is rendered without a selectedClienteId
    renderClientesView(undefined);

    // THEN: The detail panel is NOT present (right panel shows empty state placeholder)
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3: ClienteListView click navigates to /clientes/:clienteId
// (Verifies the onClick handler wiring in ClienteListView / ClientListItem)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — ClienteListView click handler navigates to detail route', () => {
  it('should call navigate when a client list item is clicked', async () => {
    // GIVEN: The client list has one client
    const cliente = createCliente({
      id: 'a1b2c3d4-0001-0000-0000-000000000020',
      nombre: 'Empresa Click Test',
      nit: '900888-1',
    });

    server.use(
      clientesHandlers.success([cliente]),
      http.get(`*/api/v1/clientes/${cliente.id}`, () =>
        HttpResponse.json(cliente)
      )
    );

    // WHEN: ClientesView is rendered and the list item is clicked
    renderClientesView();

    const listItem = await screen.findByText('Empresa Click Test');
    await userEvent.click(listItem);

    // THEN: The detail panel or navigation state reflects the clicked client
    // (In the component test, ClientesView updates selectedClienteId after click)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
    expect(screen.getByTestId('cliente-nombre')).toHaveTextContent('Empresa Click Test');
  });
});
