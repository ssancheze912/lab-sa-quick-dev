import { describe, test, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { renderWithRouter } from '@/test/support/renderWithRouter'
import { mockViewport } from '@/test/support/viewport'
import { AppShell } from './AppShell'

// RED PHASE: AppShell.tsx does not exist yet. Covers Task 6's accessibility
// requirement (axe, WCAG-level check) on the navigation shell, both in its
// desktop rail and mobile bottom-nav configurations.
//
// Requires `vitest-axe` as a devDependency (not yet installed — see
// Implementation Checklist / Mock & Tooling Requirements in the ATDD output).

describe('AppShell accessibility', () => {
  test('should have no detectable accessibility violations on desktop (NavigationRail)', async () => {
    // GIVEN: the app is loaded on a desktop viewport
    mockViewport('desktop')

    // WHEN: AppShell renders with the navigation rail
    const { container } = renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })
    await screen.findByTestId('navigation-rail')

    // THEN: axe reports zero violations
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('should have no detectable accessibility violations on mobile (NavigationBar)', async () => {
    // GIVEN: the app is loaded on a mobile viewport
    mockViewport('mobile')

    // WHEN: AppShell renders with the mobile bottom navigation
    const { container } = renderWithRouter(<AppShell><div>content</div></AppShell>, { initialPath: '/clientes' })
    await screen.findByTestId('navigation-bar')

    // THEN: axe reports zero violations
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
