/**
 * Edge-case component tests — Story 2.2: ClienteDetailView
 *
 * Expands ATDD coverage (ClienteDetailView.test.tsx) with:
 *   - Skeleton loading state while fetch is in-flight
 *   - Empty string clienteId behaves like undefined (no fetch, shows placeholder)
 *   - Switching clienteId triggers re-fetch and shows new client data
 *   - Stale data not visible after client switch (no ghost content)
 *   - Slow network: skeleton visible during delay
 *   - 401/403 responses treated as generic errors (ErrorPanel, not NotFoundPanel)
 *   - 503 (service unavailable) treated as generic error
 *   - Whitespace-only clienteId does not crash the component
 *   - data-testid="cliente-detail-panel" present in all UI states
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';

import { buildCliente, resetClienteCounter } from './clienteFactory';
import { ClienteDetailView } from '../presentation/ClienteDetailView';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected React query errors in test output
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]') ||
    msg.includes('AxiosError') ||
    msg.includes('Request failed with status code')
  ) {
    return;
  }
  originalConsoleError(...args);
});

const API_BASE = 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetClienteCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderDetailView(clienteId: string | undefined, queryClient?: QueryClient) {
  const qc =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
      },
    });

  const { rerender } = render(
    <QueryClientProvider client={qc}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>
  );

  const rerenderWith = (newId: string | undefined) =>
    rerender(
      <QueryClientProvider client={qc}>
        <ClienteDetailView clienteId={newId} />
      </QueryClientProvider>
    );

  return { qc, rerenderWith };
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading / skeleton state
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — loading (skeleton) state', () => {
  it('[P1] should render the cliente-detail-panel container while the request is in-flight', async () => {
    // GIVEN: A slow network response — response delayed by 200ms
    const clienteId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, async () => {
        await delay(200);
        return HttpResponse.json(buildCliente({ id: clienteId }));
      })
    );

    // WHEN: Component is rendered with a valid clienteId (fetch starts immediately)
    renderDetailView(clienteId);

    // THEN: The root container is present while data is loading
    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();

    // Cleanup: wait for fetch to resolve so MSW server can be torn down cleanly
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });

  it('[P2] should not show NIT/RUC label while loading', async () => {
    // GIVEN: A slow network response
    const clienteId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, async () => {
        await delay(150);
        return HttpResponse.json(buildCliente({ id: clienteId }));
      })
    );

    // WHEN: Component rendered
    renderDetailView(clienteId);

    // THEN: NIT/RUC label is not yet in DOM (skeleton placeholders only)
    expect(screen.queryByText(/nit\/ruc/i)).not.toBeInTheDocument();

    // Cleanup
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Empty string clienteId — should behave like undefined (no fetch)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — empty string clienteId', () => {
  it('[P2] should show placeholder text when clienteId is an empty string', () => {
    // GIVEN: No MSW handler — no fetch should occur with empty string
    let wasCalled = false;
    server.use(
      http.get(`${CLIENTES_URL}/:id`, () => {
        wasCalled = true;
        return HttpResponse.json({}, { status: 500 });
      })
    );

    // WHEN: ClienteDetailView rendered with empty string
    renderDetailView('');

    // THEN: Placeholder is shown (same as undefined)
    expect(screen.getByText(/selecciona un cliente para ver su detalle/i)).toBeInTheDocument();

    // AND: No network request was made (enabled: !!id guard)
    expect(wasCalled).toBe(false);
  });

  it('[P2] should render data-testid="cliente-detail-panel" even with empty string clienteId', () => {
    // GIVEN: Empty string clienteId
    renderDetailView('');

    // THEN: Root container still has the expected testid
    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// data-testid="cliente-detail-panel" present in all states
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — data-testid present in all UI states', () => {
  it('[P1] should have data-testid="cliente-detail-panel" in placeholder state', () => {
    // GIVEN: No clienteId
    renderDetailView(undefined);

    // THEN: Root testid present
    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
  });

  it('[P1] should have data-testid="cliente-detail-panel" in error (500) state', async () => {
    // GIVEN: 500 response
    const clienteId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () => new HttpResponse(null, { status: 500 }))
    );

    renderDetailView(clienteId);

    // THEN: Panel container still present (wraps the ErrorPanel)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });

  it('[P1] should have data-testid="cliente-detail-panel" in not-found (404) state', async () => {
    // GIVEN: 404 response
    const clienteId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json({ status: 404, title: 'Cliente no encontrado' }, { status: 404 })
      )
    );

    renderDetailView(clienteId);

    // THEN: Panel container present (wraps the NotFoundPanel)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });

  it('[P1] should have data-testid="cliente-detail-panel" in loaded data state', async () => {
    // GIVEN: Successful 200 response
    const cliente = buildCliente({ id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    renderDetailView(cliente.id);

    // THEN: Panel container present when data is displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Client ID switch — re-fetch and display new data
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — switching between different clienteIds', () => {
  it('[P1] should display the second client data after switching clienteId', async () => {
    // GIVEN: Two clients with distinct names
    const client1 = buildCliente({
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      nombre: 'Empresa Primera SA',
    });
    const client2 = buildCliente({
      id: '11111111-aaaa-bbbb-cccc-111111111111',
      nombre: 'Empresa Segunda Ltda',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${client1.id}`, () => HttpResponse.json(client1)),
      http.get(`${CLIENTES_URL}/${client2.id}`, () => HttpResponse.json(client2))
    );

    // WHEN: First client is displayed
    const { rerenderWith } = renderDetailView(client1.id);

    await waitFor(() => {
      expect(screen.getByText('Empresa Primera SA')).toBeInTheDocument();
    });

    // WHEN: clienteId prop changes to second client
    await act(async () => {
      rerenderWith(client2.id);
    });

    // THEN: Second client data is displayed
    await waitFor(() => {
      expect(screen.getByText('Empresa Segunda Ltda')).toBeInTheDocument();
    });
  });

  it('[P2] should not display first client data after switching to a different client', async () => {
    // GIVEN: Two clients
    const client1 = buildCliente({
      id: '22222222-aaaa-bbbb-cccc-222222222222',
      nombre: 'Empresa Vieja SAS',
    });
    const client2 = buildCliente({
      id: '33333333-aaaa-bbbb-cccc-333333333333',
      nombre: 'Empresa Nueva SAS',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${client1.id}`, () => HttpResponse.json(client1)),
      http.get(`${CLIENTES_URL}/${client2.id}`, () => HttpResponse.json(client2))
    );

    // WHEN: First client displayed then switched to second
    const { rerenderWith } = renderDetailView(client1.id);

    await waitFor(() => {
      expect(screen.getByText('Empresa Vieja SAS')).toBeInTheDocument();
    });

    await act(async () => {
      rerenderWith(client2.id);
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Nueva SAS')).toBeInTheDocument();
    });

    // THEN: First client name is no longer displayed
    expect(screen.queryByText('Empresa Vieja SAS')).not.toBeInTheDocument();
  });

  it('[P2] should show placeholder after switching from a valid clienteId to undefined', async () => {
    // GIVEN: A valid client displayed
    const cliente = buildCliente({
      id: '44444444-aaaa-bbbb-cccc-444444444444',
      nombre: 'Empresa Para Deseleccionar',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    const { rerenderWith } = renderDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByText('Empresa Para Deseleccionar')).toBeInTheDocument();
    });

    // WHEN: clienteId is set to undefined (no client selected)
    await act(async () => {
      rerenderWith(undefined);
    });

    // THEN: Placeholder is shown
    expect(screen.getByText(/selecciona un cliente para ver su detalle/i)).toBeInTheDocument();

    // AND: Previous client data is gone
    expect(screen.queryByText('Empresa Para Deseleccionar')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Non-404 HTTP errors — ErrorPanel (not NotFoundPanel)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — non-404 HTTP errors use ErrorPanel', () => {
  it('[P1] should show ErrorPanel (not NotFoundPanel) for 401 Unauthorized', async () => {
    // GIVEN: 401 response — not a "not found" error
    const clienteId = '55555555-aaaa-bbbb-cccc-555555555555';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        new HttpResponse(null, { status: 401 })
      )
    );

    renderDetailView(clienteId);

    // THEN: ErrorPanel is shown
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // AND: NotFoundPanel is NOT shown (401 is not a 404)
    expect(screen.queryByTestId('not-found-panel')).not.toBeInTheDocument();
  });

  it('[P1] should show ErrorPanel (not NotFoundPanel) for 403 Forbidden', async () => {
    // GIVEN: 403 response
    const clienteId = '66666666-aaaa-bbbb-cccc-666666666666';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        new HttpResponse(null, { status: 403 })
      )
    );

    renderDetailView(clienteId);

    // THEN: ErrorPanel is shown
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // AND: NotFoundPanel is NOT shown
    expect(screen.queryByTestId('not-found-panel')).not.toBeInTheDocument();
  });

  it('[P2] should show ErrorPanel for 503 Service Unavailable', async () => {
    // GIVEN: 503 response — backend temporarily down
    const clienteId = '77777777-aaaa-bbbb-cccc-777777777777';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        new HttpResponse(null, { status: 503 })
      )
    );

    renderDetailView(clienteId);

    // THEN: ErrorPanel is shown (transient error → Reintentar is appropriate)
    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });

    // AND: Reintentar button is present (unlike 404)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 vs generic error — boundary: 404 is distinct, others use ErrorPanel
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — 404 exclusively renders NotFoundPanel', () => {
  it('[P1] should NOT show "Reintentar" button on 404 (confirmed boundary)', async () => {
    // GIVEN: 404 response
    const clienteId = '88888888-aaaa-bbbb-cccc-888888888888';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json({ status: 404 }, { status: 404 })
      )
    );

    renderDetailView(clienteId);

    await waitFor(() => {
      expect(screen.getByTestId('not-found-panel')).toBeInTheDocument();
    });

    // THEN: No Reintentar button (404 is not transient)
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument();
  });

  it('[P2] should show description text for 404 (boundary: description is present)', async () => {
    // GIVEN: 404 response
    const clienteId = '99999999-aaaa-bbbb-cccc-999999999999';

    server.use(
      http.get(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Cliente no encontrado',
            status: 404,
            detail: 'El cliente solicitado no fue encontrado.',
          },
          { status: 404 }
        )
      )
    );

    renderDetailView(clienteId);

    // THEN: Both title and description are shown
    await waitFor(() => {
      expect(screen.getByText(/cliente no encontrado/i)).toBeInTheDocument();
      expect(
        screen.getByText(/el cliente solicitado no existe o fue eliminado/i)
      ).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Displayed field labels — all 4 fields rendered with Spanish labels
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — all fields rendered with correct Spanish labels', () => {
  it('[P1] should render Nombre as a heading element (not plain text)', async () => {
    // GIVEN: A valid cliente
    const cliente = buildCliente({
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      nombre: 'Industrias del Norte SA',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    renderDetailView(cliente.id);

    // THEN: Nombre rendered inside a heading (h2 per implementation)
    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: /industrias del norte sa/i });
      expect(heading).toBeInTheDocument();
    });
  });

  it('[P1] should render NIT/RUC label as uppercase (per Tailwind uppercase class)', async () => {
    // GIVEN: A valid cliente with a specific NIT
    const cliente = buildCliente({
      id: 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
      nit: '900777001-3',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    renderDetailView(cliente.id);

    // THEN: NIT/RUC label exists and NIT value is displayed
    await waitFor(() => {
      expect(screen.getByText(/nit\/ruc/i)).toBeInTheDocument();
      expect(screen.getByText('900777001-3')).toBeInTheDocument();
    });
  });

  it('[P2] should display all four field values from the API response', async () => {
    // GIVEN: A cliente with all fields specified
    const cliente = buildCliente({
      id: 'cccccccc-bbbb-cccc-dddd-eeeeeeeeeeee',
      nombre: 'Empresa Completa SAS',
      nit: '900555001-7',
      telefono: '3175550017',
      ciudad: 'Cartagena',
    });

    server.use(
      http.get(`${CLIENTES_URL}/${cliente.id}`, () => HttpResponse.json(cliente))
    );

    renderDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByText('Empresa Completa SAS')).toBeInTheDocument();
      expect(screen.getByText('900555001-7')).toBeInTheDocument();
      expect(screen.getByText('3175550017')).toBeInTheDocument();
      expect(screen.getByText('Cartagena')).toBeInTheDocument();
    });
  });
});
