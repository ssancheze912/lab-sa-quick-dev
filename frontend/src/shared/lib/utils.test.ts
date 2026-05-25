import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  // --- Existing happy-path tests ---
  it('[P0] merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('[P0] handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('[P0] deduplicates tailwind classes with tailwind-merge', () => {
    expect(cn('px-2 px-4')).toBe('px-4')
  })

  // --- Edge: empty inputs ---
  it('[P1] returns empty string when called with no arguments', () => {
    // GIVEN: no arguments
    // WHEN: calling cn()
    // THEN: returns empty string
    expect(cn()).toBe('')
  })

  it('[P1] returns empty string when all arguments are falsy', () => {
    // GIVEN: only falsy values
    // WHEN: calling cn with undefined, false, null-ish
    expect(cn(undefined, false as unknown as string, '')).toBe('')
  })

  // --- Edge: single class ---
  it('[P1] returns single class unchanged', () => {
    // GIVEN: a single class string
    // WHEN: calling cn with one value
    // THEN: returns that class
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  // --- Edge: array input ---
  it('[P2] supports array of class names', () => {
    // GIVEN: an array of class names passed as a spread
    // WHEN: calling cn with array
    // THEN: all classes appear in output
    const result = cn(['text-sm', 'font-bold'])
    expect(result).toContain('text-sm')
    expect(result).toContain('font-bold')
  })

  // --- Edge: object syntax (clsx feature) ---
  it('[P2] supports object syntax for conditional classes', () => {
    // GIVEN: an object where keys are class names and values are booleans
    // WHEN: calling cn with the object
    // THEN: only truthy keys appear in the result
    const result = cn({ 'text-green-500': true, 'text-red-500': false })
    expect(result).toContain('text-green-500')
    expect(result).not.toContain('text-red-500')
  })

  // --- Edge: multiple tailwind conflicts resolved to last ---
  it('[P2] resolves conflicting margin classes to the last one (tailwind-merge)', () => {
    // GIVEN: conflicting margin classes
    // WHEN: calling cn with m-2 then m-6
    const result = cn('m-2', 'm-6')
    // THEN: last class wins via tailwind-merge
    expect(result).toBe('m-6')
    expect(result).not.toContain('m-2')
  })

  // --- Edge: duplicate identical classes collapsed ---
  it('[P2] collapses identical class names to one occurrence', () => {
    // GIVEN: the same class repeated
    // WHEN: calling cn
    const result = cn('flex', 'flex')
    // THEN: appears only once
    expect(result.split(' ').filter((c) => c === 'flex').length).toBe(1)
  })

  // --- Edge: whitespace-only strings ---
  it('[P2] strips whitespace-only string arguments', () => {
    // GIVEN: whitespace-only strings mixed with real classes
    // WHEN: calling cn
    const result = cn('text-sm', '   ', 'font-bold')
    // THEN: no extra whitespace in output
    expect(result.trim()).toBe(result)
    expect(result).toBe('text-sm font-bold')
  })

  // --- Error path: never throws regardless of input ---
  it('[P1] never throws for any combination of class values', () => {
    // GIVEN: various unusual but valid ClassValue inputs
    // WHEN: calling cn
    // THEN: no exception thrown
    expect(() => cn(null as unknown as string, undefined, false as unknown as string, 0 as unknown as string, '')).not.toThrow()
  })
})
