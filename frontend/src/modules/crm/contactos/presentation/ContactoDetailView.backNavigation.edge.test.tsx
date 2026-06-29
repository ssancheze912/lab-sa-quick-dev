/**
 * Edge case component tests — ContactoDetailView back navigation
 * Story 4.3 — Navigate from Client Detail to Contact Detail (Automation Expand phase)
 *
 * Covers edge cases NOT addressed in the ATDD (backNavigation) tests:
 *   EC-1  Loading state: skeleton shown, back link NOT present while loading
 *   EC-2  Error state (non-404): retry panel shown, no back link
 *   EC-3  404 error state: "not found" shown, no back link
 *   EC-4  Back link keyboard accessibility (not tabIndex=-1)
 *   EC-5  Back link has accessible role=link
 *   EC-6  "Volver al cliente" text is exactly in Spanish (mandatory company standard)
 *   EC-7  "Volver a contactos" text is exactly in Spanish (mandatory company standard)
 *   EC-8  Back link with clienteId transition: switching contactoId re-renders correct link
 *   EC-9  Back link inline-flex layout (icon + text are side-by-side)
 *
 * Stack: Vitest + React Testing Library + MSW 2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { createContacto, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import { createCliente, resetClienteCounter } from '../../../../test/factories/cliente.factory';
import { ContactoDetailView } from './ContactoDetailView';

// ---------------------------------------------------------------------------
// Router mock — TanStack Router Link renders as <a> in test environment
// ---------------------------------------------------------------------------

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

  return render(
    <QueryClientProvider client={queryClient}>
      <ContactoDetailView contactoId={contactoId} />
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// EC-1: Loading state — skeleton shown, back link NOT present
// ---------------------------------------------------------------------------

describe('EC-1: Loading state — back link absent during data fetch', () => {
  it('[P2] should NOT show contacto-back-link while contact data is loading', async () => {
    // GIVEN: Contacto API is delayed (simulated with a promise)
    const contactoId = 'load-test-0000-0000-0000-000000000001';
    let resolveContact: (value: unknown) => void;
    const contactPromise = new Promise((resolve) => {
      resolveContact = resolve;
    });

    server.use(
      http.get(`/api/v1/contactos/${contactoId}`, async () => {
        await contactPromise;
        return HttpResponse.json({});
      })
    );

    // WHEN: Component renders before data arrives
    renderContactoDetailView(contactoId);

    // THEN: The back link does not appear during skeleton/loading state
    // Skeleton or loading state should be shown instead
    const backLink = screen.queryByTestId('contacto-back-link');
    expect(backLink).not.toBeInTheDocument();

    // Cleanup: resolve the pending request
    resolveContact!(undefined);
  });

  it('[P2] should show skeleton testid during loading phase', async () => {
    // GIVEN: Contacto API is delayed
    const contactoId = 'skeleton-test-0000-0000-000000000002';
    let resolveContact: (value: unknown) => void;
    const contactPromise = new Promise((resolve) => {
      resolveContact = resolve;
    });

    server.use(
      http.get(`/api/v1/contactos/${contactoId}`, async () => {
        await contactPromise;
        return HttpResponse.json({});
      })
    );

    // WHEN: Rendered (no data yet)
    renderContactoDetailView(contactoId);

    // THEN: Skeleton is shown
    expect(screen.getByTestId('contacto-detail-skeleton')).toBeInTheDocument();

    // Cleanup
    resolveContact!(undefined);
  });
});

// ---------------------------------------------------------------------------
// EC-2: Non-404 error state — retry panel, no back link
// ---------------------------------------------------------------------------

describe('EC-2: API error (non-404) — retry panel shown, back link absent', () => {
  it('[P1] should show error retry panel when API returns 500', async () => {
    // GIVEN: The contact API returns a 500 server error
    const contacto = createContacto({ clienteId: null });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );

    // WHEN: ContactoDetailView is rendered
    renderContactoDetailView(contacto.id);

    // THEN: Error panel with retry button is shown
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-error-panel')).toBeInTheDocument();
    });

    expect(screen.getByTestId('contacto-detail-retry-button')).toBeInTheDocument();
  });

  it('[P1] should NOT show contacto-back-link when contact API returns 500', async () => {
    // GIVEN: Contact API returns server error
    const contacto = createContacto({ clienteId: null });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () =>
        HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      )
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-error-panel')).toBeInTheDocument();
    });

    // THEN: Back link is absent in error state
    expect(screen.queryByTestId('contacto-back-link')).not.toBeInTheDocument();
  });

  it('[P2] should show Spanish error message in error retry panel', async () => {
    // GIVEN: Contact API fails
    const contacto = createContacto();

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () =>
        HttpResponse.json({ error: 'Server Error' }, { status: 500 })
      )
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-error-panel')).toBeInTheDocument();
    });

    // THEN: Error message is in Spanish (mandatory company standard)
    const errorPanel = screen.getByTestId('contacto-detail-error-panel');
    expect(errorPanel.textContent).toMatch(/[Nn]o se pudo/);
  });
});

// ---------------------------------------------------------------------------
// EC-3: 404 error state — "not found" shown, no back link
// ---------------------------------------------------------------------------

describe('EC-3: 404 error state — contact not found, no back link', () => {
  it('[P1] should show not-found panel when contact API returns 404', async () => {
    // GIVEN: Contact does not exist (404)
    const contactoId = 'nonexistent-0000-0000-0000-000000000404';

    server.use(
      http.get(`/api/v1/contactos/${contactoId}`, () =>
        HttpResponse.json({ error: 'Not Found' }, { status: 404 })
      )
    );

    // WHEN: Rendered
    renderContactoDetailView(contactoId);

    // THEN: Not found panel is shown
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-not-found')).toBeInTheDocument();
    });
  });

  it('[P1] should NOT show contacto-back-link when contact is not found (404)', async () => {
    // GIVEN: Contact 404
    const contactoId = 'nonexistent-0000-0000-0000-000000000405';

    server.use(
      http.get(`/api/v1/contactos/${contactoId}`, () =>
        HttpResponse.json({ error: 'Not Found' }, { status: 404 })
      )
    );

    // WHEN: Rendered
    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-not-found')).toBeInTheDocument();
    });

    // THEN: No back navigation link rendered
    expect(screen.queryByTestId('contacto-back-link')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-4: Back link keyboard accessibility — not tabIndex=-1
// ---------------------------------------------------------------------------

describe('EC-4: Back link keyboard accessibility', () => {
  it('[P1] should have contacto-back-link in tab order (tabIndex NOT -1) when clienteId is set', async () => {
    // GIVEN: A contact with a clienteId
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    const backLink = screen.getByTestId('contacto-back-link');

    // THEN: tabIndex is NOT -1 (link must be reachable via keyboard Tab)
    expect(backLink).not.toHaveAttribute('tabindex', '-1');
  });

  it('[P1] should have contacto-back-link in tab order when clienteId is null', async () => {
    // GIVEN: A contact without a clienteId
    const contacto = createContacto({ clienteId: null });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    const backLink = screen.getByTestId('contacto-back-link');

    // THEN: Link is accessible via keyboard
    expect(backLink).not.toHaveAttribute('tabindex', '-1');
  });
});

// ---------------------------------------------------------------------------
// EC-5: Back link has accessible role=link
// ---------------------------------------------------------------------------

describe('EC-5: Back link has role=link for screen reader accessibility', () => {
  it('[P1] should render "Volver al cliente" as role=link element', async () => {
    // GIVEN: Contact with clienteId
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    // THEN: Back link has role=link (is an <a> element)
    const backLink = screen.getByRole('link', { name: /Volver al cliente/i });
    expect(backLink).toBeInTheDocument();
  });

  it('[P1] should render "Volver a contactos" as role=link element', async () => {
    // GIVEN: Contact without clienteId
    const contacto = createContacto({ clienteId: null });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    // THEN: Back link has role=link
    const backLink = screen.getByRole('link', { name: /Volver a contactos/i });
    expect(backLink).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// EC-6: "Volver al cliente" exact Spanish text (company standard)
// ---------------------------------------------------------------------------

describe('EC-6: Exact Spanish text in back link (mandatory company standard)', () => {
  it('[P1] should display "Volver al cliente" (exact Spanish text) when clienteId is set', async () => {
    // GIVEN: Contact with clienteId
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    const backLink = screen.getByTestId('contacto-back-link');

    // THEN: Text includes "Volver al cliente" in Spanish
    expect(backLink.textContent).toContain('Volver al cliente');

    // AND: Does NOT contain English or other language text
    expect(backLink.textContent).not.toMatch(/back|return|go back/i);
  });

  it('[P1] should display "Volver a contactos" (exact Spanish text) when clienteId is null', async () => {
    // GIVEN: Contact without clienteId
    const contacto = createContacto({ clienteId: null });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    const backLink = screen.getByTestId('contacto-back-link');

    // THEN: Text includes "Volver a contactos" in Spanish
    expect(backLink.textContent).toContain('Volver a contactos');

    // AND: Does NOT contain English text
    expect(backLink.textContent).not.toMatch(/back|return|go back/i);
  });
});

// ---------------------------------------------------------------------------
// EC-7: "Volver a contactos" points to /contactos list route
// ---------------------------------------------------------------------------

describe('EC-7: "Volver a contactos" route boundary — points to list, not a specific contact', () => {
  it('[P1] should have href="/contactos" (list route, not "/contactos/undefined") when clienteId is null', async () => {
    // GIVEN: Contact with clienteId = null
    const contacto = createContacto({ clienteId: null });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    const backLink = screen.getByTestId('contacto-back-link');

    // THEN: href is exactly "/contactos" (not "/contactos/null" or "/contactos/undefined")
    const href = backLink.getAttribute('href');
    expect(href).toBe('/contactos');
    expect(href).not.toContain('null');
    expect(href).not.toContain('undefined');
  });
});

// ---------------------------------------------------------------------------
// EC-8: clienteId boundary — different clienteIds produce correct unique hrefs
// ---------------------------------------------------------------------------

describe('EC-8: Router param boundary — clienteId UUID maps to exact back link href', () => {
  it('[P1] should use exact clienteId UUID in "Volver al cliente" href', async () => {
    // GIVEN: A contact with a specific clienteId UUID
    const specificClienteId = 'client-uuid-4321-0000-000000000099';
    const contacto = createContacto({ clienteId: specificClienteId });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    // THEN: The href contains the exact clienteId UUID
    const backLink = screen.getByTestId('contacto-back-link');
    expect(backLink).toHaveAttribute('href', `/clientes/${specificClienteId}`);

    // AND: Does not contain "undefined" or "null"
    expect(backLink.getAttribute('href')).not.toContain('null');
    expect(backLink.getAttribute('href')).not.toContain('undefined');
  });
});

// ---------------------------------------------------------------------------
// EC-9: Back link layout — icon and text side by side
// ---------------------------------------------------------------------------

describe('EC-9: Back link layout — inline-flex with icon and text', () => {
  it('[P2] should render back link with inline-flex layout class', async () => {
    // GIVEN: Contact with clienteId
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    const backLink = screen.getByTestId('contacto-back-link');

    // THEN: The link has inline-flex layout (icon and text side-by-side)
    const className = backLink.getAttribute('class') || '';
    expect(className).toContain('inline-flex');
  });

  it('[P2] should render icon AND text content in the back link', async () => {
    // GIVEN: Contact with clienteId
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    const backLink = screen.getByTestId('contacto-back-link');

    // THEN: SVG icon is present (ArrowLeftIcon from Heroicons)
    const svgIcon = backLink.querySelector('svg');
    expect(svgIcon).not.toBeNull();

    // AND: Text content includes "Volver"
    expect(backLink.textContent).toContain('Volver');
  });
});
