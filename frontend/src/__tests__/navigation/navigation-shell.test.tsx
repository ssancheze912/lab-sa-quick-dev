/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component / Unit Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Acceptance Criteria covered:
 *   AC1 — NavigationRail renders with Clientes and Contactos items on desktop
 *   AC3 — Route files exist for /clientes and /contactos (deep linking)
 *   AC4 — Active item reflects the current route path
 *   AC5 — 404 view renders with back link to /clientes
 *   AC6 — Index route file redirects / → /clientes
 *
 * Test level: Component + Unit (source inspection + RTL)
 * Tool: Vitest + React Testing Library
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// From frontend/src/__tests__/navigation/ → up 3 levels → frontend/
const FRONTEND_ROOT = resolve(__dirname, '../../..');
const ROUTES_DIR = resolve(FRONTEND_ROOT, 'src/routes');

const read = (relativePath: string) =>
  readFileSync(resolve(FRONTEND_ROOT, relativePath), 'utf-8');

const exists = (relativePath: string) =>
  existsSync(resolve(FRONTEND_ROOT, relativePath));

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — __root.tsx renders LayoutBase (NavigationRail) with navigation items
// ─────────────────────────────────────────────────────────────────────────────

describe('AC1 — __root.tsx: LayoutBase shell with NavigationRail', () => {
  it('should import LayoutBase from siesa-ui-kit in __root.tsx', () => {
    // GIVEN: siesa-ui-kit LayoutBase is the P0 mandatory navigation shell
    const content = read('src/routes/__root.tsx');
    // THEN: LayoutBase is imported from siesa-ui-kit
    expect(content).toContain('LayoutBase');
    expect(content).toMatch(/from\s+['"]siesa-ui-kit['"]/);
  });

  it('should define a Clientes navigation item in __root.tsx', () => {
    // GIVEN: NavigationRail must contain a Clientes entry pointing to /clientes
    const content = read('src/routes/__root.tsx');
    // THEN: A navigation item with label "Clientes" and href "/clientes" is present
    expect(content).toContain('Clientes');
    expect(content).toContain('/clientes');
  });

  it('should define a Contactos navigation item in __root.tsx', () => {
    // GIVEN: NavigationRail must contain a Contactos entry pointing to /contactos
    const content = read('src/routes/__root.tsx');
    // THEN: A navigation item with label "Contactos" and href "/contactos" is present
    expect(content).toContain('Contactos');
    expect(content).toContain('/contactos');
  });

  it('should use useRouterState to determine the active route in __root.tsx', () => {
    // GIVEN: The active nav item must reflect the current URL path
    const content = read('src/routes/__root.tsx');
    // THEN: useRouterState is used to get the current location
    expect(content).toContain('useRouterState');
  });

  it('should pass productName="Siesa Agents" to the navigation shell', () => {
    // GIVEN: The Navbar inside LayoutBase must display the product name
    const content = read('src/routes/__root.tsx');
    // THEN: productName prop is set to "Siesa Agents"
    expect(content).toContain('Siesa Agents');
  });

  it('should import Outlet from @tanstack/react-router in __root.tsx', () => {
    // GIVEN: The root layout shell must render child routes via Outlet
    const content = read('src/routes/__root.tsx');
    // THEN: Outlet is imported and used
    expect(content).toContain('Outlet');
    expect(content).toMatch(/from\s+['"]@tanstack\/react-router['"]/);
  });

  it('should include the active flag computation based on current pathname', () => {
    // GIVEN: Navigation items must expose an "active" state based on the current route
    const content = read('src/routes/__root.tsx');
    // THEN: The active flag uses pathname.startsWith or similar comparison
    expect(content).toMatch(/active/);
    expect(content).toMatch(/pathname|currentPath/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — Route files exist for /clientes and /contactos (deep linking)
// ─────────────────────────────────────────────────────────────────────────────

describe('AC3 — Deep linking: route files exist', () => {
  it('should have a route file for /clientes', () => {
    // GIVEN: Deep linking requires a route file for /clientes
    // WHEN: Checking the filesystem for the route file
    const clientesRouteExists =
      exists('src/routes/_app/clientes.tsx') ||
      exists('src/routes/clientes.tsx');
    // THEN: At least one route file for /clientes exists
    expect(clientesRouteExists).toBe(true);
  });

  it('should have a route file for /contactos', () => {
    // GIVEN: Deep linking requires a route file for /contactos
    // WHEN: Checking the filesystem for the route file
    const contactosRouteExists =
      exists('src/routes/_app/contactos.tsx') ||
      exists('src/routes/contactos.tsx');
    // THEN: At least one route file for /contactos exists
    expect(contactosRouteExists).toBe(true);
  });

  it('should render a page title "Clientes" in the Clientes view', () => {
    // GIVEN: The Clientes route file exists
    const clientesExists = exists('src/routes/_app/clientes.tsx');
    if (!clientesExists) {
      // Force failure — file must exist
      expect(clientesExists).toBe(true);
      return;
    }
    const content = read('src/routes/_app/clientes.tsx');
    // THEN: The Clientes view renders a heading or title in Spanish
    expect(content).toContain('Clientes');
  });

  it('should render a page title "Contactos" in the Contactos view', () => {
    // GIVEN: The Contactos route file exists
    const contactosExists = exists('src/routes/_app/contactos.tsx');
    if (!contactosExists) {
      // Force failure — file must exist
      expect(contactosExists).toBe(true);
      return;
    }
    const content = read('src/routes/_app/contactos.tsx');
    // THEN: The Contactos view renders a heading or title in Spanish
    expect(content).toContain('Contactos');
  });

  it('should export Route as a named const in the Clientes route file', () => {
    // GIVEN: TanStack Router discovers route files by the exported "Route" const
    const clientesPath = exists('src/routes/_app/clientes.tsx')
      ? 'src/routes/_app/clientes.tsx'
      : 'src/routes/clientes.tsx';
    if (!exists(clientesPath)) {
      expect(exists(clientesPath)).toBe(true);
      return;
    }
    const content = read(clientesPath);
    // THEN: export const Route is present
    expect(content).toMatch(/export\s+const\s+Route/);
  });

  it('should export Route as a named const in the Contactos route file', () => {
    // GIVEN: TanStack Router discovers route files by the exported "Route" const
    const contactosPath = exists('src/routes/_app/contactos.tsx')
      ? 'src/routes/_app/contactos.tsx'
      : 'src/routes/contactos.tsx';
    if (!exists(contactosPath)) {
      expect(exists(contactosPath)).toBe(true);
      return;
    }
    const content = read(contactosPath);
    // THEN: export const Route is present
    expect(content).toMatch(/export\s+const\s+Route/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — 404 not-found view renders with "Ir a Clientes" link
// ─────────────────────────────────────────────────────────────────────────────

describe('AC5 — 404 not-found view', () => {
  it('should have a catch-all 404 route file ($.tsx)', () => {
    // GIVEN: Unknown routes must be handled gracefully
    // WHEN: Checking the filesystem for the catch-all route
    const catchAllExists =
      exists('src/routes/$.tsx') ||
      exists('src/routes/$404.tsx');
    // THEN: A catch-all route file exists
    expect(catchAllExists).toBe(true);
  });

  it('should display "Página no encontrada" text in the 404 view', () => {
    // GIVEN: The 404 catch-all route file exists
    const routePath = exists('src/routes/$.tsx') ? 'src/routes/$.tsx' : 'src/routes/$404.tsx';
    if (!exists(routePath)) {
      expect(exists(routePath)).toBe(true);
      return;
    }
    const content = read(routePath);
    // THEN: Spanish "page not found" text is in the component
    expect(content).toContain('encontrada');
  });

  it('should include a link to /clientes in the 404 view', () => {
    // GIVEN: The 404 view must offer a path back to a valid route
    const routePath = exists('src/routes/$.tsx') ? 'src/routes/$.tsx' : 'src/routes/$404.tsx';
    if (!exists(routePath)) {
      expect(exists(routePath)).toBe(true);
      return;
    }
    const content = read(routePath);
    // THEN: A link to /clientes is present with "Ir a Clientes" label
    expect(content).toContain('/clientes');
    expect(content).toContain('Ir a Clientes');
  });

  it('should have data-testid="not-found-view" on the 404 container', () => {
    // GIVEN: E2E tests require a stable selector to locate the 404 view
    const routePath = exists('src/routes/$.tsx') ? 'src/routes/$.tsx' : 'src/routes/$404.tsx';
    if (!exists(routePath)) {
      expect(exists(routePath)).toBe(true);
      return;
    }
    const content = read(routePath);
    // THEN: data-testid="not-found-view" is present
    expect(content).toContain('data-testid="not-found-view"');
  });

  it('should have data-testid="not-found-back-link" on the link to /clientes', () => {
    // GIVEN: E2E tests require a stable selector to click the back link
    const routePath = exists('src/routes/$.tsx') ? 'src/routes/$.tsx' : 'src/routes/$404.tsx';
    if (!exists(routePath)) {
      expect(exists(routePath)).toBe(true);
      return;
    }
    const content = read(routePath);
    // THEN: data-testid="not-found-back-link" is present
    expect(content).toContain('data-testid="not-found-back-link"');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — index.tsx redirects / to /clientes
// ─────────────────────────────────────────────────────────────────────────────

describe('AC6 — Index route redirects to /clientes', () => {
  it('should have an index route file at src/routes/index.tsx', () => {
    // GIVEN: / must redirect to /clientes (not show an empty root)
    // WHEN: Checking for the index route file
    // THEN: src/routes/index.tsx exists
    expect(exists('src/routes/index.tsx')).toBe(true);
  });

  it('should use redirect() from @tanstack/react-router in index.tsx', () => {
    // GIVEN: TanStack Router uses throw redirect() in beforeLoad for declarative redirects
    if (!exists('src/routes/index.tsx')) {
      expect(exists('src/routes/index.tsx')).toBe(true);
      return;
    }
    const content = read('src/routes/index.tsx');
    // THEN: redirect is imported and used with throw
    expect(content).toContain('redirect');
    expect(content).toMatch(/throw\s+redirect/);
  });

  it('should redirect to /clientes in index.tsx', () => {
    // GIVEN: Root path must redirect to /clientes as the default section
    if (!exists('src/routes/index.tsx')) {
      expect(exists('src/routes/index.tsx')).toBe(true);
      return;
    }
    const content = read('src/routes/index.tsx');
    // THEN: The redirect target is /clientes
    expect(content).toContain("'/clientes'");
  });

  it('should use beforeLoad hook for the redirect in index.tsx', () => {
    // GIVEN: TanStack Router's redirect pattern uses beforeLoad lifecycle hook
    if (!exists('src/routes/index.tsx')) {
      expect(exists('src/routes/index.tsx')).toBe(true);
      return;
    }
    const content = read('src/routes/index.tsx');
    // THEN: beforeLoad is the hook used to throw the redirect
    expect(content).toContain('beforeLoad');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility — Navigation items have ARIA attributes
// ─────────────────────────────────────────────────────────────────────────────

describe('Accessibility — Navigation ARIA attributes', () => {
  it('should have aria-current="page" pattern in __root.tsx for the active nav item', () => {
    // GIVEN: WCAG requires active nav items to be announced to screen readers
    const content = read('src/routes/__root.tsx');
    // THEN: aria-current attribute is set conditionally for the active item
    expect(content).toContain('aria-current');
  });

  it('should have accessible labels for icon-only navigation items', () => {
    // GIVEN: NavigationRail may show icons only — screen readers need text labels
    const content = read('src/routes/__root.tsx');
    // THEN: aria-label is present for navigation items
    expect(content).toMatch(/aria-label/);
  });
});
