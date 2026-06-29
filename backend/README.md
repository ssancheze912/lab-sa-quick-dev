# SiesaAgents — Backend

.NET 10 / EF Core 10 / PostgreSQL 18 backend for the SiesaAgents application.

## Local development

### 1. Start PostgreSQL

Use Docker (one-liner):

```bash
docker run --name siesa-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18
```

The default connection string lives in `src/SiesaAgents.API/appsettings.Development.json`:

```
Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres
```

### 2. Apply EF Core migrations

Install the EF tooling once (per machine):

```bash
dotnet tool install --global dotnet-ef
```

Then from `backend/`:

```bash
# Add a new migration (only when you add or change an entity / configuration)
dotnet ef migrations add <MigrationName> \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API \
    --output-dir Migrations

# Apply pending migrations to the configured database
dotnet ef database update \
    --project src/SiesaAgents.Infrastructure \
    --startup-project src/SiesaAgents.API
```

### 3. Run the API

```bash
cd src/SiesaAgents.API
dotnet run
```

API listens on port 5000 (HTTP) / Scalar docs at `/scalar`.

## Architecture notes

- Clean Architecture + DDD (API → Application → Domain → Infrastructure).
- Database conventions enforced by `EFCore.NamingConventions` — `AppDbContext.OnModelCreating`
  calls `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement. Never add manual
  `[Table]` / `[Column]` attributes.
- `__ef_migrations_history` columns end up as `migration_id` / `product_version`
  (snake_case, enforced by the same convention).

## Migrations scope

| Story | Migration content |
|-------|-------------------|
| 1.3   | Empty `InitialCreate` (no domain tables) — bootstraps `__ef_migrations_history` |
| 2.1   | `clientes` table |
| 3.1   | `contactos` table |

## Tests

```bash
# All tests (unit + integration)
dotnet test backend/SiesaAgents.sln

# Integration tests only (Testcontainers requires Docker)
dotnet test backend/tests/SiesaAgents.IntegrationTests/SiesaAgents.IntegrationTests.csproj
```
