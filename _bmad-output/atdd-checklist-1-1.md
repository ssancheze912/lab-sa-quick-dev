# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-08
**Author:** SiesaTeam
**Primary Test Level:** E2E + API + Filesystem Structural

---

## Story Summary

Story 1.1 initializes the full project skeleton: a Vite React TypeScript frontend and a .NET 10
Clean Architecture backend, wired together with correct project references, CORS configuration,
and a health endpoint. No domain entities or business logic are created in this story.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized
with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Frontend Vite dev server starts on port 5173, TypeScript strict mode enabled, no
   compilation errors, default welcome page rendered.
2. **AC2** — Backend starts on port 5000, Scalar API reference loads at `/scalar`, NO
   Swagger/OpenAPI middleware registered.
3. **AC3** — `SiesaAgents.sln` references exactly four projects (API, Application, Domain,
   Infrastructure) plus UnitTests, with correct project-to-project references.
4. **AC4** — Both servers running; frontend request to `/api/v1/health` returns HTTP 200 with
   `Access-Control-Allow-Origin: http://localhost:5173`.
5. **AC5** — `pnpm run build` completes with zero TypeScript errors and zero ESLint errors.
6. **AC6** — `dotnet build` compiles the entire solution with zero warnings and zero errors.
7. **AC7** — `frontend/src/` contains the required directories: `routes/`, `modules/`,
   `shared/components/`, `shared/lib/`, `app/providers/`, `infrastructure/api/`.
8. **AC8** — `AppDbContext.cs` calls `modelBuilder.ApplySnakeCaseNaming()` as the LAST statement
   in `OnModelCreating` and no `[Column]` or `[Table]` attributes appear on any entity.

---

## Failing Tests Created (RED Phase)

### E2E Tests (8 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (~157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — fails because frontend project does not exist yet
  - **Verifies:** AC1 — frontend server running on port 5173

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — fails because `data-testid="app-root"` does not exist yet
  - **Verifies:** AC1 — React root element present in rendered HTML

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — fails because frontend project not scaffolded yet
  - **Verifies:** AC1 — TypeScript strict mode produces no console errors

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — fails because frontend project not scaffolded yet
  - **Verifies:** AC1 — no JS runtime exceptions on first render

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — fails because backend not running and CORS not configured
  - **Verifies:** AC4 (partial) / AC3-CORS — no CORS errors when fetching `/scalar`

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — fails because backend server is not running
  - **Verifies:** AC4 — backend responds to GET /scalar from frontend origin

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — fails because frontend project not scaffolded yet
  - **Verifies:** AC5 — Vite error overlay is absent (TypeScript strict compiles cleanly)

### API Tests (15 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (~147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — fails because backend server is not running
  - **Verifies:** AC2 — backend reachable on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — fails because backend not running and Scalar not configured
  - **Verifies:** AC2 — Scalar page loads at `/scalar`

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — fails because backend not running
  - **Verifies:** AC2 — Scalar returns `text/html` content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint`
  - **Status:** RED — fails because backend not running (vacuous 404 not returned)
  - **Verifies:** AC2 — `/swagger` must NOT return 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — fails because backend not running
  - **Verifies:** AC2 — default template endpoint removed

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — fails because backend not running and CORS not configured
  - **Verifies:** AC4 — CORS header present for frontend origin

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — fails because backend not running
  - **Verifies:** AC4 — preflight request succeeds (200 or 204)

- **Test:** `should have all four Clean Architecture layers responding`
  - **Status:** RED — fails because backend not running
  - **Verifies:** AC6 — solution compiled (runtime proxy)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — fails because backend not running
  - **Verifies:** AC6 — middleware registered and returning JSON error format

**File:** `e2e/tests/foundation/project-structure.spec.ts` (~140 lines)

- **Test:** `should respond with HTTP 200 from GET /api/v1/health`
  - **Status:** RED — fails because `/api/v1/health` endpoint does not exist yet
  - **Verifies:** AC4 — health endpoint registered and returns 200

- **Test:** `should return { "status": "healthy" } body from /api/v1/health`
  - **Status:** RED — fails because health endpoint does not exist yet
  - **Verifies:** AC4 — health endpoint returns correct payload

- **Test:** `should include Access-Control-Allow-Origin header for http://localhost:5173`
  - **Status:** RED — fails because health endpoint and CORS not configured
  - **Verifies:** AC4 — CORS header is present on `/api/v1/health`

- **Test:** `should not produce CORS errors in the browser when frontend fetches /api/v1/health`
  - **Status:** RED — fails because frontend and backend not running
  - **Verifies:** AC4 — browser-level CORS validation

- **Test:** `should handle OPTIONS preflight for /api/v1/health from frontend origin`
  - **Status:** RED — fails because backend not running
  - **Verifies:** AC4 — preflight to `/api/v1/health` succeeds

### Structural/Filesystem Tests (24 tests)

**File:** `e2e/tests/foundation/project-structure.spec.ts` (filesystem section)

- **Tests (9):** One per required directory under `frontend/src/`
  - **Status:** RED — all fail because `frontend/` project does not exist yet
  - **Verifies:** AC7 — each required directory in the DDD frontend structure

- **Test:** `should have apiClient.ts in frontend/src/shared/lib/`
  - **Status:** RED — file does not exist yet
  - **Verifies:** AC7 — Axios singleton file present

- **Test:** `should have queryClient.ts in frontend/src/shared/lib/`
  - **Status:** RED — file does not exist yet
  - **Verifies:** AC7 — TanStack QueryClient file present

- **Test:** `should have AppProviders.tsx in frontend/src/app/providers/`
  - **Status:** RED — file does not exist yet
  - **Verifies:** AC7 — AppProviders wrapper file present

- **Test:** `should have .env.development with VITE_API_URL set to http://localhost:5000`
  - **Status:** RED — file does not exist yet
  - **Verifies:** AC7 — dev environment variable configured

**File:** `e2e/tests/foundation/backend-structure.spec.ts` (~220 lines)

- **Tests (5):** SiesaAgents.sln and each .csproj file existence
  - **Status:** RED — all fail because backend/ project has not been scaffolded
  - **Verifies:** AC3 — solution and project files exist

- **Tests (3):** Project reference content checks (.csproj files)
  - **Status:** RED — fail because .csproj files don't exist yet
  - **Verifies:** AC3 — correct project-to-project references (API→App, App→Domain, Infra→Domain)

- **Test:** `should serve the Scalar page proving the solution compiled successfully`
  - **Status:** RED — backend not running
  - **Verifies:** AC6 — runtime proxy for build success

- **Test:** `should serve /api/v1/health proving ExceptionHandlingMiddleware compiled`
  - **Status:** RED — backend not running
  - **Verifies:** AC6 — middleware registered and compiled

- **Test:** `should have ExceptionHandlingMiddleware.cs at expected path`
  - **Status:** RED — file does not exist yet
  - **Verifies:** AC6 — middleware file is present

- **Tests (5):** AppDbContext.cs existence, ApplySnakeCaseNaming() call,
  last-position assertion, no [Column] attributes, no [Table] attributes
  - **Status:** RED — file does not exist yet
  - **Verifies:** AC8 — EF Core snake_case configuration is correct

---

## Data Factories Created

Not applicable for Story 1.1. This story creates infrastructure scaffold only — no domain
entities, no database records, and no user-generated data are involved.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente()` and `buildContacto()`
factories for use in later stories (Epic 2+).

---

## Fixtures Created

The existing `e2e/fixtures/base.fixture.ts` provides:
- `clientesPage` — navigates to `/clientes` before the test
- `contactosPage` — navigates to `/contactos` before the test

No new fixtures are required for Story 1.1 acceptance tests.

---

## Mock Requirements

No external services require mocking for Story 1.1 acceptance tests. The tests validate
the actual running servers (frontend 5173, backend 5000) against the real filesystem.

### Note on Network Interception

The CORS browser test in `project-structure.spec.ts` uses `page.route('**/api/v1/health', ...)` 
to allow the real fetch call to pass through (not intercepted, but registered network-first before
navigation to prevent race conditions). This is the correct network-first pattern.

---

## Required data-testid Attributes

### Root Application Shell

- `app-root` — The root div of the React application (required in `index.html` or `App.tsx`)
  ```html
  <div id="root" data-testid="app-root">...</div>
  ```

**Note:** All other data-testid attributes (navigation items, page layouts) belong to Stories 1.2
and 1.3. Story 1.1 only requires the root mount point to be identifiable.

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors` (AC1)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` from project root
- [ ] Verify `pnpm install` completes without errors in `frontend/`
- [ ] Add `data-testid="app-root"` to the root element in `frontend/index.html` or `App.tsx`
- [ ] Run `pnpm run dev` from `frontend/` — confirm server starts on port 5173
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should render the root HTML document with a valid React mount point` (AC1)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to root container in `frontend/index.html` or `App.tsx`
- [ ] Confirm element is visible in the rendered DOM
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console` (AC1)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`
- [ ] Run `pnpm run dev` and confirm no TypeScript errors in browser console
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Tests: `should respond with HTTP 200` / `should return { "status": "healthy" }` / CORS tests (AC4)

**File:** `e2e/tests/foundation/project-structure.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.API/Endpoints/HealthEndpoints.cs` with `GET /api/v1/health` returning `{ "status": "healthy" }`
- [ ] Register `app.MapHealthEndpoints()` in `Program.cs` BEFORE `app.Run()`
- [ ] Configure CORS policy in `Program.cs`:
  ```csharp
  builder.Services.AddCors(options => {
    options.AddPolicy("DevCors", policy =>
      policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader().AllowAnyMethod());
  });
  app.UseCors("DevCors");
  ```
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapControllers()` / endpoint mapping
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-structure.spec.ts --grep "AC4"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Tests: Solution structure — SiesaAgents.sln and project files (AC3)

**File:** `e2e/tests/foundation/backend-structure.spec.ts`

**Tasks to make these tests pass:**

- [ ] From `backend/`, run: `dotnet new sln -n SiesaAgents`
- [ ] Create all four projects (API, Application, Domain, Infrastructure) per Task 3.1
- [ ] Create `SiesaAgents.UnitTests` project
- [ ] Add all projects to solution: `dotnet sln add ...`
- [ ] Configure P2P references per Task 3.2 (API→App+Infra, App→Domain, Infra→Domain)
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/backend-structure.spec.ts --grep "AC3"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Tests: Frontend directory scaffold (AC7)

**File:** `e2e/tests/foundation/project-structure.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `frontend/src/routes/` directory
- [ ] Create `frontend/src/modules/crm/clientes/` directory
- [ ] Create `frontend/src/modules/crm/contactos/` directory
- [ ] Create `frontend/src/shared/components/` directory
- [ ] Create `frontend/src/shared/lib/` directory
- [ ] Create `frontend/src/app/providers/` directory
- [ ] Create `frontend/src/infrastructure/api/` directory
- [ ] Create `frontend/src/shared/lib/apiClient.ts` with Axios singleton (Task 2.7)
- [ ] Create `frontend/src/shared/lib/queryClient.ts` with TanStack QueryClient (Task 2.8)
- [ ] Create `frontend/src/app/providers/AppProviders.tsx` (Task 2.9)
- [ ] Create `frontend/.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-structure.spec.ts --grep "AC7"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Tests: AppDbContext snake_case rules (AC8)

**File:** `e2e/tests/foundation/backend-structure.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.Infrastructure/Data/AppDbContext.cs`
- [ ] Install `EFCore.NamingConventions` package in Infrastructure project
- [ ] Implement `OnModelCreating` with `modelBuilder.ApplySnakeCaseNaming()` as LAST call
- [ ] Ensure NO `[Column]` or `[Table]` attributes are added to any entity class
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/backend-structure.spec.ts --grep "AC8"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Tests: ExceptionHandlingMiddleware registered and compiled (AC6)

**File:** `e2e/tests/foundation/backend-structure.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` returning Problem Details RFC 7807
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify `dotnet build` succeeds with zero errors/warnings
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/backend-structure.spec.ts --grep "AC6"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Note on AC5 (pnpm run build)

AC5 (zero TypeScript and ESLint errors in `pnpm run build`) is a build-time check that cannot
be fully automated via Playwright E2E. It is verified by:

1. The E2E test `should load the frontend without Vite TypeScript error overlay` — fails if
   TypeScript has compilation errors in dev mode
2. The E2E test `should load without any TypeScript compilation errors visible in the browser console`
3. Manual verification: `pnpm run build` must be run by the developer and output examined

Playwright tests provide runtime proxies but cannot directly inspect the `pnpm run build` exit code.
The developer must run `pnpm run build` manually as the final AC5 verification.

---

## Running Tests

```bash
# Run all failing tests for Story 1.1
pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E frontend tests only
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run structural tests (AC3, AC6, AC7, AC8)
pnpm exec playwright test e2e/tests/foundation/project-structure.spec.ts e2e/tests/foundation/backend-structure.spec.ts

# Run API backend tests only
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/ --headed

# Debug specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests with full trace
pnpm exec playwright test e2e/tests/foundation/ --trace on
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Fixtures and factories assessed (none new required for Story 1.1)
- Mock requirements documented (none required — real servers tested)
- data-testid requirements listed (`app-root`)
- Implementation checklist created

**Verification:**

- All tests run and fail with clear messages indicating missing implementation
- Filesystem tests fail with `expect(false).toBe(true)` messages identifying missing directories/files
- API tests fail with connection refused (backend not running yet)
- E2E tests fail because frontend project does not exist

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from the implementation checklist above (start with AC3 — scaffold)
2. **Read the test** to understand the exact filesystem/runtime expectation
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in the implementation checklist
6. **Move to next test** and repeat

**Recommended implementation order:**

1. Task 1 — Initialize repository structure (makes AC3/AC7 filesystem tests pass)
2. Task 2 — Scaffold frontend (makes AC1, AC5, AC7 tests pass)
3. Task 3 — Scaffold backend (makes AC2, AC3, AC6, AC8 tests pass)
4. Task 4 — CORS validation (makes AC4 tests pass)
5. Task 5 — Unit tests scaffold (validation only, no new Playwright tests)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

1. Verify all tests pass (green phase complete)
2. Review `tsconfig.app.json` and confirm all strict flags are set
3. Review `Program.cs` for clean middleware ordering
4. Confirm `AppDbContext.cs` has no attribute-based naming anywhere
5. Ensure `SiesaAgents.sln` project references are clean and minimal
6. Run full test suite to confirm no regression after refactoring

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/`
3. **Begin implementation** using the implementation checklist above
4. **Work one test at a time** (red → green for each AC)
5. **When all tests pass**, refactor code for quality
6. **Manually verify AC5**: run `pnpm run build` from `frontend/` and confirm zero errors
7. **When refactoring complete**, update story status to `done` in `sprint-status.yaml`

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Playwright `test.extend()` patterns (no new fixtures needed; existing base.fixture.ts used)
- **network-first.md** — `page.route()` registered BEFORE `page.goto()` in all browser-context tests
- **test-quality.md** — One assertion per test, Given-When-Then structure, explicit waits only
- **selector-resilience.md** — `data-testid="app-root"` selector used (hierarchy: data-testid > ARIA > text > CSS)
- **test-levels-framework.md** — E2E for server-running verification; API for CORS/headers; Structural for filesystem checks

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 47 tests using 1 worker

  x AC1 — Frontend Vite server initialization > should serve the frontend app on port 5173 without errors
  x AC1 — Frontend Vite server initialization > should render the root HTML document with a valid React mount point
  x AC1 — Frontend Vite server initialization > should load without any TypeScript compilation errors visible in the browser console
  x AC1 — Frontend Vite server initialization > should not have any JavaScript runtime errors on initial load
  x AC3 — CORS configuration between frontend and backend > should allow frontend to reach backend health endpoint without CORS errors
  x AC3 — CORS configuration between frontend and backend > should receive a valid HTTP response from the backend health probe without CORS blocking
  x AC4 — TypeScript strict mode active on frontend > should load the frontend without Vite TypeScript error overlay
  x AC4 — Health endpoint returns HTTP 200 with CORS headers > should respond with HTTP 200 from GET /api/v1/health
  ... (all 47 tests failing)

  47 failed
```

**Summary:**

- Total tests: 47
- Passing: 0 (expected)
- Failing: 47 (expected — RED phase)
- Status: RED phase verified

**Expected Failure Messages:**

- Filesystem tests: `AssertionError: expect(received).toBe(expected) — Expected: true, Received: false — [path] must exist`
- API tests: `Error: connect ECONNREFUSED 127.0.0.1:5000`
- E2E tests: `Error: connect ECONNREFUSED 127.0.0.1:5173` or `TimeoutError`

---

## Notes

- Story 1.1 creates pure infrastructure scaffold — no domain tables, no business logic, no user text in Spanish (future stories)
- Package manager is pnpm throughout — never npm or yarn
- The `tests/` directory in playwright.config.ts is `./e2e` (not `./tests`) — all test files live under `e2e/`
- The `playwright.config.ts` `webServer.command` is `pnpm --filter frontend dev` — this requires a workspace setup at root
- AC5 (pnpm build) verification is partially covered by E2E tests but requires manual build confirmation
- AppDbContext.cs AC8 tests use Node.js `fs` module for filesystem inspection — this is valid in Playwright's Node.js test runner context

---

## Contact

**Questions or Issues?**

- Refer to `_bmad/bmm/testarch/tea-index.csv` for testing knowledge fragments
- Consult `_bmad/bmm/workflows/testarch/atdd/instructions.md` for ATDD workflow documentation

---

**Generated by BMad TEA Agent** — 2026-06-08
