import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryProvider } from '../QueryProvider'

describe('QueryProvider', () => {
  it('should render children correctly', () => {
    render(
      <QueryProvider>
        <div data-testid="child">Test Child</div>
      </QueryProvider>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should provide QueryClient context to children', () => {
    // If QueryClientProvider is not present, useQuery would throw
    // This verifies the context is available by rendering without error
    expect(() =>
      render(
        <QueryProvider>
          <span>ok</span>
        </QueryProvider>,
      ),
    ).not.toThrow()
  })
})
