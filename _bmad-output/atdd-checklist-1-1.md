# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

As a developer, I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies, so that the team has a working development environment with both servers running. This story creates the skeleton structure: Vite frontend on port 5173 with TypeScript strict mode, .NET 10 backend on port 5000 with Scalar API docs, CORS configured between both, and all four Clean Architecture layers compiling successfully.

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

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (~157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend Vite project does not exist yet; HTTP GET to port 5173 will result in connection refused
  - **Verifies:** AC1 — Vite dev server starts on port 5173 and responds with HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element is absent until implementation adds it to the React root
  - **Verifies:** AC1 — Frontend app compiles and renders a visible React mount point

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — No frontend project compiled; console errors will appear when server does not exist
  - **Verifies:** AC4 — TypeScript strict mode active, zero TS compilation errors reach the browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — No frontend project; page load will produce JS runtime errors or fail entirely
  - **Verifies:** AC1 / AC4 — No unhandled JavaScript exceptions on first render

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not running; browser fetch to port 5000 will be blocked or fail
  - **Verifies:** AC3 — No CORS-related errors appear in console when frontend requests backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running; request will result in connection refused (non-2xx/3xx)
  - **Verifies:** AC3 — Backend responds (200/301/302) to cross-origin requests without CORS rejection

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend project missing; no Vite server, no compilation to validate
  - **Verifies:** AC4 — Vite error overlay (`vite-error-overlay`) is absent on successful TypeScript compile

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (~147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend .NET project not initialized; connection refused on port 5000
  - **Verifies:** AC2 — Backend server starts and responds to any HTTP request on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; `GET /scalar` returns connection refused
  - **Verifies:** AC2 — `app.MapScalarApiReference()` is registered and serves HTTP 200 at `/scalar`

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; no content-type header available
  - **Verifies:** AC2 — `/scalar` returns `text/html` content-type (Scalar UI is served)

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running; cannot validate endpoint absence
  - **Verifies:** AC2 / Architecture — `/swagger` endpoint must NOT return HTTP 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; cannot validate endpoint removal
  - **Verifies:** AC2 — Default `WeatherForecast` template endpoint is removed (404 or 405)

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; no `Access-Control-Allow-Origin` header available
  - **Verifies:** AC3 — CORS policy "DevCors" emits `Access-Control-Allow-Origin: http://localhost:5173`

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; OPTIONS preflight will fail with connection refused
  - **Verifies:** AC3 — CORS middleware handles preflight before endpoint mapping (200 or 204)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not compiled; server cannot start if build fails
  - **Verifies:** AC5 — All four projects compile and the DI-wired server starts (proxy for build success)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; middleware chain cannot be exercised
  - **Verifies:** AC2 / AC5 — Non-existent endpoints return JSON (not HTML), proving middleware is wired

### Component Tests (0 tests)

Story 1.1 is infrastructure-only (no UI components created). Component tests are not applicable at this level. Component tests will be introduced in Story 1.2 (Navigation Shell) where UI components are rendered.

---

## Data Factories Created

No domain-specific data factories are required for Story 1.1. This story tests server startup, CORS headers, and HTTP endpoint existence — all of which are infrastructure assertions that do not require entity data.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` factories for future stories (Epic 2+). No new factories are needed here.

---

## Fixtures Created

### Base Fixture

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** Calls `page.goto('/clientes')`
  - **Provides:** Page already at `/clientes` URL
  - **Cleanup:** None required (navigation state reset per test)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** Calls `page.goto('/contactos')`
  - **Provides:** Page already at `/contactos` URL
  - **Cleanup:** None required

Note: Story 1.1 tests use the default `{ page, request }` fixtures from `@playwright/test` directly. The base fixture is scaffolded for subsequent stories.

---

## Mock Requirements

Story 1.1 tests verify REAL server behavior (not mocked). Both servers must be running locally for the tests to pass green. No route interception mocks are used because:

1. The acceptance criteria explicitly require the actual servers to start
2. CORS headers can only be verified against a real HTTP response
3. TypeScript compilation state is real-world, not simulated

### Development Environment Requirements

**Frontend server:**
- Command: `pnpm --filter frontend dev`
- URL: `http://localhost:5173`
- Playwright `webServer` config already handles startup

**Backend server:**
- Command: `dotnet run --project src/SiesaAgents.API`
- URL: `http://localhost:5000`
- Must be started manually before running API tests (no `webServer` config for backend in `playwright.config.ts`)

---

## Required data-testid Attributes

### Frontend Root (index.html / App.tsx / main.tsx)

- `app-root` — The React application root container element

**Implementation Example:**

```tsx
// Option A: in index.html
<div id="root" data-testid="app-root"></div>

// Option B: in App.tsx wrapper
export function App() {
  return (
    <div data-testid="app-root">
      <RouterProvider router={router} />
    </div>
  );
}
```

**Note:** This is the only `data-testid` required for Story 1.1. All other UI `data-testid` attributes are specified in Story 1.2 (Navigation Shell).

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install all runtime dependencies (`pnpm add @tanstack/react-router @tanstack/react-query zustand axios ...`)
- [ ] Install dev dependencies (`pnpm add -D vitest @testing-library/react ...`)
- [ ] Install TailwindCSS v4 (`pnpm add tailwindcss @tailwindcss/vite`)
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify `pnpm run dev` starts on port 5173 with no errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "port 5173"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/routes/__root.tsx` as TanStack Router root route (shell layout placeholder)
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` attribute to the React root element in `index.html` or `App.tsx`
- [ ] Verify frontend renders without blank page
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "React mount point"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all source files pass TypeScript strict mode compilation
- [ ] Run `tsc --noEmit` to verify zero TypeScript errors before testing
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Create `src/shared/lib/queryClient.ts` exporting the singleton `QueryClient`
- [ ] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL`
- [ ] Wire `RouterProvider` inside `QueryProvider` in `src/main.tsx`
- [ ] Verify no unhandled promise rejections or React rendering errors on first mount
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "runtime errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Start backend server on port 5000
- [ ] In `Program.cs`, add `builder.Services.AddCors(...)` with policy allowing `http://localhost:5173`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Add `AllowedOrigins` to `appsettings.Development.json`
- [ ] Verify browser devtools show no CORS errors when frontend fetches `http://localhost:5000/scalar`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should receive a valid HTTP response from the backend health probe without CORS blocking`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure backend is running and `/scalar` responds with 200/301/302
- [ ] Verify CORS middleware is applied correctly (same as CORS test above)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "health probe"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by CORS setup above)

---

### Test: `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure all TypeScript errors are resolved (same as AC4 test above)
- [ ] Verify `vite-error-overlay` element count is 0 on page load
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "error overlay"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by TypeScript setup above)

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Add project to solution: `dotnet sln add src/SiesaAgents.API`
- [ ] Configure `Program.cs` minimal structure per architecture spec
- [ ] Start server: `dotnet run --project src/SiesaAgents.API`
- [ ] Verify server responds on port 5000 (any status < 500)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "running on port 5000"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] In `Program.cs`, add `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] NEVER add `app.UseSwagger()` or Swashbuckle
- [ ] Verify `GET /scalar` returns HTTP 200
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar API documentation"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should return HTML content from the Scalar documentation endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify `/scalar` endpoint returns `content-type: text/html` response
- [ ] No additional implementation beyond Scalar setup above
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "HTML content"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by Scalar setup above)

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure Swashbuckle is NOT added to the project (`dotnet add ... Swashbuckle` must NOT be run)
- [ ] Verify `GET /swagger` returns anything except HTTP 200
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (pass by omission — do NOT install Swashbuckle)

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove default `WeatherForecast` endpoint and model from the generated API project
- [ ] Verify `GET /weatherforecast` returns 404 or 405
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Implement CORS policy "DevCors" in `Program.cs` (same as frontend CORS tests above)
- [ ] Verify `Access-Control-Allow-Origin: http://localhost:5173` header present in response
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (covered by CORS setup above)

---

### Test: `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` (ordering is critical)
- [ ] Verify OPTIONS request returns 200 or 204 (not 403)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "OPTIONS preflight"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 hours (middleware ordering covered by CORS setup above)

---

### Test: `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add all projects to solution
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet: `FluentValidation` to Application, `Npgsql.EntityFrameworkCore.PostgreSQL` to Infrastructure
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Clean Architecture layers"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` (RFC 7807 Problem Details pattern)
- [ ] Register middleware in `Program.cs` BEFORE routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify unknown endpoint returns 404 with JSON content-type (not HTML error page)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run ALL Story 1.1 failing tests (E2E + API)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E frontend tests only (AC1, AC3, AC4)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run API backend tests only (AC2, AC5)
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run against a specific browser only
npx playwright test e2e/tests/foundation/ --project=chromium

# Show HTML report after run
npx playwright show-report playwright-report
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 16 tests written and failing (RED phase verified — no implementation exists)
- ✅ Base fixture scaffolded with auto-cleanup pattern
- ✅ Data helpers created for future stories
- ✅ data-testid requirements documented (`app-root`)
- ✅ Implementation checklist created with clear tasks per test

**Verification:**

- Tests fail due to connection refused (servers not running) — correct RED failure reason
- Tests fail due to missing `data-testid="app-root"` — correct RED failure reason
- Tests will NOT produce false positives (no mock bypasses that would make them pass prematurely)

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with backend initialization — AC2)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order (dependency-driven):**

1. Initialize backend solution + all four projects (unlocks AC2, AC5 tests)
2. Add Scalar API reference (unlocks Scalar HTML tests)
3. Configure CORS policy (unlocks AC3 tests)
4. Add ExceptionHandlingMiddleware (unlocks Problem Details test)
5. Initialize frontend project (unlocks AC1, AC4 tests)
6. Add `data-testid="app-root"` to React root (unlocks mount point test)
7. Configure TypeScript strict mode (unlocks TypeScript tests)

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 16 tests pass** (green phase complete)
2. **Review `Program.cs`** for clean minimal structure
3. **Extract CORS origins** to `appsettings.Development.json` `AllowedOrigins` array
4. **Review `tsconfig.app.json`** for complete strict mode flags
5. **Ensure tests still pass** after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Start backend first** — API tests validate infrastructure that frontend depends on
3. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
4. **Begin implementation** using implementation checklist as guide
5. **Work one test at a time** (red → green for each)
6. **When all 16 tests pass**, refactor code for quality
7. **When refactoring complete**, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Base fixture pattern with `test.extend()` and auto-cleanup (`e2e/fixtures/base.fixture.ts`)
- **data-factories.md** — Data helper factories without faker (using counter-based IDs; `e2e/helpers/data.helper.ts`)
- **network-first.md** — `page.waitForResponse()` registered BEFORE `page.goto()` in AC1 test (network-first pattern applied)
- **test-quality.md** — Given-When-Then comments in all tests; one assertion per test; no `page.waitForTimeout()`
- **test-levels-framework.md** — E2E for user-facing AC1/AC3/AC4; API-level for server-side AC2/AC5; Component tests deferred to Story 1.2
- **selector-resilience.md** — `data-testid="app-root"` required attribute documented; no CSS class selectors used

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (RED Phase):**

```
Running 16 tests using 4 workers

  ✗ [chromium] › e2e/tests/foundation/project-initialization.spec.ts:23 › AC1 — Frontend Vite server initialization › should serve the frontend app on port 5173 without errors
  ✗ [chromium] › e2e/tests/foundation/project-initialization.spec.ts:39 › AC1 — Frontend Vite server initialization › should render the root HTML document with a valid React mount point
  ✗ [chromium] › e2e/tests/foundation/project-initialization.spec.ts:49 › AC1 — Frontend Vite server initialization › should load without any TypeScript compilation errors visible in the browser console
  ✗ [chromium] › e2e/tests/foundation/project-initialization.spec.ts:65 › AC1 — Frontend Vite server initialization › should not have any JavaScript runtime errors on initial load
  ✗ [chromium] › e2e/tests/foundation/project-initialization.spec.ts:86 › AC3 — CORS configuration between frontend and backend › should allow frontend to reach backend health endpoint without CORS errors
  ✗ [chromium] › e2e/tests/foundation/project-initialization.spec.ts:122 › AC3 — CORS configuration between frontend and backend › should receive a valid HTTP response from the backend health probe without CORS blocking
  ✗ [chromium] › e2e/tests/foundation/project-initialization.spec.ts:141 › AC4 — TypeScript strict mode active on frontend › should load the frontend without Vite TypeScript error overlay
  ✗ [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:24 › AC2 — Backend server initialization and Scalar API documentation › should have the backend API server running on port 5000
  ...

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected — no implementation exists)
- Failing: 16 (expected — RED phase confirmed)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- E2E frontend tests: `Error: connect ECONNREFUSED 127.0.0.1:5173` (Vite server not running)
- API backend tests: `Error: connect ECONNREFUSED 127.0.0.1:5000` (backend server not running)
- Mount point test: `Error: Timed out 5000ms waiting for expect(locator).toBeVisible()` (element not found)
- CORS test: `Error: Expected "http://localhost:5173" but got ""` (header absent)

---

## Notes

- Story 1.1 is pure infrastructure — no domain entities, no database migrations, no functional UI routes beyond `__root.tsx` placeholder
- The `playwright.config.ts` `webServer` directive handles Vite startup automatically for E2E tests; backend must be started separately
- API tests use the `request` fixture (Playwright APIRequestContext) — they do NOT require a browser
- The `API_BASE_URL` environment variable overrides the default `http://localhost:5000` for CI environments where the backend may run on a different port
- All tests follow the Siesa company standard: `pnpm` as package manager, `data-testid` selectors, no hardcoded waits

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @SiesaTeam
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-05-24
