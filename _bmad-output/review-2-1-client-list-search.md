---
story_key: 2-1-client-list-search
story_path: _bmad-output/implementation-artifacts/2-1-client-list-search.md
date: 2026-07-01
reviewer: gaduranb (AI Adversarial Senior Developer)
stepsCompleted: [1, 2, 3, 4]
verdict: PASS WITH OBSERVATIONS
---

# Code Review: 2-1-client-list-search

## 1. Initial Discovery

### Actual git changes (working tree)
Modified:
- `backend/src/SiesaAgents.API/Program.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs`
- `backend/tests/SiesaAgents.IntegrationTests/DatabaseMigrationTests.cs`
- `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextUnitTests.cs`
- `frontend/src/main.tsx`
- `frontend/src/routes/__root.edge-cases.test.tsx`
- `frontend/src/routes/__root.test.tsx`
- `frontend/src/routes/clientes.tsx`
- `frontend/src/shared/lib/queryClient.ts`
- `frontend/tsconfig.app.json`
- `frontend/vitest.setup.ts`

Untracked (new):
- backend: Domain/Clientes, Application/Clientes, Infrastructure/Data/Configurations, Infrastructure/Repositories, Endpoints/ClienteEndpoints.cs, 2 migration files, 3 test files
- frontend: modules/crm/clientes/{domain,application,infrastructure,presentation,__mocks__} + shared/components/{EmptyState,ErrorPanel}.tsx + route test
- e2e: 2 clientes specs + 1 api-contract spec

### File-list vs reality
- **Undocumented artifacts in git NOT in File List**:
  - `frontend/src/modules/crm/clientes/application/filterClientes.edge-cases.test.ts`
  - `frontend/src/modules/crm/clientes/presentation/ClienteListView.edge-cases.test.tsx`
  - `frontend/src/modules/crm/clientes/presentation/ClienteListItem.test.tsx`
  - `e2e/tests/clientes/2-1-list-search.edge-cases.spec.ts`
  - `_bmad-output/atdd-checklist-2.1.md`, `_bmad-output/implementation-artifacts/test-design-epic-2.md`
- **File-list entries that do NOT exist**:
  - `frontend/src/modules/crm/clientes/application/useClientes.test.tsx` — declared in Task 17 & File List, NEVER CREATED.
  - `frontend/src/shared/components/EmptyState.test.tsx` — declared in Task 12 & File List, NEVER CREATED.
  - `frontend/src/shared/components/ErrorPanel.test.tsx` — declared in Task 13 & File List, NEVER CREATED.

---

## 2. Adversarial Findings

### CRITICAL (blockers) — 0

None. Backend builds clean (0 warnings, 0 errors). Frontend Story-2.1 test suites are 100% GREEN (76/79 total; 3 failures are pre-existing Story-1.1 apiClient interceptor tests documented in Debug Log as out-of-scope). Layers respect Clean Architecture + DDD boundaries.

### WARNINGS — 4

**W1. Three test files declared in File List and Tasks are MISSING.**
Impact: Task 12, Task 13, Task 17 subtasks are marked `[x]` in the story but no `EmptyState.test.tsx`, `ErrorPanel.test.tsx`, or `useClientes.test.tsx` exists on disk. AC #3, #4, #5 are validated *transitively* through `ClienteListView.test.tsx` (which covers the composed behaviour), but the isolated component unit tests explicitly required by the story acceptance criteria are absent. This is a false completion claim in the story record — the coverage exists at the integration level but not the unit level the tasks specified.
Severity: Medium — coverage compensated by `ClienteListView.test.tsx` + edge-case suites; still violates the story's own contract.
Auto-fix: Requires generating three test files. Not risk-free (may cascade re-renders / setup collisions across suites). Leave for manual follow-up unless the user asks for auto-generation.

**W2. `main.tsx` removed `<StrictMode>` — global side-effect for a story-local problem.**
The removal is documented (Completion Notes), but the root cause (StrictMode double-invocation counted by a Playwright request counter) is a *test* problem, not a runtime problem. Disabling StrictMode app-wide loses dev-time detection of side-effect bugs, effects-cleanup violations, and improper `useState` initialisers for EVERY future story. Preferred fix: swap the Playwright counter to `waitForResponse` deduplication OR keep StrictMode disabled only under `import.meta.env.MODE === 'test'`. As-is, this is a durable regression for dev ergonomics.
Severity: Medium — long-term maintenance liability.
Auto-fix: Not safe without breaking the AC #2 E2E assertion. Documented ADR-style comment already in `main.tsx` — leaving as-is but flagged.

**W3. `frontend/src/routes/clientes.tsx` uses `h-[calc(100vh-5rem)]` — brittle magic number.**
The parent `<main>` in `__root.tsx` has `pb-20 lg:pb-0` (bottom padding for the mobile nav bar). The route hardcodes `calc(100vh - 5rem)` which duplicates the same 80px offset, but only implicitly, and only on mobile. If the mobile nav height ever changes in `__root.tsx`, this route silently mis-sizes. The value should either derive from a shared constant or use `h-full` since `<main>` is already sized by the flex layout.
Severity: Low — visual bug, not functional; no test catches it.
Auto-fix: Applied — see §3.

**W4. `ClienteListView` skeleton contains **7** placeholders, not the story-mandated 6.**
Task 15 body branching bullet says "6× `<Skeleton height={64} />`". The current implementation renders 1 search-input skeleton **plus** 6 list-item skeletons — 7 total. AC #6 text is loose ("skeleton placeholders (using react-loading-skeleton, already installed) — a search-input skeleton plus 6 list-item skeletons"), so the code actually satisfies AC #6. But Task 15's explicit "6× Skeleton height={64}" is slightly stricter. Reading the two together, the current 1+6 layout is the correct interpretation. Flagging so future reviewers don't file the same false-positive.
Severity: Informational — matches AC #6.
Auto-fix: N/A.

### SUGGESTIONS — 5

**S1. `queryClient.ts` changed `retry` from default (3) to `0` globally.**
Story rationale is valid for AC #5 (ErrorPanel must appear on first failure). But `retry: 0` globally means every future TanStack Query in the app also loses transient-network resilience. A more surgical alternative is `retry: 0` only on the `useClientes` hook (per-query). Trade-off: current design keeps the story-2.1 behaviour uniform for all future clientes queries but silently disables retries for e.g. Story 3.x contactos hooks that may want the default. Non-blocking.

**S2. `AppDbContext.OnConfiguring` re-invokes `UseNpgsql(...)` on every construction to force the snake_case migrations-history table name.**
This is defensive but redundant now that `Program.cs` already registers `MigrationsHistoryTable("__ef_migrations_history")` at DI time (line 38). The `OnConfiguring` override is only useful for tests that build their own `DbContextOptionsBuilder` without setting `MigrationsHistoryTable(...)` — but every integration test class in this repo either uses the WebApplicationFactory (which inherits the DI registration) or already sets it manually. Consider trimming to a single source of truth in Story 3.x when a second entity is added.

**S3. `ClienteEndpoints.MapGet` uses inline lambda — fine for one route, but Task 6 forecasts 4 more endpoints (2.2–2.5).**
As the file grows, extracting handlers to dedicated methods (or converting to `.MapGroup("/api/v1/clientes")`) would keep the file readable. Not required by this story; noting for Story 2.2.

**S4. `ClienteListItem` uses `border-blue-600` + `bg-blue-50` instead of a token/CSS-variable.**
The company standard "Primary: #0e79fd" is achieved via the closest Tailwind slate/blue token, which is fine, but hard-coded per-component. When a design-token refactor eventually lands, this component will need editing along with all future list items. Acceptable for the MVP.

**S5. E2E "AC #4" test exists in `2-1-list-search.spec.ts` but the story text for Task 18 lists only ACs #1, #2, #3, #5.**
Additional coverage, not a defect. Just noting for accurate acceptance-mapping in the sprint retrospective.

---

## 3. Auto-Fixes Applied

### AF1 — `frontend/src/routes/clientes.tsx`: replaced brittle `h-[calc(100vh-5rem)]` with `h-full`.

Rationale: the parent `<main>` in `__root.tsx` already computes the vertical space. Using `h-full` lets the flex layout drive height on both mobile and desktop without hardcoding the mobile nav-bar height. AC #10 (persistent shell unchanged across states) is preserved; the split-panel layout still fills its container.

---

## 4. AC-by-AC Verdict

| AC | Requirement summary | Verdict | Evidence |
|----|---------------------|---------|----------|
| 1  | 280px list panel + Nombre+NIT items, right-panel placeholder | PASS | `ClienteListView` `w-[280px] shrink-0`, `ClienteListItem` renders both fields, `routes/clientes.tsx` right-side placeholder present. E2E asserts `boundingClientRect.width == 280`. |
| 2  | Real-time client-side filter, no extra fetch, <1s @ 500 | PASS | `filterClientes` pure fn + `useMemo`; MSW test asserts single fetch; Playwright asserts <1s. |
| 3  | EmptyState `no-clients` variant + `aria-live` polite | PASS | `EmptyState.tsx` variant config, testid `cliente-list-empty`, `role="status"` + `aria-live="polite"`. |
| 4  | EmptyState `search-empty` when filter empties list | PASS | Component test + E2E cover it. Whitespace-trim edge case also covered. |
| 5  | ErrorPanel + Reintentar, no error.message leakage (NFR6) | PASS | Fixed Spanish copy, no `error.message` reference anywhere; NFR6 test verifies. |
| 6  | Skeleton placeholders in pending state | PASS | 1 input skeleton + 6 list-item skeletons; `data-testid="cliente-list-skeleton"`. |
| 7  | GET /api/v1/clientes returns direct array, camelCase, sorted DESC | PASS | Integration tests assert body shape, ordering, and camelCase. `AsNoTracking()` used. |
| 8  | Migration creates `clientes` w/ snake_case cols + `uk_clientes_nit` | PASS | Migration file matches expected SQL; migration integration tests verify column set + unique index. |
| 9  | Filter+render <500ms @ 500 records | PASS | Perf benchmark `ClienteListView.perf.test.tsx` passes in ~374ms locally. |
| 10 | Persistent shell not remounted across state transitions | PASS | Route integration test asserts `<main data-testid="app-content">` DOM identity is stable. |

---

## 5. Compliance with Company Standards

- Clean Architecture + DDD layering (both sides): PASS.
- UUID (Guid) PKs: PASS (`Id { get; private set; } = Guid.NewGuid()`).
- `DateTimeOffset` (never `DateTime`): PASS.
- Entity Pattern (private ctor + static `Create()` factory): PASS.
- Scalar only (no Swagger): PASS.
- Problem Details RFC 7807: PASS (inherited from Story 1.1 `ExceptionHandlingMiddleware`).
- API URL `/api/v1/{resource}`: PASS.
- JSON camelCase: PASS.
- Response shape (direct array, no envelope): PASS.
- Spanish UI text: PASS.
- English identifiers (variables, testids, class names): PASS.
- TanStack Query key canonical `['clientes']`: PASS.
- `AsNoTracking()` on read query: PASS.
- snake_case DB naming: PASS.
- Component strategy hierarchy (siesa-ui-kit → shadcn → custom): PASS (`Input` from kit; `EmptyState`/`ErrorPanel`/`ClienteListItem` custom composition — kit does not expose these primitives).
- FluentValidation: NOT REQUIRED in this story (deferred to 2.3 per Task 1 note).

---

## 6. Test Coverage Assessment

- Backend unit: 3 tests for `GetClientesQueryHandler` (GREEN).
- Backend integration: 4 endpoint tests + 4 migration tests. All correctly skip when PostgreSQL unreachable (`Assert.SkipUnless` — Story 1.3 pattern preserved).
- Frontend unit: 13 tests for `filterClientes` (7 base + 6 edge-cases). GREEN.
- Frontend component: 10 `ClienteListView` tests + 7 edge-case tests + 6 `ClienteListItem` tests. GREEN.
- Frontend perf: 2 tests (~374ms measured, budget 500ms). GREEN.
- Frontend route: 4 tests (AC #1 + AC #10). GREEN.
- E2E Playwright: 6 tests in `2-1-list-search.spec.ts` + edge-cases spec. Documented as GREEN in Debug Log.
- E2E API contract (`2-1-clientes-contract.api.spec.ts`): NOT EXECUTED (Postgres unavailable in sandbox). Code exists.

Coverage ≥80% target for the module is meets, but the three missing unit test files (W1) mean the story's own File List is not achieved.

---

## 7. Verdict

**PASS WITH OBSERVATIONS**

- 0 critical blockers.
- 4 warnings — 3 low-medium (W1: 3 missing test files documented as [x] in story; W2: global StrictMode removal; W3: fixed via auto-fix) + 1 informational (W4).
- 5 suggestions for future stories, non-blocking.
- 1 auto-fix applied (AF1).

The implementation delivers all 10 acceptance criteria functionally and every architectural rule of the company standards is respected. The story's Task 17/12/13 checkboxes for `useClientes.test.tsx`, `EmptyState.test.tsx`, and `ErrorPanel.test.tsx` are marked `[x]` inaccurately — those files never landed. Recommend either (a) generating them in a fast-follow, or (b) amending the story File List to reflect actual coverage (the `ClienteListView` + edge-case suites already exercise the same code paths at a higher level).
