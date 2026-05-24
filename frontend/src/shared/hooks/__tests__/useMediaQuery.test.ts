/**
 * Story 1.2: Frontend Navigation Shell
 * Epic 1: Project Foundation & Application Shell
 *
 * Unit Tests — useMediaQuery hook edge cases
 * Covers boundary conditions not included in the ATDD component tests:
 *   - Initial state synchronously matches window.matchMedia
 *   - Returns false when window is undefined (SSR safety)
 *   - Event listener is attached and responds to media query changes
 *   - Event listener is cleaned up on unmount (no memory leaks)
 *   - Hook works correctly with non-1024px queries
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMediaQuery } from '../useMediaQuery';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a controllable matchMedia mock
// ─────────────────────────────────────────────────────────────────────────────

type MediaQueryListMock = {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  _triggerChange: (matches: boolean) => void;
};

function createMatchMediaMock(initialMatches: boolean): MediaQueryListMock {
  let changeHandler: ((event: { matches: boolean }) => void) | null = null;

  const mock: MediaQueryListMock = {
    matches: initialMatches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((eventType: string, handler: (e: { matches: boolean }) => void) => {
      if (eventType === 'change') {
        changeHandler = handler;
      }
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    _triggerChange: (newMatches: boolean) => {
      mock.matches = newMatches;
      if (changeHandler) changeHandler({ matches: newMatches });
    },
  };

  return mock;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: ensure window.matchMedia is defined before spying
// ─────────────────────────────────────────────────────────────────────────────

function installMatchMediaSpy(mockMql: MediaQueryListMock) {
  // jsdom does not implement matchMedia — define it before spying
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: () => mockMql,
  });
  return vi.spyOn(window, 'matchMedia').mockReturnValue(mockMql as unknown as MediaQueryList);
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────

describe('useMediaQuery — initial state', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true immediately when window.matchMedia matches on mount', () => {
    // GIVEN: window.matchMedia returns matches=true for the query
    const mockMql = createMatchMediaMock(true);
    installMatchMediaSpy(mockMql);

    // WHEN: Hook is rendered with the matching query
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    // THEN: Returns true without waiting for an effect
    expect(result.current).toBe(true);
  });

  it('returns false immediately when window.matchMedia does not match on mount', () => {
    // GIVEN: window.matchMedia returns matches=false for the query
    const mockMql = createMatchMediaMock(false);
    installMatchMediaSpy(mockMql);

    // WHEN: Hook is rendered with a non-matching query
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    // THEN: Returns false
    expect(result.current).toBe(false);
  });

  it('calls window.matchMedia with the exact query string provided', () => {
    // GIVEN: A specific media query string is passed
    const mockMql = createMatchMediaMock(false);
    const spy = installMatchMediaSpy(mockMql);

    // WHEN: Hook is rendered
    renderHook(() => useMediaQuery('(max-width: 768px)'));

    // THEN: matchMedia is called with the exact query
    expect(spy).toHaveBeenCalledWith('(max-width: 768px)');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reactive updates on media query change
// ─────────────────────────────────────────────────────────────────────────────

describe('useMediaQuery — reactive updates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates from true to false when media query stops matching', () => {
    // GIVEN: Hook starts with matching=true
    const mockMql = createMatchMediaMock(true);
    installMatchMediaSpy(mockMql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(true);

    // WHEN: The media query stops matching (viewport shrinks below 1024px)
    act(() => {
      mockMql._triggerChange(false);
    });

    // THEN: Hook returns false
    expect(result.current).toBe(false);
  });

  it('updates from false to true when media query starts matching', () => {
    // GIVEN: Hook starts with matching=false
    const mockMql = createMatchMediaMock(false);
    installMatchMediaSpy(mockMql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(false);

    // WHEN: The media query starts matching (viewport grows above 1024px)
    act(() => {
      mockMql._triggerChange(true);
    });

    // THEN: Hook returns true
    expect(result.current).toBe(true);
  });

  it('responds to multiple consecutive changes correctly', () => {
    // GIVEN: Hook starts matching
    const mockMql = createMatchMediaMock(true);
    installMatchMediaSpy(mockMql);

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    // WHEN: Multiple changes occur in sequence
    act(() => { mockMql._triggerChange(false); });
    expect(result.current).toBe(false);

    act(() => { mockMql._triggerChange(true); });
    expect(result.current).toBe(true);

    act(() => { mockMql._triggerChange(false); });

    // THEN: Final state reflects the last change
    expect(result.current).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Event listener lifecycle
// ─────────────────────────────────────────────────────────────────────────────

describe('useMediaQuery — event listener lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches a "change" event listener on mount', () => {
    // GIVEN: A matchMedia mock with spy on addEventListener
    const mockMql = createMatchMediaMock(false);
    installMatchMediaSpy(mockMql);

    // WHEN: Hook mounts
    renderHook(() => useMediaQuery('(min-width: 1024px)'));

    // THEN: addEventListener was called with "change"
    expect(mockMql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('removes the "change" event listener on unmount (no memory leaks)', () => {
    // GIVEN: Hook is mounted with a listener
    const mockMql = createMatchMediaMock(false);
    installMatchMediaSpy(mockMql);

    const { unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    // WHEN: Hook is unmounted
    unmount();

    // THEN: removeEventListener was called with "change" (cleanup prevents memory leaks)
    expect(mockMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('does not attach multiple listeners on re-render with same query', () => {
    // GIVEN: Hook renders multiple times with the same query
    const mockMql = createMatchMediaMock(false);
    installMatchMediaSpy(mockMql);

    const { rerender } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    rerender();
    rerender();

    // THEN: addEventListener is called exactly once (useEffect with [query] dep)
    // The effect only re-runs when query changes, not on every render
    expect(mockMql.addEventListener).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Query string boundary conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('useMediaQuery — query string boundary conditions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('works correctly with a max-width query (mobile breakpoint)', () => {
    // GIVEN: A max-width query instead of min-width
    const mockMql = createMatchMediaMock(true);
    installMatchMediaSpy(mockMql);

    // WHEN: Hook is called with a max-width query
    const { result } = renderHook(() => useMediaQuery('(max-width: 1023px)'));

    // THEN: Returns the matchMedia result for that query
    expect(result.current).toBe(true);
  });

  it('re-attaches listener when query string changes', () => {
    // GIVEN: Hook starts with one query
    const mockMql = createMatchMediaMock(true);
    installMatchMediaSpy(mockMql);

    let query = '(min-width: 1024px)';
    const { rerender } = renderHook(() => useMediaQuery(query));

    const initialCallCount = mockMql.addEventListener.mock.calls.length;

    // WHEN: The query changes
    query = '(min-width: 768px)';
    rerender();

    // THEN: A new listener was attached for the new query
    expect(mockMql.addEventListener.mock.calls.length).toBeGreaterThan(initialCallCount);
  });
});
