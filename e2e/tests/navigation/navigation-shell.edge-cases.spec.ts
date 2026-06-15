/**
 * Story 1.2: Frontend Navigation Shell — Expanded Coverage (testarch-automate)
 *
 * E2E edge cases / negative paths (P1-P2).
 * Extends the ATDD baseline (`navigation-shell.spec.ts`) with:
 *   - Browser back/forward across SPA routes (history navigation, no full reload).
 *   - Round-trip navigation: /clientes → /contactos → /clientes preserves SPA marker.
 *   - Re-clicking the active nav item does not break the URL or shell.
 *   - Multiple consecutive unknown routes still render not-found with shell.
 *   - 404 → click "Ir a Clientes" recovers into /clientes view.
 *   - Active state mirrors path after direct navigation (no click).
 *
 * Patterns enforced:
 *   - data-testid selectors only
 *   - No hard waits
 *   - Network-first when measuring initial load
 *   - One behavioural assertion per test
 */

import { test, expect } from '@playwright/test'

// ─────────────────────────────────────────────────────────────────────────────
// Browser history — back / forward preserves SPA
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #2 edge — browser history navigation preserves SPA', () => {
  test('[P1] GIVEN user navigated /clientes → /contactos WHEN clicking browser back THEN URL returns to /clientes without full reload', async ({
    page,
  }) => {
    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-heading')).toBeVisible()

    // Tag SPA marker BEFORE the next navigation
    await page.evaluate(() => {
      ;(window as unknown as { __spaTag?: string }).__spaTag = 'kept'
    })

    // Forward: click Contactos
    const contactosRail = page.getByTestId('nav-rail-item-contactos')
    const contactosBar = page.getByTestId('nav-bar-item-contactos')
    if ((await contactosRail.count()) > 0 && (await contactosRail.isVisible())) {
      await contactosRail.click()
    } else {
      await contactosBar.click()
    }
    await expect(page).toHaveURL(/\/contactos$/)

    // WHEN: browser back
    await page.goBack()

    // THEN: back to /clientes and SPA marker survived (no full reload)
    await expect(page).toHaveURL(/\/clientes$/)
    const markerAfterBack = await page.evaluate(
      () => (window as unknown as { __spaTag?: string }).__spaTag,
    )
    expect(markerAfterBack).toBe('kept')
    await expect(page.getByTestId('clientes-heading')).toBeVisible()
  })

  test('[P1] GIVEN user used back to /clientes WHEN clicking browser forward THEN URL returns to /contactos without reload', async ({
    page,
  }) => {
    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-heading')).toBeVisible()

    await page.evaluate(() => {
      ;(window as unknown as { __spaFwd?: string }).__spaFwd = 'survived'
    })

    const contactosRail = page.getByTestId('nav-rail-item-contactos')
    const contactosBar = page.getByTestId('nav-bar-item-contactos')
    if ((await contactosRail.count()) > 0 && (await contactosRail.isVisible())) {
      await contactosRail.click()
    } else {
      await contactosBar.click()
    }
    await expect(page).toHaveURL(/\/contactos$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/clientes$/)

    // WHEN: browser forward
    await page.goForward()

    // THEN: forward to /contactos and SPA marker survived
    await expect(page).toHaveURL(/\/contactos$/)
    const marker = await page.evaluate(
      () => (window as unknown as { __spaFwd?: string }).__spaFwd,
    )
    expect(marker).toBe('survived')
    await expect(page.getByTestId('contactos-heading')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Round-trip navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #2 edge — round-trip navigation', () => {
  test('[P1] GIVEN user navigates /clientes → /contactos → /clientes WHEN inspecting SPA marker THEN no full reload occurred', async ({
    page,
  }) => {
    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-heading')).toBeVisible()

    await page.evaluate(() => {
      ;(window as unknown as { __rtTag?: string }).__rtTag = 'roundtrip'
    })

    // /clientes → /contactos
    const contactosRail = page.getByTestId('nav-rail-item-contactos')
    const contactosBar = page.getByTestId('nav-bar-item-contactos')
    if ((await contactosRail.count()) > 0 && (await contactosRail.isVisible())) {
      await contactosRail.click()
    } else {
      await contactosBar.click()
    }
    await expect(page).toHaveURL(/\/contactos$/)

    // /contactos → /clientes
    const clientesRail = page.getByTestId('nav-rail-item-clientes')
    const clientesBar = page.getByTestId('nav-bar-item-clientes')
    if ((await clientesRail.count()) > 0 && (await clientesRail.isVisible())) {
      await clientesRail.click()
    } else {
      await clientesBar.click()
    }
    await expect(page).toHaveURL(/\/clientes$/)

    const marker = await page.evaluate(
      () => (window as unknown as { __rtTag?: string }).__rtTag,
    )
    expect(marker).toBe('roundtrip')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Re-clicking the already active item
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #2 edge — re-clicking active item is a no-op for URL', () => {
  test('[P2] GIVEN user is on /clientes WHEN they click the Clientes rail item again THEN URL remains /clientes and view stays visible', async ({
    page,
  }) => {
    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-heading')).toBeVisible()

    const railClientes = page.getByTestId('nav-rail-item-clientes')
    const barClientes = page.getByTestId('nav-bar-item-clientes')

    if ((await railClientes.count()) > 0 && (await railClientes.isVisible())) {
      await railClientes.click()
    } else {
      await barClientes.click()
    }

    await expect(page).toHaveURL(/\/clientes$/)
    await expect(page.getByTestId('clientes-heading')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Active state on direct deep link
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #2 edge — active state mirrors path on deep link', () => {
  test('[P1] GIVEN user opens /contactos directly WHEN page loads THEN the active nav item is Contactos (data-active="true")', async ({
    page,
  }) => {
    await page.goto('/contactos')
    await expect(page.getByTestId('contactos-heading')).toBeVisible()

    // Either rail OR bar will be active depending on viewport. Both should agree.
    const railContactos = page.getByTestId('nav-rail-item-contactos')
    const barContactos = page.getByTestId('nav-bar-item-contactos')

    if (await railContactos.isVisible().catch(() => false)) {
      await expect(railContactos).toHaveAttribute('data-active', 'true')
    } else {
      await expect(barContactos).toHaveAttribute('data-active', 'true')
    }
  })

  test('[P1] GIVEN user opens /clientes directly WHEN page loads THEN the Contactos item is NOT active', async ({
    page,
  }) => {
    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-heading')).toBeVisible()

    const railContactos = page.getByTestId('nav-rail-item-contactos')
    const barContactos = page.getByTestId('nav-bar-item-contactos')

    if (await railContactos.isVisible().catch(() => false)) {
      await expect(railContactos).toHaveAttribute('data-active', 'false')
    } else {
      await expect(barContactos).toHaveAttribute('data-active', 'false')
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Multiple unknown routes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #5 edge — consecutive unknown routes still render not-found', () => {
  test('[P2] GIVEN user visits /ruta-uno then /ruta-dos WHEN both load THEN each shows the not-found view', async ({
    page,
  }) => {
    await page.goto('/ruta-uno')
    await expect(page.getByTestId('not-found-view')).toBeVisible()

    await page.goto('/ruta-dos')
    await expect(page.getByTestId('not-found-view')).toBeVisible()
  })

  test('[P2] GIVEN user lands on unknown route with deep segments WHEN page loads THEN not-found view renders', async ({
    page,
  }) => {
    // Deep, multi-segment unknown path.
    await page.goto('/foo/bar/baz')

    await expect(page.getByTestId('not-found-view')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /página no encontrada/i }),
    ).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Recovery — 404 → "Ir a Clientes"
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #5 edge — recovery via "Ir a Clientes" link', () => {
  test('[P1] GIVEN user is on the not-found view WHEN they click "Ir a Clientes" THEN they land on /clientes and the Clientes view renders', async ({
    page,
  }) => {
    await page.goto('/ruta-inexistente-123')
    await expect(page.getByTestId('not-found-view')).toBeVisible()

    // WHEN: click recovery link
    await page.getByTestId('not-found-link-clientes').click()

    // THEN: URL becomes /clientes and the Clientes view is shown
    await expect(page).toHaveURL(/\/clientes$/)
    await expect(page.getByTestId('clientes-heading')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AC #1 — Persistent shell branding (Siesa Agents)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('AC #1 edge — Siesa Agents brand stays mounted', () => {
  test('[P2] GIVEN desktop viewport WHEN /clientes renders THEN "Siesa Agents" product name is present in the navbar chrome', async ({
    page,
    viewport,
  }) => {
    // Skip on mobile-only projects (LayoutBase navbar is desktop only).
    test.skip(
      viewport !== null && viewport.width < 1024,
      'LayoutBase navbar with productName only renders on desktop',
    )

    await page.goto('/clientes')
    await expect(page.getByTestId('clientes-heading')).toBeVisible()

    // Brand text is somewhere on the page (rendered by siesa-ui-kit LayoutBase).
    // We use a loose accessible-name match — the kit owns the exact DOM.
    await expect(page.getByText(/siesa agents/i).first()).toBeVisible()
  })
})
