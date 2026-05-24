# Story 1.3: Backend Database Foundation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors and the `__EFMigrationsHistory` table is present.

2. **Given** the EF Core tooling is set up, **When** the migrations folder is inspected, **Then** an initial migration file exists under `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` representing an empty schema (no domain tables).

3. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with status code 500 and no stack traces or raw exception messages exposed (NFR6).

4. **Given** the backend receives any request, **When** the request is processed and EF Core maps entities to the database, **Then** `ApplySnakeCaseNaming()` is called last in `OnModelCreating` and all column/table names follow snake_case convention in PostgreSQL.

5. **Given** `appsettings.Development.json` has a valid `ConnectionStrings:DefaultConnection` pointing to `siesa_agents_db`, **When** `AppDbContext` is resolved from DI, **Then** it connects to PostgreSQL via Npgsql without errors.

6. **Given** the `AppDbContext` is configured, **When** the developer inspects `OnModelCreating`, **Then** `modelBuilder.ApplySnakeCaseNaming()` is the LAST call in the method, after all entity configurations have been applied.

> **Scope note:** This story creates an empty initial migration (no domain tables). The `clientes` table is created in Epic 2 Story 2.1. The `contactos` table is created in Epic 3 Story 3.1. Do NOT define `ClienteEntity` or `ContactoEntity` in this story.

## Tasks / Subtasks

- [ ] Task 1 — Configure EF Core and Npgsql in the Infrastructure layer (AC: #4, #5)
  - [ ] Verify `Npgsql.EntityFrameworkCore.PostgreSQL` is referenced in `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` (added in Story 1.1)
  - [ ] Open `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` and ensure it extends `DbContext`
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` — call `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement (after any future entity configurations)
  - [ ] Confirm `AppDbContext` constructor accepts `DbContextOptions<AppDbContext>` and passes it to `base(options)`
  - [ ] Ensure NO `[Table]` or `[Column]` data annotations are used — snake_case naming is applied exclusively via `ApplySnakeCaseNaming()`

- [ ] Task 2 — Register `AppDbContext` in DI and wire the connection string (AC: #5)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
  - [ ] Add project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure` if not already present in `SiesaAgents.sln`
  - [ ] Confirm `appsettings.Development.json` has `ConnectionStrings.DefaultConnection` = `"Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"`

- [ ] Task 3 — Install EF Core CLI tools and generate the initial empty migration (AC: #1, #2)
  - [ ] Ensure `dotnet-ef` global tool is available: `dotnet tool install --global dotnet-ef` (skip if already installed)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.Infrastructure.csproj` (required for EF CLI):
    ```xml
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
    </PackageReference>
    ```
  - [ ] From `backend/` root, run:
    ```bash
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
  - [ ] Verify migration files are created: `{timestamp}_InitialCreate.cs` and `{timestamp}_InitialCreate.Designer.cs` and `AppDbContextModelSnapshot.cs` under `backend/src/SiesaAgents.Infrastructure/Data/Migrations/`
  - [ ] Inspect the generated `Up()` method — it MUST be empty (no `CreateTable` calls) since no entities are registered yet
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to apply the migration and create `siesa_agents_db`
  - [ ] Confirm `__EFMigrationsHistory` table exists in PostgreSQL after the update

- [ ] Task 4 — Verify and complete ExceptionHandlingMiddleware (AC: #3)
  - [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (created in Story 1.1)
  - [ ] Confirm the middleware catches ALL unhandled exceptions and returns `application/problem+json` with status 500
  - [ ] Ensure `Detail` is `null` (NEVER expose `ex.Message` or stack traces in production)
  - [ ] Confirm middleware is registered in `Program.cs` BEFORE `app.UseCors()` and route mappings: `app.UseMiddleware<ExceptionHandlingMiddleware>();`
  - [ ] The middleware pattern must match exactly:
    ```csharp
    public class ExceptionHandlingMiddleware(RequestDelegate next)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            try { await next(context); }
            catch (Exception)
            {
                context.Response.ContentType = "application/problem+json";
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = 500,
                    Title = "An unexpected error occurred.",
                    Detail = null
                });
            }
        }
    }
    ```

- [ ] Task 5 — Write unit and integration tests (AC: #1–#6)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
    - [ ] Test: `AppDbContext` can be instantiated with InMemory provider and `OnModelCreating` executes without exceptions
    - [ ] Test: `ApplySnakeCaseNaming()` is applied — verify a known property maps to snake_case (e.g., a stub entity `CreatedAt` maps to `created_at`)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`
    - [ ] Test: When pipeline throws, middleware returns status 500 with `Content-Type: application/problem+json`
    - [ ] Test: Response body contains `"title"` and does NOT contain the exception message
    - [ ] Test: When pipeline succeeds, middleware passes through without modification
  - [ ] All tests follow Arrange / Act / Assert structure
  - [ ] Use `xUnit` — no external testing frameworks beyond what is already configured

## Dev Notes

### Architecture Context

Story 1.1 established the four Clean Architecture layers and the solution structure. Story 1.2 was frontend-only. This story wires the **data layer** of the existing backend structure — no new projects are needed, only configuration and the initial migration.

**Key files already in place from Story 1.1:**
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — exists, needs `OnModelCreating` with `ApplySnakeCaseNaming()`
- `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` — directory exists (empty scaffold), migration files go here
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — exists, verify it is complete
- `backend/src/SiesaAgents.API/appsettings.Development.json` — has `ConnectionStrings:DefaultConnection` placeholder

### Backend Stack for This Story

| Component | Version | Purpose |
|-----------|---------|---------|
| .NET | 10 | Framework |
| Entity Framework Core | 10 (via Npgsql.EFC.PG) | ORM + migrations |
| Npgsql.EntityFrameworkCore.PostgreSQL | 10.x | PostgreSQL provider |
| Microsoft.EntityFrameworkCore.Design | 10.x | EF CLI tooling (migration generation) |
| PostgreSQL | 18+ | Target database (`siesa_agents_db`) |
| xUnit | 2.x | Testing |

### Critical Implementation Rules

**PK Rule:** UUID (`Guid`) MANDATORY for all entities. The base `Entity` class in `backend/src/SiesaAgents.Domain/Entities/Entity.cs` already defines `public Guid Id { get; protected set; } = Guid.NewGuid();` — do not override this.

**DateTime Rule:** `DateTimeOffset` ALWAYS — NEVER `DateTime`. This applies to any future timestamp property added in this or subsequent stories.

**snake_case Rule:** `modelBuilder.ApplySnakeCaseNaming()` must be the LAST call in `OnModelCreating`. Do NOT use `[Column("column_name")]` or `[Table("table_name")]` data annotations — the Npgsql naming convention handles all mapping automatically.

**API Docs Rule:** Scalar ONLY — `app.MapScalarApiReference()`. NEVER `app.UseSwagger()`. Already configured in Story 1.1.

**Error Rule:** Problem Details RFC 7807 — `ExceptionHandlingMiddleware` handles this globally. Never expose `ex.Message` or stack traces.

### AppDbContext Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet<TEntity> properties for future domain entities will be added here
    // in Epic 2 (ClienteEntity) and Epic 3 (ContactoEntity)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all IEntityTypeConfiguration<> implementations
        // (none yet — added in Epic 2 and Epic 3 stories)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // MUST be LAST — converts all PascalCase C# names to snake_case for PostgreSQL
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

### DI Registration in Program.cs

```csharp
// Add after existing service registrations in Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions => npgsqlOptions.MigrationsAssembly("SiesaAgents.Infrastructure")));
```

The `MigrationsAssembly` override is needed because migrations live in Infrastructure but the startup project is API.

### EF Core CLI Commands Reference

```bash
# From backend/ directory:

# Generate migration (first time)
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Data/Migrations

# Apply migration to PostgreSQL
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Verify migration list
dotnet ef migrations list \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### Database Conventions Applied

Per company standards (`company-standards.md#Database Conventions`):

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | snake_case plural | `clientes`, `contactos` (future) |
| Columns | snake_case | `created_at`, `is_active` |
| PK column | `id` (UUID) | `id UUID PRIMARY KEY` |
| FK columns | `{entity_name}_id` | `cliente_id` |
| Audit FKs | `{action}_by_user_id` | `created_by_user_id` |
| Indexes | `ix_{table}_{columns}` | `ix_contactos_cliente_id` |
| Unique indexes | `uk_{table}_{columns}` | `uk_clientes_nit` |

All of the above are enforced automatically via `ApplySnakeCaseNaming()` — no manual attribute needed.

### ExceptionHandlingMiddleware (NFR6)

Already created in Story 1.1 at `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`. Verify and complete if needed:

```csharp
using Microsoft.AspNetCore.Mvc;

namespace SiesaAgents.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = 500,
                Title = "An unexpected error occurred.",
                Detail = null   // NEVER expose ex.Message or stack traces
            });
        }
    }
}
```

### Project Structure Notes

This story modifies existing files within the already-established structure from Story 1.1. No new directories are required beyond what was scaffolded.

**Files to create/modify:**

```
backend/
  src/
    SiesaAgents.Infrastructure/
      SiesaAgents.Infrastructure.csproj   ← Add Microsoft.EntityFrameworkCore.Design ref
      Data/
        AppDbContext.cs                   ← MODIFY: complete OnModelCreating with ApplySnakeCaseNaming()
        Migrations/                       ← GENERATE: EF CLI creates files here
          {timestamp}_InitialCreate.cs
          {timestamp}_InitialCreate.Designer.cs
          AppDbContextModelSnapshot.cs
    SiesaAgents.API/
      Program.cs                          ← MODIFY: add AddDbContext<AppDbContext> registration
      Middleware/
        ExceptionHandlingMiddleware.cs    ← VERIFY: complete per pattern above
      appsettings.Development.json        ← VERIFY: ConnectionStrings.DefaultConnection correct
  tests/
    SiesaAgents.UnitTests/
      Infrastructure/
        AppDbContextTests.cs              ← CREATE: EF Core unit tests
      API/
        ExceptionHandlingMiddlewareTests.cs ← CREATE: middleware unit tests
```

### UI Component Requirement

`has_ui_component = FALSE` — This is a pure backend infrastructure story. No frontend changes, no UI components, no siesa-ui-kit usage.

### Previous Story Learnings (Story 1.1)

- `dotnet` CLI may not be available in the environment — project files were created manually in Story 1.1. If CLI is available, use it; if not, create migration files manually following the EF Core migration file format.
- The `Microsoft.EntityFrameworkCore.Design` package must be marked as `PrivateAssets=all` to avoid it shipping in production output.
- `SiesaAgents.Infrastructure.csproj` already references `Npgsql.EntityFrameworkCore.PostgreSQL` — verify the exact version before adding `Microsoft.EntityFrameworkCore.Design` to ensure version alignment.
- The `appsettings.Development.json` connection string placeholder was added in Story 1.1 — verify it points to `siesa_agents_db` before running migrations.

### Git History Context

Recent commits focus on Story 1.2 (frontend navigation shell). This story is the first purely backend story after the foundation. Naming patterns from Story 1.1 backend files: PascalCase C# class names, `Entity` suffix for domain entities, `AppDbContext` for the EF context, no controllers.

### References

- AppDbContext and Infrastructure structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- snake_case naming and database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- EF Core `ApplySnakeCaseNaming()` rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case]
- UUID PK mandate and DateTimeOffset rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Problem Details RFC 7807 requirement: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- ExceptionHandlingMiddleware pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- EF Core + Npgsql package: [Source: _bmad-output/planning-artifacts/architecture.md#Initialization Command — Backend]
- Story 1.3 acceptance criteria: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3: Backend Database Foundation]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/architecture.md#Requirements Overview]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
