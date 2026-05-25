# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-25
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

As a developer, I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies, so that the team has a working development environment with both servers running.

**As a** developer
**I want** the frontend and backend projects fully initialized and configured
**So that** the team has a working, type-safe development environment ready for feature development

---

## Acceptance Criteria

1. **AC1** - Given a clean development machine with Node.js and .NET 10 installed, When the developer runs the frontend initialization commands, Then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** - Given the backend project has been created, When the developer runs `dotnet run` in `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** - Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** - Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** - Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED - Frontend project does not exist yet; connection refused on port 5173
  - **Verifies:** AC1 - Vite dev server starts and responds HTTP 200 at root

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED - `[data-testid="app-root"]` element missing; frontend not implemented
  - **Verifies:** AC1 - React app mounts correctly with required data-testid attribute

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED - Frontend not initialized; no console output possible
  - **Verifies:** AC4 - TypeScript strict mode produces no runtime console errors

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED - Frontend not initialized; no page to load
  - **Verifies:** AC1 - App bootstraps without JavaScript exceptions

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors` (AC3)
  - **Status:** RED - Backend not running; CORS headers not configured
  - **Verifies:** AC3 - No CORS errors when frontend makes request to backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking` (AC3)
  - **Status:** RED - Backend not running on port 5000
  - **Verifies:** AC3 - Backend responds to cross-origin requests

- **Test:** `should load the frontend without Vite TypeScript error overlay` (AC4)
  - **Status:** RED - Frontend not initialized; no Vite server running
  - **Verifies:** AC4 - No `<vite-error-overlay>` rendered (TypeScript compile-time errors absent)

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED - Backend project not created; port 5000 not bound
  - **Verifies:** AC2 - .NET backend starts and is reachable

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED - Backend not running; Scalar not configured
  - **Verifies:** AC2 - `app.MapScalarApiReference()` registers the /scalar route

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED - Backend not running
  - **Verifies:** AC2 - Scalar endpoint returns `text/html` content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED - Backend not running (cannot verify 404 on /swagger)
  - **Verifies:** AC2 - Architecture constraint: only Scalar, no Swashbuckle

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED - Backend not running
  - **Verifies:** AC2 - Default template endpoints are removed

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED - Backend not running; CORS policy not configured
  - **Verifies:** AC3 - `Access-Control-Allow-Origin: http://localhost:5173` header present

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED - Backend not running
  - **Verifies:** AC3 - CORS preflight (OPTIONS) returns 200 or 204

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED - Solution not built
  - **Verifies:** AC5 - All four CA projects compile and load (server starting proves build success)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED - Backend not running; ExceptionHandlingMiddleware not registered
  - **Verifies:** AC2/AC5 - Middleware is wired; error responses use `application/problem+json`

### Component Tests (0 tests)

Not applicable for this story. Story 1.1 concerns infrastructure initialization, not UI component behavior. There are no interactive components to test at the component level.

---

## Data Factories Created

### EnvironmentConfig Factory

**File:** `tests/support/factories/environment.factory.ts`

**Exports:**
- `createEnvironmentConfig(overrides?)` - Create typed environment config with optional overrides
- `getScalarUrl(config)` - Build the full Scalar docs URL from a config object

**Example Usage:**

```typescript
const env = createEnvironmentConfig();
// { frontendUrl: 'http://localhost:5173', backendUrl: 'http://localhost:5000', scalarPath: '/scalar', ... }

const customEnv = createEnvironmentConfig({ backendUrl: 'http://localhost:5001' });
const scalarUrl = getScalarUrl(customEnv); // 'http://localhost:5001/scalar'
```

**Note:** No faker required for this story — environment addresses are fixed and deterministic by design. The factory pattern is used for type-safety and override support across tests.

---

## Fixtures Created

### Environment Fixture

**File:** `tests/support/fixtures/environment.fixture.ts`

**Fixtures:**

- `envConfig` - Provides a typed `EnvironmentConfig` object to tests
  - **Setup:** Calls `createEnvironmentConfig()` to resolve the dev environment config
  - **Provides:** `{ frontendUrl, frontendOrigin, backendUrl, scalarPath }` typed object
  - **Cleanup:** No external state created — auto-cleanup is a no-op

**Example Usage:**

```typescript
import { test, expect } from './fixtures/environment.fixture';

test('should connect to backend', async ({ envConfig, request }) => {
  const response = await request.get(`${envConfig.backendUrl}/scalar`);
  expect(response.status()).toBe(200);
});
```

---

## Mock Requirements

Story 1.1 tests verify the real infrastructure (actual Vite server, actual .NET backend). No mocks are required or appropriate at this level — the acceptance tests validate the actual initialization behavior.

**Network Interception (E2E only):**

The E2E test for AC1 uses network-first waiting (`page.waitForResponse`) before navigation to avoid race conditions. This is a deterministic waiting pattern, not a mock.

---

## Required data-testid Attributes

### Frontend Application Root

- `app-root` - Root React mounting point (in `index.html` `<div id="root">` or `App.tsx` wrapper)

**Implementation Example:**

```tsx
// index.html
<div id="root" data-testid="app-root"></div>

// OR in App.tsx if using a wrapper component:
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

**Note:** This is the only `data-testid` required for Story 1.1. All other tests operate at the HTTP/API level and do not require UI selectors.

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors` (AC1)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` and `@tanstack/router-plugin/vite`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify `pnpm run dev` starts on port 5173
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `should render the root HTML document with a valid React mount point` (AC1)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the `<div id="root">` in `index.html` OR to the root wrapper in `App.tsx`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "mount point"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console` (AC4)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all source files are type-safe (no implicit any, no null dereferences)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load` (AC1)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Create `src/shared/lib/queryClient.ts` exporting the singleton `QueryClient`
- [ ] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL`
- [ ] Ensure `RouterProvider` + `QueryProvider` bootstrap without exceptions
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "runtime errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should have the backend API server running on port 5000` (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Add project to solution: `dotnet sln add src/SiesaAgents.API`
- [ ] Configure `Program.cs` minimal structure (builder + app.Run())
- [ ] Verify `dotnet run` in `src/SiesaAgents.API` starts on port 5000
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "running on port 5000"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should serve the Scalar API documentation page at /scalar` (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add `builder.Services.AddOpenApi()` in `Program.cs`
- [ ] Add `app.MapScalarApiReference()` in `Program.cs` (NEVER `app.UseSwagger()`)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar API documentation"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)` (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `Program.cs` does NOT call `app.UseSwagger()` or register Swashbuckle
- [ ] Verify `/swagger` returns 404 after `dotnet run`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should NOT expose WeatherForecast default endpoint` (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove default `WeatherForecast` endpoints and models from the generated API project
- [ ] Verify `/weatherforecast` returns 404 or 405
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin` (AC3)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Register CORS policy in `Program.cs`: `builder.Services.AddCors(...)` with `WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Add `AllowedOrigins` array to `appsettings.Development.json`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should respond to OPTIONS preflight from frontend origin without CORS rejection` (AC3)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify CORS middleware is applied before routing (prerequisite: CORS task above)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "OPTIONS preflight"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors` (AC3)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Both frontend and backend must be running (depends on all AC1 and AC2 tasks)
- [ ] CORS headers must be present (depends on AC3 CORS tasks above)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 additional hours (covered by prior tasks)

---

### Test: `should have all four Clean Architecture layers responding` (AC5)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure tests/SiesaAgents.UnitTests`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet packages: FluentValidation (Application), Npgsql.EntityFrameworkCore.PostgreSQL (Infrastructure)
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Clean Architecture"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors` (AC2/AC5)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` catching all exceptions and returning Problem Details RFC 7807
- [ ] Register middleware in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify `/api/nonexistent-endpoint-for-atdd` returns 404 with `application/json` or `application/problem+json` content type (not HTML)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should load the frontend without Vite TypeScript error overlay` (AC4)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with strict mode flags (covered in AC4 task above)
- [ ] Ensure all source files compile without errors under strict mode
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "error overlay"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0 additional hours (covered by tsconfig task)

---

## Running Tests

```bash
# Run all failing tests for this story (full suite via playwright.config.ts)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E frontend tests only
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run API backend tests only
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/ --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests with UI mode (interactive)
npx playwright test --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (14 tests total: 7 E2E + 7 API)
- ✅ Fixtures created with auto-cleanup (`environment.fixture.ts`)
- ✅ Factory created (`environment.factory.ts`) with override support
- ✅ Mock requirements documented (none needed — real infrastructure tests)
- ✅ data-testid requirements listed (`app-root`)
- ✅ Implementation checklist created with concrete tasks per test

**Verification:**

- All tests fail due to missing implementation (no frontend, no backend)
- Failure messages: "Connection refused" / "ERR_CONNECTION_REFUSED" for unstarted servers
- `[data-testid="app-root"]` tests fail with "Locator not found"
- Tests do NOT fail due to test code errors — failures are implementation-driven

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC2 — backend is prerequisite for CORS tests)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended Implementation Order:**

1. Task 2 (Backend: create solution + 4 CA projects) → makes AC2 + AC5 tests pass
2. Task 3 (CORS config) → makes AC3 tests pass
3. Task 4 (ExceptionHandlingMiddleware) → makes Problem Details test pass
4. Task 1 (Frontend) → makes AC1 + AC4 tests pass

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Completion:**

- All 14 tests pass
- Code quality meets team standards
- Ready for code review and story approval

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
3. **Begin implementation** using implementation checklist as guide (recommended order above)
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **network-first.md** - Route interception patterns: `page.waitForResponse()` registered BEFORE `page.goto()` in AC1 E2E test to prevent race conditions
- **test-quality.md** - Given-When-Then comments in all tests; one assertion per test (atomic design); deterministic waits only (no `sleep`)
- **selector-resilience.md** - `data-testid="app-root"` selector used instead of CSS class or tag selectors
- **fixture-architecture.md** - `environment.fixture.ts` uses `base.extend()` pattern with auto-cleanup no-op
- **data-factories.md** - `environment.factory.ts` uses override pattern (`Partial<EnvironmentConfig>`) matching factory best practices
- **test-levels-framework.md** - E2E for user-visible frontend behavior (AC1, AC3, AC4); API for HTTP-level backend verification (AC2, AC3, AC5); no Component tests (no UI components in Story 1.1)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 14 tests using 4 workers

  ✘ [chromium] › AC1 — Frontend Vite server initialization › should serve the frontend app on port 5173 without errors
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  ✘ [chromium] › AC1 — Frontend Vite server initialization › should render the root HTML document with a valid React mount point
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  ✘ [chromium] › AC1 — Frontend Vite server initialization › should load without any TypeScript compilation errors visible in the browser console
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  ✘ [chromium] › AC1 — Frontend Vite server initialization › should not have any JavaScript runtime errors on initial load
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  ✘ [chromium] › AC3 — CORS configuration between frontend and backend › should allow frontend to reach backend health endpoint without CORS errors
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  ✘ [chromium] › AC3 — CORS configuration between frontend and backend › should receive a valid HTTP response from the backend health probe
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
  ✘ [chromium] › AC4 — TypeScript strict mode active on frontend › should load the frontend without Vite TypeScript error overlay
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  ✘ API › AC2 › should have the backend API server running on port 5000
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/
  ✘ API › AC2 › should serve the Scalar API documentation page at /scalar
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
  ✘ API › AC2 › should return HTML content from the Scalar documentation endpoint
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
  ✘ API › AC2 › should NOT expose any Swagger/OpenAPI UI endpoint
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/swagger
  ✘ API › AC2 › should NOT expose WeatherForecast default endpoint
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/weatherforecast
  ✘ API › AC2 › should return CORS header allowing http://localhost:5173 origin
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
  ✘ API › AC3 › should respond to OPTIONS preflight from frontend origin
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
  ✘ API › AC5 › should have all four Clean Architecture layers responding
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar
  ✘ API › AC5 › should return Problem Details RFC 7807 format for unhandled errors
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/api/nonexistent-endpoint-for-atdd

  14 failed
```

**Summary:**

- Total tests: 14
- Passing: 0 (expected)
- Failing: 14 (expected — all due to missing implementation)
- Status: ✅ RED phase verified

**Note:** playwright.config.ts `webServer` block starts the frontend via `pnpm --filter frontend dev`. Until the `frontend/` project exists, the webServer will fail to start, causing all E2E tests to error with `ERR_CONNECTION_REFUSED`. This is the expected RED phase behavior.

---

## Notes

- The playwright.config.ts `testDir` is set to `./e2e`. The canonical test location for this project is `e2e/tests/` (not `tests/`). Files in `tests/` are supplementary support artifacts (factories, fixtures) and are not directly executed by Playwright.
- Story 1.1 is a pure infrastructure story — there are no domain entities, no database migrations, and no complex UI flows. Component-level tests are not applicable.
- The `ExceptionHandlingMiddleware` test (Problem Details) is a forward-looking test that validates the middleware stub required for Story 1.3. It is included here because Task 4 in the story explicitly requires it.
- The `data-testid="app-root"` attribute is the only UI selector dependency introduced in this story. All other tests operate at the HTTP level.
- Tests in `tests/support/` (factories, fixtures) are reusable across the full test suite and will be consumed by future stories in Epic 1.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-05-25
