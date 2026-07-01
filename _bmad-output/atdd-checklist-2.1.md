# ATDD Checklist — Epic 2, Story 2.1: Client List & Search

**Date:** 2026-07-01
**Author:** SiesaTeam (TEA)
**Primary Test Level:** Component (Vitest + RTL + MSW), with E2E acceptance (Playwright) + API contract

---

## Story Summary

As a commercial team member, the user needs to see a list of all clientes and search them by Nombre or NIT/RUC, so they can quickly find the client they are looking for. The `/clientes` route renders a split layout: a 280px left panel with the list + search input, and a right-hand detail placeholder (populated in Story 2.2).

---

## Acceptance Criteria (Story 2.1)

1. **AC #1** — 280px list panel, list items expose `data-testid="cliente-list-item-{id}"` with Nombre + NIT.
2. **AC #2** — Real-time client-side search (case-insensitive, diacritic-tolerant) — no re-fetch on typing; <1s @ 500 records.
3. **AC #3** — `EmptyState no-clients` when API returns `[]`.
4. **AC #4** — `EmptyState search-empty` when filter matches nothing.
5. **AC #5** — `ErrorPanel` + "Reintentar" on fetch failure; no raw error text (NFR6).
6. **AC #6** — Skeleton placeholders while pending.
7. **AC #7** — `GET /api/v1/clientes` returns array of `ClienteDto` in camelCase, ordered by `createdAt DESC`.
8. **AC #8** — Migration creates `clientes` table in snake_case with `uk_clientes_nit`.
9. **AC #9** — Filter+render <500ms with 500 records (perf benchmark).
10. **AC #10** — Persistent shell stays mounted across list state transitions.

---

## Failing Tests Created (RED Phase)

### Component tests — Vitest + RTL + MSW (jsdom)

**File:** `frontend/src/modules/crm/clientes/application/filterClientes.test.ts`

7 unit tests for the pure `filterClientes` function (AC #2):

- Empty query returns copy of all clientes
- Whitespace-only query returns all clientes
- Match by `nombre`
- Match by `nit`
- Case-insensitive match
- Diacritic-tolerant match (`pena` → `Peña`)
- No match returns `[]`

**Status:** RED — `filterClientes` module does not exist yet.

---

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx`

10 component tests (ACs #1–#6):

- AC #6 — Skeleton `data-testid="cliente-list-skeleton"` in pending state
- AC #1 — List panel has `w-[280px]` style/class
- AC #1 — Each item exposes `data-testid="cliente-list-item-{id}"` with Nombre + NIT
- AC #2 — Typing filters client-side without extra fetch (spy on MSW request events)
- AC #2 — Search input has correct `placeholder` + `aria-label`
- AC #3 — `no-clients` EmptyState with Spanish copy + `aria-live="polite"`
- AC #4 — `search-empty` EmptyState with Spanish copy + `aria-live="polite"`
- AC #5 — ErrorPanel renders with fixed Spanish copy + Reintentar button
- AC #5 — Clicking Reintentar re-fetches and swaps to list
- AC #5 (NFR6) — ErrorPanel does NOT surface raw error text (stack/status/message)

**Status:** RED — `ClienteListView`, `useClientes`, `EmptyState`, `ErrorPanel`, `ClienteListItem` do not exist yet.

---

**File:** `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx`

2 benchmark tests (AC #9):

- Filter+render round-trip <500ms with 500 records
- 500-record boundary — view renders without crashing (NFR10)

**Status:** RED — module resolution error.

---

**File:** `frontend/src/routes/clientes.route.test.tsx`

4 route integration tests (AC #1, #10):

- Split layout: list panel + right-hand detail placeholder both render
- Shell stability: `<main data-testid="app-content">` DOM ref is preserved across list ↔ search-empty transitions
- Shell stays mounted during empty state
- Shell stays mounted during error state

**Status:** RED — `/clientes` still renders the Story 1.2 placeholder body.

### E2E acceptance — Playwright (chromium)

**File:** `e2e/tests/clientes/2-1-list-search.spec.ts`

6 E2E tests (AC #1, #2, #3, #4, #5):

- AC #1 — 280px panel width via `getBoundingClientRect`, list items with Nombre + NIT
- AC #2 — Real-time filter <1s, single network call, correct placeholder + aria-label
- AC #2 — Diacritic tolerance (`pena` matches `Peña`)
- AC #3 — `no-clients` EmptyState visible with Spanish copy + `aria-live="polite"`
- AC #4 — `search-empty` EmptyState visible with Spanish copy
- AC #5 — ErrorPanel visible; clicking Reintentar re-fetches and renders the list

**Pattern used:** Network-first interception (`page.route(...)` BEFORE `page.goto(...)`).

**Status:** RED — `/clientes` renders a placeholder body without the split layout or search input.

### API contract — Playwright request context

**File:** `e2e/tests/api/2-1-clientes-contract.api.spec.ts`

4 API tests (AC #7):

- 200 OK + `Content-Type: application/json`
- Body is a JSON array (not enveloped)
- Each element has camelCase keys `{ id, nombre, nit, telefono, ciudad, createdAt, updatedAt }` — no snake_case leakage
- When ≥2 rows exist, results are ordered by `createdAt DESC`

**Status:** RED — endpoint does not exist yet (expect 404).

---

## Data Factories & Mocks

**File:** `frontend/src/modules/crm/clientes/__mocks__/msw-handlers.ts`

- `seedClientes` — 3-record deterministic fixture (Acme, Peña, Global Foods).
- `clientesSuccessHandler(body?)` — MSW handler returning 200 + array.
- `clientesEmptyHandler()` — MSW handler returning `[]`.
- `clientesErrorHandler()` — MSW handler returning 500.
- `buildLargeClienteSet(count)` — 500-record deterministic fixture for the perf benchmark.

**Existing E2E factories reused:** `e2e/helpers/data.helper.ts` (`buildCliente`) — not needed for Story 2.1 acceptance tests (they use network mocks).

---

## Required data-testid attributes (contract for DEV)

| testid | Owner component | Purpose |
|---|---|---|
| `cliente-list-panel` | `ClienteListView` | Root of the 280px list panel |
| `cliente-search-input` | `ClienteListView` search input | Search field |
| `cliente-list-skeleton` | `ClienteListView` pending branch | Loading skeleton wrapper |
| `cliente-list-item-{id}` | `ClienteListItem` | One per rendered client |
| `cliente-list-empty` | `EmptyState` no-clients variant | Empty DB state |
| `cliente-search-empty` | `EmptyState` search-empty variant | No search match |
| `cliente-list-error` | `ErrorPanel` | Fetch failure state |
| `cliente-list-retry` | `ErrorPanel` button | Reintentar action |
| `cliente-detail-empty` | Right-panel placeholder | Selection prompt (Story 2.2 replaces) |
| `app-content` | `__root.tsx` (Story 1.2) | Persistent shell content slot |
| `nav-rail-desktop` | `__root.tsx` (Story 1.2) | Desktop navigation rail |

**Spanish copy contracts (locked by tests):**
- Search placeholder: `Buscar por nombre o NIT/RUC`
- Search aria-label: `Buscar clientes`
- No-clients title: `No hay clientes registrados`
- No-clients subtitle: `Crea el primer cliente del sistema`
- Search-empty title: `No se encontró ningún cliente`
- Search-empty subtitle: `Intenta con otro nombre o NIT`
- Error message: `No pudimos cargar la lista de clientes.`
- Detail placeholder: `Selecciona un cliente para ver su detalle`

---

## Implementation Checklist (DEV) — mapped to failing tests

### To turn `filterClientes.test.ts` GREEN

- [ ] Create `frontend/src/modules/crm/clientes/domain/Cliente.ts` (Task 8)
- [ ] Create `frontend/src/modules/crm/clientes/application/filterClientes.ts` with NFD diacritic normalization + case-insensitive substring match (Task 11)

### To turn `ClienteListView.test.tsx` GREEN

- [ ] Create `EmptyState.tsx` in `frontend/src/shared/components/` with `no-clients` + `search-empty` variants + `aria-live="polite"` (Task 12)
- [ ] Create `ErrorPanel.tsx` in `frontend/src/shared/components/` with fixed Spanish copy + `data-testid` prop + Reintentar button (Task 13)
- [ ] Create `ClienteListItem.tsx` with `data-testid="cliente-list-item-{id}"` (Task 14)
- [ ] Create `useClientes.ts` TanStack Query hook with `queryKey: ['clientes']` (Task 10)
- [ ] Create `clienteApiRepository.ts` calling `GET /api/v1/clientes` via `apiClient` (Task 9)
- [ ] Create `ClienteListView.tsx` with the 280px panel, search input (placeholder + aria-label), state branching (pending → error → empty → search-empty → list), and `useMemo` filter (Task 15)

### To turn `ClienteListView.perf.test.tsx` GREEN

- [ ] Ensure `useMemo` memoization on filter (Task 15)
- [ ] Ensure list items are rendered directly (no virtualization required at 500; add later if perf budget slips)

### To turn `clientes.route.test.tsx` GREEN

- [ ] Replace `frontend/src/routes/clientes.tsx` body with the split layout described in Task 16 (list panel + `cliente-detail-empty` placeholder, `Selecciona un cliente para ver su detalle`)

### To turn `2-1-list-search.spec.ts` GREEN

- [ ] All frontend tasks above
- [ ] `.env.development` `VITE_API_URL=http://localhost:5000` present (already from Story 1.1)
- [ ] Frontend dev server runs (Playwright `webServer` config already handles this)

### To turn `2-1-clientes-contract.api.spec.ts` GREEN

- [ ] Backend Tasks 1–6: `ClienteEntity`, `ClienteConfiguration`, migration `AddClientesTable`, `ClienteRepository`, `GetClientesQueryHandler`, `MapClienteEndpoints`
- [ ] Backend running on `http://localhost:5000` (or override via `API_BASE_URL` env var)

---

## Running Tests

```bash
# Frontend unit + component + perf + route tests
pnpm --filter frontend test:unit

# Watch mode
pnpm --filter frontend test:unit:watch

# E2E — all
pnpm exec playwright test --project=chromium

# E2E — only Story 2.1
pnpm exec playwright test e2e/tests/clientes/2-1-list-search.spec.ts --project=chromium

# API contract — only Story 2.1
pnpm exec playwright test e2e/tests/api/2-1-clientes-contract.api.spec.ts --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED (this checklist)
- [x] Tests written and expected to fail
- [x] MSW handlers + deterministic fixtures created
- [x] `data-testid` contract locked
- [x] Spanish copy contracts locked

### GREEN (DEV)
1. Pick one failing test.
2. Implement minimum code to pass it.
3. Re-run only that test file.
4. Repeat.

**Suggested order:**
1. Backend Tasks 1–6 → `2-1-clientes-contract.api.spec.ts` GREEN
2. Frontend Tasks 8–11 → `filterClientes.test.ts` GREEN
3. Frontend Tasks 12–15 → `ClienteListView.test.tsx` GREEN
4. Frontend Task 16 → `clientes.route.test.tsx` GREEN
5. Verify `ClienteListView.perf.test.tsx` GREEN (add `useMemo` if it fails)
6. Run `2-1-list-search.spec.ts` end-to-end → GREEN

### REFACTOR
- Extract shared list-branching helper if reused by contactos in Epic 3.
- Consider virtualization if perf test hits budget with headroom < 100ms.

---

## Test Level Selection Rationale

| AC | Chosen level | Why |
|---|---|---|
| #1 (layout) | Component + E2E | Component asserts DOM/testids fast; E2E asserts real pixel width via `getBoundingClientRect` |
| #2 (search) | Unit (pure fn) + Component (integration with MSW) + E2E (real UX) | Unit locks the algorithm; component locks no-refetch behavior; E2E validates the <1s SLA in a real browser |
| #3 / #4 (empty states) | Component + E2E | Component locks Spanish copy + aria-live; E2E confirms real-page rendering |
| #5 (error + retry) | Component (MSW swap) + E2E (route.fulfill toggle) | Full retry cycle validated in isolation and in the browser |
| #6 (skeleton) | Component | Simple state assertion — no need for E2E |
| #7 (API contract) | API (Playwright request) | Direct HTTP check — fastest feedback on shape/order |
| #8 (migration) | Deferred to backend integration tests (Task 7 in the story) | Postgres-dependent; already scoped by story tasks |
| #9 (perf) | Component benchmark | Deterministic with `performance.now()` — E2E is too noisy |
| #10 (shell stable) | Route integration | Requires the real `RouterProvider` — best expressed at the route layer |

**Duplicate coverage avoided:** E2E only re-tests the highest-value ACs (#1 pixel width, #2 real SLA, #5 real retry). All other component-level assertions are not repeated in E2E.

---

## Notes

- Tests use only `data-testid` selectors (per architecture standard `selector-resilience.md`) — no CSS, no text-brittle fallbacks.
- Network-first pattern applied on all E2E tests (`page.route(...)` BEFORE `page.goto(...)`).
- No hard waits (`page.waitForTimeout`) — only `expect(...).toBeVisible()`, `toBeHidden()`, and `waitFor(...)`.
- MSW server uses `onUnhandledRequest: 'error'` to catch silent regressions where the frontend hits an unmocked endpoint.
- The Spanish copy strings in the tests are exact (locked) — DEV must match them character-for-character.

---

## Test Files Created (RED — Final Summary)

| Path | Level | Tests |
|---|---|---|
| `frontend/src/modules/crm/clientes/__mocks__/msw-handlers.ts` | Fixture | (support) |
| `frontend/src/modules/crm/clientes/application/filterClientes.test.ts` | Unit | 7 |
| `frontend/src/modules/crm/clientes/presentation/ClienteListView.test.tsx` | Component | 10 |
| `frontend/src/modules/crm/clientes/presentation/ClienteListView.perf.test.tsx` | Component (perf) | 2 |
| `frontend/src/routes/clientes.route.test.tsx` | Route integration | 4 |
| `e2e/tests/clientes/2-1-list-search.spec.ts` | E2E | 6 |
| `e2e/tests/api/2-1-clientes-contract.api.spec.ts` | API | 4 |
| **Total** | | **33 tests** |

**Generated by BMad TEA Agent — 2026-07-01**
