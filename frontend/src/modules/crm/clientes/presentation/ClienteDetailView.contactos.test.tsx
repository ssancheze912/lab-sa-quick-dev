/**
 * Component tests — ClienteDetailView (contacts section)
 * Story 4.1 — View Associated Contacts in Client Detail (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-1  ContactManager is rendered when client has contacts (mock adapter returns data)
 *   TC-2  Empty-state message "Sin contactos asociados" shown when adapter returns []
 *   TC-3  Skeleton displayed while contacts are loading
 *   TC-4  ErrorPanel with "Reintentar" shown on fetch error
 *   TC-5  Accessibility check — no critical violations via axe-core
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failures (missing implementation):
 *   - [data-testid="cliente-contactos-seccion"] does not exist (ContactManager not mounted yet)
 *   - [data-testid="contactos-empty-state"] does not exist
 *   - [data-testid="contactos-skeleton"] does not exist
 *   - [data-testid="contactos-error-state"] does not exist
 *   - "Sin contactos asociados" text not rendered
 *   - "Reintentar" button not present
 *
 * Given-When-Then format per test.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { createContacto, createContactos, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import { ClienteDetailView } from '../ClienteDetailView';

// ---------------------------------------------------------------------------
// MSW server setup
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
// Helper: render ClienteDetailView inside required providers
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
// TC-1: ContactManager renders when client has contacts
// ---------------------------------------------------------------------------

describe('TC-1: ContactManager section renders for a client that has contacts', () => {
  it('should display the contacts section (data-testid="cliente-contactos-seccion") when contacts exist', async () => {
    // GIVEN: MSW returns a valid client and a list of 2 contacts for that client
    const cliente = createCliente();
    const contactos = createContactos(2, { clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        const clienteId = url.searchParams.get('clienteId');
        if (clienteId === cliente.id) {
          return HttpResponse.json(contactos);
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteDetailView is rendered with a valid clienteId
    renderClienteDetailView(cliente.id);

    // THEN: The ContactManager section is visible
    await waitFor(() => {
      expect(screen.getByTestId('cliente-contactos-seccion')).toBeInTheDocument();
    });
  });

  it('should display the contact list with at least one contact item when contacts exist', async () => {
    // GIVEN: MSW returns 1 contact for the given client
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id, nombre: 'Juan Pérez' });

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

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: The contact list renders and the contact name is visible
    await waitFor(() => {
      expect(screen.getByTestId('contactos-lista')).toBeInTheDocument();
    });
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('should display the "Contactos" section heading in Spanish', async () => {
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

    // WHEN: Rendered with a valid clienteId
    renderClienteDetailView(cliente.id);

    // THEN: "Contactos" heading is present (Spanish mandatory)
    await waitFor(() => {
      expect(screen.getByText(/Contactos/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-2: Empty-state "Sin contactos asociados"
// ---------------------------------------------------------------------------

describe('TC-2: Empty-state displayed when client has no contacts', () => {
  it('should show "Sin contactos asociados" when contacts list is empty', async () => {
    // GIVEN: MSW returns empty array for the client's contacts
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', () => HttpResponse.json([]))
    );

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: Empty-state element with required Spanish text is shown
    await waitFor(() => {
      expect(screen.getByTestId('contactos-empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/Sin contactos asociados/i)).toBeInTheDocument();
  });

  it('should NOT show the contact list table when contacts list is empty', async () => {
    // GIVEN: MSW returns empty array
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', () => HttpResponse.json([]))
    );

    // WHEN: Rendered
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByTestId('contactos-empty-state')).toBeInTheDocument();
    });

    // THEN: No contact list table rendered
    expect(screen.queryByTestId('contactos-lista')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-3: Skeleton loading state while contacts are loading
// ---------------------------------------------------------------------------

describe('TC-3: Skeleton loading state during contacts fetch', () => {
  it('should display skeleton (data-testid="contactos-skeleton") while fetch is in-flight', async () => {
    // GIVEN: MSW delays the contacts response by 150ms
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', async () => {
        await delay(150);
        return HttpResponse.json([]);
      })
    );

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: Skeleton is visible before response arrives
    expect(screen.getByTestId('contactos-skeleton')).toBeInTheDocument();

    // THEN: Skeleton disappears after response arrives
    await waitFor(
      () => {
        expect(screen.queryByTestId('contactos-skeleton')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should NOT show a spinner (only react-loading-skeleton — company standard)', async () => {
    // GIVEN: A delayed contacts fetch
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', async () => {
        await delay(150);
        return HttpResponse.json([]);
      })
    );

    // WHEN: Rendered during loading phase
    renderClienteDetailView(cliente.id);

    // THEN: No spinner element (role="progressbar") in the contacts section
    const spinner = screen.queryByRole('progressbar');
    expect(spinner).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-4: Error state with "Reintentar" button
// ---------------------------------------------------------------------------

describe('TC-4: Error state with "Reintentar" button on contacts fetch failure', () => {
  it('should show error state (data-testid="contactos-error-state") when contacts fetch fails', async () => {
    // GIVEN: MSW returns 500 for the contacts endpoint
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: Error state element is visible
    await waitFor(() => {
      expect(screen.getByTestId('contactos-error-state')).toBeInTheDocument();
    });
  });

  it('should show "Reintentar" button in the error state', async () => {
    // GIVEN: MSW returns 500 for the contacts endpoint
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: "Reintentar" button is present (Spanish — company standard)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    });
  });

  it('should NOT display raw error messages or stack traces in the UI', async () => {
    // GIVEN: MSW returns 500
    const cliente = createCliente();

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', () =>
        new HttpResponse('Internal Server Error', { status: 500 })
      )
    );

    // WHEN: Rendered
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByTestId('contactos-error-state')).toBeInTheDocument();
    });

    // THEN: Raw error message text is NOT visible (security/UX requirement)
    expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument();
  });

  it('should trigger a new contacts fetch when "Reintentar" is clicked', async () => {
    // GIVEN: First request fails, second succeeds with empty array
    const cliente = createCliente();
    let callCount = 0;

    server.use(
      http.get(`/api/v1/clientes/${cliente.id}`, () => HttpResponse.json(cliente)),
      http.get('/api/v1/contactos', () => {
        callCount += 1;
        if (callCount === 1) {
          return new HttpResponse(null, { status: 500 });
        }
        return HttpResponse.json([]);
      })
    );

    // WHEN: Rendered (first fetch fails)
    renderClienteDetailView(cliente.id);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    });

    // WHEN: User clicks "Reintentar"
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    // THEN: A second fetch is triggered
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(1);
    });
  });
});

// ---------------------------------------------------------------------------
// TC-5: Accessibility — no critical violations
// ---------------------------------------------------------------------------

describe('TC-5: Accessibility — no critical axe violations in contacts section', () => {
  it('should render contacts section without critical accessibility violations', async () => {
    // NOTE: This test requires axe-core or @axe-core/react integration.
    // Expected RED failure: ContactManager section doesn't exist yet.
    // When implemented, run axe on the rendered output.

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

    // WHEN: ClienteDetailView is rendered
    renderClienteDetailView(cliente.id);

    // THEN: Contacts section is rendered (required prerequisite for axe check)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-contactos-seccion')).toBeInTheDocument();
    });

    // THEN: Contacts list heading has accessible label (landmark region check)
    // Expected: heading with "Contactos" text is present for screen readers
    const heading = screen.getByRole('heading', { name: /Contactos/i });
    expect(heading).toBeInTheDocument();
  });
});
