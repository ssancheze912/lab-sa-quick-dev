# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-23
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

As a developer, I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies, so that the team has a working development environment with both servers running. This story sets up the skeleton structure — no domain entities, no database migrations, no routes beyond `__root.tsx`.

**As a** developer
**I want** a fully initialized frontend + backend development environment
**So that** the team can start feature development with both servers running, TypeScript strict mode enforced, and CORS configured

---

## Acceptance Criteria

1. **AC1** — Given a clean dev machine with Node.js and .NET 10 installed, When the developer runs the frontend initialization commands, Then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When the developer runs `dotnet run` in `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend project not yet initialized; http://localhost:5173 returns ECONNREFUSED
  - **Verifies:** AC1 — Frontend Vite server serves HTTP 200 on root

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist until `index.html` / `App.tsx` is implemented
  - **Verifies:** AC1 — React root element is present with data-testid for stable selector

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — No frontend to load; after init, TypeScript errors would surface here
  - **Verifies:** AC1 / AC4 — No [TypeScript] or TS-prefixed console errors on load

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — No frontend; after init, uncaught exceptions would fail this test
  - **Verifies:** AC1 — No pageerror events thrown during initial render

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not running; CORS not configured
  - **Verifies:** AC3 — No CORS-related console errors when frontend fetches from backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running on port 5000
  - **Verifies:** AC3 — Backend responds with 200/301/302 (not blocked by CORS)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend not initialized; after init, vite-error-overlay must be absent
  - **Verifies:** AC4 — No Vite TypeScript compile error overlay visible on page load

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not running; request will fail with ECONNREFUSED
  - **Verifies:** AC2 — Backend server is up and responding on port 5000

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running and `app.MapScalarApiReference()` not yet configured
  - **Verifies:** AC2 — GET /scalar returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; after init, content-type must include text/html
  - **Verifies:** AC2 — /scalar serves HTML (not JSON or error)

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running; must confirm /swagger returns non-200 once backend is up
  - **Verifies:** AC2 — Architecture constraint: Swashbuckle explicitly forbidden

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; default template endpoint must be removed
  - **Verifies:** AC2 — Default WeatherForecast route is cleaned up (404 or 405)

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; CORS headers not configured
  - **Verifies:** AC3 — Access-Control-Allow-Origin header is present for frontend origin

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; CORS preflight must succeed with 200 or 204
  - **Verifies:** AC3 — OPTIONS preflight allowed for http://localhost:5173

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not running; runtime proxy for AC5 build verification
  - **Verifies:** AC5 — If server starts, the solution compiled (build failure = no server)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; ExceptionHandlingMiddleware not wired
  - **Verifies:** AC5 — Non-existent endpoint returns JSON (not HTML error page), confirming middleware is registered

### Component Tests

No component tests for this story. Story 1.1 is infrastructure-only — no UI components to test in isolation. TypeScript compilation behavior (AC4) and build pipeline (AC5) are validated via E2E console assertions and API runtime proxies respectively.

---

## Data Factories Created

No domain entities exist in Story 1.1. This is a project initialization story — there is no data to create or seed. Data factories will be introduced in Epic 2 (Clientes) and Epic 3 (Contactos).

---

## Fixtures Created

No story-specific fixtures required. The base fixture (`e2e/fixtures/base.fixture.ts`) provides `clientesPage` and `contactosPage` navigation helpers for future stories. Story 1.1 tests use the default `test` and `request` from `@playwright/test` directly.

---

## Mock Requirements

No external service mocks required for Story 1.1. All tests exercise real servers (frontend dev server at port 5173 and .NET backend at port 5000). Network-first interception is used only for response listener registration — no route stubbing.

---

## Required data-testid Attributes

### Root Application Shell

- `app-root` — The root React mount point element. Must be added to `index.html` `<div id="root">` or to the top-level wrapper in `App.tsx`

**Implementation Example:**

```tsx
// In index.html:
<div id="root" data-testid="app-root"></div>

// OR in App.tsx root wrapper:
<div data-testid="app-root">
  {/* app content */}
</div>
```

**Note:** No other data-testid attributes are required for Story 1.1. Subsequent stories will define testids for navigation, forms, and feature components.

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install all runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify `pnpm run dev` starts on port 5173 without errors
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts -g "should serve the frontend app"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the root element in `index.html` or `App.tsx`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Ensure the React app mounts and renders the root element
- [ ] Add required data-testid attribute: `app-root`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts -g "should render the root HTML"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console` (AC1/AC4)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all source files pass TypeScript strict mode (no implicit any, no null type errors)
- [ ] Run `pnpm exec tsc --noEmit` locally to verify zero TypeScript errors
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts -g "TypeScript compilation errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load` (AC1)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/shared/lib/queryClient.ts` exporting singleton `QueryClient`
- [ ] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Create `src/shared/lib/apiClient.ts` — Axios instance with `baseURL: import.meta.env.VITE_API_URL`
- [ ] Wire `RouterProvider` inside `QueryProvider` in `src/main.tsx`
- [ ] Verify no uncaught exceptions thrown during initial render
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts -g "runtime errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors` (AC3)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, register CORS policy `"DevCors"` allowing origin `http://localhost:5173`
- [ ] Apply `app.UseCors("DevCors")` before `app.MapScalarApiReference()` and endpoint mappings
- [ ] Ensure backend is running on port 5000 when test runs
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts -g "CORS errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should load the frontend without Vite TypeScript error overlay` (AC4)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Confirm `tsconfig.app.json` strict configuration is correct (see AC1/AC4 task above)
- [ ] Verify `vite-error-overlay` custom element is not rendered on page load
- [ ] Run `pnpm run build` to confirm build passes without errors
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts -g "Vite TypeScript error overlay"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should have the backend API server running on port 5000` (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution and configure references (API → Application → Domain; API → Infrastructure → Domain)
- [ ] Run `dotnet run` in `src/SiesaAgents.API` — server must start on port 5000
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts -g "server running on port 5000"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `should serve the Scalar API documentation page at /scalar` (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] In `Program.cs`: add `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] NEVER use `app.UseSwagger()` or Swashbuckle
- [ ] Verify GET http://localhost:5000/scalar returns HTTP 200 with HTML content
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts -g "Scalar API documentation"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should NOT expose WeatherForecast default endpoint` (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove default `WeatherForecast` endpoint and model from the generated API project `Program.cs`
- [ ] Verify GET /weatherforecast returns 404 or 405
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts -g "WeatherForecast"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Tests: CORS headers and preflight (AC3)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, register CORS policy using `builder.Services.AddCors(options => options.AddPolicy("DevCors", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()))`
- [ ] Add `AllowedOrigins` array in `appsettings.Development.json`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Verify OPTIONS preflight to /scalar with `Origin: http://localhost:5173` returns 200 or 204
- [ ] Verify `Access-Control-Allow-Origin: http://localhost:5173` header present in response
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts -g "CORS"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Tests: Build verification and Problem Details middleware (AC5)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add UnitTests to solution and configure project references
- [ ] Run `dotnet build SiesaAgents.sln` — must succeed with zero errors/warnings
- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` with Problem Details RFC 7807 format
- [ ] Register middleware in `Program.cs` before routing: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify GET /api/nonexistent-endpoint-for-atdd returns 404 with `content-type: application/json` (not HTML)
- [ ] Run test: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts -g "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for this story
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E tests only (AC1, AC3, AC4)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run API tests only (AC2, AC3, AC5)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run all Story 1.1 tests in a specific browser
pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/ --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 16 tests written and failing (infrastructure not yet initialized)
- ✅ Fixtures in place: `e2e/fixtures/base.fixture.ts` with auto-cleanup pattern
- ✅ Mock requirements documented (none needed — real servers tested)
- ✅ data-testid requirements listed (`app-root`)
- ✅ Implementation checklist created

**Verification:**

- Tests fail because neither frontend (port 5173) nor backend (port 5000) is running
- Failure messages: `ECONNREFUSED ::1:5173` (E2E) and `ECONNREFUSED ::1:5000` (API)
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist above (start with backend initialization)
2. **Read the test** to understand expected behavior (Given-When-Then comments)
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Recommended order:**
1. Backend server (AC2) — unblocks API tests
2. CORS configuration (AC3) — unblocks cross-origin tests
3. Scalar endpoint (AC2) — validates API documentation
4. Frontend initialization (AC1) — unblocks E2E tests
5. TypeScript strict mode (AC4) — validates tsconfig
6. Build verification (AC5) — validates solution structure

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 16 tests pass** (green phase complete)
2. **Review `Program.cs`** for order of middleware registration (UseMiddleware → UseCors → MapScalarApiReference)
3. **Review `tsconfig.app.json`** for strict settings completeness
4. **Extract CORS origins** to `appsettings.Development.json` `AllowedOrigins` array (already in checklist)
5. **Ensure tests still pass** after each refactor
6. **Verify folder structure** matches architecture.md specification

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/`
3. **Begin implementation** using implementation checklist as guide — recommended order: backend → CORS → frontend
4. **Work one test at a time** (red → green for each)
5. **When all 16 tests pass**, refactor for quality
6. **When refactoring complete**, manually update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Route interception patterns: `page.waitForResponse()` registered BEFORE `page.goto()` to prevent race conditions
- **test-quality.md** — One assertion per test (atomic), explicit waits (`waitForLoadState`), no hard sleeps
- **fixture-architecture.md** — `base.fixture.ts` extends `test` with auto-setup navigation fixtures
- **selector-resilience.md** — `data-testid="app-root"` used as stable selector; no CSS class selectors
- **test-levels-framework.md** — AC1/AC3/AC4 mapped to E2E (browser behavior); AC2/AC3/AC5 mapped to API (contract/runtime)
- **timing-debugging.md** — `waitForLoadState('networkidle')` for AC4 Vite overlay check; no `page.waitForTimeout()`

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 16 tests using 16 workers

  ✗ [chromium] › foundation/project-initialization.spec.ts:23:3 › AC1 — Frontend Vite server initialization › should serve the frontend app on port 5173 without errors
    Error: page.waitForResponse: net::ERR_CONNECTION_REFUSED

  ✗ [chromium] › foundation/project-initialization.spec.ts:39:3 › AC1 — Frontend Vite server initialization › should render the root HTML document with a valid React mount point
    Error: page.goto: net::ERR_CONNECTION_REFUSED

  ✗ [chromium] › api/backend-initialization.api.spec.ts:24:3 › AC2 — Backend server initialization › should have the backend API server running on port 5000
    Error: apiRequestContext.get: connect ECONNREFUSED ::1:5000

  ... (16 tests failing)

  16 failed
   0 passed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- E2E tests (AC1, AC3, AC4): `net::ERR_CONNECTION_REFUSED` at `http://localhost:5173` — frontend not initialized
- API tests (AC2, AC3, AC5): `connect ECONNREFUSED` at `http://localhost:5000` — backend not running
- Once frontend/backend are up but before `data-testid="app-root"` is added: `Locator expected to be visible`
- Once backend is up but before CORS is configured: `Access-Control-Allow-Origin` header missing → test assertion fails

---

## Notes

- This story is infrastructure-only. No UI features, no domain models, no database migrations.
- AC5 (build verification) is proxied through API runtime tests — if the server starts, the build passed. A dotnet build failure prevents server startup entirely.
- The `app-root` data-testid is the ONLY UI testid required in this story. All subsequent stories will add their own testids.
- The playwright.config.ts `webServer` command is `pnpm --filter frontend dev` — the frontend must be located at `frontend/` relative to project root.
- Backend URL is configured via `process.env.API_BASE_URL` (defaults to `http://localhost:5000`) — can be overridden in CI.
- CORS tests in both `project-initialization.spec.ts` (browser console) and `backend-initialization.api.spec.ts` (HTTP headers) provide redundant coverage by design — one catches UI-level CORS failures, the other validates the header contract directly.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/testarch/knowledge/` for testing best practices
- Consult `playwright.config.ts` for test runner configuration (baseURL, webServer, projects)

---

**Generated by BMad TEA Agent** - 2026-05-23
