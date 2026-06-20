# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors and EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **Given** the backend is running and an unhandled exception occurs, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format (`status`, `title`, `detail`) with no stack traces or exception messages exposed (NFR6).

3. **Given** the backend receives any request that results in a database operation, **When** EF Core maps entities to tables, **Then** `ApplySnakeCaseNaming()` is called last inside `OnModelCreating` and all column names follow `snake_case` convention automatically — no manual `[Column]` or `[Table]` attributes are used.

4. **Given** the infrastructure is configured, **When** `dotnet build SiesaAgents.sln` is executed, **Then** `AppDbContext`, `IApplicationDbContext`, and the EF Core DI registration compile with zero errors and `Npgsql.EntityFrameworkCore.PostgreSQL` is the provider.

5. **Given** the initial empty migration is created, **When** a developer inspects the migration, **Then** it is an empty `InitialCreate` migration — it does NOT define `clientes` or `contactos` tables (those belong to Epic 2 and Epic 3 respectively).

## Tasks / Subtasks

- [ ] Task 1 — Add EF Core and Npgsql packages (AC: #4)
  - [ ] Run: `dotnet add backend/src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
  - [ ] Run: `dotnet add backend/src/SiesaAgents.Infrastructure package Microsoft.EntityFrameworkCore.Design`
  - [ ] Run: `dotnet add backend/src/SiesaAgents.API package Microsoft.EntityFrameworkCore.Design` (required for `dotnet ef` CLI tooling pointing to API startup project)
  - [ ] Run: `dotnet add backend/src/SiesaAgents.Infrastructure package EFCore.NamingConventions` (provides `UseSnakeCaseNamingConvention`)
  - [ ] Verify packages appear in `SiesaAgents.Infrastructure.csproj`

- [ ] Task 2 — Create `AppDbContext` in Infrastructure layer (AC: #3, #4)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`:
    ```csharp
    using Microsoft.EntityFrameworkCore;

    namespace SiesaAgents.Infrastructure.Data;

    public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
            modelBuilder.UseSnakeCaseNamingConvention(); // MUST be last
        }
    }
    ```
  - [ ] Define `IApplicationDbContext` interface in `backend/src/SiesaAgents.Application/Interfaces/IApplicationDbContext.cs`:
    ```csharp
    using Microsoft.EntityFrameworkCore;

    namespace SiesaAgents.Application.Interfaces;

    public interface IApplicationDbContext
    {
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
    ```
  - [ ] Make `AppDbContext` implement `IApplicationDbContext`
  - [ ] Add `Microsoft.EntityFrameworkCore` reference to `SiesaAgents.Application.csproj` (abstraction only, no provider)

- [ ] Task 3 — Register `AppDbContext` in `Program.cs` (AC: #1, #4)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add DI registration before `builder.Build()`:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            npgsql => npgsql.MigrationsAssembly("SiesaAgents.Infrastructure")
        ));
    builder.Services.AddScoped<IApplicationDbContext>(provider =>
        provider.GetRequiredService<AppDbContext>());
    ```
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using SiesaAgents.Application.Interfaces;` to `Program.cs`
  - [ ] Add project reference: `SiesaAgents.API` → `SiesaAgents.Infrastructure` (if not already present from Story 1.1)

- [ ] Task 4 — Verify `appsettings.Development.json` connection string (AC: #1)
  - [ ] Confirm `backend/src/SiesaAgents.API/appsettings.Development.json` contains:
    ```json
    {
      "ConnectionStrings": {
        "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
      }
    }
    ```
  - [ ] If missing or different, update it to match the value above

- [ ] Task 5 — Create the initial empty migration (AC: #1, #5)
  - [ ] From `backend/` directory, run:
    ```bash
    dotnet ef migrations add InitialCreate \
      --project src/SiesaAgents.Infrastructure \
      --startup-project src/SiesaAgents.API \
      --output-dir Data/Migrations
    ```
  - [ ] Verify the generated migration file is empty (no `Up`/`Down` table operations — only metadata scaffolding)
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Data/Migrations/` folder is created with `InitialCreate` and snapshot files
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` and verify `siesa_agents_db` is created in PostgreSQL with no errors

- [ ] Task 6 — Harden `ExceptionHandlingMiddleware` for Problem Details RFC 7807 (AC: #2)
  - [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (created in Story 1.1)
  - [ ] Ensure the catch block returns proper Problem Details with `status`, `title`, `detail = null` and NO stack trace:
    ```csharp
    public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await next(context);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unhandled exception on {Method} {Path}",
                    context.Request.Method, context.Request.Path);

                context.Response.ContentType = "application/problem+json";
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;

                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = "An unexpected error occurred.",
                    Detail = null  // Never expose ex.Message or stack traces
                };

                await context.Response.WriteAsJsonAsync(problem);
            }
        }
    }
    ```
  - [ ] Verify `Microsoft.AspNetCore.Mvc.ProblemDetails` is used (already available in ASP.NET Core — no extra package needed)
  - [ ] Verify middleware is registered in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`

- [ ] Task 7 — Write unit tests for `AppDbContext` configuration (AC: #3)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextConfigurationTests.cs`
  - [ ] Test that `OnModelCreating` applies snake_case naming (use EF Core InMemory provider for the test):
    ```csharp
    // Arrange: Build an options builder with UseSnakeCaseNamingConvention + UseInMemoryDatabase
    // Act: Instantiate AppDbContext and access Model
    // Assert: Verify that entity property names produce snake_case column names
    ```
  - [ ] Add `Microsoft.EntityFrameworkCore.InMemory` package to `SiesaAgents.UnitTests.csproj` for testing

- [ ] Task 8 — Validate full build (AC: #4)
  - [ ] Run `dotnet build backend/SiesaAgents.sln` and confirm zero errors and zero warnings
  - [ ] Run `dotnet test backend/tests/SiesaAgents.UnitTests` and confirm all tests pass

## Dev Notes

### Architecture Context

This story is pure backend infrastructure. There is **no frontend work** in this story. The `siesa_agents_db` PostgreSQL database is the single database for the entire service (not per-entity, not microservices — single service per architecture decision: NFR10, 10 concurrent users).

This story creates an **empty** initial migration. Domain tables (`clientes`, `contactos`) are created in Epic 2 Story 2.1 and Epic 3 Story 3.1 respectively. Do NOT define `ClienteEntity` or `ContactoEntity` here.

### EF Core + PostgreSQL Critical Rules

- **Primary Keys**: `Guid` (UUID) mandatory for all entities. Pattern:
  ```csharp
  public abstract class Entity { public Guid Id { get; protected set; } = Guid.NewGuid(); }
  ```
- **Timestamps**: ALWAYS `DateTimeOffset` — NEVER `DateTime`. Pattern:
  ```csharp
  public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;
  ```
- **Naming**: `ApplySnakeCaseNaming()` (via `EFCore.NamingConventions` package) applied **last** in `OnModelCreating`. This auto-converts `PascalCase` C# properties to `snake_case` DB columns. No `[Column]` or `[Table]` attributes needed or allowed.
- **Provider**: `Npgsql.EntityFrameworkCore.PostgreSQL` — no SQLite, no SQL Server, no InMemory in production.

### snake_case Convention Evidence (Future Stories Reference)

When entity properties are defined in subsequent stories, EF Core will auto-map them as follows:
```
C# Property        → DB Column
Id (Guid)          → id
Nombre (string)    → nombre
ClienteId (Guid?)  → cliente_id
CreatedAt          → created_at
UpdatedAt          → updated_at
```
No manual mapping required — `UseSnakeCaseNamingConvention()` handles all of it.

### Entity Configuration Pattern (For Future Stories)

Entity-specific configurations live in `backend/src/SiesaAgents.Infrastructure/Data/Configurations/` using `IEntityTypeConfiguration<T>`. They are picked up automatically by `modelBuilder.ApplyConfigurationsFromAssembly(...)`.

Example structure (NOT to be created in this story):
```csharp
// backend/src/SiesaAgents.Infrastructure/Data/Configurations/ClienteConfiguration.cs
internal sealed class ClienteConfiguration : IEntityTypeConfiguration<ClienteEntity>
{
    public void Configure(EntityTypeBuilder<ClienteEntity> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Nit).IsRequired().HasMaxLength(20);
        builder.HasIndex(c => c.Nit).IsUnique().HasDatabaseName("uk_clientes_nit");
    }
}
```

### Problem Details RFC 7807 Format

The `ExceptionHandlingMiddleware` must produce exactly this JSON shape on 500 errors:
```json
{
  "status": 500,
  "title": "An unexpected error occurred.",
  "detail": null
}
```
`Content-Type` header must be `application/problem+json`. No `ex.Message`, no `StackTrace`, no inner exception details exposed to the client (NFR6).

### File Structure — Files Touched in This Story

```
backend/
├── src/
│   ├── SiesaAgents.API/
│   │   ├── Program.cs                              # ADD: DbContext DI registration
│   │   ├── appsettings.Development.json            # VERIFY: ConnectionStrings.DefaultConnection
│   │   └── Middleware/
│   │       └── ExceptionHandlingMiddleware.cs       # UPDATE: Add ILogger, harden Problem Details
│   ├── SiesaAgents.Application/
│   │   ├── SiesaAgents.Application.csproj          # ADD: Microsoft.EntityFrameworkCore reference
│   │   └── Interfaces/
│   │       └── IApplicationDbContext.cs             # CREATE: EF abstraction interface
│   └── SiesaAgents.Infrastructure/
│       ├── SiesaAgents.Infrastructure.csproj        # ADD: Npgsql + EFCore.NamingConventions packages
│       └── Data/
│           ├── AppDbContext.cs                      # CREATE: DbContext with ApplySnakeCaseNaming()
│           └── Migrations/                          # CREATE: via dotnet ef migrations add InitialCreate
└── tests/
    └── SiesaAgents.UnitTests/
        ├── SiesaAgents.UnitTests.csproj             # ADD: Microsoft.EntityFrameworkCore.InMemory
        └── Infrastructure/
            └── AppDbContextConfigurationTests.cs    # CREATE: snake_case naming unit tests
```

### Backend Project References (Dependency Chain)

```
SiesaAgents.API
  → SiesaAgents.Application  (commands, queries, interfaces)
  → SiesaAgents.Infrastructure  (AppDbContext, repositories)
  → SiesaAgents.Domain  (entities, domain interfaces)

SiesaAgents.Infrastructure
  → SiesaAgents.Domain  (entity types to configure)
  → SiesaAgents.Application  (IApplicationDbContext implementation)
```

### Migration CLI Command Reference

The `dotnet ef` CLI requires the `--startup-project` flag to point to the project with `Program.cs` (API) and `--project` to point to where migrations live (Infrastructure):

```bash
# From backend/ directory:
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Data/Migrations

dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

If `dotnet ef` is not installed globally:
```bash
dotnet tool install --global dotnet-ef
```

### Testing Standards

- **Framework**: xUnit (already in `SiesaAgents.UnitTests`)
- **Pattern**: Arrange / Act / Assert
- **EF Core unit tests**: Use `UseInMemoryDatabase` — never hit real PostgreSQL in unit tests
- **Integration tests** (future): Use Testcontainers for PostgreSQL (not in scope for this story)
- **Coverage target**: >80% for new code introduced in this story

### Git Context

Recent commits show the team is using conventional commits (`feat(tea):`, `chore:`). Follow same pattern. Story 1.1 established the project skeleton; Story 1.2 added frontend navigation. This story adds the data layer to the existing backend.

### References

- Database conventions and EF Core snake_case rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Backend project structure and `AppDbContext.cs` location: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- `ExceptionHandlingMiddleware` pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- EF Core connection string and DB name (`siesa_agents_db`): [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- Problem Details NFR6 and no stack trace rule: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Story acceptance criteria source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- `ApplySnakeCaseNaming()` enforcement rule: [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
