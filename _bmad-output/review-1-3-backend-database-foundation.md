---
story_key: 1-3-backend-database-foundation
story_path: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md
epic: 1 - Project Foundation & Application Shell
reviewer: SiesaTeam (AI Agent - Adversarial Senior Developer)
date: 2026-07-08
stepsCompleted: [1, 2, 3, 4, 5]
outcome: PASS WITH OBSERVATIONS
---

# Code Review: 1-3-backend-database-foundation

- **Date**: 2026-07-08
- **Reviewer**: SiesaTeam (AI Agent — Adversarial Senior Developer)
- **Status**: Complete
- **Verdict**: PASS WITH OBSERVATIONS

## Initial Discovery

- **Actual Changed Files (Git)**:
  - New (untracked):
    - `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
    - `backend/src/SiesaAgents.Infrastructure/Migrations/20260708084719_InitialCreate.cs`
    - `backend/src/SiesaAgents.Infrastructure/Migrations/20260708084719_InitialCreate.Designer.cs`
    - `backend/src/SiesaAgents.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`
    - `backend/src/SiesaAgents.API/appsettings.Testing.json`
    - `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
    - `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextExpandedTests.cs`
    - `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationTests.cs`
    - `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationExpandedTests.cs`
    - `backend/tests/SiesaAgents.UnitTests/Middleware/ProblemDetailsMiddlewareTests.cs`
    - `backend/tests/SiesaAgents.UnitTests/Middleware/ProblemDetailsExpandedTests.cs`
  - Modified: `backend/src/SiesaAgents.API/Program.cs`, `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`, `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`, `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`, `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj`
- **Undocumented Changes**: `AppDbContextExpandedTests.cs`, `MigrationExpandedTests.cs`, `ProblemDetailsExpandedTests.cs` (added by TEA `testarch-automate` — not listed explicitly in the story File List but consistent with the automation pattern)
- **Missing Files (in Story but not in Git)**: None
- **False claims**: None

## Review Plan

### Items Verified
- [x] AC1: Migration workflow (`dotnet ef database update` — verified via `dotnet ef migrations list` metadata; live PG run documented as sandbox limitation)
- [x] AC2: Migration folder + `InitialCreate.cs` + `Designer.cs` + `AppDbContextModelSnapshot.cs` present, `Up()`/`Down()` are empty (visual inspection + `MigrationTests` + `MigrationExpandedTests`)
- [x] AC3: `ExceptionHandlingMiddleware` returns HTTP 500 + `application/problem+json`, RFC 7807 body, no stack traces or exception detail (verified by `ProblemDetailsMiddlewareTests` + `ProblemDetailsExpandedTests`)
- [x] AC4: `/_test/throw` gated on `Testing` environment; verified 404 in Development, Production, and Staging by dedicated tests
- [x] AC5: snake_case naming applied to model (see finding #1 — deviation from spec letter)
- [x] AC6: `AddDbContext<AppDbContext>` with `UseNpgsql(...).UseSnakeCaseNamingConvention()`, connection string from config, no hardcoded fallback (throws on missing key)
- [x] AC7: `dotnet build backend/SiesaAgents.sln` → 0 errors, 0 warnings
- [x] AC8: `dotnet test backend/SiesaAgents.sln` → 44 tests pass (17 pre-existing + 27 new)

### Focus Areas
- Backend Critical Rules compliance (UUID PK, `DateTimeOffset`, `ApplySnakeCaseNaming()` — deferred to Epic 2/3 since no entities in scope).
- Problem Details middleware information leakage.
- Environment gating (Development / Testing / Production / Staging).

---

## Review Findings

### Critical Issues (Must Fix)
_None._

### High Issues (Should Fix — recorded as tech debt)

#### [HIGH-1] AC #5 spec letter deviation: `ApplySnakeCaseNaming()` does not exist in `EFCore.NamingConventions 10.0.0-rc.2`

- **Where**: `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`, `OnModelCreating(...)`.
- **AC #5 wording**: "`modelBuilder.ApplySnakeCaseNaming()` … is the LAST call in `OnModelCreating`".
- **Company standards** (`company-standards.md` line 182): "`ApplySnakeCaseNaming()` — LAST call inside `OnModelCreating`".
- **Reality**: Verified via `strings` on the compiled DLL — the package exposes only options-level extensions (`UseSnakeCaseNamingConvention`, `UseUpperSnakeCaseNamingConvention`, `WithSnakeCaseNamingConvention`, `WithUpperSnakeCaseNamingConvention`). No `ModelBuilder.ApplySnakeCaseNaming()` symbol exists.
- **Functional impact**: NONE. Snake_case naming is correctly enforced at options level via `.UseSnakeCaseNamingConvention()` in `Program.cs`. The plugin registers a naming convention rewriter that runs during model finalization, achieving the same effect as the (non-existent) model-builder extension.
- **Verdict**: This is a documentation error propagated from company standards → story tasks. The dev correctly identified it (see `Debug Log References` in the story) and applied the working alternative. Recommend the standards & template snippets be corrected upstream.
- **Auto-fix applied**: Clarifying comment added to `AppDbContext.OnModelCreating` explaining the design decision so future implementers do not attempt to add a non-existent method call.

### Medium Issues (Should Fix)

#### [MED-1] Release-Candidate package pinned as mandatory dependency

- **Where**: `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` line 8.
- `EFCore.NamingConventions 10.0.0-rc.2` — RC packages carry a stability risk (breaking changes possible before GA). Since this package is the sole carrier of snake_case behaviour (AC #5), any regression here breaks database naming compliance.
- **Recommendation**: Track as tech debt. Upgrade to GA release when available. Add a note in `README` / architecture doc so future developers know why the RC pin exists.
- **Auto-fix**: N/A (requires upstream release).

#### [MED-2] Live-DB assertions for AC #1 not exercised

- **Where**: AC #1 requires `dotnet ef database update` to create the `__ef_migrations_history` table with snake_case columns (`migration_id`, `product_version`).
- The sandbox has no PostgreSQL instance. The dev correctly documented this in `Debug Log References` and shifted assertion to metadata-only (`dotnet ef migrations list`).
- The migration structure IS verified (empty `Up()`/`Down()`, no `CreateTable`/`DropTable`/`AddColumn`/`CreateIndex`/`AddForeignKey` ops), but the actual DB schema is unverified.
- **Recommendation**: When Epic 2 adds `clientes`, the developer running against a live PostgreSQL must reconfirm the migration history table snake_case naming.
- **Auto-fix**: N/A (needs live PostgreSQL).

### Low Issues (Nice to Fix)

#### [LOW-1] Misleading comment in `AppDbContext.OnModelCreating`

- **Where**: `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` lines 33-36.
- Original comment stated "this MUST remain the last non-plugin call" — but no call exists yet. The comment describes future code without a clear anchor point, and does not explain the deliberate omission of `ApplySnakeCaseNaming()` (see HIGH-1).
- **Auto-fix applied**: Rewrote the comment to explicitly state (a) the current empty state, (b) the future `ApplyConfigurationsFromAssembly` insertion point, and (c) that snake_case is enforced at options level (not here) because the model-builder API does not exist in the current package version.

#### [LOW-2] `ProblemDetails.Type` references obsolete RFC 7231

- **Where**: `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` line 43.
- `Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1"` — RFC 7231 was obsoleted by RFC 9110 in June 2022. The modern URL would be `https://www.rfc-editor.org/rfc/rfc9110#name-500-internal-server-error`.
- **Not fixed**: The existing test `ProblemDetails_Type_ReferencesRfc7231_500Section` asserts the string contains `"rfc7231"`. Changing the URL would break that test, and both RFC 7231 and RFC 9110 URLs resolve to a valid IETF page. This is cosmetic and out of scope for a story that inherited the middleware from Story 1.1.
- **Recommendation**: Include the URL modernisation in the next NFR/security cleanup story that updates the middleware.

#### [LOW-3] Undocumented expanded test files in File List

- **Where**: `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md` `### File List` section.
- The story lists three new test files but the working tree contains six test files (three ATDD baselines + three `*Expanded*` files from `testarch-automate`).
- **Recommendation**: Update the File List during the next dev-story finalize step to include the automate-generated files. Not blocking — the files are legitimate, pass tests, and add real coverage (DI lifetime, environment gating, HTTP verb gating, determinism).
- **Auto-fix**: N/A (owned by dev-story workflow, not this review).

#### [LOW-4] `appsettings.json` has no `ConnectionStrings` placeholder

- **Where**: `backend/src/SiesaAgents.API/appsettings.json`.
- The base settings file has no `ConnectionStrings` key. `Program.cs` throws at startup if `DefaultConnection` is not resolvable (correct fail-fast). This means Production deployments MUST set `ConnectionStrings__DefaultConnection` via env vars.
- **Recommendation**: Add a comment or placeholder documenting the env-var dependency. Not blocking (behaviour is deliberate per company standards — "secrets in env vars").

---

## Adversarial Verification Summary

| AC | Status | Evidence |
|----|--------|----------|
| AC1 | PASS (partial — live DB not exercised) | `dotnet ef migrations list` returns exactly `20260708084719_InitialCreate` (per dev log). `MigrationTests` verifies metadata. |
| AC2 | PASS | Three files present, `Up()`/`Down()` empty; verified visually + by `MigrationTests` + `MigrationExpandedTests`. |
| AC3 | PASS | `ExceptionHandlingMiddleware.cs` sets `application/problem+json`, HTTP 500, logs via `ILogger`, omits `Detail`. Verified by 3 tests. |
| AC4 | PASS | `/_test/throw` gated on `IsEnvironment("Testing")`. Verified 404 in Development, Production, Staging. |
| AC5 | PASS WITH DEVIATION | snake_case is applied at options level (`UseSnakeCaseNamingConvention()`). Model-builder API does not exist in package — spec is factually incorrect. See HIGH-1. |
| AC6 | PASS | `AddDbContext<AppDbContext>` with `UseNpgsql(...).UseSnakeCaseNamingConvention()`, connection string from `builder.Configuration.GetConnectionString("DefaultConnection")`, throws on null. |
| AC7 | PASS | `dotnet build` → 0 warnings, 0 errors (executed during review). |
| AC8 | PASS | `dotnet test` → 44 tests pass (executed during review, `Duration: 850 ms`). |

---

## Fix Outcome

- **Action Taken**: Selective auto-fix (documentation clarity only). No behavioural change.
- **Fixed Count**: 1 (LOW-1 comment clarity)
- **Deferred**: HIGH-1 (spec error — upstream), MED-1 (RC package — upstream), MED-2 (live-DB — needs infra), LOW-2 (cosmetic — needs test alignment), LOW-3 (dev-story workflow), LOW-4 (deliberate design)
- **Recommended Status**: `done`

### Rationale for PASS
- All 8 ACs functionally satisfied.
- 44/44 tests pass; build clean.
- Story scope respected (no domain entities, no repositories, no CQRS handlers).
- Company standards observed where applicable in scope (Scalar over Swagger, RFC 7807 Problem Details, no `DateTime`, no `[Column]`/`[Table]` attributes).
- The single spec deviation (HIGH-1) is a factually justified workaround for a documentation error in the standards themselves — the dev's handling is correct and clearly documented.

## Status Sync

- **Story File Status**: Updated `Status:` to `done`.
- **Sprint Status YAML**: Updated `1-3-backend-database-foundation: done`.
