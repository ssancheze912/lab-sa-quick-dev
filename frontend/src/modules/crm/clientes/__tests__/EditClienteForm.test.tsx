/**
 * ATDD component tests — Story 2.4: Edit Client (RED phase)
 *
 * Tests fail until the following are implemented:
 *   - frontend/src/modules/crm/clientes/presentation/ClienteForm.tsx (edit-mode props added)
 *   - frontend/src/modules/crm/clientes/application/useUpdateCliente.ts
 *   - frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts (update method)
 *   - frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx (Editar button wired)
 *
 * Test IDs:
 *   TC-E2-2-4-CMP-1 (P1) — ClienteForm in edit mode pre-fills all 4 fields
 *   TC-E2-2-4-CMP-2 (P1) — Cancel edit — original values unchanged, no PUT called
 *   TC-E2-2-4-CMP-3 (P2) — Valid edit submit → toast "Cliente actualizado correctamente"
 *   TC-E2-2-4-CMP-4 (P0) — Empty required field → inline error, no PUT called
 *   TC-E2-2-4-CMP-5 (P2) — 409 response → NIT inline error "El NIT/RUC ya está registrado"
 */

import React from 'react';
import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { Toaster } from 'sonner';

import { buildCliente, resetClienteCounter } from './clienteFactory';

// ClienteForm edit-mode props do NOT exist yet — tests will fail (RED phase)
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
    msg.includes('not wrapped in act') ||
    msg.includes('Network Error')
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
afterEach(() => {
  server.resetHandlers();
  resetClienteCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ClienteForm in EDIT MODE with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderClienteFormEditMode(props: {
  clienteId: string;
  defaultValues: {
    nombre: string;
    nit: string;
    telefono: string;
    ciudad: string;
  };
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const onClose = props.onClose ?? vi.fn();
  const onSuccess = props.onSuccess ?? vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ClienteForm
        clienteId={props.clienteId}
        defaultValues={props.defaultValues}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onClose, onSuccess };
}

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-4-CMP-1 (P1) — ClienteForm in edit mode pre-fills all 4 fields
// Risk: AC #1 — form opens pre-filled with current values (FR6)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — pre-fill fields (AC #1, FR6)', () => {
  it('TC-E2-2-4-CMP-1: should pre-fill all 4 fields with the provided defaultValues when in edit mode', () => {
    // GIVEN: A client fixture with known values
    const cliente = buildCliente({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      nombre: 'Empresa Pre-Rellena SA',
      nit: '900123456-1',
      telefono: '3001234567',
      ciudad: 'Bogotá',
    });

    // GIVEN: NETWORK intercepted BEFORE render (network-first — no PUT should be called yet)
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${cliente.id}`, () => {
        putCalled = true;
        return HttpResponse.json(cliente, { status: 200 });
      })
    );

    // WHEN: ClienteForm is rendered in edit mode with defaultValues
    renderClienteFormEditMode({
      clienteId: cliente.id,
      defaultValues: {
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad,
      },
    });

    // THEN: Nombre input has the pre-filled value
    const nombreInput = screen.getByTestId('input-nombre') as HTMLInputElement;
    expect(nombreInput).toBeInTheDocument();
    expect(nombreInput.value).toBe(cliente.nombre);

    // AND: NIT input has the pre-filled value
    const nitInput = screen.getByTestId('input-nit') as HTMLInputElement;
    expect(nitInput).toBeInTheDocument();
    expect(nitInput.value).toBe(cliente.nit);

    // AND: Telefono input has the pre-filled value
    const telefonoInput = screen.getByTestId('input-telefono') as HTMLInputElement;
    expect(telefonoInput).toBeInTheDocument();
    expect(telefonoInput.value).toBe(cliente.telefono);

    // AND: Ciudad input has the pre-filled value
    const ciudadInput = screen.getByTestId('input-ciudad') as HTMLInputElement;
    expect(ciudadInput).toBeInTheDocument();
    expect(ciudadInput.value).toBe(cliente.ciudad);

    // AND: No PUT was called just by rendering (no accidental auto-submit)
    expect(putCalled).toBe(false);
  });

  it('should show "Guardar cambios" submit button label in edit mode (not "Crear cliente")', () => {
    // GIVEN: ClienteForm rendered in edit mode
    const cliente = buildCliente({ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });

    renderClienteFormEditMode({
      clienteId: cliente.id,
      defaultValues: {
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad,
      },
    });

    // THEN: Submit button shows "Guardar cambios" (edit mode label — not "Crear cliente")
    const submitBtn = screen.getByTestId('btn-submit');
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveTextContent(/guardar cambios/i);
    expect(submitBtn).not.toHaveTextContent(/crear cliente/i);
  });

  it('should render "Cancelar" button in edit mode', () => {
    // GIVEN: ClienteForm rendered in edit mode
    const cliente = buildCliente({ id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' });

    renderClienteFormEditMode({
      clienteId: cliente.id,
      defaultValues: {
        nombre: cliente.nombre,
        nit: cliente.nit,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad,
      },
    });

    // THEN: "Cancelar" button is present (data-testid="btn-cancel")
    expect(screen.getByTestId('btn-cancel')).toBeInTheDocument();
    expect(screen.getByTestId('btn-cancel')).toHaveTextContent(/cancelar/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-4-CMP-2 (P1) — Cancel edit — original values unchanged, no PUT called
// Risk: AC #4, R-009 (cancel keeps original data — React Hook Form discard pattern)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — cancel without saving (AC #4, R-009)', () => {
  it('TC-E2-2-4-CMP-2: should call onClose without calling PUT when "Cancelar" is clicked', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT should never be called
    let putCalled = false;
    const clienteId = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    const originalNombre = 'Empresa Original Para Cancelar SA';
    const onClose = vi.fn();

    // GIVEN: ClienteForm is rendered in edit mode
    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: originalNombre,
        nit: '900123456-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
      onClose,
    });

    // WHEN: User modifies the Nombre field
    const nombreInput = screen.getByTestId('input-nombre');
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, 'Nombre Modificado Que No Se Guardara');

    // WHEN: User clicks "Cancelar" instead of submitting
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: onClose is called (form closes)
    expect(onClose).toHaveBeenCalledTimes(1);

    // AND: PUT to backend was NEVER called (AC #4 — no API call on cancel)
    expect(putCalled).toBe(false);
  });

  it('should call onClose immediately when "Cancelar" is clicked with no modifications', async () => {
    // GIVEN: ClienteForm in edit mode, no changes made
    const clienteId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    const onClose = vi.fn();
    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: 'Empresa Sin Cambios SA',
        nit: '900999888-1',
        telefono: '3109876543',
        ciudad: 'Medellín',
      },
      onClose,
    });

    // WHEN: User clicks "Cancelar" immediately (no modifications)
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: onClose called, no PUT
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(putCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-4-CMP-4 (P0) — Empty required field → inline error, no PUT called
// Risk: AC #3, R-004 (validation divergence between client and server)
// CRITICAL: This is a P0 test — highest priority
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — validation prevents submission (AC #3, R-004) [P0]', () => {
  it('TC-E2-2-4-CMP-4: should show inline error and NOT call PUT when a required field is cleared and submitted', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT must not be called
    const clienteId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    // GIVEN: ClienteForm is rendered in edit mode with valid pre-filled data
    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: 'Empresa Con Nombre',
        nit: '900123456-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });

    // WHEN: User clears the Nombre field (making it empty — required field)
    const nombreInput = screen.getByTestId('input-nombre');
    await userEvent.clear(nombreInput);

    // WHEN: User submits the form
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error message appears on the empty Nombre field
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    // AND: PUT to backend was NEVER called (Zod client-side guard prevents submission)
    expect(putCalled).toBe(false);
  });

  it('should NOT call PUT when NIT field is cleared and form is submitted', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const clienteId = '11111111-2222-3333-4444-555555555555';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: 'Empresa SA',
        nit: '900123456-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });

    // WHEN: User clears NIT and submits
    await userEvent.clear(screen.getByTestId('input-nit'));
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error appears, PUT not called
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(putCalled).toBe(false);
  });

  it('should NOT call PUT when Telefono field is cleared and form is submitted', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const clienteId = '22222222-3333-4444-5555-666666666666';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: 'Empresa SA',
        nit: '900123456-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });

    // WHEN: User clears Telefono and submits
    await userEvent.clear(screen.getByTestId('input-telefono'));
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error appears, PUT not called
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(putCalled).toBe(false);
  });

  it('should NOT call PUT when Ciudad field is cleared and form is submitted', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const clienteId = '33333333-4444-5555-6666-777777777777';
    let putCalled = false;
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () => {
        putCalled = true;
        return HttpResponse.json({}, { status: 200 });
      })
    );

    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: 'Empresa SA',
        nit: '900123456-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });

    // WHEN: User clears Ciudad and submits
    await userEvent.clear(screen.getByTestId('input-ciudad'));
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error appears, PUT not called
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });
    expect(putCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-4-CMP-3 (P2) — Valid edit submit → toast "Cliente actualizado correctamente"
// Risk: AC #2, R-010 (toast exact text must be "Cliente actualizado correctamente")
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — successful update (AC #2, R-010)', () => {
  it('TC-E2-2-4-CMP-3: should show toast "Cliente actualizado correctamente" after successful PUT 200', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT returns 200 with updated ClienteDto
    const clienteId = '44444444-5555-6666-7777-888888888888';
    const updatedCliente = buildCliente({
      id: clienteId,
      nombre: 'Empresa Actualizada SA',
      nit: '900000001-1',
      telefono: '3001112233',
      ciudad: 'Cali',
    });

    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json(updatedCliente, { status: 200 })
      )
    );

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    // GIVEN: ClienteForm rendered in edit mode with original pre-filled data
    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: 'Empresa Original SA',
        nit: '900000001-1',
        telefono: '3001112233',
        ciudad: 'Cali',
      },
      onClose,
      onSuccess,
    });

    // WHEN: User modifies Nombre
    const nombreInput = screen.getByTestId('input-nombre');
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, 'Empresa Actualizada SA');

    // WHEN: User clicks "Guardar cambios"
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Success toast "Cliente actualizado correctamente" appears
    // (exact text per AC #2 and R-010 enforcement)
    await waitFor(() => {
      expect(screen.getByText('Cliente actualizado correctamente')).toBeInTheDocument();
    });
  });

  it('should call onClose after successful edit', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT returns 200
    const clienteId = '55555555-6666-7777-8888-999999999999';
    const updatedCliente = buildCliente({ id: clienteId });
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json(updatedCliente, { status: 200 })
      )
    );

    const onClose = vi.fn();

    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: updatedCliente.nombre,
        nit: updatedCliente.nit,
        telefono: updatedCliente.telefono,
        ciudad: updatedCliente.ciudad,
      },
      onClose,
    });

    // WHEN: User submits unchanged form (still valid data)
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: onClose is called (form closes after successful edit)
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should disable submit button while PUT mutation is pending', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — delayed PUT response
    const clienteId = '66666666-7777-8888-9999-aaaaaaaaaaaa';
    let resolveRequest!: () => void;
    const delayedRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, async () => {
        await delayedRequest;
        const cliente = buildCliente({ id: clienteId });
        return HttpResponse.json(cliente, { status: 200 });
      })
    );

    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: 'Empresa Pending SA',
        nit: '900000099-9',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });

    // WHEN: User submits
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Submit button is disabled while mutation is in-flight (isPending guard)
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit')).toBeDisabled();
    });

    // Cleanup: resolve the pending request
    resolveRequest();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E2-2-4-CMP-5 (P2) — 409 response → NIT inline error "El NIT/RUC ya está registrado"
// Risk: AC conflict (same as Story 2.3 but for edit path)
// ─────────────────────────────────────────────────────────────────────────────

describe('ClienteForm edit mode — 409 NIT conflict response (P2)', () => {
  it('TC-E2-2-4-CMP-5: should display "El NIT/RUC ya está registrado" as inline NIT error when PUT returns 409', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT returns 409 conflict
    const clienteId = '77777777-8888-9999-aaaa-bbbbbbbbbbbb';
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
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

    const onClose = vi.fn();

    // GIVEN: ClienteForm rendered in edit mode
    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: 'Empresa SA',
        nit: '900123456-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
      onClose,
    });

    // WHEN: User changes NIT to one already used by another client
    const nitInput = screen.getByTestId('input-nit');
    await userEvent.clear(nitInput);
    await userEvent.type(nitInput, '900999888-2');

    // WHEN: User submits
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error "El NIT/RUC ya está registrado" appears on the NIT field
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });

    // AND: Form does NOT close (error is shown inline — onClose not called)
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should NOT show generic error panel for 409 — error is inline on NIT field only', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT returns 409
    const clienteId = '88888888-9999-aaaa-bbbb-cccccccccccc';
    server.use(
      http.put(`${CLIENTES_URL}/${clienteId}`, () =>
        HttpResponse.json(
          { status: 409, detail: 'El NIT/RUC ya está registrado' },
          { status: 409 }
        )
      )
    );

    renderClienteFormEditMode({
      clienteId,
      defaultValues: {
        nombre: 'Empresa SA',
        nit: '900123456-1',
        telefono: '3001234567',
        ciudad: 'Bogotá',
      },
    });

    // WHEN: Submit
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: NIT error message appears
    await waitFor(() => {
      expect(screen.getByText('El NIT/RUC ya está registrado')).toBeInTheDocument();
    });

    // AND: No generic error panel (NFR6 — no technical details exposed)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
  });
});
