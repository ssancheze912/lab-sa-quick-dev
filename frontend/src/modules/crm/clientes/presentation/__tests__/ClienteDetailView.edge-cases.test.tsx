// Story 2.2 — ClienteDetailView edge cases (BMad-Integrated Expansion)
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { ClienteDetailView } from '../ClienteDetailView';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

const mockCliente1 = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'Empresa Uno SA',
  nit: '900111111-1',
  telefono: '+573001111111',
  ciudad: 'Bogotá',
  createdAt: '2026-01-01T00:00:00+00:00',
  updatedAt: '2026-01-01T00:00:00+00:00',
};

const mockCliente2 = {
  id: '00000000-0000-0000-0000-000000000002',
  nombre: 'Empresa Dos SAS',
  nit: '900222222-2',
  telefono: '+573002222222',
  ciudad: 'Medellín',
  createdAt: '2026-02-01T00:00:00+00:00',
  updatedAt: '2026-02-01T00:00:00+00:00',
};

const mockClienteEmptyOptionals = {
  id: '00000000-0000-0000-0000-000000000003',
  nombre: 'Sin Teléfono Corp',
  nit: '900333333-3',
  telefono: '',
  ciudad: '',
  createdAt: '2026-01-01T00:00:00+00:00',
  updatedAt: '2026-01-01T00:00:00+00:00',
};

const server = setupServer(
  http.get(`${BASE_URL}/api/v1/clientes/:id`, ({ params }) => {
    if (params.id === mockCliente1.id) return HttpResponse.json(mockCliente1);
    if (params.id === mockCliente2.id) return HttpResponse.json(mockCliente2);
    if (params.id === mockClienteEmptyOptionals.id) return HttpResponse.json(mockClienteEmptyOptionals);
    return HttpResponse.json({ title: 'Cliente no encontrado.', status: 404 }, { status: 404 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-08: data-testid contract for E2E tests
// ─────────────────────────────────────────────────────────────────────────────

describe('E2E contract — data-testid attributes on detail fields', () => {
  it('[P1][TC-2.2-C-08] Given valid clienteId, When detail renders, Then data-testid="cliente-detail-panel" is present', async () => {
    renderWithProviders(<ClienteDetailView clienteId={mockCliente1.id} />);

    await screen.findByText(mockCliente1.nombre);

    expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
  });

  it('[P1][TC-2.2-C-08b] Given valid clienteId, When detail renders, Then data-testid="cliente-detail-nombre" contains the client name', async () => {
    renderWithProviders(<ClienteDetailView clienteId={mockCliente1.id} />);

    await screen.findByText(mockCliente1.nombre);

    const nombreEl = screen.getByTestId('cliente-detail-nombre');
    expect(nombreEl).toBeInTheDocument();
    expect(nombreEl.textContent).toContain(mockCliente1.nombre);
  });

  it('[P1][TC-2.2-C-08c] Given valid clienteId, When detail renders, Then data-testid attributes for nit, telefono, ciudad are present', async () => {
    renderWithProviders(<ClienteDetailView clienteId={mockCliente1.id} />);

    await screen.findByText(mockCliente1.nombre);

    expect(screen.getByTestId('cliente-detail-nit')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-detail-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-detail-ciudad')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-07: clienteId prop change → correct new data rendered
// ─────────────────────────────────────────────────────────────────────────────

describe('Prop update — clienteId changes fetch new data', () => {
  it('[P1][TC-2.2-C-07] Given detail shows cliente1, When clienteId prop changes to cliente2, Then new client data is displayed', async () => {
    const queryClient = makeQueryClient();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={mockCliente1.id} />
      </QueryClientProvider>
    );

    // GIVEN: First client is displayed
    await screen.findByText(mockCliente1.nombre);

    // WHEN: clienteId prop changes to second client
    rerender(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={mockCliente2.id} />
      </QueryClientProvider>
    );

    // THEN: Second client data is shown
    await screen.findByText(mockCliente2.nombre);
    expect(screen.queryByText(mockCliente1.nombre)).not.toBeInTheDocument();
  });

  it('[P1][TC-2.2-C-11] Given detail shows a client, When clienteId changes to undefined, Then placeholder message is shown immediately', async () => {
    const queryClient = makeQueryClient();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={mockCliente1.id} />
      </QueryClientProvider>
    );

    await screen.findByText(mockCliente1.nombre);

    // WHEN: clienteId becomes undefined (user deselects)
    rerender(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={undefined} />
      </QueryClientProvider>
    );

    // THEN: Placeholder shown immediately, no client data
    expect(
      screen.getByText(/Selecciona un cliente de la lista para ver su detalle/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(mockCliente1.nombre)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-09: Reintentar button is keyboard accessible
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — Reintentar button keyboard navigation', () => {
  it('[P1][TC-2.2-C-09] Given ErrorPanel shown, When user presses Tab then Enter on Reintentar, Then retry is triggered', async () => {
    let callCount = 0;

    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Error' }, { status: 500 });
        }
        return HttpResponse.json(mockCliente1);
      })
    );

    renderWithProviders(<ClienteDetailView clienteId={mockCliente1.id} />);

    // Wait for ErrorPanel
    await screen.findByTestId('error-panel');
    const retryBtn = screen.getByRole('button', { name: /reintentar/i });

    // WHEN: User focuses and presses Enter (keyboard activation)
    retryBtn.focus();
    await userEvent.keyboard('{Enter}');

    // THEN: Data loads after keyboard-triggered retry
    await screen.findByText(mockCliente1.nombre);
    expect(callCount).toBe(2);
  });

  it('[P2][TC-2.2-C-09b] Given ErrorPanel shown, When rendered, Then Reintentar button has type="button" (not submit)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json({ error: 'Error' }, { status: 500 })
      )
    );

    renderWithProviders(<ClienteDetailView clienteId={mockCliente1.id} />);

    await screen.findByTestId('error-panel');
    const retryBtn = screen.getByRole('button', { name: /reintentar/i });

    // WCAG: button type prevents accidental form submission
    expect(retryBtn).toHaveAttribute('type', 'button');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-10: Empty optional fields (telefono/ciudad) do not crash
// ─────────────────────────────────────────────────────────────────────────────

describe('Boundary — empty optional fields render without crash', () => {
  it('[P2][TC-2.2-C-10] Given client with empty telefono and ciudad, When rendered, Then component shows without crash and nombre/nit are visible', async () => {
    renderWithProviders(<ClienteDetailView clienteId={mockClienteEmptyOptionals.id} />);

    // THEN: Component renders without throwing, required fields visible
    await screen.findByText(mockClienteEmptyOptionals.nombre);
    expect(screen.getByText(mockClienteEmptyOptionals.nit)).toBeInTheDocument();

    // AND: No JS error thrown — data-testid fields for nit, telefono, ciudad are rendered (even if empty)
    expect(screen.getByTestId('cliente-detail-nit')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-detail-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-detail-ciudad')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-12: Error messages in Spanish — no English leakage (NFR)
// ─────────────────────────────────────────────────────────────────────────────

describe('NFR — Error messages in Spanish (no English leakage)', () => {
  it('[P1][TC-2.2-C-12] Given network error, When ErrorPanel shown, Then the informational text is in Spanish', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );

    renderWithProviders(<ClienteDetailView clienteId={mockCliente1.id} />);

    await screen.findByTestId('error-panel');

    // THEN: Spanish text present
    expect(
      screen.getByText(/No fue posible cargar la información/i)
    ).toBeInTheDocument();

    // AND: Raw English error text NOT exposed
    expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/error\.message/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.2-C-13: 404 vs 500/503 error — distinct UI rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('Error type distinction — 404 not-found vs generic error', () => {
  it('[P1][TC-2.2-C-13a] Given 404 response, When rendered, Then not-found message is shown (NOT ErrorPanel)', async () => {
    renderWithProviders(<ClienteDetailView clienteId="non-existent-id" />);

    await screen.findByText(/Cliente no encontrado/i);

    // THEN: 404 shows not-found text, NOT the ErrorPanel
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });

  it('[P1][TC-2.2-C-13b] Given 503 response, When rendered, Then ErrorPanel is shown (NOT not-found message)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 })
      )
    );

    renderWithProviders(<ClienteDetailView clienteId={mockCliente1.id} />);

    await screen.findByTestId('error-panel');

    // THEN: 503 shows ErrorPanel with retry, NOT the 404 message
    expect(screen.queryByText(/Cliente no encontrado/i)).not.toBeInTheDocument();
  });

  it('[P1][TC-2.2-C-13c] Given 401 response, When rendered, Then ErrorPanel is shown (generic error, not 404 treatment)', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/clientes/:id`, () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
      )
    );

    renderWithProviders(<ClienteDetailView clienteId={mockCliente1.id} />);

    await screen.findByTestId('error-panel');
    expect(screen.queryByText(/Cliente no encontrado/i)).not.toBeInTheDocument();
  });
});
