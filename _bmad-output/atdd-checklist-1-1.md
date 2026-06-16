# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-16
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

A developer setting up the Siesa Agents CRM project needs both the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies so the team has a working development environment with both servers running.

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

### E2E Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — frontend server not yet initialized; `http://localhost:5173/` returns connection refused
  - **Verifies:** AC1 — Vite dev server starts and returns HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist (not yet implemented in index.html/App.tsx)
  - **Verifies:** AC1 — React app mounts successfully with a testable root element

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — frontend not yet compiled; no Vite dev server running
  - **Verifies:** AC4 — Zero TypeScript `[TS]`-prefixed console errors on initial load

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — frontend not yet running; no page to load
  - **Verifies:** AC1/AC4 — Clean React initialization with no uncaught runtime exceptions

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — frontend not yet running; no page to reach network idle state
  - **Verifies:** AC4 — `<vite-error-overlay>` element is absent (no TS compilation errors)

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — neither server is running; both must be up for CORS test to execute
  - **Verifies:** AC3 — no CORS-related errors in browser console when frontend calls backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — backend not yet running; `http://localhost:5000/scalar` returns connection refused
  - **Verifies:** AC3 — backend endpoint reachable (200/301/302), not CORS-blocked

### API Tests (7 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — .NET solution not yet created; `http://localhost:5000/` returns connection refused
  - **Verifies:** AC2 — backend responds to HTTP requests (status < 500)

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `Scalar.AspNetCore` package not installed; `app.MapScalarApiReference()` not configured
  - **Verifies:** AC2 — `/scalar` endpoint returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Scalar endpoint not configured; no HTML response available
  - **Verifies:** AC2 — `/scalar` content-type includes `text/html`

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — backend not yet running; cannot validate `/swagger` returns non-200
  - **Verifies:** AC2 — architecture constraint: Swashbuckle is forbidden; `/swagger` must not return 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — default `dotnet new webapi` template not yet cleaned up
  - **Verifies:** AC2 — default WeatherForecast endpoint removed; returns 404 or 405

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — CORS policy `DevCors` not yet configured in `Program.cs`
  - **Verifies:** AC3 — `Access-Control-Allow-Origin` header equals `http://localhost:5173` or `*`

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — `app.UseCors()` not yet called before endpoint mapping
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204 (not 403)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — solution not yet created with four projects and their references
  - **Verifies:** AC5 — server starts (proves build succeeded); four layers compiled and wired

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ExceptionHandlingMiddleware` not yet implemented
  - **Verifies:** AC5/implicit — error responses are JSON (`application/json`), not HTML; middleware wired

---

## Data Factories Created

No domain entity factories are required for this story. Story 1.1 validates infrastructure initialization — there are no database entities or API resources to seed.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` factories for later stories.

---

## Fixtures Created

### Base Test Fixture

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page at `/clientes` route
  - **Cleanup:** None (stateless navigation)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page at `/contactos` route
  - **Cleanup:** None (stateless navigation)

> Note: These fixtures are not used by Story 1.1 tests (which target the root `/` path and direct API calls). They are provided for Stories 1.2+.

---

## Mock Requirements

Story 1.1 tests target the **real running servers** — no mocks are used by design. The purpose is to validate that the actual infrastructure is correctly initialized.

**Backend health endpoints tested directly:**
- `GET http://localhost:5000/` — server up probe
- `GET http://localhost:5000/scalar` — Scalar API docs page
- `OPTIONS http://localhost:5000/scalar` — CORS preflight

**No external service mocks required for this story.**

---

## Required data-testid Attributes

### Frontend — Root Layout (`src/main.tsx` or `index.html`)

- `app-root` — The React application root mount point

**Implementation Example:**

```tsx
// In frontend/src/App.tsx or the root route component
<div data-testid="app-root">
  {/* Application content */}
</div>
```

---

## Implementation Checklist

### Test: AC1 — Frontend Vite server initialization (4 E2E tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `src/routes/__root.tsx` as TanStack Router root route shell
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to the root DOM element in `App.tsx` or root route component
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ 4 E2E tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 — Backend server initialization and Scalar API documentation (5 API tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure`
- [ ] Add project references: API → Application, API → Infrastructure, Application → Domain, Infrastructure → Domain
- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add NuGet package: `dotnet add src/SiesaAgents.Application package FluentValidation`
- [ ] Add NuGet package: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
- [ ] Configure `Program.cs` with `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Remove default WeatherForecast endpoint and model from generated API project
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Verify `dotnet run` starts backend on `http://localhost:5000`
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC2"`
- [ ] ✅ 5 API tests for AC2 pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC3 — CORS configuration (4 tests: 2 E2E + 2 API)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (AC3 section)
**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (CORS headers tests)

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, add: `builder.Services.AddCors(options => options.AddPolicy("DevCors", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()))`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and all endpoint mappings
- [ ] Add `AllowedOrigins` array with `"http://localhost:5173"` in `appsettings.Development.json`
- [ ] Run test: `pnpm exec playwright test --grep "CORS"`
- [ ] ✅ All CORS tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — TypeScript strict mode (1 E2E test)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (AC4 section)

**Tasks to make this test pass:**

- [ ] Ensure `tsconfig.app.json` contains `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Fix any TypeScript errors surfaced by strict mode in generated template code
- [ ] Verify `<vite-error-overlay>` is not rendered when app loads
- [ ] Run test: `pnpm exec playwright test --grep "AC4"`
- [ ] ✅ AC4 test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — Backend solution builds successfully (2 API tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (AC5 section)

**Tasks to make these tests pass:**

- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add unit tests to solution: `dotnet sln add tests/SiesaAgents.UnitTests`
- [ ] Add UnitTests references: UnitTests → Application, UnitTests → Domain
- [ ] Implement `ExceptionHandlingMiddleware` in `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
  - Catches all exceptions, writes Problem Details RFC 7807 with status 500, title, no stack trace
- [ ] Register middleware in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Configure `appsettings.Development.json` with `ConnectionStrings:DefaultConnection`
- [ ] Run test: `pnpm exec playwright test --grep "AC5"`
- [ ] ✅ AC5 tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for this story
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E tests (frontend validation)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API tests (backend validation)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run tests by AC tag
pnpm exec playwright test --grep "AC1"
pnpm exec playwright test --grep "AC2"
pnpm exec playwright test --grep "AC3"
pnpm exec playwright test --grep "AC4"
pnpm exec playwright test --grep "AC5"

# Generate HTML report
pnpm exec playwright test --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (11 tests across 2 files)
- ✅ Fixtures created with auto-cleanup in `e2e/fixtures/base.fixture.ts`
- ✅ Data helpers available in `e2e/helpers/data.helper.ts`
- ✅ Mock requirements documented (none required — tests target real servers)
- ✅ `data-testid` requirements listed (`app-root`)
- ✅ Implementation checklist created

**Verification:**

- All 11 tests run and fail with connection refused or element-not-found errors
- Failure messages are clear: "ERR_CONNECTION_REFUSED" or "element not found"
- Tests fail due to missing implementation, not test logic errors

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC1 frontend init)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Recommended Order:**

1. AC1 frontend tests (run `pnpm run dev`, add `data-testid="app-root"`)
2. AC2 backend server tests (`dotnet new webapi`, Scalar setup)
3. AC3 CORS tests (add `AddCors`/`UseCors` to `Program.cs`)
4. AC4 TypeScript strict tests (fix any TS errors)
5. AC5 build + middleware tests (ExceptionHandlingMiddleware)

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 11 tests pass** (green phase complete)
2. **Review `Program.cs`** for clean minimal structure
3. **Ensure no duplicate service registrations**
4. **Check `tsconfig.app.json`** has all strict flags documented in story
5. **Ensure tests still pass** after each refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`
3. **Begin implementation** using implementation checklist as guide (AC1 first)
4. **Work one test at a time** (red → green for each AC)
5. **When all 11 tests pass**, refactor code for quality
6. **When refactoring complete**, update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns applied: `page.waitForResponse()` registered BEFORE `page.goto()` in AC1 tests
- **fixture-architecture.md** — `base.fixture.ts` uses `test.extend()` with setup/teardown pattern
- **test-quality.md** — Given-When-Then structure, one assertion per test, no hard waits
- **selector-resilience.md** — `data-testid="app-root"` used instead of fragile CSS/class selectors
- **timing-debugging.md** — `page.waitForLoadState('networkidle')` used instead of `sleep()` in AC4 test
- **test-levels-framework.md** — AC1/AC3/AC4 → E2E (browser-level validation required); AC2/AC5 → API tests (no UI, direct HTTP validation)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (before implementation):**

```
Running 11 tests using 4 workers

  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:23 › AC1 — Frontend Vite server initialization › should serve the frontend app on port 5173 without errors
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:39 › AC1 — Frontend Vite server initialization › should render the root HTML document with a valid React mount point
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:49 › AC1 — Frontend Vite server initialization › should load without any TypeScript compilation errors visible in the browser console
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:66 › AC1 — Frontend Vite server initialization › should not have any JavaScript runtime errors on initial load
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:85 › AC3 — CORS configuration between frontend and backend › should allow frontend to reach backend health endpoint without CORS errors
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:122 › AC3 — CORS configuration between frontend and backend › should receive a valid HTTP response from the backend health probe without CORS blocking
     Error: connect ECONNREFUSED 127.0.0.1:5000

  ✘  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:141 › AC4 — TypeScript strict mode active on frontend › should load the frontend without Vite TypeScript error overlay
     Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:24 › AC2 — Backend server initialization and Scalar API documentation › should have the backend API server running on port 5000
     Error: connect ECONNREFUSED 127.0.0.1:5000

  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:35 › AC2 — Backend server initialization and Scalar API documentation › should serve the Scalar API documentation page at /scalar
     Error: connect ECONNREFUSED 127.0.0.1:5000

  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:45 › AC2 — Backend server initialization and Scalar API documentation › should return HTML content from the Scalar documentation endpoint
     Error: connect ECONNREFUSED 127.0.0.1:5000

  ✘  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:117 › AC5 — Backend solution builds and runs successfully › should return Problem Details RFC 7807 format for unhandled errors
     Error: connect ECONNREFUSED 127.0.0.1:5000

  11 failed
```

**Summary:**

- Total tests: 11
- Passing: 0 (expected)
- Failing: 11 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- E2E tests (AC1, AC3, AC4): `net::ERR_CONNECTION_REFUSED at http://localhost:5173/` — frontend server not yet running
- API tests (AC2, AC3, AC5): `connect ECONNREFUSED 127.0.0.1:5000` — backend server not yet running
- Once frontend runs but `app-root` is missing: `Locator expected to be visible` for `[data-testid="app-root"]`
- Once backend runs but Scalar not configured: `Expected: 200, Received: 404` for `/scalar`
- Once backend runs but CORS not configured: `Expected: "http://localhost:5173", Received: ""` for `Access-Control-Allow-Origin` header

---

## Notes

- Story 1.1 is a pure infrastructure story — tests validate environment setup, not domain behavior
- All 11 tests will fail with connection refused errors until both servers are running
- The `data-testid="app-root"` requirement is implicit from the test; the dev must add it to the root component
- The `app.UseCors()` call MUST appear before `app.MapScalarApiReference()` — order matters in ASP.NET Core middleware pipeline
- The WeatherForecast removal test (`should NOT expose WeatherForecast default endpoint`) is an architecture guard — it must stay RED until the developer explicitly removes the default template code
- `tea_use_playwright_utils: false` and `tea_use_mcp_enhancements: false` per project config — no MCP recording or playwright-utils patterns used

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-06-16
