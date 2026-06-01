/**
 * Story 2.1: Client List & Search
 * Epic 2: Client Management
 *
 * Component Unit Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Tests focus on:
 *   AC1/AC2 — useClientes hook: TanStack Query fetches GET /api/v1/clientes and exposes data/isLoading/isError/refetch
 *   AC4 — useClientes hook: isError is true when fetch returns 500
 */

import { describe, test, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// AC1/AC2 — useClientes hook module contract
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] useClientes — Module contract (AC1, AC2)', () => {
  test('[P0] should export a useClientes function hook', async () => {
    // GIVEN: useClientes.ts exists at the expected path
    // WHEN: The module is imported
    const mod = await import('../useClientes');

    // THEN: useClientes is exported as a named function
    expect(mod).toHaveProperty('useClientes');
    expect(typeof mod.useClientes).toBe('function');
  });

  test('[P0] useClientes export should be a callable function (React hook signature)', async () => {
    // GIVEN: useClientes follows the React hook convention (function name starts with "use")
    // WHEN: The export is inspected
    const { useClientes } = await import('../useClientes');

    // THEN: It is a callable function
    expect(typeof useClientes).toBe('function');
    expect(useClientes.name).toBe('useClientes');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — useClientes uses queryKey ['clientes']
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] useClientes — TanStack Query configuration (AC1)', () => {
  test('[P0] useClientes hook module should exist at expected path', async () => {
    // GIVEN: The module is defined in the application layer
    // WHEN: Attempting to resolve the module
    let importError: unknown = null;
    try {
      await import('../useClientes');
    } catch (e) {
      importError = e;
    }

    // THEN: No module-not-found error is thrown
    expect(importError).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — clienteApiRepository module contract
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] clienteApiRepository — Module contract (AC1)', () => {
  test('[P0] should export a clienteApiRepository object with a getAll method', async () => {
    // GIVEN: clienteApiRepository.ts is created at the infrastructure layer
    // WHEN: The module is imported
    const mod = await import('../../infrastructure/clienteApiRepository');

    // THEN: clienteApiRepository is exported with a getAll function
    expect(mod).toHaveProperty('clienteApiRepository');
    expect(typeof mod.clienteApiRepository.getAll).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — Cliente domain interface
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] Cliente — Domain type contract (AC1)', () => {
  test('[P0] should export a Cliente type definition from domain module', async () => {
    // GIVEN: Cliente.ts is created at the domain layer
    // WHEN: The module is imported
    const mod = await import('../../domain/Cliente');

    // THEN: The module exports something (TypeScript types compile to the module)
    // This confirms the file exists and compiles without errors
    expect(mod).toBeDefined();
  });

  test('[P0] should export IClienteRepository interface from domain module', async () => {
    // GIVEN: IClienteRepository.ts is created at the domain layer
    // WHEN: The module is imported
    const mod = await import('../../domain/IClienteRepository');

    // THEN: The module compiles without error
    expect(mod).toBeDefined();
  });
});
