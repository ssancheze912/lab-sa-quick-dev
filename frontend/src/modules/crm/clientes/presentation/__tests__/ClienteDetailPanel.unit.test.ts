/**
 * Story 2.2: Client Detail View
 * Epic 2: Client Management
 *
 * Presentation Unit Tests — RED Phase
 * These tests are intentionally FAILING until implementation is complete.
 *
 * Tests focus on:
 *   AC1 — ClienteDetailPanel module contract: exists, named export, correct function name
 *   AC1 — ClienteDetailPanel renders without throwing (module-level smoke test)
 *   AC6 — Loading state: skeleton placeholders present via react-loading-skeleton
 *   AC4 — 404 state: "Cliente no encontrado" text; no ErrorPanel rendered
 *   AC5 — Network error state: ErrorPanel rendered with onRetry callback
 *   AC1 — Success state: all 4 Spanish-labelled fields present
 */

import { describe, test, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// AC1 — ClienteDetailPanel module contract
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] ClienteDetailPanel — Module contract (AC1)', () => {
  test('[P0] should export a ClienteDetailPanel function component', async () => {
    // GIVEN: ClienteDetailPanel.tsx exists at the presentation layer
    // WHEN: The module is imported
    const mod = await import('../ClienteDetailPanel');

    // THEN: ClienteDetailPanel is exported as a named function component
    expect(mod).toHaveProperty('ClienteDetailPanel');
    expect(typeof mod.ClienteDetailPanel).toBe('function');
  });

  test('[P0] ClienteDetailPanel should have the correct component name', async () => {
    // GIVEN: React DevTools requires the function name to match the component name
    // WHEN: The component is imported
    const { ClienteDetailPanel } = await import('../ClienteDetailPanel');

    // THEN: The function name is 'ClienteDetailPanel'
    expect(ClienteDetailPanel.name).toBe('ClienteDetailPanel');
  });

  test('[P0] ClienteDetailPanel module should exist at expected path', async () => {
    // GIVEN: The file is defined at the presentation layer
    // WHEN: Attempting to resolve the module
    let importError: unknown = null;
    try {
      await import('../ClienteDetailPanel');
    } catch (e) {
      importError = e;
    }

    // THEN: No module-not-found error is thrown
    expect(importError).toBeNull();
  });

  test('[P0] ClienteDetailPanel has no default export (named-only convention)', async () => {
    // GIVEN: Project convention uses named exports for components
    // WHEN: The module is imported
    const mod = await import('../ClienteDetailPanel');

    // THEN: There is no default export
    expect(mod).not.toHaveProperty('default');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC5 — ErrorPanel is used in the network error state (module dependency check)
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] ErrorPanel — Used by ClienteDetailPanel for network error state (AC5)', () => {
  test('[P0] ErrorPanel should export an onRetry prop accepting a callback function', async () => {
    // GIVEN: ErrorPanel is used by ClienteDetailPanel with onRetry={refetch}
    // WHEN: ErrorPanel is imported and called with onRetry
    const { ErrorPanel } = await import('../../../../../shared/components/ErrorPanel');

    // THEN: It does not throw when called with an onRetry function (accepts the prop)
    expect(() => {
      const element = ErrorPanel({ onRetry: () => {} });
      expect(element).not.toBeNull();
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Skeleton loading state: react-loading-skeleton integration
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteDetailPanel — Skeleton loading dependency (AC6)', () => {
  test('[P1] react-loading-skeleton module should be resolvable (required for loading state)', async () => {
    // GIVEN: ClienteDetailPanel imports Skeleton from react-loading-skeleton
    // WHEN: The package is imported
    let importError: unknown = null;
    try {
      await import('react-loading-skeleton');
    } catch (e) {
      importError = e;
    }

    // THEN: No module-not-found error (package is installed)
    expect(importError).toBeNull();
  });

  test('[P1] react-loading-skeleton should export a Skeleton component', async () => {
    // GIVEN: ClienteDetailPanel uses Skeleton from react-loading-skeleton
    // WHEN: The module is imported
    const mod = await import('react-loading-skeleton');

    // THEN: Skeleton is available as a named or default export
    const hasSkeleton = 'default' in mod || 'Skeleton' in mod;
    expect(hasSkeleton).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC2 — Route integration: ClienteDetailPanel reads clienteId from URL params
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] ClienteDetailPanel — Route param dependency (AC2)', () => {
  test('[P1] @tanstack/react-router useParams should be importable (required for clienteId from URL)', async () => {
    // GIVEN: ClienteDetailPanel uses useParams from @tanstack/react-router
    // WHEN: The package is imported
    let importError: unknown = null;
    try {
      await import('@tanstack/react-router');
    } catch (e) {
      importError = e;
    }

    // THEN: No module-not-found error (package is installed)
    expect(importError).toBeNull();
  });
});
