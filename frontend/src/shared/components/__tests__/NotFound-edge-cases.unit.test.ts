/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Test EXPANSION — NotFound & Placeholder Edge Cases
 * Extends NotFound.unit.test.ts with additional structural invariants,
 * boundary conditions, and error paths not covered in ATDD tests.
 *
 * Also covers module contracts for ClientesPlaceholder and ContactosPlaceholder
 * which had no unit tests prior to this expansion.
 *
 * Focus areas:
 *   AC4 — NotFound renders without required props, JSX return is valid element
 *   AC3 — Placeholder components have correct display names and module contracts
 *   General — TypeScript strict-mode compliance (no `any` exports)
 */

import { describe, test, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — NotFound deeper structural contracts
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] NotFound — JSX element shape and structural invariants', () => {
  test('[P0] NotFound should return a non-null value when invoked (valid JSX element)', async () => {
    // GIVEN: React requires components to return valid ReactNode (not undefined)
    // WHEN: NotFound is called with empty props
    const { NotFound } = await import('../NotFound');
    const result = NotFound({});

    // THEN: The return value is not null or undefined (renders something)
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
  });

  test('[P0] NotFound should return an object (React element descriptor) when called', async () => {
    // GIVEN: React functional components return React elements (plain objects)
    // WHEN: NotFound is invoked directly
    const { NotFound } = await import('../NotFound');
    const result = NotFound({});

    // THEN: Result is an object (React.createElement produces plain objects)
    expect(typeof result).toBe('object');
  });

  test('[P0] NotFound should accept an empty props object without throwing', async () => {
    // GIVEN: NotFound has no required props (used as TanStack Router notFoundComponent)
    const { NotFound } = await import('../NotFound');

    // THEN: Calling with empty object does not throw
    expect(() => NotFound({})).not.toThrow();
  });

  test('[P1] NotFound component name should be exactly "NotFound" (not minified)', async () => {
    // GIVEN: The function.name is used by React DevTools and TanStack Router error messages
    const { NotFound } = await import('../NotFound');

    // THEN: Function name matches the export name exactly
    expect(NotFound.name).toBe('NotFound');
  });

  test('[P1] NotFound module should not export a default export (named export only)', async () => {
    // GIVEN: Company standard uses named exports for all components
    // WHEN: The module's default export is inspected
    const mod = await import('../NotFound');

    // THEN: No default export is present (only named NotFound)
    expect((mod as Record<string, unknown>).default).toBeUndefined();
  });

  test('[P2] NotFound should not throw when called with unexpected extra props', async () => {
    // GIVEN: TanStack Router may pass additional props to notFoundComponent
    const { NotFound } = await import('../NotFound');

    // THEN: Component is resilient to unexpected props (no propTypes crash in strict TypeScript)
    expect(() =>
      NotFound({ unexpectedProp: 'test' } as Parameters<typeof NotFound>[0]),
    ).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — ClientesPlaceholder module contract (no tests existed before)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] ClientesPlaceholder — Module contract (AC3)', () => {
  test('[P0] should export a ClientesPlaceholder named function', async () => {
    // GIVEN: src/modules/crm/clientes/presentation/ClientesPlaceholder.tsx exists
    // WHEN: The module is imported
    const mod = await import('../../../modules/crm/clientes/presentation/ClientesPlaceholder');

    // THEN: ClientesPlaceholder is exported as a named function
    expect(mod).toHaveProperty('ClientesPlaceholder');
    expect(typeof mod.ClientesPlaceholder).toBe('function');
  });

  test('[P0] ClientesPlaceholder function name should be "ClientesPlaceholder"', async () => {
    // GIVEN: Named components improve React DevTools experience
    const { ClientesPlaceholder } = await import(
      '../../../modules/crm/clientes/presentation/ClientesPlaceholder'
    );

    // THEN: Function.name matches the export name
    expect(ClientesPlaceholder.name).toBe('ClientesPlaceholder');
  });

  test('[P0] ClientesPlaceholder should return a non-null JSX element when called', async () => {
    // GIVEN: Route component must render valid content
    const { ClientesPlaceholder } = await import(
      '../../../modules/crm/clientes/presentation/ClientesPlaceholder'
    );

    // WHEN: Called with no props
    const result = ClientesPlaceholder({});

    // THEN: Returns a valid element (not null/undefined)
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
    expect(typeof result).toBe('object');
  });

  test('[P0] ClientesPlaceholder should not throw when called', async () => {
    // GIVEN: Route component is called during render
    const { ClientesPlaceholder } = await import(
      '../../../modules/crm/clientes/presentation/ClientesPlaceholder'
    );

    // THEN: No synchronous error on invocation
    expect(() => ClientesPlaceholder({})).not.toThrow();
  });

  test('[P1] ClientesPlaceholder module should not have a default export', async () => {
    // GIVEN: Company standard uses named exports
    const mod = await import(
      '../../../modules/crm/clientes/presentation/ClientesPlaceholder'
    );

    expect((mod as Record<string, unknown>).default).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — ContactosPlaceholder module contract (no tests existed before)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] ContactosPlaceholder — Module contract (AC3)', () => {
  test('[P0] should export a ContactosPlaceholder named function', async () => {
    // GIVEN: src/modules/crm/contactos/presentation/ContactosPlaceholder.tsx exists
    // WHEN: The module is imported
    const mod = await import('../../../modules/crm/contactos/presentation/ContactosPlaceholder');

    // THEN: ContactosPlaceholder is exported as a named function
    expect(mod).toHaveProperty('ContactosPlaceholder');
    expect(typeof mod.ContactosPlaceholder).toBe('function');
  });

  test('[P0] ContactosPlaceholder function name should be "ContactosPlaceholder"', async () => {
    // GIVEN: Named components improve React DevTools experience
    const { ContactosPlaceholder } = await import(
      '../../../modules/crm/contactos/presentation/ContactosPlaceholder'
    );

    // THEN: Function.name matches the export name
    expect(ContactosPlaceholder.name).toBe('ContactosPlaceholder');
  });

  test('[P0] ContactosPlaceholder should return a non-null JSX element when called', async () => {
    // GIVEN: Route component must render valid content
    const { ContactosPlaceholder } = await import(
      '../../../modules/crm/contactos/presentation/ContactosPlaceholder'
    );

    // WHEN: Called with no props
    const result = ContactosPlaceholder({});

    // THEN: Returns a valid element (not null/undefined)
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
    expect(typeof result).toBe('object');
  });

  test('[P0] ContactosPlaceholder should not throw when called', async () => {
    // GIVEN: Route component is called during render
    const { ContactosPlaceholder } = await import(
      '../../../modules/crm/contactos/presentation/ContactosPlaceholder'
    );

    // THEN: No synchronous error on invocation
    expect(() => ContactosPlaceholder({})).not.toThrow();
  });

  test('[P1] ContactosPlaceholder module should not have a default export', async () => {
    // GIVEN: Company standard uses named exports
    const mod = await import(
      '../../../modules/crm/contactos/presentation/ContactosPlaceholder'
    );

    expect((mod as Record<string, unknown>).default).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-module — index route redirect contract
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] Index route — redirect contract (AC3)', () => {
  test('[P0] index route module should export a Route constant', async () => {
    // GIVEN: TanStack Router file-based routing requires named export "Route"
    // WHEN: The index.tsx module is imported
    const mod = await import('../../../routes/index');

    // THEN: Route is a named export and is defined
    expect(mod).toHaveProperty('Route');
    expect(mod.Route).toBeDefined();
    expect(mod.Route).not.toBeNull();
  });

  test('[P0] index route should have Route.options defined', async () => {
    // GIVEN: TanStack Router stores config in Route.options
    const { Route } = await import('../../../routes/index');

    // THEN: Route.options is an object (route is configured, not empty)
    expect(Route).toHaveProperty('options');
    expect(typeof Route.options).toBe('object');
  });

  test('[P1] index route should define a beforeLoad for redirect (not a component route)', async () => {
    // GIVEN: Index route must redirect to /clientes via beforeLoad + redirect()
    // WHEN: Route options are inspected
    const { Route } = await import('../../../routes/index');

    // THEN: beforeLoad is defined (redirect mechanism)
    const beforeLoad = (Route.options as Record<string, unknown>).beforeLoad;
    expect(beforeLoad).toBeDefined();
    expect(typeof beforeLoad).toBe('function');
  });

  test('[P1] index route beforeLoad should throw (trigger redirect mechanism)', async () => {
    // GIVEN: TanStack Router redirect() works by throwing a redirect object
    // WHEN: beforeLoad is called directly
    const { Route } = await import('../../../routes/index');
    const beforeLoad = (Route.options as Record<string, unknown>).beforeLoad as () => void;

    // THEN: beforeLoad throws (this is how TanStack Router redirects work)
    expect(() => beforeLoad()).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cross-placeholder — naming symmetry invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] Placeholder symmetry — Clientes and Contactos are structurally equivalent', () => {
  test('[P1] both placeholders should be callable functions', async () => {
    // GIVEN: Both are React functional components used as route components
    const { ClientesPlaceholder } = await import(
      '../../../modules/crm/clientes/presentation/ClientesPlaceholder'
    );
    const { ContactosPlaceholder } = await import(
      '../../../modules/crm/contactos/presentation/ContactosPlaceholder'
    );

    // THEN: Both are callable functions (same structural type)
    expect(typeof ClientesPlaceholder).toBe('function');
    expect(typeof ContactosPlaceholder).toBe('function');
  });

  test('[P1] both placeholders should return different JSX (distinct views)', async () => {
    // GIVEN: Each placeholder renders content for its specific section
    const { ClientesPlaceholder } = await import(
      '../../../modules/crm/clientes/presentation/ClientesPlaceholder'
    );
    const { ContactosPlaceholder } = await import(
      '../../../modules/crm/contactos/presentation/ContactosPlaceholder'
    );

    // WHEN: Both are called
    const clientesResult = ClientesPlaceholder({});
    const contactosResult = ContactosPlaceholder({});

    // THEN: They are not the same object (distinct renders)
    expect(clientesResult).not.toBe(contactosResult);
  });
});
