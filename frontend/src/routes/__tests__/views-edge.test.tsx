/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — View Edge Cases — Vitest + React Testing Library
 *
 * Edge cases and boundary conditions NOT covered by the ATDD baseline:
 *   - NotFoundView with default message (no prop)
 *   - NotFoundView with custom message prop override
 *   - NotFoundView always shows 404 heading
 *   - ContactosShellView renders correctly (mirror of ClientesShellView coverage)
 */

import { describe, it, expect } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterContextProvider,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router';

import { NotFoundView } from '../../shared/components/ui/NotFoundView';
import { ContactosShellView } from '../../modules/crm/contactos/presentation/components/ContactosShellView';

// ─────────────────────────────────────────────────────────────────────────────
// Test router factory
// ─────────────────────────────────────────────────────────────────────────────

async function createLoadedTestRouter(initialPath = '/unknown') {
  const rootRoute = createRootRoute({ component: Outlet });
  const clientesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/clientes', component: () => null });
  const routeTree = rootRoute.addChildren([clientesRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => { await router.load(); });
  return router;
}

// ─────────────────────────────────────────────────────────────────────────────
// NotFoundView edge cases — prop boundaries
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] NotFoundView — prop boundary conditions', () => {
  it('[P1] should display default message when no message prop is provided', async () => {
    // GIVEN: NotFoundView mounted with no message prop
    const router = await createLoadedTestRouter('/unknown');
    render(
      <RouterContextProvider router={router}>
        <NotFoundView />
      </RouterContextProvider>
    );

    // WHEN: We check the message element
    const msg = screen.getByTestId('not-found-message');

    // THEN: Default Spanish message is shown
    expect(msg).toHaveTextContent('Página no encontrada');
  });

  it('[P1] should display custom message when message prop is provided', async () => {
    // GIVEN: NotFoundView mounted with a custom message
    const router = await createLoadedTestRouter('/unknown');
    render(
      <RouterContextProvider router={router}>
        <NotFoundView message="Esta sección no existe" />
      </RouterContextProvider>
    );

    // WHEN: We check the message element
    const msg = screen.getByTestId('not-found-message');

    // THEN: Custom message overrides the default
    expect(msg).toHaveTextContent('Esta sección no existe');
    expect(msg).not.toHaveTextContent('Página no encontrada');
  });

  it('[P1] should always show the 404 numeric heading regardless of message', async () => {
    // GIVEN: NotFoundView with custom message
    const router = await createLoadedTestRouter('/unknown');
    render(
      <RouterContextProvider router={router}>
        <NotFoundView message="Recurso no disponible" />
      </RouterContextProvider>
    );

    // WHEN/THEN: The 404 heading is always visible
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404');
  });

  it('[P1] should display back link text "Volver a Clientes"', async () => {
    // GIVEN: NotFoundView is mounted
    const router = await createLoadedTestRouter('/unknown');
    render(
      <RouterContextProvider router={router}>
        <NotFoundView />
      </RouterContextProvider>
    );

    // WHEN: We find the back link
    const backLink = screen.getByTestId('not-found-back-link');

    // THEN: Link text is descriptive and in Spanish
    expect(backLink).toHaveTextContent('Volver a Clientes');
  });

  it('[P2] should render without any raw error or stack trace content', async () => {
    // GIVEN: NotFoundView is mounted
    const router = await createLoadedTestRouter('/unknown');
    render(
      <RouterContextProvider router={router}>
        <NotFoundView />
      </RouterContextProvider>
    );

    // WHEN: We inspect the entire rendered output
    const view = screen.getByTestId('not-found-view');

    // THEN: No error/exception text is present
    expect(view.textContent).not.toMatch(/Error|Exception|TypeError|stack trace/i);
  });

  it('[P2] should render the view container as a single root element', async () => {
    // GIVEN: NotFoundView is mounted
    const router = await createLoadedTestRouter('/unknown');
    const { container } = render(
      <RouterContextProvider router={router}>
        <NotFoundView />
      </RouterContextProvider>
    );

    // WHEN: We count root elements with the view testid
    const views = container.querySelectorAll('[data-testid="not-found-view"]');

    // THEN: Exactly one not-found-view exists (no duplicates)
    expect(views).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ContactosShellView — component coverage (mirrors ClientesShellView tests)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ContactosShellView — component renders correctly', () => {
  it('[P1] should render the ContactosShellView with correct data-testid', () => {
    // GIVEN/WHEN: ContactosShellView is rendered
    render(<ContactosShellView />);

    // THEN: Root testid is present
    expect(screen.getByTestId('contactos-shell-view')).toBeInTheDocument();
  });

  it('[P1] should display the "Contactos" heading in Spanish', () => {
    // GIVEN/WHEN: ContactosShellView is rendered
    render(<ContactosShellView />);

    // THEN: Spanish heading is visible
    expect(screen.getByRole('heading', { name: /Contactos/i })).toBeInTheDocument();
  });

  it('[P1] should render a loading skeleton as placeholder content', () => {
    // GIVEN/WHEN: ContactosShellView is rendered
    render(<ContactosShellView />);

    // THEN: Skeleton testid is present
    expect(screen.getByTestId('contactos-skeleton')).toBeInTheDocument();
  });

  it('[P2] should not contain any error or exception text', () => {
    // GIVEN/WHEN: ContactosShellView is rendered
    const { container } = render(<ContactosShellView />);

    // THEN: No raw error text in the output
    expect(container.textContent).not.toMatch(/Error|Exception|undefined/i);
  });

  it('[P2] should not render any Clientes-specific content', () => {
    // GIVEN/WHEN: ContactosShellView is rendered
    render(<ContactosShellView />);

    // THEN: Does not show Clientes heading (wrong component)
    expect(screen.queryByRole('heading', { name: /^Clientes$/i })).not.toBeInTheDocument();
  });
});
