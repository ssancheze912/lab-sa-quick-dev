import { describe, expect, it } from 'vitest'
import { cn } from '../utils'

describe('cn helper', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('deduplicates conflicting tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})
