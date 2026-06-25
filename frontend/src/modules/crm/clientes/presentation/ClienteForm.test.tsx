/**
 * Story 2.3: ClienteForm component — Component Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC1: Form renders four required fields (Nombre, NIT/RUC, Teléfono, Ciudad) + Guardar + Cancelar buttons
 * - AC3: Submitting empty form shows inline errors for each field, no API call made
 * - AC2: Submitting valid form calls API and fires onSuccess callback
 * - AC2: Submit button is disabled and shows "Guardando…" while pending
 * - AC4: 409 response sets inline NIT error "El NIT/RUC ya está registrado"
 * - AC5: 5xx response shows toast error, form stays open
 * - AC6: "Cancelar" button calls onCancel, no API call made
 *
 * Framework: Vitest + React Testing Library + MSW (matching Stories 2.1 and 2.2 patterns)
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// SUT — will fail until ClienteForm is implemented
import { ClienteForm } from './ClienteForm';

// ─── MSW server ───────────────────────────────────────────────────────────────

const API_URL = 'http://localhost:5000/api/v1/clientes';

const clienteCreatedStub = {
  id: '550e8400-e29b-41d4-a716-446655440020',
  nombre: 'Empresa Form Test SA',
  nit: '900444555-6',
  telefono: '3001234567',
  ciudad: 'Bogotá',
  createdAt: '2026-06-25T10:30:00Z',
  updatedAt: '2026-06-25T10:30:00Z',
};

const server = setupServer(
  http.post(API_URL, () => HttpResponse.json(clienteCreatedStub, { status: 201 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderClienteForm(props: { onSuccess?: () => void; onCancel?: () => void } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onSuccess = props.onSuccess ?? vi.fn();
  const onCancel = props.onCancel ?? vi.fn();

  const utils = render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ClienteForm, { onSuccess, onCancel }),
    ),
  );

  return { ...utils, onSuccess, onCancel, queryClient };
}

async function fillForm(
  overrides: Partial<{
    nombre: string;
    nit: string;
    telefono: string;
    ciudad: string;
  }> = {},
) {
  const values = {
    nombre: overrides.nombre ?? 'Empresa Form Test SA',
    nit: overrides.nit ?? '900444555-6',
    telefono: overrides.telefono ?? '3001234567',
    ciudad: overrides.ciudad ?? 'Bogotá',
  };
  if (values.nombre !== '') await userEvent.type(screen.getByTestId('input-nombre'), values.nombre);
  if (values.nit !== '') await userEvent.type(screen.getByTestId('input-nit'), values.nit);
  if (values.telefono !== '') await userEvent.type(screen.getByTestId('input-telefono'), values.telefono);
  if (values.ciudad !== '') await userEvent.type(screen.getByTestId('input-ciudad'), values.ciudad);
}

// ─── AC1: Form renders all four fields and action buttons ────────────────────

describe('AC1 — ClienteForm renders required fields', () => {
  it('should render the Nombre input field', () => {
    // GIVEN: Component is mounted
    renderClienteForm();

    // WHEN: Form is rendered
    // THEN: Nombre input is present
    expect(screen.getByTestId('input-nombre')).toBeInTheDocument();
  });

  it('should render the NIT/RUC input field', () => {
    // GIVEN: Component is mounted
    renderClienteForm();

    // WHEN: Form is rendered
    // THEN: NIT/RUC input is present
    expect(screen.getByTestId('input-nit')).toBeInTheDocument();
  });

  it('should render the Teléfono input field', () => {
    // GIVEN: Component is mounted
    renderClienteForm();

    // WHEN: Form is rendered
    // THEN: Teléfono input is present
    expect(screen.getByTestId('input-telefono')).toBeInTheDocument();
  });

  it('should render the Ciudad input field', () => {
    // GIVEN: Component is mounted
    renderClienteForm();

    // WHEN: Form is rendered
    // THEN: Ciudad input is present
    expect(screen.getByTestId('input-ciudad')).toBeInTheDocument();
  });

  it('should render the Guardar/submit button', () => {
    // GIVEN: Component is mounted
    renderClienteForm();

    // WHEN: Form is rendered
    // THEN: Submit button is present
    expect(screen.getByTestId('btn-submit-cliente')).toBeInTheDocument();
  });

  it('should render the Cancelar button', () => {
    // GIVEN: Component is mounted
    renderClienteForm();

    // WHEN: Form is rendered
    // THEN: Cancel button is present
    expect(screen.getByTestId('btn-cancelar-cliente')).toBeInTheDocument();
  });

  it('should have associated labels in Spanish for each input', () => {
    // GIVEN: Component is mounted
    renderClienteForm();

    // WHEN: Form is rendered
    // THEN: Each input has an accessible label in Spanish
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/NIT\/RUC/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ciudad/i)).toBeInTheDocument();
  });
});

// ─── AC3: Client-side Zod validation — empty fields → inline errors ─────────

describe('AC3 — Validación Zod: campos vacíos muestran errores inline', () => {
  it('should display inline error "El nombre es requerido" when Nombre is empty on submit', async () => {
    // GIVEN: Component is mounted with an empty form
    renderClienteForm();

    // WHEN: User submits without filling Nombre
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: Inline error appears for Nombre
    await waitFor(() => {
      expect(screen.getByTestId('error-nombre')).toHaveTextContent('El nombre es requerido');
    });
  });

  it('should display inline error "El NIT/RUC es requerido" when NIT is empty on submit', async () => {
    // GIVEN: Component is mounted with an empty form
    renderClienteForm();

    // WHEN: User submits without filling NIT
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: Inline error appears for NIT
    await waitFor(() => {
      expect(screen.getByTestId('error-nit')).toHaveTextContent('El NIT/RUC es requerido');
    });
  });

  it('should display inline error "El teléfono es requerido" when Teléfono is empty on submit', async () => {
    // GIVEN: Component is mounted with an empty form
    renderClienteForm();

    // WHEN: User submits without filling Teléfono
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: Inline error appears for Teléfono
    await waitFor(() => {
      expect(screen.getByTestId('error-telefono')).toHaveTextContent('El teléfono es requerido');
    });
  });

  it('should display inline error "La ciudad es requerida" when Ciudad is empty on submit', async () => {
    // GIVEN: Component is mounted with an empty form
    renderClienteForm();

    // WHEN: User submits without filling Ciudad
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: Inline error appears for Ciudad
    await waitFor(() => {
      expect(screen.getByTestId('error-ciudad')).toHaveTextContent('La ciudad es requerida');
    });
  });

  it('should NOT call the API when the form has validation errors', async () => {
    // GIVEN: API is intercepted to detect unwanted calls
    let postCallCount = 0;
    server.use(
      http.post(API_URL, () => {
        postCallCount++;
        return HttpResponse.json(clienteCreatedStub, { status: 201 });
      }),
    );
    renderClienteForm();

    // WHEN: User submits with empty form
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: No API call was made
    await waitFor(() => expect(postCallCount).toBe(0));
  });
});

// ─── AC2: Submitting valid form → API call + onSuccess callback ──────────────

describe('AC2 — Envío exitoso: llama API y ejecuta onSuccess', () => {
  it('should call the API with the correct payload on valid submit', async () => {
    // GIVEN: API is intercepted to capture request body
    let capturedBody: unknown = null;
    server.use(
      http.post(API_URL, async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json(clienteCreatedStub, { status: 201 });
      }),
    );
    renderClienteForm();

    // WHEN: User fills the form and submits
    await fillForm();
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: API was called with the correct data
    await waitFor(() => {
      expect(capturedBody).toMatchObject({
        nombre: 'Empresa Form Test SA',
        nit: '900444555-6',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      });
    });
  });

  it('should call onSuccess callback after a successful submit', async () => {
    // GIVEN: MSW returns 201
    const onSuccess = vi.fn();
    renderClienteForm({ onSuccess });

    // WHEN: User fills and submits the form
    await fillForm();
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: onSuccess is called
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it('should disable the submit button while the mutation is pending', async () => {
    // GIVEN: API handler is delayed
    server.use(
      http.post(API_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return HttpResponse.json(clienteCreatedStub, { status: 201 });
      }),
    );
    renderClienteForm();
    await fillForm();

    // WHEN: User clicks submit
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: Submit button is disabled while pending
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit-cliente')).toBeDisabled();
    });
  });

  it('should show "Guardando…" on the submit button while mutation is pending', async () => {
    // GIVEN: API handler is delayed
    server.use(
      http.post(API_URL, async () => {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return HttpResponse.json(clienteCreatedStub, { status: 201 });
      }),
    );
    renderClienteForm();
    await fillForm();

    // WHEN: User clicks submit
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: Submit button text changes to "Guardando…"
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit-cliente')).toHaveTextContent('Guardando');
    });
  });
});

// ─── AC4: 409 Conflict → inline NIT error ────────────────────────────────────

describe('AC4 — Conflicto 409: muestra error inline en campo NIT', () => {
  it('should display inline error "El NIT/RUC ya está registrado" on 409 response', async () => {
    // GIVEN: API returns 409 Conflict
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );
    renderClienteForm();
    await fillForm();

    // WHEN: User submits the form
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: Inline error on NIT field
    await waitFor(() => {
      expect(screen.getByTestId('error-nit')).toHaveTextContent('El NIT/RUC ya está registrado');
    });
  });

  it('should keep the form open (not call onSuccess) on 409 response', async () => {
    // GIVEN: API returns 409 Conflict
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );
    const onSuccess = vi.fn();
    renderClienteForm({ onSuccess });
    await fillForm();

    // WHEN: User submits the form
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: onSuccess was NOT called
    await waitFor(() => expect(screen.getByTestId('error-nit')).toBeInTheDocument());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should preserve the entered Nombre value after 409 response', async () => {
    // GIVEN: API returns 409 Conflict
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json(
          { title: 'Conflict', status: 409, detail: 'El NIT/RUC ya está registrado.' },
          { status: 409 },
        ),
      ),
    );
    renderClienteForm();
    await fillForm({ nombre: 'Empresa Persistida' });

    // WHEN: User submits the form
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: Nombre field still has the entered value
    await waitFor(() => expect(screen.getByTestId('error-nit')).toBeInTheDocument());
    expect(screen.getByTestId('input-nombre')).toHaveValue('Empresa Persistida');
  });
});

// ─── AC5: 5xx error → toast error, form stays open ───────────────────────────

describe('AC5 — Error 5xx: toast de error y formulario permanece abierto', () => {
  it('should NOT call onSuccess when the backend returns 500', async () => {
    // GIVEN: API returns 500 Server Error
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 }),
      ),
    );
    const onSuccess = vi.fn();
    renderClienteForm({ onSuccess });
    await fillForm();

    // WHEN: User submits the form
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: onSuccess is NOT called (form stays open)
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit-cliente')).not.toBeDisabled();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('should preserve entered field values after a 500 server error', async () => {
    // GIVEN: API returns 500 Server Error
    server.use(
      http.post(API_URL, () =>
        HttpResponse.json({ title: 'Internal Server Error', status: 500 }, { status: 500 }),
      ),
    );
    renderClienteForm();
    await fillForm({ nombre: 'Empresa Error Test' });

    // WHEN: User submits the form
    await userEvent.click(screen.getByTestId('btn-submit-cliente'));

    // THEN: Nombre field still has the entered value after error
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit-cliente')).not.toBeDisabled();
    });
    expect(screen.getByTestId('input-nombre')).toHaveValue('Empresa Error Test');
  });
});

// ─── AC6: "Cancelar" closes form without sending any request ─────────────────

describe('AC6 — Cancelar: llama onCancel sin enviar petición', () => {
  it('should call onCancel when the "Cancelar" button is clicked', async () => {
    // GIVEN: Component is mounted
    const onCancel = vi.fn();
    renderClienteForm({ onCancel });

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('btn-cancelar-cliente'));

    // THEN: onCancel is called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should NOT call the API when "Cancelar" is clicked', async () => {
    // GIVEN: API is intercepted to detect unwanted calls
    let postCallCount = 0;
    server.use(
      http.post(API_URL, () => {
        postCallCount++;
        return HttpResponse.json(clienteCreatedStub, { status: 201 });
      }),
    );
    renderClienteForm();
    await fillForm();

    // WHEN: User clicks "Cancelar" instead of submitting
    await userEvent.click(screen.getByTestId('btn-cancelar-cliente'));

    // THEN: No POST request was sent
    expect(postCallCount).toBe(0);
  });

  it('should NOT call onSuccess when "Cancelar" is clicked', async () => {
    // GIVEN: Component is mounted
    const onSuccess = vi.fn();
    renderClienteForm({ onSuccess });
    await fillForm();

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('btn-cancelar-cliente'));

    // THEN: onSuccess is NOT called
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
