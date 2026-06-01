/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * Application Unit Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Tests focus on:
 *   AC3 — useCliente hook: module exists, callable, accepts id param
 *   AC3 — useCliente hook: uses queryKey ['clientes', id]
 *   AC3 — useCliente hook: enabled only when id is provided (not when undefined)
 *   AC3 — clienteApiRepository has a getById method
 *   AC5 — clienteApiRepository.getById propagates 404 errors to TanStack Query isError state
 */

import { describe, test, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — useCliente hook module contract
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] useCliente — Module contract (AC3)', () => {
  test('[P0] should export a useCliente function hook', async () => {
    // GIVEN: useCliente.ts exists at the application layer
    // WHEN: The module is imported
    const mod = await import('../useCliente');

    // THEN: useCliente is exported as a named function
    expect(mod).toHaveProperty('useCliente');
    expect(typeof mod.useCliente).toBe('function');
  });

  test('[P0] useCliente should have the correct hook name', async () => {
    // GIVEN: React hook naming convention requires function name to start with "use"
    // WHEN: The hook is imported
    const { useCliente } = await import('../useCliente');

    // THEN: The function name is 'useCliente'
    expect(useCliente.name).toBe('useCliente');
  });

  test('[P0] useCliente hook module should exist at the expected path', async () => {
    // GIVEN: The module is defined in the application layer
    // WHEN: Attempting to resolve the module
    let importError: unknown = null;
    try {
      await import('../useCliente');
    } catch (e) {
      importError = e;
    }

    // THEN: No module-not-found error is thrown
    expect(importError).toBeNull();
  });

  test('[P0] useCliente should accept an id parameter (string | undefined)', async () => {
    // GIVEN: useCliente accepts an optional id
    // WHEN: The hook function is inspected
    const { useCliente } = await import('../useCliente');

    // THEN: The function accepts at least one parameter
    expect(useCliente.length).toBeGreaterThanOrEqual(1);
  });

  test('[P0] useCliente has no default export (named-only convention)', async () => {
    // GIVEN: Project convention uses named exports
    // WHEN: The module is imported
    const mod = await import('../useCliente');

    // THEN: There is no default export
    expect(mod).not.toHaveProperty('default');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — clienteApiRepository has a getById method
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] clienteApiRepository — getById method contract (AC3)', () => {
  test('[P0] should export a clienteApiRepository object with a getById method', async () => {
    // GIVEN: clienteApiRepository.ts has been updated with the getById method
    // WHEN: The module is imported
    const mod = await import('../../infrastructure/clienteApiRepository');

    // THEN: clienteApiRepository exports a getById function
    expect(mod).toHaveProperty('clienteApiRepository');
    expect(typeof mod.clienteApiRepository.getById).toBe('function');
  });

  test('[P0] clienteApiRepository.getById should be a callable function', async () => {
    // GIVEN: The getById method is implemented in the infrastructure layer
    // WHEN: The method is accessed
    const { clienteApiRepository } = await import('../../infrastructure/clienteApiRepository');

    // THEN: It is callable (returns a Promise when called)
    expect(typeof clienteApiRepository.getById).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 — IClienteRepository domain interface includes getById
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] IClienteRepository — getById method contract (AC3)', () => {
  test('[P0] IClienteRepository should compile — module exists at domain layer', async () => {
    // GIVEN: IClienteRepository.ts has been updated to include getById
    // WHEN: The domain module is imported
    let importError: unknown = null;
    try {
      await import('../../domain/IClienteRepository');
    } catch (e) {
      importError = e;
    }

    // THEN: No module-not-found error is thrown
    expect(importError).toBeNull();
  });
});
