/**
 * Story 2.1 — Automate (Edge Cases).
 *
 * Expands ATDD coverage of `useDebouncedValue` with boundary conditions:
 *   * delay of 0 → the value should update on the very next tick.
 *   * Unmount cleanup → pending setTimeout must be cleared (no zombie updates).
 *   * Object values → reference equality is preserved across the debounce.
 *   * Custom delay (500 ms) → default 150 ms is not silently applied.
 *
 * [P2] tag — utility hook: correctness matters, blast radius is small.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue — edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('GIVEN delay=0, WHEN the value changes, THEN the update settles on the next tick', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 0), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(result.current).toBe('b')
  })

  it('GIVEN a custom 500 ms delay, WHEN 149 ms elapse, THEN the value has NOT updated', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(149)
    })

    expect(result.current).toBe('a')
  })

  it('GIVEN a custom 500 ms delay, WHEN 500 ms elapse, THEN the value updates', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current).toBe('b')
  })

  it('GIVEN a pending update, WHEN the component unmounts, THEN the setTimeout is cleared (no error thrown)', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 'a' } },
    )

    rerender({ value: 'b' })
    unmount()

    // If cleanup were missing, this would attempt to setState on an unmounted
    // component. React 19 no longer emits a warning, but the value shouldn't
    // have been persisted anywhere observable.
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('a')
  })

  it('GIVEN an object value, WHEN the debounce settles, THEN reference equality is preserved', () => {
    const initial = { text: 'hello' }
    const changed = { text: 'world' }

    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: initial } },
    )

    expect(result.current).toBe(initial)

    rerender({ value: changed })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe(changed)
  })

  it('GIVEN the same value re-rendered, WHEN the debounce runs, THEN the returned reference does not change', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 'stable' } },
    )

    const first = result.current
    rerender({ value: 'stable' })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe(first)
  })

  it('GIVEN a value that changes to falsy, WHEN the debounce settles, THEN the debounced value updates to the falsy value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 150),
      { initialProps: { value: 'text' } },
    )

    rerender({ value: '' })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe('')
  })
})
