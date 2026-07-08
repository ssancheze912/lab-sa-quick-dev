/**
 * Story 2.1 — ATDD (RED phase).
 *
 * Covers AC #2 — the 150 ms debounce on the search input that gates
 * re-computation of the filtered list.
 *
 * RED until `src/modules/crm/clientes/application/useDebouncedValue.ts` exists.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue hook', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('GIVEN initial value, WHEN hook mounts, THEN debounced value equals input immediately', () => {
    const { result } = renderHook(({ value }) => useDebouncedValue(value, 150), {
      initialProps: { value: 'a' },
    })

    expect(result.current).toBe('a')
  })

  it('GIVEN a value change, WHEN less than 150 ms elapsed, THEN debounced value has NOT updated yet', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 150), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(result.current).toBe('a')
  })

  it('GIVEN a value change, WHEN 150 ms have elapsed, THEN debounced value has updated', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 150), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'abc' })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe('abc')
  })

  it('GIVEN rapid consecutive changes, WHEN only the last one settles for 150 ms, THEN only the last value is emitted', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 150), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    rerender({ value: 'abc' })
    act(() => {
      vi.advanceTimersByTime(50)
    })
    rerender({ value: 'abcd' })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe('abcd')
  })

  it('GIVEN no explicit delay is passed, THEN default delay is 150 ms', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
      initialProps: { value: 'x' },
    })

    rerender({ value: 'y' })
    act(() => {
      vi.advanceTimersByTime(149)
    })
    expect(result.current).toBe('x')
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('y')
  })
})
