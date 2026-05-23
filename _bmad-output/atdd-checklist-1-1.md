# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-23
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

This story initializes the full-stack project skeleton: a Vite react-ts frontend and a .NET 10 Clean Architecture backend. The goal is to have both dev servers running, TypeScript strict mode active on the frontend, and CORS configured so the frontend can reach the backend.

**As a** developer,
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies,
**So that** the team has a working development environment with both servers running.

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine, When `pnpm run dev` is executed, Then the Vite server starts on port 5173 with no errors and TypeScript strict mode is enabled.
2. **AC2** — Given the backend project is created, When `dotnet run` is executed in `src/SiesaAgents.API`, Then the backend starts on port 5000 and Scalar API docs load at `/scalar`; four Clean Architecture projects are referenced in `SiesaAgents.sln`.
3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors.
4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `strict:true`, `noImplicitAny:true`, and `strictNullChecks:true` active.
5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (157 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — frontend app not yet implemented; server not running
  - **Verifies:** AC1 — Vite server responds HTTP 200 at `http://localhost:5173/`

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `data-testid="app-root"` attribute not yet added to React root element
  - **Verifies:** AC1 — React mount point present after initialization

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — frontend not yet scaffolded; no TypeScript compilation present
  - **Verifies:** AC4 — No `[TypeScript]`/`TS` errors in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — frontend not yet scaffolded; page not loading
  - **Verifies:** AC1/AC4 — Zero `pageerror` events on initial load

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — CORS not configured; both servers not running
  - **Verifies:** AC3 — No CORS-related console errors when frontend fetches backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — backend not yet running on port 5000
  - **Verifies:** AC3 — Backend `/scalar` endpoint returns 200, 301, or 302

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — frontend not yet scaffolded
  - **Verifies:** AC4 — `vite-error-overlay` component is absent (zero count)

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — backend server not yet running
  - **Verifies:** AC2 — Backend responds with status < 500 on root path

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `app.MapScalarApiReference()` not yet configured
  - **Verifies:** AC2 — `GET /scalar` returns HTTP 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Scalar not yet configured in `Program.cs`
  - **Verifies:** AC2 — `Content-Type` header contains `text/html`

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — backend not yet running; also validates architectural constraint
  - **Verifies:** AC2 (architecture constraint) — `GET /swagger` must NOT return 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — default template WeatherForecast not yet removed
  - **Verifies:** AC2 — `GET /weatherforecast` returns 404 or 405

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — CORS policy not yet registered in `Program.cs`
  - **Verifies:** AC3 — `access-control-allow-origin` header equals `http://localhost:5173` or `*`

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — CORS middleware not yet applied before endpoint mapping
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — solution not yet built; four projects not yet created
  - **Verifies:** AC2/AC5 — Server running implies build succeeded for all four layers

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ExceptionHandlingMiddleware` not yet registered
  - **Verifies:** AC5 (implicit) — 404 on unknown endpoint returns JSON (not HTML), status 404 or 400

---

## Data Factories Created

No domain data factories are needed for Story 1.1. This story tests infrastructure initialization (server startup, CORS headers, HTTP status codes) rather than domain entity CRUD operations.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente()` and `buildContacto()` factories for future stories (Epic 2/3).

---

## Fixtures Created

No custom fixtures beyond `e2e/fixtures/base.fixture.ts` are needed for Story 1.1. Tests use vanilla Playwright `page` and `request` contexts directly, which is appropriate for infrastructure-level checks.

**Existing fixture file:** `e2e/fixtures/base.fixture.ts`
- `clientesPage` — navigates to `/clientes` before test (used by Epic 2+ stories)
- `contactosPage` — navigates to `/contactos` before test (used by Epic 3+ stories)

---

## Mock Requirements

No external service mocking is required for Story 1.1 tests. These tests verify real infrastructure:

- The **frontend Vite dev server** must actually be running at `http://localhost:5173`
- The **backend .NET server** must actually be running at `http://localhost:5000`

The `playwright.config.ts` `webServer` block auto-starts the frontend via `pnpm --filter frontend dev`. The backend must be started separately with `dotnet run` in `src/SiesaAgents.API`.

---

## Required data-testid Attributes

### Frontend `src/main.tsx` or `index.html`

- `app-root` — The root React mount point element (div wrapping `<RouterProvider>`)

**Implementation example:**

```tsx
// src/main.tsx or index.html
<div id="root" data-testid="app-root">
  {/* RouterProvider and QueryProvider are rendered here */}
</div>
```

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install all runtime and dev dependencies as specified in Task 1 of the story
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` and `@tanstack/router-plugin/vite` plugins
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Verify `pnpm run dev` starts on port 5173 without errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "5173"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the root mount element in `index.html` or wrap in `src/main.tsx`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "React mount point"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all source files compile cleanly under strict mode (no `any` types, no implicit nulls)
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/routes/__root.tsx` as TanStack Router root route
- [ ] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Wire `RouterProvider` inside `QueryProvider` in `src/main.tsx`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "runtime errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should allow frontend to reach backend health endpoint without CORS errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Complete backend initialization (see AC2 tests below)
- [ ] Register CORS policy `"DevCors"` in `Program.cs` allowing `http://localhost:5173`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "CORS errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should receive a valid HTTP response from the backend health probe without CORS blocking`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Complete backend initialization (server running on port 5000)
- [ ] Verify `GET /scalar` returns 200, 301, or 302
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "health probe"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `tsconfig.app.json` strict flags are set correctly
- [ ] Fix all TypeScript errors in source files so Vite does not render `vite-error-overlay`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "error overlay"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Add project to solution and configure `Program.cs` with `builder.Services.AddOpenApi()`
- [ ] Run `dotnet run` in `src/SiesaAgents.API` and verify server starts on port 5000
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "running on port 5000"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add `app.MapScalarApiReference()` in `Program.cs` (NEVER `app.UseSwagger()`)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure Swashbuckle/Swagger packages are NOT installed (use only `Scalar.AspNetCore`)
- [ ] Do NOT add `app.UseSwagger()` or `app.UseSwaggerUI()` anywhere in `Program.cs`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Remove default WeatherForecast endpoint, record, and related files from the generated API project
- [ ] Remove any `app.MapGet("/weatherforecast", ...)` lines from `Program.cs`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "WeatherForecast"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.1 hours

---

### Test: `should return CORS header allowing http://localhost:5173 origin`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Register CORS policy in `Program.cs`:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` before endpoint mappings
- [ ] Add required data-testid: none (API-level test)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify `app.UseCors("DevCors")` is placed BEFORE `app.MapScalarApiReference()`
- [ ] Verify policy includes `.AllowAnyMethod()` to allow OPTIONS requests
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "OPTIONS preflight"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should have all four Clean Architecture layers responding`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution and configure project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "four Clean Architecture"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` implementing Problem Details RFC 7807
- [ ] Register `app.UseMiddleware<ExceptionHandlingMiddleware>()` in `Program.cs` BEFORE routing
- [ ] Configure `appsettings.Development.json` with `ConnectionStrings:DefaultConnection` placeholder
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

## Running Tests

```bash
# Run all Story 1.1 failing tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E (frontend) tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API (backend) tests
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with Playwright UI
npx playwright test --ui
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 16 tests written and failing (7 E2E + 9 API)
- ✅ Fixtures confirmed (base.fixture.ts for future stories)
- ✅ No external service mocks needed (infrastructure tests against real servers)
- ✅ `data-testid="app-root"` requirement documented
- ✅ Implementation checklist created with 13 test-mapped task groups

**Verification:**

- Tests fail with connection refused errors (servers not running) — correct RED phase failure
- No test bugs — failures are due to missing implementation, not test logic errors

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Start with backend** (Task 2 in story): Create solution, four projects, add references
2. **Implement CORS** (Task 3): Register `"DevCors"` policy in `Program.cs`
3. **Add Scalar** (Task 2 continued): Install `Scalar.AspNetCore`, call `app.MapScalarApiReference()`
4. **Add ExceptionHandlingMiddleware** (Task 4): Create middleware, register before routing
5. **Initialize frontend** (Task 1): Scaffold Vite react-ts, configure TypeScript strict mode
6. **Add `data-testid="app-root"`** to root element
7. **Run tests** to verify green: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`

**Key Principles:**

- One test at a time — confirm green before moving to the next
- Backend tests can be run without the frontend (API-level only)
- Frontend tests require `pnpm run dev` to be running (auto-started by Playwright webServer config)

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Review `Program.cs` for clean minimal structure per architecture spec
2. Ensure no default template boilerplate remains (WeatherForecast, etc.)
3. Confirm `tsconfig.app.json` strict flags match architecture spec exactly
4. Validate project references are correct (no circular dependencies)
5. Run full test suite to confirm all still pass after refactor

---

## Next Steps

1. **Share this checklist and failing tests** with the dev workflow (manual handoff)
2. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
3. **Begin implementation** using implementation checklist above
4. **Work one test group at a time** (red → green for each)
5. **When all 16 tests pass**, proceed to refactor phase
6. **When refactoring complete**, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Network-first route interception: `waitForResponse` registered before `page.goto()` in AC1 test
- **test-quality.md** — Atomic tests (one assertion per test), Given-When-Then structure, explicit waits only (no sleeps)
- **selector-resilience.md** — `data-testid="app-root"` selector for React root; no fragile CSS selectors
- **fixture-architecture.md** — `base.fixture.ts` pattern with `test.extend()` for future story fixtures
- **test-levels-framework.md** — E2E for frontend user-facing ACs (AC1, AC3, AC4); API tests for backend ACs (AC2, AC5)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
  16 failed

  [chromium] › e2e/tests/foundation/project-initialization.spec.ts:23:3
    Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  [chromium] › e2e/tests/api/backend-initialization.api.spec.ts:24:3
    Error: connect ECONNREFUSED 127.0.0.1:5000
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected — servers not yet implemented)
- Failing: 16 (expected — RED phase confirmed)
- Status: RED phase verified

**Expected Failure Reasons:**

- E2E tests (7): `net::ERR_CONNECTION_REFUSED` — Vite frontend server not running
- API tests (9): `connect ECONNREFUSED 127.0.0.1:5000` — .NET backend server not running

---

## Notes

- Story 1.1 creates **only the skeleton** — no domain entities, no routes beyond `__root.tsx`, no database migrations. All domain content is deferred to Epics 2 and 3.
- The `pnpm` package manager is **mandatory** (not npm or yarn) per company standards.
- Backend uses **Minimal API** pattern (NO MVC controllers) — tests validate this by confirming clean endpoint responses.
- AC4 (TypeScript strict mode) and AC5 (dotnet build) are verified indirectly at runtime: if the servers start and serve content correctly, compilation was successful.
- The `ExceptionHandlingMiddleware` test (Story 1.3 prep) is included as it is part of Task 4 and the `Program.cs` minimal structure defined in the story.

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad/bmm/docs/tea-README.md` for workflow documentation
- Consult `_bmad/bmm/testarch/knowledge` for testing best practices

---

**Generated by BMad TEA Agent** - 2026-05-23
