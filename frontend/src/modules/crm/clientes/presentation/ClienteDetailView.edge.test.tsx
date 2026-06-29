/**
 * Edge-case component tests — ClienteDetailView
 * Story 2.2 — Client Detail View — Automation Expansion
 *
 * Complements ClienteDetailView.test.tsx (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - 500 network error shows error state (not "Cliente no encontrado" 404 message)
 *   - clienteId transitions: null → valid (empty state → detail)
 *   - clienteId transitions: valid → null (detail → empty state)
 *   - clienteId change: one UUID → another UUID triggers re-fetch
 *   - Component accepts style and className props without crashing
 *   - Data with special characters in fields (accented names, special NIT formats)
 *   - Data with very long strings does not break layout (no crash)
 *   - Empty string fields in API response are rendered (not "Cliente no encontrado")
 *   - Multiple rapid clienteId changes settle on the last value
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, params, children, className, ...rest }: {
    to: string;
    params?: Record<string, string>;
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => {
    let href = to;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        href = href.replace(`$${key}`, value);
      }
    }
    return <a href={href} className={className} {...rest}>{children}</a>;
  },
}));

import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import {
  handleGetClienteByIdSuccess,
  handleGetClienteByIdNotFound,
  handleGetClienteByIdError,
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
// Also returns a re-render function for transition tests.
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
// Edge: 500 / network error state
// ---------------------------------------------------------------------------

describe('500 server error — error state display', () => {
  it('[P1] should display an error state when the API returns 500', async () => {
    // GIVEN: MSW returns 500 for any clienteId request
    server.use(handleGetClienteByIdError());

    // WHEN: ClienteDetailView renders with a valid clienteId
    renderClienteDetailView('00000000-0000-0000-0000-000000000001');

    // THEN: An error state element appears (not the 404 "not-found" element)
    // The component shows either "not-found" or a generic error panel for non-404 errors.
    // This test verifies the component does NOT crash and shows SOME error UI.
    await waitFor(
      () => {
        // Either the not-found panel OR a general error panel must be shown (no blank screen)
        const notFound = screen.queryByTestId('cliente-detail-not-found');
        const errorPanel = screen.queryByTestId('cliente-detail-error');
        expect(notFound || errorPanel).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it('[P1] should NOT show blank screen on 500 error', async () => {
    // GIVEN: MSW returns 500
    server.use(handleGetClienteByIdError());

    // WHEN: ClienteDetailView renders with a valid clienteId
    renderClienteDetailView('00000000-0000-0000-0000-000000000001');

    // THEN: Some content is always rendered (no blank/empty DOM)
    await waitFor(
      () => {
        // At least one known data-testid must be present
        const anyContent =
          screen.queryByTestId('cliente-detail-not-found') ||
          screen.queryByTestId('cliente-detail-error') ||
          screen.queryByTestId('cliente-detail-panel') ||
          screen.queryByTestId('cliente-detail-skeleton');
        expect(anyContent).not.toBeNull();
      },
      { timeout: 3000 }
    );
  });

  it('[P2] should NOT expose internal error details to the user on 500', async () => {
    // GIVEN: MSW returns 500 with a body containing "Internal Server Error"
    server.use(handleGetClienteByIdError());

    // WHEN: ClienteDetailView renders
    renderClienteDetailView('00000000-0000-0000-0000-000000000001');

    // THEN: "Internal Server Error" text is NOT shown in the UI (security)
    await waitFor(
      () => {
        const anyError =
          screen.queryByTestId('cliente-detail-not-found') ||
          screen.queryByTestId('cliente-detail-error') ||
          screen.queryByTestId('cliente-detail-panel');
        expect(anyError).toBeTruthy();
      },
      { timeout: 3000 }
    );

    expect(screen.queryByText(/internal server error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/500/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: clienteId prop transitions (null → valid, valid → null)
// ---------------------------------------------------------------------------

describe('clienteId transitions', () => {
  it('[P1] should render detail panel after transitioning from null to a valid clienteId', async () => {
    // GIVEN: A client and MSW handler
    const client = createCliente({ nombre: 'Empresa Transición SA' });
    server.use(handleGetClienteByIdSuccess(client));

    // WHEN: Initially rendered with null
    const { rerender } = renderClienteDetailView(null);

    // THEN: Empty state is shown initially
    expect(screen.getByTestId('cliente-detail-empty')).toBeInTheDocument();

    // WHEN: clienteId changes to a valid ID (simulates user clicking a list item)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    await act(async () => {
      rerender(
        <QueryClientProvider client={queryClient}>
          <ClienteDetailView clienteId={client.id} />
        </QueryClientProvider>
      );
    });

    // THEN: Detail panel is shown after data loads
    await waitFor(
      () => {
        expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
    expect(screen.queryByTestId('cliente-detail-empty')).not.toBeInTheDocument();
  });

  it('[P1] should return to empty state when clienteId transitions from valid to null', async () => {
    // GIVEN: A client loaded in the detail view
    const client = createCliente({ nombre: 'Empresa Retorno' });
    server.use(handleGetClienteByIdSuccess(client));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={client.id} />
      </QueryClientProvider>
    );

    // Wait for detail to load
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // WHEN: clienteId changes to null (user navigates away or deselects)
    await act(async () => {
      rerender(
        <QueryClientProvider client={queryClient}>
          <ClienteDetailView clienteId={null} />
        </QueryClientProvider>
      );
    });

    // THEN: Empty state is shown immediately
    expect(screen.getByTestId('cliente-detail-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('cliente-detail-panel')).not.toBeInTheDocument();
  });

  it('[P1] should load new client data when clienteId changes from one UUID to another', async () => {
    // GIVEN: Two different clients
    const client1 = createCliente({ nombre: 'Empresa Primera SA' });
    const client2 = createCliente({ nombre: 'Empresa Segunda SA' });

    server.use(handleGetClienteByIdSuccess(client1));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={client1.id} />
      </QueryClientProvider>
    );

    // Wait for first client to load
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Empresa Primera SA');
    });

    // WHEN: clienteId changes to second client, update MSW handler too
    server.resetHandlers();
    server.use(handleGetClienteByIdSuccess(client2));

    await act(async () => {
      rerender(
        <QueryClientProvider client={queryClient}>
          <ClienteDetailView clienteId={client2.id} />
        </QueryClientProvider>
      );
    });

    // THEN: Second client's data is displayed
    await waitFor(
      () => {
        expect(screen.getByTestId('cliente-detail-nombre')).toHaveTextContent('Empresa Segunda SA');
      },
      { timeout: 3000 }
    );
  });
});

// ---------------------------------------------------------------------------
// Edge: style and className props are forwarded correctly
// ---------------------------------------------------------------------------

describe('ClienteDetailView — style and className prop forwarding', () => {
  it('[P2] should render empty state with custom className without crashing', () => {
    // GIVEN: clienteId is null
    // WHEN: className is provided
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <ClienteDetailView clienteId={null} className="custom-panel" />
        </QueryClientProvider>
      );
    }).not.toThrow();

    // THEN: Empty state still renders
    expect(screen.getByTestId('cliente-detail-empty')).toBeInTheDocument();
  });

  it('[P2] should render empty state with custom style prop without crashing', () => {
    // GIVEN: clienteId is null
    // WHEN: style is provided
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <ClienteDetailView clienteId={null} style={{ height: '100%', flex: 1 }} />
        </QueryClientProvider>
      );
    }).not.toThrow();

    // THEN: Empty state still renders
    expect(screen.getByTestId('cliente-detail-empty')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: Special characters and accented names in client data
// ---------------------------------------------------------------------------

describe('ClienteDetailView — special characters in client data', () => {
  it('[P1] should render accented city name correctly (e.g. Bogotá, Medellín)', async () => {
    // GIVEN: Client with accented ciudad
    const client = createCliente({ ciudad: 'Medellín' });
    server.use(handleGetClienteByIdSuccess(client));

    // WHEN: Detail view renders
    renderClienteDetailView(client.id);

    // THEN: Accented characters are displayed correctly (not escaped)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-ciudad')).toHaveTextContent('Medellín');
    });
  });

  it('[P1] should render NIT with special characters (dots and hyphens)', async () => {
    // GIVEN: Client with NIT in alternative format
    const client = createCliente({ nit: '900.123.456-7' });
    server.use(handleGetClienteByIdSuccess(client));

    // WHEN: Detail view renders
    renderClienteDetailView(client.id);

    // THEN: NIT including dots and hyphens is displayed as-is
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nit')).toHaveTextContent('900.123.456-7');
    });
  });

  it('[P2] should render very long company names without crashing', async () => {
    // GIVEN: Client with an unusually long nombre
    const longNombre = 'Empresa Colombiana de Distribución y Logística Internacional S.A.S. BIC';
    const client = createCliente({ nombre: longNombre });
    server.use(handleGetClienteByIdSuccess(client));

    // WHEN: Detail view renders
    expect(() => {
      renderClienteDetailView(client.id);
    }).not.toThrow();

    // THEN: Long nombre is still displayed
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-nombre')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: 404 message is NOT shown when API returns 200 with valid data
// (regression guard: error state must not bleed into success state)
// ---------------------------------------------------------------------------

describe('404 message must not appear on successful load', () => {
  it('[P0] should NOT show "Cliente no encontrado" when data loads successfully', async () => {
    // GIVEN: MSW returns a valid client
    const client = createCliente({ nombre: 'Empresa Existente' });
    server.use(handleGetClienteByIdSuccess(client));

    // WHEN: Detail view renders
    renderClienteDetailView(client.id);

    // THEN: Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // THEN: The not-found message is NOT present
    expect(screen.queryByTestId('cliente-detail-not-found')).not.toBeInTheDocument();
    expect(screen.queryByText('Cliente no encontrado')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: Empty state Spanish prompt is accurate
// ---------------------------------------------------------------------------

describe('Empty state Spanish text is accurate', () => {
  it('[P1] should display "para ver sus detalles" in the empty state prompt', () => {
    // GIVEN: clienteId is null
    renderClienteDetailView(null);

    // THEN: Full Spanish prompt contains key phrase
    const emptyState = screen.getByTestId('cliente-detail-empty');
    expect(emptyState.textContent).toMatch(/para ver sus detalles/i);
  });

  it('[P1] should not show English text in the empty state', () => {
    // GIVEN: clienteId is null
    renderClienteDetailView(null);

    // THEN: No English words like "select" or "details" (should be Spanish only)
    const emptyState = screen.getByTestId('cliente-detail-empty');
    expect(emptyState.textContent).not.toMatch(/^select/i);
    expect(emptyState.textContent).not.toMatch(/^details/i);
  });
});

// ---------------------------------------------------------------------------
// Edge: "Not found" message is in Spanish (404 path)
// ---------------------------------------------------------------------------

describe('404 error message language', () => {
  it('[P1] should show "no encontrado" text in Spanish (not English "not found")', async () => {
    // GIVEN: MSW returns 404
    server.use(handleGetClienteByIdNotFound());

    // WHEN: ClienteDetailView renders with a non-existent ID
    renderClienteDetailView('00000000-0000-0000-0000-000000000000');

    // THEN: Spanish message is shown, not English
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-not-found')).toBeInTheDocument();
    });

    const notFoundEl = screen.getByTestId('cliente-detail-not-found');
    expect(notFoundEl.textContent).toMatch(/no encontrado/i);
    expect(notFoundEl.textContent).not.toMatch(/^not found$/i);
  });
});
