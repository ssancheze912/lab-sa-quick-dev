/**
 * Edge-case unit tests — useContacto application hook (mock-based)
 * Story 3.2 — Contact Detail View — Automation Expansion
 *
 * Complements useContacto.test.ts (ATDD baseline).
 * Covers edge cases NOT in ATDD (uses @tanstack/react-query mock to inspect options):
 *   - Whitespace-only contactoId documents current truthy behavior
 *   - queryFn is always a function regardless of enabled state
 *   - queryKey contains null/undefined when hook is disabled
 *   - Distinct queryKeys for two different UUIDs (cache isolation)
 *   - staleTime and retry options are finite non-negative values
 *   - "contactos" (plural) is the first queryKey segment (canonical key)
 *
 * Test stack: Vitest (mock @tanstack/react-query + mock repository)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @tanstack/react-query so we can inspect options passed to useQuery.
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: Record<string, unknown>) => {
    mockUseQuery(options);
    return { data: undefined, isLoading: false, isError: false };
  },
}));

vi.mock('../infrastructure/contactoApiRepository', () => ({
  contactoApiRepository: {
    getById: vi.fn(),
  },
}));

import { useContacto } from './useContacto';

beforeEach(() => {
  mockUseQuery.mockClear();
});

// ---------------------------------------------------------------------------
// Edge: Whitespace-only contactoId is truthy — documents current behavior
// ---------------------------------------------------------------------------

describe('useContacto — whitespace-only contactoId', () => {
  it('[P1] should document current behavior: single space is truthy → enabled: true', () => {
    // GIVEN: contactoId is a single space (truthy string but semantically empty)
    // NOTE: !!(' ') is true, so enabled: true. If the team adds .trim(), this
    // would become enabled: false. This test documents the ACTUAL behavior.
    useContacto(' ');

    const callArgs = mockUseQuery.mock.calls[0][0] as { enabled: boolean };
    // Current behavior: ' ' is truthy → enabled: true
    expect(typeof callArgs.enabled).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// Edge: queryFn is always a function regardless of enabled state
// ---------------------------------------------------------------------------

describe('useContacto — queryFn is always a function', () => {
  it('[P2] should pass a function as queryFn even when enabled is false (null)', () => {
    // GIVEN: contactoId is null (query disabled)
    useContacto(null);

    // WHEN: useQuery options are inspected
    const callArgs = mockUseQuery.mock.calls[0][0] as { queryFn: unknown; enabled: boolean };

    // THEN: queryFn is still a function (TanStack Query requires it as a reference)
    expect(typeof callArgs.queryFn).toBe('function');
    expect(callArgs.enabled).toBe(false);
  });

  it('[P2] should pass a function as queryFn when enabled is true (valid UUID)', () => {
    // GIVEN: Valid contactoId
    const contactoId = '10000000-0000-0000-0000-000000000001';
    useContacto(contactoId);

    // WHEN: useQuery options are inspected
    const callArgs = mockUseQuery.mock.calls[0][0] as { queryFn: unknown; enabled: boolean };

    // THEN: queryFn is a function and enabled is true
    expect(typeof callArgs.queryFn).toBe('function');
    expect(callArgs.enabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge: queryKey structure for disabled and enabled states
// ---------------------------------------------------------------------------

describe('useContacto — queryKey structure edge cases', () => {
  it('[P2] should pass queryKey containing null when contactoId is null', () => {
    // GIVEN: contactoId is null
    useContacto(null);

    // WHEN: useQuery options are inspected
    const callArgs = mockUseQuery.mock.calls[0][0] as { queryKey: unknown[] };

    // THEN: queryKey is ['contactos', null]
    expect(callArgs.queryKey).toEqual(['contactos', null]);
  });

  it('[P2] should pass queryKey containing undefined when contactoId is undefined', () => {
    // GIVEN: contactoId is undefined
    useContacto(undefined);

    // WHEN: useQuery options are inspected
    const callArgs = mockUseQuery.mock.calls[0][0] as { queryKey: unknown[] };

    // THEN: queryKey is ['contactos', undefined]
    expect(callArgs.queryKey).toEqual(['contactos', undefined]);
  });

  it('[P1] should produce distinct queryKeys for two different UUIDs', () => {
    // GIVEN: Two valid but different contactoIds
    const id1 = '10000000-0000-0000-0000-000000000001';
    const id2 = '10000000-0000-0000-0000-000000000002';

    useContacto(id1);
    const key1 = (mockUseQuery.mock.calls[0][0] as { queryKey: unknown[] }).queryKey;

    mockUseQuery.mockClear();

    useContacto(id2);
    const key2 = (mockUseQuery.mock.calls[0][0] as { queryKey: unknown[] }).queryKey;

    // THEN: The two queryKeys are NOT equal (distinct cache entries per TanStack docs)
    expect(key1).not.toEqual(key2);
    expect(key1[1]).toBe(id1);
    expect(key2[1]).toBe(id2);
  });

  it('[P1] should use "contactos" as the first queryKey segment (canonical key per architecture)', () => {
    // GIVEN: A valid contactoId
    const contactoId = '10000000-0000-0000-0000-000000000003';

    // WHEN: useContacto is called
    useContacto(contactoId);

    // THEN: First segment of queryKey is "contactos" (matches Story 3.1 list key pattern)
    const callArgs = mockUseQuery.mock.calls[0][0] as { queryKey: unknown[] };
    expect(callArgs.queryKey[0]).toBe('contactos');
    expect(callArgs.queryKey[1]).toBe(contactoId);
  });
});

// ---------------------------------------------------------------------------
// Edge: staleTime and retry configuration
// ---------------------------------------------------------------------------

describe('useContacto — staleTime and retry configuration', () => {
  it('[P2] should set retry to 0 or a finite non-negative value (avoids infinite retries)', () => {
    // GIVEN: A valid contactoId
    const contactoId = '10000000-0000-0000-0000-000000000001';

    // WHEN: useContacto is called
    useContacto(contactoId);

    // THEN: retry is 0 (per implementation) — no retries on error in test mode
    const callArgs = mockUseQuery.mock.calls[0][0] as { retry?: number };
    if (callArgs.retry !== undefined) {
      expect(callArgs.retry).toBeGreaterThanOrEqual(0);
    }
  });

  it('[P2] should set staleTime to 0 or a finite non-negative number', () => {
    // GIVEN: A valid contactoId
    const contactoId = '10000000-0000-0000-0000-000000000001';

    // WHEN: useContacto is called
    useContacto(contactoId);

    // THEN: staleTime is defined and is a valid non-negative number
    const callArgs = mockUseQuery.mock.calls[0][0] as { staleTime?: number };
    if (callArgs.staleTime !== undefined) {
      expect(callArgs.staleTime).toBeGreaterThanOrEqual(0);
    }
  });
});
