# Story 1.3: Backend Database Foundation

Status: ready-for-dev

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from the `backend/` directory, **Then** the `siesa_agents_db` database is created with no errors and the `__ef_migrations_history` table exists in snake_case format (confirming `ApplySnakeCaseNaming()` is active).

2. **Given** the EF Core migration is applied, **When** the developer inspects the database schema, **Then** NO domain tables exist (`clientes` and `contactos` are absent) — this story creates only the empty initial migration. The `clientes` table is deferred to Epic 2 Story 2.1 and `contactos` to Epic 3 Story 3.1.

3. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response returns Problem Details RFC 7807 format with `Content-Type: application/problem+json`, and the body contains `status`, `title`, and `detail` fields with NO `stackTrace`, `exception`, or raw C# exception message exposed (NFR6).

4. **Given** the backend receives any request, **When** the request is processed, **Then** `modelBuilder.ApplySnakeCaseNaming()` is the last call in `AppDbContext.OnModelCreating` and all EF Core managed column names follow snake_case convention (e.g., `migration_id`, `product_version` in `__ef_migrations_history`).

5. **Given** the Infrastructure project is configured, **When** the developer runs `dotnet build SiesaAgents.sln`, **Then** all four Clean Architecture projects compile with zero errors: `SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, `SiesaAgents.Infrastructure`.

6. **Given** the connection string is configured in `appsettings.Development.json`, **When** the developer registers `AppDbContext` in `Program.cs`, **Then** the DI container resolves `AppDbContext` without error and EF Core uses `Npgsql` as the database provider.

## Tasks / Subtasks

- [ ] Task 1 — Create `AppDbContext` in Infrastructure (AC: #1, #4, #6)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` extending `DbContext`
  - [ ] Override `OnModelCreating(ModelBuilder modelBuilder)` — call `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement (after any future `ApplyConfigurationsFromAssembly` calls)
  - [ ] Inject `DbContextOptions<AppDbContext>` via constructor
  - [ ] Do NOT define any `DbSet<>` properties in this story — no domain entities yet

- [ ] Task 2 — Create EF Core entity configuration scaffold (AC: #4)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/Configurations/` directory (empty, ready for future `IEntityTypeConfiguration<T>` classes in Epic 2 and 3)

- [ ] Task 3 — Create Migrations directory and initial empty migration (AC: #1, #2)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Migrations/` directory
  - [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from the `backend/` folder
  - [ ] Verify the generated `Up()` method is empty (no table creation — only `__EFMigrationsHistory` will be created by EF Core itself)
  - [ ] Commit the generated migration files: `{timestamp}_InitialCreate.cs` and `{timestamp}_InitialCreate.Designer.cs` and `AppDbContextModelSnapshot.cs`

- [ ] Task 4 — Register `AppDbContext` in `Program.cs` (AC: #5, #6)
  - [ ] In `backend/src/SiesaAgents.API/Program.cs`, add:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
    ```
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
  - [ ] Ensure the registration is placed BEFORE `var app = builder.Build()` alongside other service registrations

- [ ] Task 5 — Verify `ExceptionHandlingMiddleware` returns Problem Details RFC 7807 (AC: #3)
  - [ ] Confirm `ExceptionHandlingMiddleware.cs` (created in Story 1.1) is registered BEFORE routing in `Program.cs` — it already exists at `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
  - [ ] Verify the middleware sets `Content-Type: application/problem+json`, HTTP 500, and the JSON body has `status`, `title`, `detail` — `detail` MUST be `null` (never expose `ex.Message` or `ex.StackTrace`)
  - [ ] No changes needed if implementation already matches spec from Story 1.1 — only confirm and document

- [ ] Task 6 — Add `Microsoft.EntityFrameworkCore.Design` to Infrastructure project (AC: #1, #3)
  - [ ] Add `<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*" />` to `backend/src/SiesaAgents.Infrastructure/SiesaAgents.Infrastructure.csproj`
  - [ ] Add `<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.*" />` if EF CLI tooling requires it in the startup project
  - [ ] Verify `SiesaAgents.API.csproj` references `SiesaAgents.Infrastructure.csproj` (already done in Story 1.1)

- [ ] Task 7 — Run `dotnet ef database update` and validate (AC: #1, #2, #4)
  - [ ] Run `dotnet ef database update --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/`
  - [ ] Connect to `siesa_agents_db` and verify: `__ef_migrations_history` table exists with snake_case columns (`migration_id`, `product_version`)
  - [ ] Verify NO `clientes` or `contactos` tables exist

- [ ] Task 8 — Write xUnit integration tests for Story 1.3 (AC: #1, #3, #4)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`
  - [ ] Test: `AppDbContext` registers without DI errors (using `WebApplicationFactory<Program>`)
  - [ ] Test (TC-E1-P0-05): `GET /api/v1/test-error` throws exception → response is `application/problem+json`, status 500, body has `status`/`title`/`detail`, no `stackTrace` key
  - [ ] Test (TC-E1-P1-05): After `dotnet ef database update`, `siesa_agents_db` contains `__ef_migrations_history` table and NO `clientes`/`contactos` tables (use `TestContainers` or local test DB)
  - [ ] Test (TC-E1-P2-04): Column names in `__ef_migrations_history` are snake_case (`migration_id`, `product_version`)
  - [ ] Test structure: Arrange / Act / Assert

## Dev Notes

### Architecture Layer Mapping

This story operates exclusively on the **Infrastructure** and **API** layers:

```
SiesaAgents.Domain       ← NO changes (zero dependencies)
SiesaAgents.Application  ← NO changes
SiesaAgents.Infrastructure ← AppDbContext, Migrations/, Configurations/ directory
SiesaAgents.API          ← Program.cs: AddDbContext registration
```

### AppDbContext Pattern (Critical)

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet<> properties will be added in Epic 2 (ClienteEntity) and Epic 3 (ContactoEntity)
    // DO NOT add any DbSet here in Story 1.3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity type configurations from this assembly (for future stories)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // CRITICAL: ApplySnakeCaseNaming MUST be the LAST call in OnModelCreating
        modelBuilder.ApplySnakeCaseNaming();
    }
}
```

**Why `ApplySnakeCaseNaming()` must be last:** EF Core naming conventions are applied in declaration order. If `ApplySnakeCaseNaming()` runs before entity configurations, subsequent configurations can override the naming. Placing it last guarantees all column/table names are converted to snake_case regardless of order.

### `ApplySnakeCaseNaming()` Extension Method

`Npgsql.EntityFrameworkCore.PostgreSQL` provides `ApplySnakeCaseNaming()` as an extension on `ModelBuilder`. It is available after adding `Npgsql.EntityFrameworkCore.PostgreSQL` to the Infrastructure project (already in `SiesaAgents.Infrastructure.csproj`). No additional package needed.

```csharp
// Available via: using Npgsql.EntityFrameworkCore.PostgreSQL;
// or directly on ModelBuilder without a using if implicit usings are enabled
modelBuilder.ApplySnakeCaseNaming(); // Converts all PascalCase to snake_case
```

### Program.cs Update Pattern

The updated `Program.cs` must include `AppDbContext` registration. Full structure after this story:

```csharp
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// Database context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapScalarApiReference();

app.Run();
```

### Connection String Location

Already configured in Story 1.1 at `backend/src/SiesaAgents.API/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
  },
  "AllowedOrigins": ["http://localhost:5173"]
}
```

Do NOT modify this file — it is already correct.

### EF Core CLI Commands

Run from the `backend/` root directory:

```bash
# Add initial empty migration
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Apply migration to database
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

The `InitialCreate` migration `Up()` method MUST be empty — no `migrationBuilder.CreateTable()` calls. EF Core will only create `__ef_migrations_history` to track applied migrations.

### ExceptionHandlingMiddleware Verification

The middleware was created in Story 1.1 at `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`. It already implements the correct Problem Details RFC 7807 pattern:

- `Content-Type: application/problem+json`
- HTTP 500 status
- Body: `{ "status": 500, "title": "An unexpected error occurred.", "detail": null }`
- `detail` is `null` — never expose `ex.Message` or `ex.StackTrace`

Middleware is registered in `Program.cs` BEFORE routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()` — already correct from Story 1.1. No changes needed unless the current implementation does not match the spec above.

### Database Conventions (MANDATORY)

Per company standards and architecture doc:

| Convention | Rule | Example |
|-----------|------|---------|
| Tables | snake_case, plural | `clientes`, `order_items` |
| Columns | snake_case | `created_at`, `client_id` |
| PK | `id` (UUID) | `id UUID DEFAULT uuidv7()` |
| FK | `{entity}_id` | `cliente_id` |
| Timestamps | `DateTimeOffset` only | `created_at`, `updated_at` |

**`ApplySnakeCaseNaming()` handles all of this automatically** — NO manual `[Column]`/`[Table]` attributes required or allowed.

### Scope Boundary (CRITICAL — DO NOT VIOLATE)

> **This story creates an EMPTY initial migration only.**

- DO NOT define `ClienteEntity` in this story — that belongs to Epic 2 Story 2.1
- DO NOT define `ContactoEntity` in this story — that belongs to Epic 3 Story 3.1
- DO NOT add `DbSet<ClienteEntity>` or `DbSet<ContactoEntity>` to `AppDbContext`
- The `clientes` and `contactos` tables MUST NOT exist after `dotnet ef database update`

### Testing Standards

- Framework: xUnit + `WebApplicationFactory<Program>` for integration tests
- Database tests: use `TestContainers` (`Testcontainers.PostgreSql` NuGet) for isolated PostgreSQL instance, OR use a dedicated local test database `siesa_agents_db_test`
- Test structure: Arrange / Act / Assert
- Coverage target: >80% for new Infrastructure code
- No Moq required for this story — testing real EF Core + PostgreSQL connectivity

### NuGet Package Versions

Per company standards (.NET 10 baseline):

| Package | Target Version | Project |
|---------|---------------|---------|
| `Npgsql.EntityFrameworkCore.PostgreSQL` | `10.*` | Infrastructure (already added) |
| `Microsoft.EntityFrameworkCore.Design` | `10.*` | Infrastructure (add in Task 6) |
| `Microsoft.EntityFrameworkCore.Tools` | `10.*` | API (if needed for EF CLI) |
| `Testcontainers.PostgreSql` | Latest stable | UnitTests project |

### Project Structure After This Story

```
backend/src/SiesaAgents.Infrastructure/
├── SiesaAgents.Infrastructure.csproj    ← Add EF Design package (Task 6)
├── Data/
│   ├── AppDbContext.cs                  ← CREATE (Task 1)
│   └── Configurations/                  ← CREATE directory (Task 2, empty)
└── Migrations/                          ← GENERATED by EF CLI (Task 3)
    ├── {timestamp}_InitialCreate.cs
    ├── {timestamp}_InitialCreate.Designer.cs
    └── AppDbContextModelSnapshot.cs

backend/src/SiesaAgents.API/
└── Program.cs                           ← UPDATE: AddDbContext registration (Task 4)

backend/tests/SiesaAgents.UnitTests/
└── Infrastructure/
    └── AppDbContextTests.cs             ← CREATE (Task 8)
```

### Previous Story Learnings (from Stories 1.1 & 1.2)

- .NET 10 SDK was NOT available in the CI environment during Story 1.1 — all backend files were created manually as text files. The EF CLI migration step (Task 3) may also need to be executed manually if `dotnet ef` is unavailable.
- When `dotnet ef` CLI is unavailable, create the migration files manually — the `Up()` and `Down()` methods are empty for `InitialCreate`, and the Designer/Snapshot files follow the standard EF Core template.
- `TreatWarningsAsErrors` is set to `true` in all `.csproj` files — zero compiler warnings are acceptable.
- `Nullable` is enabled in all projects — use nullable reference type annotations throughout (`string?`, `Guid?`, etc.).
- Implicit usings are enabled — `System`, `System.Collections.Generic`, `System.Threading.Tasks` need no explicit using directive.

### Git History Context

Recent commits on this project:
- `test(story-1.2): update edge cases and navigation test files from review agent`
- `docs(story-1.2): add automation summary from test automate run`
- `fix(story-1.2): apply code review corrections`
- `feat(story-1.2): extract AppLayout to -app-layout.tsx, add edge case tests`

Commit naming convention: `{type}(story-{epic}-{num}): {description}` — e.g., `feat(story-1-3): add AppDbContext and EF Core infrastructure`.

### Project Structure Notes

- Story 1.3 is purely backend — no frontend files are touched.
- The `backend/` root already has `SiesaAgents.sln` referencing all four projects from Story 1.1.
- The Infrastructure project already has `Npgsql.EntityFrameworkCore.PostgreSQL` added in Story 1.1 — confirm version is `10.*`.
- No conflicts with Story 1.2 (frontend-only story) — these changes are entirely in the `backend/` directory.

### References

- Epic source: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- EF Core + snake_case pattern: [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Problem Details middleware: [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- Database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions (PostgreSQL)]
- Backend stack standards: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Stack]
- Backend folder structure: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Folder Structure (.NET Solution)]
- AppDbContext architecture location: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- ExceptionHandlingMiddleware (existing): [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#ExceptionHandlingMiddleware pattern]
- Test cases for Story 1.3: [Source: _bmad-output/implementation-artifacts/test-design-epic-1.md#TC-E1-P0-05, TC-E1-P1-05, TC-E1-P2-04]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List
