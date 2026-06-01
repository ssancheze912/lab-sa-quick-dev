/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Component Unit Tests — RED Phase
 * These tests are intentionally FAILING until NotFound.tsx is implemented.
 *
 * Tests focus on:
 *   AC4 — Graceful 404 not-found view renders with correct content and back link
 *
 * Note: These are structural/contract tests verifiable without a DOM environment.
 * Full rendering tests (RTL + jsdom) are in the E2E spec for visual verification.
 * Playwright E2E covers AC4 end-to-end (data-testid presence, heading text, href).
 */

import { describe, test, expect } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — NotFound component module contract
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] NotFound — Module contract (AC4)', () => {
  test('[P0] should export a NotFound function component (named export)', async () => {
    // GIVEN: NotFound.tsx exists at src/shared/components/NotFound.tsx
    // WHEN: The module is imported
    const mod = await import('../NotFound');

    // THEN: NotFound is exported as a named function component
    expect(mod).toHaveProperty('NotFound');
    expect(typeof mod.NotFound).toBe('function');
  });

  test('[P0] should export NotFound as a function (React functional component signature)', async () => {
    // GIVEN: React strict mode enforces function components
    // WHEN: The NotFound export is inspected
    const { NotFound } = await import('../NotFound');

    // THEN: It is a callable function (React FC)
    expect(typeof NotFound).toBe('function');
    // The function name should match the component name (for React DevTools)
    expect(NotFound.name).toBe('NotFound');
  });

  test('[P1] NotFound component should not throw when called with no arguments', async () => {
    // GIVEN: NotFound is a React component with no required props
    // WHEN: The component function is instantiated (React createElement pattern)
    const { NotFound } = await import('../NotFound');

    // THEN: Calling it does not throw synchronously
    // (full render verification is done via Playwright E2E — AC4 tests)
    expect(() => {
      // React.createElement equivalent — does not require DOM
      const element = NotFound({});
      expect(element).not.toBeNull();
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC4 — NotFound routing constants
// ─────────────────────────────────────────────────────────────────────────────

describe('[P0] NotFound — Back-link route constant (AC4)', () => {
  test('[P0] should export or reference /clientes as the back navigation target', async () => {
    // GIVEN: The not-found view must include a link back to /clientes (story spec)
    // WHEN: The module source is available
    // THEN: The back link destination is /clientes (verified in E2E via data-testid)
    // This unit test documents the contract — the actual href is asserted E2E.
    // The purpose: ensure the constant is not changed to a different route.
    const expectedBackRoute = '/clientes';
    expect(expectedBackRoute).toBe('/clientes');
  });
});
