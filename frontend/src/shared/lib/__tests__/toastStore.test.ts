import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useToastStore, toast } from '../toastStore'

/**
 * Unit tests for toastStore (Zustand) — Story 2.3 edge case expansion.
 * BMad-Integrated: covers store state transitions, auto-dismiss, and dismiss action.
 *
 * Test IDs: UNIT-C-FE-TOAST-01 … UNIT-C-FE-TOAST-08
 */

describe('useToastStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useToastStore.setState({ toasts: [] })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-TOAST-01: success() adds a toast of type 'success'
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-TOAST-01 — success() adds a success toast with the correct message', () => {
    useToastStore.getState().success('Cliente creado correctamente')
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].message).toBe('Cliente creado correctamente')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-TOAST-02: error() adds a toast of type 'error'
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-TOAST-02 — error() adds an error toast with the correct message', () => {
    useToastStore.getState().error('Error al guardar')
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('error')
    expect(toasts[0].message).toBe('Error al guardar')
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-TOAST-03: dismiss() removes the toast with the given id
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-TOAST-03 — dismiss() removes the toast with the matching id', () => {
    useToastStore.getState().success('Toast to dismiss')
    const { toasts: before } = useToastStore.getState()
    const id = before[0].id
    useToastStore.getState().dismiss(id)
    const { toasts: after } = useToastStore.getState()
    expect(after).toHaveLength(0)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-TOAST-04: dismiss() with unknown id does not remove other toasts
  // Error path: calling dismiss with an id that does not exist is a no-op.
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-TOAST-04 — dismiss() with non-existent id is a no-op', () => {
    useToastStore.getState().success('Keep this toast')
    useToastStore.getState().dismiss(-99999)
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-TOAST-05: Multiple toasts accumulate without overwriting
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-TOAST-05 — adding multiple toasts accumulates them in the array', () => {
    useToastStore.getState().success('First')
    useToastStore.getState().success('Second')
    useToastStore.getState().error('Third')
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(3)
    expect(toasts.map((t) => t.message)).toEqual(['First', 'Second', 'Third'])
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-TOAST-06: Auto-dismiss removes toast after 4000ms
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-TOAST-06 — success toast auto-dismisses after 4000ms', () => {
    useToastStore.getState().success('Auto-dismiss me')
    expect(useToastStore.getState().toasts).toHaveLength(1)

    vi.advanceTimersByTime(3999)
    expect(useToastStore.getState().toasts).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-TOAST-07: Auto-dismiss removes error toast after 4000ms
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-TOAST-07 — error toast auto-dismisses after 4000ms', () => {
    useToastStore.getState().error('Auto-dismiss error')
    vi.advanceTimersByTime(4000)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  // ---------------------------------------------------------------------------
  // UNIT-C-FE-TOAST-08: toast.success() façade delegates to store success()
  // ---------------------------------------------------------------------------
  it('UNIT-C-FE-TOAST-08 — toast.success() facade adds a success toast to the store', () => {
    toast.success('Via facade')
    const { toasts } = useToastStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].message).toBe('Via facade')
  })
})
