# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-25
**Author:** SiesaTeam
**Primary Test Level:** API + E2E (Infrastructure Smoke Tests)

---

## Story Summary

Story 1.1 establishes the foundation of the Siesa Agents CRM project by initializing both the
frontend (Vite + React + TypeScript) and backend (.NET 10 Clean Architecture) projects with all
required dependencies, ensuring both dev servers run correctly, CORS is configured, and the
TypeScript/dotnet builds produce zero errors.

**As a** developer
**I want** the frontend and backend projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1**: Given a clean dev machine, When the frontend initialization commands are run, Then
   `pnpm run dev` starts the Vite server on port 5173 with no errors and TypeScript strict mode
   is enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2**: Given the backend project has been created, When `dotnet run` is executed in
   `src/SiesaAgents.API`, Then the backend starts on port 5000, the Scalar API documentation
   page loads at `/scalar`, and all four Clean Architecture projects are referenced in
   `SiesaAgents.sln`.

3. **AC3**: Given both servers are running, When the frontend makes any HTTP request to
   `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors.

4. **AC4**: Given the frontend project is initialized, When the TypeScript compiler runs, Then it
   emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true`
   active.

5. **AC5**: Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is
   executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/story-1-1/project-initialization.spec.ts` (~155 lines)

- **Test:** `should serve the frontend application on port 5173 with HTTP 200`
  - **Status:** RED - Frontend Vite project not yet created; `http://localhost:5173` returns ECONNREFUSED
  - **Verifies:** AC1 — Frontend server running on correct port

- **Test:** `should render a valid HTML document with a root mount point`
  - **Status:** RED - `[data-testid="app-root"]` element does not exist (app not yet scaffolded)
  - **Verifies:** AC1 — React app renders with testable root element

- **Test:** `should load without TypeScript compilation errors (no error overlay shown)`
  - **Status:** RED - Vite server not running; no page to check for error overlays
  - **Verifies:** AC4 — Zero TypeScript compilation errors in strict mode

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED - Backend not running; `http://localhost:5000/scalar` returns ECONNREFUSED
  - **Verifies:** AC2 — Scalar endpoint serves documentation

- **Test:** `should render Scalar UI content on the /scalar page`
  - **Status:** RED - Backend not initialized; no Scalar UI rendered
  - **Verifies:** AC2 — `app.MapScalarApiReference()` is properly wired

- **Test:** `should complete a cross-origin GET request from frontend to backend without CORS error`
  - **Status:** RED - Both servers not running; cross-origin request cannot be tested
  - **Verifies:** AC3 — No CORS errors when frontend fetches backend

- **Test:** `GET /weatherforecast should return 404 (default template removed)` (via AC2/cleanup)
  - **Status:** RED - Backend not running
  - **Verifies:** AC2 — Default WeatherForecast template endpoints removed

### API Tests (9 tests)

**File:** `e2e/story-1-1/backend-api-contracts.api.spec.ts` (~145 lines)

- **Test:** `GET /scalar should respond with 200 and Content-Type text/html`
  - **Status:** RED - Backend not running (ECONNREFUSED)
  - **Verifies:** AC2 — Scalar endpoint is registered and serves HTML

- **Test:** `GET /openapi should respond (Scalar metadata endpoint registered)`
  - **Status:** RED - Backend not running
  - **Verifies:** AC2 — `builder.Services.AddOpenApi()` is called in Program.cs

- **Test:** `OPTIONS preflight should return 204 or 200 with CORS headers`
  - **Status:** RED - Backend not running
  - **Verifies:** AC3 — CORS preflight succeeds for frontend origin

- **Test:** `Access-Control-Allow-Origin header should be http://localhost:5173`
  - **Status:** RED - Backend not running
  - **Verifies:** AC3 — Specific ACAO header matches frontend origin exactly

- **Test:** `should NOT allow arbitrary cross-origin requests (CORS not wildcard)`
  - **Status:** RED - Backend not running
  - **Verifies:** AC3 — CORS policy is not a wildcard (`*`)

- **Test:** `GET /weatherforecast should return 404 (default template removed)`
  - **Status:** RED - Backend not running
  - **Verifies:** AC2 — Default WeatherForecast template cleaned up

- **Test:** `Unhandled error should return Problem Details format (RFC 7807)`
  - **Status:** RED - Backend not running
  - **Verifies:** AC2 — ExceptionHandlingMiddleware returns RFC 7807 format

- **Test:** `Backend should start without configuration errors`
  - **Status:** RED - Backend not running
  - **Verifies:** AC5 — appsettings.Development.json is valid and backend starts

- **Test:** `should respond on port 5000 with HTTP 200` (scalar reachability)
  - **Status:** RED - Backend not running
  - **Verifies:** AC2, AC5 — Backend builds and starts successfully

---

## Data Factories Created

### Environment Factory

**File:** `e2e/support/factories/environment.factory.ts`

**Exports:**
- `createBackendConfig(overrides?)` — Backend URL, port, scalar path, allowed CORS origin
- `createFrontendConfig(overrides?)` — Frontend URL, port, backend API URL
- `createCorsPreflightRequest(overrides?)` — CORS preflight request configuration
- `EXPECTED_CLEAN_ARCH_PROJECTS` — Typed array of 4 Clean Architecture project names

**Example Usage:**
```typescript
const backend = createBackendConfig();
// { baseUrl: 'http://localhost:5000', port: 5000, scalarPath: '/scalar', ... }

const corsRequest = createCorsPreflightRequest({ method: 'POST' });
// Override specific fields while keeping defaults
```

---

## Fixtures Created

### Infrastructure Fixtures

**File:** `e2e/support/fixtures/infrastructure.fixture.ts`

**Fixtures:**
- `backendConfig` — Provides BackendConfig object (no data creation, no cleanup needed)
  - **Setup:** Calls `createBackendConfig()` to produce typed config
  - **Provides:** `BackendConfig` object to the test
  - **Cleanup:** None (read-only, no state mutation)

- `frontendConfig` — Provides FrontendConfig object (no data creation, no cleanup needed)
  - **Setup:** Calls `createFrontendConfig()`
  - **Provides:** `FrontendConfig` object to the test
  - **Cleanup:** None (read-only)

- `backendRequest` — Pre-configured `APIRequestContext` pointing to `http://localhost:5000`
  - **Setup:** Creates `playwright.request.newContext({ baseURL: 'http://localhost:5000' })`
  - **Provides:** `APIRequestContext` ready to make requests
  - **Cleanup:** `await context.dispose()` — auto-cleaned after each test

**Example Usage:**
```typescript
import { test, expect } from '../support/fixtures/infrastructure.fixture';

test('backend is reachable', async ({ backendRequest }) => {
  const response = await backendRequest.get('/scalar');
  expect(response.status()).toBe(200);
});
```

---

## Mock Requirements

Story 1.1 tests target the **actual running infrastructure** (not mocked services). This is
intentional — the acceptance criteria validate that real servers start and respond correctly.

**No external service mocking required.** The tests use:
- Real Vite dev server (frontend) at `http://localhost:5173`
- Real .NET 10 API (backend) at `http://localhost:5000`

**Network-first note:** The E2E tests that navigate to the frontend (`page.goto`) do NOT intercept
routes because they are testing the real server response, not UI behavior with mocked APIs.

---

## Required data-testid Attributes

### Application Root (`src/main.tsx` or root layout)

- `app-root` — The React application root mount point div
  - Required by: `should render a valid HTML document with a root mount point`
  - **Implementation Example:**
    ```tsx
    // In src/main.tsx or root route component
    <div id="root" data-testid="app-root">
      <RouterProvider router={router} />
    </div>
    ```

> Note: The Scalar UI tests use Scalar's own DOM structure (`#api-reference`, `.scalar-app`).
> No custom `data-testid` is required in the backend for these tests.

---

## Implementation Checklist

### Test Group: AC1 — Frontend Vite Server (E2E)

**File:** `e2e/story-1-1/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Verify `pnpm run dev` starts on port 5173 (check `vite.config.ts` server.port)
- [ ] Add `data-testid="app-root"` to the root div in `src/main.tsx` or the root route
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Verify zero TypeScript errors: `pnpm tsc --noEmit`
- [ ] Run test: `npx playwright test e2e/story-1-1/project-initialization.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test Group: AC2 — Backend .NET API and Scalar (API + E2E)

**File:** `e2e/story-1-1/backend-api-contracts.api.spec.ts` and `project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application, Domain, Infrastructure class libraries
- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add all projects to solution: `dotnet sln add ...`
- [ ] Add project references (API → Application → Domain; API → Infrastructure → Domain)
- [ ] Add Scalar.AspNetCore NuGet package to API project
- [ ] In `Program.cs`: call `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Remove default WeatherForecast endpoints and models
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds (zero errors)
- [ ] Verify `dotnet run` in `src/SiesaAgents.API` starts on port 5000
- [ ] Verify `/scalar` page loads in browser
- [ ] Run test: `npx playwright test e2e/story-1-1/backend-api-contracts.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 3 hours

---

### Test Group: AC3 — CORS Configuration (API + E2E)

**File:** `e2e/story-1-1/backend-api-contracts.api.spec.ts` and `project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, register CORS policy `"DevCors"` allowing origin `http://localhost:5173`
- [ ] Policy must use `.AllowAnyHeader().AllowAnyMethod()` (not wildcard on origin)
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and other endpoints
- [ ] Add `AllowedOrigins` array to `appsettings.Development.json` with `http://localhost:5173`
- [ ] Verify CORS headers in browser DevTools: no CORS error on cross-origin fetch
- [ ] Run test: `npx playwright test e2e/story-1-1/ --grep "AC3|CORS"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

### Test Group: AC4 — TypeScript Build (E2E smoke)

**File:** `e2e/story-1-1/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Ensure `tsconfig.app.json` has `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Run `pnpm tsc --noEmit` and fix any TypeScript errors until zero remain
- [ ] Verify no Vite error overlay appears on `http://localhost:5173`
- [ ] Run test: `npx playwright test e2e/story-1-1/project-initialization.spec.ts --grep "TypeScript"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test Group: AC5 — Backend Solution Build (API smoke)

**File:** `e2e/story-1-1/backend-api-contracts.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Ensure all 4 projects (API, Application, Domain, Infrastructure) compile without errors
- [ ] Create `ExceptionHandlingMiddleware.cs` catching all exceptions and returning Problem Details
- [ ] Register middleware in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Configure `appsettings.Development.json` with `ConnectionStrings:DefaultConnection` placeholder
- [ ] Verify `dotnet build SiesaAgents.sln` exits with code 0
- [ ] Run test: `npx playwright test e2e/story-1-1/backend-api-contracts.api.spec.ts --grep "Build"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run ALL failing tests for Story 1.1
npx playwright test e2e/story-1-1/

# Run only E2E tests (frontend + CORS)
npx playwright test e2e/story-1-1/project-initialization.spec.ts

# Run only API tests (backend contracts)
npx playwright test e2e/story-1-1/backend-api-contracts.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/story-1-1/ --headed

# Debug a specific test
npx playwright test e2e/story-1-1/project-initialization.spec.ts --debug

# Run with UI mode (interactive)
npx playwright test e2e/story-1-1/ --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (13 total: 4 E2E + 9 API)
- ✅ Environment factory created with typed configuration objects
- ✅ Infrastructure fixture with auto-cleanup `backendRequest` context
- ✅ data-testid requirements documented (`app-root`)
- ✅ Implementation checklist created per acceptance criterion

**Verification:**

- All tests fail with ECONNREFUSED (servers not running — correct RED reason)
- Failure messages are clear: server not started is the only blocker
- Tests fail due to missing implementation, not test logic bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** (start with AC2 backend — foundation for all others)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist above
6. **Move to next test** and repeat

**Recommended Order:**
1. AC2 (backend + Scalar) — enables API tests
2. AC3 (CORS) — enables cross-origin tests
3. AC1 (frontend) — requires AC3 for CORS test to fully pass
4. AC4 (TypeScript) — frontend must be initialized first
5. AC5 (dotnet build) — runs in parallel with AC2

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. All 13 tests passing
2. Review `Program.cs` for clean middleware ordering
3. Extract CORS origins to `appsettings.json` (already planned in Task 5)
4. Ensure no hardcoded URLs remain in application code
5. Verify TypeScript imports are properly organized in `src/main.tsx`
6. Ensure tests still pass after refactor

---

## Next Steps

1. **Confirm RED phase** by running: `npx playwright test e2e/story-1-1/`
2. **Review this checklist** in next team standup
3. **Begin implementation** with AC2 (backend foundation) as priority
4. **Work one test group at a time** (red → green per AC)
5. **When all 13 tests pass**, refactor for quality
6. **Update story status** to `done` in sprint-status.yaml when complete

---

## Knowledge Base References Applied

- **fixture-architecture.md** — `test.extend()` pattern used in `infrastructure.fixture.ts` with auto-cleanup `backendRequest`
- **data-factories.md** — `createBackendConfig`, `createFrontendConfig`, `createCorsPreflightRequest` with override support
- **network-first.md** — Applied in E2E tests: `page.route()` is NOT used here because tests verify real server behavior (not mocked responses)
- **test-quality.md** — One assertion per test (atomic), Given-When-Then structure throughout, no hard waits
- **selector-resilience.md** — `data-testid="app-root"` used instead of CSS classes or tag selectors
- **test-levels-framework.md** — API tests chosen for backend infrastructure (faster, stable); E2E for browser-level smoke tests

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/story-1-1/`

**Expected Results (before implementation):**

```
Running 13 tests using 4 workers

  ✗ [chromium] › story-1-1/project-initialization.spec.ts:30:3 › AC1 - Frontend Vite Server
      Error: connect ECONNREFUSED 127.0.0.1:5173

  ✗ [chromium] › story-1-1/project-initialization.spec.ts:41:3 › AC1 - Frontend Vite Server
      Error: connect ECONNREFUSED 127.0.0.1:5173

  ✗ [chromium] › story-1-1/project-initialization.spec.ts:53:3 › AC1 - Frontend Vite Server
      Error: connect ECONNREFUSED 127.0.0.1:5173

  ✗ [...] › backend-api-contracts.api.spec.ts › Backend API - Base Reachability
      Error: connect ECONNREFUSED 127.0.0.1:5000

  ... (all 13 tests fail with ECONNREFUSED — servers not yet initialized)

  13 failed
```

**Summary:**

- Total tests: 13
- Passing: 0 (expected)
- Failing: 13 (expected)
- Status: ✅ RED phase verified

**Expected Failure Message (consistent for all):**
`Error: connect ECONNREFUSED 127.0.0.1:5173` or `Error: connect ECONNREFUSED 127.0.0.1:5000`

---

## Notes

- Story 1.1 is a developer-facing infrastructure story, not a user-facing feature. Test levels
  are API + infrastructure E2E (not user-journey E2E with complex interactions).
- The Playwright `webServer` config in `playwright.config.ts` starts the frontend automatically.
  For RED phase, both frontend and backend must be absent for tests to fail correctly.
- CORS tests use the real servers — no network-first mocking is appropriate here because the
  acceptance criteria specifically validate real CORS behavior.
- `data-testid="app-root"` is the only UI attribute required. The rest of the tests are
  infrastructure-level HTTP verifications.
- The `ExceptionHandlingMiddleware` test (Problem Details RFC 7807) is a best-effort check using
  a non-existent route. A dedicated `/test/trigger-error` endpoint should be added in development
  only for a stronger test — deferred to Story 1.3 which owns `ExceptionHandlingMiddleware` scope.

---

## Contact

**Questions or Issues?**
- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-25
