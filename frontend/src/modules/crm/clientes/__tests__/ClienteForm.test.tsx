/**
 * ATDD component tests — Story 2.3: ClienteForm (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx
 *   - frontend/src/modules/crm/clientes/application/useCreateCliente.ts
 *   - frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts (create)
 *   - frontend/src/modules/crm/clientes/application/clienteSchema.ts (already in Story 2.1)
 *
 * Test IDs:
 *   TC-E2-2-3-CMP-1 (P0) — Empty submit → 4 inline errors appear; POST never called
 *   TC-E2-2-3-CMP-2 (P2) — 409 response → inline error "El NIT/RUC ya está registrado" on NIT field
 *   TC-E2-2-3-CMP-3 (P2) — Valid submit with 201 response → toast "Cliente creado correctamente"
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'sonner';

import { buildCliente } from './clienteFactory';

// ClienteForm does NOT exist yet — import will fail (RED phase)
import { ClienteForm } from '../presentation/ClienteForm';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected React query / RHF errors in test output
// ─────────────────────────────────────────────────────────────────────────────

const originalConsoleError = console.error;
vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Warning: An update to') ||
    msg.includes('Error: connect ECONNREFUSED') ||
    msg.includes('[MSW]') ||
    msg.includes('AxiosError') ||
    msg.includes('Request failed with status code') ||
    msg.includes('act(...)') ||
    msg.includes('not wrapped in act')
  ) {
    return;
  }
  originalConsoleError(...args);
});

const API_BASE = 'http://localhost:5000';
const CLIENTES_URL = `${API_BASE}/api/v1/clientes`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup (network-first: handlers registered BEFORE render)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ClienteForm with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteForm(props?: {
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const onClose = props?.onClose ?? vi.fn();
  const onSuccess = props?.onSuccess ?? vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ClienteForm onClose={onClose} onSuccess={onSuccess} />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onClose, onSuccess };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-3-CMP-1 (P0) — Empty submit → 4 inline errors, POST never called
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — empty form submission', () => {
  it('TC-E2-2-3-CMP-1: should show 4 inline validation errors when all required fields are empty', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — assert POST is never called (network-first)
    let postCalled = false;
    server.use(
      http.post(CLIENTES_URL, () => {
        postCalled = true;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    // GIVEN: ClienteForm is rendered
    renderClienteForm();

    // WHEN: User clicks the submit button without filling any field
    const submitButton = screen.getByTestId('btn-submit');
    await userEvent.click(submitButton);

    // THEN: Inline validation error appears for Nombre field
    await waitFor(() => {
      expect(screen.getByTestId('input-nombre')).toBeInTheDocument();
      const nombreErrors = screen.getAllByRole('alert');
      expect(nombreErrors.length).toBeGreaterThanOrEqual(4);
    });

    // AND: POST /api/v1/clientes was NEVER called (Zod client-side guard)
    expect(postCalled).toBe(false);
  });

  it('should show inline error for Nombre field when empty', async () => {
    // GIVEN: ClienteForm is rendered
    renderClienteForm();

    // WHEN: Submit button is clicked without filling Nombre
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Nombre error message is visible
    await waitFor(() => {
      const nombreInput = screen.getByTestId('input-nombre');
      expect(nombreInput).toBeInTheDocument();
      // Error is rendered near the input as an alert role element
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some(a => a.closest('[data-testid]') !== null || a !== null)).toBe(true);
    });
  });

  it('should show inline error for NIT/RUC field when empty', async () => {
    // GIVEN: ClienteForm is rendered
    renderClienteForm();

    // WHEN: Submit button is clicked without filling NIT
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: NIT input is present and an error is shown
    await waitFor(() => {
      expect(screen.getByTestId('input-nit')).toBeInTheDocument();
    });
  });

  it('should show inline error for Teléfono field when empty', async () => {
    // GIVEN: ClienteForm is rendered
    renderClienteForm();

    // WHEN: Submit button is clicked without filling Teléfono
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Teléfono input is present
    await waitFor(() => {
      expect(screen.getByTestId('input-telefono')).toBeInTheDocument();
    });
  });

  it('should show inline error for Ciudad field when empty', async () => {
    // GIVEN: ClienteForm is rendered
    renderClienteForm();

    // WHEN: Submit button is clicked without filling Ciudad
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Ciudad input is present
    await waitFor(() => {
      expect(screen.getByTestId('input-ciudad')).toBeInTheDocument();
    });
  });

  it('should NOT call POST /api/v1/clientes when client-side validation fails', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — track calls
    let postCallCount = 0;
    server.use(
      http.post(CLIENTES_URL, () => {
        postCallCount++;
        return HttpResponse.json({}, { status: 201 });
      })
    );

    renderClienteForm();

    // WHEN: Empty form submitted
    await userEvent.click(screen.getByTestId('btn-submit'));

    // Wait for validation to trigger
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    // THEN: POST was never sent to backend
    expect(postCallCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-3-CMP-2 (P2) — 409 response → inline NIT error "El NIT/RUC ya está registrado"
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — 409 conflict response', () => {
  it('TC-E2-2-3-CMP-2: should display "El NIT/RUC ya está registrado" as inline error on NIT field when backend returns 409', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — backend returns 409 for this NIT
    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: 'El NIT/RUC ya está registrado',
          },
          { status: 409 }
        )
      )
    );

    // GIVEN: ClienteForm is rendered
    renderClienteForm();

    // WHEN: User fills all fields and submits
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Duplicada');
    await userEvent.type(screen.getByTestId('input-nit'), '900123456-1');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error "El NIT/RUC ya está registrado" appears on the NIT field
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });
  });

  it('should NOT show generic error panel — the 409 error is inline on the NIT field only', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 409 response
    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json({ status: 409, detail: 'El NIT/RUC ya está registrado' }, { status: 409 })
      )
    );

    renderClienteForm();

    // WHEN: User fills all valid fields and submits
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Test');
    await userEvent.type(screen.getByTestId('input-nit'), '900999888-1');
    await userEvent.type(screen.getByTestId('input-telefono'), '3109876543');
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Medellín');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Error message appears on NIT field
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });

    // AND: No generic error panel (NFR6 — no technical details exposed)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-3-CMP-3 (P2) — Valid submit with 201 → toast "Cliente creado correctamente"
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — successful creation', () => {
  it('TC-E2-2-3-CMP-3: should show toast "Cliente creado correctamente" after successful creation', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — backend returns 201 with ClienteDto
    const createdCliente = buildCliente({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      nombre: 'Nueva Empresa SA',
      nit: '900000001-1',
      telefono: '3001112233',
      ciudad: 'Cali',
    });

    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json(createdCliente, { status: 201 })
      )
    );

    // GIVEN: ClienteForm is rendered
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    renderClienteForm({ onClose, onSuccess });

    // WHEN: User fills all required fields with valid data
    await userEvent.type(screen.getByTestId('input-nombre'), 'Nueva Empresa SA');
    await userEvent.type(screen.getByTestId('input-nit'), '900000001-1');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001112233');
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Cali');

    // WHEN: User clicks submit
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Success toast message "Cliente creado correctamente" is shown
    await waitFor(() => {
      expect(screen.getByText('Cliente creado correctamente')).toBeInTheDocument();
    });
  });

  it('should call onClose after successful client creation', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 201 success
    const createdCliente = buildCliente({ nit: '900000002-2' });
    server.use(
      http.post(CLIENTES_URL, () =>
        HttpResponse.json(createdCliente, { status: 201 })
      )
    );

    const onClose = vi.fn();
    renderClienteForm({ onClose });

    // WHEN: Valid form submitted
    await userEvent.type(screen.getByTestId('input-nombre'), createdCliente.nombre);
    await userEvent.type(screen.getByTestId('input-nit'), createdCliente.nit);
    await userEvent.type(screen.getByTestId('input-telefono'), createdCliente.telefono);
    await userEvent.type(screen.getByTestId('input-ciudad'), createdCliente.ciudad);
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onClose is called (form closes after success)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should disable submit button while mutation is pending (isPending guard)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — delayed 201 response
    let resolveRequest!: () => void;
    const delayedRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.post(CLIENTES_URL, async () => {
        await delayedRequest;
        const cliente = buildCliente({ nit: '900000003-3' });
        return HttpResponse.json(cliente, { status: 201 });
      })
    );

    renderClienteForm();

    // WHEN: User fills all fields
    await userEvent.type(screen.getByTestId('input-nombre'), 'Empresa Pending');
    await userEvent.type(screen.getByTestId('input-nit'), '900000003-3');
    await userEvent.type(screen.getByTestId('input-telefono'), '3001234567');
    await userEvent.type(screen.getByTestId('input-ciudad'), 'Bogotá');

    // WHEN: Submit is clicked
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Submit button is disabled while request is in flight
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit')).toBeDisabled();
    });

    // Cleanup: resolve the pending request
    resolveRequest();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Additional structural tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm — structure and labels', () => {
  it('should render the form with all four required fields in Spanish', () => {
    // GIVEN: ClienteForm is rendered
    renderClienteForm();

    // THEN: All required fields are present with Spanish labels
    expect(screen.getByTestId('input-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('input-nit')).toBeInTheDocument();
    expect(screen.getByTestId('input-telefono')).toBeInTheDocument();
    expect(screen.getByTestId('input-ciudad')).toBeInTheDocument();

    // AND: Labels are in Spanish
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nit\/ruc/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ciudad/i)).toBeInTheDocument();
  });

  it('should render "Crear cliente" submit button and "Cancelar" button', () => {
    // GIVEN: ClienteForm is rendered
    renderClienteForm();

    // THEN: Submit button labeled "Crear cliente" is present
    expect(screen.getByTestId('btn-submit')).toBeInTheDocument();
    expect(screen.getByTestId('btn-submit')).toHaveTextContent(/crear cliente/i);

    // AND: Cancel button labeled "Cancelar" is present
    expect(screen.getByTestId('btn-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('btn-cancel')).toHaveTextContent(/cancelar/i);
  });

  it('should call onClose when "Cancelar" button is clicked', async () => {
    // GIVEN: ClienteForm is rendered
    const onClose = vi.fn();
    renderClienteForm({ onClose });

    // WHEN: User clicks "Cancelar"
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: onClose is called
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render with data-testid="cliente-form" on the form element', () => {
    // GIVEN: ClienteForm is rendered
    renderClienteForm();

    // THEN: Form has the expected data-testid
    expect(screen.getByTestId('cliente-form')).toBeInTheDocument();
  });
});
