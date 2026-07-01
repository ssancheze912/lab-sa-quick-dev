---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: '_bmad-output/implementation-artifacts/2-2-client-detail-view.md'
story_key: '2-2-client-detail-view'
---

# Code Review: 2-2-client-detail-view

- **Date**: 2026-07-01
- **Reviewer**: SiesaTeam (AI Agent — Adversarial Senior Developer)
- **Status**: Complete

## Initial Discovery

- **Git state**: clean working tree, all Story 2.2 work already committed (commits `29a44c0`..`814f673`, 5 commits: ATDD red, implementation, ATDD correction, automate expansion, test-review report).
- **Undocumented Changes vs Story File List**: `git diff 29a44c0~1..814f673 --name-only` (29 files) does **not** match the story's File List exactly. The following real, substantive changes are missing from the "File List" section of the story:
  - `e2e/pages/clientes.page.ts` — extended with detail-panel locators (`detailPanel`, `detailEmptyState`, `detailNotFound`, `detailLoading`) and a new `gotoDetail()` method. Not mentioned anywhere in the story.
  - `frontend/src/modules/crm/clientes/presentation/components/ClienteDetailView.edge-cases.test.tsx` — new file (testarch-automate expansion, 13 tests), not in File List.
  - `backend/tests/SiesaAgents.IntegrationTests/Endpoints/ClienteEndpointsTests.cs` and `.../Repositories/ClienteRepositoryTests.cs` — both modified with new Story 2.2 cases.
  - `e2e/tests/clientes/client-detail-view.spec.ts` — new file, required by Task 5, absent from File List.
  - The story's "File List" section only enumerates production app code (backend Application/Domain/Infrastructure/API + frontend hooks/components/routes) plus two ATDD-correction support files — it omits every test file across both stacks and the E2E page object. This is a MEDIUM documentation-completeness finding (see below), not a functional gap — all files exist and were reviewed.
- **Missing Files**: None — everything referenced in Tasks/Completion Notes exists on disk.
- **Project context file**: no `project-context.md` found in repo; review relies on `.claude/agent-memory/sa-quick-dev/company-standards.md` (loaded) and the architecture doc references cited in the story's Dev Notes.

## Review Plan

### Items to Verify
- [x] AC1: click on client item → right panel shows Nombre/NIT/Teléfono/Ciudad + URL updates to `/clientes/:clienteId`
- [x] AC2: direct navigation to `/clientes/:clienteId` (no prior in-app nav) loads correct client
- [x] AC3: non-existent `clienteId` → graceful not-found, no blank page/console error
- [x] AC4: no client selected → empty/default state
- [x] Task 1: backend `GetClienteById` query/endpoint, 404 Problem Details, existing list endpoint untouched
- [x] Task 2: frontend `useCliente(id)` hook + repository `getById`
- [x] Task 3: `ClienteDetailView` states (loading/not-found/success/empty)
- [x] Task 4: routing `clientes.$clienteId.tsx` + wiring `ClientListItem.onClick`
- [x] Task 5: backend unit/integration tests, frontend component/routing tests, E2E, MSW handlers

### Focus Areas
- Security/input validation: `ClienteEndpoints.cs`, `GetClienteByIdQueryHandler.cs` (no injection surface — Guid-typed route param, EF parameterized query)
- Architecture/DDD compliance: layering across `Domain`/`Application`/`Infrastructure`/`API`, frontend `domain/application/infrastructure/presentation`
- Company standards: UUID PK, `DateTimeOffset`, CQRS, Scalar (no Swagger), Problem Details RFC 7807, snake_case DB (no migration expected), TanStack Query key convention, Spanish UI text
- Test coverage: `ClienteRepositoryTests`, `ClienteEndpointsTests` (backend), `ClienteDetailView.test.tsx` + edge cases, routing test, E2E spec

## Findings

### Backend

1. **CQRS / Minimal API / DDD — compliant.** `GetClienteByIdQuery` (record) + `GetClienteByIdQueryHandler` mirror the Story 2.1 pattern exactly; `IClienteRepository.GetByIdAsync` returns `null` (no exception) on miss, `ClienteRepository.GetByIdAsync` uses parameterized `FirstOrDefaultAsync` (no injection risk). Endpoint `GET /api/v1/clientes/{id:guid}` is additive only — the existing list endpoint is untouched, matching the story's explicit constraint.
2. **404 → RFC 7807 — compliant.** `Results.NotFound()` is shaped into Problem Details by the pre-existing `app.UseStatusCodePages(...)` middleware from Story 2.1 (`Program.cs:42-50`); verified by `GetClienteById_WithNonExistentId_ReturnsProblemDetailsWithoutStackTrace`, which asserts `"status"` present and no `StackTrace`/`System.Exception` leakage.
3. **UUID PK / DateTimeOffset — compliant.** `ClienteEntity.Id` is `Guid`, `CreatedAt`/`UpdatedAt` are `DateTimeOffset` (no `DateTime` usage). No new migration was added for this story (correct — no new column), confirmed via `Migrations/` listing (last migration `AddClienteEntity`, predating this story's work).
4. **Scalar, not Swagger — compliant.** `Program.cs` uses `app.MapOpenApi()` + `app.MapScalarApiReference()`; no `UseSwagger()` anywhere.
5. **Minor — route-constraint edge case is well-covered but reveals a latent gap outside this story's scope.** `GetClienteById_WithMalformedGuidRouteSegment_ReturnsBadRequestNot500` only asserts "not 500" rather than a specific 400/404, because ASP.NET's `{id:guid}` constraint causes a route-miss (404) rather than a validation error. Acceptable given the story's scope (read-only `GetById`), not a defect — flagged as a suggestion only, since a dedicated `400` via FluentValidation would be over-engineering for a single-parameter route-constrained query endpoint.

### Frontend

6. **Routing restructure was necessary and is correctly justified.** The dev notes document why `_app/clientes.tsx` was changed from a leaf route rendering both panels to a parent route with `<Outlet/>` plus sibling leaf routes `clientes.index.tsx` (empty state) and `clientes.$clienteId.tsx` (detail state). This is the standard TanStack Router pattern for this exact "list + swappable detail panel" layout and matches the company's file-based routing convention (`$` prefix for dynamic param). Verified working via the full test suite and E2E deep-link test.
7. **[HIGH] Selection state via a hand-rolled pathname regex instead of a route-typed param accessor is a real latent regression risk, not just cosmetic debt.** `ClienteListView.tsx:18` derives the "currently selected" id via `pathname.match(/^\/clientes\/(.+)$/)?.[1]` rather than `Route.useParams()`. This regex matches **any** literal segment under `/clientes/`, not specifically the `$clienteId` dynamic route. The moment a sibling route is added under `/clientes/` with a static segment (e.g. Story 2.3 adding a `/clientes/nuevo` creation route, which this same pipeline run is about to implement next) this regex will silently capture `"nuevo"` as if it were a `clienteId` and mark a `ClientListItem` as falsely `selected` — with no compile-time signal and no test currently guarding against it. The dev's own Completion Notes document that `useParams({ strict: false })` was tried and reverted because it throws inside the isolated `renderWithRouter` harness used by Story 2.1's pre-existing list tests — a legitimate constraint, but the chosen workaround (bare regex) is broader than necessary. A safer middle ground (e.g. checking `router.state.matches` for the specific `_app/clientes/$clienteId` route id, or maintaining a small denylist of known static sibling segments) would close the gap without touching the test harness. **Not auto-fixed**: doing so risks either reintroducing the test-harness break the dev already diagnosed, or making assumptions about Story 2.3's not-yet-implemented route shape — both exceed this story's minimal-complexity mandate. Logged as a Review Follow-up for attention before/alongside Story 2.3.
8. **`listMembership` cross-check workaround (avoiding the doomed 404 request) is unusual but well-justified and appropriately scoped.** The technique (querying the already-fetched `['clientes']` list to decide whether to even issue the by-id request) is a workaround for a genuine, well-documented browser-level constraint (Chromium logs `console.error` for any >=400 response regardless of how JS handles it), not a design smell. It's isolated to the `/clientes/:clienteId` route only (not baked into `useCliente`/`ClienteDetailView` themselves, preserving standalone testability, as the dev notes explain was a deliberate reversal of a tighter-but-more-coupled first attempt). Documented thoroughly in both `useCliente.ts` and `ClienteDetailView.tsx` inline comments. No action needed.
9. **`console.error` monkey-patch (`suppressKnownVendorWarnings.ts`) — verified narrowly scoped, but is a global mutable side effect that deserves scrutiny.** It overrides `console.error` globally from `main.tsx`. The regex + exact prop-name check (`startIcon`/`endIcon` only) is tight and well-commented, and it's justified as unpatchable vendor behavior (confirmed via bundle inspection per the dev notes). Still, patching `console.error` app-wide is inherently risky for future maintainers (silent by design — a badly-scoped future edit to the regex could mask real errors). Acceptable for this story's scope (fixing a genuine vendor bug blocking NFR6) — flagged as a suggestion to add a unit test asserting the filter does NOT suppress unrelated `console.error` calls (currently unverified by any automated test).
10. **Query key convention — compliant.** `useCliente` uses `['clientes', id]` (array form), matching the architecture's mandated convention.
11. **All UI text in Spanish, code in English — compliant.** Verified in `ClienteDetailView.tsx` (labels, not-found copy, empty-state copy) and `ClienteListView.tsx`.
12. **`siesa-ui-kit` checked before custom component — compliant per Dev Notes.** Field-list block (`<dl>`) is a lightweight custom element per Story 2.1 precedent (no `siesa-ui-kit` equivalent existed); `react-loading-skeleton` used for loading states (no custom spinner). Heroicons used (`UserCircleIcon`, `ExclamationTriangleIcon`, `MagnifyingGlassIcon`).

### Tests

13. **Backend: 67/67 passing (17 unit + 50 integration), re-verified live against a real PostgreSQL instance in this review** (`dotnet test tests/SiesaAgents.UnitTests` → 17/17; `dotnet test tests/SiesaAgents.IntegrationTests` → 50/50). Story doc's Dev Agent Record claims "61/61" — the higher live count is because the `test(story-2.2): expand automated coverage` commit added cases after that note was last written; not a discrepancy, just a stale figure with no functional impact.
14. **[MEDIUM] Frontend: NOT reliably green — a real, reproduced order-dependent flake exists in `-navigation-shell.routing.test.tsx`.** `vitest run` (full suite, 9 files / 89 tests) was executed twice in this review: the first run failed `Navigation shell routing > AC4 - Root redirect > should redirect from "/" to "/clientes"` with `Unable to find an element by: [data-testid="clientes-view"]`; the same test passes in isolation and the full suite passed clean (89/89) on the very next run with no code changes in between. This directly contradicts the story's Dev Agent Record ("77/77 passed" — also a stale count, real total is 89). Root cause is almost certainly shared mutable state across test files — `-navigation-shell.routing.test.tsx` uses the app's real singleton `queryClient` directly (only cleared in that file's own `beforeEach`), which can race with MSW handler resets from other files when run in the same worker. This is a genuine test-suite hygiene gap (not a Story 2.2 feature defect) that undermines confidence in CI gating for this suite going forward — logged as a Review Follow-up.
15. **E2E**: `TC-E2-P1-06` "should load and display the correct client" and "should not redirect" both depend on `apiHelper.createCliente()` → `POST /api/v1/clientes`, which is Story 2.3 scope (not yet implemented, confirmed returns `405`). Per explicit review scope instructions, this is **not** treated as a Story 2.2 defect — it is a pre-existing, documented, out-of-scope dependency gap that will resolve once Story 2.3 lands. `TC-E2-P1-07` (not-found + zero console errors) and the AC #4 empty-state E2E test do not depend on `POST` and are unaffected.
16. **Test coverage of the AC/Task matrix is comprehensive**: success/loading/not-found/empty states unit-tested in isolation (`ClienteDetailView.test.tsx`, `ClienteDetailView.edge-cases.test.tsx`), routing-level navigation tested (`-navigation-shell.routing.test.tsx`), backend `GetByIdAsync`/endpoint tested for existing/missing/deleted/malformed-guid/empty-guid cases. No placeholder/no-op assertions found.
17. **[MEDIUM] `ClienteDetailView` collapses two distinct failure semantics onto one `data-testid="cliente-not-found"`.** A real 404 ("Cliente no encontrado") and a generic 500/network failure ("No se pudo cargar el cliente") render under the identical test id (`ClienteDetailView.tsx:78-101`). Unit tests correctly disambiguate via text content today, but `ClientesPage.detailNotFound` in the E2E page object (`e2e/pages/clientes.page.ts:49`) selects purely by this shared test id, meaning no current E2E assertion can distinguish "record doesn't exist" (AC #3's actual contract, and the story's flagged R7 risk) from "backend is down." A distinct test id for the generic-error branch (e.g. `cliente-detail-error`) would keep these meaningfully different states separable for future E2E coverage. Logged as a Review Follow-up.

## Severity Summary

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 1 (#7 regex-based selection is a real latent regression risk ahead of Story 2.3) |
| Medium | 3 (#14 frontend suite flake, #17 shared not-found/error test id, File List documentation gap) |
| Low / Suggestion | 3 (#9 missing negative test for console-error filter, #5 malformed-guid assertion could be more specific, `listMembership` best-effort-not-guaranteed comment) |

No changes were auto-applied to source code. Rationale: the HIGH finding's correct fix is constrained by a test-harness limitation the dev already diagnosed and worked around deliberately; forcing a different fix in an autonomous pass risks reintroducing that break or over-assuming Story 2.3's not-yet-built route shape. The MEDIUM test-flake is an infra/isolation issue in a shared, pre-existing test file, not a Story 2.2 regression — it deserves a dedicated, deliberate fix rather than a rushed patch during this review. The File List documentation gap **was** corrected directly (safe, zero code risk) — see below.

## Acceptance Criteria Verdict

| AC | Status | Evidence |
|---|---|---|
| AC1 (click → detail panel + URL update) | PASS | `ClienteListView.tsx` `handleSelect` → `navigate({ to: '/clientes/$clienteId' })`; `ClienteDetailView` renders all 4 fields; covered by unit + E2E (AC#4 test + routing test) |
| AC2 (direct deep link) | PASS (backend/component level) — E2E automation blocked by out-of-scope Story 2.3 dependency, not a Story 2.2 defect | `clientes.$clienteId.tsx` reads route param directly, no dependency on prior navigation state; `GetClienteById_WithExistingId_ReturnsTheCorrectClienteDto` |
| AC3 (non-existent id → graceful not-found) | PASS | `ClienteDetailView` not-found block, zero-console-error E2E test passing, backend 404 Problem Details tests passing |
| AC4 (no client selected → empty state) | PASS | `clientes.index.tsx` + `ClienteDetailView`'s empty block; E2E test passing |

## Compliance Checklist (Company Standards)

- [x] Clean Architecture / DDD layering respected (Domain has zero deps; Application/Infrastructure/Presentation correctly separated on both backend and frontend)
- [x] UUID PKs (`Guid`)
- [x] `DateTimeOffset` used exclusively, no `DateTime`
- [x] Entity factory pattern (`ClienteEntity.Create`, private constructor) — pre-existing from 2.1, unmodified
- [x] CQRS (Commands/Queries separated) — `GetClienteByIdQuery`/Handler added, mirrors existing pattern
- [x] Minimal API, no controllers
- [x] Scalar API docs, no Swagger
- [x] Problem Details RFC 7807 for errors
- [x] FluentValidation — not applicable to this story (no user input to validate beyond a route-constrained Guid; no new validators required)
- [x] snake_case DB naming — no schema change in this story; `ApplySnakeCaseNaming()` unaffected
- [x] TanStack Router file-based routing, `$` prefix for dynamic params
- [x] TanStack Query array-form query keys (`['clientes', id]`)
- [x] Zustand not introduced unnecessarily — correctly relies on URL as source of truth per architecture
- [x] Spanish UI text / English code identifiers
- [x] `react-loading-skeleton` for loading states (no spinners)
- [x] Heroicons used
- [x] Tests: xUnit + EF Core/Npgsql (backend), Vitest + RTL + MSW (frontend), Playwright (E2E) — all present and passing except the one documented out-of-scope E2E gap

## Fix Outcome

- **Action Taken**: Story's "File List" section corrected directly (added the 5 previously undocumented files) — see story file. All other findings converted to Review Follow-up action items in the story rather than auto-fixed, per the rationale in the Severity Summary above.
- **Fixed Count**: 1 (File List documentation gap)
- **Task Count**: 3 (HIGH selection-fragility regex, MEDIUM frontend suite flake, MEDIUM shared not-found/error test id)
- **Recommended Status**: `done`

## Final Verdict

**PASS WITH OBSERVATIONS**

Rationale: All 4 Acceptance Criteria are implemented and verified in code and tests (AC2's only gap is an out-of-scope E2E dependency on Story 2.3's not-yet-built `POST` endpoint, explicitly excluded from this review's scope per instructions). Zero critical issues found. Backend test suite passes in full, re-verified live against real PostgreSQL (67/67: 17 unit + 50 integration). Architecture, CQRS, UUID/DateTimeOffset, Scalar, Problem Details, and folder-structure conventions are all compliant. However, one HIGH-severity latent regression risk (regex-based selection matching, likely to break silently once Story 2.3 adds a sibling `/clientes/` route) and two MEDIUM issues (a reproduced, real frontend test flake, and a shared test id conflating two distinct failure semantics) were found and are not blocking but do require follow-up attention — logged as action items in the story rather than blocking this story's completion, consistent with the minimal-complexity principle and the story's own documented scope boundary.

## Status Sync

- **Story File Status**: Updated to `done`.
- **Sprint Status YAML**: Synced — `2-2-client-detail-view: done`.
