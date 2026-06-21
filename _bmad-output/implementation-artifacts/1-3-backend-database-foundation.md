# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory (or `src/SiesaAgents.Infrastructure/`), **Then** the `siesa_agents_db` database is created with no errors, and an EF Core `Migrations/` folder exists under `backend/src/SiesaAgents.Infrastructure/`.

2. **Given** `siesa_agents_db` has been created via migration, **When** a developer inspects the `__ef_migrations_history` table columns, **Then** all column names are lowercase snake_case (`migration_id`, `product_version`) — confirming `ApplySnakeCaseNaming()` is active.

3. **Given** an unhandled exception occurs in the backend, **When** the error reaches `ExceptionHandlingMiddleware`, **Then** the response has `Content-Type: application/problem+json`, returns HTTP 500, and the JSON body contains `status`, `title`, and `detail` fields with NO `stackTrace`, `exception`, or `innerException` keys exposed to the client. (NFR6)

4. **Given** the backend receives any request, **When** entities are mapped by EF Core, **Then** `modelBuilder.ApplySnakeCaseNaming()` is the LAST call inside `OnModelCreating`, and no `[Column]` or `[Table]` attributes exist on domain entities.

5. **Given** the `AppDbContext` is registered in DI, **When** the API starts, **Then** the connection string `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` is read from `appsettings.Development.json` under `ConnectionStrings:DefaultConnection`, and the backend starts without database-related errors.

6. **Given** the solution has all four Clean Architecture projects, **When** `dotnet build SiesaAgents.sln` is run, **Then** all projects compile with zero errors, including `SiesaAgents.Infrastructure` with its EF Core and Npgsql packages.

## Tasks / Subtasks

- [ ] Task 1 - Configure `AppDbContext` in `SiesaAgents.Infrastructure` (AC: #1, #2, #4, #5)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — inherits `DbContext`, constructor accepts `DbContextOptions<AppDbContext>`, overrides `OnModelCreating` with `modelBuilder.ApplySnakeCaseNaming()` as the LAST call (no other model configuration in this story — no entity DbSets yet)
  - [ ] Ensure `AppDbContext.cs` has the namespace `SiesaAgents.Infrastructure.Data`
  - [ ] Do NOT add `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` — scope note: domain tables belong to Epics 2 and 3

- [ ] Task 2 - Add EF Core Design package and register `AppDbContext` in DI (AC: #5, #6)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.Infrastructure.csproj` (required for `dotnet ef` CLI tooling)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, register `AppDbContext` with `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))` after existing service registrations
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
  - [ ] Verify `appsettings.Development.json` already contains `ConnectionStrings:DefaultConnection` (it does — already set in Story 1.1)

- [ ] Task 3 - Create initial EF Core migration (AC: #1, #2)
  - [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from the `backend/` directory
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Migrations/` folder is created containing the initial migration files (`*_InitialCreate.cs`, `AppDbContextModelSnapshot.cs`)
  - [ ] The migration should contain an empty `Up()` and `Down()` (no tables — only infrastructure scaffold)
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to apply migration and create `siesa_agents_db`

- [ ] Task 4 - Write xUnit integration test for Problem Details middleware (AC: #3)
  - [ ] Add `Microsoft.AspNetCore.Mvc.Testing` package to `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj`
  - [ ] Add project reference to `SiesaAgents.API` in the test project csproj
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/ExceptionHandlingMiddlewareTests.cs`
  - [ ] Register a test-only endpoint `GET /api/v1/test-error` that throws `new Exception("internal test")` via `WebApplicationFactory` custom configuration
  - [ ] Assert: HTTP 500 response, `Content-Type` is `application/problem+json`, body contains `status` and `title` fields
  - [ ] Assert: body does NOT contain `stackTrace`, `exception`, or `innerException` keys
  - [ ] Test class follows Arrange / Act / Assert pattern (xUnit company standard)

- [ ] Task 5 - Write xUnit integration test for EF Core database creation (AC: #1, #2)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/DatabaseMigrationTests.cs`
  - [ ] Use `WebApplicationFactory<Program>` with a test PostgreSQL connection string (or `TestContainers` if available) pointing to `siesa_agents_db_test`
  - [ ] Assert: `siesa_agents_db` (or test DB) is created after `dbContext.Database.MigrateAsync()`
  - [ ] Assert: `__ef_migrations_history` table exists in the database
  - [ ] Assert: columns in `__ef_migrations_history` are snake_case (`migration_id`, `product_version`)
  - [ ] Clean up (drop) test database in `IAsyncLifetime.DisposeAsync` to keep tests idempotent

- [ ] Task 6 - Verify full solution build (AC: #6)
  - [ ] Run `dotnet build SiesaAgents.sln` from `backend/` and confirm exit code 0 with zero errors
  - [ ] Run `dotnet test tests/SiesaAgents.UnitTests` and confirm all new tests pass

## Dev Notes

### Architecture Decisions Applied

- **No domain entities in this story**: `AppDbContext` is created with an empty `OnModelCreating` (only `ApplySnakeCaseNaming()`). `ClienteEntity` and `ContactoEntity` are added in Epics 2 and 3 respectively — this is a hard scope constraint from the epic.
- **`ApplySnakeCaseNaming()` placement**: MUST be the LAST call in `OnModelCreating`. Any future entity configurations (added in later stories) go BEFORE this call to ensure snake_case is applied on top of all other configurations.
- **EF Core Design package**: Required only for `dotnet ef` CLI tooling at design-time; add it as a `<PackageReference>` in `SiesaAgents.Infrastructure.csproj`.
- **Connection string source**: `appsettings.Development.json` (already contains `ConnectionStrings:DefaultConnection` from Story 1.1 implementation). Never hardcode connection strings.
- **Problem Details middleware**: `ExceptionHandlingMiddleware` already exists and is registered BEFORE `UseCors` in `Program.cs` (Story 1.1). This story adds tests to validate it — the middleware code itself may need minor verification against AC #3 (currently `Detail = null`; keep it null to avoid exposing exception messages).

### File Structure

```
backend/
  src/
    SiesaAgents.Infrastructure/
      Data/
        AppDbContext.cs              # NEW — DbContext with ApplySnakeCaseNaming()
      Migrations/                    # NEW — created by dotnet ef migrations add
        *_InitialCreate.cs
        AppDbContextModelSnapshot.cs
      SiesaAgents.Infrastructure.csproj  # MODIFIED — add EF Core Design package
    SiesaAgents.API/
      Program.cs                     # MODIFIED — register AppDbContext in DI
  tests/
    SiesaAgents.UnitTests/
      Infrastructure/
        ExceptionHandlingMiddlewareTests.cs  # NEW
        DatabaseMigrationTests.cs            # NEW
      SiesaAgents.UnitTests.csproj           # MODIFIED — add Mvc.Testing + API ref
```

### Key Implementation Patterns

**AppDbContext (`SiesaAgents.Infrastructure.Data`):**

```csharp
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSets in this story — added in Epics 2 and 3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Future entity configurations go HERE (before snake_case)

        modelBuilder.ApplySnakeCaseNaming(); // MUST be last
    }
}
```

**DI registration in `Program.cs`:**

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

**EF Core migration commands (run from `backend/`):**

```bash
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

**ExceptionHandlingMiddleware test skeleton:**

```csharp
public class ExceptionHandlingMiddlewareTests : IClassFixture<WebApplicationFactory<Program>>
{
    // Arrange: factory.WithWebHostBuilder(builder => builder.Configure(app =>
    //   app.MapGet("/api/v1/test-error", () => { throw new Exception("test"); })))
    // Act: GET /api/v1/test-error
    // Assert: 500, Content-Type = application/problem+json,
    //         body has status/title, NO stackTrace key
}
```

### Company Standards Enforced

- **UUID PKs**: No PKs defined in this story — relevant for Epic 2+ entity definitions.
- **DateTimeOffset**: No timestamps in this story — relevant for Epic 2+ entity definitions.
- **snake_case via `ApplySnakeCaseNaming()`**: Applied in `AppDbContext.OnModelCreating` — confirms `__ef_migrations_history` columns become snake_case.
- **No `[Column]` / `[Table]` attributes**: EF Core auto-converts via `ApplySnakeCaseNaming()`.
- **No Swagger**: `Program.cs` already uses `app.MapScalarApiReference()` — verify it remains unchanged.
- **Problem Details RFC 7807**: `ExceptionHandlingMiddleware` already conforms; tests validate it.
- **Error format**: `Content-Type: application/problem+json` with `status`, `title`, `detail` — no stack trace.

### Test Cases Covered (from test-design-epic-1.md)

| Test Case | Description | AC |
|-----------|-------------|-----|
| TC-E1-P0-05 | ExceptionHandlingMiddleware returns Problem Details RFC 7807 | AC #3 |
| TC-E1-P1-05 | EF Core migration creates `siesa_agents_db` and migrations table | AC #1 |
| TC-E1-P2-04 | snake_case column naming via `ApplySnakeCaseNaming()` | AC #2 |
| TC-E1-P1-06 | Solution build succeeds | AC #6 |

### Scope Note (Critical)

> This story creates an **empty initial migration** — no domain tables. The `clientes` table is created in Epic 2 Story 2.1. The `contactos` table is created in Epic 3 Story 3.1. Do NOT define `ClienteEntity` or `ContactoEntity` here. The `Migrations/` folder and `AppDbContext` class are the deliverables.

### References

- Architecture document: [Source: _bmad-output/planning-artifacts/architecture.md — Backend folder structure, Database Conventions, Implementation Patterns]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Test design: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md — TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04]
- Company standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md — Backend Stack, Database Conventions, EF Core snake_case]
- Story 1.1 implementation notes: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md — ExceptionHandlingMiddleware already registered, appsettings.Development.json already has connection string]
- Existing `Program.cs`: [Source: backend/src/SiesaAgents.API/Program.cs — middleware ordering, existing registrations]
- Existing `ExceptionHandlingMiddleware.cs`: [Source: backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs]
- Existing `SiesaAgents.Infrastructure.csproj`: [Source: backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj — Npgsql.EF already present]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
