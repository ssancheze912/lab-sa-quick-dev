# SiesaAgents.IntegrationTests

Integration test project for the Siesa Agents backend. Introduced in Story 1.3
to host xUnit + Testcontainers + `WebApplicationFactory<Program>` tests that
exercise the API in-process against a real PostgreSQL 18 container.

## Prerequisites

- **.NET 10 SDK** (`dotnet --list-sdks` must show a `10.*` entry).
- **Docker Desktop / Docker Engine reachable** — required by
  `Testcontainers.PostgreSql` in `MigrationsAndSnakeCaseTests.cs` to spin up an
  isolated `postgres:18-alpine` container per test run.

## Running

```bash
# From backend/
dotnet test tests/SiesaAgents.IntegrationTests --filter Category=Integration

# Or from the solution root
dotnet test SiesaAgents.sln --filter Category=Integration
```

## Skipping on machines without Docker

If Docker is not available in the current environment, filter Testcontainers
tests out:

```bash
dotnet test SiesaAgents.sln --filter Category!=Integration
```

`ProblemDetailsMiddlewareTests` does NOT require Docker — it only spins up the
API in-process via `WebApplicationFactory<Program>`. `MigrationsAndSnakeCaseTests`
does require Docker and will halt in `InitializeAsync` with a Testcontainers
"docker not reachable" error if Docker is absent.

## Test categories

All classes in this project carry `[Trait("Category", "Integration")]` so they
can be included/excluded from CI runs uniformly.
