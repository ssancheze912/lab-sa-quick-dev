# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors, **And** the EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/` with at least an initial migration file.

2. **Given** `AppDbContext.OnModelCreating` is configured, **When** EF Core generates the schema, **Then** `modelBuilder.ApplySnakeCaseNaming()` is the last call in `OnModelCreating`, **And** all future column names follow snake_case convention without any manual `[Column]` or `[Table]` attributes on entities.

3. **Given** an unhandled exception occurs in the backend (e.g., a database connection failure), **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with HTTP 500, **And** no stack trace or `ex.Message` is exposed in the response body (NFR6).

4. **Given** the backend is running with a valid connection string in `appsettings.Development.json`, **When** `AppDbContext` is resolved from the DI container, **Then** the context can be instantiated without errors and the connection to `siesa_agents_db` is verified via `context.Database.CanConnect()` returning `true`.

5. **Given** `AppDbContext` is registered in `Program.cs`, **When** `dotnet build SiesaAgents.sln` is executed, **Then** the build succeeds with zero errors, **And** `SiesaAgents.Infrastructure` references `Npgsql.EntityFrameworkCore.PostgreSQL`.

6. **Given** `dotnet ef migrations add InitialCreate` is run, **When** the migration is applied, **Then** the generated migration SQL contains no domain tables (no `clientes` or `contactos` tables) — this migration establishes the EF Core infrastructure only.

## Tasks / Subtasks

- [ ] Task 1 — Create `AppDbContext` in `SiesaAgents.Infrastructure` (AC: #2, #4, #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` extending `DbContext`
  - [ ] Constructor accepts `DbContextOptions<AppDbContext>` — standard EF Core DI pattern
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` and call `modelBuilder.ApplySnakeCaseNaming()` as the last line
  - [ ] Do NOT define any `DbSet<>` properties for domain entities in this story — this story only establishes the infrastructure. `ClienteEntity` and `ContactoEntity` are added in Epic 2 and Epic 3 respectively.
  - [ ] Add NuGet package reference if not already present: `dotnet add backend/src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [ ] Add NuGet package for snake_case naming: `dotnet add backend/src/SiesaAgents.Infrastructure package EFCore.NamingConventions`

- [ ] Task 2 — Register `AppDbContext` in `Program.cs` (AC: #4, #5)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add `builder.Services.AddDbContext<AppDbContext>` using `Npgsql` provider
  - [ ] Read connection string from `builder.Configuration.GetConnectionString("DefaultConnection")`
  - [ ] Add project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure`: `dotnet add backend/src/SiesaAgents.API reference backend/src/SiesaAgents.Infrastructure`
  - [ ] Add project reference from `SiesaAgents.Infrastructure` to `SiesaAgents.Application`: `dotnet add backend/src/SiesaAgents.Infrastructure reference backend/src/SiesaAgents.Application`
  - [ ] Add project reference from `SiesaAgents.Application` to `SiesaAgents.Domain`: `dotnet add backend/src/SiesaAgents.Application reference backend/src/SiesaAgents.Domain`
  - [ ] Verify `builder.Services.AddDbContext<AppDbContext>` call compiles after adding `using SiesaAgents.Infrastructure.Data;`

- [ ] Task 3 — Verify `ExceptionHandlingMiddleware` handles DB errors (AC: #3)
  - [ ] Confirm `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` already exists (created in Story 1.1)
  - [ ] Add specific catch for `NpgsqlException` (PostgreSQL connection errors) — return HTTP 503 with Problem Details `title: "Database unavailable"` and `detail: null` (never expose raw exception message)
  - [ ] Confirm the existing catch-all `Exception` block returns HTTP 500 Problem Details with no stack trace
  - [ ] Register middleware is already done in `Program.cs` (`app.UseMiddleware<ExceptionHandlingMiddleware>()`) — verify it remains before `app.UseCors()` and endpoint mapping

- [ ] Task 4 — Configure connection string in `appsettings.Development.json` (AC: #4)
  - [ ] Verify `backend/src/SiesaAgents.API/appsettings.Development.json` already has `ConnectionStrings:DefaultConnection` (created in Story 1.1): `"Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"`
  - [ ] If missing, add it now. Do NOT change other settings (AllowedOrigins, Logging).

- [ ] Task 5 — Create and apply the initial EF Core migration (AC: #1, #6)
  - [ ] Install EF Core tools if not present: `dotnet tool install --global dotnet-ef`
  - [ ] From `backend/` directory, run: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Migrations/` folder is created with `{timestamp}_InitialCreate.cs` and snapshot files
  - [ ] Inspect the generated migration `Up()` method — it must be empty (no `CreateTable` calls since no `DbSet<>` is defined yet)
  - [ ] Run: `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify `siesa_agents_db` is created in PostgreSQL with the `__EFMigrationsHistory` table populated

- [ ] Task 6 — Write unit and integration tests (AC: #1, #3, #4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
    - [ ] Test: `AppDbContext_OnModelCreating_AppliesSnakeCaseNaming` — instantiate context with InMemory provider, verify `modelBuilder.ApplySnakeCaseNaming()` is invoked (check via Model metadata or mock)
    - [ ] Test: `AppDbContext_CanBeInstantiated_WithValidOptions` — verify context construction succeeds with `DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase("test").Options`
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareDbTests.cs`
    - [ ] Test: `NpgsqlException_Returns503_WithProblemDetails` — simulate middleware catching `NpgsqlException`, assert HTTP 503 and `application/problem+json` content type
    - [ ] Test: `GenericException_Returns500_NeverExposesMessage` — verify Problem Details `detail` is null (not ex.Message)
  - [ ] All tests follow Arrange / Act / Assert structure
  - [ ] Tests use `xUnit` — no other test frameworks

## Dev Notes

### AppDbContext Pattern

The `AppDbContext` for this story is intentionally minimal — it is the infrastructure foundation with no domain `DbSet<>` properties. Domain entity sets are added in subsequent epics.

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet properties are added per story (Epic 2: ClienteEntity, Epic 3: ContactoEntity)
    // DO NOT add ClienteEntity or ContactoEntity here.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Entity configurations are applied here in future stories:
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        
        // MUST be the LAST call in OnModelCreating per company standards
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
```

> Note: `ApplySnakeCaseNaming()` is the method defined by `EFCore.NamingConventions` package as `UseSnakeCaseNamingConvention()`. Confirm the exact method name from the installed package version. Architecture doc references `modelBuilder.ApplySnakeCaseNaming()` — verify against `EFCore.NamingConventions` NuGet documentation.

### DbContext Registration in Program.cs

```csharp
// backend/src/SiesaAgents.API/Program.cs — add after existing service registrations
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

The `DefaultConnection` value from `appsettings.Development.json` (already created in Story 1.1):
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
}
```

### EF Core Migration Commands

All migration commands must be run from the `backend/` directory with explicit project flags:

```bash
# Add migration (run from backend/ folder)
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration to database (PostgreSQL must be running)
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

The `SiesaAgents.Infrastructure` project must reference `Microsoft.EntityFrameworkCore.Design` (included transitively via `Npgsql.EntityFrameworkCore.PostgreSQL`) for migration tooling to work.

### NpgsqlException Handling in ExceptionHandlingMiddleware

```csharp
// ExceptionHandlingMiddleware.cs — extend existing catch block
catch (NpgsqlException)
{
    context.Response.ContentType = "application/problem+json";
    context.Response.StatusCode = 503;
    await context.Response.WriteAsync(JsonSerializer.Serialize(new ProblemDetails
    {
        Status = 503,
        Title = "Database unavailable.",
        Detail = null   // NEVER expose connection string details or exception message
    }));
}
catch (Exception)
{
    context.Response.ContentType = "application/problem+json";
    context.Response.StatusCode = 500;
    await context.Response.WriteAsync(JsonSerializer.Serialize(new ProblemDetails
    {
        Status = 500,
        Title = "An unexpected error occurred.",
        Detail = null
    }));
}
```

Add `using Npgsql;` at the top of the middleware file.

### Database Conventions (Critical)

Per company standards and architecture.md — ALL entities in this project MUST follow:

| Requirement | Rule |
|-------------|------|
| Primary Keys | `Guid` (UUID) — `public Guid Id { get; protected set; } = Guid.NewGuid()` |
| Timestamps | `DateTimeOffset` ALWAYS — NEVER `DateTime` |
| Column naming | snake_case via `UseSnakeCaseNamingConvention()` — NO manual `[Column]` attributes |
| Table naming | Plural snake_case inferred from entity class name via EFCore.NamingConventions |
| FK columns | `{entity_name}_id` pattern — auto-mapped by EFCore.NamingConventions |

This story does NOT create any entity tables. The snake_case convention is established here so all future entities automatically inherit it.

### Project Reference Graph

After this story, the dependency graph must be:

```
SiesaAgents.API
  → SiesaAgents.Application  → SiesaAgents.Domain
  → SiesaAgents.Infrastructure → SiesaAgents.Domain
                               → SiesaAgents.Application (optional, for validators)

SiesaAgents.UnitTests → SiesaAgents.Application + SiesaAgents.Domain + SiesaAgents.Infrastructure
```

Dependencies always point inward (Clean Architecture rule). Domain has ZERO external dependencies.

### Story Scope Boundary (CRITICAL)

- **DO NOT** define `ClienteEntity` or `ContactoEntity` in this story — those belong to Epic 2 Story 2.1 and Epic 3 Story 3.1 respectively.
- **DO NOT** create `IClienteRepository` or `IContactoRepository` interfaces.
- **DO NOT** create `Configurations/ClienteConfiguration.cs` or `Configurations/ContactoConfiguration.cs`.
- **DO** create the `Configurations/` folder as an empty placeholder for future stories.
- The initial migration's `Up()` method MUST be empty (or contain only infrastructure setup, not domain tables).

### Testing Approach

```csharp
// AppDbContextTests.cs — Arrange / Act / Assert pattern
[Fact]
public void AppDbContext_CanBeInstantiated_WithInMemoryProvider()
{
    // Arrange
    var options = new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(databaseName: "TestDb_" + Guid.NewGuid())
        .Options;
    
    // Act
    using var context = new AppDbContext(options);
    
    // Assert
    Assert.NotNull(context);
}
```

For `NpgsqlException` middleware tests, use `WebApplicationFactory` or direct `HttpContext` mocking — do not require a live PostgreSQL instance for unit tests.

### Project Structure Notes

Files created or modified in this story:

```
backend/src/SiesaAgents.Infrastructure/
├── Data/
│   └── AppDbContext.cs                          ← NEW
│   └── Configurations/                          ← NEW (empty folder, future entity configs)
├── Migrations/                                  ← NEW (generated by dotnet-ef)
│   ├── {timestamp}_InitialCreate.cs
│   ├── {timestamp}_InitialCreate.Designer.cs
│   └── AppDbContextModelSnapshot.cs

backend/src/SiesaAgents.API/
├── Program.cs                                   ← MODIFIED (add AddDbContext registration)
└── Middleware/
    └── ExceptionHandlingMiddleware.cs           ← MODIFIED (add NpgsqlException catch)

backend/tests/SiesaAgents.UnitTests/
└── Infrastructure/
    └── AppDbContextTests.cs                     ← NEW
└── Middleware/
    └── ExceptionHandlingMiddlewareDbTests.cs    ← NEW
```

Alignment with the full project directory structure defined in `architecture.md#Complete Project Directory Structure`.

### References

- Database conventions (snake_case, UUID PKs, DateTimeOffset): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- EF Core `ApplySnakeCaseNaming()` rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- Backend stack (.NET 10, EF Core 10, Npgsql, PostgreSQL 18+): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack]
- Problem Details RFC 7807 requirement (NFR6): [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- `AppDbContext` location: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Story AC and scope note: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- `ExceptionHandlingMiddleware` pattern (Story 1.1 baseline): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- PostgreSQL DB name `siesa_agents_db`: [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- Backend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Folder Structure (.NET Solution)]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
