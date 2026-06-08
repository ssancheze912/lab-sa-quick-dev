# Story 1.3: Backend Database Foundation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **when** the developer runs `dotnet ef database update` from the `backend/` directory, **then** the `siesa_agents_db` database is created with no errors and the EF Core `__EFMigrationsHistory` table is present.

2. **Given** the backend solution is initialized (from Story 1.1), **when** the developer inspects `src/SiesaAgents.Infrastructure`, **then** an `InitialCreate` migration file exists under `src/SiesaAgents.Infrastructure/Data/Migrations/` and the migration is empty of domain tables (no `clientes` or `contactos` tables).

3. **Given** the backend receives any request, **when** `OnModelCreating` is called in `AppDbContext`, **then** `modelBuilder.ApplySnakeCaseNaming()` is applied as the last statement and all future entity column names will follow snake_case convention automatically (no manual `[Column]` or `[Table]` attributes needed).

4. **Given** an unhandled exception occurs in the backend, **when** the error reaches `ExceptionHandlingMiddleware`, **then** the response returns an `application/problem+json` body with `status`, `title`, and `detail` fields (Problem Details RFC 7807 format) and no stack traces are exposed to the caller (NFR6).

5. **Given** the `AppDbContext` is registered in DI, **when** `dotnet build SiesaAgents.sln` is executed, **then** all four Clean Architecture projects compile with zero errors, and `IApplicationDbContext` (interface in `SiesaAgents.Application`) is satisfied by `AppDbContext` (implementation in `SiesaAgents.Infrastructure`).

6. **Given** the backend starts with a valid `ConnectionStrings:DefaultConnection` in `appsettings.Development.json`, **when** the application launches via `dotnet run`, **then** EF Core successfully opens a connection to the PostgreSQL database without throwing at startup.

## Tasks / Subtasks

- [ ] Task 1 — Install EF Core NuGet packages and tools (AC: #1, #2)
  - [ ] 1.1 Add `Microsoft.EntityFrameworkCore` to `SiesaAgents.Infrastructure`: `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore`
  - [ ] 1.2 Add `Npgsql.EntityFrameworkCore.PostgreSQL` to `SiesaAgents.Infrastructure` (already added in Story 1.1 — verify it is present): `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [ ] 1.3 Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.Infrastructure` for migrations tooling: `dotnet add src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
  - [ ] 1.4 Add `EFCore.NamingConventions` to `SiesaAgents.Infrastructure` for `ApplySnakeCaseNaming()`: `dotnet add src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
  - [ ] 1.5 Install EF Core CLI tools globally if not present: `dotnet tool install --global dotnet-ef` (verify with `dotnet ef --version`)

- [ ] Task 2 — Create `IApplicationDbContext` interface in `SiesaAgents.Application` (AC: #5)
  - [ ] 2.1 Create `src/SiesaAgents.Application/Interfaces/IApplicationDbContext.cs` with a single `Task<int> SaveChangesAsync(CancellationToken cancellationToken)` method (no `DbSet<>` properties — those are added per epic)
  - [ ] 2.2 Add `Microsoft.EntityFrameworkCore` reference to `SiesaAgents.Application.csproj` only for the `CancellationToken` type (or use `System.Threading` only — keep Application layer free of heavy ORM dependencies using `DbSet` only in Infrastructure)

- [ ] Task 3 — Create `AppDbContext` in `SiesaAgents.Infrastructure` (AC: #3, #5, #6)
  - [ ] 3.1 Create `src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` implementing `DbContext` and `IApplicationDbContext`
  - [ ] 3.2 Constructor accepts `DbContextOptions<AppDbContext>` (standard EF Core DI pattern)
  - [ ] 3.3 Override `OnModelCreating(ModelBuilder modelBuilder)` — call `modelBuilder.ApplySnakeCaseNaming()` as the last statement (no other configuration at this stage — domain entities are added in Epics 2 and 3)
  - [ ] 3.4 Implement `SaveChangesAsync(CancellationToken cancellationToken)` delegating to `base.SaveChangesAsync(cancellationToken)`

  ```csharp
  // src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
  using Microsoft.EntityFrameworkCore;
  using SiesaAgents.Application.Interfaces;

  namespace SiesaAgents.Infrastructure.Data;

  public class AppDbContext(DbContextOptions<AppDbContext> options)
      : DbContext(options), IApplicationDbContext
  {
      public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
          => base.SaveChangesAsync(cancellationToken);

      protected override void OnModelCreating(ModelBuilder modelBuilder)
      {
          base.OnModelCreating(modelBuilder);
          // Domain entity configurations will be applied here in Epics 2 and 3
          // e.g.: modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
          modelBuilder.ApplySnakeCaseNaming(); // MUST be last
      }
  }
  ```

- [ ] Task 4 — Register EF Core and `AppDbContext` in DI (AC: #5, #6)
  - [ ] 4.1 In `src/SiesaAgents.API/Program.cs`, register `AppDbContext`:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
               .UseSnakeCaseNamingConvention());
    ```
  - [ ] 4.2 Register `IApplicationDbContext` → `AppDbContext` as scoped:
    ```csharp
    builder.Services.AddScoped<IApplicationDbContext, AppDbContext>();
    ```
  - [ ] 4.3 Add project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure` if not already present: `dotnet add src/SiesaAgents.API/SiesaAgents.API.csproj reference src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
  - [ ] 4.4 Add project reference from `SiesaAgents.Infrastructure` to `SiesaAgents.Application` if not already present

- [ ] Task 5 — Configure `appsettings.Development.json` connection string (AC: #6)
  - [ ] 5.1 Verify `appsettings.Development.json` in `src/SiesaAgents.API/` contains:
    ```json
    {
      "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Port=5432;Database=siesa_agents_db;Username=postgres;Password=postgres"
      }
    }
    ```
  - [ ] 5.2 Ensure `appsettings.Development.json` is NOT committed with real credentials — add a comment noting it must match local PostgreSQL setup
  - [ ] 5.3 Add `.gitignore` entry if `appsettings.Development.json` contains secrets (local-only config)

- [ ] Task 6 — Create the initial empty EF Core migration (AC: #1, #2)
  - [ ] 6.1 Run from the `backend/` directory:
    ```bash
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
  - [ ] 6.2 Verify the generated migration files (`InitialCreate.cs` and `InitialCreate.Designer.cs`) contain no `Up()` or `Down()` table operations — the migration body must be empty (no domain tables in this story)
  - [ ] 6.3 Verify `AppDbContextModelSnapshot.cs` is generated in `src/SiesaAgents.Infrastructure/Data/Migrations/`

- [ ] Task 7 — Apply migration and verify database creation (AC: #1)
  - [ ] 7.1 Run from `backend/` directory:
    ```bash
    dotnet ef database update \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API
    ```
  - [ ] 7.2 Verify `siesa_agents_db` database exists in local PostgreSQL
  - [ ] 7.3 Verify `__EFMigrationsHistory` table exists and has one row: `('InitialCreate', '<efcore-version>')`
  - [ ] 7.4 Verify NO `clientes` or `contactos` tables exist (scope boundary — those belong to Epics 2 and 3)

- [ ] Task 8 — Verify and harden `ExceptionHandlingMiddleware` (AC: #4)
  - [ ] 8.1 Open `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (created in Story 1.1 Task 4)
  - [ ] 8.2 Ensure the response body follows Problem Details RFC 7807 exactly:
    ```csharp
    await context.Response.WriteAsJsonAsync(new ProblemDetails
    {
        Status = 500,
        Title  = "An unexpected error occurred.",
        Detail = null  // NEVER expose ex.Message or stack trace
    });
    ```
  - [ ] 8.3 Set `context.Response.ContentType = "application/problem+json"` and `context.Response.StatusCode = 500` before writing
  - [ ] 8.4 Confirm middleware is registered in `Program.cs` before `app.UseCors()` and route mappings

- [ ] Task 9 — Write xUnit unit tests (AC: #3, #4, #5)
  - [ ] 9.1 Create `tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
    - Test: `OnModelCreating_AppliesSnakeCaseNaming` — use EF Core InMemory provider; verify `modelBuilder.ApplySnakeCaseNaming()` is called (test via column name convention inspection)
  - [ ] 9.2 Create `tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`
    - Test: `InvokeAsync_WhenExceptionThrown_ReturnsProblemDetails` — use `DefaultHttpContext`, inject a `RequestDelegate` that throws, assert response status 500, `Content-Type: application/problem+json`, and body does not contain stack trace
  - [ ] 9.3 Add `Microsoft.EntityFrameworkCore.InMemory` to `SiesaAgents.UnitTests`: `dotnet add tests/SiesaAgents.UnitTests package Microsoft.EntityFrameworkCore.InMemory`
  - [ ] 9.4 Verify all tests pass: `dotnet test tests/SiesaAgents.UnitTests`

## Dev Notes

### Architecture Context

This story wires the persistence layer on top of the solution scaffold from Story 1.1. No domain entities (`ClienteEntity`, `ContactoEntity`) are defined here — those belong to Epics 2 and 3 respectively. The `AppDbContext` is intentionally empty of `DbSet<>` properties at this stage.

The story is backend-only. No frontend changes are required.

### Critical Implementation Rules

- **`DateTimeOffset` always** — `DateTime` is forbidden in all entities and DTOs. Audit fields (`CreatedAt`, `UpdatedAt`) added in future entities must use `DateTimeOffset`.
- **UUID primary keys** — All future entities must declare `public Guid Id { get; protected set; } = Guid.NewGuid();` — enforced via the `Entity` base class pattern.
- **`ApplySnakeCaseNaming()` MUST be last** in `OnModelCreating`. If `ApplyConfigurationsFromAssembly()` is called later (Epics 2/3), it must appear BEFORE `ApplySnakeCaseNaming()`.
- **NO `[Column]` or `[Table]` attributes** on any entity — naming is handled automatically by `EFCore.NamingConventions`.
- **Scalar only** — do NOT add Swagger/Swashbuckle. `app.MapScalarApiReference()` is already registered from Story 1.1.
- **Problem Details RFC 7807** — `ExceptionHandlingMiddleware` must never expose `ex.Message` or stack traces.

### EF Core + PostgreSQL Stack

| Package | Version | Purpose |
|---------|---------|---------|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.x | EF Core PostgreSQL provider |
| `EFCore.NamingConventions` | latest | `ApplySnakeCaseNaming()` extension |
| `Microsoft.EntityFrameworkCore.Design` | 10.x | `dotnet ef migrations` tooling |
| `Microsoft.EntityFrameworkCore.InMemory` | 10.x | xUnit in-memory testing |

### `AppDbContext` — Future Extension Points

When Epics 2 and 3 add domain entities, they must:
1. Add `DbSet<ClienteEntity> Clientes { get; set; }` / `DbSet<ContactoEntity> Contactos { get; set; }` to `AppDbContext`.
2. Add `IEntityTypeConfiguration<T>` files under `src/SiesaAgents.Infrastructure/Data/Configurations/`.
3. Call `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)` BEFORE `modelBuilder.ApplySnakeCaseNaming()`.
4. Run a new migration: `dotnet ef migrations add <MigrationName> --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`.

### `IApplicationDbContext` Design

The interface in `SiesaAgents.Application` intentionally has only `SaveChangesAsync` at this stage. `DbSet<>` properties are added to the interface as each domain epic is implemented. This keeps Application layer decoupled from Infrastructure — command/query handlers depend only on the interface.

```csharp
// src/SiesaAgents.Application/Interfaces/IApplicationDbContext.cs
namespace SiesaAgents.Application.Interfaces;

public interface IApplicationDbContext
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

### Migration Commands Reference

```bash
# From backend/ directory
# Add migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Data/Migrations

# Apply to database
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Rollback to clean state (if needed)
dotnet ef database drop \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Database Connection

- **Database name:** `siesa_agents_db`
- **Default local credentials:** `Host=localhost;Port=5432;Username=postgres;Password=postgres`
- **Schema:** Default `public` schema (no custom schema for MVP)
- **PostgreSQL version required:** 18+

### Scope Boundary (CRITICAL)

This story creates an empty `InitialCreate` migration with NO domain tables. The migration `Up()` and `Down()` methods must be empty bodies. Do NOT define `ClienteEntity` or `ContactoEntity` in this story.

- `clientes` table → Epic 2, Story 2.1
- `contactos` table → Epic 3, Story 3.1

### Project Structure — Files Touched in This Story

```
backend/
└── src/
    ├── SiesaAgents.API/
    │   └── Program.cs                           [MODIFIED — DI registration of DbContext]
    ├── SiesaAgents.Application/
    │   └── Interfaces/
    │       └── IApplicationDbContext.cs         [NEW]
    └── SiesaAgents.Infrastructure/
        ├── SiesaAgents.Infrastructure.csproj    [MODIFIED — NuGet packages]
        └── Data/
            ├── AppDbContext.cs                  [NEW]
            └── Migrations/
                ├── <timestamp>_InitialCreate.cs         [NEW — auto-generated, empty]
                ├── <timestamp>_InitialCreate.Designer.cs [NEW — auto-generated]
                └── AppDbContextModelSnapshot.cs         [NEW — auto-generated]
tests/
└── SiesaAgents.UnitTests/
    ├── SiesaAgents.UnitTests.csproj             [MODIFIED — InMemory package]
    └── Infrastructure/
        └── AppDbContextTests.cs                 [NEW]
    └── API/
        └── ExceptionHandlingMiddlewareTests.cs  [NEW]
```

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3`] — acceptance criteria and scope note
- [Source: `_bmad-output/planning-artifacts/architecture.md#Data Architecture`] — `AppDbContext.cs`, `ApplySnakeCaseNaming()`, migration folder location
- [Source: `_bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure`] — backend folder tree with `Data/`, `Configurations/`, `Migrations/`
- [Source: `_bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions`] — EF Core 10 + PostgreSQL 18+, UUID PKs, DateTimeOffset
- [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`] — Problem Details RFC 7807, NFR6
- [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`] — `ApplySnakeCaseNaming()` must be last, no Swagger
- [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack`] — .NET 10, EF Core 10, PostgreSQL 18+, xUnit
- [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions`] — snake_case tables/columns, UUID PKs, no manual `[Column]` attributes
- [Source: `.claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules`] — Guid PKs, DateTimeOffset, Entity pattern
- [Source: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Tasks`] — `ExceptionHandlingMiddleware` created in Task 4, `appsettings.Development.json` connection string placeholder in Task 5

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
