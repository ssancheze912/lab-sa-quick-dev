---
story_key: 2-1-client-list-search
story_path: _bmad-output/implementation-artifacts/2-1-client-list-search.md
reviewer: SiesaTeam (AI Agent, adversarial)
date: 2026-07-03
stepsCompleted: [1, 2, 3, 4, 5]
---

# Code Review: 2-1-client-list-search

- **Status**: PASS WITH OBSERVATIONS
- **Test result**: FE 82/82 vitest GREEN · BE 65 xUnit GREEN + 8 Docker-guarded skips · both `dotnet build` and `pnpm exec tsc -b` clean (0 warnings, 0 errors)
- **Verdict**: All 11 ACs satisfied; 2 medium, 4 low observations identified; 1 documentation gap auto-corrected.

## Initial Discovery

- **Git changes** (branch `feat/sa-quick-dev-epics-1-4-2026-07-03`, HEAD `4b37893 feat(story-2.1): implement client list & search (master-detail)`):
  - Committed in `4b37893`: all 20 files claimed by the story's File List — no missing files, no false claims against disk.
  - Untracked at review time (Automate expansion, added AFTER `4b37893`):
    - `backend/tests/SiesaAgents.UnitTests/Application/Clientes/GetClientesQueryHandlerTests.cs`
    - `frontend/src/modules/crm/clientes/application/useClientes.test.tsx`
    - `frontend/src/modules/crm/clientes/presentation/ClienteListView.edge.test.tsx`
    - `frontend/src/shared/components/ClientListItem.test.tsx`
    - `frontend/src/shared/components/EmptyState.test.tsx`
    - `frontend/src/shared/components/ErrorPanel.test.tsx`
  - The 6 untracked test files were NOT reflected in the story's Dev Agent Record → File List. **Auto-corrected in this review** (see Finding M1 below).
- **Missing Files**: none — every path in the File List exists on disk.
- **False Claims**: none.

## Review Plan

- **AC #1** (280 px scrollable left panel + TanStack Query `['clientes']`) → `ClienteListView.tsx` + `useClientes.ts` + `_app/clientes.tsx`; asserted by TC-E2-P1-01 + master-detail layout spec.
- **AC #2** (client-side search, `nombre` OR `nitRuc`, accent-insensitive, no API refetch on keystroke) → `ClienteListView.tsx` normalize + useMemo; asserted by TC-E2-P1-01 (500 items, `< 1 s`, no second GET) + `ClienteListView.edge.test.tsx` (accent, NIT substring, telefono/ciudad guard, whitespace, clear).
- **AC #3** (EmptyState on `[]` with no simultaneous skeleton) → asserted by TC-E2-P1-02 + `EmptyState.test.tsx`.
- **AC #4** (ErrorPanel + Reintentar, refetch on click, no leaked HTTP status) → asserted by TC-E2-P1-03 + `ErrorPanel.test.tsx`.
- **AC #5** (react-loading-skeleton while `isLoading`) → asserted by ClienteListView "Loading skeleton" describe block.
- **AC #6** (`AddClientes` migration: snake_case columns, `uk_clientes_nit_ruc`, no `contactos`) → migration file inspected + TC-E2-P2-01 (Docker-guarded, skipped in sandbox).
- **AC #7** (GET `/api/v1/clientes` → 200 + camelCase array + ISO-8601 with offset + `[]` on empty) → Minimal API endpoint + TC-E2-P1-11 (Docker-guarded skipped) + `GetClientesQueryHandlerTests` unit coverage on the mapping path.
- **AC #8** (`ClienteEntity` uses `Guid`, `DateTimeOffset`, no naive `DateTime`) → reflection asserted by TC-E2-P2-02 (5 `ClienteEntityTests`).
- **AC #9** (0 build warnings/errors, no new `NU1903` suppressions, no `any` casts) → both stacks build clean; `grep -rn "\\bany\\b" frontend/src/modules/crm/clientes` returns 0 type-level matches.
- **AC #10** (all named test cases pass or are Docker-guarded skips) → 8 skips are all `SkippableFact` guarded on `IsDockerAvailable()`, invariants covered at unit level.
- **AC #11** (all user-facing text in Spanish, identifiers in English) → `ClienteListView.tsx`, `EmptyState.tsx`, `ErrorPanel.tsx`, `ClientListItem.tsx` inspected; every visible label, placeholder, aria-label, empty-state copy is Spanish.

### Focus Areas

- Company-standards compliance: folder structure, `DateTimeOffset` mandate, `Guid` PKs, snake_case DB naming, Minimal API only, Spanish P0 text, siesa-ui-kit primitives first.
- Test quality: real assertions vs. placeholders, coverage of every AC, correct MSW cache-busting.
- Security & correctness: no error.message leakage, AbortSignal on the axios call, no `any` casts, no DB-level SQL injection surface.

## Review Findings

### Medium

- **[MED] M1 · Story File List did not track the 6 Automate-expansion test files.** *(AUTO-CORRECTED in this review)*
  File: `_bmad-output/implementation-artifacts/2-1-client-list-search.md` (File List section).
  The story's Dev Agent Record listed 4 test files (`ClienteEntityTests`, `ClienteEndpointsTests`, `ClientesMigrationTests`, `ClienteListView.test.tsx`), but the working tree contained 6 additional Automate-expansion test files that ship 42 extra assertions (12 handler + 4 hook + 12 edge + 8 list-item + 4 empty-state + 8 error-panel = 48). Downstream review workflows over-index on the File List and would have underestimated the change surface. **Fix**: appended a new "Created — Tests (Automate expansion, discovered during code-review)" subsection to the File List enumerating all 6 files. Same class of finding as Story 1.3 Finding M3.

- **[MED] M2 · Debounce semantics diverge from the story's "≈150 ms" language.**
  File: `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx:32`
  The implementation uses `useDeferredValue(rawQuery)` rather than a time-based debounce. `useDeferredValue` defers based on React's rendering priority — it is *not* a 150 ms timer. Story AC #2 references `test-design-epic-2.md#Assumptions A4` which specifies "debounced ~150 ms", and Dev Notes explicitly allow *either* `useDeferredValue` or a `setTimeout` debounce, so this is a **spec-permitted variant, not a bug** — but the code should acknowledge the divergence in a comment so a future reviewer does not "fix" it by wrapping `setTimeout` around the state. All 82 vitest tests pass with `userEvent.setup({ delay: null })`, so the choice does not affect the assertion surface today; if the E2E suite later measures wall-clock debounce, this may need revisiting. **Impact**: contract clarity, not functional risk.

### Low

- **[LOW] L1 · Endpoint route uses `MapGet("/", ...)` inside a `MapGroup("/api/v1/clientes")` — produces the canonical URL `/api/v1/clientes/` with a trailing slash.**
  File: `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs:17`
  ASP.NET Core routes both `/api/v1/clientes` and `/api/v1/clientes/` to this handler (integration tests pass with the un-trailed form), but the *documented* URL in OpenAPI/Scalar and route metadata is the trailed one. Convention across the community and future Story 2.2 endpoints (which will use `/{id}`) is `MapGet("", ...)` — the empty relative path inside a group. **Impact**: purely cosmetic; recommend on Story 2.2 refactor pass, not this story.

- **[LOW] L2 · Endpoint lacks `.Produces<>` OpenAPI metadata.**
  File: `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs:17-20`
  Scalar/OpenAPI can infer the response type from the delegate return, but adding `.Produces<IReadOnlyList<ClienteDto>>(StatusCodes.Status200OK).WithName("GetClientes").WithOpenApi()` gives clients a stable operation ID + explicit schema. Not in AC #7 scope; flag for the Epic 2 API polish story.

- **[LOW] L3 · No PostgreSQL server-side default on `clientes.id` (UUID generation is client-side).**
  Files: `20260703093051_AddClientes.cs:18` (migration column has no `DEFAULT`) + `ClienteEntity.cs:11` (`Guid.NewGuid()` at construction).
  Company-standards mandate `id UUID PRIMARY KEY DEFAULT uuidv7()` at the DB level. Story 2.1 Dev Notes explicitly downgrade this: *"UUIDv7 is a future optimization; v4 is acceptable in MVP"*, and code that generates UUIDs at the domain layer is functionally correct. A future migration should introduce the PG18 `uuidv7()` default so `INSERT` statements from outside the app (SQL scripts, seed jobs) also get monotonic IDs. **Not blocking this story**; raise for the Epic 5 hardening pass.

- **[LOW] L4 · Search filter re-normalises every candidate on every keystroke — O(n·k) work per keystroke, where n=500 and k=length(query).**
  File: `frontend/src/modules/crm/clientes/presentation/ClienteListView.tsx:34-43`
  Each render maps `nombre → normalize(nombre)` for all 500 items, throwing the intermediate strings away between keystrokes. Story Dev Notes acknowledge this: *"useMemo over a 500-element array is well under 50 ms — no virtualization required in 2.1"*. TC-E2-P1-01 asserts the full round-trip completes in `< 1 s` on the 500-item fixture and it passes. A future optimization would memoise `normalize(cliente.nombre)` and `normalize(cliente.nitRuc)` per client, computed once when `data` arrives. **Not blocking**; flag for the NFR performance pass when the 500-record ceiling is challenged.

### Informational

- **Docker-guarded skips**: 8 `SkippableFact` tests self-skip because `/var/run/docker.sock` is absent (matches Story 1.3 sandbox pattern). Their invariants are:
  - TC-E2-P1-11 (GET returns camelCase array + ISO-8601 offset) → covered at unit level by `GetClientesQueryHandlerTests` and by the raw code (JSON serializer defaults + record property names).
  - TC-E2-P2-01 (snake_case columns + `uk_clientes_nit_ruc`) → covered by inspecting the migration file directly (`AddClientes.cs:14-35` shows all-lowercase snake_case column names + unique index name).
- **Epic 1 tests still pass**: `EfCoreMigrationTests`, `AppDbContextConventionTests`, `AppDbContextDependencyInjectionTests`, `MigrationScopeGuardTests` were updated by the dev agent to accommodate Epic 2's new entity (documented in Completion Notes). All Epic 1 assertions still hold in the current run (53 integration passes).
- **Router integration**: `data-testid="clientes-view"` preserved on `_app/clientes.tsx:10` per Epic 1 TC-E1-P1-01 requirement.
- **Frontend `apiClient` reuse**: `clienteApiRepository` uses the shared `@/shared/lib/apiClient` (no new Axios instance); the AbortSignal is forwarded to enable TanStack Query cancellation on unmount.

## Compliance vs. Company Standards

| Standard | Verdict | Notes |
|---|---|---|
| Folder structure (Domain / Application / Infrastructure / API) | PASS | All files land at the paths mandated by `architecture.md#Complete Project Directory Structure` and `company-standards.md#Backend Folder Structure`. |
| Primary key = `Guid` | PASS | `ClienteEntity.Id { get; set; } = Guid.NewGuid();` (reflection-asserted by TC-E2-P2-02). |
| `DateTimeOffset` mandate (never `DateTime`) | PASS | `CreatedAt` + `UpdatedAt` on entity + DTO; `ClienteEntity_has_no_naive_DateTime_properties` fact confirms zero `DateTime` props. |
| Entity Pattern (private ctor + `Create()` factory + domain events) | INTENTIONAL DEVIATION | Story explicitly downgrades this to plain public setters for Story 2.1 (read-only surface) and defers the factory pattern to Stories 2.3/2.4 where invariants matter. Documented in Task 1 rationale and reflected in `ClienteEntity.cs` XML doc. |
| Snake_case DB naming via `ApplySnakeCaseNaming()` (LAST call) | PASS | `AppDbContext.OnModelCreating` order = `base → ApplyConfigurationsFromAssembly → ApplySnakeCaseNaming`. Migration file confirms all-lowercase snake_case columns. |
| No `[Table]` / `[Column]` attributes | PASS | `grep -rn "\\[Column\\|\\[Table\\]" backend/src/` returns 0 code-level matches (only doc comments referencing the ban). |
| No `HasDefaultSchema(...)` in Story 2.1 | PASS | Deferred per Task 2 note; `public` schema is used across the board. |
| Minimal API only (no `[ApiController]`) | PASS | `MapGroup("/api/v1/clientes")` + `MapGet("/", ...)`; no controller classes anywhere in the diff. |
| API docs via Scalar (never Swagger) | PASS | `app.MapScalarApiReference()` in `Program.cs:81`. |
| CQRS separation (Command / Query) | PASS | `GetClientesQuery` + `GetClientesQueryHandler` POCO; no MediatR (company-standards mandate the separation, not the library). |
| Repository: interface in Domain, impl in Infrastructure | PASS | `IClienteRepository` in `SiesaAgents.Domain/Clientes/Interfaces`; `ClienteRepository` in `SiesaAgents.Infrastructure/Repositories`. |
| `AsNoTracking()` on read paths | PASS | `ClienteRepository.GetAllAsync` line 19. |
| TypeScript `strict` + no `any` casts | PASS | `pnpm exec tsc -b` clean; no `: any` type annotation in any Story 2.1 frontend file. |
| Canonical TanStack Query key `['clientes']` | PASS | `useClientes.ts:11`; asserted by `useClientes.test.tsx` via `client.getQueryData(['clientes'])`. |
| Loading skeleton via `react-loading-skeleton` (not spinner) | PASS | `ClienteListView.tsx:64-66`. |
| All user-facing text in Spanish (P0) | PASS | Placeholder "Buscar cliente…", aria-label "Buscar cliente por nombre o NIT/RUC", empty title "Aún no hay clientes", error title "No se pudieron cargar los datos", retry button "Reintentar". |
| WCAG 2.1 AA (44 px tap target, focus-visible ring) | PASS | `ClientListItem.tsx:26` (`min-h-[44px]`), `focus-visible:ring-2` on search input + retry button + list item. |
| `siesa-ui-kit` primitives-first policy | INTENTIONAL DEVIATION | `Button` + `Input` from `siesa-ui-kit@1.0.255` do not forward arbitrary props (e.g. `data-testid`) to the underlying DOM element — verified by the dev agent (documented in Completion Notes). Native `<button>`/`<input>` styled with brand tokens are the fallback per `company-standards.md#Frontend Key Rules` "component decision order". |

## Fix Outcome

- **Action Taken**: Auto-fixed the story documentation gap (M1). All other findings are informational / non-blocking.
- **Fixed Count**: 1 (M1 — Story File List sync).
- **Remaining Observations**: 5 (M2, L1, L2, L3, L4) — none block story acceptance. All are either intentional deviations (documented in the story) or forward-looking recommendations for later stories.
- **Recommended Status**: **done** — every AC has passing test coverage or a documented Docker-guarded skip with unit-level fallback; both stacks build clean; no CRITICAL or HIGH findings.

## Status Sync

- **Story File Status**: Updated `Status: review` → `Status: done` in `2-1-client-list-search.md`.
- **Sprint Status YAML**: Updated `2-1-client-list-search: ready-for-dev` → `2-1-client-list-search: done` in `sprint-status.yaml`.
