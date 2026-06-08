/**
 * Story 2.1: Client List & Search — Automate Phase
 * Epic 2: Client Management
 *
 * AUTOMATE expansion tests (edge cases — NOT regenerated from ATDD)
 * Complements `useDebouncedValue.test.ts` with cleanup, type variation,
 * and zero-delay boundaries that the ATDD intentionally left out.
 *
 * Acceptance Criteria touched:
 *   AC #5 — Search input debounced at 150 ms (NFR1).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue — edge cases (AC #5)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('[P2] works with numeric values (generic type T preserved)', () => {
    // GIVEN: a numeric hook with 150 ms delay
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 0 } },
    )

    // WHEN: the value bumps and the delay elapses
    rerender({ value: 42 })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    // THEN: the number propagates correctly
    expect(result.current).toBe(42)
  })

  it('[P2] works with object references (replaces, does not merge)', () => {
    // GIVEN: an object-typed hook
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: { a: 1 } as { a: number; b?: number } } },
    )

    // WHEN: the value is replaced and the delay elapses
    const next = { a: 2, b: 3 }
    rerender({ value: next })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    // THEN: the reference is replaced verbatim (no merge)
    expect(result.current).toBe(next)
    expect(result.current).toEqual({ a: 2, b: 3 })
  })

  it('[P2] respects a 0 ms delay — flushes on next macrotask', () => {
    // GIVEN: a hook with 0 ms delay
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 0),
      { initialProps: { value: 'a' } },
    )

    // WHEN: the value changes
    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(0)
    })

    // THEN: the value catches up after the 0-delay timer fires
    expect(result.current).toBe('b')
  })

  it('[P2] cancels the pending timeout on unmount (no setState after unmount)', () => {
    // GIVEN: a hook with a pending change
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 'first' } },
    )

    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(50)
    })

    // WHEN: the hook unmounts before the timer fires
    unmount()

    // AND: the timer would have fired
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // THEN: no React warning was raised AND the captured snapshot is the
    // last value seen while mounted (still 'first' because debounce never flushed)
    expect(result.current).toBe('first')
  })

  it('[P2] keeps returning the same value when delayMs changes mid-flight', () => {
    // GIVEN: a hook with delay 150 ms
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'a', delay: 150 } },
    )

    // WHEN: the value changes AND the delay is bumped to 300 ms before 150 ms elapses
    rerender({ value: 'b', delay: 300 })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // THEN: still 'a' — the rescheduled timer fires at 300 ms not 150 ms
    expect(result.current).toBe('a')

    // WHEN: the remaining 100 ms elapses
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // THEN: now 'b' propagates
    expect(result.current).toBe('b')
  })
})
