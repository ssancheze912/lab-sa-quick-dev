import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn (className merger)', () => {
  it('merges duplicate tailwind classes with the last one winning', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('joins conditional classes correctly', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c')
  })
})
