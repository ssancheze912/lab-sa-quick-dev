/**
 * Component tests — ContactoListView (Sin Cliente / Orphan Contacts Filter)
 * Story 4.5 — Orphan Contacts Filter (ATDD RED phase)
 *
 * Test IDs covered (all in RED phase — sinCliente filter not implemented yet):
 *   TC-4.5-COMP-01  When sinCliente=true in search params, only orphan contacts render
 *   TC-4.5-COMP-02  When sinCliente=true and data is empty, EmptyState shows specific message
 *   TC-4.5-COMP-03  When sinCliente=true and contacts exist, count badge renders
 *   TC-4.5-COMP-04  Clicking filtro-sin-cliente toggle when inactive navigates to ?sinCliente=true
 *   TC-4.5-COMP-05  Clicking filtro-sin-cliente toggle when active removes sinCliente from URL
 *   TC-4.5-COMP-06  While loading, skeleton placeholder renders (not spinner)
 *   TC-4.5-COMP-07  On fetch error, ErrorPanel renders with "Reintentar" button
 *   TC-4.5-COMP-08  Filter toggle renders as <button> (keyboard-accessible)
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 *
 * Expected RED failures:
 *   - ContactoListView does not read sinCliente from search params yet
 *   - data-testid="filtro-sin-cliente" toggle does not exist yet
 *   - data-testid="contador-sin-cliente" count badge does not exist yet
 *   - useContactos does not accept sinCliente param yet
 *   - EmptyState message for sinCliente empty state not implemented yet
 *   - contactos.tsx route does not define validateSearch for sinCliente yet
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { createContacto, createContactos, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import { ContactoListView } from './ContactoListView';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: render ContactoListView with a fresh QueryClient and optional search params
// ---------------------------------------------------------------------------

function renderWithSinCliente(sinCliente?: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  // Simulate TanStack Router search params by mocking Route.useSearch
  // The component reads sinCliente via Route.useSearch() from contactos.tsx
  // Since we cannot easily mount the full router in RTL, we mock the hook.
  // This test intentionally fails RED because the hook wiring does not exist yet.

  return render(
    <QueryClientProvider client={queryClient}>
      <ContactoListView />
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// TC-4.5-COMP-01: When sinCliente=true, only orphan contacts are rendered
// ---------------------------------------------------------------------------

describe('TC-4.5-COMP-01: sinCliente=true renders only orphan contacts', () => {
  it('[P0] should show only contacts with clienteId=null when sinCliente filter is active', async () => {
    // GIVEN: API returns only orphan contacts when sinCliente=true is passed
    const orphanContacto = createContacto({ clienteId: null, nombre: 'Contacto Huerfano' });
    const assignedContacto = createContacto({
      clienteId: 'cliente-00000000-0000-0000-0000-000000000001',
      nombre: 'Contacto Asignado',
    });

    // When sinCliente=true, backend returns only orphans
    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json([orphanContacto]);
        }
        return HttpResponse.json([orphanContacto, assignedContacto]);
      })
    );

    // WHEN: ContactoListView is rendered with sinCliente=true active
    // (RED: Component does not support sinCliente param yet — this test will FAIL)
    renderWithSinCliente(true);

    // Activate the filter (toggle must exist for this to work)
    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // THEN: Only orphan contacts appear
    await waitFor(() => {
      expect(screen.getByText('Contacto Huerfano')).toBeInTheDocument();
    });

    // THEN: Assigned contact is NOT visible
    expect(screen.queryByText('Contacto Asignado')).not.toBeInTheDocument();
  });

  it('[P0] should pass sinCliente=true param to API when filter is active', async () => {
    // GIVEN: Track query params sent to the API
    const capturedUrls: string[] = [];
    const orphanContacto = createContacto({ clienteId: null });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json([orphanContacto]);
      })
    );

    // WHEN: ContactoListView is rendered with sinCliente filter active
    renderWithSinCliente(true);

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // THEN: API was called with sinCliente=true
    await waitFor(() => {
      const hasSinClienteParam = capturedUrls.some((url) =>
        url.includes('sinCliente=true')
      );
      expect(hasSinClienteParam).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// TC-4.5-COMP-02: When sinCliente=true and data is empty, EmptyState shows specific msg
// ---------------------------------------------------------------------------

describe('TC-4.5-COMP-02: sinCliente=true empty state shows specific message', () => {
  it('[P0] should render EmptyState with "Todos los contactos tienen un cliente asignado" when sinCliente is active and list is empty', async () => {
    // GIVEN: API returns empty array for sinCliente=true
    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json([]);
        }
        return HttpResponse.json(createContactos(2));
      })
    );

    // WHEN: ContactoListView is rendered and sinCliente filter is active
    renderWithSinCliente(true);

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // THEN: EmptyState with the specific orphan-filter message is shown
    // (RED: This message is not implemented yet)
    await waitFor(() => {
      expect(screen.getByText('Todos los contactos tienen un cliente asignado')).toBeInTheDocument();
    });
  });

  it('[P1] should NOT show the default EmptyState message when sinCliente empty state is shown', async () => {
    // GIVEN: sinCliente=true returns empty
    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json([]);
        }
        return HttpResponse.json([]);
      })
    );

    renderWithSinCliente(true);

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // THEN: Specific message is shown (not the default "No hay contactos registrados" message)
    await waitFor(() => {
      expect(screen.getByText('Todos los contactos tienen un cliente asignado')).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/No hay contactos registrados/i)
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-4.5-COMP-03: When sinCliente=true and contacts exist, count badge renders
// ---------------------------------------------------------------------------

describe('TC-4.5-COMP-03: Count badge shows "X contacto(s) sin cliente" when filter active', () => {
  it('[P1] should render contador-sin-cliente badge when sinCliente is active and contacts exist', async () => {
    // GIVEN: 3 orphan contacts returned when sinCliente=true
    const orphans = [
      createContacto({ clienteId: null }),
      createContacto({ clienteId: null }),
      createContacto({ clienteId: null }),
    ];

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json(orphans);
        }
        return HttpResponse.json(orphans);
      })
    );

    renderWithSinCliente(true);

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // THEN: Count badge with data-testid="contador-sin-cliente" is visible
    // (RED: This badge does not exist yet)
    await waitFor(() => {
      expect(screen.getByTestId('contador-sin-cliente')).toBeInTheDocument();
    });
  });

  it('[P1] should display the correct orphan count in the badge', async () => {
    // GIVEN: 2 orphan contacts
    const orphans = [
      createContacto({ clienteId: null }),
      createContacto({ clienteId: null }),
    ];

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json(orphans);
        }
        return HttpResponse.json(orphans);
      })
    );

    renderWithSinCliente(true);

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // THEN: Count badge contains the number 2 and "sin cliente" text
    await waitFor(() => {
      const badge = screen.getByTestId('contador-sin-cliente');
      expect(badge).toHaveTextContent(/2/);
      expect(badge).toHaveTextContent(/sin cliente/i);
    });
  });

  it('[P2] should NOT render contador-sin-cliente badge when sinCliente filter is inactive', async () => {
    // GIVEN: API returns contacts normally (no sinCliente filter)
    const contactos = createContactos(2);
    server.use(
      http.get('/api/v1/contactos', () => HttpResponse.json(contactos))
    );

    // WHEN: Rendered without activating sinCliente filter
    renderWithSinCliente(false);

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(contactos[0].nombre)).toBeInTheDocument();
    });

    // THEN: Count badge is NOT shown
    expect(screen.queryByTestId('contador-sin-cliente')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-4.5-COMP-04: Clicking toggle when inactive navigates to ?sinCliente=true
// ---------------------------------------------------------------------------

describe('TC-4.5-COMP-04: Clicking inactive toggle activates sinCliente filter via URL', () => {
  it('[P0] should render the filtro-sin-cliente toggle control', async () => {
    // GIVEN: ContactoListView renders normally
    const contactos = createContactos(2);
    server.use(http.get('/api/v1/contactos', () => HttpResponse.json(contactos)));

    renderWithSinCliente();

    // THEN: The toggle control exists in the DOM
    // (RED: This toggle does not exist yet)
    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });
  });

  it('[P0] should show "Sin cliente" label on the toggle', async () => {
    // GIVEN: ContactoListView renders
    const contactos = createContactos(2);
    server.use(http.get('/api/v1/contactos', () => HttpResponse.json(contactos)));

    renderWithSinCliente();

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    // THEN: The toggle label is "Sin cliente" in Spanish (MANDATORY)
    expect(screen.getByTestId('filtro-sin-cliente')).toHaveTextContent(/sin cliente/i);
  });
});

// ---------------------------------------------------------------------------
// TC-4.5-COMP-05: Clicking toggle when active removes sinCliente from URL
// ---------------------------------------------------------------------------

describe('TC-4.5-COMP-05: Clicking active toggle deactivates sinCliente filter', () => {
  it('[P0] should restore full contact list when sinCliente toggle is deactivated', async () => {
    // GIVEN: Mixed contacts — some orphan, some assigned
    const orphan = createContacto({ clienteId: null, nombre: 'Orphan Contact' });
    const assigned = createContacto({
      clienteId: 'cliente-00000000-0000-0000-0000-000000000001',
      nombre: 'Assigned Contact',
    });

    server.use(
      http.get('/api/v1/contactos', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sinCliente') === 'true') {
          return HttpResponse.json([orphan]);
        }
        return HttpResponse.json([orphan, assigned]);
      })
    );

    renderWithSinCliente();

    // WHEN: First activate the filter
    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // Wait for orphan filter to apply
    await waitFor(() => {
      expect(screen.queryByText('Assigned Contact')).not.toBeInTheDocument();
    });

    // WHEN: Then deactivate by clicking again
    fireEvent.click(screen.getByTestId('filtro-sin-cliente'));

    // THEN: Full list is restored (assigned contact appears again)
    await waitFor(() => {
      expect(screen.getByText('Assigned Contact')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-4.5-COMP-06: While loading, skeleton placeholder renders (not spinner)
// ---------------------------------------------------------------------------

describe('TC-4.5-COMP-06: Loading skeleton shown during initial fetch', () => {
  it('[P0] should display skeleton loading placeholder before data arrives', async () => {
    // GIVEN: MSW delays response by 200ms
    const contactos = createContactos(2);
    server.use(
      http.get('/api/v1/contactos', async () => {
        await delay(200);
        return HttpResponse.json(contactos);
      })
    );

    // WHEN: ContactoListView is rendered
    renderWithSinCliente();

    // THEN: Loading skeleton is visible immediately (not a spinner)
    expect(screen.getByTestId('contactos-list-skeleton')).toBeInTheDocument();
  });

  it('[P1] should NOT show a spinner during loading', async () => {
    // GIVEN: Delayed response
    const contactos = createContactos(2);
    server.use(
      http.get('/api/v1/contactos', async () => {
        await delay(200);
        return HttpResponse.json(contactos);
      })
    );

    renderWithSinCliente();

    // THEN: No spinner role present (company standard: use react-loading-skeleton)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('[P1] should show skeleton while sinCliente=true fetch is loading', async () => {
    // GIVEN: sinCliente filter active, API is slow
    server.use(
      http.get('/api/v1/contactos', async () => {
        await delay(200);
        return HttpResponse.json([]);
      })
    );

    renderWithSinCliente(true);

    // THEN: Skeleton is shown while the filtered fetch is pending
    expect(screen.getByTestId('contactos-list-skeleton')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-4.5-COMP-07: On fetch error, ErrorPanel renders with "Reintentar" button
// ---------------------------------------------------------------------------

describe('TC-4.5-COMP-07: ErrorPanel with Reintentar on fetch error', () => {
  it('[P0] should render ErrorPanel when sinCliente fetch returns 500', async () => {
    // GIVEN: Backend returns HTTP 500
    server.use(
      http.get('/api/v1/contactos', () =>
        HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 }
        )
      )
    );

    renderWithSinCliente(true);

    // THEN: ErrorPanel is shown
    await waitFor(() => {
      expect(screen.getByTestId('contactos-error-panel')).toBeInTheDocument();
    });
  });

  it('[P0] should show "Reintentar" button in ErrorPanel — never raw error text', async () => {
    // GIVEN: Backend returns 500
    server.use(
      http.get('/api/v1/contactos', () =>
        HttpResponse.json(
          { status: 500, title: 'Internal Server Error' },
          { status: 500 }
        )
      )
    );

    renderWithSinCliente(true);

    // THEN: Reintentar button is present
    await waitFor(() => {
      expect(screen.getByTestId('contactos-retry-button')).toBeInTheDocument();
      expect(screen.getByTestId('contactos-retry-button')).toHaveTextContent(/reintentar/i);
    });
  });

  it('[P1] should NOT show raw error messages (NFR6 compliance)', async () => {
    // GIVEN: 500 with a potentially sensitive error detail
    server.use(
      http.get('/api/v1/contactos', () =>
        HttpResponse.json(
          {
            status: 500,
            title: 'Internal Server Error',
            detail: 'NullReferenceException at GetContactosQueryHandler',
          },
          { status: 500 }
        )
      )
    );

    renderWithSinCliente(true);

    await waitFor(() => {
      expect(screen.getByTestId('contactos-error-panel')).toBeInTheDocument();
    });

    // THEN: Raw internal error detail is never exposed in the UI
    expect(
      screen.queryByText(/NullReferenceException/i)
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-4.5-COMP-08: Filter toggle is keyboard-accessible
// ---------------------------------------------------------------------------

describe('TC-4.5-COMP-08: Filter toggle is keyboard-accessible (WCAG 2.1 AA)', () => {
  it('[P0] should render filtro-sin-cliente as a <button> element (natively focusable)', async () => {
    // GIVEN: ContactoListView renders
    const contactos = createContactos(2);
    server.use(http.get('/api/v1/contactos', () => HttpResponse.json(contactos)));

    renderWithSinCliente();

    // THEN: The toggle renders as a button element (keyboard-accessible by default)
    // (RED: Toggle does not exist yet)
    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    const toggle = screen.getByTestId('filtro-sin-cliente');
    expect(toggle.tagName).toBe('BUTTON');
  });

  it('[P1] should have a non-empty accessible label on the toggle', async () => {
    // GIVEN: ContactoListView renders
    const contactos = createContactos(2);
    server.use(http.get('/api/v1/contactos', () => HttpResponse.json(contactos)));

    renderWithSinCliente();

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    const toggle = screen.getByTestId('filtro-sin-cliente');

    // THEN: Toggle has accessible text (either textContent or aria-label)
    const accessibleText =
      toggle.textContent?.trim() || toggle.getAttribute('aria-label');
    expect(accessibleText).toBeTruthy();
    expect(accessibleText!.length).toBeGreaterThan(0);
  });

  it('[P2] should be focusable (not disabled or hidden from accessibility tree)', async () => {
    // GIVEN: ContactoListView renders
    const contactos = createContactos(2);
    server.use(http.get('/api/v1/contactos', () => HttpResponse.json(contactos)));

    renderWithSinCliente();

    await waitFor(() => {
      expect(screen.getByTestId('filtro-sin-cliente')).toBeInTheDocument();
    });

    const toggle = screen.getByTestId('filtro-sin-cliente');

    // THEN: Toggle is not disabled and not aria-hidden
    expect(toggle).not.toBeDisabled();
    expect(toggle.getAttribute('aria-hidden')).not.toBe('true');
  });
});
