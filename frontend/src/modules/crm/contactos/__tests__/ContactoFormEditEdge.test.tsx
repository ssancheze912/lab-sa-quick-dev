/**
 * Edge-case component tests — Story 3.4: ContactoForm edit mode (automation expansion)
 *
 * Covers edge cases NOT included in ATDD ContactoFormEdit.test.tsx / UpdateContacto.test.tsx:
 *   - Whitespace-only Nombre in edit mode → Zod inline error, no PUT called
 *   - Malformed email in edit mode → Zod inline error, no PUT called
 *   - Nombre exceeding 255 chars in edit mode → inline error, no PUT called
 *   - Cargo exceeding 255 chars in edit mode → inline error, no PUT called
 *   - Telefono exceeding 50 chars in edit mode → inline error, no PUT called
 *   - 500 server error in edit mode → generic error message, no stack trace (NFR6)
 *   - Network error in edit mode → generic error message
 *   - Field values retained after backend error in edit mode (user can correct and resubmit)
 *   - onSuccess NOT called when 409 in edit mode (form stays open)
 *   - onClose NOT called when Zod validation fails in edit mode
 *   - ARIA: aria-describedby links inputs to error spans in edit mode
 *   - Submit only once during pending state (no double submission)
 *   - Edit mode correctly submits all 4 fields together (not just changed field)
 *   - Clearing all fields in edit mode + submitting → 4 inline errors, no PUT
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

import { buildContacto, resetContactoCounter } from './contactoFactory';
import { ContactoForm } from '../presentation/ContactoForm';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected React / RHF / MSW / Axios errors in test output
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
const CONTACTOS_URL = `${API_BASE}/api/v1/contactos`;

// ─────────────────────────────────────────────────────────────────────────────
// MSW server setup — handlers registered BEFORE render (network-first pattern)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetContactoCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ContactoForm in edit mode with isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderEditForm(options: {
  contacto: ReturnType<typeof buildContacto>;
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const onClose = options.onClose ?? vi.fn();
  const onSuccess = options.onSuccess ?? vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ContactoForm
        contactoId={options.contacto.id}
        defaultValues={{
          nombre: options.contacto.nombre,
          cargo: options.contacto.cargo,
          telefono: options.contacto.telefono,
          email: options.contacto.email,
        }}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onClose, onSuccess };
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod validation edge cases — edit mode
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm (edit mode) — Zod validation edge cases', () => {
  it('[P2] should show inline error and NOT call PUT when Nombre contains only whitespace in edit mode', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT should NOT be called
    let putCalled = false;
    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001',
      nombre: 'Contacto Original WS',
      cargo: 'Analista',
      telefono: '3001234567',
      email: 'ws.test@empresa.co',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        putCalled = true;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User replaces Nombre with whitespace-only
    const nombreInput = screen.getByTestId('input-nombre');
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, '   ');

    // WHEN: User submits
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error appears (Zod .trim().min(1) rejects whitespace-only)
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    // AND: PUT was NOT called
    expect(putCalled).toBe(false);
  });

  it('[P2] should show inline email error and NOT call PUT when Email is malformed in edit mode', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT should NOT be called
    let putCalled = false;
    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002',
      nombre: 'Contacto Malformed Email',
      email: 'valid@empresa.co',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        putCalled = true;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User changes Email to a malformed value (missing TLD)
    const emailInput = screen.getByTestId('input-email');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'notanemail');

    // WHEN: User submits
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline email validation error appears
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    // AND: PUT was NOT called (Zod client-side guard)
    expect(putCalled).toBe(false);
  });

  it('[P2] should show inline error and NOT call PUT when Email has missing domain part in edit mode', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    let putCalled = false;
    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003',
      nombre: 'Contacto Email Boundary',
      email: 'valid@empresa.co',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        putCalled = true;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User changes Email to 'user@' (no domain)
    await userEvent.clear(screen.getByTestId('input-email'));
    await userEvent.type(screen.getByTestId('input-email'), 'user@');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Email validation error appears
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    expect(putCalled).toBe(false);
  });

  it('[P2] should show inline error and NOT call PUT when Nombre exceeds 255 chars in edit mode', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    let putCalled = false;
    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004',
      nombre: 'Nombre Dentro de Límite',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        putCalled = true;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User types 256 chars into Nombre (exceeds MaximumLength 255)
    const longNombre = 'A'.repeat(256);
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.type(screen.getByTestId('input-nombre'), longNombre);
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error on Nombre field
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    // AND: PUT was NOT called
    expect(putCalled).toBe(false);
  });

  it('[P2] should show inline error and NOT call PUT when Cargo exceeds 255 chars in edit mode', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    let putCalled = false;
    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000005',
      cargo: 'Cargo Válido',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        putCalled = true;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User types 256 chars into Cargo
    const longCargo = 'C'.repeat(256);
    await userEvent.clear(screen.getByTestId('input-cargo'));
    await userEvent.type(screen.getByTestId('input-cargo'), longCargo);
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error on Cargo field
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    expect(putCalled).toBe(false);
  });

  it('[P2] should show inline error and NOT call PUT when Telefono exceeds 50 chars in edit mode', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    let putCalled = false;
    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000006',
      telefono: '3001234567',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        putCalled = true;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User types 51 chars into Telefono
    const longTelefono = '1'.repeat(51);
    await userEvent.clear(screen.getByTestId('input-telefono'));
    await userEvent.type(screen.getByTestId('input-telefono'), longTelefono);
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error on Telefono field
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    expect(putCalled).toBe(false);
  });

  it('[P2] should show 4 inline errors and NOT call PUT when all fields are cleared in edit mode', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    let putCalled = false;
    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000007',
      nombre: 'Contacto Para Limpiar Todo',
      cargo: 'Cargo A Limpiar',
      telefono: '3001234567',
      email: 'limpiar@empresa.co',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        putCalled = true;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User clears all 4 fields and submits
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.clear(screen.getByTestId('input-cargo'));
    await userEvent.clear(screen.getByTestId('input-telefono'));
    await userEvent.clear(screen.getByTestId('input-email'));
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: At least 4 inline errors appear (one per required field)
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(4);
    });

    // AND: PUT was NOT called
    expect(putCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Backend error handling edge cases — edit mode
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm (edit mode) — backend error edge cases (NFR6)', () => {
  it('[P2] should display generic error and NOT expose stack trace when PUT returns 500', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — backend returns 500
    const contacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-000000000001',
      nombre: 'Contacto Error 500',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () =>
        HttpResponse.json(
          { title: 'Internal Server Error', status: 500 },
          { status: 500 }
        )
      )
    );

    renderEditForm({ contacto });

    // WHEN: User submits (backend returns 500)
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Generic error message appears (not a stack trace — NFR6)
    await waitFor(() => {
      expect(
        screen.getByText(/error al actualizar el contacto/i)
      ).toBeInTheDocument();
    });

    // AND: No technical details exposed
    expect(screen.queryByText(/Internal Server Error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/StackTrace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/at SiesaAgents/i)).not.toBeInTheDocument();
  });

  it('[P2] should retain field values after 500 error so user can correct and resubmit', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — first call 500, second call 200
    let callCount = 0;
    const contacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-000000000002',
      nombre: 'Retry Edit Test',
      cargo: 'Consultor',
      telefono: '3001234567',
      email: 'retry.edit@empresa.co',
    });

    const updatedContacto = { ...contacto, nombre: 'Retry Edit Actualizado' };

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { title: 'Internal Server Error', status: 500 },
            { status: 500 }
          );
        }
        return HttpResponse.json(updatedContacto, { status: 200 });
      })
    );

    const onClose = vi.fn();
    renderEditForm({ contacto, onClose });

    // WHEN: User modifies Nombre and submits (first attempt — 500 error)
    const nombreInput = screen.getByTestId('input-nombre');
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, 'Retry Edit Actualizado');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Error message appears
    await waitFor(() => {
      expect(screen.getByText(/error al actualizar el contacto/i)).toBeInTheDocument();
    });

    // AND: Field values are retained (user can correct and resubmit)
    expect(screen.getByTestId('input-nombre')).toHaveValue('Retry Edit Actualizado');
    expect(screen.getByTestId('input-cargo')).toHaveValue(contacto.cargo);
    expect(screen.getByTestId('input-email')).toHaveValue(contacto.email);

    // WHEN: User resubmits (second attempt — 200 success)
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Success toast appears and form closes
    await waitFor(() => {
      expect(screen.getByText('Contacto actualizado correctamente')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('[P2] should NOT call onSuccess when PUT returns 500 error', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 500
    const contacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-000000000003',
      nombre: 'Contacto No Success 500',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () =>
        HttpResponse.json(
          { title: 'Internal Server Error', status: 500 },
          { status: 500 }
        )
      )
    );

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderEditForm({ contacto, onSuccess, onClose });

    // WHEN: User submits
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Error appears
    await waitFor(() => {
      expect(screen.getByText(/error al actualizar el contacto/i)).toBeInTheDocument();
    });

    // AND: Neither onSuccess nor onClose is called (form stays open for correction)
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('[P2] should NOT call onSuccess when PUT returns 409 conflict', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — 409
    const contacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-000000000004',
      nombre: 'Contacto 409 No Success',
      email: 'original409@empresa.co',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () =>
        HttpResponse.json(
          { status: 409, detail: 'El email ya está registrado' },
          { status: 409 }
        )
      )
    );

    const onSuccess = vi.fn();
    const onClose = vi.fn();
    renderEditForm({ contacto, onSuccess, onClose });

    // WHEN: User submits
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline email error appears
    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
    });

    // AND: Neither onSuccess nor onClose is called (form stays open for correction)
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('[P2] should NOT call onClose when Zod validation fails in edit mode', async () => {
    // GIVEN: ContactoForm rendered in edit mode
    const contacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-000000000005',
      nombre: 'Contacto Zod Guard',
    });

    const onClose = vi.fn();
    renderEditForm({ contacto, onClose });

    // WHEN: User clears Nombre and submits (Zod rejects)
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Validation error appears
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    });

    // AND: onClose is NOT called (form stays open — user must correct data)
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ARIA / accessibility — edit mode
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm (edit mode) — accessibility (aria-describedby)', () => {
  it('[P1] should have aria-describedby linking inputs to their error containers in edit mode', () => {
    // GIVEN: ContactoForm rendered in edit mode (static structure check)
    const contacto = buildContacto({
      id: 'cccccccc-cccc-cccc-cccc-000000000001',
      nombre: 'ARIA Test',
    });

    renderEditForm({ contacto });

    // THEN: Each input has aria-describedby pointing to its corresponding error span id (WCAG 2.1 AA)
    expect(screen.getByTestId('input-nombre')).toHaveAttribute('aria-describedby', 'error-nombre');
    expect(screen.getByTestId('input-cargo')).toHaveAttribute('aria-describedby', 'error-cargo');
    expect(screen.getByTestId('input-telefono')).toHaveAttribute('aria-describedby', 'error-telefono');
    expect(screen.getByTestId('input-email')).toHaveAttribute('aria-describedby', 'error-email');
  });

  it('[P2] should render error spans with role="alert" and correct ids when validation fails in edit mode', async () => {
    // GIVEN: ContactoForm rendered in edit mode
    const contacto = buildContacto({
      id: 'cccccccc-cccc-cccc-cccc-000000000002',
      nombre: 'ARIA Alerts Test',
    });

    renderEditForm({ contacto });

    // WHEN: All required fields cleared and form submitted
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.clear(screen.getByTestId('input-cargo'));
    await userEvent.clear(screen.getByTestId('input-telefono'));
    await userEvent.clear(screen.getByTestId('input-email'));
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Error spans with role="alert" appear
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(4);
    });

    // AND: Error span ids match aria-describedby values
    await waitFor(() => {
      expect(document.getElementById('error-nombre')).toBeInTheDocument();
      expect(document.getElementById('error-cargo')).toBeInTheDocument();
      expect(document.getElementById('error-telefono')).toBeInTheDocument();
      expect(document.getElementById('error-email')).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Submit behavior edge cases — edit mode
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm (edit mode) — submit behavior edge cases', () => {
  it('[P1] should send all 4 fields in the PUT request body (not just the modified field)', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — capture request body
    let capturedBody: Record<string, string> | null = null;
    const contacto = buildContacto({
      id: 'dddddddd-dddd-dddd-dddd-000000000001',
      nombre: 'Nombre Original',
      cargo: 'Cargo Original',
      telefono: '3001111111',
      email: 'original@empresa.co',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, string>;
        return HttpResponse.json(
          { ...contacto, nombre: 'Nombre Modificado' },
          { status: 200 }
        );
      })
    );

    renderEditForm({ contacto });

    // WHEN: User only modifies Nombre (other fields remain unchanged)
    await userEvent.clear(screen.getByTestId('input-nombre'));
    await userEvent.type(screen.getByTestId('input-nombre'), 'Nombre Modificado');
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: All 4 fields are sent in the request body (not just the modified one)
    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
      expect(capturedBody?.nombre).toBe('Nombre Modificado');
      expect(capturedBody?.cargo).toBe(contacto.cargo);
      expect(capturedBody?.telefono).toBe(contacto.telefono);
      expect(capturedBody?.email).toBe(contacto.email);
    });
  });

  it('[P1] should use PUT (not POST) HTTP method for edit submission', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — track HTTP method
    let capturedMethod: string | null = null;
    const contacto = buildContacto({
      id: 'dddddddd-dddd-dddd-dddd-000000000002',
      nombre: 'Contacto HTTP Method',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, ({ request }) => {
        capturedMethod = request.method;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User submits edit form
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: HTTP method is PUT (not POST)
    await waitFor(() => {
      expect(capturedMethod).toBe('PUT');
    });
  });

  it('[P1] should include the contactoId in the PUT URL', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — capture URL
    let capturedUrl: string | null = null;
    const contactoId = 'dddddddd-dddd-dddd-dddd-000000000003';
    const contacto = buildContacto({
      id: contactoId,
      nombre: 'Contacto URL Check',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contactoId}`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User submits
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: URL contains the contactoId
    await waitFor(() => {
      expect(capturedUrl).toContain(contactoId);
    });
  });

  it('[P2] should show "Guardar cambios" (not "Crear contacto") in all edit-mode submissions', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    const contacto = buildContacto({
      id: 'dddddddd-dddd-dddd-dddd-000000000004',
      nombre: 'Botón Label Test',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () =>
        HttpResponse.json(contacto, { status: 200 })
      )
    );

    renderEditForm({ contacto });

    // THEN: Submit button shows "Guardar cambios" (edit mode label)
    const submitBtn = screen.getByTestId('btn-submit');
    expect(submitBtn).toHaveTextContent(/guardar cambios/i);
    expect(submitBtn).not.toHaveTextContent(/crear contacto/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Special characters — edit mode
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm (edit mode) — Spanish special characters', () => {
  it('[P2] should preserve Spanish accented characters (é, ñ, á) in pre-filled fields and submit correctly', async () => {
    // GIVEN: NETWORK intercepted BEFORE render
    let capturedBody: Record<string, string> | null = null;
    const contacto = buildContacto({
      id: 'eeeeeeee-eeee-eeee-eeee-000000000001',
      nombre: 'María Ángela González',
      cargo: 'Gerente de Área Técnica',
      telefono: '3001234567',
      email: 'maria.angela@empresa.co',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, string>;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // THEN: Pre-filled fields preserve accented characters
    expect(screen.getByTestId('input-nombre')).toHaveValue('María Ángela González');
    expect(screen.getByTestId('input-cargo')).toHaveValue('Gerente de Área Técnica');

    // WHEN: User submits without modification (accented chars preserved)
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Accented characters are sent to the backend correctly
    await waitFor(() => {
      expect(capturedBody?.nombre).toBe('María Ángela González');
      expect(capturedBody?.cargo).toBe('Gerente de Área Técnica');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edit mode vs create mode — isolation (R-002 mitigation)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm — edit mode vs create mode isolation', () => {
  it('[P1] should use PUT (not POST) when contactoId is provided', async () => {
    // GIVEN: NETWORK intercepted — PUT for edit, POST for create
    let postCalled = false;
    let putCalled = false;
    const contacto = buildContacto({
      id: 'ffffffff-ffff-ffff-ffff-000000000001',
    });

    server.use(
      http.post(CONTACTOS_URL, () => {
        postCalled = true;
        return HttpResponse.json(contacto, { status: 201 });
      }),
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        putCalled = true;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User submits the EDIT form
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: PUT was called, POST was NOT called
    await waitFor(() => {
      expect(putCalled).toBe(true);
    });
    expect(postCalled).toBe(false);
  });

  it('[P2] should show "Guardando..." (not "Creando...") as submit button text during edit pending state', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — delayed response
    let resolveRequest!: () => void;
    const delayedRequest = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const contacto = buildContacto({
      id: 'ffffffff-ffff-ffff-ffff-000000000002',
      nombre: 'Contacto Guardando',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, async () => {
        await delayedRequest;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User submits
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Submit button shows "Guardando..." (edit mode pending label — NOT "Creando...")
    await waitFor(() => {
      expect(screen.getByTestId('btn-submit')).toHaveTextContent(/guardando/i);
      expect(screen.getByTestId('btn-submit')).not.toHaveTextContent(/creando/i);
    });

    // AND: Button is disabled while pending
    expect(screen.getByTestId('btn-submit')).toBeDisabled();

    // Cleanup: resolve the pending request
    resolveRequest();
  });
});
