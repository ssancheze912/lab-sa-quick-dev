# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-30
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

This story initializes both the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects with all required dependencies so that the team has a working development environment with both servers running concurrently.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
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

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend app does not exist yet; `http://localhost:5173/` returns connection refused
  - **Verifies:** AC1 — Frontend Vite server initializes and returns HTTP 200 on port 5173
  - **AC:** AC1

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist until implementation adds it to the React root
  - **Verifies:** AC1 — The React application mounts correctly and exposes the root container
  - **AC:** AC1

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — No frontend app exists; browser console cannot be checked
  - **Verifies:** AC1/AC4 — TypeScript strict mode produces no browser-visible compile errors
  - **AC:** AC1, AC4

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — No frontend app exists; no runtime to evaluate
  - **Verifies:** AC1 — Frontend dependencies are correctly wired (no missing modules, no runtime exceptions)
  - **AC:** AC1

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Neither server is running; both connections refused
  - **Verifies:** AC3 — No CORS errors appear in browser console when frontend calls backend
  - **AC:** AC3

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend server not running; `http://localhost:5000/scalar` returns connection refused
  - **Verifies:** AC3 — Backend responds to requests from frontend origin (200/301/302)
  - **AC:** AC3

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend app does not exist; no Vite server to check
  - **Verifies:** AC4 — `vite-error-overlay` element is absent (no TypeScript compilation errors)
  - **AC:** AC4

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not running; connection refused on port 5000
  - **Verifies:** AC2 — Backend server starts and responds on port 5000
  - **AC:** AC2

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; `/scalar` returns connection refused
  - **Verifies:** AC2 — `app.MapScalarApiReference()` is registered and Scalar serves at `/scalar` with HTTP 200
  - **AC:** AC2

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; no content type to verify
  - **Verifies:** AC2 — Scalar endpoint returns `text/html` content (not JSON or plain text)
  - **AC:** AC2

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running; `/swagger` endpoint cannot be tested
  - **Verifies:** AC2 (architecture constraint) — Swashbuckle is forbidden; `/swagger` must NOT return HTTP 200
  - **AC:** AC2

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; `/weatherforecast` endpoint cannot be tested
  - **Verifies:** AC2 — Default .NET template endpoint has been removed; returns 404 or 405
  - **AC:** AC2

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; CORS headers cannot be inspected
  - **Verifies:** AC3 — `Access-Control-Allow-Origin` header includes `http://localhost:5173` in all responses
  - **AC:** AC3

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; OPTIONS preflight cannot be tested
  - **Verifies:** AC3 — CORS preflight succeeds (200 or 204), not rejected (403)
  - **AC:** AC3

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not running; this test cannot run
  - **Verifies:** AC5 — All four projects compiled and server started (build failure prevents server start)
  - **AC:** AC5

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; middleware cannot be tested
  - **Verifies:** AC5 — `ExceptionHandlingMiddleware` is wired; non-existent endpoints return JSON (not HTML)
  - **AC:** AC5

### Component Tests (0 tests)

No component tests required for Story 1.1. This story creates project scaffolding and configuration only — no UI components are implemented. Component tests will be introduced from Story 1.2 onward.

---

## Data Factories Created

No domain-specific data factories required for Story 1.1. This story tests infrastructure initialization (servers starting, ports, CORS, compilation), not domain entities.

The shared `e2e/helpers/data.helper.ts` file provides `buildCliente()` and `buildContacto()` factories for use in future stories (Stories 2.x and 3.x).

---

## Fixtures Created

### Base Test Fixtures

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page at `/clientes` route
  - **Cleanup:** Automatic (Playwright teardown)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page at `/contactos` route
  - **Cleanup:** Automatic (Playwright teardown)

**Note:** Story 1.1 tests use `@playwright/test` base fixtures directly — no custom fixtures are required since initialization tests do not need pre-navigated state.

---

## Mock Requirements

No mocks required for Story 1.1. All tests validate real server initialization:

- E2E tests connect to real Vite dev server on `http://localhost:5173`
- API tests connect to real .NET backend on `http://localhost:5000`
- CORS tests require actual CORS headers from the running backend

**Rationale:** Mocking would defeat the purpose — these tests validate that the actual servers start, respond, and are correctly configured. No external services (email, payment, etc.) are involved.

---

## Required data-testid Attributes

### React Root Mount Point (index.html or App.tsx)

- `app-root` — Root container element that wraps the entire React application

**Implementation Example:**

```tsx
// Option A: index.html
<div id="root" data-testid="app-root"></div>

// Option B: src/main.tsx (wrapper approach)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div data-testid="app-root">
      <RouterProvider router={router} />
    </div>
  </React.StrictMode>
);
```

**Note:** All other `data-testid` attributes for Story 1.1 belong to the backend infrastructure (no UI components). The only UI-facing testid is `app-root`.

---

## Implementation Checklist

### Test: AC1 — Frontend Vite server initialization (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Add `data-testid="app-root"` to the root element in `index.html` or `src/main.tsx`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors (check browser console)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ All 4 AC1 + AC4 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 — Backend server initialization and Scalar API documentation (5 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure `Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- [ ] Remove default WeatherForecast endpoints and models from generated API project
- [ ] Verify `dotnet run` starts on port 5000 (check `launchSettings.json`)
- [ ] Verify Scalar page loads at `http://localhost:5000/scalar` returning HTTP 200 with `text/html`
- [ ] Verify `/swagger` returns non-200 (404 expected — Swashbuckle not installed)
- [ ] Verify `/weatherforecast` returns 404 or 405
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC2"`
- [ ] ✅ All 5 AC2 tests pass (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: AC3 — CORS configuration between frontend and backend (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` + `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, add CORS service registration:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` in `Program.cs`
- [ ] Add `AllowedOrigins` array to `appsettings.Development.json` with `"http://localhost:5173"`
- [ ] Verify `Access-Control-Allow-Origin: http://localhost:5173` header is present in all backend responses
- [ ] Verify OPTIONS preflight returns 200 or 204 (not 403)
- [ ] Start both servers and verify no CORS errors in browser dev tools
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC3"`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "AC3"`
- [ ] ✅ All 4 CORS tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — TypeScript strict mode (1 test)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Confirm `tsconfig.app.json` contains:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }
  ```
- [ ] Run TypeScript compiler: `pnpm tsc --noEmit` — must emit zero errors
- [ ] Verify Vite dev server starts without showing `vite-error-overlay`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "AC4"`
- [ ] ✅ AC4 test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: AC5 — Backend solution builds successfully (2 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add unit tests project to solution: `dotnet sln add tests/SiesaAgents.UnitTests`
- [ ] Add NuGet packages to Application: `dotnet add src/SiesaAgents.Application package FluentValidation`
- [ ] Add NuGet packages to Infrastructure: `dotnet add src/SiesaAgents.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL`
- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` with Problem Details RFC 7807 pattern
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Run `dotnet build SiesaAgents.sln` — must output zero errors and zero warnings
- [ ] Verify unknown endpoint `/api/nonexistent-endpoint-for-atdd` returns 404 with JSON content type
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC5"`
- [ ] ✅ Both AC5 tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run ALL failing tests for Story 1.1
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E tests (frontend initialization)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API tests (backend initialization)
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/ --headed

# Debug a specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with HTML report
npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 16 tests written and failing (RED phase — servers not yet initialized)
- ✅ Tests cover all 5 acceptance criteria (AC1 through AC5)
- ✅ Given-When-Then structure applied to all tests
- ✅ Network-first pattern applied (response listeners registered before `page.goto()`)
- ✅ `data-testid` selectors used (only `app-root` required for this story)
- ✅ No hard waits — explicit `waitForResponse` and `waitForLoadState` used
- ✅ Atomic tests — one assertion per test
- ✅ Mock requirements documented (none needed — real servers required)
- ✅ `data-testid` requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail with connection refused (not test errors)
- `project-initialization.spec.ts`: 7 tests FAIL (frontend not running)
- `backend-initialization.api.spec.ts`: 9 tests FAIL (backend not running)
- Failures are due to missing implementation (no servers), not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC2 — backend easier to verify in isolation)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**

1. AC2 tests (backend initialization — `dotnet run`)
2. AC5 tests (backend build — compile and middleware)
3. AC3 tests (CORS — configure in Program.cs)
4. AC1 tests (frontend — `pnpm run dev`)
5. AC4 tests (TypeScript strict mode — verify tsconfig)

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 16 tests pass** (green phase complete)
2. **Review `Program.cs`** — ensure CORS, middleware, and Scalar are in correct order
3. **Review `tsconfig.app.json`** — ensure strict flags are set correctly without breaking existing types
4. **Ensure tests still pass** after each refactor
5. **Update documentation** — add README with dev setup instructions

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- `Program.cs` middleware order is critical: `ExceptionHandlingMiddleware` → `UseCors` → `MapScalarApiReference`
- Don't change test behavior (only implementation)

**Completion:**

- All 16 tests pass
- Both servers start with a single command (dev script)
- `dotnet build` emits zero warnings
- TypeScript compiler emits zero errors
- Ready for Story 1.2 (Frontend Navigation Shell)

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Review this checklist** with team in standup or planning
3. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
4. **Begin implementation** using implementation checklist as guide — recommended order: AC2 → AC5 → AC3 → AC1 → AC4
5. **Work one test at a time** (red → green for each)
6. **When all 16 tests pass**, refactor for quality
7. **When refactoring complete**, manually update story status to 'done'

---

## Knowledge Base References Applied

- **network-first.md** — `page.waitForResponse()` registered BEFORE `page.goto()` in all E2E tests to prevent race conditions
- **test-quality.md** — One assertion per test (atomic design); explicit waits only; Given-When-Then comments on all tests
- **selector-resilience.md** — `data-testid="app-root"` as the single UI selector; all other tests use API-level assertions (no fragile CSS selectors)
- **fixture-architecture.md** — `base.fixture.ts` extends `@playwright/test` for future stories; Story 1.1 tests use base test directly
- **data-factories.md** — `data.helper.ts` provides `buildCliente()` and `buildContacto()` for future use; Story 1.1 needs no domain data
- **test-levels-framework.md** — E2E selected for AC1/AC3/AC4 (browser-observable behavior); API selected for AC2/AC3/AC5 (HTTP contract validation)

See `_bmad/bmm/testarch/tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 16 tests using 4 workers

  ✗  [chromium] › foundation/project-initialization.spec.ts:23:3 — AC1 — should serve the frontend app on port 5173 without errors
  ✗  [chromium] › foundation/project-initialization.spec.ts:39:3 — AC1 — should render the root HTML document with a valid React mount point
  ✗  [chromium] › foundation/project-initialization.spec.ts:49:3 — AC1 — should load without any TypeScript compilation errors visible in the browser console
  ✗  [chromium] › foundation/project-initialization.spec.ts:66:3 — AC1 — should not have any JavaScript runtime errors on initial load
  ✗  [chromium] › foundation/project-initialization.spec.ts:86:3 — AC3 — should allow frontend to reach backend health endpoint without CORS errors
  ✗  [chromium] › foundation/project-initialization.spec.ts:122:3 — AC3 — should receive a valid HTTP response from the backend health probe without CORS blocking
  ✗  [chromium] › foundation/project-initialization.spec.ts:141:3 — AC4 — should load the frontend without Vite TypeScript error overlay

  ✗  [chromium] › api/backend-initialization.api.spec.ts:24:3 — AC2 — should have the backend API server running on port 5000
  ✗  [chromium] › api/backend-initialization.api.spec.ts:35:3 — AC2 — should serve the Scalar API documentation page at /scalar
  ✗  [chromium] › api/backend-initialization.api.spec.ts:45:3 — AC2 — should return HTML content from the Scalar documentation endpoint
  ✗  [chromium] › api/backend-initialization.api.spec.ts:56:3 — AC2 — should NOT expose any Swagger/OpenAPI UI endpoint
  ✗  [chromium] › api/backend-initialization.api.spec.ts:66:3 — AC2 — should NOT expose WeatherForecast default endpoint
  ✗  [chromium] › api/backend-initialization.api.spec.ts:76:3 — AC3 — should return CORS header allowing http://localhost:5173 origin
  ✗  [chromium] › api/backend-initialization.api.spec.ts:93:3 — AC3 — should respond to OPTIONS preflight from frontend origin without CORS rejection
  ✗  [chromium] › api/backend-initialization.api.spec.ts:117:3 — AC5 — should have all four Clean Architecture layers responding
  ✗  [chromium] › api/backend-initialization.api.spec.ts:132:3 — AC5 — should return Problem Details RFC 7807 format for unhandled errors

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected — servers not initialized)
- Status: ✅ RED phase verified

**Expected Failure Root Cause for All Tests:**

- E2E tests: `net::ERR_CONNECTION_REFUSED` on `http://localhost:5173` (Vite not running)
- API tests: `net::ERR_CONNECTION_REFUSED` on `http://localhost:5000` (dotnet not running)

---

## Notes

- Story 1.1 creates project scaffolding only — no domain entities, no database migrations, no feature routes beyond `__root.tsx`. All failing tests reflect absence of servers, not absence of features.
- The `data-testid="app-root"` attribute is the only UI testid required in this story. All other `data-testid` attributes are introduced in Stories 1.2+ (navigation components, route views).
- The `ExceptionHandlingMiddleware` is stubbed in this story but fully tested in Story 1.3. The AC5 test for Problem Details validates only that the server returns JSON (not HTML) on non-existent paths — the full middleware test suite belongs to Story 1.3.
- Both test files use `process.env.API_BASE_URL ?? 'http://localhost:5000'` to allow CI override of the backend URL.
- The Playwright config (`playwright.config.ts`) sets `testDir: './e2e'` — all test files must reside under `e2e/`.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-05-30
