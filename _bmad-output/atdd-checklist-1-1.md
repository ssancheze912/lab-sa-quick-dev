# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

This story initializes the full-stack skeleton for Siesa Agents CRM. A developer working on a clean machine should be able to spin up both the Vite React-TS frontend (port 5173) and the .NET 10 Clean Architecture backend (port 5000) with no errors. TypeScript strict mode must be active on the frontend and CORS must allow cross-origin requests between both dev servers.

**As a** developer,
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
**So that** the team has a working development environment with both servers running.

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
  - **Status:** RED - Frontend project does not yet exist; page.goto('/') will fail with connection refused
  - **Verifies:** AC1 — Vite dev server starts and returns HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED - `[data-testid="app-root"]` element does not exist in unimplemented project
  - **Verifies:** AC1 — React application mounts correctly with required data-testid attribute

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED - Frontend does not exist; no console output possible
  - **Verifies:** AC4 — TypeScript strict mode produces no compile errors surfaced to browser

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED - Frontend does not exist
  - **Verifies:** AC1 — App boots cleanly with zero runtime exceptions

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED - Neither server is running; CORS configuration not implemented
  - **Verifies:** AC3 — No CORS-related console errors when frontend calls backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED - Backend server does not exist
  - **Verifies:** AC3 — Backend returns a valid response (not CORS-rejected)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED - Frontend does not exist; `vite-error-overlay` check cannot run
  - **Verifies:** AC4 — TypeScript compilation produces no Vite error overlay

### API Tests (7 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (~147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED - Backend not implemented; connection refused on port 5000
  - **Verifies:** AC2 — .NET 10 server responds on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED - `app.MapScalarApiReference()` not configured
  - **Verifies:** AC2 — Scalar docs endpoint returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED - `/scalar` endpoint does not exist
  - **Verifies:** AC2 — Scalar endpoint returns `text/html` content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED - Backend not running; cannot verify absence of `/swagger`
  - **Verifies:** AC2 — Swashbuckle is absent (architecture constraint)

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED - Backend not running; cannot verify removal of default template endpoints
  - **Verifies:** AC2 — Default .NET template endpoints are removed

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED - CORS policy not configured in Program.cs
  - **Verifies:** AC3 — `Access-Control-Allow-Origin: http://localhost:5173` header present

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED - CORS middleware not applied before endpoint mapping
  - **Verifies:** AC3 — OPTIONS preflight succeeds (200 or 204)

### API Tests continued — AC5 (2 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (continued)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED - Solution not built; server cannot start
  - **Verifies:** AC5 — All four projects compile and DI wiring allows server to start

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED - `ExceptionHandlingMiddleware` not registered
  - **Verifies:** AC2/AC5 — Error middleware returns JSON (not HTML) for unknown routes

---

## Data Factories Created

No domain-level data factories are needed for Story 1.1. This story creates infrastructure only — there are no user-facing entities or API mutations to seed. The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` factories for future stories.

---

## Fixtures Created

No additional fixtures beyond `e2e/fixtures/base.fixture.ts` are required for Story 1.1 tests. The tests use Playwright's default `test` import directly since no authenticated state or pre-seeded data is needed.

**Existing Fixture File:** `e2e/fixtures/base.fixture.ts`

**Fixtures available (for future stories):**
- `clientesPage` — navigates to `/clientes` before test; provides auto-cleanup pattern
- `contactosPage` — navigates to `/contactos` before test; provides auto-cleanup pattern

---

## Mock Requirements

Story 1.1 tests validate **real infrastructure** (servers must actually be running), so no network mocks are used. Tests are integration-level: they verify the actual Vite and .NET processes are up and configured correctly.

**No mock requirements for this story.**

> Note: If running in CI without both servers, tests will fail with connection errors — this is expected and correct RED behavior.

---

## Required data-testid Attributes

### index.html / App.tsx (Frontend Root)

- `app-root` — The root container element where React mounts. Must be present on the `<div id="root">` or a top-level wrapper in `App.tsx`.

**Implementation Example:**

```tsx
// In index.html
<div id="root" data-testid="app-root"></div>

// OR in App.tsx
export function App() {
  return (
    <div data-testid="app-root">
      <RouterProvider router={router} />
    </div>
  );
}
```

> Note: No other `data-testid` attributes are required for Story 1.1. All other UI elements belong to Stories 1.2+ (navigation shell, route views).

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors` + `should render the root HTML document with a valid React mount point` + `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass (Task 1 from story):**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Create `src/shared/lib/queryClient.ts` exporting singleton `QueryClient`
- [ ] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Create `src/routes/__root.tsx` as TanStack Router root route placeholder
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to root element in `index.html` or `App.tsx`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console` + `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass (Task 1 AC4 from story):**

- [ ] Confirm `tsconfig.app.json` has `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all source files pass TypeScript compiler with zero errors: `npx tsc --noEmit`
- [ ] Remove any `any` type usage from generated boilerplate
- [ ] Verify Vite error overlay (`vite-error-overlay`) is absent on page load
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should have the backend API server running on port 5000` + `should serve the Scalar API documentation page at /scalar` + `should return HTML content from the Scalar documentation endpoint` + `should NOT expose WeatherForecast default endpoint` + `should have all four Clean Architecture layers responding`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass (Task 2 from story):**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure tests/SiesaAgents.UnitTests`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain; UnitTests → Application + Domain
- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add NuGet package: `dotnet add src/SiesaAgents.Application package FluentValidation`
- [ ] Add NuGet package: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
- [ ] Configure `Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- [ ] Remove default WeatherForecast endpoints and models from the generated API project
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Verify Scalar page loads at `http://localhost:5000/scalar` after `dotnet run`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Confirm `Swashbuckle.AspNetCore` is NOT added to `SiesaAgents.API.csproj`
- [ ] Confirm `app.UseSwagger()` and `app.UseSwaggerUI()` are NOT present in `Program.cs`
- [ ] Confirm `/swagger` returns a non-200 response (404 or 405)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors` + `should receive a valid HTTP response from the backend health probe without CORS blocking` + `should return CORS header allowing http://localhost:5173 origin` + `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/foundation/project-initialization.spec.ts` + `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass (Task 3 from story):**

- [ ] In `Program.cs`, register CORS policy:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and all endpoint mappings
- [ ] Configure `appsettings.Development.json` with `AllowedOrigins: ["http://localhost:5173"]`
- [ ] Verify `Access-Control-Allow-Origin: http://localhost:5173` header in responses
- [ ] Verify OPTIONS preflight returns 200 or 204
- [ ] Run test: `npx playwright test --grep "CORS"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass (Task 4 from story):**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` with RFC 7807 Problem Details format
- [ ] Register middleware in `Program.cs` BEFORE routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Ensure unknown endpoints return JSON (not HTML) responses — Problem Details or standard 404 JSON
- [ ] Verify `Content-Type: application/json` or `application/problem+json` on 404 responses
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all tests for Story 1.1
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E tests only (AC1, AC3, AC4)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run API tests only (AC2, AC3, AC5)
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with HTML report
npx playwright test --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (16 total)
- No fixtures or factories needed for this infrastructure story
- Mock requirements: none (tests validate real servers)
- data-testid requirements: `app-root` documented
- Implementation checklist created with clear tasks

**Verification:**

- All tests run and fail with `connection refused` or `element not found`
- Failures are due to missing implementation, not test bugs
- Tests will transition to GREEN once both servers are initialized per tasks above

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test group** from implementation checklist (recommend: Task 2 backend first, then Task 1 frontend)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- Run backend tests first (they have no browser dependency)
- Run frontend tests after Vite dev server is up
- Minimal implementation (no business logic yet — only project skeleton)
- Treat `data-testid="app-root"` as a first-class requirement

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `bmm-workflow-status.md`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review `Program.cs` for structure clarity
3. Extract CORS origins to `appsettings.Development.json` (not hardcoded)
4. Ensure `tsconfig.app.json` strict flags match architecture docs exactly
5. Remove any boilerplate comments from generated template files
6. Run tests after each change to maintain green

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
3. **Start with Task 2** (backend) — API tests have no browser requirement and give fast feedback
4. **Then Task 1** (frontend) — frontend E2E tests require Vite server to be up
5. **Then Task 3** (CORS) — requires both servers running simultaneously
6. **Work one test group at a time** (red → green for each AC)
7. **When all tests pass**, refactor for code quality
8. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns: `page.waitForResponse()` called BEFORE `page.goto()` in AC1 test; `page.route()` called before navigation in CORS test
- **selector-resilience.md** — Selector hierarchy applied: `data-testid="app-root"` used instead of CSS selectors
- **test-quality.md** — One assertion per test (atomic); Given-When-Then structure throughout; no hard waits
- **test-levels-framework.md** — E2E used for user-facing browser behavior (AC1, AC3, AC4); API tests used for backend contract validation (AC2, AC3, AC5)
- **fixture-architecture.md** — Existing `base.fixture.ts` follows pure-function → fixture → mergeTests pattern

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 16 tests using 4 workers

  x  [chromium] › foundation/project-initialization.spec.ts:23:3 - should serve the frontend app on port 5173 without errors
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  
  x  [chromium] › foundation/project-initialization.spec.ts:39:3 - should render the root HTML document with a valid React mount point
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  x  [chromium] › foundation/project-initialization.spec.ts:49:3 - should load without any TypeScript compilation errors visible in the browser console
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  x  [chromium] › foundation/project-initialization.spec.ts:66:3 - should not have any JavaScript runtime errors on initial load
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  x  [chromium] › foundation/project-initialization.spec.ts:86:3 - should allow frontend to reach backend health endpoint without CORS errors
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  x  [chromium] › foundation/project-initialization.spec.ts:122:3 - should receive a valid HTTP response from the backend health probe without CORS blocking
     Error: request.get: getaddrinfo ECONNREFUSED 127.0.0.1:5000

  x  [chromium] › foundation/project-initialization.spec.ts:140:3 - should load the frontend without Vite TypeScript error overlay
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  x  [chromium] › api/backend-initialization.api.spec.ts:23:3 - should have the backend API server running on port 5000
     Error: request.get: getaddrinfo ECONNREFUSED 127.0.0.1:5000

  x  [chromium] › api/backend-initialization.api.spec.ts:34:3 - should serve the Scalar API documentation page at /scalar
     Error: request.get: getaddrinfo ECONNREFUSED 127.0.0.1:5000

  x  [chromium] › api/backend-initialization.api.spec.ts:44:3 - should return HTML content from the Scalar documentation endpoint
     Error: request.get: getaddrinfo ECONNREFUSED 127.0.0.1:5000

  x  [chromium] › api/backend-initialization.api.spec.ts:55:3 - should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
     Error: request.get: getaddrinfo ECONNREFUSED 127.0.0.1:5000

  x  [chromium] › api/backend-initialization.api.spec.ts:65:3 - should NOT expose WeatherForecast default endpoint
     Error: request.get: getaddrinfo ECONNREFUSED 127.0.0.1:5000

  x  [chromium] › api/backend-initialization.api.spec.ts:76:3 - should return CORS header allowing http://localhost:5173 origin
     Error: request.get: getaddrinfo ECONNREFUSED 127.0.0.1:5000

  x  [chromium] › api/backend-initialization.api.spec.ts:92:3 - should respond to OPTIONS preflight from frontend origin without CORS rejection
     Error: request.fetch: getaddrinfo ECONNREFUSED 127.0.0.1:5000

  x  [chromium] › api/backend-initialization.api.spec.ts:118:3 - should have all four Clean Architecture layers responding
     Error: request.get: getaddrinfo ECONNREFUSED 127.0.0.1:5000

  x  [chromium] › api/backend-initialization.api.spec.ts:131:3 - should return Problem Details RFC 7807 format for unhandled errors
     Error: request.get: getaddrinfo ECONNREFUSED 127.0.0.1:5000

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: RED phase verified

**Expected Failure Messages:**
- All E2E tests: `net::ERR_CONNECTION_REFUSED at http://localhost:5173/` — frontend not yet initialized
- All API tests: `getaddrinfo ECONNREFUSED 127.0.0.1:5000` — backend not yet initialized
- After frontend init, AC4/AC1 tests may fail with `Element not found: [data-testid="app-root"]` until `data-testid` is added

---

## Notes

- Story 1.1 is purely infrastructure setup — no domain entities, no database, no business logic
- The `data-testid="app-root"` attribute is the ONLY UI-level testid required for this story
- CORS tests require BOTH servers to be running simultaneously — run backend first
- The `/scalar` endpoint test also validates the Scalar.AspNetCore package is installed correctly
- The WeatherForecast removal test acts as a guard to ensure the default .NET template is cleaned up
- TypeScript tests are partially environmental (they catch misconfigured tsconfig) — useful CI gate
- This story's tests serve as the foundation for all subsequent stories in Epic 1

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-05-24
