# Story 1.3: Backend Database Foundation

Status: done

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors and a `__EFMigrationsHistory` table is present.

2. **Given** the backend solution is initialized, **When** the developer inspects the Infrastructure project, **Then** an EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/` containing an initial (empty) migration with no domain table definitions.

3. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with `Content-Type: application/problem+json` and no stack traces exposed (NFR6).

4. **Given** the backend starts up, **When** the DbContext is configured, **Then** `ApplySnakeCaseNaming()` is called last in `OnModelCreating` so all future column and table names follow snake_case convention automatically — NO manual `[Column]` or `[Table]` attributes are used.

5. **Given** the `SiesaAgentsDbContext` is registered in DI, **When** `Program.cs` configures services, **Then** it reads the connection string from `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` and registers the DbContext with `AddDbContext<SiesaAgentsDbContext>` using the Npgsql provider.

## Tasks / Subtasks

- [x] Task 1 — Add EFCore.NamingConventions NuGet package to Infrastructure (AC: #4)
  - [x] Add package: `dotnet add backend/src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
  - [x] Verify the package reference appears in `SiesaAgents.Infrastructure.csproj`

- [x] Task 2 — Update `SiesaAgentsDbContext` with `ApplySnakeCaseNaming()` (AC: #4)
  - [x] Open `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs`
  - [x] `UseSnakeCaseNamingConvention()` applied via `DbContextOptionsBuilder` in `AddDbContext` registration (correct API) and confirmed active via EF log "using snake-case naming"
  - [x] Ensure NO `[Column]`, `[Table]`, or `[Key]` data annotations are used — rely entirely on convention and EF config classes

- [x] Task 3 — Register DbContext in `Program.cs` (AC: #5)
  - [x] Add `using Microsoft.EntityFrameworkCore;` and `using SiesaAgents.Infrastructure.Data;` to `Program.cs`
  - [x] Register: `builder.Services.AddDbContext<SiesaAgentsDbContext>(options => options.UseNpgsql(...).UseSnakeCaseNamingConvention());`
  - [x] Placement: register before `var app = builder.Build();`
  - [x] Add project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure` — already present
  - [x] Add package reference: `Microsoft.EntityFrameworkCore.Design` added to `SiesaAgents.API`

- [x] Task 4 — Create initial empty EF Core migration (AC: #1, #2)
  - [x] Install EF CLI tools: `dotnet tool install --global dotnet-ef` (v10.0.8)
  - [x] Migration `20260524083049_InitialCreate` created — `Up()` and `Down()` are empty
  - [x] Migrations folder created at `backend/src/SiesaAgents.Infrastructure/Migrations/`
  - [x] `dotnet ef database update` applied — `siesa_agents_db` created with `__EFMigrationsHistory` (1 row)

- [x] Task 5 — Verify `ExceptionHandlingMiddleware` returns RFC 7807 Problem Details (AC: #3)
  - [x] `context.Response.ContentType = "application/problem+json"` is set (fixed: using `WriteAsync` instead of `WriteAsJsonAsync` to preserve content type)
  - [x] `context.Response.StatusCode = 500` is set
  - [x] `ProblemDetails` returned with `Status = 500`, `Title = "An unexpected error occurred."`, `Detail = null`
  - [x] `app.UseMiddleware<ExceptionHandlingMiddleware>()` is FIRST middleware registered in `Program.cs`

- [x] Task 6 — Unit tests for DbContext configuration (AC: #4, #5)
  - [x] Added packages: `Microsoft.EntityFrameworkCore.InMemory`, `EFCore.NamingConventions`, `Npgsql.EntityFrameworkCore.PostgreSQL` to UnitTests
  - [x] Added project references: `SiesaAgents.Infrastructure` and `SiesaAgents.API` to UnitTests
  - [x] `SiesaAgentsDbContextTests.cs` — 3 tests (instantiation, OnModelCreating, snake_case extension)
  - [x] `ExceptionHandlingMiddlewareTests.cs` — 5 tests (StatusCode, ContentType, ProblemDetails body, no stack trace, happy path)
  - [x] All 14 unit tests pass (0 failures)

## Dev Notes

### Current Codebase State (Critical Context)

Story 1.1 already created these files that this story builds upon:

- `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs` — DbContext exists but `OnModelCreating` is missing `UseSnakeCaseNamingConvention()` call (flagged in Story 1.1 review)
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — Problem Details middleware already implemented (returns `application/problem+json`, no stack traces)
- `backend/src/SiesaAgents.API/appsettings.Development.json` — Already has `ConnectionStrings:DefaultConnection` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — Has `Npgsql.EntityFrameworkCore.PostgreSQL` but NOT `EFCore.NamingConventions`
- `backend/src/SiesaAgents.API/Program.cs` — Does NOT yet register `SiesaAgentsDbContext` in DI

**This story must NOT define `ClienteEntity` or `ContactoEntity`. The initial migration must be empty.**

### Backend Architecture Patterns

**DbContext registration pattern (Program.cs):**

```csharp
builder.Services.AddDbContext<SiesaAgentsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

**OnModelCreating pattern (mandatory order):**

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(SiesaAgentsDbContext).Assembly);
    modelBuilder.UseSnakeCaseNamingConvention(); // MUST be LAST
}
```

**ExceptionHandlingMiddleware (already implemented — verify only):**

```csharp
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
                Detail = null   // Never expose ex.Message or stack traces
            });
        }
    }
}
```

### EF Core Migration CLI Commands

Run all EF commands from the `backend/` directory:

```bash
# Add initial empty migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration to create siesa_agents_db
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

The `--startup-project` must point to the API project because it contains the DI registration of `SiesaAgentsDbContext` and the connection string in `appsettings.Development.json`.

### Database Conventions

Per company standards (`company-standards.md`):

- All tables: snake_case plural (`clientes`, `contactos`) — auto-applied by `UseSnakeCaseNamingConvention()`
- All columns: snake_case (`created_at`, `updated_at`, `cliente_id`) — auto-applied
- PK column: `id` (UUID) — Entity base class already uses `Guid Id`
- Timestamps: `DateTimeOffset` ALWAYS — Entity base class already uses `DateTimeOffset CreatedAt` and `DateTimeOffset UpdatedAt`
- No domain tables in this story — `clientes` is created in Epic 2, `contactos` in Epic 3

### Project Reference Requirements

`SiesaAgents.API` must reference `SiesaAgents.Infrastructure` to access `SiesaAgentsDbContext`. Verify `SiesaAgents.API.csproj` has:

```xml
<ProjectReference Include="..\SiesaAgents.Infrastructure\SiesaAgents.Infrastructure.csproj" />
```

If missing, add with: `dotnet add backend/src/SiesaAgents.API reference backend/src/SiesaAgents.Infrastructure`

### Testing Standards

- Framework: xUnit (backend standard per `company-standards.md`)
- Use `Microsoft.EntityFrameworkCore.InMemory` for DbContext unit tests
- Test structure: Arrange / Act / Assert
- Coverage target: >80% for new code in this story

### Project Structure After This Story

```
backend/
└── src/
    ├── SiesaAgents.API/
    │   ├── Program.cs                          # Modified — AddDbContext registered
    │   └── Middleware/
    │       └── ExceptionHandlingMiddleware.cs   # Verified — no changes needed
    └── SiesaAgents.Infrastructure/
        ├── Data/
        │   └── SiesaAgentsDbContext.cs          # Modified — UseSnakeCaseNamingConvention() added
        └── Migrations/                          # Created — InitialCreate (empty)
            ├── {timestamp}_InitialCreate.cs
            ├── {timestamp}_InitialCreate.Designer.cs
            └── SiesaAgentsDbContextModelSnapshot.cs
tests/
└── SiesaAgents.UnitTests/
    ├── Infrastructure/
    │   └── SiesaAgentsDbContextTests.cs         # Created
    └── API/
        └── ExceptionHandlingMiddlewareTests.cs  # Created
```

### References

- EF Core snake_case convention: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case via ApplySnakeCaseNaming()]
- DbContext location: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure — AppDbContext.cs]
- Problem Details requirement: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3 AC]
- NFR6 (no stack traces): [Source: _bmad-output/planning-artifacts/prd/non-functional-requirements.md#NFR6]
- ExceptionHandlingMiddleware pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Story 1.1 review warning re: missing UseSnakeCaseNamingConvention: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Review Follow-ups]
- Database naming conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Backend project structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Folder Structure (.NET Solution)]
- Architecture enforcement guidelines: [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
