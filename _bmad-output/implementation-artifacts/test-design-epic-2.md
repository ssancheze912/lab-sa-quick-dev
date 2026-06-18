---
epic: 2
title: "Client Management"
mode: epic-level
phase: 4
createdAt: "2026-06-18"
stories:
  - "2.1 — Client List & Search"
  - "2.2 — Client Detail View"
  - "2.3 — Create Client"
  - "2.4 — Edit Client"
  - "2.5 — Delete Client"
  - "2.6 — Sort Client List"
status: complete
---

# Test Design — Epic 2: Client Management

## 1. Epic Overview & Test Scope

### Epic Summary

Epic 2 implements the complete client CRUD lifecycle: listing, searching, viewing details, creating, editing, deleting, and sorting client records. The feature operates as a split-panel SPA view at `/clientes` with a 280px scrollable left panel and a flex right panel. All state changes must be immediately reflected via TanStack Query cache invalidation (FR27 / NFR2). Search is client-side in-memory (NFR1). A `SortControl` component manages four sort options without triggering additional API calls.

### Stories in Scope

| Story | Title | Key Concerns |
|-------|-------|-------------|
| 2.1 | Client List & Search | TanStack Query fetch, client-side filter, EmptyState, ErrorPanel with retry |
| 2.2 | Client Detail View | Deep-link routing, right panel population, 404 for unknown IDs |
| 2.3 | Create Client | Form validation (Zod + FluentValidation), NIT duplicate 409, immediate list update, toast |
| 2.4 | Edit Client | Pre-filled form, save/cancel behavior, optimistic invalidation, inline error on clear |
| 2.5 | Delete Client | Confirmation dialog, orphaned contacts become unassigned (ON DELETE SET NULL), toast |
| 2.6 | Sort Client List | Four sort orders client-side, combined with active search filter, default "Más reciente" |

### Out of Scope for This Epic

- Contact management (Epic 3) and Client–Contact association (Epic 4)
- Authentication / authorization — explicitly deferred (MVP)
- Server-side pagination — MVP uses client-side filtering over ≤ 500 records
- HTTPS configuration — non-local deployments only (NFR4)

---

## 2. Risk Assessment

### Risk Matrix

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation Strategy |
|---------|----------|-------------|-------------|--------|-------|---------------------|
| R-201 | DATA | **NIT/RUC duplicate** not validated on backend; two clients with same NIT are persisted | 2 (Possible) | 3 (Critical) | **6** | API test: POST duplicate NIT → 409 with `"El NIT/RUC ya está registrado"`, no stack trace in body |
| R-202 | BUS | **Optimistic invalidation missing**: after create/edit/delete, `queryClient.invalidateQueries(['clientes'])` not called — list stale until page reload | 3 (Likely) | 3 (Critical) | **9** | E2E test: perform mutation, assert updated list visible within 2s (NFR2) without page reload |
| R-203 | BUS | **Delete with associated contacts**: `ON DELETE SET NULL` not configured on `contactos.cliente_id` FK — contacts deleted or FK error raised instead of being orphaned | 2 (Possible) | 3 (Critical) | **6** | API integration test: create client with contacts, delete client, assert contacts persist with `clienteId: null` |
| R-204 | SEC | **Input injection**: NIT/RUC or Nombre field accepts SQL/script injection characters without backend sanitization (FluentValidation not wired) | 2 (Possible) | 3 (Critical) | **6** | API test: submit `<script>alert(1)</script>` in Nombre, assert 400 / stored as plain text, not executed |
| R-205 | PERF | **Search latency >1s** with 500 records when client-side filter runs on each keystroke without debounce | 2 (Possible) | 2 (Degraded) | **4** | Component test with 500-item fixture: measure useMemo re-render time < 50ms; NFR1 budget is 1s total |
| R-206 | BUS | **Required field bypass**: frontend Zod validation skipped (e.g., programmatic submit) — blank Nombre/NIT reaches backend | 1 (Unlikely) | 2 (Degraded) | **2** | Unit test: Zod `clienteSchema` rejects empty fields; API test: POST with missing fields → FluentValidation 400 |
| R-207 | TECH | **TanStack Router deep link** `/clientes/:clienteId` on direct access fails — router not configured for dynamic segments | 2 (Possible) | 2 (Degraded) | **4** | E2E/Component test: navigate directly to `/clientes/{known-uuid}`, assert ClienteDetailView renders with correct data |
| R-208 | BUS | **Sort persisting across search clear**: changing sort order clears active search filter unexpectedly | 2 (Possible) | 2 (Degraded) | **4** | Component test: apply search + sort, assert search input still populated after sort change |
| R-209 | BUS | **ErrorPanel not shown** when `GET /api/v1/clientes` fails — unhandled promise rejection shows blank screen | 2 (Possible) | 2 (Degraded) | **4** | Component test with MSW: simulate network error, assert `<ErrorPanel>` with "Reintentar" button renders |
| R-210 | OPS | **Toast messages** in English or missing — violates Spanish-only UI corporate standard | 1 (Unlikely) | 1 (Minor) | **1** | Component/E2E test: assert toast text matches Spanish strings exactly |

### High-Priority Risks (Score ≥ 6) — Require Immediate Mitigation

| Risk ID | Score | Area | Key Mitigation |
|---------|-------|------|----------------|
| R-202 | **9** | BUS | Verify `invalidateQueries(['clientes'])` in every mutation onSuccess |
| R-201 | **6** | DATA | Verify `uk_clientes_nit` unique index + 409 response format |
| R-203 | **6** | DATA | Verify EF Core `ON DELETE SET NULL` on `contactos.cliente_id` FK |
| R-204 | **6** | SEC | Verify FluentValidation rules reject/sanitize injection payloads |

### Top 3 Risk Areas for Epic 2

1. **TanStack Query cache invalidation** (R-202, score 9) — if `invalidateQueries` is missing from any mutation's `onSuccess`, the UI shows stale data until manual reload, directly violating FR27 and NFR2. This is the single highest-impact risk.
2. **Data integrity on delete with contacts** (R-203, score 6) — the `ON DELETE SET NULL` cascade must be correctly applied in EF Core `ContactoConfiguration.cs`; a missing FK config could either silently delete contacts or throw a database constraint error blocking client deletion.
3. **NIT uniqueness enforcement** (R-201, score 6) — the unique index `uk_clientes_nit` must exist in the database AND the 409 response must surface a user-friendly Spanish message (AC-E2.3 / NFR6), not a raw PostgreSQL exception.

---

## 3. Testing Strategy by Level

### Level Distribution

```
Epic 2 Test Pyramid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  E2E (Playwright)              ▌▌▌▌▌▌▌▌▌         6 tests
  API Integration (xUnit)       ▌▌▌▌▌▌▌▌▌▌▌▌▌▌   14 tests
  Component (Vitest + RTL)      ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌ 18 tests
  Unit (Vitest / xUnit)         ▌▌▌▌▌▌▌▌▌▌        10 tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total                                              48 tests
```

### Rationale

- **Component tests are the primary layer** — the epic is UI-heavy with rich client-side behavior (search, sort, form validation, empty/error states) that is best exercised via Vitest + RTL + MSW without a full browser.
- **API integration tests** cover server-side business logic (FluentValidation, uniqueness, ON DELETE SET NULL cascade) that cannot be validated from the frontend alone.
- **E2E tests** (Playwright) cover only the critical user journeys that cross the full stack: creating a client and seeing it in the list, and verifying real-time list refresh — these validate FR27 end-to-end and NFR2 timing.
- **Unit tests** cover pure logic: Zod schema validation, sort comparators, and xUnit command handler tests.

### Test Level Mapping by Story

| Story | E2E | API | Component | Unit |
|-------|-----|-----|-----------|------|
| 2.1 — List & Search | 1 | 2 | 4 | 1 |
| 2.2 — Detail View | 1 | 2 | 2 | 0 |
| 2.3 — Create Client | 2 | 4 | 4 | 3 |
| 2.4 — Edit Client | 1 | 3 | 4 | 2 |
| 2.5 — Delete Client | 1 | 3 | 4 | 2 |
| 2.6 — Sort Client List | 0 | 0 | 4 | 2 |
| **Total** | **6** | **14** | **22** | **10** |

> Note: component count revised to 22 after detailed breakdown; total 52 tests.

---

## 4. Test Coverage Matrix

### Story 2.1 — Client List & Search

| AC / Requirement | Test Scenario | Level | Priority | Risk Link | Owner |
|-----------------|---------------|-------|----------|-----------|-------|
| AC-E2.1 / FR1-FR2: Clients load and appear in list | GET /api/v1/clientes returns array of clients; ClienteListView renders all items | API + Component | P0 | R-202 | QA |
| AC-E2.2 / NFR1: Search results under 1s with 500 records | Client-side useMemo filter with 500-item fixture completes render < 50ms | Component | P0 | R-205 | QA |
| Empty state when no clients | ClienteListView renders EmptyState component when query returns [] | Component | P1 | — | QA |
| ErrorPanel on backend failure | Simulate GET 500; assert ErrorPanel with "Reintentar" button; retry triggers refetch | Component (MSW) | P1 | R-209 | QA |
| Real-time filter: name + NIT | Type in search field; assert only matching items remain visible | Component | P1 | — | QA |
| List loads on /clientes navigation | E2E: navigate to /clientes, assert at least one client row visible | E2E | P0 | R-202 | QA |
| FR2 — list scrollable | API returns 500 records; list panel renders all without overflow error | API | P2 | — | QA |

### Story 2.2 — Client Detail View

| AC / Requirement | Test Scenario | Level | Priority | Risk Link | Owner |
|-----------------|---------------|-------|----------|-----------|-------|
| AC-E2.3 / FR3-FR5: Detail panel shows all fields | Click client in list; assert Nombre, NIT, Teléfono, Ciudad visible in right panel | Component | P0 | — | QA |
| FR30: URL updates to /clientes/:clienteId | After click, assert `window.location.pathname` = `/clientes/{uuid}` | E2E | P1 | R-207 | QA |
| FR30: Direct URL deep link loads correct client | Navigate directly to `/clientes/{uuid}`; assert correct data without redirect | API + Component | P1 | R-207 | QA |
| 404 for unknown clienteId | Navigate to `/clientes/nonexistent-id`; assert not-found message | Component | P2 | — | QA |
| GET /api/v1/clientes/:id — happy path | xUnit: GET returns 200 with correct ClienteDto fields | API | P0 | — | QA |
| GET /api/v1/clientes/:id — unknown id | xUnit: GET returns 404 Problem Details | API | P1 | — | QA |

### Story 2.3 — Create Client

| AC / Requirement | Test Scenario | Level | Priority | Risk Link | Owner |
|-----------------|---------------|-------|----------|-----------|-------|
| AC-E2.1 / FR1: Form opens on "Nuevo cliente" click | Click "Nuevo cliente"; assert form renders with Nombre, NIT, Teléfono, Ciudad fields | Component | P0 | — | QA |
| AC-E2.1 / FR1: All fields required (Zod) | Zod clienteSchema: submit with each field empty; assert 4 error messages | Unit | P0 | R-206 | QA |
| AC-E2.4 / FR8: Inline validation errors visible | Fill form partially, blur; assert inline error on empty field (RTL) | Component | P0 | R-206 | QA |
| AC-E2.1: Successful create → list updated immediately | Submit valid form; MSW returns 201; assert new client appears in list (invalidateQueries) | Component | P0 | R-202 | QA |
| AC-E2.1: Toast "Cliente creado correctamente" | After successful create; assert toast text | Component | P1 | R-210 | QA |
| POST /api/v1/clientes — happy path | xUnit: valid payload → 201 Created with ClienteDto | API | P0 | — | QA |
| POST — FluentValidation: missing Nombre | xUnit: body with Nombre="" → 400 Problem Details with errors.Nombre | API | P0 | R-206 | QA |
| POST — FluentValidation: missing NIT | xUnit: body with Nit="" → 400 Problem Details | API | P0 | R-206 | QA |
| AC-E2.3 / NFR6: Duplicate NIT → user-friendly error | xUnit: POST duplicate NIT → 409, body.detail = "El NIT/RUC ya está registrado" | API | P0 | R-201 | QA |
| NFR6: No stack trace in 409 body | Assert 409 response body has no "stackTrace" or "exception" key | API | P0 | R-204 | QA |
| E2E: Full create flow and list refresh | Playwright: fill form, submit, assert new client name visible in left panel < 2s | E2E | P0 | R-202 | QA |
| E2E: Validation prevents submit without required fields | Playwright: click submit with empty form; assert error messages visible, no API call | E2E | P1 | R-206 | QA |
| Unit: clienteSchema rejects injection payload | Zod: Nombre = `<script>alert(1)</script>` — schema should accept (sanitization at API); API test asserts stored as plain text | Unit | P1 | R-204 | QA |

### Story 2.4 — Edit Client

| AC / Requirement | Test Scenario | Level | Priority | Risk Link | Owner |
|-----------------|---------------|-------|----------|-----------|-------|
| FR6 / AC-E2.3: Form opens pre-filled | Click "Editar"; assert all form fields pre-populated with current values | Component | P0 | — | QA |
| AC-E2.3: Save changes → list + detail updated immediately | Submit edited form; MSW returns 200; assert updated values in panel (invalidateQueries) | Component | P0 | R-202 | QA |
| AC-E2.3: Toast "Cliente actualizado correctamente" | After successful update; assert toast text | Component | P1 | R-210 | QA |
| AC-E2.4 / FR8: Clear required field → inline error | Clear Nombre, submit; assert inline error, no API call | Component | P0 | R-206 | QA |
| Cancel without saving: original data unchanged | Click "Cancelar"; assert client detail still shows original values | Component | P1 | — | QA |
| PUT /api/v1/clientes/:id — happy path | xUnit: valid payload → 200 OK with updated ClienteDto | API | P0 | — | QA |
| PUT — FluentValidation: clear required field | xUnit: Nombre="" → 400 Problem Details | API | P0 | R-206 | QA |
| PUT — unknown id | xUnit: PUT on nonexistent UUID → 404 Problem Details | API | P1 | — | QA |
| E2E: Edit name and verify in list | Playwright: edit Nombre, save, assert updated name visible in left panel | E2E | P1 | R-202 | QA |

### Story 2.5 — Delete Client

| AC / Requirement | Test Scenario | Level | Priority | Risk Link | Owner |
|-----------------|---------------|-------|----------|-----------|-------|
| AC-E2.5: Confirmation dialog appears on "Eliminar" click | Click "Eliminar"; assert dialog with "¿Eliminar este cliente?" and two buttons | Component | P0 | — | QA |
| AC-E2.5: Confirm deletion → client removed from list | Confirm dialog; MSW returns 204; assert client no longer in list | Component | P0 | R-202 | QA |
| AC-E2.5: Right panel returns to default state | After deletion; assert right panel shows empty/default state | Component | P1 | — | QA |
| AC-E2.5: Toast "Cliente eliminado correctamente" (no contacts) | Delete client with no contacts; assert standard toast | Component | P1 | R-210 | QA |
| AC-E2.5: Toast with orphaned contacts message | Delete client that has contacts; assert toast "Cliente eliminado. Sus contactos asociados quedaron sin cliente asignado." | Component | P1 | R-203 | QA |
| Cancel dialog: client remains | Click "Cancelar" in dialog; assert client still in list | Component | P1 | — | QA |
| DELETE /api/v1/clientes/:id — happy path | xUnit: DELETE → 204 No Content | API | P0 | — | QA |
| DELETE — unknown id | xUnit: DELETE nonexistent UUID → 404 Problem Details | API | P1 | — | QA |
| DELETE — contacts become orphaned (ON DELETE SET NULL) | xUnit: create client + contacts, delete client, GET /api/v1/contactos → contacts exist with clienteId: null | API | P0 | R-203 | QA |
| E2E: Delete flow and list update | Playwright: delete a client, confirm dialog, assert client absent from list < 2s | E2E | P1 | R-202 | QA |
| Unit: clienteId null after orphan | xUnit unit: ContactoEntity has nullable ClienteId; setting to null is valid | Unit | P1 | R-203 | QA |

### Story 2.6 — Sort Client List

| AC / Requirement | Test Scenario | Level | Priority | Risk Link | Owner |
|-----------------|---------------|-------|----------|-----------|-------|
| AC-E2.6: Nombre A→Z sort (client-side, no API call) | Select "Nombre A→Z"; assert list alphabetically ascending, MSW not called again | Component | P1 | — | QA |
| AC-E2.6: Nombre Z→A sort | Select "Nombre Z→A"; assert list alphabetically descending | Component | P1 | — | QA |
| AC-E2.6: Más reciente sort | Select "Más reciente"; assert first item has most recent createdAt | Component | P1 | — | QA |
| AC-E2.6: Más antiguo sort | Select "Más antiguo"; assert first item has oldest createdAt | Component | P1 | — | QA |
| AC-E2.6: Sort preserves active search filter | Apply search "ACME", then sort Z→A; assert search input still "ACME" and filtered+sorted | Component | P1 | R-208 | QA |
| Default sort is "Más reciente" on load | Initial render with no preference; assert SortControl shows "Más reciente" selected | Component | P2 | — | QA |
| Unit: sortClientes comparator — nombre-asc | Pure function test: sort by nombre-asc produces correct order | Unit | P2 | — | QA |
| Unit: sortClientes comparator — fecha-desc | Pure function test: sort by fecha-desc places newer item first | Unit | P2 | — | QA |

---

## 5. Execution Order

### Smoke Tests (< 5 min) — Run on Every Commit

1. `GET /api/v1/clientes` returns HTTP 200 with JSON array
2. `POST /api/v1/clientes` with valid payload returns 201 with created object
3. ClienteListView renders without crashing (Component smoke)
4. TypeScript strict compilation passes: `npx tsc --noEmit` exits 0

### P0 Tests (< 10 min) — Run on Every Commit

5. GET /api/v1/clientes/:id happy path → 200
6. POST — missing Nombre → 400 FluentValidation
7. POST — missing NIT → 400 FluentValidation
8. POST — duplicate NIT → 409 with Spanish message, no stack trace
9. DELETE → 204 + contacts orphaned (clienteId: null)
10. ClienteListView: renders all clients from API
11. ClienteListView: client-side search filter (500 items < 50ms)
12. ClienteListView: MSW 500 error → ErrorPanel + "Reintentar"
13. ClienteForm: Zod schema rejects all empty required fields
14. ClienteForm: submit valid → list updates immediately (invalidateQueries)
15. ClienteDetailView: renders Nombre, NIT, Teléfono, Ciudad
16. ClienteDetailView (edit): form pre-filled with current values
17. ClienteDetailView (edit): clear required field → inline error, no submit
18. DeleteDialog: confirm → client removed from list (MSW 204)
19. **E2E P0**: Full create client flow → new client in list < 2s
20. **E2E P0**: List loads at /clientes

### P1 Tests (< 30 min) — Run on PR to Main

21. PUT /api/v1/clientes/:id happy path → 200 updated object
22. PUT — Nombre="" → 400
23. PUT — unknown id → 404
24. GET — unknown id → 404
25. DELETE — unknown id → 404
26. ClienteListView: EmptyState when list is empty
27. ClienteDetailView: 404 graceful message for unknown clienteId
28. ClienteForm (create): toast "Cliente creado correctamente"
29. ClienteForm (edit): toast "Cliente actualizado correctamente"
30. ClienteForm (edit): cancel → original data unchanged
31. DeleteDialog: cancel → client remains in list
32. DeleteDialog: toast standard (no contacts)
33. DeleteDialog: toast with orphan message (has contacts)
34. DeleteDialog: right panel returns to default after deletion
35. SortControl: Nombre A→Z (no extra API call)
36. SortControl: Nombre Z→A
37. SortControl: Más reciente
38. SortControl: Más antiguo
39. SortControl: sort + search filter preserved
40. **E2E P1**: Edit client name → updated in left panel
41. **E2E P1**: Delete client → absent from list
42. **E2E P1**: FR30 deep link to /clientes/:id renders correct client
43. **E2E P1**: URL updates to /clientes/:clienteId after click

### P2/P3 Tests (< 60 min) — Run Nightly

44. GET /api/v1/clientes returns 500 records without timeout
45. ClienteDetailView: not-found message for unknown id
46. SortControl: default "Más reciente" on initial render (no preference set)
47. Unit: sortClientes nombre-asc comparator
48. Unit: sortClientes fecha-desc comparator
49. Unit: contactoEntity nullable clienteId valid
50. Injection payload stored as plain text (not executed)
51. E2E: Validation prevents submit with empty form (no API call fired)
52. E2E: "Reintentar" button in ErrorPanel triggers list reload

---

## 6. Test Data & Tooling Prerequisites

### Test Data Requirements

| Fixture | Description | Used By |
|---------|-------------|---------|
| `clienteFactory()` | Creates a valid `ClienteDto` with randomized UUID, nombre, nit, telefono, ciudad | All component + API tests |
| `clienteListFactory(n)` | Array of n clienteFactory() — used for search/sort tests with n=500 for performance | Component: 2.1, 2.6 |
| `clienteConContactosFactory()` | Client with 2+ associated contacts (clienteId set) | API test: R-203 (delete cascade) |
| `createClienteRequest` | Valid `CreateClienteRequest` payload (Nombre, Nit, Telefono, Ciudad) | API tests: 2.3 |
| `emptyList` | `[]` | Component: EmptyState test |
| MSW handler: `GET /api/v1/clientes → 500` | Simulates backend failure | Component: ErrorPanel test |
| MSW handler: `POST /api/v1/clientes → 409` | Simulates NIT duplicate | Component: 2.3 duplicate test |

### Environment Setup

| Requirement | Detail |
|------------|--------|
| Vitest + RTL + MSW | Already configured in Epic 1 (`vite.config.ts` with `test:` block) |
| xUnit + test DB | PostgreSQL test DB (`siesa_agents_test_db`) with EF Core migrations applied |
| Playwright | Browser-based E2E, Chrome headless; app running at `localhost:5173` + `localhost:5000` |
| `uk_clientes_nit` index | Must exist in migrations before API tests for uniqueness constraint |
| `ON DELETE SET NULL` FK | `ContactoConfiguration.cs` must configure cascade before delete tests |

### Tooling Chain

```
Frontend Unit/Component:    Vitest + @testing-library/react + MSW + @testing-library/jest-dom
Frontend E2E:               Playwright (Chrome headless)
Backend Unit:               xUnit + FluentAssertions
Backend Integration:        xUnit + WebApplicationFactory + EF Core InMemory or test PostgreSQL
Code coverage:              Vitest --coverage (c8/v8) + dotnet test --collect:"XPlat Code Coverage"
```

---

## 7. Resource Estimates

| Priority | Scenarios | Avg Hours | Subtotal |
|----------|-----------|-----------|---------|
| P0 | 20 tests | 2.5 h | 50 h |
| P1 | 22 tests | 1.5 h | 33 h |
| P2/P3 | 10 tests | 0.75 h | 7.5 h |
| **Total** | **52 tests** | | **~90.5 h (~12 days)** |

> Estimate includes test authoring, fixture setup, and first-pass CI integration. Excludes framework setup (covered in Epic 1).

---

## 8. Quality Gate Criteria

```
Epic 2 — Quality Gate (must pass before Epic 3 starts)
─────────────────────────────────────────────────────────
✅ P0 test pass rate:              100% (zero failing P0s)
✅ P1 test pass rate:              ≥ 95%
✅ High-risk mitigations complete: R-201, R-202, R-203, R-204 all GREEN
✅ Critical path coverage:         ≥ 80% branch coverage on cliente hooks + ClienteForm
✅ NFR1 (search < 1s):             Component test with 500 items measures < 50ms render
✅ NFR2 (CRUD < 2s):               E2E P0 mutation test asserts list update within 2s
✅ NFR6 (no stack traces):         All error response tests assert no stackTrace key in body
✅ Spanish-only UI:                 All toast / error string assertions use Spanish text
✅ No flaky tests:                  All tests deterministic; no arbitrary sleeps; MSW for isolation
```

---

## 9. Validation Checklist

- [x] Risk assessment complete with all 6 categories evaluated
- [x] All risks scored (probability × impact)
- [x] High-priority risks (≥ 6) flagged: R-201 (6), R-202 (9), R-203 (6), R-204 (6)
- [x] Coverage matrix maps all 6 ACs (AC-E2.1 through AC-E2.6) to test scenarios
- [x] Priority levels assigned (P0–P3) for all 52 test scenarios
- [x] Execution order defined (Smoke → P0 → P1 → P2/P3)
- [x] Resource estimates provided (~90.5 hours)
- [x] Quality gate criteria defined
- [x] Output file created and formatted correctly

---

## Output Summary

**Epic**: 2 — Client Management
**Scope**: full (all 6 stories, all AC, all risk categories)

**Risk Assessment**:

- Total risks identified: 10
- High-priority risks (≥ 6): 4 (R-201, R-202, R-203, R-204)
- Categories covered: BUS (3), DATA (2), SEC (1), TECH (1), PERF (1), OPS (1), BUS-minor (1)

**Coverage Plan**:

- P0 scenarios: 20 (50 hours)
- P1 scenarios: 22 (33 hours)
- P2/P3 scenarios: 10 (7.5 hours)
- **Total effort**: ~90.5 hours (~12 days)

**Test Levels**:

- E2E (Playwright): 6
- API Integration (xUnit): 14
- Component (Vitest + RTL): 22
- Unit (Vitest / xUnit): 10

**Quality Gate Criteria**:

- P0 pass rate: 100%
- P1 pass rate: ≥ 95%
- High-risk mitigations: 100% (R-201, R-202, R-203, R-204)
- Coverage: ≥ 80% on critical paths

**Output File**: `_bmad-output/implementation-artifacts/test-design-epic-2.md`

**Next Steps**:

1. Review risk mitigations R-202 and R-203 with the dev team before Story 2.3 implementation
2. Confirm `uk_clientes_nit` migration index and `ON DELETE SET NULL` FK are in the Epic 1 / Story 1.3 baseline migration or added as a migration in Story 2.3
3. Run `*atdd` workflow to generate failing Playwright + Vitest tests for P0 scenarios before coding begins
4. Set up `clienteFactory()` and `clienteListFactory(500)` fixtures before any component test authoring
5. Allocate test DB (`siesa_agents_test_db`) with applied migrations for xUnit integration tests
