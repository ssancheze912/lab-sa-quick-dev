---
story: "1.2 — Frontend Navigation Shell"
epic: "1 — Project Foundation & Application Shell"
phase: atdd-red
createdAt: "2026-06-21"
status: red
---

# ATDD Checklist — Story 1.2: Frontend Navigation Shell

## Summary

Tests are in RED phase (failing) — written before implementation. They define the expected behavior
for TanStack Router navigation, siesa-ui-kit shell components, responsive layout, and deep linking.

---

## Acceptance Criteria Coverage

| AC # | Description | Test Case ID | Level | File | Status |
|------|-------------|-------------|-------|------|--------|
| AC#1 | Desktop: LayoutBase shell with NavigationRail (72px), Navbar with productName="Siesa Agents" | TC-1.2-C-01 | Component | `frontend/src/routes/__tests__/navigation.test.tsx` | RED |
| AC#2 | Click "Clientes" navigates to /clientes, SPA (no full reload), shell persists | TC-1.2-C-02 | Component | `frontend/src/routes/__tests__/navigation.test.tsx` | RED |
| AC#3 | Click "Contactos" navigates to /contactos, SPA (no full reload), shell persists | TC-1.2-C-03 | Component | `frontend/src/routes/__tests__/navigation.test.tsx` | RED |
| AC#4 | Mobile (<1024px): NavigationBar visible, NavigationRail hidden, items accessible (WCAG 2.1 AA) | TC-1.2-C-04 | Component | `frontend/src/routes/__tests__/navigation.test.tsx` | RED |
| AC#5 | Direct URL /clientes: Clientes view renders, NavigationRail shows "Clientes" as active | TC-1.2-C-05, TC-1.2-E-01 | Component + E2E | both files | RED |
| AC#6 | Direct URL /contactos: Contactos view renders, NavigationBar indicates "Contactos" active | TC-1.2-C-06, TC-1.2-E-02 | Component + E2E | both files | RED |
| AC#7 | Root path / redirects to /clientes automatically (no blank screen) | TC-1.2-C-07 | Component | `frontend/src/routes/__tests__/navigation.test.tsx` | RED |
| AC#8 | Unknown route: 404 view displayed, shell (NavigationRail/Bar) remains visible | TC-1.2-C-08 | Component | `frontend/src/routes/__tests__/navigation.test.tsx` | RED |

---

## Test Cases Generated

### Component Tests (Vitest + RTL) — 8 tests

| Test Case | AC | Priority | Given-When-Then |
|-----------|----|----------|-----------------|
| TC-1.2-C-01 | AC#1 | P1 | Given desktop viewport / When app renders / Then NavigationRail + Navbar with productName visible |
| TC-1.2-C-02 | AC#2 | P1 | Given desktop / When user clicks "Clientes" / Then URL is /clientes, shell persists, no reload |
| TC-1.2-C-03 | AC#3 | P1 | Given desktop / When user clicks "Contactos" / Then URL is /contactos, shell persists, no reload |
| TC-1.2-C-04 | AC#4 | P2 | Given mobile viewport 375px / When app renders / Then NavigationBar visible, NavigationRail hidden |
| TC-1.2-C-05 | AC#5 | P1 | Given initial path /clientes / When router initializes / Then ClientesPlaceholder renders, "Clientes" active in nav |
| TC-1.2-C-06 | AC#6 | P1 | Given initial path /contactos / When router initializes / Then ContactosPlaceholder renders, "Contactos" active in nav |
| TC-1.2-C-07 | AC#7 | P2 | Given initial path / / When router initializes / Then redirect to /clientes, Clientes view shows |
| TC-1.2-C-08 | AC#8 | P1 | Given initial path /ruta-inexistente / When router initializes / Then NotFound renders, shell persists |

### E2E Tests (Playwright) — 4 tests

| Test Case | AC | Priority | Given-When-Then |
|-----------|----|----------|-----------------|
| TC-1.2-E-01 | AC#5 | P1 | Given dev server running / When browser opens /clientes directly / Then Clientes view renders, no redirect |
| TC-1.2-E-02 | AC#6 | P1 | Given dev server running / When browser opens /contactos directly / Then Contactos view renders, no redirect |
| TC-1.2-E-03 | AC#2/#3 | P1 | Given app loaded / When user clicks navigation items / Then SPA transition without page reload |
| TC-1.2-E-04 | AC#7 | P2 | Given dev server running / When browser opens / / Then browser location shows /clientes |

---

## Test Files Generated

| File | Level | Tests |
|------|-------|-------|
| `frontend/src/routes/__tests__/navigation.test.tsx` | Component (Vitest + RTL) | 8 |
| `e2e/tests/navigation/navigation-shell.spec.ts` | E2E (Playwright) | 4 |

Total: **12 tests** across Component and E2E levels.

---

## TDD Obligations for Developer

The following must be implemented for tests to go GREEN:

1. `frontend/src/routes/__root.tsx` — render `LayoutBase` from `siesa-ui-kit` with `Navbar` (productName="Siesa Agents") and both `NavigationRail` (desktop) + `NavigationBar` (mobile). Add `data-testid="navigation-rail"`, `data-testid="navigation-bar"`, `data-testid="navbar"` to the respective components.
2. `frontend/src/routes/index.tsx` — redirect to `/clientes` via TanStack Router `redirect`.
3. `frontend/src/routes/_app/clientes.tsx` — renders a component with `data-testid="clientes-view"` and heading "Clientes".
4. `frontend/src/routes/_app/contactos.tsx` — renders a component with `data-testid="contactos-view"` and heading "Contactos".
5. `frontend/src/shared/components/NotFound.tsx` — renders with `data-testid="not-found-view"` and text "Página no encontrada".
6. Navigation items must have `data-testid="nav-item-clientes"` and `data-testid="nav-item-contactos"`.
7. Active nav item must have `aria-current="page"` attribute.
8. Tailwind responsive: NavigationRail has class `hidden lg:flex`, NavigationBar has class `flex lg:hidden`.

---

## Quality Gate

- All 8 component tests must pass before story is marked Done.
- All 4 E2E tests must pass (requires dev server + routing configured).
- No test may be skipped without documented justification.
