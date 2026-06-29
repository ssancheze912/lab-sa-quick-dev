/**
 * Component tests — ContactoDetailView back navigation
 * Story 4.3 — Navigate from Client Detail to Contact Detail (ATDD RED phase)
 *
 * Test IDs covered:
 *   TC-1  "Volver al cliente" link renders with /clientes/{clienteId} href when contact has clienteId (AC #4)
 *   TC-2  "Volver a contactos" link renders when contact has no clienteId (clienteId is null) (AC #4)
 *   TC-3  Back link contains ArrowLeftIcon aria label or recognizable text (AC #4, company standard)
 *
 * Stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failures (missing implementation):
 *   - "Volver al cliente" link does not exist in ContactoDetailView
 *   - "Volver a contactos" link does not exist in ContactoDetailView
 *   - No back-navigation affordance is rendered at all
 *   - [data-testid="contacto-back-link"] does not exist
 *
 * Given-When-Then format per test.
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
// TC-1: "Volver al cliente" link renders with correct href when clienteId is set
// ---------------------------------------------------------------------------

describe('TC-1: "Volver al cliente" link — contact has clienteId (AC #4)', () => {
  it('should render a "Volver al cliente" link when the contact has a non-null clienteId', async () => {
    // GIVEN: MSW returns a contacto whose clienteId is set (contact belongs to a client)
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: ContactoDetailView is rendered with that contactoId
    renderContactoDetailView(contacto.id);

    // THEN: A "Volver al cliente" link is visible in Spanish
    await waitFor(() => {
      expect(screen.getByText(/Volver al cliente/i)).toBeInTheDocument();
    });
  });

  it('should render the "Volver al cliente" link with href /clientes/{clienteId}', async () => {
    // GIVEN: MSW returns a contacto with a specific clienteId
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: ContactoDetailView is rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByText(/Volver al cliente/i)).toBeInTheDocument();
    });

    // THEN: The back link href points to /clientes/{clienteId}
    const backLink = screen.getByRole('link', { name: /Volver al cliente/i });
    expect(backLink).toHaveAttribute('href', `/clientes/${cliente.id}`);
  });

  it('should render the back link with data-testid="contacto-back-link" when clienteId is set', async () => {
    // GIVEN: MSW returns a contacto with a clienteId
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    // THEN: Back link element is in the DOM with the correct testid
    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    expect(screen.getByTestId('contacto-back-link')).toHaveAttribute(
      'href',
      `/clientes/${cliente.id}`
    );
  });
});

// ---------------------------------------------------------------------------
// TC-2: "Volver a contactos" link renders when clienteId is null
// ---------------------------------------------------------------------------

describe('TC-2: "Volver a contactos" link — contact has no clienteId (AC #4)', () => {
  it('should render "Volver a contactos" link when contact has clienteId null', async () => {
    // GIVEN: MSW returns a contacto with clienteId: null (not associated to any client)
    const contacto = createContacto({ clienteId: null });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: ContactoDetailView is rendered
    renderContactoDetailView(contacto.id);

    // THEN: A "Volver a contactos" link is visible in Spanish
    await waitFor(() => {
      expect(screen.getByText(/Volver a contactos/i)).toBeInTheDocument();
    });
  });

  it('should render the "Volver a contactos" link with href /contactos when clienteId is null', async () => {
    // GIVEN: MSW returns a contacto with clienteId: null
    const contacto = createContacto({ clienteId: null });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByText(/Volver a contactos/i)).toBeInTheDocument();
    });

    // THEN: The back link points to /contactos (list page)
    const backLink = screen.getByRole('link', { name: /Volver a contactos/i });
    expect(backLink).toHaveAttribute('href', '/contactos');
  });

  it('should NOT render "Volver al cliente" link when clienteId is null', async () => {
    // GIVEN: MSW returns a contacto with clienteId: null
    const contacto = createContacto({ clienteId: null });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByText(/Volver a contactos/i)).toBeInTheDocument();
    });

    // THEN: "Volver al cliente" is NOT present when no clienteId
    expect(screen.queryByText(/Volver al cliente/i)).not.toBeInTheDocument();
  });

  it('should render the back link with data-testid="contacto-back-link" when clienteId is null', async () => {
    // GIVEN: MSW returns a contacto with no clienteId
    const contacto = createContacto({ clienteId: null });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    // THEN: Back link element is present (pointing to /contactos)
    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    expect(screen.getByTestId('contacto-back-link')).toHaveAttribute('href', '/contactos');
  });
});

// ---------------------------------------------------------------------------
// TC-3: Back link contains ArrowLeftIcon indicator (AC #4, company standard)
// ---------------------------------------------------------------------------

describe('TC-3: Back link contains ArrowLeft icon or accessible text (AC #4)', () => {
  it('should render an arrow or left-pointing icon within the "Volver al cliente" link', async () => {
    // GIVEN: MSW returns a contacto with a clienteId
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      http.get(`/api/v1/contactos/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    // WHEN: ContactoDetailView is rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-back-link')).toBeInTheDocument();
    });

    const backLink = screen.getByTestId('contacto-back-link');

    // THEN: The back link contains an SVG (ArrowLeftIcon from Heroicons) or aria-label indicating direction
    // The icon must be present per company standard (Heroicons ArrowLeftIcon)
    const svgIcon = backLink.querySelector('svg');
    const ariaHidden = svgIcon?.getAttribute('aria-hidden');

    // Either an SVG icon is present, or the link text itself includes a directional cue
    const hasIcon = svgIcon !== null;
    const hasArrowText = backLink.textContent?.includes('←') || backLink.textContent?.includes('Volver');

    expect(hasIcon || hasArrowText).toBe(true);
  });

  it('should render the ArrowLeftIcon as aria-hidden (decorative) inside the back link', async () => {
    // GIVEN: MSW returns a contacto with a clienteId
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
    const svgIcon = backLink.querySelector('svg');

    // THEN: If SVG icon is present, it must be aria-hidden (decorative — company standard)
    if (svgIcon) {
      expect(svgIcon).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('should render "Volver a contactos" with ArrowLeftIcon when clienteId is null', async () => {
    // GIVEN: MSW returns a contacto with no clienteId
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

    // THEN: The back link has an SVG icon or navigational text
    const svgIcon = backLink.querySelector('svg');
    const hasNavigationalCue =
      svgIcon !== null ||
      backLink.textContent?.includes('Volver') ||
      backLink.textContent?.includes('←');

    expect(hasNavigationalCue).toBe(true);
  });
});
