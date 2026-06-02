# SiesaAgents Backend (.NET 10)

Backend services for the SiesaAgents platform. Clean Architecture + DDD on
.NET 10 with Minimal APIs, EF Core 10 and PostgreSQL 18.

## Solution Layout

```
backend/
  SiesaAgents.slnx
  src/
    SiesaAgents.API/             # Minimal API host
    SiesaAgents.Application/     # Use cases, CQRS, validators
    SiesaAgents.Domain/          # Entities, value objects, domain events
    SiesaAgents.Infrastructure/  # EF Core, repositories, external adapters
  tests/
    SiesaAgents.UnitTests/
    SiesaAgents.IntegrationTests/
```

## Prerequisites

- .NET SDK 10.x
- PostgreSQL 18+ running locally (default for the dev connection string)
- `dotnet-ef` global tool 10.x:
  ```bash
  dotnet tool install --global dotnet-ef --version 10.*
  ```

## Build & Test

```bash
# From backend/
dotnet build SiesaAgents.slnx

# Unit + API integration tests (skip DB-touching tests by default)
dotnet test SiesaAgents.slnx --filter "Category!=Db"

# Full suite (requires Docker for TestContainers-Postgres)
dotnet test SiesaAgents.slnx
```

## EF Core Migrations

All `dotnet ef` commands run from `backend/` with the Infrastructure project
as the migrations target and the API project as the startup project.

```bash
# Add a new migration
dotnet ef migrations add <Name> \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API \
  --output-dir Data/Migrations

# Apply pending migrations to the configured database
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API

# Revert the last migration
dotnet ef migrations remove \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

## Connection String

The dev connection string lives in
`src/SiesaAgents.API/appsettings.Development.json` and points to a local
PostgreSQL instance (`postgres` / `postgres`). **Do not commit production
credentials.** Override per environment:

```bash
# Linux / macOS
export ConnectionStrings__DefaultConnection="Host=...;Database=...;Username=...;Password=..."

# PowerShell
$Env:ConnectionStrings__DefaultConnection = "Host=...;Database=...;Username=...;Password=..."
```

`appsettings.json` ships an empty placeholder so `Configuration.GetConnectionString`
never returns `null` in non-Dev environments and EF tooling resolves cleanly.

## API Documentation

The API exposes Scalar at `/scalar` (NEVER Swagger). The root path redirects
there.
