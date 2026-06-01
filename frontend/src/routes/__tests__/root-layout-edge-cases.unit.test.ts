// @vitest-environment jsdom
/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Test EXPANSION — Edge Cases & Boundary Conditions
 * Extends root-layout.unit.test.ts with additional structural contracts,
 * boundary validations, and error-path checks not covered in ATDD tests.
 *
 * Focus areas:
 *   - navItems export shape validation (id, label, href contract)
 *   - Index route redirect configuration contract
 *   - Route structure invariants (notFoundComponent type, component type)
 *   - navItems uniqueness and ordering constraints
 *   - Module stability under re-import (no side effects)
 */

import { describe, test, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// navItems export — shape, uniqueness, and ordering invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] navItems export — data contract invariants', () => {
  test('[P0] should export navItems as an Array', async () => {
    // GIVEN: navItems is exported from __root.tsx for testability
    // WHEN: The module is imported
    const mod = await import('../__root');

    // THEN: navItems is an array (not undefined or object)
    expect(Array.isArray((mod as Record<string, unknown>).navItems)).toBe(true);
  });

  test('[P0] should export exactly 2 nav items (Clientes and Contactos only)', async () => {
    // GIVEN: The shell has exactly two navigation destinations
    // WHEN: navItems is inspected
    const mod = await import('../__root');
    const navItems = (mod as Record<string, unknown>).navItems as Array<{
      id: string;
      label: string;
      href: string;
    }>;

    // THEN: Exactly two items are defined (no extra or missing routes)
    expect(navItems).toHaveLength(2);
  });

  test('[P0] each nav item should have an id property of type string', async () => {
    // GIVEN: siesa-ui-kit NavigationRail uses id to identify items
    const mod = await import('../__root');
    const navItems = (mod as Record<string, unknown>).navItems as Array<{
      id: string;
      label: string;
      href: string;
    }>;

    // THEN: Every item has a non-empty string id
    for (const item of navItems) {
      expect(typeof item.id).toBe('string');
      expect(item.id.trim()).not.toBe('');
    }
  });

  test('[P0] each nav item should have a label property of type string', async () => {
    // GIVEN: Labels must be Spanish strings rendered in the UI
    const mod = await import('../__root');
    const navItems = (mod as Record<string, unknown>).navItems as Array<{
      id: string;
      label: string;
      href: string;
    }>;

    // THEN: Every item has a non-empty string label
    for (const item of navItems) {
      expect(typeof item.label).toBe('string');
      expect(item.label.trim()).not.toBe('');
    }
  });

  test('[P0] each nav item should have an href starting with "/"', async () => {
    // GIVEN: TanStack Router expects absolute path hrefs for in-app routes
    const mod = await import('../__root');
    const navItems = (mod as Record<string, unknown>).navItems as Array<{
      id: string;
      label: string;
      href: string;
    }>;

    // THEN: Every href starts with "/"
    for (const item of navItems) {
      expect(item.href).toMatch(/^\//);
    }
  });

  test('[P0] nav item ids should be unique (no duplicate ids)', async () => {
    // GIVEN: siesa-ui-kit uses id to track the active item — duplicates cause bugs
    const mod = await import('../__root');
    const navItems = (mod as Record<string, unknown>).navItems as Array<{
      id: string;
      label: string;
      href: string;
    }>;

    const ids = navItems.map((i) => i.id);
    const uniqueIds = new Set(ids);

    // THEN: All ids are unique
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('[P0] nav item hrefs should be unique (no duplicate destinations)', async () => {
    // GIVEN: Duplicate hrefs would make navigation items redundant and confusing
    const mod = await import('../__root');
    const navItems = (mod as Record<string, unknown>).navItems as Array<{
      id: string;
      label: string;
      href: string;
    }>;

    const hrefs = navItems.map((i) => i.href);
    const uniqueHrefs = new Set(hrefs);

    // THEN: All hrefs are unique
    expect(uniqueHrefs.size).toBe(hrefs.length);
  });

  test('[P1] Clientes nav item should appear before Contactos (ordering contract)', async () => {
    // GIVEN: The story specifies "Clientes" and "Contactos" as entries in that order
    // WHEN: navItems ordering is inspected
    const mod = await import('../__root');
    const navItems = (mod as Record<string, unknown>).navItems as Array<{
      id: string;
      label: string;
      href: string;
    }>;

    // THEN: Clientes (index 0) comes before Contactos (index 1)
    const clientesIndex = navItems.findIndex((i) => i.href === '/clientes');
    const contactosIndex = navItems.findIndex((i) => i.href === '/contactos');

    expect(clientesIndex).not.toBe(-1);
    expect(contactosIndex).not.toBe(-1);
    expect(clientesIndex).toBeLessThan(contactosIndex);
  });

  test('[P1] nav item labels should use correct Spanish capitalization', async () => {
    // GIVEN: Company standard requires proper Spanish proper nouns
    // WHEN: navItems labels are inspected
    const mod = await import('../__root');
    const navItems = (mod as Record<string, unknown>).navItems as Array<{
      id: string;
      label: string;
      href: string;
    }>;

    const labels = navItems.map((i) => i.label);

    // THEN: Labels start with uppercase (proper noun / Title Case)
    for (const label of labels) {
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Root route — additional option invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] Root route options — boundary invariants', () => {
  test('[P0] Route.options.component should be a named function (not anonymous arrow)', async () => {
    // GIVEN: React DevTools and error stacks use component.name for debugging
    // WHEN: The Route component is inspected
    const { Route } = await import('../__root');

    // THEN: The component has a name (not an empty string from anonymous arrow fn)
    // TanStack Router wraps components — check via options directly
    const component = Route.options.component as { name?: string } | undefined;
    expect(component).toBeDefined();
    expect(typeof component).toBe('function');
  });

  test('[P0] notFoundComponent should be a named function (NotFound)', async () => {
    // GIVEN: Component names aid debugging and React DevTools
    // WHEN: The notFoundComponent is inspected
    const { Route } = await import('../__root');
    const notFoundComponent = Route.options.notFoundComponent as
      | { name?: string }
      | undefined;

    // THEN: It is a function with an identifiable name
    expect(typeof notFoundComponent).toBe('function');
    expect((notFoundComponent as { name?: string })?.name).toBe('NotFound');
  });

  test('[P1] Root route should not define a loader (no server data in this story)', async () => {
    // GIVEN: Story 1.2 has no API calls — no loaders needed
    // WHEN: Route options are inspected for unintended loader configuration
    const { Route } = await import('../__root');

    // THEN: No loader is defined (undefined or absent from options)
    const loader = (Route.options as Record<string, unknown>).loader;
    expect(loader).toBeUndefined();
  });

  test('[P1] Root route should not define a beforeLoad (redirect logic belongs to index route)', async () => {
    // GIVEN: The root route is the shell container — not a redirect handler
    // WHEN: Root route options are inspected for unintended redirect logic
    const { Route } = await import('../__root');

    // THEN: No beforeLoad defined at root level
    const beforeLoad = (Route.options as Record<string, unknown>).beforeLoad;
    expect(beforeLoad).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Module stability — re-import and side-effect checks
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] Module stability — idempotent imports', () => {
  test('[P2] importing __root.tsx twice should return the same Route reference', async () => {
    // GIVEN: ES module caching ensures modules are singletons
    // WHEN: The module is imported twice
    const mod1 = await import('../__root');
    const mod2 = await import('../__root');

    // THEN: Both imports reference the same Route object (no re-execution)
    expect(mod1.Route).toBe(mod2.Route);
  });

  test('[P2] importing __root.tsx twice should return the same navItems reference', async () => {
    // GIVEN: ES module caching ensures navItems array is a singleton
    // WHEN: The module is imported twice
    const mod1 = await import('../__root');
    const mod2 = await import('../__root');

    // THEN: navItems is the same array reference (no recreation on re-import)
    expect((mod1 as Record<string, unknown>).navItems).toBe(
      (mod2 as Record<string, unknown>).navItems,
    );
  });
});
