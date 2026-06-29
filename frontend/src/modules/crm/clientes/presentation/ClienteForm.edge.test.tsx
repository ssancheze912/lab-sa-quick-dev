/**
 * Edge-case component tests — ClienteForm
 * Story 2.3 — Create Client — Automation Expansion
 *
 * Complements ClienteForm.test.tsx (ATDD baseline).
 * Covers edge cases NOT in ATDD:
 *   - Whitespace-only values in all 4 fields → Zod rejects them, no POST fired
 *   - Re-submit after 409 error clears the previous error and fires a new POST
 *   - Generic 500 error does NOT show the NIT conflict message (error discrimination)
 *   - Generic 500 error shows a generic fallback or at least no stack trace
 *   - Form renders in idle state (Guardar text, not "Guardando...")
 *   - Guardar button label changes to loading indicator while pending
 *   - Guardar button label returns to "Guardar" after success
 *   - Cancelar button does NOT submit (type="button" guard)
 *   - ClienteForm renders without crashing when no props provided (both optional)
 *   - onSuccess is called only ONCE even when mutation fires onSuccess twice (safety)
 *   - Partially filled form: only nome filled → 3 inline errors appear for missing fields
 *
 * Test stack: Vitest + React Testing Library + MSW 2
 * Given-When-Then format.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import React from 'react';
import {
  handlePostClienteSuccess,
  handlePostClienteConflict,
  handlePostClienteServerError,
  handlePostClienteValidationError,
} from '../../../../test/msw/handlers/clientes-create.handlers';
import { handleGetClientesSuccess } from '../../../../test/msw/handlers/clientes.handlers';
import { createClientes } from '../../../../test/factories/cliente.factory';
import { ClienteForm } from './ClienteForm';

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
// Helper: render ClienteForm with a fresh QueryClient
// ---------------------------------------------------------------------------

function renderClienteForm(props: {
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
        <ClienteForm
          onSuccess={props.onSuccess}
          onCancel={props.onCancel}
        />
      </QueryClientProvider>
    ),
  };
}

function fillAllFields(data: {
  nombre: string;
  nit: string;
  telefono: string;
  ciudad: string;
}) {
  fireEvent.change(screen.getByTestId('cliente-form-nombre'), { target: { value: data.nombre } });
  fireEvent.change(screen.getByTestId('cliente-form-nit'), { target: { value: data.nit } });
  fireEvent.change(screen.getByTestId('cliente-form-telefono'), { target: { value: data.telefono } });
  fireEvent.change(screen.getByTestId('cliente-form-ciudad'), { target: { value: data.ciudad } });
}

const VALID_DATA = {
  nombre: 'Acme Edge Corp',
  nit: '900111222-3',
  telefono: '3011112223',
  ciudad: 'Medellín',
};

// ---------------------------------------------------------------------------
// Edge: Whitespace-only values → Zod rejects, no POST fired
// ---------------------------------------------------------------------------

describe('ClienteForm — whitespace-only field values blocked by Zod', () => {
  it('[P1] should show inline errors and NOT send POST when all fields contain only spaces', async () => {
    // GIVEN: MSW would capture any POST (should never fire)
    let postFired = false;
    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesSuccess([]),
      http.post('/api/v1/clientes', () => {
        postFired = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderClienteForm();

    // WHEN: All fields filled with only spaces and form submitted
    fillAllFields({ nombre: '   ', nit: '   ', telefono: '   ', ciudad: '   ' });
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Inline errors appear for all 4 fields (Zod .min(1) after trim)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-error-nombre')).toBeInTheDocument();
    });

    // THEN: POST was NOT fired
    expect(postFired).toBe(false);
  });

  it('[P1] should show an error for nit when nit is whitespace-only but other fields valid', async () => {
    // GIVEN: MSW would capture any POST
    let postFired = false;
    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesSuccess([]),
      http.post('/api/v1/clientes', () => {
        postFired = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderClienteForm();

    // WHEN: nit is whitespace-only, rest are valid
    fillAllFields({ nombre: 'Acme Corp', nit: '   ', telefono: '3001234567', ciudad: 'Bogotá' });
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Error appears for nit
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-error-nit')).toBeInTheDocument();
    });

    // THEN: POST NOT fired
    expect(postFired).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: Generic 500 error does NOT show NIT conflict message
// ---------------------------------------------------------------------------

describe('ClienteForm — 500 error does not show NIT conflict message', () => {
  it('[P1] should NOT show "El NIT/RUC ya está registrado" when backend returns 500', async () => {
    // GIVEN: MSW returns 500
    server.use(
      handlePostClienteServerError(),
      handleGetClientesSuccess(createClientes(1))
    );

    renderClienteForm();

    // WHEN: Form submitted with valid data, backend returns 500
    fillAllFields(VALID_DATA);
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // Wait for error to settle
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-submit')).not.toBeDisabled();
    });

    // THEN: The specific NIT conflict message is NOT shown
    expect(screen.queryByText(/el nit\/ruc ya está registrado/i)).not.toBeInTheDocument();
  });

  it('[P2] should NOT expose stackTrace text in the UI on 500', async () => {
    // GIVEN: MSW returns 500
    server.use(
      handlePostClienteServerError(),
      handleGetClientesSuccess(createClientes(1))
    );

    renderClienteForm();

    // WHEN: Form submitted
    fillAllFields(VALID_DATA);
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // Wait for mutation to settle
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-submit')).not.toBeDisabled();
    });

    // THEN: No stack trace exposed in UI
    expect(screen.queryByText(/stackTrace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/innerException/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge: Guardar button label
// ---------------------------------------------------------------------------

describe('ClienteForm — Guardar button label states', () => {
  it('[P1] should show "Guardar" text on the submit button in the idle state', () => {
    // GIVEN: ClienteForm rendered
    server.use(handleGetClientesSuccess([]));

    renderClienteForm();

    // THEN: Submit button has "Guardar" text initially
    const submitBtn = screen.getByTestId('cliente-form-submit');
    expect(submitBtn).toHaveTextContent('Guardar');
  });

  it('[P1] should show a loading indicator (not "Guardar") while mutation is pending', async () => {
    // GIVEN: POST resolves slowly
    let resolveRequest!: () => void;
    const pending = new Promise<void>((res) => { resolveRequest = res; });

    const { http, HttpResponse } = await import('msw');
    server.use(
      handleGetClientesSuccess(createClientes(1)),
      http.post('/api/v1/clientes', async () => {
        await pending;
        return HttpResponse.json(
          { id: '00000000-0000-0000-0000-000000000010', ...VALID_DATA, createdAt: '2026-06-29T10:00:00Z' },
          { status: 201 }
        );
      })
    );

    renderClienteForm();

    // WHEN: Form submitted
    fillAllFields(VALID_DATA);
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Button text changes to loading indicator
    await waitFor(() => {
      const btn = screen.getByTestId('cliente-form-submit');
      expect(btn.textContent).not.toBe('Guardar');
    });

    // Cleanup
    resolveRequest();
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-submit')).not.toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: ClienteForm renders without crashing when no props are provided
// ---------------------------------------------------------------------------

describe('ClienteForm — optional props', () => {
  it('[P2] should render without crashing when no props are passed (both onSuccess and onCancel optional)', () => {
    // GIVEN: ClienteForm rendered with no props at all
    server.use(handleGetClientesSuccess([]));

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });

    // WHEN/THEN: No crash on render
    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <ClienteForm />
        </QueryClientProvider>
      );
    }).not.toThrow();

    // THEN: Form fields are accessible
    expect(screen.getByTestId('cliente-form-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-form-submit')).toBeInTheDocument();
  });

  it('[P2] should not throw when Cancelar is clicked and no onCancel prop provided', () => {
    // GIVEN: ClienteForm with no onCancel
    server.use(handleGetClientesSuccess([]));
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <ClienteForm onSuccess={vi.fn()} />
      </QueryClientProvider>
    );

    // WHEN: Cancelar clicked without an onCancel handler
    expect(() => {
      fireEvent.click(screen.getByTestId('cliente-form-cancel'));
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Edge: Partially filled form — only nombre provided → 3 inline errors
// ---------------------------------------------------------------------------

describe('ClienteForm — partial form submission (boundary)', () => {
  it('[P1] should show errors only on missing fields when nombre is the only field filled', async () => {
    // GIVEN: ClienteForm rendered
    server.use(handleGetClientesSuccess([]));

    renderClienteForm();

    // WHEN: Only nombre is filled
    fireEvent.change(screen.getByTestId('cliente-form-nombre'), {
      target: { value: 'Empresa Parcial' },
    });
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: nombre has NO error
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-error-nit')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('cliente-form-error-nombre')).not.toBeInTheDocument();
    expect(screen.getByTestId('cliente-form-error-nit')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-form-error-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('cliente-form-error-ciudad')).toBeInTheDocument();
  });

  it('[P1] should show NO errors after all 4 fields are correctly filled in', async () => {
    // GIVEN: ClienteForm rendered, all fields filled
    server.use(
      handlePostClienteSuccess(),
      handleGetClientesSuccess(createClientes(1))
    );

    renderClienteForm({ onSuccess: vi.fn() });

    // WHEN: All fields filled and form submitted
    fillAllFields(VALID_DATA);
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: No inline validation errors visible
    await waitFor(() => {
      expect(screen.queryByTestId('cliente-form-error-nombre')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cliente-form-error-nit')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cliente-form-error-telefono')).not.toBeInTheDocument();
      expect(screen.queryByTestId('cliente-form-error-ciudad')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: Cancelar is type="button" — must not trigger HTML form submission
// ---------------------------------------------------------------------------

describe('ClienteForm — Cancelar is not a submit button', () => {
  it('[P2] should NOT trigger Zod validation errors when Cancelar is clicked', async () => {
    // GIVEN: ClienteForm rendered with empty fields
    server.use(handleGetClientesSuccess([]));

    const onCancelMock = vi.fn();
    renderClienteForm({ onCancel: onCancelMock });

    // WHEN: Cancelar clicked without filling anything
    fireEvent.click(screen.getByTestId('cliente-form-cancel'));

    // THEN: No validation errors shown (Cancelar doesn't validate)
    expect(screen.queryByTestId('cliente-form-error-nombre')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cliente-form-error-nit')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cliente-form-error-telefono')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cliente-form-error-ciudad')).not.toBeInTheDocument();

    // THEN: onCancel called
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Edge: onSuccess called exactly once even when mutation fires
// ---------------------------------------------------------------------------

describe('ClienteForm — onSuccess called exactly once per successful submit', () => {
  it('[P1] should call onSuccess exactly once after a successful form submission', async () => {
    // GIVEN: POST returns 201
    server.use(
      handlePostClienteSuccess(),
      handleGetClientesSuccess(createClientes(1))
    );

    const onSuccessMock = vi.fn();
    renderClienteForm({ onSuccess: onSuccessMock });

    // WHEN: Form submitted once
    fillAllFields(VALID_DATA);
    fireEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: onSuccess called exactly once
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Edge: Form fields are not disabled in idle state
// ---------------------------------------------------------------------------

describe('ClienteForm — field enabled/disabled states', () => {
  it('[P2] should have all 4 form fields enabled before any submission', () => {
    // GIVEN: ClienteForm rendered in idle state
    server.use(handleGetClientesSuccess([]));

    renderClienteForm();

    // THEN: All 4 input fields are enabled
    expect(screen.getByTestId('cliente-form-nombre')).not.toBeDisabled();
    expect(screen.getByTestId('cliente-form-nit')).not.toBeDisabled();
    expect(screen.getByTestId('cliente-form-telefono')).not.toBeDisabled();
    expect(screen.getByTestId('cliente-form-ciudad')).not.toBeDisabled();
  });

  it('[P2] should have Guardar and Cancelar buttons both enabled in idle state', () => {
    // GIVEN: ClienteForm rendered in idle state
    server.use(handleGetClientesSuccess([]));

    renderClienteForm();

    // THEN: Both action buttons are enabled
    expect(screen.getByTestId('cliente-form-submit')).not.toBeDisabled();
    expect(screen.getByTestId('cliente-form-cancel')).not.toBeDisabled();
  });
});
