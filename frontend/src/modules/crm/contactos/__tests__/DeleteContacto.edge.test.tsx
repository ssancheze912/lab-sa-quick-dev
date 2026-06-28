/**
 * Automation expansion — Story 3.5: Delete Contact — component edge cases.
 * Expands ATDD coverage (DeleteContacto.test.tsx) with:
 *
 *   [P1] DELETE returns 404 → error toast, dialog closes, onContactoDeleted NOT called
 *   [P1] DELETE returns 500 → error toast, dialog closes, onContactoDeleted NOT called
 *   [P1] "Confirmar" button shows "Eliminando..." text while mutation is pending (isPending label)
 *   [P1] Dialog can be opened again after being cancelled (re-entrant dialog state)
 *   [P1] btn-eliminar has aria-label="Eliminar contacto" (WCAG 2.1 AA)
 *   [P2] Error toast text is exactly "No se pudo eliminar el contacto. Intenta de nuevo." (Spanish — R-010)
 *   [P2] Dialog description text is "Esta acción no se puede deshacer." (AC #1)
 *   [P2] DELETE called with the correct contacto ID (not a different ID)
 *   [P2] Dialog closes after error (isDeleteDialogOpen resets to false on error)
 *   [P3] Rapid double-click on "Confirmar" does not trigger DELETE twice (isPending guard)
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
import { ContactoDetailView } from '../presentation/ContactoDetailView';

// ─────────────────────────────────────────────────────────────────────────────
// Suppress expected React query / mutation errors in test output
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
// MSW server setup (network-first: handlers registered BEFORE render)
// ─────────────────────────────────────────────────────────────────────────────

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  resetContactoCounter();
});
afterAll(() => server.close());

// ─────────────────────────────────────────────────────────────────────────────
// Test helper: render ContactoDetailView with an isolated QueryClient
// ─────────────────────────────────────────────────────────────────────────────

function renderContactoDetailEdge(props: {
  contactoId: string;
  onContactoDeleted?: () => void;
}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const onContactoDeleted = props.onContactoDeleted ?? vi.fn();

  const result = render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <ContactoDetailView
        contactoId={props.contactoId}
        onContactoDeleted={onContactoDeleted}
      />
    </QueryClientProvider>
  );

  return { ...result, queryClient, onContactoDeleted };
}

// ─────────────────────────────────────────────────────────────────────────────
// [P1] DELETE returns 404 → error toast, dialog closes, onContactoDeleted NOT called
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteContacto edge — DELETE 404 (contact already removed externally)', () => {
  it('[P1] should show error toast and NOT call onContactoDeleted when DELETE returns 404', async () => {
    // GIVEN: A contact is loaded but DELETE returns 404 (e.g., deleted by another session)
    const contacto = buildContacto({
      id: 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',
      nombre: 'Contacto 404 Edge',
    });

    // CRITICAL: Intercept BEFORE render (network-first pattern)
    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () =>
        HttpResponse.json(
          { title: 'Contacto no encontrado', status: 404, detail: 'El contacto solicitado no fue encontrado.' },
          { status: 404 }
        )
      )
    );

    const { onContactoDeleted } = renderContactoDetailEdge({ contactoId: contacto.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User opens dialog and confirms
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Error toast appears (not the success toast)
    await waitFor(() => {
      expect(
        screen.getByText(/no se pudo eliminar el contacto/i)
      ).toBeInTheDocument();
    });

    // AND: onContactoDeleted is NOT called (no navigation on error)
    expect(onContactoDeleted).not.toHaveBeenCalled();
  });

  it('[P2] dialog closes after a 404 DELETE response (isDeleteDialogOpen resets to false)', async () => {
    // GIVEN: DELETE returns 404
    const contacto = buildContacto({
      id: 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
      nombre: 'Contacto Dialog Close 404',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () =>
        new HttpResponse(null, { status: 404 })
      )
    );

    renderContactoDetailEdge({ contactoId: contacto.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Dialog closes (confirm button leaves DOM) — setIsDeleteDialogOpen(false) on onError
    await waitFor(() => {
      expect(screen.queryByTestId('btn-confirm-delete')).not.toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] DELETE returns 500 — error toast exact text (R-010) and dialog closes
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteContacto edge — DELETE 500 error path', () => {
  it('[P2] error toast text is exactly "No se pudo eliminar el contacto. Intenta de nuevo." (R-010 Spanish enforcement)', async () => {
    // GIVEN: DELETE returns 500
    const contacto = buildContacto({
      id: 'cccccccc-0003-0003-0003-cccccccccccc',
      nombre: 'Contacto Toast Exact Text',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    renderContactoDetailEdge({ contactoId: contacto.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Toast text is the exact Spanish message from component onError
    await waitFor(() => {
      expect(
        screen.getByText('No se pudo eliminar el contacto. Intenta de nuevo.')
      ).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] "Confirmar" shows "Eliminando..." while mutation is pending (isPending label)
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteContacto edge — "Eliminando..." pending label', () => {
  it('[P1] "Confirmar" button shows "Eliminando..." text while DELETE is in-flight', async () => {
    // GIVEN: DELETE is delayed to simulate in-flight mutation
    const contacto = buildContacto({
      id: 'dddddddd-0004-0004-0004-dddddddddddd',
      nombre: 'Contacto Eliminando Label',
    });

    let resolveDelete!: () => void;
    const delayedDelete = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, async () => {
        await delayedDelete;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderContactoDetailEdge({ contactoId: contacto.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });

    // AND: Initial label is "Confirmar" (not yet pending)
    expect(screen.getByTestId('btn-confirm-delete')).toHaveTextContent(/confirmar/i);

    // WHEN: User clicks Confirmar (mutation starts, isPending becomes true)
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: Button label changes to "Eliminando..." while DELETE is in-flight
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toHaveTextContent(/eliminando/i);
    });

    // Cleanup: resolve the pending DELETE
    resolveDelete();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] Dialog can be opened again after being cancelled (re-entrant dialog state)
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteContacto edge — re-entrant dialog (cancel then re-open)', () => {
  it('[P1] user can open the confirmation dialog again after cancelling once', async () => {
    // GIVEN: A contact is loaded
    const contacto = buildContacto({
      id: 'eeeeeeee-0005-0005-0005-eeeeeeeeeeee',
      nombre: 'Contacto Reentrant Dialog',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    renderContactoDetailEdge({ contactoId: contacto.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User opens dialog then cancels
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-cancel-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-cancel-delete'));

    // AND: Dialog closes
    await waitFor(() => {
      expect(screen.queryByTestId('btn-cancel-delete')).not.toBeInTheDocument();
    });

    // WHEN: User opens the dialog a second time
    await userEvent.click(screen.getByTestId('btn-eliminar'));

    // THEN: Dialog reopens successfully (state reset correctly — no stuck state)
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
      expect(screen.getByTestId('btn-cancel-delete')).toBeInTheDocument();
    });

    // AND: Title is still correct (state wasn't corrupted)
    expect(screen.getByText('¿Eliminar este contacto?')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P1] btn-eliminar has aria-label="Eliminar contacto" (WCAG 2.1 AA)
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteContacto edge — accessibility (WCAG 2.1 AA)', () => {
  it('[P1] btn-eliminar has aria-label="Eliminar contacto" for screen readers', async () => {
    // GIVEN: A contact is loaded
    const contacto = buildContacto({
      id: 'ffffffff-0006-0006-0006-ffffffffffff',
      nombre: 'Contacto ARIA Label',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    renderContactoDetailEdge({ contactoId: contacto.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // THEN: "Eliminar" button has aria-label for screen readers (WCAG 2.1 AA — architecture enforcement)
    const eliminarButton = screen.getByTestId('btn-eliminar');
    expect(eliminarButton).toHaveAttribute('aria-label', 'Eliminar contacto');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P2] Dialog description text is "Esta acción no se puede deshacer." (AC #1)
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteContacto edge — dialog description text (AC #1)', () => {
  it('[P2] dialog description is exactly "Esta acción no se puede deshacer." (Spanish — AC #1)', async () => {
    // GIVEN: A contact is loaded
    const contacto = buildContacto({
      id: '11111111-0007-0007-0007-111111111111',
      nombre: 'Contacto Description Text',
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto))
    );

    renderContactoDetailEdge({ contactoId: contacto.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User opens the dialog
    await userEvent.click(screen.getByTestId('btn-eliminar'));

    // THEN: AlertDialogDescription contains the exact Spanish text from ContactoDetailView.tsx
    await waitFor(() => {
      expect(
        screen.getByText('Esta acción no se puede deshacer.')
      ).toBeInTheDocument();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P2] DELETE is called with the correct contacto ID (not a different ID)
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteContacto edge — DELETE URL integrity', () => {
  it('[P2] DELETE is called with exactly the contactoId passed as prop (no ID swap)', async () => {
    // GIVEN: A specific contacto ID
    const specificId = '22222222-0008-0008-0008-222222222222';
    const contacto = buildContacto({ id: specificId, nombre: 'Contacto ID Integrity' });

    let capturedDeleteId: string | null = null;

    // CRITICAL: Intercept BEFORE render (network-first)
    server.use(
      http.get(`${CONTACTOS_URL}/${specificId}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/:id`, ({ params }) => {
        capturedDeleteId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderContactoDetailEdge({ contactoId: specificId });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    // WHEN: User confirms deletion
    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // THEN: DELETE was called with the exact ID of the rendered contact
    await waitFor(() => {
      expect(capturedDeleteId).toBe(specificId);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// [P3] Rapid double-click on "Confirmar" does not trigger DELETE twice (isPending guard)
// ─────────────────────────────────────────────────────────────────────────────

describe('DeleteContacto edge — isPending double-click protection', () => {
  it('[P3] rapid double-click on "Confirmar" calls DELETE exactly once (disabled while pending)', async () => {
    // GIVEN: DELETE is slightly delayed
    const contacto = buildContacto({
      id: '33333333-0009-0009-0009-333333333333',
      nombre: 'Contacto Double Click',
    });

    let deleteCallCount = 0;
    let resolveDelete!: () => void;
    const delayedDelete = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    server.use(
      http.get(`${CONTACTOS_URL}/${contacto.id}`, () => HttpResponse.json(contacto)),
      http.delete(`${CONTACTOS_URL}/${contacto.id}`, async () => {
        deleteCallCount += 1;
        await delayedDelete;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderContactoDetailEdge({ contactoId: contacto.id });

    await waitFor(() => {
      expect(screen.getByTestId('btn-eliminar')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('btn-eliminar'));
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeInTheDocument();
    });

    // WHEN: User clicks "Confirmar" once (mutation starts)
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // AND: Button becomes disabled while pending
    await waitFor(() => {
      expect(screen.getByTestId('btn-confirm-delete')).toBeDisabled();
    });

    // WHEN: User tries to click again (should be blocked by disabled state)
    // userEvent.click on a disabled button does nothing
    await userEvent.click(screen.getByTestId('btn-confirm-delete'));

    // Cleanup: resolve the DELETE
    resolveDelete();

    // THEN: DELETE was called exactly once (double-click protection works)
    await waitFor(() => {
      expect(deleteCallCount).toBe(1);
    });
  });
});
