/**
 * Component tests — Story 3.4: Edit Contact
 *
 * Test IDs covered:
 *   TC-E3-3-4-CMP-1 (P1) — Edit form pre-fills all four fields from fixture (AC #1, R-007)
 *   TC-E3-3-4-CMP-2 (P1) — Cancel edit restores original values (AC #4, R-008)
 *   TC-E3-3-4-CMP-3 (P1) — Clear required field + submit → inline error, no PUT called (AC #3)
 *   TC-E3-3-4-CMP-4 (P2) — Valid edit submit → toast "Contacto actualizado correctamente" (AC #2, R-010)
 *   TC-E3-3-4-CMP-5 (P2) — 409 response → Email field inline error "El email ya está registrado"
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
    msg.includes('not wrapped in act')
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
// TC-E3-3-4-CMP-1 (P1) — Edit form pre-fills all four fields from fixture (AC #1, R-007)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm (edit mode) — pre-fill fields (TC-E3-3-4-CMP-1)', () => {
  it('TC-E3-3-4-CMP-1: should pre-fill all four input fields with fixture values when opened in edit mode', () => {
    // GIVEN: A contacto fixture with all four fields set
    const contacto = buildContacto({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      nombre: 'María López Fixture',
      cargo: 'Directora Comercial',
      telefono: '3009876543',
      email: 'maria.lopez.fixture@empresa.co',
    });

    // WHEN: ContactoForm is rendered in edit mode
    renderEditForm({ contacto });

    // THEN: Each input pre-fills with the fixture value (R-007 mitigation)
    expect(screen.getByTestId('input-nombre')).toHaveValue(contacto.nombre);
    expect(screen.getByTestId('input-cargo')).toHaveValue(contacto.cargo);
    expect(screen.getByTestId('input-telefono')).toHaveValue(contacto.telefono);
    expect(screen.getByTestId('input-email')).toHaveValue(contacto.email);
  });

  it('should show "Guardar cambios" as submit button text in edit mode (not "Crear contacto")', () => {
    // GIVEN: A contacto fixture
    const contacto = buildContacto({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      nombre: 'Test Guardar',
    });

    // WHEN: ContactoForm is rendered in edit mode
    renderEditForm({ contacto });

    // THEN: Submit button shows "Guardar cambios"
    expect(screen.getByTestId('btn-submit')).toHaveTextContent(/guardar cambios/i);

    // AND: NOT "Crear contacto"
    expect(screen.getByTestId('btn-submit')).not.toHaveTextContent(/crear contacto/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-4-CMP-2 (P1) — Cancel edit does not call PUT and keeps original data (AC #4, R-008)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm (edit mode) — cancel restores original values (TC-E3-3-4-CMP-2)', () => {
  it('TC-E3-3-4-CMP-2: should call onClose without calling PUT when Cancel is clicked', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT should NOT be called
    let putCalled = false;
    const contacto = buildContacto({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      nombre: 'Contacto Original Cancel',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        putCalled = true;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    const onClose = vi.fn();
    renderEditForm({ contacto, onClose });

    // WHEN: User modifies the Nombre field
    const nombreInput = screen.getByTestId('input-nombre');
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, 'Nombre Modificado');

    // WHEN: User clicks Cancelar (not Submit)
    await userEvent.click(screen.getByTestId('btn-cancel'));

    // THEN: onClose was called
    expect(onClose).toHaveBeenCalledTimes(1);

    // AND: PUT was NEVER called (AC #4 — no API call on cancel)
    expect(putCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-4-CMP-3 (P1) — Clear required field + submit → inline error, no PUT (AC #3)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm (edit mode) — inline error on empty required field (TC-E3-3-4-CMP-3)', () => {
  it('TC-E3-3-4-CMP-3: should show inline error and NOT call PUT when a required field is cleared and form is submitted', async () => {
    // GIVEN: NETWORK intercepted BEFORE render — PUT should NOT be called
    let putCalled = false;
    const contacto = buildContacto({
      id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      nombre: 'Contacto Para Limpiar',
    });

    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () => {
        putCalled = true;
        return HttpResponse.json(contacto, { status: 200 });
      })
    );

    renderEditForm({ contacto });

    // WHEN: User clears the Nombre field (required)
    const nombreInput = screen.getByTestId('input-nombre');
    await userEvent.clear(nombreInput);

    // WHEN: User submits the form
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error appears (Zod client-side guard)
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    // AND: PUT was NEVER called (AC #3 — client-side guard prevents backend call)
    expect(putCalled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-4-CMP-4 (P2) — Valid edit submit → toast "Contacto actualizado correctamente" (AC #2, R-010)
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm (edit mode) — successful update (TC-E3-3-4-CMP-4)', () => {
  it('TC-E3-3-4-CMP-4: should show toast "Contacto actualizado correctamente" after successful PUT', async () => {
    // GIVEN: A contacto fixture
    const contacto = buildContacto({
      id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      nombre: 'Contacto a Actualizar',
      cargo: 'Analista',
      telefono: '3001234567',
      email: 'actualizar@empresa.co',
    });

    // GIVEN: NETWORK intercepted BEFORE render — PUT returns 200 with updated data
    const updatedContacto = { ...contacto, nombre: 'Contacto Actualizado', updatedAt: new Date().toISOString() };
    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () =>
        HttpResponse.json(updatedContacto, { status: 200 })
      )
    );

    const onClose = vi.fn();
    const onSuccess = vi.fn();
    renderEditForm({ contacto, onClose, onSuccess });

    // WHEN: User modifies Nombre and submits
    const nombreInput = screen.getByTestId('input-nombre');
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, 'Contacto Actualizado');

    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Toast "Contacto actualizado correctamente" appears (R-010 exact Spanish text)
    await waitFor(() => {
      expect(screen.getByText('Contacto actualizado correctamente')).toBeInTheDocument();
    });

    // AND: onSuccess and onClose are called
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-E3-3-4-CMP-5 (P2) — 409 response → Email field inline error
// ─────────────────────────────────────────────────────────────────────────────

describe('ContactoForm (edit mode) — 409 conflict response (TC-E3-3-4-CMP-5)', () => {
  it('TC-E3-3-4-CMP-5: should display "El email ya está registrado" as inline error on Email field when PUT returns 409', async () => {
    // GIVEN: A contacto fixture
    const contacto = buildContacto({
      id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      nombre: 'Contacto Conflicto',
      email: 'original@empresa.co',
    });

    // GIVEN: NETWORK intercepted BEFORE render — PUT returns 409 conflict
    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () =>
        HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflicto de datos',
            status: 409,
            detail: 'El email ya está registrado',
          },
          { status: 409 }
        )
      )
    );

    const onClose = vi.fn();
    renderEditForm({ contacto, onClose });

    // WHEN: User changes the email and submits
    const emailInput = screen.getByTestId('input-email');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'duplicate@empresa.co');

    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Inline error "El email ya está registrado" appears on Email field (NFR6)
    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
    });

    // AND: onClose is NOT called (form stays open for correction)
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should NOT expose technical details on 409 response (NFR6)', async () => {
    // GIVEN: A contacto fixture
    const contacto = buildContacto({
      id: '11111111-1111-1111-1111-000000000001',
      nombre: 'Contacto NFR6',
      email: 'nfr6@empresa.co',
    });

    // GIVEN: NETWORK intercepted BEFORE render — 409 response
    server.use(
      http.put(`${CONTACTOS_URL}/${contacto.id}`, () =>
        HttpResponse.json(
          { status: 409, detail: 'El email ya está registrado' },
          { status: 409 }
        )
      )
    );

    renderEditForm({ contacto });

    // WHEN: User submits
    await userEvent.click(screen.getByTestId('btn-submit'));

    // THEN: Error appears on Email field
    await waitFor(() => {
      expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
    });

    // AND: No technical error panel exposed (NFR6)
    expect(screen.queryByTestId('error-panel')).not.toBeInTheDocument();
    expect(screen.queryByText(/DbUpdateException/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/StackTrace/i)).not.toBeInTheDocument();
  });
});
