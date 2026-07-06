# Code Review: 1-3-backend-database-foundation

- **Date**: 2026-07-06
- **Reviewer**: SiesaTeam (AI Agent — Adversarial Senior Developer)
- **Status**: Complete

## Initial Discovery

- **Undocumented Changes**: None found relative to the story's Dev Agent Record → File List prior to this review's own fix (all prior-phase commits — dev-story, automate, test-review — were already reflected).
- **Missing Files**: None — every file declared in the story's File List exists in git.
- **Git State**: Clean at review start (`git status --porcelain` empty, working tree matched HEAD `3b64718`).

## Review Plan

### Items to Verify
- [x] AC1 — `dotnet ef database update` creates `siesa_agents_db` with only `__ef_migrations_history` (no domain tables); `InitialCreate` migration is empty
- [x] AC2 — `ExceptionHandlingMiddleware` returns `application/problem+json` with `status`/`title`/`detail`, no stack trace/exception/inner exception leaked (NFR6)
- [x] AC3 — `ApplySnakeCaseNaming()` called as last statement in `OnModelCreating`; all EF-managed identifiers converted to snake_case, verified via `__ef_migrations_history` columns
- [x] Task 1–7 — EF tooling, `AppDbContext`, `ModelBuilderExtensions`, DI registration, initial migration, middleware compliance, integration test project

### Focus Areas
- Correctness of `ModelBuilderExtensions.ToSnakeCase` and its safety with zero entity types
- `SnakeCaseHistoryRepository`/`MigrationsHistoryTable` wiring for the out-of-model `__ef_migrations_history` table
- `ExceptionHandlingMiddleware` fix for `Content-Type` override and missing `detail` field
- Test quality of `AppDbContextMigrationTests.cs`, flagged by the prior test-review report (test-review-1-3-backend-database-foundation.md) as containing a silent soft-skip anti-pattern

## Verification Evidence

- `dotnet build SiesaAgents.sln` → 0 warnings, 0 errors (both before and after this review's fix).
- `dotnet test SiesaAgents.sln` → **35/35 passing** (12 `SiesaAgents.UnitTests` + 23 `SiesaAgents.IntegrationTests`) against a real local PostgreSQL 16 instance.
- Verified `siesa_agents_db` via `psql`: only `__ef_migrations_history` exists in the `public` schema, columns `migration_id`/`product_version` (snake_case, no PascalCase).
- **Reproduced the soft-skip defect empirically**: stopped the local PostgreSQL cluster (`sudo service postgresql stop`) and re-ran `AppDbContextMigrationTests` — all 5 tests reported **Passed** with zero assertions executed, identical output to a genuine run. This confirms the test-review report's "Medium" observation is a real, verifiable masking defect, not a theoretical concern.
- Fixed and re-verified: with PostgreSQL stopped, the same 5 tests now report **Skipped** (not Passed) with reason `"PostgreSQL is not reachable at localhost:5432 in this environment."`. Restarted PostgreSQL and re-ran the full suite — all 35 tests genuinely pass again.
- Cross-checked the prior test-review report's recommended fix (`Assert.Skip(...)`, claimed to be "xUnit v3, already in use"). This claim is **incorrect**: `SiesaAgents.IntegrationTests.csproj` references `xunit` **2.9.3** (classic xUnit v2 — confirmed via installed NuGet package `xunit.core/2.9.3`), not xUnit v3. `Assert.Skip` does not exist in xUnit v2 and that suggested fix would not compile. Implemented a working alternative instead (see Findings).

## Review Findings

### Medium Issues
- [MED] **Silent soft-skip in `AppDbContextMigrationTests.cs` masked missing DB validation as "Passed"** — all 5 tests (`Database_CanConnect_AfterMigrationApplied`, `EfMigrationsHistoryTable_HasSnakeCaseMigrationIdColumn`, `EfMigrationsHistoryTable_HasSnakeCaseProductVersionColumn`, `EfMigrationsHistoryTable_HasNoPascalCaseColumns`, `Database_ContainsOnlyMigrationsHistoryTable_NoDomainTables`) guarded their assertions behind `if (!await TryConnectAsync(dbContext)) return;`. Empirically confirmed: with PostgreSQL down, all 5 report **Passed**, indistinguishable in CI output from a run that genuinely verified AC #1/#3. This is not acceptable as-is — a CI runner with a broken/unreachable DB would report full green while validating nothing.
  - **FIXED**: added `backend/tests/SiesaAgents.IntegrationTests/RequiresPostgresFactAttribute.cs`, a custom `FactAttribute` subclass that performs a synchronous TCP reachability probe against `localhost:5432` at test-discovery time and sets the inherited `Skip` property when unreachable — xUnit then reports the test as **Skipped**, not **Passed**. Replaced `[Fact]` with `[RequiresPostgresFact]` on all 5 tests in `AppDbContextMigrationTests.cs` and removed the internal `TryConnectAsync`/early-`return` guards, so a *reachable-but-misconfigured* database now correctly fails the test instead of being silently masked. Verified both states (Skipped when DB down, genuinely Passed when DB up) empirically.
  - Note: the prior test-review report's suggested fix (`Assert.Skip`) does not compile against the project's actual xUnit v2.9.3 dependency; this was verified against the installed NuGet packages before implementing the alternative above.

### Low Issues (not blocking, not applied — out of story scope)
- [LOW] **Integration tests rely on a locally-running PostgreSQL instance rather than Testcontainers** — `company-standards.md` Testing Standards specifies "PostgreSQL Test Containers (integration)". This story's own Dev Notes ("Local environment note") and Environment Limitations section already transparently flag this as a sandbox constraint, not a story-specific regression. Introducing Testcontainers (Docker-in-Docker) is a test-infrastructure initiative that exceeds this single story's scope — recommended as a follow-up for a dedicated test-framework story (`sa-tea-framework`).
- [LOW] **No `[Trait]`-based test-ID/priority convention** — consistent with Stories 1.1/1.2; already flagged as a project-wide P3 backlog item in the prior test-review report, not re-raised as a new finding here.

## Fix Outcome

- **Action Taken**: Fixed automatically (Medium issue)
- **Fixed Count**: 1 (soft-skip → proper `Skip`-reporting mechanism, verified empirically in both states)
- **Deferred (not applied, flagged as follow-ups)**: 2 Low items (Testcontainers migration, `[Trait]` convention) — both out of this story's scope per minimal-complexity guidance
- **Recommended Status**: `done` — all 3 Acceptance Criteria independently verified against running/tested code, 0 open Critical/High/Medium findings, `dotnet build`/`dotnet test` both green (35/35) with no regressions, defect empirically reproduced and confirmed fixed rather than assumed.

## Status Sync

- **Story File Status**: Updated to `done`
- **Sprint Status YAML**: Synced (`1-3-backend-database-foundation: done`)
