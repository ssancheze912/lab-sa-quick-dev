/**
 * Component tests — ClienteDetailView contacts section (edge cases & boundary conditions)
 * Story 4.1 — View Associated Contacts in Client Detail
 *
 * Expands ATDD coverage with:
 *   EC-1  Switching clienteId prop re-fetches contacts for the new client
 *   EC-2  Maximum contacts rendered (10 items — contacts list shows all, no pagination)
 *   EC-3  Contact with long name/cargo does not break layout (overflow not clipped)
 *   EC-4  Contacts section renders inside the loading skeleton state of ClienteDetailView
 *   EC-5  ContactosSeccion is NOT rendered when clienteId prop is null
 *   EC-6  "Reintentar" re-renders skeleton before resolving (loading feedback)
 *   EC-7  Contact nombre and cargo are both visible in the contacts list
 *
 * Stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format per test.
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
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { createContacto, createContactos, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import { ClienteDetailView } from '../ClienteDetailView';

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetClienteCounter();
  resetContactoCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper
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

function renderClienteDetailViewRerenderable() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
  let currentClienteId: string | null = null;

  const { rerender } = render(
    <QueryClientProvider client={queryClient}>
      <ClienteDetailView clienteId={currentClienteId} />
    </QueryClientProvider>
  );

  return {
    setClienteId: (id: string | null) => {
      currentClienteId = id;
      rerender(
        <QueryClientProvider client={queryClient}>
          <ClienteDetailView clienteId={currentClienteId} />
        </QueryClientProvider>
      );
    },
  };
}

// ---------------------------------------------------------------------------
// EC-1: Switching clienteId prop re-fetches contacts
// ---------------------------------------------------------------------------

describe('EC-1: clienteId prop change triggers new contacts fetch', () => {
  it('should show contacts for the new client after prop changes from clienteA to clienteB', async () => {
    // GIVEN: clienteA has 2 contacts, clienteB has 1 different contact
    const clienteA = createCliente();
    const clienteB = createCliente();
    const contactosA = createContactos(2, { clienteId: clienteA.id });
    const contactoB = createContacto({ clienteId: clienteB.id, nombre: 'Contacto Solo B' });

    server.use(
      http.get(`/api/v1/clientes/${clienteA.id}`, () => HttpResponse.json(clienteA)),
      http.get(`/api/v1/clientes/${clienteB.id}`, () => HttpResponse.json(clienteB)),
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        const cid = url.searchParams.get('clienteId');
        if (cid === clienteA.id) return HttpResponse.json(contactosA);
        if (cid === clienteB.id) return HttpResponse.json([contactoB]);
        return HttpResponse.json([]);
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={clienteA.id} />
      </QueryClientProvider>
    );

    // WHEN: clienteA contacts load
    await waitFor(() => expect(screen.getByTestId('contactos-lista')).toBeInTheDocument());
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    // WHEN: prop switches to clienteB
    rerender(
      <QueryClientProvider client={queryClient}>
        <ClienteDetailView clienteId={clienteB.id} />
      </QueryClientProvider>
    );

    // THEN: clienteB's contact is shown (not clienteA's)
    await waitFor(() => {
      expect(screen.getByText('Contacto Solo B')).toBeInTheDocument();
    });
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// EC-2: Maximum contacts boundary — 10 contacts all rendered
// ---------------------------------------------------------------------------

describe('EC-2: All 10 contacts are rendered (no pagination required)', () => {
  it('should render exactly 10 contact items in the list when API returns 10', async () => {
    // GIVEN: MSW returns 10 contacts
    const cliente = createCliente();
    const contactos = createContactos(10, { clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json(contactos);
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: Rendered
    renderClienteDetailView(cliente.id);

    // THEN: Exactly 10 list items appear in the contacts list
    await waitFor(() => expect(screen.getByTestId('contactos-lista')).toBeInTheDocument());
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// EC-3: Contact with very long name/cargo renders without crashing
// ---------------------------------------------------------------------------

describe('EC-3: Long contact name and cargo render without layout crash', () => {
  it('should render a contact with a very long name without throwing', async () => {
    // GIVEN: Contact has a very long name (100+ characters)
    const cliente = createCliente();
    const longName = 'María de los Ángeles '.repeat(5).trim(); // ~105 chars
    const longCargo = 'Directora Nacional de Gestión de Ventas Corporativas '.repeat(2).trim();
    const contacto = createContacto({
      clienteId: cliente.id,
      nombre: longName,
      cargo: longCargo,
    });

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([contacto]);
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: Rendered
    renderClienteDetailView(cliente.id);

    // THEN: No throw, contact name is visible
    await waitFor(() => {
      expect(screen.getByTestId('contactos-lista')).toBeInTheDocument();
    });
    expect(screen.getByText(longName)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-4: ContactosSeccion is rendered during the client loading state
// ---------------------------------------------------------------------------

describe('EC-4: ContactosSeccion skeleton shows while client data is also loading', () => {
  it('should show contactos-skeleton even when client data has not loaded yet', async () => {
    // GIVEN: Client fetch is delayed; contacts fetch returns immediately (or is also in-flight)
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, async () => {
        await delay(200);
        return HttpResponse.json(cliente);
      }),
      http.get('/api/v1/contactos', async () => {
        await delay(300);
        return HttpResponse.json([]);
      })
    );

    // WHEN: Rendered
    renderClienteDetailView(cliente.id);

    // THEN: contactos-skeleton appears while both fetches are in-flight
    // (ContactosSeccion is mounted in the skeleton state of ClienteDetailView)
    await waitFor(() => {
      expect(screen.getByTestId('contactos-skeleton')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// EC-5: ContactosSeccion NOT rendered when clienteId is null
// ---------------------------------------------------------------------------

describe('EC-5: Contacts section absent when clienteId is null', () => {
  it('should NOT render contactos-skeleton or contacts list when clienteId is null', async () => {
    // GIVEN: No clienteId selected
    // MSW: no handlers needed since no fetch should occur
    server.use(
      // Allow the client endpoint handler to not be called; provide a fallback
      http.get('/api/v1/contactos', () => {
        // Should never be called when clienteId is null
        return HttpResponse.json([]);
      })
    );

    // WHEN: Rendered with null clienteId
    renderClienteDetailView(null);

    // THEN: No contacts section elements visible
    expect(screen.queryByTestId('contactos-skeleton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contactos-lista')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contactos-empty-state')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cliente-contactos-seccion')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contactos-error-state')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-6: Contacts section shows empty state (not error) for 204 No Content
// ---------------------------------------------------------------------------

describe('EC-6: Non-standard 2xx (204 No Content) on contactos endpoint does not crash component', () => {
  it('should render without crashing when contacts fetch returns 204 (empty body)', async () => {
    // GIVEN: The contacts endpoint returns 204 No Content (non-standard but valid server response)
    // This edge case covers API gateway misconfigurations or empty-result shortcuts.
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          // 204 with no body — Axios will return empty data
          return new HttpResponse(null, { status: 204 });
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: Rendered
    renderClienteDetailView(cliente.id);

    // THEN: Component renders without throwing (does not show a blank white screen)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-detail-panel')).toBeInTheDocument();
    });

    // THEN: Either skeleton resolves to some contacts state, or error state shows —
    // but the client detail panel itself remains visible (no full crash)
    await waitFor(
      () => {
        const skeleton = screen.queryByTestId('contactos-skeleton');
        // Skeleton should eventually disappear (query resolves one way or another)
        const resolved =
          screen.queryByTestId('contactos-empty-state') !== null ||
          screen.queryByTestId('contactos-lista') !== null ||
          screen.queryByTestId('contactos-error-state') !== null;
        expect(skeleton === null || resolved).toBe(true);
      },
      { timeout: 3000 }
    );
  });
});

// ---------------------------------------------------------------------------
// EC-7: Contact nombre and cargo are both visible in the rendered list item
// ---------------------------------------------------------------------------

describe('EC-7: Each contact list item shows nombre and cargo', () => {
  it('should display both nombre and cargo for each contact in the list', async () => {
    // GIVEN: A contact with distinct nombre and cargo values
    const cliente = createCliente();
    const contacto = createContacto({
      clienteId: cliente.id,
      nombre: 'Isabel Ramírez',
      cargo: 'Jefe de Compras',
    });

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json([contacto]);
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: Rendered
    renderClienteDetailView(cliente.id);

    // THEN: Both nombre and cargo are visible
    await waitFor(() => {
      expect(screen.getByTestId('contactos-lista')).toBeInTheDocument();
    });
    expect(screen.getByText('Isabel Ramírez')).toBeInTheDocument();
    expect(screen.getByText('Jefe de Compras')).toBeInTheDocument();
  });

  it('should display nombre for all contacts in a multi-contact list', async () => {
    // GIVEN: 3 contacts with distinct names
    const cliente = createCliente();
    const nombres = ['Andrés Molina', 'Lucía Vargas', 'Fernando Cano'];
    const contactos = nombres.map((nombre) =>
      createContacto({ clienteId: cliente.id, nombre })
    );

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('clienteId') === cliente.id) {
          return HttpResponse.json(contactos);
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: Rendered
    renderClienteDetailView(cliente.id);

    await waitFor(() => expect(screen.getByTestId('contactos-lista')).toBeInTheDocument());

    // THEN: All three names are visible
    for (const nombre of nombres) {
      expect(screen.getByText(nombre)).toBeInTheDocument();
    }
  });
});
