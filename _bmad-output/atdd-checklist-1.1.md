# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-22
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

Story 1.1 establishes the foundational development environment for the Siesa Agents CRM project. It initializes both the Vite React TypeScript frontend and the .NET 10 Clean Architecture backend, ensures both servers run correctly, configures CORS between them, and validates that all TypeScript strict-mode flags are active and the backend solution builds without errors.

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

### E2E Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED - Frontend project not yet initialized; HTTP 200 expected from `http://localhost:5173/`
  - **Verifies:** AC1 — Vite dev server starts and responds with HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED - `[data-testid="app-root"]` element not present until frontend is scaffolded
  - **Verifies:** AC1 — React app mounts and exposes app-root test anchor

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED - No frontend running; TypeScript errors would surface as console errors
  - **Verifies:** AC4 — Strict TypeScript compilation produces no browser console errors

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED - No frontend running; runtime errors expected until implementation
  - **Verifies:** AC1 — Application renders without runtime exceptions

### CORS E2E Tests (2 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (continued)

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED - CORS not configured; cross-origin fetch from frontend to backend is blocked
  - **Verifies:** AC3 — No CORS-related console errors when frontend requests backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED - Backend not running; connection refused expected
  - **Verifies:** AC3 — Backend responds to requests from frontend origin

### TypeScript E2E Tests (1 test)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (continued)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED - No frontend; `vite-error-overlay` detection would catch compile errors
  - **Verifies:** AC4 — Vite overlay does not appear when TypeScript strict flags are active

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED - Backend not initialized; connection refused at `http://localhost:5000/`
  - **Verifies:** AC2 — Backend server is running and reachable

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED - Backend not running and `app.MapScalarApiReference()` not yet called
  - **Verifies:** AC2 — Scalar docs endpoint returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED - Backend not running; no HTML response from `/scalar`
  - **Verifies:** AC2 — Scalar endpoint serves `text/html` content type

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED - Backend not running; when running it must return non-200 for `/swagger`
  - **Verifies:** AC2 — Architecture constraint: Swashbuckle/Swagger UI must not exist

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED - Default .NET webapi template endpoint must be removed
  - **Verifies:** AC2 — Default template boilerplate is cleaned up (404 or 405)

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED - CORS policy "DevCors" not yet configured in `Program.cs`
  - **Verifies:** AC3 — `Access-Control-Allow-Origin` header present for frontend origin

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED - CORS middleware not applied before endpoint mapping
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204 (not 403)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED - Solution not created; all four projects must build and wire via DI
  - **Verifies:** AC5 — Build success is proxied by server running (compile failure = no server)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED - `ExceptionHandlingMiddleware` not registered in `Program.cs`
  - **Verifies:** AC5 / Task 4 — Middleware returns `application/json` (Problem Details) for unknown routes

---

## Data Factories Created

No data factories are required for Story 1.1. This story validates infrastructure initialization, not domain data. All test data is inline or uses direct HTTP requests without domain entities.

---

## Fixtures Created

### Existing Base Fixture

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**
- `clientesPage` — Navigates to `/clientes` route before test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Pre-navigated page context
  - **Cleanup:** None required (stateless)
- `contactosPage` — Navigates to `/contactos` route before test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Pre-navigated page context
  - **Cleanup:** None required (stateless)

Note: Story 1.1 tests use the base `@playwright/test` imports directly (no custom fixture needed), since they test infrastructure-level concerns (server startup, CORS, TypeScript compilation).

---

## Mock Requirements

Story 1.1 does NOT use network mocks/stubs. Tests validate real server behavior:
- The backend must be running at `http://localhost:5000`
- The frontend must be running at `http://localhost:5173`
- CORS responses must come from the actual `Program.cs` configuration

No external services to mock for this story.

---

## Required data-testid Attributes

### App Root (index.html or App.tsx)

- `app-root` — Root React mount point element
  - Used by: `should render the root HTML document with a valid React mount point`
  - Implementation: Add `data-testid="app-root"` to the wrapping element in `src/main.tsx` or `App.tsx`

```tsx
// src/main.tsx or App.tsx
<div id="root" data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

No other `data-testid` attributes are needed for Story 1.1 (all other tests use API-level or browser-event-based assertions).

---

## Implementation Checklist

### AC1 — Frontend Vite Server Initialization

**Test files:** `e2e/tests/foundation/project-initialization.spec.ts` (AC1 describe block)

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to root element in `src/main.tsx`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "AC1"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### AC2 — Backend Server Initialization and Scalar Docs

**Test file:** `e2e/tests/api/backend-initialization.api.spec.ts` (AC2 describe block)

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure`
- [ ] Add project references (API → Application → Domain; API → Infrastructure → Domain)
- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure `Program.cs` with `app.MapScalarApiReference()` — NEVER `app.UseSwagger()`
- [ ] Remove default WeatherForecast endpoints and models
- [ ] Verify `dotnet run` starts on port 5000 and `/scalar` returns HTTP 200 with `text/html`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC2"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### AC3 — CORS Configuration

**Test files:** Both `project-initialization.spec.ts` (AC3) and `backend-initialization.api.spec.ts` (CORS tests)

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, register CORS policy:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Add `AllowedOrigins` array to `appsettings.Development.json`
- [ ] Verify preflight OPTIONS returns 200 or 204 with `Access-Control-Allow-Origin: http://localhost:5173`
- [ ] Run test: `npx playwright test --grep "AC3|CORS"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### AC4 — TypeScript Strict Mode

**Test file:** `e2e/tests/foundation/project-initialization.spec.ts` (AC4 describe block)

**Tasks to make these tests pass:**

- [ ] Ensure `tsconfig.app.json` contains:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true
    }
  }
  ```
- [ ] Fix any TypeScript errors introduced by strict flags (no `any` types allowed)
- [ ] Verify `pnpm run build` emits zero TypeScript errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "AC4"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### AC5 — Backend Solution Builds Successfully

**Test file:** `e2e/tests/api/backend-initialization.api.spec.ts` (AC5 describe block)

**Tasks to make these tests pass:**

- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add to solution: `dotnet sln add tests/SiesaAgents.UnitTests`
- [ ] Add project references: UnitTests → Application + Domain
- [ ] Add NuGet packages: FluentValidation to Application; Npgsql.EntityFrameworkCore.PostgreSQL to Infrastructure
- [ ] Create `ExceptionHandlingMiddleware.cs` in `src/SiesaAgents.API/Middleware/`
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all Story 1.1 failing tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only frontend initialization tests (AC1, AC3, AC4)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only backend API tests (AC2, AC5)
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with specific project (Chromium only)
npx playwright test e2e/tests/foundation/ --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) — Tests in Failing State

**TEA Agent Responsibilities:**

- [x] All acceptance criteria mapped to failing tests
- [x] E2E tests written for AC1, AC3, AC4 (frontend concerns)
- [x] API tests written for AC2, AC3, AC5 (backend concerns)
- [x] Network-first pattern applied in E2E tests (response listeners registered before navigation)
- [x] `data-testid="app-root"` requirement documented
- [x] No hard waits — explicit waits via `page.waitForResponse()` and `page.waitForLoadState()`
- [x] Implementation checklist created with concrete tasks per AC

**Expected RED Phase Behavior:**
- All E2E tests fail with `ERR_CONNECTION_REFUSED` (no frontend running)
- All API tests fail with connection error or timeout (no backend running)
- When servers are running but CORS is not configured: CORS tests fail with blocked requests
- When `data-testid="app-root"` is missing: React mount test fails with element not found

---

### GREEN Phase (DEV Team — Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist above (start with AC2 backend setup)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended Order:**
1. Backend (AC2) — Initialize .NET solution and verify Scalar loads
2. CORS (AC3) — Configure CORS policy in Program.cs
3. Backend build (AC5) — Add all layers, middleware, verify build
4. Frontend (AC1) — Initialize Vite project with React TypeScript
5. TypeScript strict (AC4) — Verify zero strict mode errors

---

### REFACTOR Phase (DEV Team — After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 16 tests pass (green phase complete)
2. Review `Program.cs` for Clean Architecture alignment
3. Ensure `src/shared/lib/apiClient.ts` and `src/shared/lib/queryClient.ts` are properly structured
4. Confirm no `any` types in TypeScript code
5. Ensure tests still pass after each refactor

---

## Next Steps

1. **Share this checklist** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
3. **Begin implementation** using implementation checklist as guide (start with AC2 backend)
4. **Work one test at a time** (red → green for each AC)
5. **When all tests pass**, refactor for quality and update story status

---

## Knowledge Base References Applied

- **network-first.md** — `page.waitForResponse()` registered before `page.goto()` to prevent race conditions
- **selector-resilience.md** — `data-testid="app-root"` selector required (data-testid > CSS class hierarchy)
- **test-quality.md** — One assertion per test (atomic), explicit waits only, no hard sleeps
- **test-levels-framework.md** — E2E for frontend browser behavior (AC1, AC4), API for backend contract validation (AC2, AC3, AC5)
- **fixture-architecture.md** — Base fixtures in `e2e/fixtures/base.fixture.ts` with auto-cleanup pattern
- **test-healing-patterns.md** — Console error listeners registered before navigation to capture all errors

---

**Generated by BMad TEA Agent** — 2026-06-22
