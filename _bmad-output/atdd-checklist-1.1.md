# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-24
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

Initializes the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects with all required dependencies so the team has a working development environment with both servers running. This story establishes the skeleton repository structure that all future stories will build upon.

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

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend app does not exist yet; server not running
  - **Verifies:** AC1 — Vite server responds with HTTP 200 on port 5173

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element not present in unimplemented frontend
  - **Verifies:** AC1 — React root element is mounted correctly

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — Frontend not initialized; TypeScript config not yet applied
  - **Verifies:** AC1/AC4 — No TS compilation errors in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — Frontend not initialized; runtime errors expected before implementation
  - **Verifies:** AC1 — Clean JavaScript runtime on initial load

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not running; CORS not configured
  - **Verifies:** AC3 — No CORS-related console errors when frontend fetches from backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend server not running on port 5000
  - **Verifies:** AC3 — Backend responds (200/301/302) to requests from frontend origin

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend not initialized; vite-error-overlay presence undetermined
  - **Verifies:** AC4 — Vite TypeScript error overlay is absent (strict mode compiles cleanly)

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not yet implemented; connection refused on port 5000
  - **Verifies:** AC2 — Backend server is up and accepting requests

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; `/scalar` endpoint does not exist
  - **Verifies:** AC2 — `app.MapScalarApiReference()` is registered in `Program.cs`

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; no HTML response available
  - **Verifies:** AC2 — Scalar endpoint returns `text/html` content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running; cannot verify absence of `/swagger`
  - **Verifies:** AC2 — Architecture constraint: Swashbuckle is explicitly forbidden

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; default template endpoint state unknown
  - **Verifies:** AC2 — Default `.NET webapi` template WeatherForecast endpoint is removed

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; `Access-Control-Allow-Origin` header absent
  - **Verifies:** AC3 — CORS policy "DevCors" is registered in `Program.cs`

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; OPTIONS preflight cannot be validated
  - **Verifies:** AC3 — CORS middleware handles preflight requests correctly

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend solution not built; server not running
  - **Verifies:** AC5 — All four projects compile and the server starts (proxy for build success)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; middleware not wired
  - **Verifies:** AC5 — `ExceptionHandlingMiddleware` is registered and returns JSON, not HTML

---

## Data Factories Created

No domain entities are created in Story 1.1 (skeleton story only). The existing `e2e/helpers/data.helper.ts` provides `buildCliente` and `buildContacto` factories for future stories.

No additional factories are needed for Story 1.1 acceptance criteria.

---

## Fixtures Created

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Pre-navigated page context
  - **Cleanup:** None required (page is reset between tests)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Pre-navigated page context
  - **Cleanup:** None required

Story 1.1 E2E tests use the base `@playwright/test` directly (no custom fixtures needed — tests navigate to root `/`).

---

## Mock Requirements

Story 1.1 tests validate real server behavior — no mocks are used. Tests connect to the actual running servers (frontend at `http://localhost:5173`, backend at `http://localhost:5000`). The CORS tests issue real HTTP requests to verify actual header presence.

**Environment variable:**
- `API_BASE_URL` — Defaults to `http://localhost:5000`. Set in CI to override.

---

## Required data-testid Attributes

### Frontend Root (`index.html` or `App.tsx`)

- `app-root` — The React application root container element

**Implementation Example:**
```tsx
// In src/main.tsx or index.html
<div id="root" data-testid="app-root">...</div>
// OR in App.tsx:
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Test: AC1 — Frontend Vite server initialization (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to the root container in `src/main.tsx` or `index.html`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] Run tests: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ All 4 AC1/AC4 tests pass (green phase)

**Estimated Effort:** 3–4 hours

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
- [ ] Configure `Program.cs` with `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Remove default WeatherForecast endpoints and models from the generated API project
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Verify Scalar page loads at `http://localhost:5000/scalar` after `dotnet run`
- [ ] Run tests: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts -g "AC2"`
- [ ] ✅ All 5 AC2 tests pass (green phase)

**Estimated Effort:** 2–3 hours

---

### Test: AC3 — CORS configuration (4 tests: 2 E2E + 2 API)

**Files:**
- `e2e/tests/foundation/project-initialization.spec.ts` (2 CORS tests)
- `e2e/tests/api/backend-initialization.api.spec.ts` (2 CORS tests)

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, register CORS policy: `builder.Services.AddCors(options => options.AddPolicy("DevCors", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()))`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Add `AllowedOrigins` to `appsettings.Development.json`: `["http://localhost:5173"]`
- [ ] Verify: CORS headers present in `/scalar` response with `Origin: http://localhost:5173`
- [ ] Verify: OPTIONS preflight returns 200 or 204
- [ ] Run tests: `pnpm exec playwright test --grep "AC3|CORS"`
- [ ] ✅ All 4 CORS tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — TypeScript strict mode active (1 test)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `tsconfig.app.json` contains `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Fix any TypeScript errors that surface after enabling strict mode
- [ ] Verify `vite-error-overlay` is not rendered in the browser on `page.goto('/')`
- [ ] Run test: `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts -g "AC4"`
- [ ] ✅ TypeScript strict mode test passes (green phase)

**Estimated Effort:** 0.5 hours (covered by AC1 implementation)

---

### Test: AC5 — Backend solution builds successfully (2 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Confirm `dotnet build SiesaAgents.sln` exits with code 0, zero errors
- [ ] Create `src/SiesaAgents.UnitTests` project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add UnitTests project to solution and add references to Application + Domain
- [ ] Create `ExceptionHandlingMiddleware.cs` in `src/SiesaAgents.API/Middleware/` with Problem Details RFC 7807 format
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify unhandled endpoint returns JSON (not HTML), status 404
- [ ] Run tests: `pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts -g "AC5"`
- [ ] ✅ All 2 AC5 tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all Story 1.1 failing tests
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E tests only (AC1, AC3, AC4)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run API tests only (AC2, AC3, AC5)
pnpm exec playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run all story 1.1 tests in headed mode (see browser)
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with specific browser
pnpm exec playwright test e2e/tests/foundation/ --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 16 tests written and failing (implementation does not exist yet)
- Network-first intercept pattern applied in E2E tests (response waiters registered before navigation)
- `data-testid="app-root"` requirement documented
- Mock requirements documented (none needed — tests validate real servers)
- Implementation checklist created with clear tasks per AC

**Verification:**

- All tests fail due to missing implementation (servers not running), not test bugs
- Failure messages: `net::ERR_CONNECTION_REFUSED` for server-down scenarios
- E2E tests will additionally fail with `expect(locator).toBeVisible()` when `app-root` is absent

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from implementation checklist (start with AC2 — backend is prerequisite for CORS tests)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in implementation checklist
6. Move to next test and repeat

**Recommended order:**
1. AC2 tests (backend initialization) — foundational
2. AC5 tests (build success + middleware) — part of AC2 work
3. AC3 API tests (CORS headers) — backend CORS config
4. AC1 tests (frontend initialization) — independent of backend
5. AC4 test (TypeScript overlay) — covered by AC1 work
6. AC3 E2E tests (CORS via browser) — requires both servers

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review `Program.cs` for clarity and correct middleware ordering
3. Ensure `tsconfig.app.json` options are not duplicated across config files
4. Ensure all four CA projects have correct project references (no circular deps)
5. Ensure tests still pass after each refactor

**Completion:**

- All 16 tests pass
- Code quality meets team standards (no hardcoded values, no WeatherForecast artifacts)
- Ready for code review and story approval

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `pnpm exec playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
3. Begin implementation using implementation checklist as guide (recommended order: AC2 → AC5 → AC3-API → AC1 → AC4 → AC3-E2E)
4. Work one test at a time (red → green for each)
5. When all 16 tests pass, refactor code for quality
6. When refactoring complete, manually update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Response waiters registered before `page.goto()` in all E2E tests to prevent race conditions
- **test-quality.md** — One assertion per test (atomic design); no hardcoded sleep/wait calls
- **selector-resilience.md** — `data-testid` selectors used exclusively; no CSS class selectors
- **fixture-architecture.md** — Base fixture in `e2e/fixtures/base.fixture.ts` with auto-cleanup pattern
- **test-levels-framework.md** — API tests for AC2/AC3/AC5 (server contracts); E2E for AC1/AC3/AC4 (user-facing + browser behavior)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `pnpm exec playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (before implementation):**

```
Error: connect ECONNREFUSED 127.0.0.1:5000
  → All API tests fail (backend not running)

Error: connect ECONNREFUSED 127.0.0.1:5173
  → All E2E tests fail (frontend not running)
  OR (if webServer is started by playwright but app not initialized):
Error: expect(locator).toBeVisible()
  Locator: [data-testid="app-root"]
  Expected: visible / Received: <element not found>
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: RED phase — tests define behavior, not yet implemented

**Expected Failure Messages:**

- AC1/AC4 E2E tests: `net::ERR_CONNECTION_REFUSED` on port 5173 OR `expect(locator).toBeVisible()` for `[data-testid="app-root"]`
- AC2/AC3/AC5 API tests: `net::ERR_CONNECTION_REFUSED` on port 5000
- AC3 E2E tests: CORS tests will fail if backend isn't reachable

---

## Notes

- This story creates skeleton structure only — no domain entities, no database migrations, no routes beyond `__root.tsx`
- AC5 (dotnet build success) is tested indirectly via runtime: if the backend server responds, the build succeeded
- The `ExceptionHandlingMiddleware` is created as a stub in this story — full exception path testing is in Story 1.3
- `data-testid="app-root"` must be added to the implementation for the React mount point test to pass
- Backend tests use `API_BASE_URL` environment variable (defaults to `http://localhost:5000`) to support CI overrides
- `playwright.config.ts` is already configured at project root with `testDir: './e2e'` and `baseURL: 'http://localhost:5173'`

---

**Generated by BMad TEA Agent** — 2026-06-24
