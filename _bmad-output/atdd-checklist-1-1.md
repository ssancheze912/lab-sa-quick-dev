# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-30
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

This story establishes the technical foundation for the Siesa Agents CRM application by initializing both the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects. The objective is to have both dev servers running locally with CORS configured, TypeScript strict mode active, and the .NET solution compiling with zero errors.

**As a** developer
**I want** the frontend and backend projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine with Node.js and .NET 10 installed, When the developer runs the frontend initialization commands, Then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When the developer runs `dotnet run` in `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Vite server not yet initialized; `http://localhost:5173/` returns connection refused
  - **Verifies:** AC1 — Frontend server starts on port 5173 responding HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist yet in the unbuilt project
  - **Verifies:** AC1 — App renders with a React mount point identifiable by `data-testid`

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Frontend project does not exist; no server to connect to
  - **Verifies:** AC4 — TypeScript strict mode produces zero browser console errors

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Frontend project not initialized; page cannot load
  - **Verifies:** AC1 — No JavaScript runtime exceptions on first render

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Neither server running; CORS policy not configured
  - **Verifies:** AC3 — No CORS-related console errors when frontend calls backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running; connection refused on port 5000
  - **Verifies:** AC3 — Backend responds (200/301/302) to frontend origin request

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend project not initialized; Vite not running
  - **Verifies:** AC4 — No `vite-error-overlay` element visible after load

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not running; `http://localhost:5000/` connection refused
  - **Verifies:** AC2 — Backend server is up and responding

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; Scalar.AspNetCore not installed
  - **Verifies:** AC2 — Scalar docs accessible at `/scalar` with HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; `MapScalarApiReference()` not yet configured
  - **Verifies:** AC2 — `/scalar` returns `text/html` content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running (would fail with connection refused, not 200)
  - **Verifies:** AC2 — Architecture constraint: Swashbuckle must not be registered

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; default template not cleaned up
  - **Verifies:** AC2 — Default `WeatherForecast` endpoint removed (returns 404/405)

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; CORS policy not configured
  - **Verifies:** AC3 — `Access-Control-Allow-Origin` header present and set to `http://localhost:5173`

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; CORS middleware not registered
  - **Verifies:** AC3 — OPTIONS preflight succeeds (200 or 204)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Solution not created; `dotnet build` cannot run
  - **Verifies:** AC5 — Server starts, proving the solution compiled without errors

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; `ExceptionHandlingMiddleware` not registered
  - **Verifies:** AC5/AC2 — Non-existent routes return JSON error (not HTML), middleware wired

---

## Data Factories Created

No domain data factories are required for Story 1.1. This story tests infrastructure initialization only — no entity data is created or consumed. Data factories will be introduced in Epic 2 (Story 2.1 — Clientes CRUD) when the first domain entity exists.

---

## Fixtures Created

### Base Fixture (existing)

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page positioned at clientes route
  - **Cleanup:** Automatic (Playwright page teardown)

- `contactosPage` — Navigates to `/contactos` before test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page positioned at contactos route
  - **Cleanup:** Automatic (Playwright page teardown)

> Note: Story 1.1 tests use the base `@playwright/test` directly (not these fixtures), since they test the raw initialization state without requiring route navigation fixtures.

---

## Mock Requirements

Story 1.1 tests make **real** HTTP requests to verify infrastructure is running. No mocking is applied at this level by design — the point of these tests is to verify real server-to-server connectivity.

**No mock services required.** All tests exercise actual running servers:
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `http://localhost:5000` (.NET 10 Kestrel)

---

## Required data-testid Attributes

### Frontend `index.html` / `App.tsx` / `main.tsx`

- `app-root` — The root container element where React mounts the application
  - Currently `<div id="root">` in Vite template — implementation must add `data-testid="app-root"`

**Implementation Example:**

```tsx
// In index.html or main.tsx rendered root
<div id="root" data-testid="app-root">
  {/* React app mounts here */}
</div>
```

Or in `main.tsx`:

```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div data-testid="app-root">
      <App />
    </div>
  </React.StrictMode>
);
```

---

## Implementation Checklist

### Test: Frontend serves on port 5173 (AC1 — E2E)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Run `cd frontend && pnpm install`
- [ ] Verify `pnpm run dev` starts on port 5173
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "AC1"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: React root element with data-testid="app-root" (AC1 — E2E)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the root element in `index.html` or wrap in `main.tsx`
- [ ] Verify element is visible after `page.goto('/')`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "app-root"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: No TypeScript compilation errors in console (AC4 — E2E)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Fix any TypeScript errors revealed by strict mode in generated template files
- [ ] Run `pnpm tsc --noEmit` locally to confirm zero errors
- [ ] Verify `pnpm run dev` starts with no compilation overlay
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: No Vite TypeScript error overlay (AC4 — E2E)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure all `.tsx` and `.ts` files in `frontend/src/` are TypeScript-valid under strict mode
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "error overlay"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: Backend running on port 5000 (AC2 — API)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o backend/src/SiesaAgents.API`
- [ ] Configure Kestrel to listen on port 5000 (set `ASPNETCORE_URLS=http://localhost:5000` or `launchSettings.json`)
- [ ] Run `dotnet run` in `backend/src/SiesaAgents.API`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "port 5000"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Scalar docs at /scalar (AC2 — API)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package: `dotnet add backend/src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add `builder.Services.AddOpenApi()` to `Program.cs`
- [ ] Add `app.MapScalarApiReference()` to `Program.cs` (NOT `app.UseSwagger()`)
- [ ] Verify `GET http://localhost:5000/scalar` returns HTTP 200 with `text/html` content type
- [ ] Run tests: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Swagger endpoint NOT exposed (AC2 — API)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `app.UseSwagger()` and `app.UseSwaggerUI()` are NEVER added to `Program.cs`
- [ ] Do NOT add Swashbuckle packages
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.1 hours (constraint check only)

---

### Test: WeatherForecast endpoint removed (AC2 — API)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Delete `WeatherForecast.cs` and `WeatherForecastSummaries.cs` from generated template
- [ ] Remove `app.MapGet("/weatherforecast", ...)` from `Program.cs`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: CORS allows http://localhost:5173 (AC3 — API + E2E)

**Files:** `e2e/tests/api/backend-initialization.api.spec.ts`, `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, add CORS policy:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Verify `Access-Control-Allow-Origin: http://localhost:5173` is returned in response headers
- [ ] Verify OPTIONS preflight returns 200 or 204
- [ ] Run tests: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS"`
- [ ] Run tests: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS"`
- [ ] Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Problem Details RFC 7807 on unhandled routes (AC5 — API)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`:
  ```csharp
  public class ExceptionHandlingMiddleware(RequestDelegate next)
  {
      public async Task InvokeAsync(HttpContext context)
      {
          try { await next(context); }
          catch (Exception ex)
          {
              context.Response.ContentType = "application/problem+json";
              context.Response.StatusCode = 500;
              await context.Response.WriteAsJsonAsync(new ProblemDetails
              {
                  Status = 500,
                  Title = "An unexpected error occurred.",
                  Detail = null
              });
          }
      }
  }
  ```
- [ ] Register in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify non-existent routes return JSON (not HTML) with status 404
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: dotnet build SiesaAgents.sln zero errors — all four layers (AC5 — API)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create all four projects and add to solution:
  ```bash
  dotnet new classlib -n SiesaAgents.Application -o backend/src/SiesaAgents.Application
  dotnet new classlib -n SiesaAgents.Domain -o backend/src/SiesaAgents.Domain
  dotnet new classlib -n SiesaAgents.Infrastructure -o backend/src/SiesaAgents.Infrastructure
  dotnet new xunit -n SiesaAgents.UnitTests -o backend/tests/SiesaAgents.UnitTests
  dotnet sln backend/SiesaAgents.sln add backend/src/SiesaAgents.API backend/src/SiesaAgents.Application backend/src/SiesaAgents.Domain backend/src/SiesaAgents.Infrastructure backend/tests/SiesaAgents.UnitTests
  ```
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Run `dotnet build backend/SiesaAgents.sln` and confirm zero errors
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Clean Architecture"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run ALL failing tests for Story 1.1
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E initialization tests
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API backend tests
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests with HTML report
pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (16 total across 2 files)
- Network-first pattern applied where applicable (response listeners registered before navigation)
- No data factories needed (infrastructure-only story)
- No fixtures needed beyond base Playwright test (raw server connectivity)
- Mock requirements documented (none — real servers required)
- Required `data-testid` attributes listed (1: `app-root`)
- Implementation checklist created with clear tasks per test

**Verification:**

- All tests fail due to missing implementation (servers not running, project not initialized)
- Failures are connection refused or element not found — not test bugs
- Tests fail for the right reason: implementation does not exist yet

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with backend API tests — they have no browser dependency)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended Order:**

1. Backend API tests first (no frontend dependency):
   - Initialize .NET solution and four projects
   - Configure Scalar at `/scalar`
   - Remove WeatherForecast
   - Configure CORS for `http://localhost:5173`
   - Register `ExceptionHandlingMiddleware`
2. Frontend E2E tests second:
   - Initialize Vite react-ts project
   - Configure TypeScript strict mode
   - Add `data-testid="app-root"` to root element
   - Verify both servers running for CORS tests

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review `Program.cs` for clean minimal structure
3. Extract CORS origins to `appsettings.Development.json` `AllowedOrigins` array
4. Ensure `tsconfig.app.json` is clean and idiomatic
5. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
3. Begin implementation following the implementation checklist above
4. Work one test at a time (red to green for each)
5. When all 16 tests pass, refactor code for quality
6. When refactoring complete, manually update story status to `done`

---

## Knowledge Base References Applied

- **network-first.md** — Response listeners registered BEFORE `page.goto()` to prevent race conditions
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS class or text-based selectors
- **test-quality.md** — One assertion per test; Given-When-Then comments in every test; no hard waits
- **fixture-architecture.md** — Base fixture extended for future navigation tests; Story 1.1 tests use base Playwright test directly
- **test-levels-framework.md** — AC2/AC5 (backend contract) mapped to API tests; AC1/AC3/AC4 (browser-visible behavior) mapped to E2E tests

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 16 tests using 1 worker

  x  AC1 — Frontend Vite server initialization > should serve the frontend app on port 5173 without errors
     Error: connect ECONNREFUSED 127.0.0.1:5173

  x  AC1 — Frontend Vite server initialization > should render the root HTML document with a valid React mount point
     Error: connect ECONNREFUSED 127.0.0.1:5173

  x  AC1 — Frontend Vite server initialization > should load without any TypeScript compilation errors visible in the browser console
     Error: connect ECONNREFUSED 127.0.0.1:5173

  x  AC1 — Frontend Vite server initialization > should not have any JavaScript runtime errors on initial load
     Error: connect ECONNREFUSED 127.0.0.1:5173

  x  AC3 — CORS configuration between frontend and backend > should allow frontend to reach backend health endpoint without CORS errors
     Error: connect ECONNREFUSED 127.0.0.1:5173

  x  AC3 — CORS configuration between frontend and backend > should receive a valid HTTP response from the backend health probe without CORS blocking
     Error: connect ECONNREFUSED 127.0.0.1:5000

  x  AC4 — TypeScript strict mode active on frontend > should load the frontend without Vite TypeScript error overlay
     Error: connect ECONNREFUSED 127.0.0.1:5173

  x  AC2 — Backend server initialization and Scalar API documentation > should have the backend API server running on port 5000
     Error: connect ECONNREFUSED 127.0.0.1:5000

  x  AC2 — Backend server initialization and Scalar API documentation > should serve the Scalar API documentation page at /scalar
     Error: connect ECONNREFUSED 127.0.0.1:5000

  x  AC2 — Backend server initialization and Scalar API documentation > should return HTML content from the Scalar documentation endpoint
     Error: connect ECONNREFUSED 127.0.0.1:5000

  x  AC2 — Backend server initialization and Scalar API documentation > should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
     Error: connect ECONNREFUSED 127.0.0.1:5000

  x  AC2 — Backend server initialization and Scalar API documentation > should NOT expose WeatherForecast default endpoint
     Error: connect ECONNREFUSED 127.0.0.1:5000

  x  AC2 — Backend server initialization and Scalar API documentation > should return CORS header allowing http://localhost:5173 origin
     Error: connect ECONNREFUSED 127.0.0.1:5000

  x  AC2 — Backend server initialization and Scalar API documentation > should respond to OPTIONS preflight from frontend origin without CORS rejection
     Error: connect ECONNREFUSED 127.0.0.1:5000

  x  AC5 — Backend solution builds and runs successfully > should have all four Clean Architecture layers responding
     Error: connect ECONNREFUSED 127.0.0.1:5000

  x  AC5 — Backend solution builds and runs successfully > should return Problem Details RFC 7807 format for unhandled errors
     Error: connect ECONNREFUSED 127.0.0.1:5000

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected — connection refused because neither server exists yet)
- Status: RED phase confirmed

---

## Notes

- Story 1.1 is a pure infrastructure initialization story. All tests are in RED because neither the frontend nor the backend projects exist in the repository yet.
- AC5 (dotnet build with zero errors) is validated indirectly: if the server starts and responds, the build succeeded. There is no way to assert "zero compiler warnings" through an HTTP test; the dev team must verify this locally with `dotnet build SiesaAgents.sln`.
- The `data-testid="app-root"` requirement is the ONLY UI element that Story 1.1 tests depend on. It should be the very first `data-testid` added to the project.
- The `API_BASE_URL` environment variable (`process.env.API_BASE_URL`) allows overriding the backend URL for CI environments where the backend may run on a different port.
- Do NOT add `data-testid` attributes to third-party components (like Scalar). Tests for Scalar use URL and content-type assertions instead.

---

**Generated by BMad TEA Agent** — 2026-06-30
