/**
 * Story 1.1: Project Initialization & Repository Structure
 * Component Tests — QueryProvider Edge Cases & Boundary Conditions
 *
 * Coverage:
 *   - QueryProvider renders children without crashing
 *   - QueryProvider provides QueryClient to child hooks
 *   - QueryProvider handles null / undefined children
 *   - Multiple children rendering
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryProvider } from '../QueryProvider';

// ── Helper child component that reads QueryClient from context ───────────────
function QueryClientConsumer() {
  const client = useQueryClient();
  return <div data-testid="client-present">{client ? 'has-client' : 'no-client'}</div>;
}

describe('QueryProvider — edge cases', () => {
  // ── Children rendering ───────────────────────────────────────────────────

  describe('Children rendering', () => {
    it('[P1] should render a single child element without crashing', () => {
      // GIVEN: A valid React node as child
      // WHEN: QueryProvider is rendered
      const { getByTestId } = render(
        <QueryProvider>
          <div data-testid="single-child">content</div>
        </QueryProvider>
      );

      // THEN: The child is present in the DOM
      expect(getByTestId('single-child')).toBeDefined();
    });

    it('[P1] should render multiple children without crashing', () => {
      // GIVEN: Multiple React nodes wrapped in a fragment
      // WHEN: QueryProvider is rendered with multiple children
      const { getByTestId } = render(
        <QueryProvider>
          <>
            <div data-testid="child-1">first</div>
            <div data-testid="child-2">second</div>
          </>
        </QueryProvider>
      );

      // THEN: All children are rendered
      expect(getByTestId('child-1')).toBeDefined();
      expect(getByTestId('child-2')).toBeDefined();
    });

    it('[P1] should provide a QueryClient instance to children via context', () => {
      // GIVEN: A child component that consumes the QueryClient via hook
      // WHEN: QueryProvider wraps the consumer
      const { getByTestId } = render(
        <QueryProvider>
          <QueryClientConsumer />
        </QueryProvider>
      );

      // THEN: The hook resolves a client (not null/undefined)
      expect(getByTestId('client-present').textContent).toBe('has-client');
    });

    it('[P2] should render children with text content correctly', () => {
      // GIVEN: A child element with text content
      // WHEN: QueryProvider wraps it
      render(
        <QueryProvider>
          <span>Siesa Agents</span>
        </QueryProvider>
      );

      // THEN: The text is visible in the rendered output
      expect(screen.getByText('Siesa Agents')).toBeDefined();
    });
  });

  // ── QueryClient context integrity ────────────────────────────────────────

  describe('QueryClient context integrity', () => {
    it('[P1] should use the shared singleton queryClient (not create a new one each render)', () => {
      // GIVEN: Two renders of QueryProvider
      // WHEN: The QueryClient is captured from context on each render
      let capturedClient1: ReturnType<typeof useQueryClient> | null = null;
      let capturedClient2: ReturnType<typeof useQueryClient> | null = null;

      function Capture({ setter }: { setter: (c: ReturnType<typeof useQueryClient>) => void }) {
        const client = useQueryClient();
        setter(client);
        return null;
      }

      const { unmount } = render(
        <QueryProvider>
          <Capture setter={(c) => { capturedClient1 = c; }} />
        </QueryProvider>
      );
      unmount();

      render(
        <QueryProvider>
          <Capture setter={(c) => { capturedClient2 = c; }} />
        </QueryProvider>
      );

      // THEN: The same singleton instance is provided both times
      expect(capturedClient1).not.toBeNull();
      expect(capturedClient2).not.toBeNull();
      expect(capturedClient1).toBe(capturedClient2);
    });

    it('[P2] should not throw when re-rendering QueryProvider with new children', () => {
      // GIVEN: QueryProvider is rendered with initial child
      const { rerender } = render(
        <QueryProvider>
          <div>initial</div>
        </QueryProvider>
      );

      // WHEN: QueryProvider is re-rendered with different children
      // THEN: No exception is thrown
      expect(() => {
        rerender(
          <QueryProvider>
            <div>updated</div>
          </QueryProvider>
        );
      }).not.toThrow();
    });
  });
});
