# Story 1.3: Backend Database Foundation

Status: review

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors and EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **Given** the EF Core DbContext is configured, **When** `OnModelCreating` executes, **Then** `modelBuilder.ApplySnakeCaseNaming()` is applied as the last call, ensuring all future column and table names follow snake_case convention automatically — no manual `[Column]` or `[Table]` attributes on entities.

3. **Given** an unhandled exception occurs in the backend at any point, **When** the exception reaches the global middleware, **Then** the response returns a Problem Details RFC 7807 JSON body (`status`, `title`, `detail`) with HTTP status 500 and no stack traces or internal exception messages exposed to the caller. (NFR6)

4. **Given** the backend is started with `dotnet run` in `src/SiesaAgents.API`, **When** the application boots, **Then** `AppDbContext` is registered in the DI container using the `DefaultConnection` connection string from `appsettings.Development.json` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`.

5. **Given** the initial migration is applied, **When** the developer inspects the `siesa_agents_db` database, **Then** only the EF Core `__EFMigrationsHistory` table exists — NO `clientes` or `contactos` tables are present (those are created in Epics 2 and 3 respectively).

6. **Given** `dotnet build SiesaAgents.sln` is executed after this story's changes, **When** the build completes, **Then** all four projects (API, Application, Domain, Infrastructure) compile with zero errors and zero warnings.

## Tasks / Subtasks

- [x] Task 1 — Add EF Core NuGet packages to Infrastructure (AC: #1, #4, #6)
  - [x] Add `Microsoft.EntityFrameworkCore` to `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore`
  - [x] Confirm `Npgsql.EntityFrameworkCore.PostgreSQL` is already present (added in Story 1.1); if not: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [x] Add EF Core design tools for migrations: `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
  - [x] Add EF Core design tools to API project (required for `dotnet ef` CLI targeting): `dotnet add src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design`
  - [x] Add EF Core tools to the global tool manifest if not present: `dotnet tool install --global dotnet-ef` (or confirm via `dotnet ef --version`)

- [x] Task 2 — Create `AppDbContext` in Infrastructure layer (AC: #2, #4, #5)
  - [x] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
  - [x] Inherit from `DbContext`; constructor accepts `DbContextOptions<AppDbContext>`
  - [x] Override `OnModelCreating(ModelBuilder modelBuilder)` — snake_case applied via `UseSnakeCaseNamingConvention()` on DbContextOptionsBuilder in Program.cs (EFCore.NamingConventions 10.x API)
  - [x] Do NOT add any `DbSet<>` properties in this story — no domain entities exist yet
  - [x] Ensure the class is in namespace `SiesaAgents.Infrastructure.Data`

- [x] Task 3 — Register `AppDbContext` in `Program.cs` (AC: #4, #6)
  - [x] Open `backend/src/SiesaAgents.API/Program.cs`
  - [x] Add the `using` for `SiesaAgents.Infrastructure.Data`
  - [x] Register the DbContext with `UseNpgsql` and `UseSnakeCaseNamingConvention()` before `var app = builder.Build()`
  - [x] Ensure `SiesaAgents.API.csproj` references `SiesaAgents.Infrastructure` project
  - [x] Verify `dotnet build SiesaAgents.slnx` passes with zero errors

- [x] Task 4 — Configure `appsettings.Development.json` connection string (AC: #4)
  - [x] Open `backend/src/SiesaAgents.API/appsettings.Development.json`
  - [x] Ensure the `ConnectionStrings` section contains `DefaultConnection` pointing to localhost
  - [x] Confirm `appsettings.Development.json` is excluded from git via `.gitignore` (secrets must not be committed)

- [x] Task 5 — Create and apply initial EF Core migration (AC: #1, #5)
  - [x] Run the migration command from `backend/` directory — `InitialCreate` migration generated
  - [x] Verify the migration file is created at `backend/src/SiesaAgents.Infrastructure/Data/Migrations/`
  - [x] Inspect the generated migration: confirmed `Up()` method is empty — no table creation calls
  - [x] Apply the migration: skipped — PostgreSQL not available in this environment (migration is ready to apply when DB is running)
  - [x] Connect to the `siesa_agents_db` database: deferred to environment with running PostgreSQL

- [x] Task 6 — Verify and harden `ExceptionHandlingMiddleware` (AC: #3)
  - [x] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
  - [x] Catches ALL unhandled exceptions and writes Problem Details RFC 7807 format
  - [x] `Detail = null` — never expose `ex.Message` or stack traces
  - [x] `Content-Type: application/problem+json` set via `Response.ContentType` before `WriteAsync`
  - [x] Middleware registered in `Program.cs` BEFORE all other middleware

- [x] Task 7 — Write xUnit unit test for `ExceptionHandlingMiddleware` (AC: #3)
  - [x] Test project `SiesaAgents.UnitTests` references `SiesaAgents.API` and `SiesaAgents.Infrastructure`
  - [x] `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` — 7 tests covering AC#3
  - [x] `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextTests.cs` — 5 tests covering AC#2
  - [x] All 12 tests pass (0 failures)

- [x] Task 8 — Final integration validation (AC: #1, #4, #6)
  - [x] Run `dotnet build SiesaAgents.slnx` — zero errors and zero warnings
  - [x] Run `dotnet test SiesaAgents.slnx` — all 12 tests pass
  - [x] PostgreSQL not available in this environment — `dotnet run` startup with DB can be verified when PostgreSQL is running

## Dev Notes

### Architecture Context

This story is **backend-only**. No frontend changes are required. It extends the backend skeleton created in Story 1.1 by wiring the PostgreSQL data layer.

**Scope boundary (critical):** This story creates an empty initial migration only. The `clientes` table is created in Epic 2 Story 2.1 when `ClienteEntity` is defined. The `contactos` table is created in Epic 3 Story 3.1. Do NOT define `ClienteEntity`, `ContactoEntity`, or any domain `DbSet<>` in this story.

### Backend Stack for This Story

| Component | Version | Notes |
|-----------|---------|-------|
| .NET | 10 | Framework |
| EF Core | 10.0.9 | ORM — `Microsoft.EntityFrameworkCore` |
| Npgsql EF Provider | 10.0.2 | `Npgsql.EntityFrameworkCore.PostgreSQL` |
| EF Core Design | 10.0.9 | `Microsoft.EntityFrameworkCore.Design` — required for migrations CLI |
| EFCore.NamingConventions | 10.0.1 | `EFCore.NamingConventions` — provides `UseSnakeCaseNamingConvention()` |
| dotnet-ef CLI | 10.0.9 | Global tool — `dotnet tool install --global dotnet-ef` |

### Critical EF Core Conventions

**snake_case via `UseSnakeCaseNamingConvention()` — mandatory:**
- Added to `DbContextOptionsBuilder` in `Program.cs` registration, NOT in `OnModelCreating`
- EFCore.NamingConventions 10.x API: `options.UseNpgsql(...).UseSnakeCaseNamingConvention()`
- Effect: C# `PascalCase` entity/property names → PostgreSQL `snake_case` columns/tables automatically
- No `[Column]`, `[Table]`, or `HasColumnName()` overrides needed or allowed

**Note on AC#2 phrasing:** The story spec references `modelBuilder.ApplySnakeCaseNaming()` but the actual EFCore.NamingConventions 10.x library exposes `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder`. The snake_case behavior is equivalent — all entities created in future stories will automatically use snake_case column/table names.

### Migration Commands Reference

All commands run from `backend/` root directory:

```bash
# Add new migration
dotnet ef migrations add <MigrationName> \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Data/Migrations

# Apply migrations to database
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Problem Details RFC 7807 Response Shape

```json
{
  "status": 500,
  "title": "An unexpected error occurred.",
  "detail": null
}
```

- `Content-Type: application/problem+json` — mandatory header (set explicitly before WriteAsync)
- `detail` MUST be `null` — never expose `ex.Message` or inner exceptions
- HTTP status code must match the `status` field value

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Architecture — EF Core DbContext pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Company standards — Database Conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- Company standards — Backend Critical Rules: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- EFCore.NamingConventions 10.x API change: `ApplySnakeCaseNaming()` (ModelBuilder extension) is not the actual API. The library provides `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder`. Applied in Program.cs DI registration instead of OnModelCreating.
- ExceptionHandlingMiddleware `WriteAsJsonAsync` overrides Content-Type to `application/json; charset=utf-8`. Fixed by using `JsonSerializer.Serialize` + `Response.WriteAsync` to preserve `application/problem+json`.
- Solution file created as `.slnx` format (new .NET 10 format) instead of `.sln`.
- Version conflict MSB3277 in UnitTests between EF Core Relational 10.0.4 and 10.0.9 — fixed by adding explicit `Microsoft.EntityFrameworkCore.Relational` 10.0.9 package reference to UnitTests.csproj.

### Completion Notes List

1. Backend solution created from scratch (Story 1.1 prerequisite was not yet implemented). Solution is `SiesaAgents.slnx` (.NET 10 new format).
2. All 4 source projects + 1 test project added with correct project references: API → Application + Infrastructure → Domain.
3. `AppDbContext` created in `SiesaAgents.Infrastructure.Data` namespace, no DbSet properties (scope boundary respected).
4. snake_case naming applied via `UseSnakeCaseNamingConvention()` on `DbContextOptionsBuilder` in Program.cs.
5. `InitialCreate` migration generated — `Up()` is empty (no domain entity tables — AC#5 satisfied).
6. `ExceptionHandlingMiddleware` written using `JsonSerializer.Serialize` to ensure `Content-Type: application/problem+json` is preserved.
7. All 12 unit tests pass: 5 AppDbContext tests (AC#2) + 7 ExceptionHandlingMiddleware tests (AC#3).
8. `dotnet build SiesaAgents.slnx` succeeds with zero errors and zero warnings (AC#6 satisfied).
9. `appsettings.Development.json` added to `.gitignore` to prevent secrets from being committed.
10. PostgreSQL database update (`dotnet ef database update`) deferred — PostgreSQL not running in this environment, but migration is ready to apply.

### File List

**Created:**
- `backend/SiesaAgents.slnx` — .NET 10 solution file
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — API project
- `backend/src/SiesaAgents.API/Program.cs` — Minimal API with DbContext, CORS, Scalar, ExceptionHandlingMiddleware
- `backend/src/SiesaAgents.API/appsettings.json` — Default app settings
- `backend/src/SiesaAgents.API/appsettings.Development.json` — Dev connection string
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — RFC 7807 Problem Details middleware
- `backend/src/SiesaAgents.Application/SiesaAgents.Application.csproj` — Application class library
- `backend/src/SiesaAgents.Domain/SiesaAgents.Domain.csproj` — Domain class library
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — Infrastructure class library
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — EF Core DbContext
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260629113309_InitialCreate.cs` — Empty initial migration
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/20260629113309_InitialCreate.Designer.cs` — Migration designer
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` — Model snapshot
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` — xUnit test project
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` — Middleware tests (7 tests)
- `backend/tests/SiesaAgents.UnitTests/Data/AppDbContextTests.cs` — DbContext tests (5 tests)

**Modified:**
- `.gitignore` — Added `backend/**/appsettings.Development.json` exclusion
