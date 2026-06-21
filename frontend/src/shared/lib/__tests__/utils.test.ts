import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn (class name utility)', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should resolve tailwind conflicts', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('should handle conditional classes', () => {
    const result = cn('base', { conditional: true, skipped: false })
    expect(result).toBe('base conditional')
  })

  it('should handle undefined and null gracefully', () => {
    const result = cn('base', undefined, null, '')
    expect(result).toBe('base')
  })
})
