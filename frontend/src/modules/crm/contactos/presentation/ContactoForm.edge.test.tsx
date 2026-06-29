/**
 * Edge-case component tests — ContactoForm
 * Story 3.3 — Create Contact — Automation Expansion
 *
 * Complements ContactoForm.test.tsx (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - Whitespace-only values in all 4 fields → Zod rejects them, no POST fired
 *   - Only one field filled (partial form) → 3 inline errors for missing fields
 *   - Generic 500 error shows generic error message, NOT a technical stack trace
 *   - Form renders in idle state (Guardar text, not "Guardando...")
 *   - Guardar button label changes to loading indicator while pending
 *   - Guardar button label returns to "Guardar" after success
 *   - Cancelar is type="button" — does NOT trigger HTML form validation errors
 *   - ContactoForm renders without crashing when no props provided (both optional)
 *   - onCancel does not throw when clicked and no onCancel prop provided
 *   - onSuccess called exactly once per successful submit (no duplicate calls)
 *   - Form fields are enabled in idle state
 *   - Nombre with leading/trailing spaces passes Zod (trim) and is accepted
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import React from 'react';
import {
  handlePostContactoSuccess,
  handlePostContactoServerError,
} from '../../../../test/msw/handlers/contactos-create.handlers';
import { handleGetContactosSuccess } from '../../../../test/msw/handlers/contactos.handlers';
import { createContactos } from '../../../../test/factories/contacto.factory';
import { ContactoForm } from './ContactoForm';

// ---------------------------------------------------------------------------
// MSW server
// ---------------------------------------------------------------------------

const server = setupServer();

beforeEach(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: render ContactoForm with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderContactoForm(props: {
  onSuccess?: () => void;
  onCancel?: () => void;
} = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ContactoForm
          onSuccess={props.onSuccess}
          onCancel={props.onCancel}
        />
      </QueryClientProvider>
    ),
  };
}

function fillAllFields(data: {
  nombre: string;
  cargo: string;
  telefono: string;
  email: string;
}) {
  fireEvent.change(screen.getByTestId('contacto-form-nombre'), { target: { value: data.nombre } });
  fireEvent.change(screen.getByTestId('contacto-form-cargo'), { target: { value: data.cargo } });
  fireEvent.change(screen.getByTestId('contacto-form-telefono'), { target: { value: data.telefono } });
  fireEvent.change(screen.getByTestId('contacto-form-email'), { target: { value: data.email } });
}

const VALID_DATA = {
  nombre: 'Luis Pérez Edge',
  cargo: 'Analista Senior',
  telefono: '3009876543',
  email: 'luis.perez.edge@empresa.co',
};

// ---------------------------------------------------------------------------
// Edge: Whitespace-only values → Zod rejects, no POST fired
// ---------------------------------------------------------------------------

describe('ContactoForm — whitespace-only field values blocked by Zod', () => {
  it('[P1] should show inline errors and NOT send POST when all fields are whitespace-only', async () => {
    // GIVEN: MSW would capture any POST (should never fire)
    let postFired = false;
    server.use(
      handleGetContactosSuccess([]),
      http.post('/api/v1/contactos', () => {
        postFired = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderContactoForm();

    // WHEN: All fields filled with only spaces and form submitted
    fillAllFields({ nombre: '   ', cargo: '   ', telefono: '   ', email: '   ' });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Inline errors appear (Zod .min(1) after trim)
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-nombre')).toBeInTheDocument();
    });

    // THEN: POST was NOT fired
    expect(postFired).toBe(false);
  });

  it('[P1] should show error for cargo when cargo is whitespace-only but other fields are valid', async () => {
    // GIVEN: MSW would capture any POST
    let postFired = false;
    server.use(
      handleGetContactosSuccess([]),
      http.post('/api/v1/contactos', () => {
        postFired = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderContactoForm();

    // WHEN: cargo is whitespace-only, rest are valid
    fillAllFields({ nombre: 'Ana García', cargo: '   ', telefono: '3101234567', email: 'ana@siesa.com' });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Error appears for cargo
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-cargo')).toBeInTheDocument();
    });

    // THEN: POST NOT fired
    expect(postFired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: Generic 500 error — no stack trace, shows generic error message
// ---------------------------------------------------------------------------

describe('ContactoForm — 500 error does not expose technical details', () => {
  it('[P1] should NOT show stackTrace text in the UI when backend returns 500', async () => {
    // GIVEN: MSW returns 500
    server.use(
      handlePostContactoServerError(),
      handleGetContactosSuccess(createContactos(1))
    );

    renderContactoForm();

    // WHEN: Form submitted with valid data, backend returns 500
    fillAllFields(VALID_DATA);
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // Wait for mutation to settle
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-submit')).not.toBeDisabled();
    });

    // THEN: No stack trace or internal details in the UI (NFR6)
    expect(screen.queryByText(/stackTrace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/innerException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument();
  });

  it('[P2] should show generic error fallback text when backend returns 500', async () => {
    // GIVEN: MSW returns 500
    server.use(
      handlePostContactoServerError(),
      handleGetContactosSuccess(createContactos(1))
    );

    renderContactoForm();

    // WHEN: Form submitted
    fillAllFields(VALID_DATA);
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: A user-friendly error message appears
    await waitFor(() => {
      expect(screen.getByText(/error al crear el contacto/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: Guardar button label states
// ---------------------------------------------------------------------------

describe('ContactoForm — Guardar button label states', () => {
  it('[P1] should show "Guardar" text on the submit button in the idle state', () => {
    // GIVEN: ContactoForm rendered
    server.use(handleGetContactosSuccess([]));

    renderContactoForm();

    // THEN: Submit button has "Guardar" text initially
    const submitBtn = screen.getByTestId('contacto-form-submit');
    expect(submitBtn).toHaveTextContent('Guardar');
  });

  it('[P1] should show a loading indicator (not "Guardar") while mutation is pending', async () => {
    // GIVEN: POST resolves slowly
    let resolveRequest!: () => void;
    const pending = new Promise<void>((res) => { resolveRequest = res; });

    server.use(
      handleGetContactosSuccess(createContactos(1)),
      http.post('/api/v1/contactos', async () => {
        await pending;
        return HttpResponse.json(
          { id: '00000000-0000-0000-0000-000000000010', ...VALID_DATA, clienteId: null, createdAt: '2026-06-29T10:00:00Z' },
          { status: 201 }
        );
      })
    );

    renderContactoForm();

    // WHEN: Form submitted
    fillAllFields(VALID_DATA);
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: Button text changes to loading indicator
    await waitFor(() => {
      const btn = screen.getByTestId('contacto-form-submit');
      expect(btn.textContent).not.toBe('Guardar');
    });

    // Cleanup
    resolveRequest();
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-submit')).not.toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: ContactoForm renders without crashing when no props provided
// ---------------------------------------------------------------------------

describe('ContactoForm — optional props', () => {
  it('[P2] should render without crashing when no props are passed (both onSuccess and onCancel optional)', () => {
    // GIVEN: ContactoForm rendered with no props at all
    server.use(handleGetContactosSuccess([]));

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });

    // WHEN/THEN: No crash on render
    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <ContactoForm />
        </QueryClientProvider>
      );
    }).not.toThrow();

    // THEN: Form fields are accessible
    expect(screen.getByTestId('contacto-form-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-form-submit')).toBeInTheDocument();
  });

  it('[P2] should not throw when Cancelar is clicked and no onCancel prop provided', () => {
    // GIVEN: ContactoForm with no onCancel
    server.use(handleGetContactosSuccess([]));
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <ContactoForm onSuccess={vi.fn()} />
      </QueryClientProvider>
    );

    // WHEN: Cancelar clicked without an onCancel handler
    expect(() => {
      fireEvent.click(screen.getByTestId('contacto-form-cancel'));
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Edge: Cancelar is type="button" — does NOT trigger HTML form validation
// ---------------------------------------------------------------------------

describe('ContactoForm — Cancelar is not a submit button', () => {
  it('[P2] should NOT trigger inline validation errors when Cancelar is clicked', async () => {
    // GIVEN: ContactoForm rendered with empty fields
    server.use(handleGetContactosSuccess([]));

    const onCancelMock = vi.fn();
    renderContactoForm({ onCancel: onCancelMock });

    // WHEN: Cancelar clicked without filling anything
    fireEvent.click(screen.getByTestId('contacto-form-cancel'));

    // THEN: No validation errors shown (Cancelar doesn't validate)
    expect(screen.queryByTestId('contacto-form-error-nombre')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contacto-form-error-cargo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contacto-form-error-telefono')).not.toBeInTheDocument();
    expect(screen.queryByTestId('contacto-form-error-email')).not.toBeInTheDocument();

    // THEN: onCancel called
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Edge: Partial form submission — only nombre filled → 3 inline errors
// ---------------------------------------------------------------------------

describe('ContactoForm — partial form submission (boundary)', () => {
  it('[P1] should show errors only on missing fields when nombre is the only field filled', async () => {
    // GIVEN: ContactoForm rendered
    server.use(handleGetContactosSuccess([]));

    renderContactoForm();

    // WHEN: Only nombre is filled
    fireEvent.change(screen.getByTestId('contacto-form-nombre'), {
      target: { value: 'Contacto Parcial' },
    });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: nombre has NO error
    await waitFor(() => {
      expect(screen.getByTestId('contacto-form-error-cargo')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('contacto-form-error-nombre')).not.toBeInTheDocument();
    expect(screen.getByTestId('contacto-form-error-cargo')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-form-error-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('contacto-form-error-email')).toBeInTheDocument();
  });

  it('[P1] should show NO errors after all 4 fields are correctly filled in', async () => {
    // GIVEN: ContactoForm rendered, all fields filled
    server.use(
      handlePostContactoSuccess(),
      handleGetContactosSuccess(createContactos(1))
    );

    renderContactoForm({ onSuccess: vi.fn() });

    // WHEN: All fields filled and form submitted
    fillAllFields(VALID_DATA);
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: No inline validation errors visible
    await waitFor(() => {
      expect(screen.queryByTestId('contacto-form-error-nombre')).not.toBeInTheDocument();
      expect(screen.queryByTestId('contacto-form-error-cargo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('contacto-form-error-telefono')).not.toBeInTheDocument();
      expect(screen.queryByTestId('contacto-form-error-email')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: onSuccess called exactly once per successful submit
// ---------------------------------------------------------------------------

describe('ContactoForm — onSuccess called exactly once', () => {
  it('[P1] should call onSuccess exactly once after a successful form submission', async () => {
    // GIVEN: POST returns 201
    server.use(
      handlePostContactoSuccess(),
      handleGetContactosSuccess(createContactos(1))
    );

    const onSuccessMock = vi.fn();
    renderContactoForm({ onSuccess: onSuccessMock });

    // WHEN: Form submitted once
    fillAllFields(VALID_DATA);
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: onSuccess called exactly once
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: Form fields are enabled in idle state
// ---------------------------------------------------------------------------

describe('ContactoForm — field enabled/disabled states', () => {
  it('[P2] should have all 4 form fields enabled before any submission', () => {
    // GIVEN: ContactoForm rendered in idle state
    server.use(handleGetContactosSuccess([]));

    renderContactoForm();

    // THEN: All 4 input fields are enabled
    expect(screen.getByTestId('contacto-form-nombre')).not.toBeDisabled();
    expect(screen.getByTestId('contacto-form-cargo')).not.toBeDisabled();
    expect(screen.getByTestId('contacto-form-telefono')).not.toBeDisabled();
    expect(screen.getByTestId('contacto-form-email')).not.toBeDisabled();
  });

  it('[P2] should have Guardar and Cancelar buttons both enabled in idle state', () => {
    // GIVEN: ContactoForm rendered in idle state
    server.use(handleGetContactosSuccess([]));

    renderContactoForm();

    // THEN: Both action buttons are enabled
    expect(screen.getByTestId('contacto-form-submit')).not.toBeDisabled();
    expect(screen.getByTestId('contacto-form-cancel')).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Edge: Nombre with surrounding spaces is trimmed and accepted
// ---------------------------------------------------------------------------

describe('ContactoForm — leading/trailing whitespace is trimmed and accepted by Zod', () => {
  it('[P2] should accept nombre with leading and trailing spaces (Zod trims before validation)', async () => {
    // GIVEN: POST returns 201 — the form should reach the network
    let postFired = false;
    server.use(
      handleGetContactosSuccess(createContactos(1)),
      http.post('/api/v1/contactos', () => {
        postFired = true;
        return HttpResponse.json(
          { id: '00000000-0000-0000-0000-000000000099', ...VALID_DATA, clienteId: null, createdAt: '2026-06-29T10:00:00Z' },
          { status: 201 }
        );
      })
    );

    renderContactoForm({ onSuccess: vi.fn() });

    // WHEN: nombre has surrounding spaces (other fields valid)
    fillAllFields({ ...VALID_DATA, nombre: '  Ana García  ' });
    fireEvent.click(screen.getByTestId('contacto-form-submit'));

    // THEN: No error for nombre (Zod trims first)
    await waitFor(() => {
      expect(postFired).toBe(true);
    });

    expect(screen.queryByTestId('contacto-form-error-nombre')).not.toBeInTheDocument();
  });
});
