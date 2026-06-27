# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-07
**Author:** SiesaTeam
**Primary Test Level:** E2E + API

---

## Story Summary

Story 1.1 establishes the foundational monorepo structure for the Siesa Agents CRM. It initializes the Vite React-TypeScript frontend and the .NET 10 Clean Architecture backend, verifies both dev servers start correctly, confirms CORS is configured between the two, and ensures TypeScript and .NET build processes complete with zero errors.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine with Node.js and .NET 10 installed, when the developer runs the frontend initialization commands, then `pnpm run dev` starts the Vite server on port 5173 with no errors, and the app compiles with TypeScript strict mode enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, when the developer runs `dotnet run` in `src/SiesaAgents.API`, then the backend starts on port 5000 and the Scalar API documentation page loads at `/scalar`. The four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, when the frontend makes any HTTP request to `http://localhost:5000`, then CORS allows requests from `http://localhost:5173` without errors.

4. **AC4** — Given the frontend project is initialized, when the TypeScript compiler runs, then it emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, when `dotnet build SiesaAgents.sln` is executed, then all four projects compile successfully with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (7 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

- **Test:** `AC1 — should serve the frontend app on port 5173 without errors`
  - **Status:** RED — frontend server not yet initialized; `page.goto('/')` returns connection refused
  - **Verifies:** AC1 — Vite dev server starts and responds with HTTP 200

- **Test:** `AC1 — should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element does not exist; `index.html` not yet created
  - **Verifies:** AC1 — React app mounts correctly at root route

- **Test:** `AC1 — should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — frontend server not running; no console events captured
  - **Verifies:** AC1/AC4 — TypeScript strict mode produces no runtime console errors

- **Test:** `AC1 — should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — frontend server not running; no `pageerror` events captured
  - **Verifies:** AC1 — Application renders without JavaScript exceptions

- **Test:** `AC3 — should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — neither server is running; `page.evaluate` fetch fails with network error
  - **Verifies:** AC3 — No CORS-related console errors when frontend calls backend

- **Test:** `AC3 — should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — backend server not running; `request.get` returns connection refused
  - **Verifies:** AC3 — Backend responds to cross-origin requests (200, 301, or 302)

- **Test:** `AC4 — should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — frontend server not running; navigation fails
  - **Verifies:** AC4 — Vite error overlay (`vite-error-overlay`) is absent after compilation

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

- **Test:** `AC2 — should have the backend API server running on port 5000`
  - **Status:** RED — backend not yet initialized; connection refused on port 5000
  - **Verifies:** AC2 — Backend server is reachable on port 5000

- **Test:** `AC2 — should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `app.MapScalarApiReference()` not yet called; `/scalar` returns 404
  - **Verifies:** AC2 — Scalar documentation page responds with HTTP 200

- **Test:** `AC2 — should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — `/scalar` not yet registered; content-type header absent or wrong
  - **Verifies:** AC2 — Scalar endpoint returns `text/html` content type

- **Test:** `AC2 — should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — default template may have `/swagger` route if template not yet cleaned
  - **Verifies:** AC2 + architecture constraint — `/swagger` must NOT return HTTP 200

- **Test:** `AC2 — should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — default .NET template includes WeatherForecast endpoint; not yet removed
  - **Verifies:** AC2 — Template cleanup is complete; `/weatherforecast` returns 404 or 405

- **Test:** `AC2 — should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — CORS policy not yet configured; `Access-Control-Allow-Origin` header absent
  - **Verifies:** AC2/AC3 — CORS headers allow the frontend origin

- **Test:** `AC2 — should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — CORS middleware not yet applied before endpoint mapping
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204 (not 403)

- **Test:** `AC5 — should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — backend not yet built; server cannot start without successful compile
  - **Verifies:** AC5 — A running server is proof that `dotnet build SiesaAgents.sln` succeeded

- **Test:** `AC5 — should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ExceptionHandlingMiddleware` not yet created; response content-type is HTML or missing
  - **Verifies:** AC5 + AC2 prep — Middleware wired correctly; unknown endpoints return JSON (not HTML)

---

## Data Factories Created

No domain entities exist at this story level (Story 1.1 is infrastructure-only). Data factories for `Cliente` and `Contacto` entities are pre-created in `e2e/helpers/data.helper.ts` for use by Epic 2+ stories.

### Pre-created Helpers

**File:** `e2e/helpers/data.helper.ts`

**Exports:**
- `buildCliente(overrides?)` — Build a client payload with unique NIT and phone
- `buildContacto(overrides?)` — Build a contact payload with unique email

**File:** `e2e/helpers/api.helper.ts`

**Exports:**
- `ApiHelper.createCliente(data)` — POST to `/api/v1/clientes`
- `ApiHelper.deleteCliente(id)` — DELETE from `/api/v1/clientes/:id`
- `ApiHelper.createContacto(data)` — POST to `/api/v1/contactos`
- `ApiHelper.deleteContacto(id)` — DELETE from `/api/v1/contactos/:id`

---

## Fixtures Created

**File:** `e2e/fixtures/base.fixture.ts`

**Fixtures:**
- `clientesPage` — Navigates to `/clientes` before the test
  - **Setup:** `page.goto('/clientes')`
  - **Provides:** Page at `/clientes` route
  - **Cleanup:** Playwright auto-cleanup
- `contactosPage` — Navigates to `/contactos` before the test
  - **Setup:** `page.goto('/contactos')`
  - **Provides:** Page at `/contactos` route
  - **Cleanup:** Playwright auto-cleanup

---

## Mock Requirements

Story 1.1 does not require external service mocks. All tests validate real server responses (frontend Vite dev server and .NET backend). No network interception is applied — these are integration-level acceptance tests confirming the real infrastructure is running.

---

## Required data-testid Attributes

### Frontend Root (`index.html` / `App.tsx`)

- `app-root` — The root React mount container (applied to `<div id="root">` or a top-level `<div>` in `App.tsx`)

**Implementation Example:**

```tsx
// src/main.tsx or App.tsx
<div data-testid="app-root">
  <RouterProvider router={router} />
</div>
```

---

## Implementation Checklist

### Test: AC1 — Frontend server starts on port 5173

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` and `@tanstack/router-plugin/vite`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route shell
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to the root element in `main.tsx` or `App.tsx`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC2 — Backend starts on port 5000 with Scalar at /scalar

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all projects to solution: `dotnet sln add src/SiesaAgents.API src/SiesaAgents.Application src/SiesaAgents.Domain src/SiesaAgents.Infrastructure`
- [ ] Add project references: API → Application, API → Infrastructure, Application → Domain, Infrastructure → Domain
- [ ] Add Scalar package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure `Program.cs` with `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()`
- [ ] Remove default WeatherForecast endpoints and models from generated template
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Test: AC3 — CORS allows requests from http://localhost:5173

**File:** `e2e/tests/foundation/project-initialization.spec.ts` + `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] In `Program.cs`, register CORS policy: `builder.Services.AddCors(options => options.AddPolicy("DevCors", policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()))`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Add `AllowedOrigins` array to `appsettings.Development.json` with `http://localhost:5173`
- [ ] Run test: `npx playwright test --grep "AC3"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC4 — TypeScript strict mode emits zero errors

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Ensure all generated source files have no TypeScript errors (run `pnpm exec tsc --noEmit`)
- [ ] Verify Vite error overlay is absent during `pnpm run dev`
- [ ] Run test: `npx playwright test --grep "AC4"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: AC5 — Backend solution builds with zero errors

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create unit tests project: `dotnet new xunit -n SiesaAgents.UnitTests -o tests/SiesaAgents.UnitTests`
- [ ] Add unit test project to solution: `dotnet sln add tests/SiesaAgents.UnitTests`
- [ ] Add NuGet packages: FluentValidation to Application, Npgsql.EntityFrameworkCore.PostgreSQL to Infrastructure
- [ ] Verify `dotnet build SiesaAgents.sln` succeeds with zero errors
- [ ] Create `ExceptionHandlingMiddleware.cs` catching all exceptions and returning Problem Details RFC 7807
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()`
- [ ] Configure `appsettings.Development.json` with `ConnectionStrings:DefaultConnection` placeholder
- [ ] Run test: `npx playwright test --grep "AC5"`
- [ ] ✅ Tests pass (green phase)

**Estimated Effort:** 1 hour

---

## Running Tests

```bash
# Run all failing tests for this story
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run E2E tests only (AC1, AC3, AC4)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run API tests only (AC2, AC5)
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run by acceptance criterion
npx playwright test --grep "AC1"
npx playwright test --grep "AC2"
npx playwright test --grep "AC3"
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing
- Fixtures and helpers created with auto-cleanup
- Mock requirements documented (none needed for this story)
- data-testid requirements listed
- Implementation checklist created

**Verification:**

- All 16 tests run and fail with "connection refused" or "element not found" — not test bugs
- Failure messages are clear and actionable
- Tests fail because the implementation does not exist yet, not due to test errors

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one failing test from the implementation checklist (start with AC2 — backend setup)
2. Read the test to understand expected behavior
3. Implement minimal code to make that specific test pass
4. Run the test to verify it now passes (green)
5. Check off the task in the implementation checklist
6. Move to next test and repeat

**Recommended order:**
1. AC2 (backend + Scalar) — enables API tests
2. AC5 (ExceptionHandlingMiddleware, build verification) — builds on AC2
3. AC3 (CORS) — builds on AC2
4. AC1 (frontend Vite server) — independent
5. AC4 (TypeScript strict) — builds on AC1

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 16 tests pass (green phase complete)
2. Review `Program.cs` for clarity and order of middleware
3. Ensure `tsconfig.app.json` has no redundant or conflicting options
4. Ensure Scalar is configured with correct title/description for project
5. Run all tests after each refactor to confirm no regressions

---

## Next Steps

1. Share this checklist and failing tests with the dev workflow (manual handoff)
2. Run failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/backend-initialization.api.spec.ts`
3. Begin implementation using the implementation checklist as guide (recommended: start with backend AC2)
4. Work one acceptance criterion at a time (red → green for each)
5. When all 16 tests pass, refactor code for quality
6. When refactoring complete, update story status to `done` in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Network-first route interception pattern (intercept BEFORE navigation); applied in AC1 test using `page.waitForResponse` registered before `page.goto`
- **test-quality.md** — Atomic tests with single assertion; Given-When-Then structure; explicit waits only (no hard waits); deterministic test design
- **selector-resilience.md** — `data-testid` selectors used exclusively (`[data-testid="app-root"]`, `vite-error-overlay`); no CSS class or ID selectors
- **fixture-architecture.md** — Base fixtures in `e2e/fixtures/base.fixture.ts` using `test.extend()` with auto-cleanup pattern
- **test-levels-framework.md** — E2E level for user-visible behavior (AC1, AC3, AC4); API level for backend contract verification (AC2, AC5)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Running 16 tests using 4 workers

  × AC1 — Frontend Vite server initialization > should serve the frontend app on port 5173 without errors
  × AC1 — Frontend Vite server initialization > should render the root HTML document with a valid React mount point
  × AC1 — Frontend Vite server initialization > should load without any TypeScript compilation errors visible in the browser console
  × AC1 — Frontend Vite server initialization > should not have any JavaScript runtime errors on initial load
  × AC3 — CORS configuration between frontend and backend > should allow frontend to reach backend health endpoint without CORS errors
  × AC3 — CORS configuration between frontend and backend > should receive a valid HTTP response from the backend health probe without CORS blocking
  × AC4 — TypeScript strict mode active on frontend > should load the frontend without Vite TypeScript error overlay
  × AC2 — Backend server initialization and Scalar API documentation > should have the backend API server running on port 5000
  × AC2 — Backend server initialization and Scalar API documentation > should serve the Scalar API documentation page at /scalar
  × AC2 — Backend server initialization and Scalar API documentation > should return HTML content from the Scalar documentation endpoint
  × AC2 — Backend server initialization and Scalar API documentation > should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)
  × AC2 — Backend server initialization and Scalar API documentation > should NOT expose WeatherForecast default endpoint
  × AC2 — Backend server initialization and Scalar API documentation > should return CORS header allowing http://localhost:5173 origin
  × AC2 — Backend server initialization and Scalar API documentation > should respond to OPTIONS preflight from frontend origin without CORS rejection
  × AC5 — Backend solution builds and runs successfully > should have all four Clean Architecture layers responding
  × AC5 — Backend solution builds and runs successfully > should return Problem Details RFC 7807 format for unhandled errors

  16 failed
```

**Summary:**

- Total tests: 16
- Passing: 0 (expected)
- Failing: 16 (expected)
- Status: RED phase verified

**Expected Failure Messages:**

- E2E tests (AC1, AC3, AC4): `Error: net::ERR_CONNECTION_REFUSED at http://localhost:5173/` — frontend server not running
- API tests (AC2, AC5): `Error: connect ECONNREFUSED 127.0.0.1:5000` — backend server not running

---

## Notes

- Story 1.1 is purely infrastructure — no domain entities, no database migrations, no routes beyond `__root.tsx`
- The `data.helper.ts` and `api.helper.ts` files are pre-created as shared infrastructure for Epic 2+ stories
- AC5 is verified indirectly: if the .NET server is running, the solution compiled successfully
- The `vite-error-overlay` selector (AC4) is a native custom element rendered by Vite on compile error — no `data-testid` required
- `tea_use_playwright_utils: false` in config — pure Playwright test patterns used without utils library

---

**Generated by BMad TEA Agent** — 2026-06-07
