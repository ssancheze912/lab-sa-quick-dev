# Siesa-Agents Backend

.NET 10 Minimal API + EF Core 10 + PostgreSQL 18.

## Database setup

Prerequisite: PostgreSQL 18+ running locally (or via Docker).

```bash
# Optional — start Postgres in Docker if you don't have a local install:
docker run --name siesa-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:18-alpine
```

Apply migrations from the `backend/` folder:

```bash
dotnet ef database update \
  --project src/SiesaAgents.Infrastructure \
  --startup-project src/SiesaAgents.API
```

Story 1.3 introduces an empty initial migration (`InitialCreate`). Domain tables
(`clientes`, `contactos`) are created by later stories (Epic 2 Story 2.1 and Epic 3
Story 3.1 respectively). After running the migration you should see only the
`__ef_migrations_history` table (snake_case) in the `siesa_agents_db` database.

## Naming convention

All EF-managed tables and columns are automatically renamed to `snake_case` via
`EFCore.NamingConventions` (`UseSnakeCaseNamingConvention()`). The migration history
table itself is created as `__ef_migrations_history` — see
`SiesaAgents.Infrastructure/Data/AppDbContext.cs`.

## Run

```bash
dotnet run --project src/SiesaAgents.API
```

The API boots on http://localhost:5000 with Scalar docs at
[http://localhost:5000/scalar](http://localhost:5000/scalar).

## Test

```bash
dotnet test SiesaAgents.sln
```

Integration tests that touch PostgreSQL use a dedicated `siesa_agents_db_test`
database and skip gracefully with a clear message if Postgres is not reachable
at `localhost:5432` (credentials `postgres` / `postgres`).
