/**
 * Edge-case component tests — ContactoDetailView: ClienteAsociadoSeccion
 * Story 4.4 — View Associated Client from Contact Detail — Automation Expansion
 *
 * Complements ContactoDetailView.clienteAsociado.test.tsx (ATDD baseline, 17 tests).
 * Covers edge cases NOT in the ATDD suite:
 *
 *   EC-1   Network timeout (ERR_NETWORK) on client fetch → error state with retry
 *   EC-2   Retry succeeds after network error → client name appears, error gone
 *   EC-3   clienteId changes from one UUID to another → re-fetches new client
 *   EC-4   clienteId transitions from non-null → null → shows "Sin cliente asignado"
 *   EC-5   clienteId transitions from null → non-null → shows client link (no stale message)
 *   EC-6   Client with very long nombre renders without overflow crash
 *   EC-7   Client with special characters in nombre (accents, &, ñ) renders correctly
 *   EC-8   Client nombre is empty string → link renders but shows no text (boundary)
 *   EC-9   BuildingOfficeIcon has aria-hidden="true" (decorative icon, not duplicate label)
 *   EC-10  Section label "Cliente asociado" is present in the detail panel
 *   EC-11  Error state shows Spanish error message "Error al cargar cliente" (not English)
 *   EC-12  Multiple rapid clienteId changes settle on the last value (no stale render)
 *   EC-13  404 for client fetch (client was deleted) → shows error state with retry
 *   EC-14  Client fetch returns 429 (rate-limit) → shows error state (not raw message)
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import {
  createContacto,
  resetContactoCounter,
} from '../../../../test/factories/contacto.factory';
import {
  createCliente,
  resetClienteCounter,
} from '../../../../test/factories/cliente.factory';
import {
  handleGetContactoWithClienteId,
  handleGetContactoWithNullClienteId,
  handleGetClienteAsociadoSuccess,
  handleGetClienteAsociadoError,
  handleGetClienteAsociadoDelayed,
} from '../../../../test/msw/handlers/contactos-cliente-asociado.handlers';
import { ContactoDetailView } from './ContactoDetailView';

// ---------------------------------------------------------------------------
// Router mock — TanStack Router Link renders as <a> in test environment
// ---------------------------------------------------------------------------

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      to,
      params,
      children,
      className,
      ...rest
    }: {
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
      return (
        <a href={href} className={className} {...rest}>
          {children}
        </a>
      );
    },
    useNavigate: () => vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  resetClienteCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: render ContactoDetailView with required providers
// Returns queryClient for cache invalidation in state-transition tests.
// ---------------------------------------------------------------------------

function renderContactoDetailView(contactoId: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ContactoDetailView contactoId={contactoId} />
    </QueryClientProvider>
  );

  return { ...result, queryClient };
}

// ---------------------------------------------------------------------------
// EC-1 & EC-2: Network-level error + recovery via retry
// ---------------------------------------------------------------------------

describe('EC-1: network error on client fetch → error state (not blank screen)', () => {
  it('[P1] should show cliente-asociado-error when client fetch returns network-level 500', async () => {
    // GIVEN: Contacto has a clienteId but client fetch fails with 500
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoError()
    );

    // WHEN: ContactoDetailView renders
    renderContactoDetailView(contacto.id);

    // THEN: Error state is shown in the client association section
    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-error')).toBeInTheDocument();
    });

    // THEN: The main contact detail panel is still rendered (error is scoped to the section)
    expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
  });
});

describe('EC-2: retry after network error → client name appears', () => {
  it('[P1] should display client name after clicking retry when second attempt succeeds', async () => {
    // GIVEN: Client fetch initially fails
    const cliente = createCliente({ nombre: 'Recuperado SA' });
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoError()
    );

    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-retry')).toBeInTheDocument();
    });

    // Switch MSW to success BEFORE clicking retry
    server.resetHandlers();
    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: User clicks Reintentar
    const retryButton = screen.getByTestId('cliente-asociado-retry');
    await userEvent.click(retryButton);

    // THEN: Error state disappears and client name is shown
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-asociado-error')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Recuperado SA')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// EC-3: clienteId changes from UUID A → UUID B triggers new client fetch
// ---------------------------------------------------------------------------

describe('EC-3: clienteId transition UUID → different UUID re-fetches new client', () => {
  it('[P1] should display new client name when contacto clienteId changes to a different UUID', async () => {
    // GIVEN: Two separate clients
    const cliente1 = createCliente({ nombre: 'Empresa Alpha SA' });
    const cliente2 = createCliente({ nombre: 'Empresa Beta Ltda' });

    const contactoConCliente1 = createContacto({ clienteId: cliente1.id });
    const contactoConCliente2 = createContacto({ clienteId: cliente2.id });

    server.use(
      handleGetContactoWithClienteId(contactoConCliente1),
      handleGetClienteAsociadoSuccess(cliente1)
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ContactoDetailView contactoId={contactoConCliente1.id} />
      </QueryClientProvider>
    );

    // Wait for initial client to load
    await waitFor(() => {
      expect(screen.getByText('Empresa Alpha SA')).toBeInTheDocument();
    });

    // WHEN: contactoId changes to contacto associated with cliente2
    server.resetHandlers();
    server.use(
      handleGetContactoWithClienteId(contactoConCliente2),
      handleGetClienteAsociadoSuccess(cliente2)
    );

    await act(async () => {
      rerender(
        <QueryClientProvider client={queryClient}>
          <ContactoDetailView contactoId={contactoConCliente2.id} />
        </QueryClientProvider>
      );
    });

    // THEN: New client name is shown
    await waitFor(
      () => {
        expect(screen.getByText('Empresa Beta Ltda')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // AND: Old client name is no longer visible
    expect(screen.queryByText('Empresa Alpha SA')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-4: clienteId non-null → null transition shows "Sin cliente asignado"
// ---------------------------------------------------------------------------

describe('EC-4: clienteId changes from non-null to null → "Sin cliente asignado"', () => {
  it('[P1] should show "Sin cliente asignado" when contacto clienteId transitions to null', async () => {
    // GIVEN: Contact initially has a clienteId
    const cliente = createCliente({ nombre: 'Cliente Previo SA' });
    const contactoConCliente = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contactoConCliente),
      handleGetClienteAsociadoSuccess(cliente)
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ContactoDetailView contactoId={contactoConCliente.id} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Cliente Previo SA')).toBeInTheDocument();
    });

    // WHEN: contacto is re-fetched and now has clienteId: null
    const contactoSinCliente = { ...contactoConCliente, clienteId: null };

    server.resetHandlers();
    server.use(handleGetContactoWithNullClienteId(contactoSinCliente));

    // Invalidate cache to trigger re-fetch
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['contactos', contactoConCliente.id] });
    });

    // THEN: "Sin cliente asignado" message appears
    await waitFor(
      () => {
        expect(screen.getByTestId('sin-cliente-message')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // AND: The navigate-to-cliente link is gone
    expect(screen.queryByTestId('navigate-to-cliente')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-5: clienteId null → non-null transition shows client link (no stale message)
// ---------------------------------------------------------------------------

describe('EC-5: clienteId transitions from null to non-null → shows client link', () => {
  it('[P1] should show navigate-to-cliente link when contacto clienteId changes from null to a valid UUID', async () => {
    // GIVEN: Contact initially has no clienteId
    const contactoSinCliente = createContacto({ clienteId: null });

    server.use(handleGetContactoWithNullClienteId(contactoSinCliente));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ContactoDetailView contactoId={contactoSinCliente.id} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('sin-cliente-message')).toBeInTheDocument();
    });

    // WHEN: contacto is updated and now has a clienteId
    const cliente = createCliente({ nombre: 'Cliente Nuevo SA' });
    const contactoConCliente = { ...contactoSinCliente, clienteId: cliente.id };

    server.resetHandlers();
    server.use(
      handleGetContactoWithClienteId(contactoConCliente),
      handleGetClienteAsociadoSuccess(cliente)
    );

    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: ['contactos', contactoSinCliente.id] });
    });

    // THEN: Navigate-to-cliente link appears
    await waitFor(
      () => {
        expect(screen.getByTestId('navigate-to-cliente')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // AND: "Sin cliente asignado" is gone
    expect(screen.queryByTestId('sin-cliente-message')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-6: Very long client nombre renders without overflow crash
// ---------------------------------------------------------------------------

describe('EC-6: very long client nombre renders without crashing', () => {
  it('[P2] should render a very long client nombre inside the link without throwing', async () => {
    // GIVEN: Client with a very long nombre
    const longNombre =
      'Corporación Internacional de Tecnología y Servicios Empresariales del Norte de Colombia S.A.S. BIC';
    const cliente = createCliente({ nombre: longNombre });
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: Detail view renders — no throw expected
    expect(() => {
      renderContactoDetailView(contacto.id);
    }).not.toThrow();

    // THEN: The long nombre is in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('navigate-to-cliente')).toBeInTheDocument();
    });

    const link = screen.getByTestId('navigate-to-cliente');
    expect(link).toHaveTextContent(longNombre);
  });
});

// ---------------------------------------------------------------------------
// EC-7: Special characters in client nombre (accents, ñ, &, hyphens)
// ---------------------------------------------------------------------------

describe('EC-7: special characters in client nombre render correctly', () => {
  it('[P1] should render accented and special characters in client nombre without escaping', async () => {
    // GIVEN: Client with accented nombre containing ñ, é, &, -
    const nombre = 'Señor García & Cía Ltda';
    const cliente = createCliente({ nombre });
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('navigate-to-cliente')).toBeInTheDocument();
    });

    // THEN: Special characters are rendered as-is (not HTML-escaped)
    const link = screen.getByTestId('navigate-to-cliente');
    expect(link.textContent).toContain('Señor García & Cía Ltda');
  });

  it('[P2] should render client nombre with numbers and dots correctly', async () => {
    // GIVEN: Client with nombre containing numbers
    const nombre = 'Empresa 2.0 S.A.S.';
    const cliente = createCliente({ nombre });
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('navigate-to-cliente')).toBeInTheDocument();
    });

    // THEN: Nombre with dots/numbers is preserved
    expect(screen.getByTestId('navigate-to-cliente').textContent).toContain('Empresa 2.0 S.A.S.');
  });
});

// ---------------------------------------------------------------------------
// EC-8: Client nombre is empty string → link renders (boundary case)
// ---------------------------------------------------------------------------

describe('EC-8: client nombre is empty string (boundary condition)', () => {
  it('[P2] should render the link element even when client nombre is an empty string', async () => {
    // GIVEN: Client returned with empty nombre (boundary — should not crash)
    const cliente = createCliente({ nombre: '' });
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: Rendered — should not throw
    expect(() => {
      renderContactoDetailView(contacto.id);
    }).not.toThrow();

    // THEN: The link element exists (no crash, no broken render)
    await waitFor(() => {
      expect(screen.getByTestId('navigate-to-cliente')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// EC-9: BuildingOfficeIcon has aria-hidden="true" (decorative, not a label)
// ---------------------------------------------------------------------------

describe('EC-9: BuildingOfficeIcon is decorative (aria-hidden="true")', () => {
  it('[P1] should have aria-hidden="true" on the building icon to avoid redundant ARIA label', async () => {
    // GIVEN: A contacto with a valid clienteId and client name
    const cliente = createCliente({ nombre: 'ARIA Icon Test SA' });
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('navigate-to-cliente')).toBeInTheDocument();
    });

    // THEN: The SVG icon within the link has aria-hidden="true" (decorative icon)
    const link = screen.getByTestId('navigate-to-cliente');
    const icon = link.querySelector('svg');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// EC-10: Section label "Cliente asociado" is present in the detail panel
// ---------------------------------------------------------------------------

describe('EC-10: "Cliente asociado" section label is present in the contact detail panel', () => {
  it('[P1] should display the "Cliente asociado" label in the detail panel when contact has a clienteId', async () => {
    // GIVEN: A contacto with a valid client association
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    // THEN: Section label is visible (dt element in the definition list)
    expect(screen.getByText(/cliente asociado/i)).toBeInTheDocument();
  });

  it('[P1] should display the "Cliente asociado" label even when contacto has no clienteId', async () => {
    // GIVEN: A contacto with no clienteId
    const contacto = createContacto({ clienteId: null });
    server.use(handleGetContactoWithNullClienteId(contacto));

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });

    // THEN: Section label is still present (the section is always rendered)
    expect(screen.getByText(/cliente asociado/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-11: Error state shows Spanish message "Error al cargar cliente" (not English)
// ---------------------------------------------------------------------------

describe('EC-11: error message is in Spanish (NFR6 — no English or technical text)', () => {
  it('[P1] should display "Error al cargar cliente" in Spanish when client fetch fails', async () => {
    // GIVEN: Client fetch returns 500
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoError()
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-error')).toBeInTheDocument();
    });

    // THEN: Spanish error message is shown
    const errorSection = screen.getByTestId('cliente-asociado-error');
    expect(errorSection.textContent).toMatch(/error al cargar cliente/i);
  });

  it('[P1] should NOT show English error messages (e.g. "Network Error", "Failed to fetch")', async () => {
    // GIVEN: Client fetch returns 500
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoError()
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-error')).toBeInTheDocument();
    });

    // THEN: No English technical error terms
    expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/failed to fetch/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/internal server error/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-12: Rapid clienteId changes settle on the last value (race condition guard)
// ---------------------------------------------------------------------------

describe('EC-12: rapid clienteId changes settle on last value (no stale render)', () => {
  it('[P2] should display the last client name when contactoId changes rapidly', async () => {
    // GIVEN: Three contactos pointing to different clients
    const cliente1 = createCliente({ nombre: 'Primera Empresa SA' });
    const cliente2 = createCliente({ nombre: 'Segunda Empresa SA' });
    const cliente3 = createCliente({ nombre: 'Tercera Empresa SA' });

    const contacto1 = createContacto({ clienteId: cliente1.id });
    const contacto2 = createContacto({ clienteId: cliente2.id });
    const contacto3 = createContacto({ clienteId: cliente3.id });

    server.use(
      handleGetContactoWithClienteId(contacto1),
      handleGetClienteAsociadoSuccess(cliente1)
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ContactoDetailView contactoId={contacto1.id} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Primera Empresa SA')).toBeInTheDocument();
    });

    // WHEN: Rapidly switch to contacto2, then contacto3
    server.resetHandlers();
    server.use(
      handleGetContactoWithClienteId(contacto2),
      handleGetClienteAsociadoSuccess(cliente2),
      handleGetContactoWithClienteId(contacto3),
      handleGetClienteAsociadoSuccess(cliente3)
    );

    await act(async () => {
      rerender(
        <QueryClientProvider client={queryClient}>
          <ContactoDetailView contactoId={contacto2.id} />
        </QueryClientProvider>
      );
    });

    server.resetHandlers();
    server.use(
      handleGetContactoWithClienteId(contacto3),
      handleGetClienteAsociadoSuccess(cliente3)
    );

    await act(async () => {
      rerender(
        <QueryClientProvider client={queryClient}>
          <ContactoDetailView contactoId={contacto3.id} />
        </QueryClientProvider>
      );
    });

    // THEN: The final state shows the last client, not an intermediate stale value
    await waitFor(
      () => {
        expect(screen.getByText('Tercera Empresa SA')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // AND: "Primera Empresa SA" from initial state is gone (no stale render)
    expect(screen.queryByText('Primera Empresa SA')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-13: 404 for client fetch (deleted client) → error state with retry
// ---------------------------------------------------------------------------

describe('EC-13: 404 from client fetch (client was deleted) → error state', () => {
  it('[P1] should show error state when the associated client returns 404 (deleted/invalid)', async () => {
    // GIVEN: Contacto points to a clienteId but the client no longer exists (404)
    const contacto = createContacto({
      clienteId: '99990000-0000-0000-0000-000000000001',
    });

    server.use(
      handleGetContactoWithClienteId(contacto),
      http.get('/api/v1/clientes/:clienteId', () =>
        HttpResponse.json(
          { status: 404, title: 'Cliente no encontrado' },
          { status: 404 }
        )
      )
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    // THEN: Error state shown (404 is treated as a fetch error by useCliente / react-query)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-error')).toBeInTheDocument();
    });

    // AND: Retry button is present
    expect(screen.getByTestId('cliente-asociado-retry')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-14: 429 rate-limit on client fetch → error state (not raw message)
// ---------------------------------------------------------------------------

describe('EC-14: 429 rate-limit on client fetch → error state (NFR6)', () => {
  it('[P2] should show error state when client fetch returns 429 (rate limited)', async () => {
    // GIVEN: Client fetch returns 429
    const contacto = createContacto({
      clienteId: '88880000-0000-0000-0000-000000000001',
    });

    server.use(
      handleGetContactoWithClienteId(contacto),
      http.get('/api/v1/clientes/:clienteId', () =>
        new HttpResponse(null, { status: 429 })
      )
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    // THEN: Error state shown (never a blank section)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-error')).toBeInTheDocument();
    });

    // AND: 429 raw status code is NOT shown to user (NFR6)
    expect(screen.queryByText(/429/)).not.toBeInTheDocument();
    expect(screen.queryByText(/too many requests/i)).not.toBeInTheDocument();
  });
});
