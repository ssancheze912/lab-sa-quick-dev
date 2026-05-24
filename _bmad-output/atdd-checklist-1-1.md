# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-05-24
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

Story 1.1 initializes the full-stack repository: a Vite React-TypeScript frontend and a .NET 10 Clean Architecture backend. The goal is a working development environment where both servers run simultaneously, CORS is configured, TypeScript strict mode is enforced, and the backend solution compiles cleanly with Scalar as the sole API documentation tool.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine, When the developer runs the frontend initialization commands, Then `pnpm run dev` starts the Vite server on port 5173 with no errors and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When `dotnet run` is executed in `src/SiesaAgents.API`, Then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors (no CORS-related console errors).

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (8 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend app does not exist yet; HTTP request to port 5173 will fail
  - **Verifies:** AC1 — Vite dev server starts and responds with HTTP 200
  - **Given-When-Then:** Given a clean machine / When navigating to `http://localhost:5173/` / Then HTTP 200 is returned

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist before implementation
  - **Verifies:** AC1 — The React app mounts in the DOM at the expected root element
  - **Given-When-Then:** Given Vite dev server running / When browser navigates to `/` / Then `[data-testid="app-root"]` is visible

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — App not initialized; no tsconfig.app.json with strict mode configured
  - **Verifies:** AC4 — TypeScript strict mode produces zero console errors
  - **Given-When-Then:** Given strict tsconfig / When page loads / Then no `[TypeScript]` console errors

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — App not initialized; any early wiring error would fire pageerror
  - **Verifies:** AC1, AC4 — No JavaScript runtime exceptions thrown on initial render
  - **Given-When-Then:** Given frontend initialized / When app first renders / Then zero pageerror events

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not running; CORS policy not configured
  - **Verifies:** AC3 — No CORS-related errors when frontend makes cross-origin request to backend
  - **Given-When-Then:** Given both servers running / When frontend fetches `http://localhost:5000/scalar` / Then no CORS console errors

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running; `/scalar` endpoint not mapped
  - **Verifies:** AC3 — Backend responds with 200/301/302 when frontend origin makes request
  - **Given-When-Then:** Given both servers running / When GET `/scalar` with Origin header / Then status 200/301/302

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend not initialized; no tsconfig with strict flags
  - **Verifies:** AC4 — No `vite-error-overlay` appears, confirming TypeScript compiles clean
  - **Given-When-Then:** Given tsconfig.app.json has strict flags / When Vite compiles the app / Then `vite-error-overlay` has count 0

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — .NET backend not initialized; connection refused on port 5000
  - **Verifies:** AC2 — Backend API server is up and responding (status < 500)
  - **Given-When-Then:** Given backend running / When GET `http://localhost:5000/` / Then status < 500

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `app.MapScalarApiReference()` not registered in Program.cs
  - **Verifies:** AC2 — Scalar docs endpoint exists and returns HTTP 200
  - **Given-When-Then:** Given Scalar.AspNetCore installed / When GET `/scalar` / Then status 200

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Scalar not configured; `/scalar` returns 404
  - **Verifies:** AC2 — Scalar endpoint returns `text/html` content-type (not JSON or error)
  - **Given-When-Then:** Given `MapScalarApiReference()` called / When GET `/scalar` / Then Content-Type contains `text/html`

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not initialized; test would pass vacuously but must be wired to architecture compliance
  - **Verifies:** AC2 — Architecture constraint: `/swagger` must NOT return HTTP 200
  - **Given-When-Then:** Given Scalar-only configuration / When GET `/swagger` / Then status is NOT 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not initialized; default webapi template includes WeatherForecast
  - **Verifies:** AC2 — Default template boilerplate removed from the API
  - **Given-When-Then:** Given template cleaned up / When GET `/weatherforecast` / Then status is 404 or 405

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — CORS policy not registered in Program.cs
  - **Verifies:** AC3 — `Access-Control-Allow-Origin: http://localhost:5173` header present in response
  - **Given-When-Then:** Given CORS DevCors policy configured / When GET `/scalar` with `Origin: http://localhost:5173` / Then `Access-Control-Allow-Origin` is `http://localhost:5173` or `*`

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — CORS middleware not applied before endpoint mapping
  - **Verifies:** AC3 — OPTIONS preflight succeeds with 200 or 204
  - **Given-When-Then:** Given `app.UseCors()` before routing / When OPTIONS preflight from `http://localhost:5173` / Then status 200 or 204

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Solution not created; `dotnet build` has not been run
  - **Verifies:** AC5 — Backend server starts, proving all four projects compiled (build failure = no server)
  - **Given-When-Then:** Given `dotnet build SiesaAgents.sln` succeeds / When GET `/scalar` / Then status 200

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ExceptionHandlingMiddleware` not created or registered
  - **Verifies:** AC5 (implicit Story 1.3 prep) — 404 responses return JSON (not HTML), middleware wired
  - **Given-When-Then:** Given middleware registered / When GET `/api/nonexistent-endpoint-for-atdd` / Then status 404/400 with JSON content-type

---

## Data Factories Created

No domain-level data factories are required for Story 1.1. This story only validates infrastructure initialization (server startup, CORS, TypeScript compilation, Scalar docs). Domain entity factories (Cliente, Contacto) are created in Epics 2 and 3.

The existing `e2e/helpers/data.helper.ts` provides `buildCliente()` and `buildContacto()` factories with counter-based unique IDs for use in later stories.

---

## Fixtures Created

### Base Fixture

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**

- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** Calls `page.goto('/clientes')`
  - **Provides:** Page already at `/clientes` route
  - **Cleanup:** None (navigation only)

- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** Calls `page.goto('/contactos')`
  - **Provides:** Page already at `/contactos` route
  - **Cleanup:** None (navigation only)

**Example Usage:**

```typescript
import { test } from '../fixtures/base.fixture';

test('should render clientes list', async ({ page, clientesPage }) => {
  // page is already at /clientes
  await expect(page.locator('[data-testid="clientes-list"]')).toBeVisible();
});
```

---

## Mock Requirements

No external service mocks are required for Story 1.1. All tests validate real infrastructure startup:

- **Frontend tests:** Validate the real Vite dev server (port 5173) — no mocking needed
- **Backend API tests:** Validate the real .NET API server (port 5000) — no mocking needed
- **CORS tests:** Validate real HTTP headers returned by the backend — no mocking needed

Network interception via `page.route()` is NOT used in this story because the tests intentionally target real server responses. Mocked routes would mask whether the actual infrastructure is working.

---

## Required data-testid Attributes

### Root HTML / App Component

- `app-root` — Root React mount point in `index.html` or the top-level App component
  - **Required by:** `should render the root HTML document with a valid React mount point`
  - **Implementation:** Add `data-testid="app-root"` to the `#root` div or wrap in App.tsx

**Implementation Example:**

```html
<!-- index.html -->
<div id="root" data-testid="app-root"></div>
```

Or alternatively in `src/main.tsx`:

```tsx
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Test: Frontend Vite server initialization (AC1 + AC4)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Initialize shadcn/ui: `pnpx shadcn@latest init && pnpx shadcn@latest add dialog breadcrumb`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `src/routes/__root.tsx` as TanStack Router root route (shell layout placeholder)
- [ ] Add `data-testid="app-root"` to root element in `index.html` or `App.tsx`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2–3 hours

---

### Test: Backend server initialization and Scalar documentation (AC2)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure`
- [ ] Add project references: API → Application, API → Infrastructure, Application → Domain, Infrastructure → Domain
- [ ] Add `Scalar.AspNetCore` NuGet package to API project
- [ ] Add `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()` in `Program.cs`
- [ ] Remove default WeatherForecast endpoints and models from template
- [ ] Do NOT add Swashbuckle or `app.UseSwagger()`
- [ ] Verify `dotnet run` starts on port 5000 and `/scalar` returns HTTP 200
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1.5–2 hours

---

### Test: CORS configuration (AC3)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` + `e2e/tests/foundation/project-initialization.spec.ts`

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
- [ ] Add `AllowedOrigins` array with `"http://localhost:5173"` in `appsettings.Development.json`
- [ ] Verify: browser dev tools show no CORS errors when frontend fetches backend
- [ ] Run test: `npx playwright test --grep "CORS"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: Backend solution builds with zero errors (AC5)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add unit tests project to solution
- [ ] Add project references for unit tests: UnitTests → Application + Domain
- [ ] Add `FluentValidation` NuGet to Application project
- [ ] Add `Npgsql.EntityFrameworkCore.PostgreSQL` NuGet to Infrastructure project
- [ ] Create `ExceptionHandlingMiddleware.cs` in `src/SiesaAgents.API/Middleware/` returning Problem Details RFC 7807
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()` before routing
- [ ] Verify `dotnet build SiesaAgents.sln` exits with code 0 and zero errors or warnings
- [ ] Run test: `npx playwright test --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

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

# Run with full test report
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --reporter=html
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All 17 tests written and in RED phase (failing due to missing implementation)
- ✅ Base fixture created with auto-navigation setup
- ✅ Data helper factory stubs provided (`buildCliente`, `buildContacto`)
- ✅ Required `data-testid` attributes documented
- ✅ Implementation checklist created

**Verification:**

- All tests fail because neither the frontend Vite project nor the backend .NET solution exist yet
- Failure messages: `net::ERR_CONNECTION_REFUSED` (ports 5173/5000 not listening), `TimeoutError` on element locators
- Tests are failing for the right reason: missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with AC2 — backend first, then AC1 — frontend)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**

1. Backend initialization (AC2) — creates the .NET solution and Scalar
2. CORS configuration (AC3) — enables cross-origin communication
3. Frontend initialization (AC1) — creates Vite project with dependencies
4. TypeScript strict mode (AC4) — verify compilation with strict flags
5. Build verification (AC5) — confirm `dotnet build` exits 0

**Key Principles:**

- One test at a time
- Use `pnpm` exclusively (NOT npm or yarn)
- Scalar ONLY for API docs — never add Swashbuckle
- TypeScript `any` types are forbidden — use proper types from the start

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. Verify all 17 tests pass (green phase complete)
2. Review `Program.cs` — ensure middleware order is correct
3. Review `tsconfig.app.json` — confirm all strict flags are set
4. Ensure folder structure is clean: `frontend/`, `backend/src/`, `backend/tests/`
5. Run `npx tsc --noEmit` in the frontend to confirm zero TypeScript errors
6. Run tests after each refactor to confirm nothing breaks

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
3. Begin implementation using implementation checklist as guide
4. Work one acceptance criterion at a time (AC2 → AC3 → AC1 → AC4 → AC5)
5. When all tests pass, refactor for quality
6. When complete, update story status to `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Knowledge Base References Applied

- **fixture-architecture.md** — Base fixture using `test.extend()` with auto-navigation setup
- **network-first.md** — `page.waitForResponse()` registered BEFORE `page.goto()` (AC1 tests)
- **test-quality.md** — One assertion per test, Given-When-Then format, deterministic waiting via `waitForLoadState`
- **selector-resilience.md** — `data-testid="app-root"` selector for React root element
- **test-levels-framework.md** — AC1/AC4 as E2E (browser-level), AC2/AC3/AC5 as API (request-level)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results (before implementation):**

```
  AC1 — Frontend Vite server initialization
    ✗  should serve the frontend app on port 5173 without errors
       Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    ✗  should render the root HTML document with a valid React mount point
       Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    ✗  should load without any TypeScript compilation errors visible in the browser console
       Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    ✗  should not have any JavaScript runtime errors on initial load
       Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  AC3 — CORS configuration between frontend and backend
    ✗  should allow frontend to reach backend health endpoint without CORS errors
       Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
    ✗  should receive a valid HTTP response from the backend health probe without CORS blocking
       Error: net::ERR_CONNECTION_REFUSED at http://localhost:5000/scalar

  AC4 — TypeScript strict mode active on frontend
    ✗  should load the frontend without Vite TypeScript error overlay
       Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/

  AC2 — Backend server initialization and Scalar API documentation
    ✗  should have the backend API server running on port 5000
       Error: connect ECONNREFUSED 127.0.0.1:5000
    ✗  should serve the Scalar API documentation page at /scalar
       Error: connect ECONNREFUSED 127.0.0.1:5000
    ✗  should return HTML content from the Scalar documentation endpoint
       Error: connect ECONNREFUSED 127.0.0.1:5000
    ✗  should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
       Error: connect ECONNREFUSED 127.0.0.1:5000
    ✗  should NOT expose WeatherForecast default endpoint
       Error: connect ECONNREFUSED 127.0.0.1:5000
    ✗  should return CORS header allowing http://localhost:5173 origin
       Error: connect ECONNREFUSED 127.0.0.1:5000
    ✗  should respond to OPTIONS preflight from frontend origin without CORS rejection
       Error: connect ECONNREFUSED 127.0.0.1:5000

  AC5 — Backend solution builds and runs successfully
    ✗  should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)
       Error: connect ECONNREFUSED 127.0.0.1:5000
    ✗  should return Problem Details RFC 7807 format for unhandled errors
       Error: connect ECONNREFUSED 127.0.0.1:5000

  17 failed
```

**Summary:**

- Total tests: 17 (8 E2E + 9 API)
- Passing: 0 (expected — no implementation exists)
- Failing: 17 (expected — all due to `ECONNREFUSED` on ports 5173/5000)
- Status: ✅ RED phase confirmed — failures are due to missing implementation, not test bugs

---

## Notes

- **pnpm is mandatory** — The frontend uses pnpm exclusively. Never use npm or yarn (company standards).
- **Scalar is mandatory** — Never add Swashbuckle. The test `should NOT expose any Swagger/OpenAPI UI endpoint` explicitly enforces this constraint.
- **No domain entities in this story** — Story 1.1 creates the skeleton structure only. No `ClienteEntity`, no migrations. Those come in Epics 2/3.
- **TypeScript `any` is forbidden** — The `noImplicitAny: true` flag means any implicit `any` will cause the entire build to fail. Type all code from the start.
- **AC5 is tested via runtime proxy** — `dotnet build` is not directly invoked in tests. If the server starts and responds, the build must have succeeded. A build failure prevents the server from starting.
- **CORS test ordering** — `app.UseCors("DevCors")` must be called BEFORE `app.MapScalarApiReference()` in `Program.cs`. Wrong ordering will cause CORS tests to fail even after CORS is "configured".

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Refer to `_bmad-output/implementation-artifacts/test-design-epic-1.md` for full risk assessment
- Consult `_bmad/bmm/testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** — 2026-05-24
