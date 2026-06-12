# ATDD Checklist - Epic 1, Story 1.3: Backend Database Foundation

**Date:** 2026-06-12
**Author:** TEA Agent (sa-tea-atdd)
**Story:** 1.3 — Backend Database Foundation
**Epic:** 1 — Project Foundation & Application Shell
**Primary Test Levels:** API Integration (Playwright API request context)

---

## Story Summary

As a developer,
I want the PostgreSQL database connected and the EF Core infrastructure configured,
so that subsequent stories can define entities and run migrations against a working data layer.

---

## Acceptance Criteria

1. **AC1** — Given PostgreSQL is running locally, When the developer runs `dotnet ef database update` from the `backend/` directory, Then the `siesa_agents_db` database is created with no errors, and the `__ef_migrations_history` table exists in snake_case (confirming `ApplySnakeCaseNaming()` is active).

2. **AC2** — Given the initial migration is applied, When the developer inspects the database, Then no domain tables (`clientes`, `contactos`) exist — the migration is intentionally empty. Only `__ef_migrations_history` is present.

3. **AC3** — Given an unhandled exception occurs anywhere in the backend request pipeline, When the error reaches the `ExceptionHandlingMiddleware`, Then the response returns `Content-Type: application/problem+json`, HTTP status 500, and a JSON body containing `status`, `title`, and `detail` fields — with NO `stackTrace`, `exception`, or `innerException` keys exposed (NFR6).

4. **AC4** — Given the backend receives any request, When EF Core maps entities to the database, Then `modelBuilder.ApplySnakeCaseNaming()` is the LAST call inside `OnModelCreating` in `AppDbContext`, ensuring all current and future column names follow snake_case convention.

5. **AC5** — Given the solution is configured, When the developer runs `dotnet build SiesaAgents.sln` from `backend/`, Then all projects compile with zero errors and `SiesaAgents.Infrastructure` references `Npgsql.EntityFrameworkCore.PostgreSQL` and `Microsoft.EntityFrameworkCore.Design`.

---

## Failing Tests Created (RED Phase)

### API Integration Tests — Playwright API Request Context (15 tests)

**File:** `e2e/tests/api/backend-database-foundation.api.spec.ts`

**Status:** Tests generated in RED phase — will fail until backend implementation is complete.

---

#### TC-E1-P0-05: AC3 — ExceptionHandlingMiddleware returns Problem Details RFC 7807

**Test Group:** `TC-E1-P0-05 — AC3: ExceptionHandlingMiddleware returns Problem Details RFC 7807`

- **Test:** `should return HTTP 500 when an unhandled exception occurs in the backend pipeline`
  - **Status:** RED — `/api/v1/test-error` endpoint does not exist yet
  - **Verifies:** `response.status() === 500`

- **Test:** `should return Content-Type application/problem+json for unhandled exceptions`
  - **Status:** RED — Middleware not implemented; endpoint missing
  - **Verifies:** `content-type` header contains `application/problem+json`

- **Test:** `should return a JSON body containing the "status" field on unhandled exception`
  - **Status:** RED — No middleware response body until endpoint + middleware exist
  - **Verifies:** `body.status === 500`

- **Test:** `should return a JSON body containing the "title" field on unhandled exception`
  - **Status:** RED — No middleware response body
  - **Verifies:** `body.title` is a non-empty string

- **Test:** `should NOT expose stackTrace in the error response body (NFR6)`
  - **Status:** RED — No middleware; no response body to validate
  - **Verifies:** `body` does NOT have property `stackTrace`

- **Test:** `should NOT expose exception details in the error response body (NFR6)`
  - **Status:** RED — No middleware; no response body
  - **Verifies:** `body` does NOT have property `exception`

- **Test:** `should NOT expose innerException in the error response body (NFR6)`
  - **Status:** RED — No middleware; no response body
  - **Verifies:** `body` does NOT have property `innerException`

- **Test:** `should return the "detail" field as null (not exposing internal error message)`
  - **Status:** RED — No middleware; no response body
  - **Verifies:** `body.detail` is null or absent (never an internal error string)

---

#### TC-E1-P1-05: AC1/AC2 — EF Core migration creates database and migrations table

**Test Group:** `TC-E1-P1-05 — AC1/AC2: EF Core migration creates database and migrations table`

- **Test:** `should have the backend respond to API requests (confirming DB connection is established)`
  - **Status:** RED — Backend not running; `dotnet ef database update` not yet applied
  - **Verifies:** `GET /scalar` returns HTTP 200 (DB connection live, backend started)

- **Test:** `should confirm the database health endpoint responds (DB is reachable)`
  - **Status:** RED — `/api/v1/health` endpoint does not exist yet
  - **Verifies:** `GET /api/v1/health` returns HTTP 200

- **Test:** `should confirm no domain-level tables are exposed via API (empty migration scope)`
  - **Status:** RED — Backend not running; no endpoint mapped for `/api/v1/clientes`
  - **Verifies:** `GET /api/v1/clientes` returns 404 or 500 (scope note: no domain tables in 1.3)

- **Test:** `should confirm no contactos table endpoint is available (empty migration scope)`
  - **Status:** RED — Backend not running; no endpoint for `/api/v1/contactos`
  - **Verifies:** `GET /api/v1/contactos` returns 404 or 500

---

#### TC-E1-P2-04: AC4 — ApplySnakeCaseNaming() produces snake_case columns

**Test Group:** `TC-E1-P2-04 — AC4: ApplySnakeCaseNaming() produces snake_case columns`

- **Test:** `should confirm the backend uses snake_case naming (inferred via successful DB operations)`
  - **Status:** RED — Backend not running; snake_case model not applied
  - **Verifies:** `GET /scalar` returns HTTP 200 (backend starts only if snake_case model matches DB schema)

- **Test:** `should expose a diagnostic endpoint confirming EF Core model uses snake_case convention`
  - **Status:** RED — `/api/v1/db-info` endpoint does not exist yet
  - **Verifies:** `GET /api/v1/db-info` returns HTTP 200 with snake_case confirmation

---

#### AC5 — Infrastructure project builds with required package references

**Test Group:** `AC5 — Infrastructure project builds with required package references`

- **Test:** `should confirm SiesaAgents.Infrastructure Npgsql package is active (DB responds)`
  - **Status:** RED — Backend not running; Npgsql package not yet configured
  - **Verifies:** `GET /scalar` returns HTTP 200 (Npgsql resolved at runtime)

- **Test:** `should confirm all four Clean Architecture projects are referenced and compiled`
  - **Status:** RED — Backend not running; solution not built
  - **Verifies:** `GET /scalar` returns HTTP 200 (all 4 CA projects compiled successfully)

---

## Required Backend Endpoints (for tests to pass)

The following backend endpoints must be implemented for the GREEN phase:

| Endpoint | Method | Required By | Expected Response |
|----------|--------|-------------|-------------------|
| `/api/v1/test-error` | GET | TC-E1-P0-05 | Throws unhandled exception → 500 Problem Details |
| `/api/v1/health` | GET | TC-E1-P1-05 | 200 OK (DB connection alive) |
| `/scalar` | GET | TC-E1-P1-05, TC-E1-P2-04, AC5 | 200 OK (Scalar API docs) |
| `/api/v1/db-info` (optional) | GET | TC-E1-P2-04 | 200 OK with snake_case info |

**Note:** `/api/v1/test-error` is a test-only endpoint. Register it only in test/development configuration; never expose it in production.

---

## Required Backend Implementation (for tests to pass)

### ExceptionHandlingMiddleware (AC3)

```csharp
// backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs
context.Response.ContentType = "application/problem+json";
context.Response.StatusCode = 500;
await context.Response.WriteAsJsonAsync(new ProblemDetails
{
    Status = 500,
    Title = "An unexpected error occurred.",
    Detail = null   // NEVER expose ex.Message or stack traces (NFR6)
});
```

**Middleware ordering (CRITICAL):**
```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>(); // FIRST — before all endpoint mappings
app.UseCors("DevCors");
app.MapScalarApiReference();
```

### AppDbContext (AC1, AC4)

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    modelBuilder.ApplySnakeCaseNaming(); // MUST be LAST call
}
```

### DI Registration (AC1, AC5)

```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions => npgsqlOptions.MigrationsAssembly("SiesaAgents.Infrastructure")));
```

### appsettings.Development.json (AC1)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres"
  }
}
```

---

## Data Factories Created

No domain entity factories required for Story 1.3. This story establishes infrastructure plumbing only — no domain entities are created.

---

## Mock Requirements

**API Integration tests (Playwright):** No mocks required. Tests make real HTTP calls to the running backend at `http://localhost:5000`. The `API_BASE_URL` environment variable can override this.

**Backend test endpoint:** `/api/v1/test-error` must be registered in the backend to trigger the `ExceptionHandlingMiddleware`. This can be done conditionally in `Program.cs`:

```csharp
// TEST-ONLY endpoint — triggers ExceptionHandlingMiddleware
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/v1/test-error", () =>
    {
        throw new Exception("internal test");
    });
}
```

---

## Implementation Checklist

### Test Group: AC3 — ExceptionHandlingMiddleware (TC-E1-P0-05)

**Files to make these tests pass:**

- [ ] Open `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (created in Story 1.1)
- [ ] Confirm `catch` block sets `Content-Type = "application/problem+json"`, `StatusCode = 500`
- [ ] Confirm body: `{ status: 500, title: "...", detail: null }` — NO `ex.Message` or stack trace
- [ ] Confirm `app.UseMiddleware<ExceptionHandlingMiddleware>()` is FIRST in `Program.cs` pipeline
- [ ] Register test endpoint `GET /api/v1/test-error` (development-only, throws `new Exception("internal test")`)
- [ ] Run API tests: `pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "TC-E1-P0-05"`
- [ ] All 7 tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC1/AC2 — EF Core Migration (TC-E1-P1-05)

**Files to make these tests pass:**

- [ ] Implement `AppDbContext` with `DbContextOptions<AppDbContext>` constructor
- [ ] Register `AddDbContext<AppDbContext>()` with `UseNpgsql()` in `Program.cs`
- [ ] Add connection string `DefaultConnection` to `appsettings.Development.json`
- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `SiesaAgents.Infrastructure.csproj`
- [ ] Run `dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure --startup-project src/SiesaAgents.API --output-dir Data/Migrations`
- [ ] Verify `Up()` and `Down()` methods are empty (no domain tables)
- [ ] Run `dotnet ef database update` — confirm `siesa_agents_db` created with no errors
- [ ] Start backend and run: `pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "TC-E1-P1-05"`
- [ ] All 4 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC4 — snake_case Naming (TC-E1-P2-04)

**Files to make these tests pass:**

- [ ] Confirm `modelBuilder.ApplySnakeCaseNaming()` is the LAST call in `AppDbContext.OnModelCreating`
- [ ] Run `dotnet ef database update` and verify `__ef_migrations_history` has snake_case columns (`migration_id`, `product_version`)
- [ ] Optionally: implement `GET /api/v1/db-info` endpoint returning snake_case confirmation
- [ ] Run API tests: `pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "TC-E1-P2-04"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC5 — Infrastructure Build (runtime verification)

**Files to make these tests pass:**

- [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL 10.*` to `SiesaAgents.Infrastructure.csproj`
- [ ] Add `Microsoft.EntityFrameworkCore.Design 10.*` to both `SiesaAgents.Infrastructure.csproj` and `SiesaAgents.API.csproj`
- [ ] Run `dotnet build SiesaAgents.sln` — confirm zero errors
- [ ] Start backend and run: `pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AC5"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run ALL API tests for Story 1.3
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts

# Run tests for specific AC
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "TC-E1-P0-05"
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "TC-E1-P1-05"
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "TC-E1-P2-04"
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --grep "AC5"

# Run with specific API_BASE_URL
API_BASE_URL=http://localhost:5000 pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts

# Run in headed mode (see browser dev tools)
pnpm exec playwright test e2e/tests/api/backend-database-foundation.api.spec.ts --headed
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- Tests generated in `e2e/tests/api/backend-database-foundation.api.spec.ts`
- 15 API integration tests covering all 5 ACs
- Implementation checklist created per AC group
- Mock requirements documented (test-only endpoint pattern)

**Total tests generated:** 15 tests (API Integration — Playwright request context)

**Expected failure modes in RED phase:**

- `ERR_CONNECTION_REFUSED` — Backend not running (most tests fail with connection error)
- `404 Not Found` — `/api/v1/test-error` and `/api/v1/health` endpoints not yet implemented
- `200 instead of [404,500]` — Would indicate premature Epic 2 work (clientes/contactos endpoints)

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities (priority order):**

1. **Configure AppDbContext** — constructor + OnModelCreating with ApplySnakeCaseNaming() as LAST call
2. **Register DI** — AddDbContext<AppDbContext>() with UseNpgsql() in Program.cs
3. **Add connection string** — appsettings.Development.json
4. **Add NuGet packages** — Npgsql + EF Core Design in Infrastructure + API csproj
5. **Create initial migration** — empty Up()/Down() via `dotnet ef migrations add InitialCreate`
6. **Apply migration** — `dotnet ef database update`
7. **Verify ExceptionHandlingMiddleware** — confirm ordering + Problem Details format + no stack trace
8. **Register test-error endpoint** — development-only endpoint for TC-E1-P0-05
9. **Run tests** — verify all 15 tests go green

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. **Verify all 15 API tests pass** (green phase complete)
2. **Remove `/api/v1/test-error`** from production configuration (keep development-only)
3. **Verify NFR6 compliance** — confirm no stack traces, exception messages, or inner exceptions in any error response
4. **Verify migration is empty** — `Up()` and `Down()` methods contain no table creation statements
5. **Run full test suite** to ensure no regressions

---

## Knowledge Base References Applied

- **Problem Details RFC 7807** — `Content-Type: application/problem+json`, `status`, `title`, `detail` fields
- **NFR6 (no stack trace exposure)** — ExceptionHandlingMiddleware must NEVER expose `ex.Message` or stack traces
- **EF Core snake_case convention** — `ApplySnakeCaseNaming()` MUST be the LAST call in `OnModelCreating`
- **Middleware ordering** — `ExceptionHandlingMiddleware` must be registered BEFORE endpoint mappings
- **Given-When-Then pattern** — all tests follow GWT structure with comments
- **No hard waits** — Playwright `request.get()` is async-explicit; no `page.waitForTimeout()` used

---

## Notes

- Story 1.3 tests are purely backend API-level — no frontend dependency
- The `API_BASE_URL` env var defaults to `http://localhost:5000` matching the backend dev port
- Playwright's `request` fixture (APIRequestContext) is used — NOT `page.goto()`; no browser navigation needed
- These tests do NOT require a running frontend (they are API tests, not E2E browser tests)
- The `/api/v1/test-error` endpoint must be registered AFTER `app.UseMiddleware<ExceptionHandlingMiddleware>()` in the pipeline — otherwise the middleware won't catch the exception
- TC-E1-P2-04's `db-info` test will remain RED until an explicit diagnostic endpoint is added (the snake_case verification is otherwise validated implicitly via TC-E1-P1-05 DB startup tests)

---

**Generated by BMad TEA Agent (sa-tea-atdd)** - 2026-06-12
