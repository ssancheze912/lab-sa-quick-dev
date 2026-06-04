/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * Component Tests — ClienteDetailView (Vitest + RTL + MSW)
 *
 * Test Cases covered:
 *   TC-E2-P2-02 — ClienteDetailView renders Nombre, NIT/RUC, Teléfono, Ciudad from API
 *   AC2         — Direct render with clienteId loads and displays client (deep link simulation)
 *   TC-E2-P2-03 — MSW returns 404 → renders data-testid="cliente-not-found" gracefully
 *   AC3         — Loading skeleton is visible while fetch is in progress
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createCliente } from '../../../../../test-support/factories/cliente.factory';
import { ClienteDetailView } from '../ClienteDetailView';

// ─── MSW Server Setup ─────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderClienteDetailView(clienteId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-02: ClienteDetailView renders all fields when MSW returns client data
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-02 — ClienteDetailView renders client detail', () => {
  it('renders Nombre, NIT/RUC, Teléfono, Ciudad when API returns client data', async () => {
    // Arrange
    const cliente = createCliente({ nombre: 'Empresa Beta', nit: '900999999-1', telefono: '3009999999', ciudad: 'Medellín' });
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
    );

    // Act
    renderClienteDetailView(cliente.id);

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('cliente-nombre')).toHaveTextContent('Empresa Beta');
    expect(screen.getByTestId('cliente-nit')).toHaveTextContent('900999999-1');
    expect(screen.getByTestId('cliente-telefono')).toHaveTextContent('3009999999');
    expect(screen.getByTestId('cliente-ciudad')).toHaveTextContent('Medellín');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2: Direct render with known clienteId simulates deep link
// ─────────────────────────────────────────────────────────────────────────────

describe('AC2 — Direct render with clienteId loads client (deep link)', () => {
  it('loads and displays client when rendered directly with a known clienteId', async () => {
    // Arrange
    const cliente = createCliente({ nombre: 'Acero Andino', nit: '900100200-1' });
    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
    );

    // Act
    renderClienteDetailView(cliente.id);

    // Assert — data-testid fields are rendered with correct values
    await waitFor(() =>
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument(),
    );
    expect(screen.getByTestId('cliente-nombre')).toHaveTextContent('Acero Andino');
    expect(screen.getByTestId('cliente-nit')).toHaveTextContent('900100200-1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-P2-03 / AC3: MSW returns 404 → graceful not-found
// ─────────────────────────────────────────────────────────────────────────────

describe('TC-E2-P2-03 — ClienteDetailView handles 404 gracefully', () => {
  it('renders cliente-not-found when API returns 404, no JS exception thrown', async () => {
    // Arrange
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    server.use(
      http.get(`*/api/v1/clientes/${nonExistentId}`, () =>
        HttpResponse.json(
          { status: 404, title: 'Not Found', detail: 'El cliente no fue encontrado' },
          { status: 404 },
        ),
      ),
    );

    // Act
    renderClienteDetailView(nonExistentId);

    // Assert — not-found state visible, no detail panel
    await waitFor(() =>
      expect(screen.getByTestId('cliente-not-found')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument();
    // Verify role="status" for accessibility
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 Loading: Loading skeleton visible during fetch
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Loading skeleton visible during fetch', () => {
  it('shows loading skeleton while data is being fetched', async () => {
    // Arrange — use a deferred promise to control when the MSW response resolves
    const cliente = createCliente({ nombre: 'Empresa Gamma' });
    let resolveRequest: ((value: unknown) => void) | undefined;
    const requestDeferred = new Promise((resolve) => { resolveRequest = resolve; });

    server.use(
      http.get(`*/api/v1/clientes/${cliente.id}`, async () => {
        await requestDeferred;
        return HttpResponse.json(cliente);
      }),
    );

    // Act
    renderClienteDetailView(cliente.id);

    // Assert — loading skeleton is visible before response arrives
    expect(screen.getByTestId('cliente-detail-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument();

    // Resolve the pending request and verify skeleton goes away
    resolveRequest?.(undefined);
    await waitFor(() =>
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('cliente-detail-loading')).not.toBeInTheDocument();
  });
});
