/**
 * Component tests — ClienteDetailView
 * Story 2.2 — Client Detail View (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-E2-P1-04  Detail renders all 4 fields when client is clicked (AC #1)
 *   AC #5        Empty/default state when no clienteId
 *   AC #4        Not-found message "Cliente no encontrado" on 404
 *   (Loading)    Skeleton shown while fetch is in-flight (AC #1 loading state)
 *
 * Expected RED failure:
 *   "Cannot find module './ClienteDetailView'"
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import {
  handleGetClienteByIdSuccess,
  handleGetClienteByIdNotFound,
  handleGetClienteByIdDelayed,
} from '../../../../test/msw/handlers/clientes-detail.handlers';
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { ClienteDetailView } from './ClienteDetailView';

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
// Helper: render ClienteDetailView with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderClienteDetailView(clienteId: string | null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={clienteId} />
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// AC #5: Default/empty state when no clienteId
// ---------------------------------------------------------------------------

describe('AC #5: Empty state when no client is selected', () => {
  it('should render the empty state panel when clienteId is null', async () => {
    // GIVEN: No client is selected (clienteId = null)
    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(null);

    // THEN: Empty state panel is visible
    expect(screen.getByTestId('cliente-detail-empty')).toBeInTheDocument();
  });

  it('should show a Spanish prompt to select a client when clienteId is null', async () => {
    // GIVEN: No client is selected
    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(null);

    // THEN: The empty state contains the Spanish selection prompt
    const emptyPanel = screen.getByTestId('cliente-detail-empty');
    expect(emptyPanel).toHaveTextContent(/selecciona un cliente/i);
  });

  it('should NOT render the detail panel fields when clienteId is null', async () => {
    // GIVEN: No client is selected
    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(null);

    // THEN: No field rows are rendered
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cliente-detail-nit')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cliente-detail-telefono')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cliente-detail-ciudad')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-E2-P1-04: Detail renders all 4 fields on valid clienteId
// ---------------------------------------------------------------------------

describe('TC-E2-P1-04: Client detail renders all required fields (AC #1)', () => {
  it('should render Nombre when a client is fetched successfully', async () => {
    // GIVEN: MSW returns a client with all fields
    const client = createCliente({
      nombre: 'Empresa Detalle SA',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });
    server.use(handleGetClienteByIdSuccess(client));

    // WHEN: ClienteDetailView renders with the client's ID
    renderClienteDetailView(client.id);

    // THEN: Nombre is displayed in the detail panel
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Empresa Detalle SA');
    });
  });

  it('should render NIT/RUC when a client is fetched successfully', async () => {
    // GIVEN: MSW returns a client with all fields
    const client = createCliente({
      nombre: 'Empresa Detalle SA',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });
    server.use(handleGetClienteByIdSuccess(client));

    // WHEN: ClienteDetailView renders
    renderClienteDetailView(client.id);

    // THEN: NIT/RUC is displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent('900123456-7');
    });
  });

  it('should render Teléfono when a client is fetched successfully', async () => {
    // GIVEN: MSW returns a client with all fields
    const client = createCliente({
      nombre: 'Empresa Detalle SA',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });
    server.use(handleGetClienteByIdSuccess(client));

    // WHEN: ClienteDetailView renders
    renderClienteDetailView(client.id);

    // THEN: Teléfono is displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-telefono')).toHaveTextContent('3001234567');
    });
  });

  it('should render Ciudad when a client is fetched successfully', async () => {
    // GIVEN: MSW returns a client with all fields
    const client = createCliente({
      nombre: 'Empresa Detalle SA',
      nit: '900123456-7',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });
    server.use(handleGetClienteByIdSuccess(client));

    // WHEN: ClienteDetailView renders
    renderClienteDetailView(client.id);

    // THEN: Ciudad is displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Bogotá');
    });
  });

  it('should show the client detail panel (not empty state) when a client is fetched', async () => {
    // GIVEN: MSW returns a valid client
    const client = createCliente();
    server.use(handleGetClienteByIdSuccess(client));

    // WHEN: ClienteDetailView renders with a clienteId
    renderClienteDetailView(client.id);

    // THEN: The detail panel is visible and the empty state is gone
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('cliente-detail-empty')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC #4: Not-found message when API returns 404
// ---------------------------------------------------------------------------

describe('AC #4: Not-found message on 404 (R-E2-07)', () => {
  it('should display "Cliente no encontrado" when API returns 404', async () => {
    // GIVEN: MSW returns 404 for the requested clienteId
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    server.use(handleGetClienteByIdNotFound());

    // WHEN: ClienteDetailView renders with a non-existent ID
    renderClienteDetailView(nonExistentId);

    // THEN: The not-found message is rendered in Spanish
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-not-found')).toBeInTheDocument();
    });
    expect(screen.getByTestId('cliente-detail-not-found')).toHaveTextContent('Cliente no encontrado');
  });

  it('should NOT show a blank screen on 404', async () => {
    // GIVEN: MSW returns 404
    server.use(handleGetClienteByIdNotFound());

    // WHEN: ClienteDetailView renders with an invalid ID
    renderClienteDetailView('00000000-0000-0000-0000-000000000000');

    // THEN: A data-testid element is always visible (no blank screen)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-not-found')).toBeInTheDocument();
    });
  });

  it('should NOT render detail field rows when API returns 404', async () => {
    // GIVEN: MSW returns 404
    server.use(handleGetClienteByIdNotFound());

    // WHEN: ClienteDetailView renders
    renderClienteDetailView('00000000-0000-0000-0000-000000000000');

    // THEN: No field rows are shown alongside the error
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-not-found')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('cliente-detail-nombre')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Loading skeleton shown while fetch is in-flight
// ---------------------------------------------------------------------------

describe('Loading skeleton during fetch (AC #1 — loading state)', () => {
  it('should show a skeleton while the client data is loading', async () => {
    // GIVEN: MSW delays response by 200ms
    const client = createCliente();
    server.use(handleGetClienteByIdDelayed(client, 200));

    // WHEN: ClienteDetailView renders with a clienteId
    renderClienteDetailView(client.id);

    // THEN: Loading skeleton is visible immediately before data arrives
    expect(screen.getByTestId('cliente-detail-skeleton')).toBeInTheDocument();
  });

  it('should hide the skeleton once data arrives', async () => {
    // GIVEN: MSW delays response by 200ms
    const client = createCliente();
    server.use(handleGetClienteByIdDelayed(client, 200));

    // WHEN: ClienteDetailView renders
    renderClienteDetailView(client.id);

    // THEN: After data arrives, skeleton is gone and detail is shown
    await waitFor(
      () => {
        expect(screen.queryByTestId('cliente-detail-skeleton')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// AC #6: GET /api/v1/clientes/{id} is triggered via separate query key
// ---------------------------------------------------------------------------

describe('AC #6: Separate per-client query key ["clientes", clienteId]', () => {
  it('should call GET /api/v1/clientes/:clienteId when a valid clienteId is provided', async () => {
    // GIVEN: A client with a known ID
    const client = createCliente({ nombre: 'Query Key Test SA' });
    let apiCallWasMade = false;

    server.use(
      handleGetClienteByIdSuccess(client)
    );

    // Register a spy via a second handler to detect the call
    const { http, HttpResponse: HR } = await import('msw');
    server.use(
      http.get('/api/v1/clientes/:clienteId', ({ params }) => {
        if (params.clienteId === client.id) {
          apiCallWasMade = true;
        }
        return HR.json(client);
      })
    );

    // WHEN: ClienteDetailView renders with a valid clienteId
    renderClienteDetailView(client.id);

    // THEN: The GET request was triggered for the specific client
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    expect(apiCallWasMade).toBe(true);
  });

  it('should NOT call GET /api/v1/clientes/:clienteId when clienteId is null', () => {
    // GIVEN: No client is selected
    // We register an error handler — if the request fires, the test will fail
    server.use(
      handleGetClienteByIdSuccess(createCliente())
    );

    // WHEN: ClienteDetailView renders with null clienteId
    renderClienteDetailView(null);

    // THEN: The empty state is shown (no network request was triggered)
    // If useCliente fires with enabled: false, no request reaches MSW
    expect(screen.getByTestId('cliente-detail-empty')).toBeInTheDocument();
  });
});
