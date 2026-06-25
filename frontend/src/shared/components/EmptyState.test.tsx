/**
 * Story 2.1: EmptyState component — Component Tests
 * ATDD — RED Phase (Tests intentionally failing — no implementation yet)
 *
 * Acceptance Criteria covered:
 * - AC3: EmptyState renders with a Spanish guidance message
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';

// SUT — will fail until implemented
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('should render the empty state container', () => {
    // GIVEN: EmptyState is rendered with a message
    render(createElement(EmptyState, { message: 'No hay clientes registrados.' }));

    // THEN: Container is in the DOM with testid
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should display the provided message text', () => {
    // GIVEN: EmptyState receives a specific message
    render(createElement(EmptyState, { message: 'Crea tu primer cliente aquí.' }));

    // THEN: The message text is visible
    expect(screen.getByText('Crea tu primer cliente aquí.')).toBeInTheDocument();
  });

  it('should render an icon element', () => {
    // GIVEN: EmptyState is rendered
    render(createElement(EmptyState, { message: 'No hay datos.' }));

    // THEN: An icon is rendered (tested via aria or testid)
    expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
  });
});
