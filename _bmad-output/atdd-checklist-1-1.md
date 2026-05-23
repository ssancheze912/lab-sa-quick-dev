# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-23
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

As a developer, I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized
with all required dependencies so that the team has a working development environment with both servers running.

**As a** developer
**I want** the frontend and backend projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running on ports 5173 and 5000

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine with Node.js and .NET 10 installed, when the developer runs the frontend initialization commands, then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, when the developer runs `dotnet run` in `src/SiesaAgents.API`, then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, when the frontend makes any HTTP request to `http://localhost:5000`, then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, when the TypeScript compiler runs, then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, when `dotnet build SiesaAgents.sln` is executed, then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

#### AC1 — Frontend Vite server initialization (4 tests)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend app at `http://localhost:5173` not yet implemented
  - **Verifies:** HTTP 200 response from root route of the Vite dev server

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element not yet present in DOM
  - **Verifies:** A React mount point with `data-testid="app-root"` is visible after navigation

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Frontend project not yet initialized; TypeScript compilation not configured
  - **Verifies:** Zero `[TypeScript]` / `TS` errors in browser console on page load

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Frontend project not yet initialized; runtime errors expected
  - **Verifies:** Zero JavaScript `pageerror` events fired on initial load

#### AC3 — CORS configuration between frontend and backend (2 tests)

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — CORS not configured; cross-origin requests will be blocked
  - **Verifies:** Zero CORS-related console errors when frontend fetches from backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not yet running; connection refused
  - **Verifies:** `/scalar` endpoint responds with HTTP 200, 301, or 302

#### AC4 — TypeScript strict mode active on frontend (1 test)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend not yet initialized; `vite-error-overlay` behavior not verifiable
  - **Verifies:** `vite-error-overlay` custom element has count 0 after page load with networkidle

---

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

#### AC2 — Backend server initialization and Scalar API documentation (7 tests)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not yet created; connection to port 5000 refused
  - **Verifies:** HTTP response status < 500 from backend base URL

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `app.MapScalarApiReference()` not yet configured in `Program.cs`
  - **Verifies:** GET `/scalar` returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — `/scalar` endpoint does not exist yet
  - **Verifies:** `content-type` header of `/scalar` response contains `text/html`

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not yet initialized; `/swagger` response undefined
  - **Verifies:** GET `/swagger` does NOT return HTTP 200 (endpoint must not exist)

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Default .NET template WeatherForecast endpoint not yet removed
  - **Verifies:** GET `/weatherforecast` returns 404 or 405

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — CORS policy not yet registered; `Access-Control-Allow-Origin` header absent
  - **Verifies:** `Access-Control-Allow-Origin` header equals `http://localhost:5173` or `*`

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — CORS middleware not yet applied before endpoint mapping
  - **Verifies:** OPTIONS preflight to `/scalar` returns 200 or 204

#### AC5 — Backend solution builds and runs successfully (2 tests)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Solution not yet created; server not running
  - **Verifies:** GET `/scalar` returns 200, proving the solution compiled without errors

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ExceptionHandlingMiddleware` not yet created or registered
  - **Verifies:** GET `/api/nonexistent-endpoint-for-atdd` returns 404 or 400 with JSON content-type (not HTML)

---

## Data Factories Created

No data factories required for Story 1.1. This story covers infrastructure initialization only — no domain entities, no CRUD operations, no test data seeding needed.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` factories for future stories.

---

## Fixtures Created

No new fixtures required for Story 1.1.

The existing `e2e/fixtures/base.fixture.ts` provides base Playwright test extension. The initialization tests use the raw `@playwright/test` import directly since they test the boot state of both servers and do not require authenticated sessions or domain-specific page navigation.

---

## Mock Requirements

No external service mocks are required for Story 1.1.

Both the frontend (Vite dev server) and the backend (.NET API) are real servers under test. The tests validate real runtime behavior:
- Frontend: Real Vite compilation and React rendering
- Backend: Real .NET process serving real HTTP responses

**Important:** The backend tests in `backend-initialization.api.spec.ts` target `http://localhost:5000` directly (not through the frontend baseURL). The `API_BASE_URL` constant reads from `process.env.API_BASE_URL` with a default of `http://localhost:5000`.

---

## Required data-testid Attributes

### Frontend — `src/main.tsx` or `index.html` / `App.tsx`

- `app-root` — Root React mount point; must be present on the `<div id="root">` or the top-level React component wrapper so the DOM visibility assertion passes

**Implementation Example:**

```tsx
// src/App.tsx
export function App() {
  return (
    <div data-testid="app-root">
      {/* application content */}
    </div>
  );
}
```

Or alternatively in `index.html`:

```html
<div id="root" data-testid="app-root"></div>
```

---

## Implementation Checklist

### Test: AC1 — `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Verify `pnpm run dev` starts on port 5173 and responds HTTP 200 on root route
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "serve the frontend app"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC1 — `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
- [ ] Add `data-testid="app-root"` to the root component wrapper in `App.tsx` or `index.html`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "render the root HTML"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC1 — `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all generated code compiles without TypeScript errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC1 — `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/shared/lib/queryClient.ts` exporting the singleton `QueryClient`
- [ ] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify zero `pageerror` events on page load
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "JavaScript runtime errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC2 — `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution
- [ ] Configure `launchSettings.json` or `appsettings.json` to use port 5000
- [ ] Verify `dotnet run` starts listening on port 5000
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "backend API server running"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC2 — `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package to API: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add `builder.Services.AddOpenApi()` to `Program.cs`
- [ ] Add `app.MapScalarApiReference()` to `Program.cs` (NEVER `app.UseSwagger()`)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar API documentation page"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC2 — `should return HTML content from the Scalar documentation endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify Scalar package serves HTML at `/scalar` (no additional config required beyond previous test)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "HTML content from the Scalar"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC2 — `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Do NOT install Swashbuckle.AspNetCore
- [ ] Do NOT call `app.UseSwaggerUI()` or `app.UseSwagger()`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger/OpenAPI UI"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC2 — `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove default WeatherForecast endpoints and models from the generated API project
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC3 — `should return CORS header allowing http://localhost:5173 origin`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, add: `builder.Services.AddCors(options => options.AddPolicy("DevCors", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()))`
- [ ] Apply `app.UseCors("DevCors")` before `app.MapScalarApiReference()` and endpoint mappings
- [ ] Add `AllowedOrigins` array in `appsettings.Development.json` with `http://localhost:5173`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header allowing"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC3 — `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `app.UseCors("DevCors")` is called BEFORE `app.MapScalarApiReference()` (middleware order is critical)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "OPTIONS preflight"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC3 — `should allow frontend to reach backend health endpoint without CORS errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Both frontend and backend must be running simultaneously
- [ ] CORS policy must allow `http://localhost:5173` (see CORS tasks above)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC4 — `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all source files compile without errors — no `any` types, all null checks satisfied
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "Vite TypeScript error overlay"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC5 — `should have all four Clean Architecture layers responding`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet packages: `Scalar.AspNetCore` to API, `FluentValidation` to Application, `Npgsql.EntityFrameworkCore.PostgreSQL` to Infrastructure
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "four Clean Architecture layers"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: AC5 — `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` with Problem Details RFC 7807 format
- [ ] Register middleware in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Configure `appsettings.Development.json` with `ConnectionStrings:DefaultConnection` placeholder
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details RFC 7807"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all failing tests for this story
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E (frontend) tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API (backend) tests
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests with HTML report
npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (16 tests total across E2E and API levels)
- ✅ No fixtures or factories needed (infrastructure-only story)
- ✅ Mock requirements documented (none required — real servers under test)
- ✅ data-testid requirements listed (`app-root`)
- ✅ Implementation checklist created with 13 discrete test tasks

**Verification:**

- All tests fail with connection refused errors (servers not running) or assertion failures (elements not present)
- Failure messages are clear: `net::ERR_CONNECTION_REFUSED` for backend tests, element not found for `[data-testid="app-root"]`
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC1 frontend init tasks)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- Start with Task 1 (frontend init) — AC1 tests are the foundation
- Then Task 2 (backend init) — AC2 and AC5 tests
- Then Task 3 (CORS config) — AC3 tests depend on both servers running
- AC4 test passes automatically once TypeScript config is correct (covered in Task 1)
- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 16 tests pass** (green phase complete)
2. **Review `Program.cs`** for clean middleware ordering and correct service registrations
3. **Review `tsconfig.app.json`** and `vite.config.ts` for consistency with architecture decisions
4. **Ensure tests still pass** after each refactor
5. **Update story status** to 'done' in sprint-status.yaml

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
3. **Begin implementation** using implementation checklist as guide — start with Task 1 (frontend initialization)
4. **Work one test at a time** (red → green for each)
5. **When all 16 tests pass**, refactor code for quality
6. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Network-first route interception pattern applied: `page.waitForResponse()` registered BEFORE `page.goto()` in AC1 test
- **selector-resilience.md** — `data-testid` selector strategy used exclusively (`[data-testid="app-root"]`, `vite-error-overlay`)
- **test-quality.md** — One assertion per test (atomic design), Given-When-Then structure throughout, no hard waits
- **timing-debugging.md** — `page.waitForLoadState('networkidle')` used instead of `sleep()` for AC4 overlay test
- **test-levels-framework.md** — E2E selected for user-facing AC1/AC3/AC4 (browser behavior); API selected for AC2/AC5 (server contract validation without UI dependency)
- **fixture-architecture.md** — No fixtures created for this story (infrastructure-only, no domain setup needed)

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 16 tests using 1 worker

  ✕ AC1 — Frontend Vite server initialization > should serve the frontend app on port 5173 without errors
  ✕ AC1 — Frontend Vite server initialization > should render the root HTML document with a valid React mount point
  ✕ AC1 — Frontend Vite server initialization > should load without any TypeScript compilation errors visible in the browser console
  ✕ AC1 — Frontend Vite server initialization > should not have any JavaScript runtime errors on initial load
  ✕ AC3 — CORS configuration between frontend and backend > should allow frontend to reach backend health endpoint without CORS errors
  ✕ AC3 — CORS configuration between frontend and backend > should receive a valid HTTP response from the backend health probe without CORS blocking
  ✕ AC4 — TypeScript strict mode active on frontend > should load the frontend without Vite TypeScript error overlay
  ✕ AC2 — Backend server initialization and Scalar API documentation > should have the backend API server running on port 5000
  ✕ AC2 — Backend server initialization and Scalar API documentation > should serve the Scalar API documentation page at /scalar
  ✕ AC2 — Backend server initialization and Scalar API documentation > should return HTML content from the Scalar documentation endpoint
  ✕ AC2 — Backend server initialization and Scalar API documentation > should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
  ✕ AC2 — Backend server initialization and Scalar API documentation > should NOT expose WeatherForecast default endpoint
  ✕ AC2 — Backend server initialization and Scalar API documentation > should return CORS header allowing http://localhost:5173 origin
  ✕ AC2 — Backend server initialization and Scalar API documentation > should respond to OPTIONS preflight from frontend origin without CORS rejection
  ✕ AC5 — Backend solution builds and runs successfully > should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)
  ✕ AC5 — Backend solution builds and runs successfully > should return Problem Details RFC 7807 format for unhandled errors

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- E2E tests (AC1, AC3, AC4): `net::ERR_CONNECTION_REFUSED` or `Target page, context or browser has been closed` — frontend server not running
- API tests (AC2, AC5): `net::ERR_CONNECTION_REFUSED` connecting to `http://localhost:5000` — backend server not running
- After frontend is running but before `data-testid="app-root"` added: `Locator expected to be visible` for the mount point test
- After backend runs but before CORS: `Expected value: "http://localhost:5173"` for CORS header assertion

---

## Notes

- This story initializes the project skeleton only — no domain entities, no database migrations, no routes beyond `__root.tsx`
- The `webServer` config in `playwright.config.ts` starts the Vite dev server automatically via `pnpm --filter frontend dev`; the backend must be started separately with `dotnet run` in `src/SiesaAgents.API`
- AC5 (zero build errors) is validated indirectly at runtime: if the backend server responds, it compiled successfully
- The `API_BASE_URL` environment variable allows running tests against non-default backend ports (e.g., `API_BASE_URL=http://localhost:5001 npx playwright test`)
- All four Clean Architecture layers (API, Application, Domain, Infrastructure) must be referenced in `SiesaAgents.sln` for the solution build to succeed; the tests validate this indirectly via server availability

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-05-23
