/**
 * Story 2.3: Create Client
 * Epic 2: Client Management
 *
 * Component Tests — RTL + MSW — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 * Uses: Vitest + React Testing Library + MSW (msw 2.x)
 *
 * Acceptance Criteria covered:
 *   AC#1 — Form opens with fields: Nombre, NIT/RUC, Teléfono, Ciudad (all required)
 *   AC#2 — Submit valid form → client created, toast "Cliente creado correctamente", onSuccess called
 *   AC#3 — Submit with empty fields → inline errors on all 4 fields, NO API call fired (FR8, R-002)
 *   AC#4 — Backend returns 409 → inline error "El NIT/RUC ya está registrado" on NIT field, no toast, no stack trace (R-002, NFR6)
 *
 * Test Cases:
 *   TC-2.3-C-01 (P0, AC#3) — Submit empty form → inline errors on all 4 fields, no API call (R-002)
 *   TC-2.3-C-02 (P0, AC#4) — Mock POST 409, duplicate NIT → "El NIT/RUC ya está registrado" on NIT field, no toast, no stack trace (R-002, NFR6)
 *   TC-2.3-C-03 (P1, AC#2) — Mock POST 201, submit valid form → onSuccess called, toast "Cliente creado correctamente"
 *   TC-2.3-C-04 (P1, AC#1) — Click "Cancelar" → onCancel called, form NOT submitted
 *   TC-2.3-C-05 (P1, AC#2) — While isPending → submit button disabled and shows "Guardando…"
 *   TC-2.3-C-06 (P1, AC#1) — Form has all 4 required field labels in Spanish with htmlFor (WCAG 2.1 AA)
 *   TC-2.3-C-07 (P1, AC#3) — Submit with one field empty (Teléfono only) → inline error on Teléfono, no API call
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Component under test — does not exist yet (RED phase)
// Import will fail until implementation is complete
import { ClienteForm } from '../ClienteForm';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const CLIENTES_API_URL = `${BASE_URL}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// Toast mock — ClienteForm calls toast.success/toast.error
// ─────────────────────────────────────────────────────────────────────────────

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// MSW Server — default handler returns 201 Created
// ─────────────────────────────────────────────────────────────────────────────

const mockCreatedCliente = {
  id: '00000000-0000-0000-0000-000000000099',
  nombre: 'Test Corp SA',
  nit: '900999888-1',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-06-21T10:00:00+00:00',
  updatedAt: '2026-06-21T10:00:00+00:00',
};

const server = setupServer(
  http.post(CLIENTES_API_URL, () => {
    return HttpResponse.json(mockCreatedCliente, { status: 201 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  mockToastSuccess.mockClear();
  mockToastError.mockClear();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderForm(props: { onSuccess?: () => void; onCancel?: () => void } = {}) {
  const queryClient = makeQueryClient();
  const onSuccess = props.onSuccess ?? vi.fn();
  const onCancel = props.onCancel ?? vi.fn();

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ClienteForm onSuccess={onSuccess} onCancel={onCancel} />
    </QueryClientProvider>
  );

  return { ...utils, queryClient, onSuccess, onCancel };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-01 — Submit empty form: inline errors on all 4 fields, no API call
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#3 — Submit empty form shows inline errors on all required fields and does NOT call API (R-002)', () => {
  it('[P0][TC-2.3-C-01] Given all fields are empty, When form is submitted, Then inline errors appear on Nombre, NIT/RUC, Teléfono and Ciudad, and no POST is fired', async () => {
    // GIVEN: Form rendered with all fields empty
    const postSpy = vi.fn();
    server.use(
      http.post(CLIENTES_API_URL, () => {
        postSpy();
        return HttpResponse.json(mockCreatedCliente, { status: 201 });
      })
    );

    renderForm();

    // WHEN: User submits the form without filling any fields
    const submitBtn = screen.getByTestId('cliente-form-submit');
    await userEvent.click(submitBtn);

    // THEN: Inline error appears on Nombre field
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-nombre-error')).toBeInTheDocument();
    });

    // AND: Inline error appears on NIT/RUC field
    expect(screen.getByTestId('cliente-form-nit-error')).toBeInTheDocument();

    // AND: Inline error appears on Teléfono field
    expect(screen.getByTestId('cliente-form-telefono-error')).toBeInTheDocument();

    // AND: Inline error appears on Ciudad field
    expect(screen.getByTestId('cliente-form-ciudad-error')).toBeInTheDocument();

    // AND: The POST API was NOT called (frontend validation blocked submission)
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('[P0][TC-2.3-C-01b] Given all fields empty, When form is submitted, Then each inline error message is in Spanish', async () => {
    // GIVEN: Form with no data entered
    renderForm();

    // WHEN: Submit attempted
    await userEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Error messages are in Spanish (Zod schema messages)
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-nombre-error')).toHaveTextContent(/requerido/i);
    });
    expect(screen.getByTestId('cliente-form-nit-error')).toHaveTextContent(/requerido/i);
    expect(screen.getByTestId('cliente-form-telefono-error')).toHaveTextContent(/requerido/i);
    expect(screen.getByTestId('cliente-form-ciudad-error')).toHaveTextContent(/requerido/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-02 — 409 duplicate NIT → inline error on NIT field, no toast, no stack trace
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#4 — 409 duplicate NIT: inline error on NIT field, no generic toast, no stack trace (R-002, NFR6)', () => {
  it('[P0][TC-2.3-C-02] Given backend returns 409 for duplicate NIT, When form is submitted, Then "El NIT/RUC ya está registrado" appears on NIT field', async () => {
    // GIVEN: API returns 409 for duplicate NIT
    server.use(
      http.post(CLIENTES_API_URL, () =>
        HttpResponse.json(
          { title: 'El NIT/RUC ya está registrado.', status: 409 },
          { status: 409 }
        )
      )
    );

    renderForm();

    // WHEN: User fills form with a duplicate NIT and submits
    await userEvent.type(screen.getByTestId('cliente-form-nombre'), 'Empresa X SA');
    await userEvent.type(screen.getByTestId('cliente-form-nit'), '900999888-1');
    await userEvent.type(screen.getByTestId('cliente-form-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('cliente-form-ciudad'), 'Bogotá');
    await userEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Inline error on NIT field shows "El NIT/RUC ya está registrado"
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-nit-error')).toHaveTextContent(
        /El NIT\/RUC ya está registrado/i
      );
    });

    // AND: No generic error toast was shown (only inline error for 409)
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('[P0][TC-2.3-C-02b] Given 409 response with stack trace in body, When shown, Then no stack trace is visible in the DOM (NFR6)', async () => {
    // GIVEN: API returns 409 with technical stack trace in response (defense test)
    server.use(
      http.post(CLIENTES_API_URL, () =>
        HttpResponse.json(
          {
            title: 'El NIT/RUC ya está registrado.',
            status: 409,
            stackTrace: 'at SiesaAgents.Infrastructure.Repositories.ClienteRepository line 55',
            detail: 'Unique constraint violation on uk_clientes_nit',
          },
          { status: 409 }
        )
      )
    );

    renderForm();

    await userEvent.type(screen.getByTestId('cliente-form-nombre'), 'Empresa Y SA');
    await userEvent.type(screen.getByTestId('cliente-form-nit'), '800111222-5');
    await userEvent.type(screen.getByTestId('cliente-form-telefono'), '3109876543');
    await userEvent.type(screen.getByTestId('cliente-form-ciudad'), 'Medellín');
    await userEvent.click(screen.getByTestId('cliente-form-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-nit-error')).toBeInTheDocument();
    });

    // THEN: No stack trace text is rendered anywhere in the DOM (NFR6)
    expect(screen.queryByText(/stackTrace|stack_trace|at SiesaAgents|line 55/i)).not.toBeInTheDocument();

    // AND: No technical detail is surfaced
    expect(screen.queryByText(/Unique constraint violation/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-03 — Valid submit: onSuccess called, toast shown
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#2 — Valid form submit: onSuccess called and toast "Cliente creado correctamente" shown', () => {
  it('[P1][TC-2.3-C-03] Given valid form data, When POST returns 201, Then onSuccess is called and toast shows "Cliente creado correctamente"', async () => {
    // GIVEN: API returns 201
    // (default server handler)
    const onSuccess = vi.fn();
    renderForm({ onSuccess });

    // WHEN: User fills all fields and submits
    await userEvent.type(screen.getByTestId('cliente-form-nombre'), 'Empresa Nueva SA');
    await userEvent.type(screen.getByTestId('cliente-form-nit'), '900999888-1');
    await userEvent.type(screen.getByTestId('cliente-form-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('cliente-form-ciudad'), 'Bogotá');
    await userEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: onSuccess callback is called
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce();
    });

    // AND: Toast "Cliente creado correctamente" is shown (success case)
    expect(mockToastSuccess).toHaveBeenCalledWith('Cliente creado correctamente');
  });

  it('[P1][TC-2.3-C-03b] Given valid submission, When POST returns 201, Then TanStack Query invalidates clientes cache', async () => {
    // GIVEN: API returns 201 (default handler)
    const { queryClient } = renderForm();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    // WHEN: User fills all required fields and submits
    await userEvent.type(screen.getByTestId('cliente-form-nombre'), 'Cache Refresh Corp');
    await userEvent.type(screen.getByTestId('cliente-form-nit'), '700888999-2');
    await userEvent.type(screen.getByTestId('cliente-form-telefono'), '3201112233');
    await userEvent.type(screen.getByTestId('cliente-form-ciudad'), 'Cali');
    await userEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: queryClient.invalidateQueries called with { queryKey: ['clientes'] }
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['clientes'] })
      );
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-04 — Click "Cancelar": onCancel called, form not submitted
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#1 — Clicking "Cancelar" calls onCancel and does NOT submit the form', () => {
  it('[P1][TC-2.3-C-04] Given form is rendered, When user clicks "Cancelar" without filling fields, Then onCancel is called and no API call is fired', async () => {
    // GIVEN: Form is rendered with onCancel spy
    const postSpy = vi.fn();
    server.use(
      http.post(CLIENTES_API_URL, () => {
        postSpy();
        return HttpResponse.json(mockCreatedCliente, { status: 201 });
      })
    );

    const onCancel = vi.fn();
    renderForm({ onCancel });

    // WHEN: User clicks "Cancelar" without filling any fields
    const cancelBtn = screen.getByTestId('cliente-form-cancel');
    await userEvent.click(cancelBtn);

    // THEN: onCancel is called once
    expect(onCancel).toHaveBeenCalledOnce();

    // AND: No POST API call was made
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('[P1][TC-2.3-C-04b] Given form is partially filled, When user clicks "Cancelar", Then onCancel is called and form is NOT submitted', async () => {
    // GIVEN: User fills only Nombre (partial fill)
    const postSpy = vi.fn();
    server.use(
      http.post(CLIENTES_API_URL, () => {
        postSpy();
        return HttpResponse.json(mockCreatedCliente, { status: 201 });
      })
    );

    const onCancel = vi.fn();
    renderForm({ onCancel });

    await userEvent.type(screen.getByTestId('cliente-form-nombre'), 'Partial Name');

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('cliente-form-cancel'));

    // THEN: onCancel is called
    expect(onCancel).toHaveBeenCalledOnce();

    // AND: No API call was made
    expect(postSpy).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-05 — While isPending: submit button disabled and shows "Guardando…"
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#2 — Loading state: submit button shows "Guardando…" and is disabled while isPending', () => {
  it('[P1][TC-2.3-C-05] Given form is submitted and POST is in progress, When isPending is true, Then submit button is disabled and shows "Guardando…"', async () => {
    // GIVEN: API has a slow response to keep isPending=true visible during assertion
    server.use(
      http.post(CLIENTES_API_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return HttpResponse.json(mockCreatedCliente, { status: 201 });
      })
    );

    renderForm();

    // WHEN: User fills all fields and submits
    await userEvent.type(screen.getByTestId('cliente-form-nombre'), 'Empresa Pending SA');
    await userEvent.type(screen.getByTestId('cliente-form-nit'), '800555666-7');
    await userEvent.type(screen.getByTestId('cliente-form-telefono'), '3151234567');
    await userEvent.type(screen.getByTestId('cliente-form-ciudad'), 'Barranquilla');

    const submitBtn = screen.getByTestId('cliente-form-submit');
    await userEvent.click(submitBtn);

    // THEN: Submit button shows "Guardando…" while pending
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-submit')).toHaveTextContent(/Guardando/i);
    });

    // AND: Submit button is disabled while pending
    expect(screen.getByTestId('cliente-form-submit')).toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-06 — WCAG 2.1 AA: all inputs have <label> with htmlFor
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#1 — Accessibility: all form inputs have labels with htmlFor (WCAG 2.1 AA)', () => {
  it('[P1][TC-2.3-C-06] Given form is rendered, When viewed, Then all 4 inputs have associated <label> elements in Spanish', () => {
    // GIVEN: Form is rendered
    renderForm();

    // THEN: Nombre label is in Spanish
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();

    // AND: NIT/RUC label is in Spanish
    expect(screen.getByLabelText(/NIT\/RUC/i)).toBeInTheDocument();

    // AND: Teléfono label is in Spanish
    expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument();

    // AND: Ciudad label is in Spanish
    expect(screen.getByLabelText(/Ciudad/i)).toBeInTheDocument();
  });

  it('[P1][TC-2.3-C-06b] Given form is rendered, When viewed, Then error message containers have aria-describedby association', () => {
    // GIVEN: Form is rendered
    const { container } = renderForm();

    // THEN: Each input has aria-describedby attribute (pointing to error span)
    const nombreInput = screen.getByTestId('cliente-form-nombre');
    expect(nombreInput).toHaveAttribute('aria-describedby');

    const nitInput = screen.getByTestId('cliente-form-nit');
    expect(nitInput).toHaveAttribute('aria-describedby');

    const telefonoInput = screen.getByTestId('cliente-form-telefono');
    expect(telefonoInput).toHaveAttribute('aria-describedby');

    const ciudadInput = screen.getByTestId('cliente-form-ciudad');
    expect(ciudadInput).toHaveAttribute('aria-describedby');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2.3-C-07 — Single empty field: inline error on that field, no API call
// ─────────────────────────────────────────────────────────────────────────────

describe('AC#3 — Partial empty form: inline error only on the empty field, no API call', () => {
  it('[P1][TC-2.3-C-07] Given only Teléfono is empty, When form is submitted, Then inline error on Teléfono and no API call', async () => {
    // GIVEN: POST spy to detect any API call
    const postSpy = vi.fn();
    server.use(
      http.post(CLIENTES_API_URL, () => {
        postSpy();
        return HttpResponse.json(mockCreatedCliente, { status: 201 });
      })
    );

    renderForm();

    // WHEN: User fills Nombre, NIT, Ciudad but leaves Teléfono empty and submits
    await userEvent.type(screen.getByTestId('cliente-form-nombre'), 'Empresa Parcial SA');
    await userEvent.type(screen.getByTestId('cliente-form-nit'), '800123456-8');
    // Teléfono intentionally left empty
    await userEvent.type(screen.getByTestId('cliente-form-ciudad'), 'Bucaramanga');
    await userEvent.click(screen.getByTestId('cliente-form-submit'));

    // THEN: Error only on Teléfono
    await waitFor(() => {
      expect(screen.getByTestId('cliente-form-telefono-error')).toBeInTheDocument();
    });

    // AND: No error on Nombre (it is filled)
    expect(screen.queryByTestId('cliente-form-nombre-error')).not.toBeInTheDocument();

    // AND: No error on NIT (it is filled)
    expect(screen.queryByTestId('cliente-form-nit-error')).not.toBeInTheDocument();

    // AND: No API call was made
    expect(postSpy).not.toHaveBeenCalled();
  });
});
