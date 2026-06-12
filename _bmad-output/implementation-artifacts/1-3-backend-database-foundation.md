# Story 1.3: Backend Database Foundation

Status: ready

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors, and the `__ef_migrations_history` table exists in snake_case (confirming `ApplySnakeCaseNaming()` is active).

2. **Given** the initial migration is applied, **When** the developer inspects the database, **Then** no domain tables (`clientes`, `contactos`) exist — the migration is intentionally empty. Only `__ef_migrations_history` is present.

3. **Given** an unhandled exception occurs anywhere in the backend request pipeline, **When** the error reaches the `ExceptionHandlingMiddleware`, **Then** the response returns `Content-Type: application/problem+json`, HTTP status 500, and a JSON body containing `status`, `title`, and `detail` fields — with NO `stackTrace`, `exception`, or `innerException` keys exposed (NFR6).

4. **Given** the backend receives any request, **When** EF Core maps entities to the database, **Then** `modelBuilder.ApplySnakeCaseNaming()` is the LAST call inside `OnModelCreating` in `AppDbContext`, ensuring all current and future column names follow snake_case convention.

5. **Given** the solution is configured, **When** the developer runs `dotnet build SiesaAgents.sln` from `backend/`, **Then** all projects compile with zero errors and `SiesaAgents.Infrastructure` references `Npgsql.EntityFrameworkCore.PostgreSQL` and `Microsoft.EntityFrameworkCore.Design`.

## Tasks / Subtasks

- [ ] Task 1 — Configure `AppDbContext` with EF Core + PostgreSQL (AC: #1, #4)
  - [ ] Open `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` (created in Story 1.1 as a stub)
  - [ ] Inject `DbContextOptions<AppDbContext>` via constructor: `public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}`
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` — call `modelBuilder.ApplySnakeCaseNaming()` as the LAST line
  - [ ] Do NOT define any `DbSet<>` properties in this story — domain entity sets are added in Epics 2 and 3

- [ ] Task 2 — Register `AppDbContext` in DI and configure connection string (AC: #1, #5)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
  - [ ] Ensure `appsettings.Development.json` contains:
    ```json
    {
      "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
      }
    }
    ```
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`

- [ ] Task 3 — Add EF Core Design + Tools packages to Infrastructure project (AC: #5)
  - [ ] In `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`, confirm or add:
    - `Npgsql.EntityFrameworkCore.PostgreSQL` (already declared in Story 1.1)
    - `Microsoft.EntityFrameworkCore.Design` (required for `dotnet ef migrations`)
  - [ ] In `backend/src/SiesaAgents.API/SiesaAgents.API.csproj`, add `Microsoft.EntityFrameworkCore.Design` as a development dependency (needed for migration tooling targeting the API startup project)

- [ ] Task 4 — Create the initial empty EF Core migration (AC: #1, #2)
  - [ ] From `backend/`, run:
    ```bash
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created with `*_InitialCreate.cs` and `AppDbContextModelSnapshot.cs`
  - [ ] Confirm the migration `Up()` and `Down()` methods are empty (no domain tables created in this story)
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to apply the migration

- [ ] Task 5 — Verify `ExceptionHandlingMiddleware` conforms to Problem Details RFC 7807 (AC: #3)
  - [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (created in Story 1.1)
  - [ ] Confirm the `catch` block sets:
    - `context.Response.ContentType = "application/problem+json";`
    - `context.Response.StatusCode = 500;`
    - Body: `{ status: 500, title: "An unexpected error occurred.", detail: null }` — NEVER expose `ex.Message` or stack traces
  - [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is registered BEFORE `app.MapScalarApiReference()` and any endpoint mappings in `Program.cs`

- [ ] Task 6 — Write xUnit integration tests (AC: #1, #2, #3, #4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`:
    - TC-E1-P2-04: Assert `OnModelCreating` calls `ApplySnakeCaseNaming()` — verify by inspecting the model for snake_case column names using EF Core `InMemory` provider or by asserting the model metadata
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs`:
    - TC-E1-P0-05: Register a test endpoint that throws `new Exception("internal test")`, call via `WebApplicationFactory<Program>`, assert HTTP 500, `Content-Type: application/problem+json`, response body contains `status` and `title` keys, and does NOT contain `stackTrace` or `innerException`
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/MigrationSnakeCaseTests.cs` (optional / P2):
    - TC-E1-P2-04: After applying migrations to TestContainers Postgres, query `information_schema.columns` for `__ef_migrations_history` and verify column names are `migration_id`, `product_version`

## Dev Notes

### Backend Stack for This Story

- **ORM:** EF Core 10 (primary — standard CRUD, DDD entity tracking per company standards)
- **Provider:** `Npgsql.EntityFrameworkCore.PostgreSQL`
- **Database:** PostgreSQL 18+ — database name `siesa_agents_db`
- **Naming:** `ApplySnakeCaseNaming()` MANDATORY as LAST call in `OnModelCreating` — NO manual `[Column]`/`[Table]` attributes

### AppDbContext Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet<> properties are added in subsequent stories (Epics 2 and 3).
    // DO NOT define ClienteEntity or ContactoEntity here.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply entity type configurations (none in this story)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be the LAST call — converts all PascalCase entity/property names to snake_case
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

### DI Registration Pattern in Program.cs

```csharp
// Add after builder.Services.AddCors(...)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions => npgsqlOptions.MigrationsAssembly("SiesaAgents.Infrastructure")));
```

### ExceptionHandlingMiddleware — Confirmed Pattern from Story 1.1

```csharp
// backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (Exception)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null   // NEVER expose ex.Message or stack traces (NFR6)
            });
        }
    }
}
```

**Middleware ordering in Program.cs (CRITICAL):**

```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>(); // FIRST — catches all downstream exceptions
app.UseCors("DevCors");
app.MapScalarApiReference();
// ... endpoint mappings in subsequent stories
app.Run();
```

### Migration Tooling Notes

- Migration tooling requires `Microsoft.EntityFrameworkCore.Design` in the startup project (`SiesaAgents.API`) or the project that runs the migration tool target.
- Use `--startup-project` flag pointing to `SiesaAgents.API` so the tool can resolve `Program.cs` DI configuration.
- Use `--output-dir Data/Migrations` to place migrations under `SiesaAgents.Infrastructure/Data/Migrations/` (consistent with architecture.md structure).
- The initial migration `Up()` must be empty — scope note: `ClienteEntity` and `ContactoEntity` are NOT created in this story.

### Scope Note (From Epic Definition)

This story creates an empty initial migration — no domain tables. The `clientes` table is created in Epic 2 Story 2.1. The `contactos` table is created in Epic 3 Story 3.1. Do NOT define `ClienteEntity` or `ContactoEntity` in this story.

### Primary Key and Timestamp Standards (For Reference in Future Stories)

Although no entities are created here, all future entities MUST follow:

```csharp
// From company standards — apply in Epics 2+
public abstract class Entity
{
    public Guid Id { get; protected set; } = Guid.NewGuid(); // UUID PK — MANDATORY
}
// DateTimeOffset for ALL timestamps — NEVER DateTime
public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
```

### csproj Package References

`SiesaAgents.Infrastructure.csproj` must include:

```xml
<PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="10.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
```

### Test Cases Covered by This Story

| Test ID | Description | Level | Priority |
|---------|-------------|-------|----------|
| TC-E1-P0-05 | ExceptionHandlingMiddleware returns Problem Details RFC 7807 on unhandled exception | API Integration (xUnit) | P0 |
| TC-E1-P1-05 | EF Core migration creates `siesa_agents_db` and `__ef_migrations_history` | API Integration (xUnit + TestContainers) | P1 |
| TC-E1-P2-04 | `ApplySnakeCaseNaming()` produces snake_case column names | API Integration | P2 |

### Files Modified from Story 1.1

- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — replace stub with full `DbContext` implementation
- `backend/src/SiesaAgents.API/Program.cs` — add `AddDbContext<AppDbContext>()` registration
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — add `Microsoft.EntityFrameworkCore.Design`
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — add `Microsoft.EntityFrameworkCore.Design`

### References

- Architecture data model and EF Core conventions: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Snake_case naming convention: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- EF Core naming enforcement: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case]
- Problem Details NFR: [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- ExceptionHandlingMiddleware pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Test cases for this story: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04]
- Scope note (no domain tables): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Company stack standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

(to be filled during implementation)

### Completion Notes List

(to be filled during implementation)

### File List

#### Backend

- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — EF Core DbContext with `ApplySnakeCaseNaming()` as last call in `OnModelCreating`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/*_InitialCreate.cs` — empty initial migration
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/AppDbContextModelSnapshot.cs` — EF Core model snapshot
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — updated with `Microsoft.EntityFrameworkCore.Design`
- `backend/src/SiesaAgents.API/Program.cs` — updated with `AddDbContext<AppDbContext>()` registration
- `backend/src/SiesaAgents.API/SiesaAgents.API.csproj` — updated with `Microsoft.EntityFrameworkCore.Design`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — verified/confirmed from Story 1.1 (Problem Details RFC 7807, no stack trace exposure)
- `backend/tests/SiesaAgents.UnitTests/Middleware/ExceptionHandlingMiddlewareTests.cs` — xUnit test for TC-E1-P0-05
- `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs` — xUnit test for TC-E1-P2-04
