/**
 * Story 2.1: Client List & Search — Task 11
 * Epic 2: Client Management
 *
 * ATDD unit test — RED Phase
 * Intentionally FAILING until `useDebouncedValue` is implemented.
 *
 * Acceptance Criteria covered:
 *   AC #5 — Real-time search filter debounced at 150 ms (NFR1).
 *
 * The hook MUST:
 *   - update the returned value only AFTER the configured delay,
 *   - cancel the pending timeout when the input changes again (no stale flushes),
 *   - return the latest value immediately on the first render.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
// RED: useDebouncedValue.ts does not exist yet — this import will fail until Task 11 is done.
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue (AC #5 — 150 ms debounce)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately on first render', () => {
    // GIVEN: an initial value "abc"
    // WHEN: the hook mounts
    const { result } = renderHook(() => useDebouncedValue('abc', 150))

    // THEN: the debounced value matches the initial value immediately
    expect(result.current).toBe('abc')
  })

  it('does NOT update the debounced value before the delay elapses', () => {
    // GIVEN: a hook with initial value "first" and 150 ms delay
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 'first' } },
    )

    // WHEN: the input changes
    rerender({ value: 'second' })

    // AND: less than 150 ms has elapsed
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // THEN: the returned value is still the previous one
    expect(result.current).toBe('first')
  })

  it('updates the debounced value AFTER the delay elapses', () => {
    // GIVEN: a hook initially holding "first" with 150 ms delay
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 'first' } },
    )

    // WHEN: the input changes
    rerender({ value: 'second' })

    // AND: the delay elapses
    act(() => {
      vi.advanceTimersByTime(150)
    })

    // THEN: the debounced value catches up
    expect(result.current).toBe('second')
  })

  it('cancels the previous timeout when the input changes again before delay completes', () => {
    // GIVEN: a hook with 150 ms delay
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 'first' } },
    )

    // WHEN: the input changes twice within the delay window
    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    rerender({ value: 'third' })

    // AND: 100 ms more pass (the original 150 ms window would have expired)
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // THEN: the value is STILL "first" because the second timeout was cancelled
    expect(result.current).toBe('first')

    // WHEN: the new debounce window elapses
    act(() => {
      vi.advanceTimersByTime(50)
    })

    // THEN: the value updates straight to "third" (skipping "second" entirely)
    expect(result.current).toBe('third')
  })
})
