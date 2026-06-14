# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/`, **Then** the `siesa_agents_db` database is created with no errors and the EF Core migrations folder exists at `backend/src/SiesaAgents.Infrastructure/Migrations/`.

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns a Problem Details RFC 7807 payload (with `status`, `title`, and `detail` fields) and no stack traces are exposed to the caller (NFR6). The existing `ExceptionHandlingMiddleware` already covers this — this AC validates it is correctly registered in `Program.cs`.

3. **Given** the backend receives any request that triggers EF Core activity, **When** the request is processed, **Then** `modelBuilder.UseSnakeCaseNamingConvention()` (from `EFCore.NamingConventions`) is applied inside `OnModelCreating` and all future column/table names will follow snake_case convention automatically, with no manual `[Column]` or `[Table]` attributes needed.

4. **Given** the EF Core migration tooling is configured, **When** the developer runs `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`, **Then** an initial empty migration is generated with no domain tables (no `clientes`, no `contactos` tables) — only the EF Core migration history table.

5. **Given** the `AppDbContext` is registered in the DI container, **When** `dotnet build SiesaAgents.sln` is executed, **Then** the solution builds with zero errors and the connection string `ConnectionStrings:DefaultConnection` is read from `appsettings.Development.json`.

## Tasks / Subtasks

- [ ] Task 1 — Add EF Core design package and wire `AppDbContext` in `Program.cs` (AC: #1, #5)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.API.csproj` (required by `dotnet ef` CLI tooling to discover the startup project)
  - [ ] Add `Microsoft.EntityFrameworkCore.Tools` to `SiesaAgents.Infrastructure.csproj` (required for EF Core migrations)
  - [ ] In `Program.cs`, register `AppDbContext` with `builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")))` — add after `AddCors`, before `builder.Build()`
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` namespaces to `Program.cs`
  - [ ] Verify `appsettings.Development.json` already contains `ConnectionStrings:DefaultConnection` pointing to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres` (present from Story 1.1 — no change needed)

- [ ] Task 2 — Verify and harden `AppDbContext` (AC: #3)
  - [ ] Open `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — verify `modelBuilder.UseSnakeCaseNamingConvention()` is called inside `OnModelCreating` (already present from Story 1.1)
  - [ ] Verify `modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly)` is also called to auto-register future entity configurations
  - [ ] Confirm `EFCore.NamingConventions` NuGet package is declared in `SiesaAgents.Infrastructure.csproj` at version `9.*` (already present from Story 1.1)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/` directory (empty placeholder — entity configurations will be added in Epics 2 and 3)

- [ ] Task 3 — Create initial empty EF Core migration (AC: #1, #4)
  - [ ] Run from `backend/` directory: `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API`
  - [ ] Verify the generated migration class in `Migrations/` has empty `Up()` and `Down()` methods (no domain tables created)
  - [ ] Verify `AppDbContextModelSnapshot.cs` is generated alongside the migration
  - [ ] Commit the generated migration files

- [ ] Task 4 — Verify Problem Details middleware registration (AC: #2)
  - [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is registered in `Program.cs` before `app.UseCors()` and before any endpoint mappings
  - [ ] Confirm the middleware returns `Content-Type: application/problem+json` with `status: 500`, `title`, and `detail: null` — no stack trace fields
  - [ ] No code changes needed if Story 1.1 middleware is already correct — this task is a validation checkpoint

- [ ] Task 5 — xUnit integration test: database connectivity (AC: #1, #5)
  - [ ] In `backend/tests/SiesaAgents.UnitTests/`, create `Infrastructure/AppDbContextTests.cs`
  - [ ] Add test: `AppDbContext_CanBeInstantiated_WithInMemoryProvider` — instantiates `AppDbContext` with EF Core InMemory provider and asserts no exception is thrown
  - [ ] Add test: `OnModelCreating_AppliesSnakeCaseNaming` — creates InMemory context and asserts `AppDbContext` can run `EnsureCreated()` without exception (validates configuration validity)
  - [ ] Add NuGet package `Microsoft.EntityFrameworkCore.InMemory` to `SiesaAgents.UnitTests.csproj` for InMemory testing

## Dev Notes

### Context from Story 1.1

Story 1.1 already created the following artifacts that this story builds on — do NOT recreate them:
- `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` — exists with `UseSnakeCaseNamingConvention()` and `ApplyConfigurationsFromAssembly()`
- `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj` — has `Npgsql.EntityFrameworkCore.PostgreSQL v10.*` and `EFCore.NamingConventions v9.*`
- `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — returns Problem Details RFC 7807 (status 500, no stack traces)
- `backend/src/SiesaAgents.API/appsettings.Development.json` — has `ConnectionStrings:DefaultConnection`

The **missing wiring** is: `AppDbContext` is not yet registered in `Program.cs` (no `AddDbContext` call) and no EF Core migrations exist yet. This story adds both.

### Backend Stack Details

- **ORM**: Entity Framework Core 10 via `Npgsql.EntityFrameworkCore.PostgreSQL v10.*`
- **Naming**: `EFCore.NamingConventions` — `UseSnakeCaseNamingConvention()` applied in `OnModelCreating`; no manual `[Column]`/`[Table]` attributes on any entity
- **Primary keys**: `Guid` (UUID) mandatory — `= Guid.NewGuid()` — for all future entities
- **Timestamps**: `DateTimeOffset` ALWAYS — never `DateTime`
- **Database**: `siesa_agents_db` (PostgreSQL 18+) — connection from `appsettings.Development.json`
- **API docs**: `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- **Error format**: Problem Details RFC 7807 via `ExceptionHandlingMiddleware` — `Content-Type: application/problem+json`

### Program.cs Updated Structure

After this story, the minimal `Program.cs` must look like:

```csharp
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapOpenApi();
app.MapScalarApiReference();

app.Run();
```

### EF Core Migration Commands

```bash
# From backend/ directory:
# Add initial empty migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration to database (requires PostgreSQL running)
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

### AppDbContext Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.UseSnakeCaseNamingConvention();  // snake_case for all tables/columns
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
```

Future entity `DbSet<>` properties will be added here when Epics 2 and 3 define entities.

### Scope Boundary (CRITICAL)

- Do NOT create `ClienteEntity`, `ContactoEntity`, or any domain entity — those belong to Epics 2 and 3
- Do NOT create `ClienteConfiguration.cs` or `ContactoConfiguration.cs` — those belong to Epics 2 and 3
- Do NOT create endpoint files (`ClienteEndpoints.cs`, `ContactoEndpoints.cs`) — those belong to Epics 2 and 3
- The initial migration MUST be empty (no domain tables)
- The `Migrations/` folder must exist but contain only `InitialCreate` migration and snapshot

### NuGet Packages Required

| Project | Package | Version |
|---------|---------|---------|
| `SiesaAgents.API` | `Microsoft.EntityFrameworkCore.Design` | `10.*` |
| `SiesaAgents.Infrastructure` | `Microsoft.EntityFrameworkCore.Tools` | `10.*` |
| `SiesaAgents.UnitTests` | `Microsoft.EntityFrameworkCore.InMemory` | `10.*` |

Note: `Npgsql.EntityFrameworkCore.PostgreSQL v10.*` and `EFCore.NamingConventions v9.*` are already in `SiesaAgents.Infrastructure.csproj` from Story 1.1.

### Testing Standards

- xUnit testing framework (mandatory per company standards)
- InMemory provider for unit tests — no live PostgreSQL required for unit tests
- For integration tests (if added): use PostgreSQL Test Containers
- Test structure: Arrange / Act / Assert
- Coverage target: >80%

### Project Structure Notes

Files touched by this story:
```
backend/
├── src/
│   ├── SiesaAgents.API/
│   │   ├── SiesaAgents.API.csproj         ← ADD Microsoft.EntityFrameworkCore.Design
│   │   └── Program.cs                      ← ADD AddDbContext<AppDbContext> registration
│   └── SiesaAgents.Infrastructure/
│       ├── SiesaAgents.Infrastructure.csproj ← ADD Microsoft.EntityFrameworkCore.Tools
│       ├── Data/
│       │   ├── AppDbContext.cs              ← VERIFY (no changes expected)
│       │   └── Configurations/             ← CREATE empty directory (placeholder)
│       └── Migrations/                     ← CREATE via dotnet ef migrations add
│           ├── {timestamp}_InitialCreate.cs
│           └── AppDbContextModelSnapshot.cs
└── tests/
    └── SiesaAgents.UnitTests/
        ├── SiesaAgents.UnitTests.csproj    ← ADD Microsoft.EntityFrameworkCore.InMemory
        └── Infrastructure/
            └── AppDbContextTests.cs        ← CREATE unit tests
```

### References

- EF Core + PostgreSQL wiring: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- snake_case naming convention: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- `ApplySnakeCaseNaming()` / `UseSnakeCaseNamingConvention()` enforcement: [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Problem Details RFC 7807: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- ExceptionHandlingMiddleware pattern: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- EF Core migration commands: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- Scope note (no domain entities): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
