/**
 * Component tests — ContactoDetailView: Cliente Asociado section
 * Story 4.4 — View Associated Client from Contact Detail (ATDD RED phase)
 *
 * Acceptance Criteria covered:
 *   AC #1  Contact with clienteId → client name displayed in detail view
 *   AC #2  Clicking client name link → router navigates to /clientes/:clienteId
 *   AC #3  Navigation requires no more than 1 click (link renders directly, no intermediate step)
 *   AC #4  Contact with clienteId null → "Sin cliente asignado" message displayed
 *   AC #5  Loading state → skeleton placeholder rendered in client association section
 *   AC #6  Fetch error → error state with retry option, no raw error message
 *   AC #7  Client name link is keyboard-accessible (rendered as <a>, focusable via Tab/Enter)
 *
 * Test IDs (RED phase — ClienteAsociadoSeccion does not exist in ContactoDetailView yet):
 *   TC-1  AC #1  — client name appears when contact has non-null clienteId
 *   TC-2  AC #1  — cliente-asociado-section container rendered with correct data-testid
 *   TC-3  AC #2  — navigate-to-cliente link href resolves to /clientes/{clienteId}
 *   TC-4  AC #3  — link renders directly (1-click navigation — no modal or extra step)
 *   TC-5  AC #4  — "Sin cliente asignado" displayed when clienteId is null
 *   TC-6  AC #4  — cliente-asociado-section still renders even when clienteId is null
 *   TC-7  AC #5  — skeleton placeholder shown while client fetch is in-flight
 *   TC-8  AC #6  — error state rendered when client fetch fails
 *   TC-9  AC #6  — retry button present in error state, triggers refetch
 *   TC-10 AC #6  — no raw error message or stack trace shown on error
 *   TC-11 AC #7  — client link renders as <a> element (natively keyboard-focusable)
 *   TC-12 AC #7  — client link has focus-visible ring class (WCAG 2.1 AA)
 *
 * Expected RED failures (missing implementation):
 *   - [data-testid="cliente-asociado-section"] does not exist
 *   - [data-testid="navigate-to-cliente"] does not exist
 *   - [data-testid="sin-cliente-message"] does not exist
 *   - [data-testid="cliente-loading-skeleton"] does not exist
 *   - Client name is never rendered in ContactoDetailView
 *
 * Stack: Vitest + React Testing Library + MSW 2
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
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
  handleGetClienteAsociadoDelayed,
  handleGetClienteAsociadoError,
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
// TC-1 & TC-2: Client name and section container — AC #1
// ---------------------------------------------------------------------------

describe('TC-1: Client name displayed when contact has non-null clienteId (AC #1)', () => {
  it('should display the associated client nombre when contacto has a non-null clienteId', async () => {
    // GIVEN: A contacto associated with a client, and MSW returns both resources
    const cliente = createCliente({ nombre: 'Empresa Siesa SA' });
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: ContactoDetailView is rendered
    renderContactoDetailView(contacto.id);

    // THEN: The client nombre is visible in the detail view
    await waitFor(() => {
      expect(screen.getByText('Empresa Siesa SA')).toBeInTheDocument();
    });
  });
});

describe('TC-2: cliente-asociado-section container rendered (AC #1)', () => {
  it('should render [data-testid="cliente-asociado-section"] when contact has clienteId', async () => {
    // GIVEN: MSW returns a contacto with a clienteId and a valid client
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: ContactoDetailView is rendered
    renderContactoDetailView(contacto.id);

    // THEN: The cliente-asociado-section wrapper is present in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-section')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-3 & TC-4: Navigation link — AC #2 and AC #3
// ---------------------------------------------------------------------------

describe('TC-3: navigate-to-cliente link href resolves to /clientes/{clienteId} (AC #2)', () => {
  it('should render [data-testid="navigate-to-cliente"] with href /clientes/{clienteId}', async () => {
    // GIVEN: A contacto associated with a specific client
    const cliente = createCliente({ nombre: 'TechCorp Colombia' });
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: ContactoDetailView renders and client data loads
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('navigate-to-cliente')).toBeInTheDocument();
    });

    // THEN: The link href points to the correct client detail route
    const link = screen.getByTestId('navigate-to-cliente');
    expect(link).toHaveAttribute('href', `/clientes/${cliente.id}`);
  });

  it('should render the client nombre as the link text inside navigate-to-cliente', async () => {
    // GIVEN: Client with a known nombre
    const cliente = createCliente({ nombre: 'Industrias Norte Ltda' });
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

    // THEN: The link's visible text is the client nombre
    const link = screen.getByTestId('navigate-to-cliente');
    expect(link).toHaveTextContent('Industrias Norte Ltda');
  });
});

describe('TC-4: Navigation requires no more than 1 click to reach client detail (AC #3)', () => {
  it('should render navigate-to-cliente as a direct link (no modal or intermediate step required)', async () => {
    // GIVEN: A contacto with a clienteId and the client data loaded
    const cliente = createCliente();
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

    // THEN: The element is a direct clickable link — no extra step or confirmation needed
    const link = screen.getByTestId('navigate-to-cliente');
    // A <Link> rendered as <a> with an href satisfies "1 click to navigate"
    expect(link.tagName.toLowerCase()).toBe('a');
    expect(link).toHaveAttribute('href');
  });
});

// ---------------------------------------------------------------------------
// TC-5 & TC-6: "Sin cliente asignado" when clienteId is null — AC #4
// ---------------------------------------------------------------------------

describe('TC-5: "Sin cliente asignado" message when clienteId is null (AC #4)', () => {
  it('should display "Sin cliente asignado" when the contact has no associated client', async () => {
    // GIVEN: A contacto with clienteId: null
    const contacto = createContacto({ clienteId: null });

    server.use(handleGetContactoWithNullClienteId(contacto));

    // WHEN: ContactoDetailView is rendered
    renderContactoDetailView(contacto.id);

    // THEN: The "Sin cliente asignado" message is visible in Spanish
    await waitFor(() => {
      expect(screen.getByText('Sin cliente asignado')).toBeInTheDocument();
    });
  });

  it('should render [data-testid="sin-cliente-message"] when clienteId is null', async () => {
    // GIVEN: MSW returns a contacto with no clienteId
    const contacto = createContacto({ clienteId: null });

    server.use(handleGetContactoWithNullClienteId(contacto));

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    // THEN: The sin-cliente-message element is in the DOM
    await waitFor(() => {
      expect(screen.getByTestId('sin-cliente-message')).toBeInTheDocument();
    });
  });

  it('should NOT render navigate-to-cliente link when clienteId is null', async () => {
    // GIVEN: A contacto with no associated client
    const contacto = createContacto({ clienteId: null });

    server.use(handleGetContactoWithNullClienteId(contacto));

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByText('Sin cliente asignado')).toBeInTheDocument();
    });

    // THEN: No navigation link to client detail is rendered
    expect(screen.queryByTestId('navigate-to-cliente')).not.toBeInTheDocument();
  });
});

describe('TC-6: cliente-asociado-section present even when clienteId is null (AC #4)', () => {
  it('should still render [data-testid="cliente-asociado-section"] when clienteId is null', async () => {
    // GIVEN: A contacto with clienteId: null
    const contacto = createContacto({ clienteId: null });

    server.use(handleGetContactoWithNullClienteId(contacto));

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    // THEN: The section container is present (shows "Sin cliente asignado" inside it)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-section')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-7: Loading skeleton while client fetch is in-flight — AC #5
// ---------------------------------------------------------------------------

describe('TC-7: Skeleton placeholder shown during client data fetch (AC #5)', () => {
  it('should display [data-testid="cliente-loading-skeleton"] while client fetch is in-flight', async () => {
    // GIVEN: Contacto fetch resolves immediately; client fetch is delayed
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoDelayed(cliente, 300)
    );

    // WHEN: ContactoDetailView renders — contacto loads but client is still loading
    renderContactoDetailView(contacto.id);

    // THEN: The skeleton placeholder is visible in the client association section
    await waitFor(() => {
      expect(screen.getByTestId('cliente-loading-skeleton')).toBeInTheDocument();
    });

    // THEN: After client data arrives, skeleton disappears and client name shows
    await waitFor(
      () => {
        expect(screen.queryByTestId('cliente-loading-skeleton')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByText(cliente.nombre)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-8, TC-9, TC-10: Error state — AC #6
// ---------------------------------------------------------------------------

describe('TC-8: Error state rendered when client fetch fails (AC #6)', () => {
  it('should render an error state in the cliente-asociado-section when client fetch returns 500', async () => {
    // GIVEN: Contacto has a clienteId but the client fetch returns 500
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoError()
    );

    // WHEN: ContactoDetailView renders
    renderContactoDetailView(contacto.id);

    // THEN: An error state is shown in the client association section
    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-error')).toBeInTheDocument();
    });
  });
});

describe('TC-9: Retry button present and triggers refetch on client fetch error (AC #6)', () => {
  it('should render a retry button ([data-testid="cliente-asociado-retry"]) when client fetch fails', async () => {
    // GIVEN: Client fetch returns 500
    const cliente = createCliente();
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoError()
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    // THEN: A retry button is visible in the client section error state
    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-retry')).toBeInTheDocument();
    });

    expect(screen.getByTestId('cliente-asociado-retry')).toHaveTextContent(/reintentar/i);
  });

  it('should trigger a new client fetch when retry button is clicked', async () => {
    // GIVEN: Client fetch initially fails, then succeeds on retry
    const cliente = createCliente({ nombre: 'Empresa Recuperada' });
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoError()
    );

    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByTestId('cliente-asociado-retry')).toBeInTheDocument();
    });

    // Switch to success handler
    server.resetHandlers();
    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: User clicks Reintentar
    fireEvent.click(screen.getByTestId('cliente-asociado-retry'));

    // THEN: Error state disappears and client name appears
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-asociado-error')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Empresa Recuperada')).toBeInTheDocument();
    });
  });
});

describe('TC-10: No raw error message or stack trace shown on client fetch error (AC #6 / NFR6)', () => {
  it('should NOT expose raw error messages or stack traces when client fetch fails', async () => {
    // GIVEN: Client fetch returns 500 with an internal error message
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

    // THEN: No technical error details are visible
    expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/500/)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-11 & TC-12: Keyboard accessibility — AC #7
// ---------------------------------------------------------------------------

describe('TC-11: Client link renders as <a> element (natively keyboard-focusable) (AC #7)', () => {
  it('should render navigate-to-cliente as an <a> tag so it is natively focusable via Tab', async () => {
    // GIVEN: A contacto with a valid clienteId
    const cliente = createCliente();
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

    // THEN: The element tag is <a> — natively keyboard-focusable without tabIndex workarounds
    const link = screen.getByTestId('navigate-to-cliente');
    expect(link.tagName.toLowerCase()).toBe('a');
  });

  it('should make navigate-to-cliente accessible as a link role (WCAG 2.1 AA)', async () => {
    // GIVEN: A contacto with a valid clienteId
    const cliente = createCliente({ nombre: 'Accesible SA' });
    const contacto = createContacto({ clienteId: cliente.id });

    server.use(
      handleGetContactoWithClienteId(contacto),
      handleGetClienteAsociadoSuccess(cliente)
    );

    // WHEN: Rendered
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Accesible SA/i })).toBeInTheDocument();
    });

    // THEN: The element is discoverable via ARIA role=link
    const link = screen.getByRole('link', { name: /Accesible SA/i });
    expect(link).toBeInTheDocument();
  });
});

describe('TC-12: Client link has focus-visible ring class for keyboard navigation (AC #7)', () => {
  it('should include focus-visible ring styling on navigate-to-cliente (WCAG 2.1 AA — company standard)', async () => {
    // GIVEN: A contacto with a valid clienteId
    const cliente = createCliente();
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

    const link = screen.getByTestId('navigate-to-cliente');

    // THEN: The link has focus-visible ring class (company standard for keyboard accessibility)
    // TailwindCSS classes: focus-visible:ring-2 focus-visible:ring-blue-500
    expect(link.className).toMatch(/focus-visible/);
  });
});
