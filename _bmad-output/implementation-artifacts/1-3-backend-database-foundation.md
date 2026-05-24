# Story 1.3: Backend Database Foundation

Status: draft

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

- [ ] Task 1 — Add EFCore.NamingConventions NuGet package to Infrastructure (AC: #4)
  - [ ] Add package: `dotnet add backend/src/SiesaAgents.Infrastructure package EFCore.NamingConventions`
  - [ ] Verify the package reference appears in `SiesaAgents.Infrastructure.csproj`

- [ ] Task 2 — Update `SiesaAgentsDbContext` with `ApplySnakeCaseNaming()` (AC: #4)
  - [ ] Open `backend/src/SiesaAgents.Infrastructure/Data/SiesaAgentsDbContext.cs`
  - [ ] Update `OnModelCreating` to call `modelBuilder.UseSnakeCaseNamingConvention()` as the LAST call after `base.OnModelCreating(modelBuilder)` and `ApplyConfigurationsFromAssembly`
  - [ ] Ensure NO `[Column]`, `[Table]`, or `[Key]` data annotations are used — rely entirely on convention and EF config classes

- [ ] Task 3 — Register DbContext in `Program.cs` (AC: #5)
  - [ ] Add `using Microsoft.EntityFrameworkCore;` and `using SiesaAgents.Infrastructure.Data;` to `Program.cs`
  - [ ] Register: `builder.Services.AddDbContext<SiesaAgentsDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));`
  - [ ] Placement: register before `var app = builder.Build();`
  - [ ] Add project reference from `SiesaAgents.API` to `SiesaAgents.Infrastructure` if not already present
  - [ ] Add package reference: `dotnet add backend/src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design` (required for EF CLI tooling)

- [ ] Task 4 — Create initial empty EF Core migration (AC: #1, #2)
  - [ ] Install EF CLI tools if not present: `dotnet tool install --global dotnet-ef` (verify with `dotnet ef --version`)
  - [ ] Run migration from backend directory: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Migrations/` folder is created with `{timestamp}_InitialCreate.cs` and `{timestamp}_InitialCreate.Designer.cs` and `SiesaAgentsDbContextModelSnapshot.cs`
  - [ ] Confirm the migration `Up()` and `Down()` methods are empty (no domain tables — ONLY the migration scaffolding)
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` to apply the migration
  - [ ] Confirm `siesa_agents_db` database is created and `__EFMigrationsHistory` table contains one row

- [ ] Task 5 — Verify `ExceptionHandlingMiddleware` returns RFC 7807 Problem Details (AC: #3)
  - [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
  - [ ] Confirm `context.Response.ContentType = "application/problem+json"` is set
  - [ ] Confirm `context.Response.StatusCode = 500` is set
  - [ ] Confirm `ProblemDetails` is returned with `Status = 500`, `Title = "An unexpected error occurred."`, and `Detail = null` (no stack trace, no `ex.Message`)
  - [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is the FIRST middleware registered in `Program.cs` (before `UseCors`)
  - [ ] No changes needed if implementation matches the above — this task is a verification step

- [ ] Task 6 — Unit tests for DbContext configuration (AC: #4, #5)
  - [ ] Add package to UnitTests: `dotnet add tests/SiesaAgents.UnitTests package Microsoft.EntityFrameworkCore.InMemory`
  - [ ] Create `tests/SiesaAgents.UnitTests/Infrastructure/SiesaAgentsDbContextTests.cs`
  - [ ] Test: Verify `SiesaAgentsDbContext` can be instantiated with in-memory provider without throwing
  - [ ] Test: Verify `OnModelCreating` completes without errors (entity configuration assembly scan succeeds)
  - [ ] Create `tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`
  - [ ] Test: Verify middleware catches an exception and sets `StatusCode = 500`
  - [ ] Test: Verify `Content-Type` header is `application/problem+json`
  - [ ] Test: Verify response body deserializes to `ProblemDetails` with non-null `Status` and `Title`
  - [ ] Run `dotnet test tests/SiesaAgents.UnitTests` and confirm all new tests pass

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
