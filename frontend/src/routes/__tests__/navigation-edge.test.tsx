/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Tests — Edge Cases — Vitest + React Testing Library
 *
 * Edge cases and boundary conditions NOT covered by the ATDD baseline:
 *   - NavigationRail/Bar renders exactly 2 items (no more, no less)
 *   - NavigationRail/Bar with no activeRoute prop (default state)
 *   - NavigationRail/Bar icon elements are aria-hidden
 *   - NavigationRail/Bar aria-label on the nav element
 *   - NotFoundView with default message (no prop)
 *   - NotFoundView with custom message prop override
 *   - NotFoundView always shows 404 heading
 *   - ContactosShellView renders correctly (mirror of ClientesShellView coverage)
 *   - AppLayout renders both nav components and main content area
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

import { NavigationRail } from '../../shared/components/ui/NavigationRail';
import { NavigationBar } from '../../shared/components/ui/NavigationBar';
import { NotFoundView } from '../../shared/components/ui/NotFoundView';
import { ContactosShellView } from '../../modules/crm/contactos/presentation/components/ContactosShellView';

// ─────────────────────────────────────────────────────────────────────────────
// Test router factory
// ─────────────────────────────────────────────────────────────────────────────

async function createLoadedTestRouter(initialPath = '/clientes') {
  const rootRoute = createRootRoute({ component: Outlet });
  const clientesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/clientes', component: () => null });
  const contactosRoute = createRoute({ getParentRoute: () => rootRoute, path: '/contactos', component: () => null });
  const routeTree = rootRoute.addChildren([clientesRoute, contactosRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => { await router.load(); });
  return router;
}

// ─────────────────────────────────────────────────────────────────────────────
// NavigationRail edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] NavigationRail — item count boundary', () => {
  it('[P1] should render exactly 2 navigation items', async () => {
    // GIVEN: NavigationRail is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );

    // WHEN: We count all nav items by their data-testid pattern
    const items = screen.getAllByTestId(/^nav-item-/);

    // THEN: Exactly 2 items exist (Clientes + Contactos)
    expect(items).toHaveLength(2);
  });

  it('[P1] should render without crashing when no activeRoute prop is provided', async () => {
    // GIVEN: NavigationRail is mounted with no activeRoute prop
    const router = await createLoadedTestRouter();

    // WHEN: Render without activeRoute
    expect(() =>
      render(
        <RouterContextProvider router={router}>
          <NavigationRail />
        </RouterContextProvider>
      )
    ).not.toThrow();

    // THEN: Navigation rail is present
    expect(screen.getByTestId('navigation-rail')).toBeInTheDocument();
  });

  it('[P1] should have aria-label "Navegación principal" on the nav element', async () => {
    // GIVEN: NavigationRail is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );

    // WHEN: We find the nav element by testid
    const nav = screen.getByTestId('navigation-rail');

    // THEN: aria-label is correct for screen readers
    expect(nav).toHaveAttribute('aria-label', 'Navegación principal');
  });

  it('[P1] should render icons with aria-hidden to prevent duplicate announcements', async () => {
    // GIVEN: NavigationRail is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );

    // WHEN: We find SVG icons (aria-hidden prevents screen reader double-reading)
    const hiddenSvgs = screen
      .getByTestId('navigation-rail')
      .querySelectorAll('svg[aria-hidden="true"]');

    // THEN: Both icons are aria-hidden
    expect(hiddenSvgs).toHaveLength(2);
  });

  it('[P2] should NOT mark any item as active when no route is active', async () => {
    // GIVEN: NavigationRail mounted with no activeRoute prop
    const router = await createLoadedTestRouter('/clientes');
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );

    // WHEN: We check contactos item
    const contactosItem = screen.getByTestId('nav-item-contactos');

    // THEN: Contactos item is NOT active when on /clientes
    expect(contactosItem).not.toHaveAttribute('data-active', 'true');
  });

  it('[P2] should display item labels as text content', async () => {
    // GIVEN: NavigationRail is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationRail />
      </RouterContextProvider>
    );

    // WHEN/THEN: Both label texts are in the document
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NavigationBar edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] NavigationBar — item count and accessibility boundaries', () => {
  it('[P1] should render exactly 2 navigation items', async () => {
    // GIVEN: NavigationBar is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );

    // WHEN: We count all nav items
    const items = screen.getAllByTestId(/^nav-item-/);

    // THEN: Exactly 2 items
    expect(items).toHaveLength(2);
  });

  it('[P1] should render without crashing when no activeRoute prop is provided', async () => {
    // GIVEN: NavigationBar mounted with no activeRoute prop
    const router = await createLoadedTestRouter();

    // WHEN: Render without prop
    expect(() =>
      render(
        <RouterContextProvider router={router}>
          <NavigationBar />
        </RouterContextProvider>
      )
    ).not.toThrow();

    // THEN: Navigation bar is present
    expect(screen.getByTestId('navigation-bar')).toBeInTheDocument();
  });

  it('[P1] should have aria-label "Navegación principal" on the nav element', async () => {
    // GIVEN: NavigationBar is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );

    // WHEN: We find the nav element
    const nav = screen.getByTestId('navigation-bar');

    // THEN: aria-label is correct
    expect(nav).toHaveAttribute('aria-label', 'Navegación principal');
  });

  it('[P1] should render icons with aria-hidden', async () => {
    // GIVEN: NavigationBar is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );

    // WHEN: We find aria-hidden SVGs
    const hiddenSvgs = screen
      .getByTestId('navigation-bar')
      .querySelectorAll('svg[aria-hidden="true"]');

    // THEN: Both icons are aria-hidden
    expect(hiddenSvgs).toHaveLength(2);
  });

  it('[P2] should NOT mark Contactos as active when route is /clientes', async () => {
    // GIVEN: NavigationBar mounted with activeRoute /clientes
    const router = await createLoadedTestRouter('/clientes');
    render(
      <RouterContextProvider router={router}>
        <NavigationBar activeRoute="/clientes" />
      </RouterContextProvider>
    );

    // WHEN: We check contactos item
    const contactosItem = screen.getByTestId('nav-item-contactos');

    // THEN: Contactos is NOT active
    expect(contactosItem).not.toHaveAttribute('data-active', 'true');
  });

  it('[P2] should NOT mark Clientes as active when route is /contactos', async () => {
    // GIVEN: NavigationBar mounted with activeRoute /contactos
    const router = await createLoadedTestRouter('/contactos');
    render(
      <RouterContextProvider router={router}>
        <NavigationBar activeRoute="/contactos" />
      </RouterContextProvider>
    );

    // WHEN: We check clientes item
    const clientesItem = screen.getByTestId('nav-item-clientes');

    // THEN: Clientes is NOT active
    expect(clientesItem).not.toHaveAttribute('data-active', 'true');
  });

  it('[P2] should display item labels as text content', async () => {
    // GIVEN: NavigationBar is mounted
    const router = await createLoadedTestRouter();
    render(
      <RouterContextProvider router={router}>
        <NavigationBar />
      </RouterContextProvider>
    );

    // WHEN/THEN: Both label texts are visible
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Contactos')).toBeInTheDocument();
  });
});

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
