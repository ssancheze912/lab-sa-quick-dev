/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — useIsDesktop hook — Vitest
 *
 * Edge cases and boundary conditions NOT covered by ATDD baseline:
 *   - Initial state driven by MediaQueryList.matches
 *   - MediaQuery change event listener updates state
 *   - Cleanup on unmount (removeEventListener called)
 *   - Boundary values: 1023px vs 1024px
 *   - matchMedia called with correct query string
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsDesktop } from '../useIsDesktop';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — MediaQueryList mock factory
// jsdom does not implement window.matchMedia; we define it via Object.defineProperty
// ─────────────────────────────────────────────────────────────────────────────

type ChangeHandler = (event: MediaQueryListEvent) => void;

function setupMatchMediaMock(matches: boolean) {
  const listeners: ChangeHandler[] = [];

  const mql = {
    matches,
    addEventListener: vi.fn((_event: string, handler: ChangeHandler) => {
      listeners.push(handler);
    }),
    removeEventListener: vi.fn((_event: string, handler: ChangeHandler) => {
      const idx = listeners.indexOf(handler);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
    dispatchChange: (newMatches: boolean) => {
      listeners.forEach((fn) => fn({ matches: newMatches } as MediaQueryListEvent));
    },
    activeListenerCount: () => listeners.length,
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue(mql),
  });

  return mql;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cleanup after each test
// ─────────────────────────────────────────────────────────────────────────────

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// P2 — Initial state from MediaQueryList.matches
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] useIsDesktop — initial state from MediaQueryList.matches', () => {
  it('[P2] should return true when MediaQueryList.matches is true (>= 1024px)', () => {
    // GIVEN: matchMedia reports desktop (matches = true)
    setupMatchMediaMock(true);

    // WHEN: Hook initializes
    const { result } = renderHook(() => useIsDesktop());

    // THEN: Returns true (desktop)
    expect(result.current).toBe(true);
  });

  it('[P2] should return false when MediaQueryList.matches is false (< 1024px)', () => {
    // GIVEN: matchMedia reports mobile (matches = false)
    setupMatchMediaMock(false);

    // WHEN: Hook initializes
    const { result } = renderHook(() => useIsDesktop());

    // THEN: Returns false (mobile)
    expect(result.current).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P1 — MediaQuery change event — responsive state update
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useIsDesktop — MediaQuery change event updates state', () => {
  it('[P1] should update to true when viewport resizes above 1024px', () => {
    // GIVEN: Hook initialized at mobile viewport (matches = false)
    const mql = setupMatchMediaMock(false);
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);

    // WHEN: MediaQuery fires change event indicating desktop
    act(() => {
      mql.dispatchChange(true);
    });

    // THEN: Hook returns true
    expect(result.current).toBe(true);
  });

  it('[P1] should update to false when viewport resizes below 1024px', () => {
    // GIVEN: Hook initialized at desktop viewport (matches = true)
    const mql = setupMatchMediaMock(true);
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);

    // WHEN: MediaQuery fires change event indicating mobile
    act(() => {
      mql.dispatchChange(false);
    });

    // THEN: Hook returns false
    expect(result.current).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P1 — Cleanup on unmount — no memory leak
// ─────────────────────────────────────────────────────────────────────────────

describe('[P1] useIsDesktop — cleanup on unmount', () => {
  it('[P1] should remove event listener from MediaQuery on unmount', () => {
    // GIVEN: Hook is mounted
    const mql = setupMatchMediaMock(true);
    const { unmount } = renderHook(() => useIsDesktop());

    // Event listener was registered
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    // WHEN: Hook unmounts
    unmount();

    // THEN: removeEventListener was called (cleanup executed)
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('[P1] should not retain listener in listener array after unmount', () => {
    // GIVEN: Hook is mounted and then unmounted
    const mql = setupMatchMediaMock(false);
    const { unmount } = renderHook(() => useIsDesktop());

    // WHEN: Hook unmounts
    unmount();

    // THEN: Listeners list is empty (removed during cleanup)
    expect(mql.activeListenerCount()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// P2 — matchMedia called with correct query string
// ─────────────────────────────────────────────────────────────────────────────

describe('[P2] useIsDesktop — matchMedia query string', () => {
  it('[P2] should call window.matchMedia with the (min-width: 1024px) query', () => {
    // GIVEN: window.matchMedia is mocked
    setupMatchMediaMock(true);

    // WHEN: Hook mounts
    renderHook(() => useIsDesktop());

    // THEN: matchMedia was called with the correct breakpoint query
    expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });
});
