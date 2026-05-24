import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryProvider } from '@/app/providers/QueryProvider'

describe('QueryProvider', () => {
  it('renders children without errors', () => {
    render(
      <QueryProvider>
        <span data-testid="child">Hello</span>
      </QueryProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
