/**
 * Component tests — ContactoDetailView
 * Story 3.2 — Contact Detail View (ATDD RED phase)
 *
 * Test IDs covered (RED phase — ContactoDetailView.tsx does not exist yet):
 *   TC-1: Shows skeleton while loading (AC #5)
 *   TC-2: Shows all contact fields (Nombre, Cargo, Teléfono, Email) when data loaded (AC #1)
 *   TC-3: Shows ErrorPanel with "Reintentar" button on fetch error (AC #4)
 *   TC-4: Shows "Contacto no encontrado" on 404 (AC #3)
 *   TC-5: "Editar" and "Eliminar" buttons are rendered (AC #6, #7)
 *   TC-6: Field labels rendered in Spanish (AC #1)
 *
 * Expected RED failure: "Cannot find module '../ContactoDetailView'"
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { createContacto, resetContactoCounter } from '../../../../test/factories/contacto.factory';
import {
  handleGetContactoByIdSuccess,
  handleGetContactoByIdNotFound,
  handleGetContactoByIdDelayed,
  handleGetContactoByIdError,
} from '../../../../test/msw/handlers/contactos-detail.handlers';
import { ContactoDetailView } from './ContactoDetailView';

// ---------------------------------------------------------------------------
// MSW server setup
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  resetContactoCounter();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

// ---------------------------------------------------------------------------
// Helper: render ContactoDetailView with a fresh QueryClient
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
// TC-2: Shows all contact fields when data is loaded (AC #1)
// ---------------------------------------------------------------------------

describe('TC-2: ContactoDetailView renders all contact fields', () => {
  it('should display Nombre, Cargo, Teléfono, Email when contactoId resolves to a contact', async () => {
    // GIVEN: MSW returns a complete contacto for a specific contactoId
    const contacto = createContacto({
      nombre: 'Juan Pérez',
      cargo: 'Gerente de Ventas',
      telefono: '3001234567',
      email: 'juan.perez@siesa.com',
    });

    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: ContactoDetailView is rendered with a valid contactoId
    renderContactoDetailView(contacto.id);

    // THEN: All 4 fields appear
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });
    expect(screen.getByText('Gerente de Ventas')).toBeInTheDocument();
    expect(screen.getByText('3001234567')).toBeInTheDocument();
    expect(screen.getByText('juan.perez@siesa.com')).toBeInTheDocument();
  });

  it('should display the detail panel container with data-testid="contacto-detail-panel"', async () => {
    // GIVEN: MSW returns a contacto
    const contacto = createContacto();
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: rendered
    renderContactoDetailView(contacto.id);

    // THEN: Panel container is present
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-panel')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-6: Field labels are rendered in Spanish (AC #1)
// ---------------------------------------------------------------------------

describe('TC-6: Field labels in Spanish', () => {
  it('should display Spanish field labels: Nombre, Cargo, Teléfono, Email', async () => {
    // GIVEN: A valid contacto returned by MSW
    const contacto = createContacto();
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: ContactoDetailView renders the contacto
    renderContactoDetailView(contacto.id);

    // THEN: Spanish field labels are visible
    await waitFor(() => {
      expect(screen.getByText(contacto.nombre)).toBeInTheDocument();
    });

    expect(screen.getByText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByText(/Cargo/i)).toBeInTheDocument();
    expect(screen.getByText(/Teléfono/i)).toBeInTheDocument();
    expect(screen.getByText(/Email/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-4: Shows "Contacto no encontrado" on 404 (AC #3)
// ---------------------------------------------------------------------------

describe('TC-4: Not-found message for invalid contactoId (AC #3)', () => {
  it('should display "Contacto no encontrado" when MSW returns 404', async () => {
    // GIVEN: MSW returns 404 for the given contactoId
    const unknownId = '00000000-0000-0000-0000-000000000000';
    server.use(handleGetContactoByIdNotFound(unknownId));

    // WHEN: ContactoDetailView is rendered with a non-existent contactoId
    renderContactoDetailView(unknownId);

    // THEN: Not-found message shown in Spanish
    await waitFor(() => {
      expect(screen.getByText(/Contacto no encontrado/i)).toBeInTheDocument();
    });
  });

  it('should NOT display contact data fields when contact is not found', async () => {
    // GIVEN: MSW returns 404
    const unknownId = '00000000-0000-0000-0000-000000000000';
    server.use(handleGetContactoByIdNotFound(unknownId));

    // WHEN: Rendered with unknown ID
    renderContactoDetailView(unknownId);

    await waitFor(() => {
      expect(screen.getByText(/Contacto no encontrado/i)).toBeInTheDocument();
    });

    // THEN: No contact data fields are rendered
    expect(screen.queryByText(/Cargo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Teléfono/i)).not.toBeInTheDocument();
  });

  it('should NOT cause a JavaScript crash when API returns 404', async () => {
    // GIVEN: MSW returns 404
    const unknownId = '00000000-0000-0000-0000-000000000000';
    server.use(handleGetContactoByIdNotFound(unknownId));

    // WHEN: Component renders — assert no throw
    expect(() => renderContactoDetailView(unknownId)).not.toThrow();

    // THEN: DOM remains intact (not-found message appears)
    await waitFor(() => {
      expect(screen.getByText(/Contacto no encontrado/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-3: Shows ErrorPanel with "Reintentar" button on fetch error (AC #4)
// ---------------------------------------------------------------------------

describe('TC-3: ErrorPanel with Reintentar on API failure (AC #4)', () => {
  it('should render ErrorPanel when GET /api/v1/contactos/:id returns 500', async () => {
    // GIVEN: MSW returns HTTP 500
    const contactoId = '00000000-0000-0000-0000-000000000002';
    server.use(handleGetContactoByIdError());

    // WHEN: ContactoDetailView renders
    renderContactoDetailView(contactoId);

    // THEN: ErrorPanel is shown
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-error-panel')).toBeInTheDocument();
    });
  });

  it('should display "Reintentar" button in ErrorPanel', async () => {
    // GIVEN: MSW returns HTTP 500
    const contactoId = '00000000-0000-0000-0000-000000000002';
    server.use(handleGetContactoByIdError());

    // WHEN: ContactoDetailView renders
    renderContactoDetailView(contactoId);

    // THEN: "Reintentar" button is visible
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-retry-button')).toBeInTheDocument();
      expect(screen.getByTestId('contacto-detail-retry-button')).toHaveTextContent(/reintentar/i);
    });
  });

  it('should trigger a new fetch when Reintentar button is clicked', async () => {
    // GIVEN: MSW starts with 500, then transitions to success on retry
    const contacto = createContacto({ nombre: 'Retry Contact' });
    server.use(handleGetContactoByIdError());

    renderContactoDetailView(contacto.id);

    // WHEN: ErrorPanel appears
    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-retry-button')).toBeInTheDocument();
    });

    // Switch handler to success
    server.resetHandlers();
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: User clicks Reintentar
    fireEvent.click(screen.getByTestId('contacto-detail-retry-button'));

    // THEN: The error panel eventually disappears and data is shown
    await waitFor(() => {
      expect(screen.queryByTestId('contacto-detail-error-panel')).not.toBeInTheDocument();
    });
  });

  it('should NOT expose technical error details in the error panel (NFR6)', async () => {
    // GIVEN: MSW returns HTTP 500 with internal error details
    const contactoId = '00000000-0000-0000-0000-000000000003';
    server.use(handleGetContactoByIdError());

    renderContactoDetailView(contactoId);

    await waitFor(() => {
      expect(screen.getByTestId('contacto-detail-error-panel')).toBeInTheDocument();
    });

    // THEN: Stack traces or raw error.message are not shown in the panel
    expect(screen.queryByText(/stack/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TC-1: Shows skeleton while loading (AC #5)
// ---------------------------------------------------------------------------

describe('TC-1: Loading skeleton during fetch (AC #5)', () => {
  it('should display loading skeleton while fetch is in-flight (MSW delayed response)', async () => {
    // GIVEN: MSW delays the response by 150ms
    const contacto = createContacto();
    server.use(handleGetContactoByIdDelayed(contacto, 150));

    // WHEN: ContactoDetailView is rendered with a valid contactoId
    renderContactoDetailView(contacto.id);

    // THEN: Loading skeleton is visible before the response arrives
    expect(screen.getByTestId('contacto-detail-skeleton')).toBeInTheDocument();

    // THEN: After response arrives, skeleton disappears and data is visible
    await waitFor(
      () => {
        expect(screen.queryByTestId('contacto-detail-skeleton')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await waitFor(() => {
      expect(screen.getByText(contacto.nombre)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// TC-5: "Editar" and "Eliminar" buttons are rendered (AC #6, #7)
// ---------------------------------------------------------------------------

describe('TC-5: Action buttons visible (AC #6, #7)', () => {
  it('should render "Editar" button when contacto is loaded', async () => {
    // GIVEN: MSW returns a contacto
    const contacto = createContacto();
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: ContactoDetailView renders successfully
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByText(contacto.nombre)).toBeInTheDocument();
    });

    // THEN: "Editar" button is present (AC #6 — Story 3.4 placeholder)
    expect(screen.getByTestId('contacto-edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-edit-button')).toHaveTextContent(/editar/i);
  });

  it('should render "Eliminar" button when contacto is loaded', async () => {
    // GIVEN: MSW returns a contacto
    const contacto = createContacto();
    server.use(handleGetContactoByIdSuccess(contacto));

    // WHEN: ContactoDetailView renders successfully
    renderContactoDetailView(contacto.id);

    await waitFor(() => {
      expect(screen.getByText(contacto.nombre)).toBeInTheDocument();
    });

    // THEN: "Eliminar" button is present (AC #7 — Story 3.5 placeholder)
    expect(screen.getByTestId('contacto-delete-button')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-delete-button')).toHaveTextContent(/eliminar/i);
  });
});
