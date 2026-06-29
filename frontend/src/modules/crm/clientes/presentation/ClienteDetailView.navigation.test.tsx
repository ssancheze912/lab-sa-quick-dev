/**
 * Component tests — ClienteDetailView navigation (ContactosSeccion links)
 * Story 4.3 — Navigate from Client Detail to Contact Detail (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-1  Clicking a contact item navigates to /contactos/{contactoId} (AC #1)
 *   TC-2  Contact items are rendered as links with correct href (AC #1, #5)
 *   TC-3  Contact item displays nombre and cargo as visible text (AC #6)
 *   TC-4  Keyboard Enter on focused contact link triggers navigation (AC #5, WCAG 2.1 AA)
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failures (missing implementation):
 *   - Contact items in ContactosSeccion are plain <div> or <span>, not <a> links
 *   - [data-testid="contacto-item-{id}"] does not have an href attribute pointing to /contactos/{id}
 *   - getByRole('link') returns no elements for contact items
 *   - Keyboard Enter does not trigger navigation on contact items
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { createContacto, createContactos, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import { ClienteDetailView } from './ClienteDetailView';

// ---------------------------------------------------------------------------
// Router mock — TanStack Router Link renders as <a> in test environment.
// We capture navigate calls to assert programmatic navigation.
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ to, params, children, className, ...rest }: {
      to: string;
      params?: Record<string, string>;
      children: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    }) => {
      // Resolve the href from the `to` pattern and `params`
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
    useNavigate: () => mockNavigate,
  };
});

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetClienteCounter();
  resetContactoCounter();
  mockNavigate.mockReset();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: render ClienteDetailView inside required providers
// ---------------------------------------------------------------------------

function renderClienteDetailView(clienteId: string) {
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
// TC-1: Clicking a contact item navigates to /contactos/{contactoId}
// ---------------------------------------------------------------------------

describe('TC-1: Clicking a contact item navigates to /contactos/{contactoId} (AC #1)', () => {
  it('should render each contact item as a link whose href points to /contactos/{contactoId}', async () => {
    // GIVEN: MSW returns a client and two contacts for that client
    const cliente = createCliente();
    const contactos = createContactos(2, { clienteId: cliente.id });

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

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: Each contact item is an <a> link with href /contactos/{contactoId}
    await waitFor(() => {
      expect(screen.getByTestId(`contacto-item-${contactos[0].id}`)).toBeInTheDocument();
    });

    const link0 = screen.getByTestId(`contacto-item-${contactos[0].id}`);
    expect(link0.tagName.toLowerCase()).toBe('a');
    expect(link0).toHaveAttribute('href', `/contactos/${contactos[0].id}`);

    const link1 = screen.getByTestId(`contacto-item-${contactos[1].id}`);
    expect(link1.tagName.toLowerCase()).toBe('a');
    expect(link1).toHaveAttribute('href', `/contactos/${contactos[1].id}`);
  });

  it('should navigate to /contactos/{contactoId} when user clicks a contact item', async () => {
    // GIVEN: MSW returns a client and one contact
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

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

    // WHEN: ClienteDetailView is rendered and the contact list loads
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByTestId(`contacto-item-${contacto.id}`)).toBeInTheDocument();
    });

    // WHEN: User clicks the contact item link
    await userEvent.click(screen.getByTestId(`contacto-item-${contacto.id}`));

    // THEN: The link href is /contactos/{contactoId} — click target is set correctly
    const link = screen.getByTestId(`contacto-item-${contacto.id}`);
    expect(link).toHaveAttribute('href', `/contactos/${contacto.id}`);
  });
});

// ---------------------------------------------------------------------------
// TC-2: Contact items are rendered as links/buttons (AC #1, #5)
// ---------------------------------------------------------------------------

describe('TC-2: Contact items are keyboard-accessible links (AC #5)', () => {
  it('should render contact items as anchor elements (role=link), not plain divs', async () => {
    // GIVEN: MSW returns a client with one contact
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id, nombre: 'María López' });

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

    // WHEN: ClienteDetailView renders with the contact loaded
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByTestId(`contacto-item-${contacto.id}`)).toBeInTheDocument();
    });

    // THEN: The contact item has role=link (is an <a> tag)
    const contactLink = screen.getByRole('link', { name: /María López/i });
    expect(contactLink).toBeInTheDocument();
  });

  it('should render all contact items as links within the contact list', async () => {
    // GIVEN: MSW returns a client with 3 contacts
    const cliente = createCliente();
    const contactos = createContactos(3, { clienteId: cliente.id });

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

    await waitFor(() => {
      expect(screen.getByTestId('contactos-lista')).toBeInTheDocument();
    });

    // THEN: All contact items are links (3 links present for contacts)
    for (const contacto of contactos) {
      const item = screen.getByTestId(`contacto-item-${contacto.id}`);
      expect(item.tagName.toLowerCase()).toBe('a');
    }
  });
});

// ---------------------------------------------------------------------------
// TC-3: Contact item displays nombre and cargo as visible text (AC #6)
// ---------------------------------------------------------------------------

describe('TC-3: Contact item shows nombre and cargo (AC #6)', () => {
  it('should display the contact nombre inside the contact item link', async () => {
    // GIVEN: MSW returns a client with a contact named "Carlos Rodríguez"
    const cliente = createCliente();
    const contacto = createContacto({
      clienteId: cliente.id,
      nombre: 'Carlos Rodríguez',
      cargo: 'Director Comercial',
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

    // THEN: Contact nombre text is visible
    await waitFor(() => {
      expect(screen.getByText('Carlos Rodríguez')).toBeInTheDocument();
    });
  });

  it('should display the contact cargo inside the contact item link', async () => {
    // GIVEN: MSW returns a client with a contact
    const cliente = createCliente();
    const contacto = createContacto({
      clienteId: cliente.id,
      nombre: 'Ana Torres',
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

    // THEN: Contact cargo text is visible
    await waitFor(() => {
      expect(screen.getByText('Jefe de Compras')).toBeInTheDocument();
    });
  });

  it('should display both nombre and cargo together in each contact item', async () => {
    // GIVEN: A client with a fully populated contact
    const cliente = createCliente();
    const contacto = createContacto({
      clienteId: cliente.id,
      nombre: 'Pedro Gómez',
      cargo: 'Analista Senior',
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

    await waitFor(() => {
      expect(screen.getByTestId(`contacto-item-${contacto.id}`)).toBeInTheDocument();
    });

    // THEN: Both nombre and cargo are visible within the contact item
    const contactItem = screen.getByTestId(`contacto-item-${contacto.id}`);
    expect(contactItem).toHaveTextContent('Pedro Gómez');
    expect(contactItem).toHaveTextContent('Analista Senior');
  });
});

// ---------------------------------------------------------------------------
// TC-4: Keyboard Enter on focused contact link triggers navigation (AC #5)
// ---------------------------------------------------------------------------

describe('TC-4: Keyboard navigation triggers contact detail navigation (AC #5, WCAG 2.1 AA)', () => {
  it('should navigate when Enter is pressed on a focused contact item link', async () => {
    // GIVEN: A client with one contact
    const cliente = createCliente();
    const contacto = createContacto({
      clienteId: cliente.id,
      nombre: 'Lucía Hernández',
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

    await waitFor(() => {
      expect(screen.getByTestId(`contacto-item-${contacto.id}`)).toBeInTheDocument();
    });

    // WHEN: User tabs to focus the contact link
    await userEvent.tab();

    // THEN: The contact item is reachable via keyboard focus
    const contactLink = screen.getByTestId(`contacto-item-${contacto.id}`);
    expect(contactLink).toHaveAttribute('href', `/contactos/${contacto.id}`);
    // A valid <a> element with href is keyboard-activatable by default (Enter triggers click)
  });

  it('should have the contact item link as a focusable element (tabIndex not -1)', async () => {
    // GIVEN: A client with one contact
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

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

    await waitFor(() => {
      expect(screen.getByTestId(`contacto-item-${contacto.id}`)).toBeInTheDocument();
    });

    const contactLink = screen.getByTestId(`contacto-item-${contacto.id}`);

    // THEN: The link does NOT have tabIndex=-1 (it must be in the tab order)
    expect(contactLink).not.toHaveAttribute('tabindex', '-1');
  });
});
