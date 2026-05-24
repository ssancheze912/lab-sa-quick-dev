/**
 * Story 2.2: Client Detail View — Component Tests (ATDD RED Phase)
 * Epic 2: Client Management
 *
 * Acceptance Criteria covered:
 *   AC1  — Right panel renders Nombre, NIT/RUC, Teléfono, Ciudad when client is selected
 *   AC4  — Graceful not-found message ("Cliente no encontrado.") on 404
 *   AC5  — Skeleton loading state (react-loading-skeleton) while fetch is in flight
 *   AC6  — ErrorPanel with "Reintentar" button on 5xx; clicking triggers refetch
 *   AC9  — Default empty state in Spanish when no clienteId is present
 *
 * Test status: RED — tests will fail until ClienteDetailView.tsx is implemented.
 * Framework: Vitest + @testing-library/react + MSW
 *
 * Patterns:
 *   - Network-first MSW intercepts configured before render
 *   - Selectors: data-testid and ARIA roles only (no fragile CSS selectors)
 *   - Explicit waits via findBy* — no hard waits
 *   - Given-When-Then structure
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Module under test — does NOT exist yet (RED phase)
// @ts-expect-error module does not exist until implementation
import { ClienteDetailView } from './ClienteDetailView';

// ─────────────────────────────────────────────────────────────────────────────
// Test data
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_ID = '11111111-1111-4111-8111-111111111111';
const NOT_FOUND_ID = '00000000-0000-4000-8000-000000000000';

const mockCliente = {
  id: KNOWN_ID,
  nombre: 'Acme Colombia SAS',
  nit: '900123456-7',
  telefono: '+57 601 234 5678',
  ciudad: 'Bogotá',
  createdAt: '2026-01-10T10:00:00Z',
  updatedAt: '2026-01-10T10:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────────
// MSW server
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer(
  http.get('*/api/v1/clientes/:id', ({ params }) => {
    if (params.id === KNOWN_ID) {
      return HttpResponse.json(mockCliente);
    }
    return HttpResponse.json(
      {
        type: 'https://tools.ietf.org/html/rfc7807',
        title: 'Not Found',
        status: 404,
        detail: `Cliente con id '${params.id}' no encontrado.`,
      },
      { status: 404 }
    );
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test wrapper
// ─────────────────────────────────────────────────────────────────────────────

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AC9 — Default empty state when no clienteId
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — AC9: empty state when no clienteId', () => {
  it('should render the default empty state message when clienteId is undefined', () => {
    // GIVEN: No clienteId is in the URL (user on /clientes, no selection)
    // WHEN: ClienteDetailView is rendered with undefined
    renderWithQuery(<ClienteDetailView clienteId={undefined} />);

    // THEN: Spanish default message is displayed
    expect(
      screen.getByText('Selecciona un cliente para ver sus detalles.')
    ).toBeInTheDocument();
  });

  it('should NOT trigger a network request when clienteId is undefined', () => {
    // GIVEN: No clienteId
    // WHEN: ClienteDetailView renders
    // THEN: MSW onUnhandledRequest: 'error' would fail if a request were made
    renderWithQuery(<ClienteDetailView clienteId={undefined} />);

    // No assertion needed — MSW server would throw on unexpected requests
    expect(
      screen.queryByTestId('cliente-detail-panel')
    ).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — Skeleton loading state while fetch is in flight
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — AC5: skeleton loading state', () => {
  it('should render skeleton rows (NOT a spinner) while loading', async () => {
    // GIVEN: The API is slow / in-flight
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        // Delay the response so we can capture the loading state
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(mockCliente);
      })
    );

    // WHEN: ClienteDetailView is rendered with a valid clienteId
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);

    // THEN: Skeleton rows are rendered (react-loading-skeleton)
    // The component must NOT render a spinner (company UX standard)
    const skeletonRows = screen.getAllByTestId('skeleton-row');
    expect(skeletonRows.length).toBeGreaterThanOrEqual(4);

    // AND: No spinner is rendered
    expect(screen.queryByRole('status', { name: /cargando/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('should set aria-busy="true" on the container while loading', async () => {
    // GIVEN: The API is in-flight
    server.use(
      http.get('*/api/v1/clientes/:id', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(mockCliente);
      })
    );

    // WHEN: ClienteDetailView is rendered
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);

    // THEN: The loading container has aria-busy="true"
    const busyContainer = screen.getByRole('region', { hidden: true });
    expect(busyContainer).toHaveAttribute('aria-busy', 'true');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — All four client fields rendered after successful load
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — AC1: renders all four fields on success', () => {
  it('should render Nombre when data is returned', async () => {
    // GIVEN: GET /api/v1/clientes/:id returns a valid ClienteDto
    // WHEN: ClienteDetailView is rendered with the client id
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);

    // THEN: Nombre field is visible
    expect(await screen.findByText('Acme Colombia SAS')).toBeInTheDocument();
  });

  it('should render NIT/RUC when data is returned', async () => {
    // GIVEN: GET /api/v1/clientes/:id returns a valid ClienteDto
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);

    // THEN: NIT/RUC value is visible
    expect(await screen.findByText('900123456-7')).toBeInTheDocument();
  });

  it('should render Teléfono when data is returned', async () => {
    // GIVEN: GET /api/v1/clientes/:id returns a valid ClienteDto
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);

    // THEN: Teléfono value is visible
    expect(await screen.findByText('+57 601 234 5678')).toBeInTheDocument();
  });

  it('should render Ciudad when data is returned', async () => {
    // GIVEN: GET /api/v1/clientes/:id returns a valid ClienteDto
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);

    // THEN: Ciudad value is visible
    expect(await screen.findByText('Bogotá')).toBeInTheDocument();
  });

  it('should render the detail panel with aria-label="Detalle del cliente"', async () => {
    // GIVEN: A valid clienteId with successful API response
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);

    // THEN: Accessible region is present
    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: 'Detalle del cliente' })
      ).toBeInTheDocument();
    });
  });

  it('should render all 4 field labels in Spanish', async () => {
    // GIVEN: A valid clienteId
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);

    // THEN: All Spanish field labels are present
    await waitFor(() => {
      expect(screen.getByText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByText(/nit\/ruc/i)).toBeInTheDocument();
      expect(screen.getByText(/teléfono/i)).toBeInTheDocument();
      expect(screen.getByText(/ciudad/i)).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — Graceful not-found message on 404
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — AC4: graceful not-found on 404', () => {
  it('should render "Cliente no encontrado." when API returns 404', async () => {
    // GIVEN: The clienteId does not exist in the system
    // WHEN: ClienteDetailView is rendered with the non-existent id
    renderWithQuery(<ClienteDetailView clienteId={NOT_FOUND_ID} />);

    // THEN: A graceful not-found message is shown in Spanish
    expect(
      await screen.findByText('Cliente no encontrado.')
    ).toBeInTheDocument();
  });

  it('should render not-found message with role="status"', async () => {
    // GIVEN: The API returns 404
    renderWithQuery(<ClienteDetailView clienteId={NOT_FOUND_ID} />);

    // THEN: The not-found element has the correct role
    const notFound = await screen.findByRole('status');
    expect(notFound).toHaveTextContent('Cliente no encontrado.');
  });

  it('should NOT render the ErrorPanel when API returns 404 (404 is not a system failure)', async () => {
    // GIVEN: The API returns 404 (a business "not found" condition)
    renderWithQuery(<ClienteDetailView clienteId={NOT_FOUND_ID} />);

    // WHEN: The 404 response is received
    await screen.findByText('Cliente no encontrado.');

    // THEN: The generic ErrorPanel is NOT shown (only used for 5xx / network errors)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Reintentar')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — ErrorPanel with "Reintentar" on 5xx / network failure
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteDetailView — AC6: ErrorPanel on 5xx / network failure', () => {
  it('should render ErrorPanel when GET /api/v1/clientes/:id returns 500', async () => {
    // GIVEN: The backend is unavailable (returns 500)
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );

    // WHEN: ClienteDetailView is rendered with a clienteId
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);

    // THEN: ErrorPanel (role="alert") is displayed
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('should render a "Reintentar" button inside ErrorPanel on 5xx', async () => {
    // GIVEN: The backend returns 500
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );

    // WHEN: ClienteDetailView is rendered
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);

    // THEN: A "Reintentar" button is visible
    expect(await screen.findByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('should trigger a refetch when "Reintentar" is clicked', async () => {
    // GIVEN: First request returns 500, second returns 200
    let callCount = 0;
    server.use(
      http.get('*/api/v1/clientes/:id', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
        return HttpResponse.json(mockCliente);
      })
    );

    const user = userEvent.setup();

    // WHEN: Component renders and shows ErrorPanel
    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);
    const retryBtn = await screen.findByRole('button', { name: /reintentar/i });

    // AND: The user clicks "Reintentar"
    await user.click(retryBtn);

    // THEN: A second request is issued and data is shown
    expect(await screen.findByText('Acme Colombia SAS')).toBeInTheDocument();
    expect(callCount).toBe(2);
  });

  it('should NOT render not-found message when API returns 500', async () => {
    // GIVEN: The backend returns 500 (system failure, not a missing record)
    server.use(
      http.get('*/api/v1/clientes/:id', () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );

    renderWithQuery(<ClienteDetailView clienteId={KNOWN_ID} />);
    await screen.findByRole('alert');

    // THEN: The "not found" message is NOT shown (wrong error type)
    expect(screen.queryByText('Cliente no encontrado.')).not.toBeInTheDocument();
  });
});
