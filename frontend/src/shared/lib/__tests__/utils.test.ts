/**
 * Story 1.1: Project Initialization & Repository Structure
 * Unit tests for cn() utility — AC4 TypeScript strict mode coverage
 *
 * Covers:
 *  - Basic class concatenation
 *  - Conditional class merging (truthy/falsy)
 *  - Tailwind conflict resolution (tailwind-merge)
 *  - Empty input
 *  - Undefined / null inputs (strict null checks)
 */

import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn() utility — class name merging', () => {
  it('should return empty string when called with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('should return the class name for a single class string', () => {
    expect(cn('px-4')).toBe('px-4')
  })

  it('should merge multiple class strings with a space', () => {
    const result = cn('px-4', 'py-2', 'text-sm')
    expect(result).toBe('px-4 py-2 text-sm')
  })

  it('should ignore falsy values (false, undefined, null)', () => {
    const result = cn('px-4', false, undefined, null, 'py-2')
    expect(result).toBe('px-4 py-2')
  })

  it('should include a class when the condition is true', () => {
    const isActive = true
    const result = cn('base', isActive && 'active')
    expect(result).toContain('active')
  })

  it('should exclude a class when the condition is false', () => {
    const isActive = false
    const result = cn('base', isActive && 'active')
    expect(result).not.toContain('active')
    expect(result).toBe('base')
  })

  it('should resolve Tailwind conflicts — last padding class wins (tailwind-merge)', () => {
    // tailwind-merge resolves conflicts: px-4 then px-2 → px-2
    const result = cn('px-4', 'px-2')
    expect(result).toBe('px-2')
  })

  it('should resolve Tailwind text color conflicts', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('should handle object syntax from clsx (conditional classes as object)', () => {
    const result = cn({ 'bg-primary': true, 'bg-secondary': false }, 'text-sm')
    expect(result).toContain('bg-primary')
    expect(result).not.toContain('bg-secondary')
    expect(result).toContain('text-sm')
  })
})
