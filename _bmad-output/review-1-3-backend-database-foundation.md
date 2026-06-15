---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/1-3-backend-database-foundation.md
story_key: 1-3-backend-database-foundation
date: 2026-06-15
reviewer: SiesaTeam (AI Adversarial Senior Developer)
verdict: PASS CON OBSERVACIONES
---

# Code Review: 1-3-backend-database-foundation

- **Date**: 2026-06-15
- **Reviewer**: SiesaTeam (AI Adversarial Senior Developer)
- **Status**: Complete
- **Verdict**: PASS WITH OBSERVATIONS (1 HIGH and 2 MED issues auto-fixed; 1 MED and 2 LOW left as observations)

## Initial Discovery

### Git vs Story File List

- **Files in Story but NOT in Git**: none.
- **Files in Git but NOT in Story (undocumented additions)** — these test files were added by ATDD / AUTOMATE passes but the story's File List did not list them:
  - `backend/tests/SiesaAgents.IntegrationTests/Fixtures/SiesaAgentsApiFactory.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/ExceptionMiddlewareTests.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/ExceptionMiddlewareEdgeCasesTests.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/SnakeCaseConventionTests.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/DbContextWiringTests.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/DbContextLifetimeTests.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/InfrastructureProjectTests.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/MigrationStructureTests.cs`
  - `backend/tests/SiesaAgents.IntegrationTests/NotFoundFallbackTests.cs`
  - `backend/tests/SiesaAgents.UnitTests/Data/Extensions/ToSnakeCaseEdgeCaseTests.cs`
  - File List updated by the review to match git reality.

## Review Plan

### Items Verified

- [x] AC #1 — `dotnet ef database update` creates DB with snake_case `__ef_migrations_history` only. (Runtime check skipped, scaffold verified.)
- [x] AC #2 — `ApplySnakeCaseNaming()` is the LAST call in `OnModelCreating` (source asserted by `EfCore_OnModelCreating_ApplySnakeCaseNamingIsTheLastCall`).
- [x] AC #3 — `InitialCreate` migration has empty `Up()`/`Down()`; snapshot has no entity types (verified by `MigrationStructureTests`).
- [x] AC #4 — `ExceptionHandlingMiddleware` returns RFC 7807 with no stack-trace leak.
- [x] AC #5 — `AddDbContext<AppDbContext>` wired; `/health` returns 200; DbContext resolvable + scoped.
- [x] AC #6 — `Microsoft.EntityFrameworkCore` / `.Design` / `Npgsql.*` all 10.x in csproj.
- [x] AC #7 — Both story-named tests present and green (`ExceptionMiddleware_OnUnhandledException_ReturnsProblemDetailsRfc7807`, `EfCore_OnModelCreating_AppliesSnakeCaseNaming`).

### Compliance vs `.claude/agent-memory/sa-quick-dev/company-standards.md`

- [x] Clean Architecture layering preserved (API → Infrastructure → Domain).
- [x] .NET 10 / EF Core 10.x / PostgreSQL via Npgsql / Scalar / Problem Details (NO Swagger).
- [x] `DateTimeOffset` enforced by ATDD test fixture (`ThrowawayTestEntity.CreatedAt`).
- [x] UUID PKs convention in place (only verified through the snake_case test entity; no domain entity yet).
- [x] Database snake_case enforced via `ApplySnakeCaseNaming()` as the LAST call in `OnModelCreating`.
- [x] xUnit tests, AAA structure, `WebApplicationFactory<Program>`, EF Core InMemory for model tests.
- [⚠] **Folder variance**: `Infrastructure/Data/Migrations/` instead of `Infrastructure/Migrations/` per architecture diagram. Documented in story Dev Notes; functionally identical.

## Review Findings

### Critical Issues (Must Fix)

_None._

### High Issues (Must Fix) — auto-fixed

- **[HIGH] [AUTO-FIXED]** `Program.cs` `MapFallback` for 404 unmatched routes was setting `Response.ContentType = "application/problem+json"` and then immediately calling `WriteAsJsonAsync(problem)`, which overrides the content type back to `application/json`. This was the SAME bug already fixed in `ExceptionHandlingMiddleware` (the AUTOMATE pass even called it out as a Skip-FIXME test). Architecture / NFR6 say Problem Details must be `application/problem+json` everywhere. **Fix applied:** replaced `WriteAsJsonAsync` with `JsonSerializer.SerializeAsync(context.Response.Body, problem, problemJsonOptions)` so the content type is preserved. The skipped test `NotFoundFallback_ContentType_IsProblemJson_FIXME` was un-skipped and renamed `NotFoundFallback_ContentType_IsProblemJson`; it now passes.

### Medium Issues (Should Fix)

- **[MED] [AUTO-FIXED]** `ExceptionHandlingMiddleware` serialized `ProblemDetails` without a `JsonSerializerOptions` instance, so the response body included `"extensions":{}` and (under some serializer policies) `"detail":null`. The architecture standard lists ONLY `status, title, type, instance` as the allowed top-level keys. **Fix applied:** introduced a static `ProblemJsonOptions` with `DefaultIgnoreCondition = WhenWritingNull` and applied it both in the middleware and in the `MapFallback` handler. Existing edge-case test `ExceptionMiddleware_Body_ContainsOnlyAllowedRfc7807Keys` continues to pass (it already tolerated null `detail` / empty `extensions`; now those keys are dropped entirely from the wire format).

- **[MED] [AUTO-FIXED]** Story File List was missing 10 newly added test files (see "Files in Git but NOT in Story" above). **Fix applied:** Dev Agent Record / File List in `1-3-backend-database-foundation.md` was updated to enumerate them.

- **[MED] [OBSERVATION — not auto-fixed]** `Program.cs` registers a test-only endpoint (`GET /__test/throw`) directly in the production composition root, guarded only by `IsEnvironment("Testing")`. Production code should not ship code that throws on purpose, even behind an environment guard. A cleaner pattern is to register the throw endpoint inside `SiesaAgentsApiFactory.ConfigureWebHost` (`builder.ConfigureTestServices` or `.UseStartupFilter`). Left as-is because the guard is correct and the cost/risk of refactoring exceeds the story's scope; flagged for the next maintenance pass.

### Low Issues (Nice to Fix) — observations

- **[LOW] [OBSERVATION]** `SnakeCaseConventionTests.LocateAppDbContextSource` walks the filesystem from `AppContext.BaseDirectory` to find `AppDbContext.cs` source. This will break under single-file publishes, Docker test containers without source mounted, and other non-conventional build outputs. The test is informational; a more robust alternative is to assert the same invariant through model metadata (the existing column/table tests already do that). Consider removing or sandboxing in a future maintenance pass.

- **[LOW] [OBSERVATION]** AC #1's runtime check (`dotnet ef database update` against a live PostgreSQL) was not executed because PostgreSQL is not reachable on `127.0.0.1:5432` in this CI/dev environment. The migration scaffold is empty and correct, so the AC is structurally guaranteed but not behaviorally proven. Documented in story Completion Notes; needs a human re-run with a live PG when the environment supports it.

## Fix Outcome

- **Action Taken**: Auto-fixed 1 HIGH + 2 MED (code + tests + story File List). 1 MED and 2 LOW left as observations (out-of-scope refactors / environmental).
- **Fixed Count**: 3
- **Action-Items Created**: 0
- **Files Modified by Review**:
  - `backend/src/SiesaAgents.API/Program.cs` (MapFallback now uses `JsonSerializer.SerializeAsync` with shared `JsonSerializerOptions`).
  - `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (shared `JsonSerializerOptions` to drop null/empty members).
  - `backend/tests/SiesaAgents.IntegrationTests/NotFoundFallbackTests.cs` (un-skipped content-type test, removed FIXME suffix).
  - `_bmad-output/implementation-artifacts/1-3-backend-database-foundation.md` (File List completed).
- **Recommended Status**: `done`

## Build & Test Evidence After Auto-Fixes

```
dotnet build SiesaAgents.sln  →  0 Warning(s) / 0 Error(s)
dotnet test  SiesaAgents.sln  →  32 unit + 29 integration = 61 / 61 pass, 0 skipped
```

## Status Sync

- **Story File Status**: Updated to `done`.
- **Sprint Status YAML**: Synced `1-3-backend-database-foundation` → `done`.
