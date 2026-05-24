# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

This story establishes the project skeleton for the Siesa Agents CRM application. It initializes
the frontend (Vite react-ts) and the .NET 10 Clean Architecture backend so that the development
team has both servers running, TypeScript strict mode enforced, CORS configured, and Scalar API
documentation accessible.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized
with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine with Node.js and .NET 10 installed, When the developer
   runs the frontend initialization commands, Then `pnpm run dev` starts the Vite server on port 5173
   with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in
   `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When the developer runs `dotnet run` in
   `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page
   loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure)
   are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to
   `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors
   (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it
   emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true`
   active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is
   executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED - Frontend project does not exist yet; server is not running
  - **Verifies:** AC1 — Vite dev server starts on port 5173 and returns HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED - `[data-testid="app-root"]` element does not exist; frontend not implemented
  - **Verifies:** AC1 — React root element is present and visible after frontend is scaffolded

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED - Frontend not running; no console output to validate
  - **Verifies:** AC1 + AC4 — No TypeScript errors appear in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED - Frontend not running; page never loads
  - **Verifies:** AC1 — App boots without JavaScript runtime exceptions

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED - Neither frontend nor backend is running; CORS policy not configured
  - **Verifies:** AC3 — Cross-origin fetch from `localhost:5173` to `localhost:5000` produces no
    CORS console errors

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED - Backend not running; connection refused
  - **Verifies:** AC3 — Backend responds to requests coming from `localhost:5173` origin

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED - Frontend not running; page never loads
  - **Verifies:** AC4 — Vite TypeScript error overlay (`vite-error-overlay`) is not present

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED - Backend not initialized; `dotnet run` has not been executed
  - **Verifies:** AC2 — Backend .NET 10 server is listening on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED - Backend not running; `/scalar` endpoint does not exist
  - **Verifies:** AC2 — `app.MapScalarApiReference()` is registered and Scalar returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED - Backend not running; no response to validate
  - **Verifies:** AC2 — Scalar endpoint returns `text/html` content-type (not JSON/plaintext)

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED - Backend not running; constraint cannot be validated
  - **Verifies:** AC2 architecture constraint — `/swagger` must return non-200 (Swashbuckle forbidden)

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED - Backend not running; default template cleanup not verified
  - **Verifies:** AC2 — Default `WeatherForecast` endpoint has been removed from the template

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED - Backend not running; CORS policy "DevCors" not configured
  - **Verifies:** AC3 — `Access-Control-Allow-Origin: http://localhost:5173` header is present

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED - Backend not running; OPTIONS preflight not handled
  - **Verifies:** AC3 — CORS preflight (OPTIONS) succeeds with 200 or 204

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED - Backend not running; solution build not verified
  - **Verifies:** AC5 — Server is running, which proves `dotnet build SiesaAgents.sln` succeeded

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED - Backend not running; `ExceptionHandlingMiddleware` not registered
  - **Verifies:** AC2 + AC5 — Error responses use `application/json` (not HTML), middleware is wired

### Component Tests

No component tests generated for this story. Story 1.1 covers infrastructure initialization only —
no React UI components are implemented. E2E and API tests are the appropriate levels here.

---

## Data Factories Created

This story does not require domain-level data factories. No entities are created or persisted.
The `data.helper.ts` file in `e2e/helpers/` provides factory functions for future stories' entity
data (Clientes, Contactos) but is not exercised by Story 1.1 tests.

---

## Fixtures Created

No custom fixtures are required for Story 1.1. Tests use the default Playwright `test` and
`request` fixtures directly.

The base fixture at `e2e/fixtures/base.fixture.ts` provides `clientesPage` and `contactosPage`
for later stories and does not affect Story 1.1 tests.

---

## Mock Requirements

Story 1.1 tests do NOT use mocks — they verify real running infrastructure:

- **Frontend**: Real Vite dev server must be running at `http://localhost:5173`
- **Backend**: Real .NET 10 server must be running at `http://localhost:5000`

Tests are designed to fail with "connection refused" or "page load timeout" when servers are not
running, providing a clear RED state before implementation.

> Note: The `API_BASE_URL` environment variable (default `http://localhost:5000`) allows overriding
> the backend URL in CI environments without changing test code.

---

## Required data-testid Attributes

### Frontend Root Component (`src/main.tsx` or `index.html`)

- `app-root` — React application root mount point
  - Used by: `should render the root HTML document with a valid React mount point`
  - Implementation: `<div id="root" data-testid="app-root"></div>` in `index.html`
    or applied to the outermost React element in `src/main.tsx`

**Implementation Example:**

```html
<!-- index.html -->
<div id="root" data-testid="app-root"></div>
```

---

## Implementation Checklist

### Test: Frontend server starts on port 5173 without errors

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install dependencies: `cd frontend && pnpm install`
- [ ] Verify `pnpm run dev` starts on port 5173 (check `vite.config.ts`)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "port 5173"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: React mount point with data-testid="app-root"

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to `<div id="root">` in `frontend/index.html`
  OR add it to the outermost JSX element rendered in `src/main.tsx`
- [ ] Required data-testid attributes: `app-root`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "mount point"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: No TypeScript compilation errors in browser console

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }
  ```
- [ ] Fix any TypeScript errors produced by strict mode in generated boilerplate
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: No JavaScript runtime errors on initial load

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/routes/__root.tsx` as TanStack Router root route (shell layout placeholder)
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Create `src/shared/lib/queryClient.ts` exporting singleton `QueryClient`
- [ ] Create `src/shared/lib/apiClient.ts` with Axios instance using `VITE_API_URL`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify app renders without exceptions: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "runtime errors"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: No CORS errors when frontend calls backend

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Register CORS policy in `Program.cs`:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()`
- [ ] Add `AllowedOrigins` to `appsettings.Development.json`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Backend running on port 5000

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Add project to solution: `dotnet sln add src/SiesaAgents.API`
- [ ] Configure `launchSettings.json` or `Program.cs` to listen on port 5000
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "port 5000"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Scalar API documentation at /scalar

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add to `Program.cs`:
  ```csharp
  builder.Services.AddOpenApi();
  // ...
  app.MapScalarApiReference();
  ```
- [ ] Do NOT add `app.UseSwagger()` or Swashbuckle references
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: WeatherForecast endpoint removed

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove `WeatherForecast` record from generated template in `SiesaAgents.API`
- [ ] Remove the `/weatherforecast` endpoint mapping from `Program.cs`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: CORS headers on backend responses

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify `Access-Control-Allow-Origin` header is returned on `/scalar` requests with `Origin: http://localhost:5173`
- [ ] Verify OPTIONS preflight returns 200 or 204 (not 403)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: All four Clean Architecture projects in solution

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Create unit tests: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add all to solution: `dotnet sln add src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure tests/SiesaAgents.UnitTests`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet packages: FluentValidation to Application, Npgsql.EF to Infrastructure
- [ ] Run `dotnet build SiesaAgents.sln` — must succeed with zero errors
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Clean Architecture"`
- [ ] Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: Problem Details RFC 7807 format for errors

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`:
  ```csharp
  public class ExceptionHandlingMiddleware(RequestDelegate next)
  {
      public async Task InvokeAsync(HttpContext context)
      {
          try { await next(context); }
          catch (Exception)
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
- [ ] Register in `Program.cs` BEFORE routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all Story 1.1 failing tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E tests (AC1, AC3, AC4)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API tests (AC2, AC5)
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with specific browser
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --project=chromium

# Run tests matching a grep pattern
npx playwright test --grep "AC2"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Network-first pattern applied (response listeners registered before `page.goto()`)
- `data-testid` requirements documented (`app-root`)
- Mock requirements documented (none — real servers required)
- Implementation checklist created with clear tasks

**Verification:**

- All 16 tests run and fail as expected (connection refused / element not found)
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with highest priority)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order:**

1. Initialize backend skeleton (AC2) — `backend-initialization.api.spec.ts`
2. Initialize frontend skeleton (AC1) — `project-initialization.spec.ts`
3. Configure CORS (AC3) — both spec files
4. Add `data-testid="app-root"` (AC1 visual test)
5. Configure TypeScript strict mode (AC4)
6. Add ExceptionHandlingMiddleware (AC5)

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review code for quality (readability, maintainability)
3. Extract duplications (DRY principle)
4. Ensure tests still pass after each refactor

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`
3. Begin implementation using implementation checklist as guide
4. Work one test at a time (red → green for each)
5. When all tests pass, refactor code for quality
6. When refactoring complete, update story status to 'done' in sprint-status

---

## Knowledge Base References Applied

- **network-first.md** — Route interception / response listeners registered BEFORE `page.goto()`
  (applied in `should serve the frontend app on port 5173` and `should load the frontend without
  Vite TypeScript error overlay`)
- **test-quality.md** — One assertion per test (atomic); Given-When-Then structure throughout;
  deterministic waiting via `page.waitForResponse()` and `page.waitForLoadState()`
- **selector-resilience.md** — `data-testid="app-root"` selector used instead of CSS class or
  element type selectors
- **test-levels-framework.md** — E2E for user-facing AC1/AC3/AC4; API level for AC2/AC5 (no
  browser needed to verify backend initialization)
- **fixture-architecture.md** — Default Playwright fixtures used (no custom fixtures required
  for infrastructure initialization story)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 16 tests using 1 worker

  1 [chromium] › foundation/project-initialization.spec.ts:23:3 › AC1 — Frontend Vite server initialization › should serve the frontend app on port 5173 without errors
    FAILED — net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  2 [chromium] › foundation/project-initialization.spec.ts:39:3 › AC1 — Frontend Vite server initialization › should render the root HTML document with a valid React mount point
    FAILED — net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  3 [chromium] › foundation/project-initialization.spec.ts:49:3 › AC1 — Frontend Vite server initialization › should load without any TypeScript compilation errors visible in the browser console
    FAILED — net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  4 [chromium] › foundation/project-initialization.spec.ts:66:3 › AC1 — Frontend Vite server initialization › should not have any JavaScript runtime errors on initial load
    FAILED — net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  5 [chromium] › foundation/project-initialization.spec.ts:86:3 › AC3 — CORS configuration between frontend and backend › should allow frontend to reach backend health endpoint without CORS errors
    FAILED — net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  6 [chromium] › foundation/project-initialization.spec.ts:122:3 › AC3 — CORS configuration between frontend and backend › should receive a valid HTTP response from the backend health probe without CORS blocking
    FAILED — Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  7 [chromium] › foundation/project-initialization.spec.ts:142:3 › AC4 — TypeScript strict mode active on frontend › should load the frontend without Vite TypeScript error overlay
    FAILED — net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  8 [chromium] › api/backend-initialization.api.spec.ts:24:3 › AC2 — Backend server initialization and Scalar API documentation › should have the backend API server running on port 5000
    FAILED — Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/

  9 [chromium] › api/backend-initialization.api.spec.ts:35:3 › AC2 — Backend server initialization and Scalar API documentation › should serve the Scalar API documentation page at /scalar
    FAILED — Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  10 [chromium] › api/backend-initialization.api.spec.ts:46:3 › AC2 — Backend server initialization and Scalar API documentation › should return HTML content from the Scalar documentation endpoint
    FAILED — Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  11 [chromium] › api/backend-initialization.api.spec.ts:56:3 › AC2 — Backend server initialization and Scalar API documentation › should NOT expose any Swagger/OpenAPI UI endpoint
    FAILED — Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/swagger

  12 [chromium] › api/backend-initialization.api.spec.ts:66:3 › AC2 — Backend server initialization and Scalar API documentation › should NOT expose WeatherForecast default endpoint
    FAILED — Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/weatherforecast

  13 [chromium] › api/backend-initialization.api.spec.ts:76:3 › AC2 — Backend server initialization and Scalar API documentation › should return CORS header allowing http://localhost:5173 origin
    FAILED — Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  14 [chromium] › api/backend-initialization.api.spec.ts:93:3 › AC2 — Backend server initialization and Scalar API documentation › should respond to OPTIONS preflight from frontend origin without CORS rejection
    FAILED — Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  15 [chromium] › api/backend-initialization.api.spec.ts:118:3 › AC5 — Backend solution builds and runs successfully › should have all four Clean Architecture layers responding
    FAILED — Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  16 [chromium] › api/backend-initialization.api.spec.ts:131:3 › AC5 — Backend solution builds and runs successfully › should return Problem Details RFC 7807 format for unhandled errors
    FAILED — Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/api/nonexistent-endpoint-for-atdd

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: RED phase verified

**Expected Failure Messages:**

- E2E tests (tests 1-7): `net::ERR_CONNECTION_REFUSED at http://localhost:5173/` (frontend not running)
- API tests (tests 8-16): `Request failed: net::ERR_CONNECTION_REFUSED at http://localhost:5000/...` (backend not running)

---

## Notes

- Story 1.1 is purely infrastructure initialization — no domain entities, no database, no business
  logic. Tests reflect this by validating server startup, CORS headers, and build success.
- AC5 (`dotnet build` zero errors) is tested indirectly via the running server: if the build failed,
  the server would not start, causing API tests to fail with connection refused.
- The `data-testid="app-root"` attribute is the only UI element required by these tests. All other
  visual structure belongs to Story 1.2 (navigation shell).
- Tests use `process.env.API_BASE_URL ?? 'http://localhost:5000'` to support CI environments with
  different backend addresses.
- The `pnpm` package manager is mandatory per company standards — test commands use `pnpm --filter
  frontend dev` in `playwright.config.ts` for the web server.

---

**Generated by BMad TEA Agent** - 2026-05-24
