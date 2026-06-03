# Story 1.3: Backend Database Foundation

Status: draft

## Story

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

## Acceptance Criteria

1. **Given** PostgreSQL is running locally, **When** the developer runs `dotnet ef database update` from `backend/src/SiesaAgents.Infrastructure`, **Then** the `siesa_agents_db` database is created with no errors, and an EF Core `Migrations/` folder exists in `SiesaAgents.Infrastructure` containing an empty initial migration (no domain tables).

2. **Given** an unhandled exception occurs in the backend, **When** the error reaches the middleware, **Then** the response body is `application/problem+json` with RFC 7807 fields (`status`, `title`, `detail`) and no stack trace is exposed in the response — matching the pattern already implemented in `ExceptionHandlingMiddleware.cs` (NFR6). This AC validates the existing middleware is correctly wired and tested.

3. **Given** the backend receives any request that triggers `OnModelCreating`, **When** EF Core builds the model, **Then** `modelBuilder.ApplySnakeCaseNaming()` is called last inside `OnModelCreating` in `AppDbContext`, ensuring all future entity column names follow snake_case convention — with no `[Column]` or `[Table]` attributes required on entities.

4. **Given** the `AppDbContext` is registered in `Program.cs`, **When** `dotnet build SiesaAgents.sln` is executed, **Then** all projects compile with zero errors.

5. **Given** an xUnit integration test that instantiates `AppDbContext` with an in-memory or test connection string, **When** the context is created, **Then** `AppDbContext` resolves without errors and `ApplySnakeCaseNaming()` is confirmed active via `EFCore.NamingConventions` package.

## Tasks / Subtasks

- [ ] Task 1 — Add EF Core NamingConventions package to Infrastructure and configure `AppDbContext` (AC: #3, #4)
  - [ ] Add NuGet package `EFCore.NamingConventions` to `SiesaAgents.Infrastructure.csproj` (required for `ApplySnakeCaseNaming()`)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs` extending `DbContext` with:
    - Constructor accepting `DbContextOptions<AppDbContext>`
    - Override `OnModelCreating(ModelBuilder modelBuilder)` calling `modelBuilder.ApplySnakeCaseNaming()` as the last statement
    - No `DbSet<>` properties at this stage (empty initial migration, no domain tables)
  - [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/` directory structure

- [ ] Task 2 — Register `AppDbContext` in `Program.cs` with PostgreSQL connection string (AC: #4)
  - [ ] Add `Microsoft.EntityFrameworkCore.Design` package to `SiesaAgents.API.csproj` (required for `dotnet ef` CLI tooling)
  - [ ] In `Program.cs`, register `AppDbContext` via:
    ```csharp
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
               .UseSnakeCaseNamingConvention());
    ```
  - [ ] Add `using SiesaAgents.Infrastructure.Data;` and `using Microsoft.EntityFrameworkCore;` to `Program.cs`
  - [ ] Verify the connection string key `DefaultConnection` matches `appsettings.Development.json` (already set to `Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres`)

- [ ] Task 3 — Create empty initial EF Core migration (AC: #1)
  - [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API` from `backend/` directory
  - [ ] Verify `backend/src/SiesaAgents.Infrastructure/Migrations/` folder is created with:
    - `{timestamp}_InitialCreate.cs` — migration class with empty `Up()` and `Down()` methods (no domain tables)
    - `AppDbContextModelSnapshot.cs` — snapshot file
  - [ ] Confirm the migration `Up()` method contains only `migrationBuilder.EnsureSchema(...)` or is empty — no `CreateTable` calls (domain tables are for Epic 2 and Epic 3)

- [ ] Task 4 — Verify and enhance `ExceptionHandlingMiddleware` for Problem Details compliance (AC: #2)
  - [ ] Review `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` — already implemented in Story 1.1
  - [ ] Ensure `Detail = null` is set (no stack trace exposure) — already compliant
  - [ ] Add `Type` field to `ProblemDetails` response: `Type = "https://tools.ietf.org/html/rfc7807"` for full RFC 7807 compliance
  - [ ] Write/update xUnit test in `SiesaAgents.UnitTests` asserting: status 500, `Content-Type: application/problem+json`, no `StackTrace` field in response body

- [ ] Task 5 — Write unit tests (AC: #2, #5)
  - [ ] Create `backend/tests/SiesaAgents.UnitTests/Infrastructure/AppDbContextTests.cs`:
    - Test: `AppDbContext` instantiates with `UseInMemoryDatabase` options (add `Microsoft.EntityFrameworkCore.InMemory` to test project)
    - Test: `OnModelCreating` runs without exception
    - Test: Entity type naming follows snake_case (verify via `context.Model.FindEntityType(typeof(...))?.GetTableName()` once any entity is registered)
  - [ ] Update `backend/tests/SiesaAgents.UnitTests/API/ExceptionHandlingMiddlewareTests.cs`:
    - Verify existing tests cover RFC 7807 `status`, `title`, `detail` fields
    - Add assertion that `Type` field equals `"https://tools.ietf.org/html/rfc7807"` if not already present

## Dev Notes

### Infrastructure Package Versions

- `EFCore.NamingConventions`: `8.*` or latest compatible with EF Core 10 — verify compatibility
  - **Note**: `ApplySnakeCaseNaming()` is the extension method provided by this package. Alternatively, `.UseSnakeCaseNamingConvention()` via Npgsql provider may be used — both are valid; prefer `EFCore.NamingConventions` for explicit control.
- `Microsoft.EntityFrameworkCore.Design`: `10.*` — required for `dotnet ef` migrations CLI tool
- `Microsoft.EntityFrameworkCore.InMemory`: `10.*` — only for test project

**Package registration:**

```xml
<!-- SiesaAgents.Infrastructure.csproj -->
<PackageReference Include="EFCore.NamingConventions" Version="9.*" />
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
```

```xml
<!-- SiesaAgents.API.csproj — needed for dotnet ef CLI to find startup project -->
<PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="10.*">
  <PrivateAssets>all</PrivateAssets>
  <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
```

```xml
<!-- SiesaAgents.UnitTests.csproj -->
<PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="10.*" />
```

### `AppDbContext` Pattern

```csharp
// backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<> properties at this stage.
    // ClienteEntity and ContactoEntity DbSets are added in Epic 2 (Story 2.1) and Epic 3 (Story 3.1).

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply EF Core configurations from Infrastructure/Data/Configurations/
        // (no configurations at this stage — added per entity in Epic 2 and Epic 3)
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // ALWAYS last: Apply snake_case naming for all columns/tables → PostgreSQL convention
        modelBuilder.UseSnakeCaseNamingConvention();
    }
}
```

**Note on `ApplySnakeCaseNaming()` vs `UseSnakeCaseNamingConvention()`:** Per company standards, `ApplySnakeCaseNaming()` is mentioned in the architecture document. This is the method provided by `EFCore.NamingConventions` package when calling `optionsBuilder.UseSnakeCaseNamingConvention()`. Both approaches achieve the same result — use whichever is available from the installed package. The `modelBuilder.UseSnakeCaseNamingConvention()` call inside `OnModelCreating` is the accepted pattern.

### `Program.cs` DbContext Registration

```csharp
// Add after CORS registration, before var app = builder.Build()
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());
```

Full updated `Program.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(
                builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                ?? ["http://localhost:5173"])
              .AllowAnyHeader()
              .AllowAnyMethod()));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapScalarApiReference();
app.MapOpenApi();

app.Run();
```

### Migration Commands

Run from `backend/` directory (not the solution root):

```bash
# Add migration (empty initial — no domain tables)
dotnet ef migrations add InitialCreate \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Data/Migrations

# Apply migration to database (creates siesa_agents_db if not exists)
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

**Expected migration output (`InitialCreate.cs`):**

```csharp
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) { }
    protected override void Down(MigrationBuilder migrationBuilder) { }
}
```

No `CreateTable` calls — domain tables are deferred to Epic 2 (Story 2.1) and Epic 3 (Story 3.1).

### ExceptionHandlingMiddleware Enhancement

The middleware from Story 1.1 is already functionally correct. This story adds the `Type` field for strict RFC 7807 compliance:

```csharp
await context.Response.WriteAsJsonAsync(new ProblemDetails
{
    Status = 500,
    Title = "An unexpected error occurred.",
    Detail = null,   // Never expose ex.Message or stack traces
    Type = "https://tools.ietf.org/html/rfc7807"
});
```

### Database Conventions (from architecture.md)

- Database name: `siesa_agents_db`
- All tables: plural snake_case (e.g., `clientes`, `contactos`) — applied automatically via `ApplySnakeCaseNaming()`
- All columns: snake_case — `created_at`, `updated_at`, `cliente_id`
- PKs: UUID — `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- NO `[Column]` or `[Table]` attributes on C# entities — EF Core naming convention handles the mapping

### Scope Guard

**DO NOT** create `ClienteEntity`, `ContactoEntity`, or any domain tables in this story.

- `ClienteEntity` and `clientes` table: Story 2.1 (Epic 2)
- `ContactoEntity` and `contactos` table: Story 3.1 (Epic 3)
- `AppDbContext.DbSet<ClienteEntity>` and `AppDbContext.DbSet<ContactoEntity>`: Stories 2.1 and 3.1 respectively

This story creates ONLY:
- `AppDbContext.cs` (empty, no DbSets)
- Empty initial migration with no `CreateTable` calls
- `Data/Configurations/` folder (empty placeholder for future entity configurations)

### Backend Folder Structure (New Files)

```
backend/
└── src/
    ├── SiesaAgents.API/
    │   ├── SiesaAgents.API.csproj    ← MODIFY: add EF Design package
    │   └── Program.cs                ← MODIFY: register AppDbContext
    └── SiesaAgents.Infrastructure/
        ├── SiesaAgents.Infrastructure.csproj  ← MODIFY: add EFCore.NamingConventions
        └── Data/
            ├── AppDbContext.cs        ← CREATE
            ├── Configurations/        ← CREATE (empty folder — placeholder)
            └── Migrations/            ← GENERATED by dotnet ef migrations add
                ├── {timestamp}_InitialCreate.cs
                └── AppDbContextModelSnapshot.cs
tests/
└── SiesaAgents.UnitTests/
    ├── SiesaAgents.UnitTests.csproj  ← MODIFY: add EF InMemory package
    └── Infrastructure/
        └── AppDbContextTests.cs       ← CREATE
```

### Testing Standards

- **Framework**: xUnit (already configured in `SiesaAgents.UnitTests`)
- **EF Core testing**: `Microsoft.EntityFrameworkCore.InMemory` for unit tests (no actual PostgreSQL required)
- **Test structure**: Arrange / Act / Assert
- **Coverage target**: >80% for new infrastructure code

**`AppDbContextTests.cs` pattern:**

```csharp
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    private static DbContextOptions<AppDbContext> BuildInMemoryOptions() =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

    [Fact]
    public void AppDbContext_Instantiates_WithInMemoryOptions()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);

        // Assert
        Assert.NotNull(context);
    }

    [Fact]
    public void OnModelCreating_Runs_WithoutException()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);
        var exception = Record.Exception(() => context.Model);   // triggers OnModelCreating

        // Assert
        Assert.Null(exception);
    }
}
```

### Previous Story Learnings

- `dotnet` CLI commands were not available in CI during Stories 1.1 and 1.2 — migration generation may need to be performed on a developer machine with the full .NET SDK and EF Core tools (`dotnet tool install --global dotnet-ef`).
- `appsettings.Development.json` already has `ConnectionStrings:DefaultConnection` pointing to `siesa_agents_db` — no changes needed there.
- `ExceptionHandlingMiddleware.cs` is already functional from Story 1.1; this story only adds the `Type` RFC 7807 field.
- All four Clean Architecture projects compile with zero errors per Story 1.1 completion — this story must maintain that state.

### Git Commit Convention

```
feat(story-1.3): configure EF Core infrastructure and empty initial migration
```

### References

- Epic source and AC: [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3]
- AppDbContext + ApplySnakeCaseNaming: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Database conventions: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Database Conventions]
- Problem Details RFC 7807: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#Backend Critical Rules]
- Connection string and database name: [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md#Configure appsettings.Development.json]
- Backend project structure: [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- EF Core naming conventions rule: [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#EF Core: Automatic snake_case via ApplySnakeCaseNaming()]
- Scope note (no domain tables): [Source: _bmad-output/planning-artifacts/epics/epic-01-foundation.md#Story 1.3 Scope note]
