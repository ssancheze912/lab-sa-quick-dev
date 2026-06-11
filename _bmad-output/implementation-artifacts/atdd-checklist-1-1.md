# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-11
**Author:** TEA Agent (sa-tea-atdd)
**Primary Test Level:** E2E + API

---

## Story Summary

Story 1.1 establishes the full development environment: a Vite React/TypeScript frontend and a .NET 10 Clean Architecture backend, both running concurrently. The team needs both servers operational with proper TypeScript strict mode, Scalar API documentation, and CORS configured so the frontend on port 5173 can communicate with the backend on port 5000 without errors.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Given a clean development machine, When `pnpm run dev` runs, Then Vite server starts on port 5173 with no errors and TypeScript strict mode is enabled (`"strict": true` in `tsconfig.app.json`).

2. **AC2** — Given the backend project has been created, When `dotnet run` runs in `src/SiesaAgents.API`, Then the backend starts on port 5000 and Scalar loads at `/scalar`. All four Clean Architecture projects are referenced correctly in `SiesaAgents.sln`.

3. **AC3** — Given both servers are running, When the frontend makes any HTTP request to `http://localhost:5000`, Then CORS allows requests from `http://localhost:5173` without errors.

4. **AC4** — Given the frontend project is initialized, When the TypeScript compiler runs, Then zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.

5. **AC5** — Given the backend solution is initialized, When `dotnet build SiesaAgents.sln` is executed, Then all four projects compile with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (4 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend not yet running; connection refused at http://localhost:5173
  - **Verifies:** AC1 — Vite server starts on port 5173 and returns HTTP 200

- **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` not present until implementation adds it to index.html/App.tsx
  - **Verifies:** AC1 — React application mounts correctly

- **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — No running server; also tests TypeScript compilation error-free output
  - **Verifies:** AC4 — No TypeScript compilation errors in browser console

- **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — No running server; tests clean JavaScript runtime
  - **Verifies:** AC1 / AC4 — No runtime JS exceptions on initial load

- **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not running; CORS policy not configured
  - **Verifies:** AC3 — No CORS-related console errors when frontend fetches backend

- **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running at port 5000
  - **Verifies:** AC3 — Backend responds to requests from frontend origin (200/301/302)

- **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend not running
  - **Verifies:** AC4 — No Vite error overlay shown (TypeScript compilation clean)

**Total E2E tests:** 7 (file has 7 tests across 3 describe blocks)

### API Tests (7 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — Backend not running; connection refused at http://localhost:5000
  - **Verifies:** AC2 — Backend server is up and responsive

- **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; `app.MapScalarApiReference()` not registered
  - **Verifies:** AC2 — Scalar page returns HTTP 200 at /scalar

- **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; Scalar not configured
  - **Verifies:** AC2 — Scalar endpoint content-type is text/html (not JSON/plain)

- **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running
  - **Verifies:** AC2 (architecture compliance) — /swagger must NOT return HTTP 200

- **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; default WeatherForecast endpoint not yet removed
  - **Verifies:** AC2 (architecture compliance) — /weatherforecast returns 404 or 405

- **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; CORS policy not yet configured
  - **Verifies:** AC3 — `access-control-allow-origin` header present for frontend origin

- **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; CORS middleware not yet applied
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204 (not 403)

- **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not running; solution not yet compiled
  - **Verifies:** AC5 — Build success proxied via server startup (all four projects linked)

- **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; ExceptionHandlingMiddleware not registered
  - **Verifies:** AC2 / AC5 — Error responses are JSON (application/problem+json), not HTML

**Total API tests:** 9 (file has 9 tests across 2 describe blocks)

---

## Data Factories Created

Story 1.1 tests infrastructure only (server health, CORS, TypeScript compilation). No domain entities exist yet — no data factories are required for this story.

---

## Fixtures Created

No custom fixtures are needed for Story 1.1 beyond the existing base.fixture.ts. The tests use Playwright's built-in `page` and `request` fixtures.

**Existing shared fixture:** `e2e/fixtures/base.fixture.ts`

- `clientesPage` — navigates to `/clientes` (not used in Story 1.1 tests)
- `contactosPage` — navigates to `/contactos` (not used in Story 1.1 tests)

---

## Mock Requirements

No mocks required. Story 1.1 tests verify real infrastructure (no external services to stub):

- Frontend Vite server at `http://localhost:5173` — tested live
- Backend .NET server at `http://localhost:5000` — tested live
- CORS preflight — tested with real backend

---

## Required data-testid Attributes

### Root Application Element

- `app-root` — Root container div in `index.html` or App component

**Implementation Example:**

```html
<!-- In index.html or public/index.html -->
<div id="root" data-testid="app-root"></div>
```

or in `src/main.tsx`:

```tsx
// Ensure the mount point carries data-testid="app-root"
// In App.tsx top-level wrapper:
<div data-testid="app-root">
  {/* app content */}
</div>
```

---

## Implementation Checklist

### Group AC1 + AC4: Frontend initialization

**Tests in file:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make these tests pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Configure `tsconfig.app.json`: set `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Add `data-testid="app-root"` to the root element in `index.html` or `App.tsx`
- [ ] Install all runtime dependencies: `@tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` and `@tanstack/router-plugin/vite` plugins
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Create `src/routes/__root.tsx` as TanStack Router root route placeholder
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Verify `pnpm run dev` starts on port 5173 with zero TypeScript errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`
- [ ] All 7 E2E tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Group AC2: Backend initialization and Scalar

**Tests in file:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make these tests pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o src/SiesaAgents.API`
- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o src/SiesaAgents.Infrastructure`
- [ ] Add all four projects to solution with `dotnet sln add`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet package: `dotnet add src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Add `builder.Services.AddOpenApi()` and `app.MapScalarApiReference()` to `Program.cs`
- [ ] Remove default WeatherForecast endpoints and models from generated API
- [ ] Verify `dotnet build SiesaAgents.sln` exits with code 0
- [ ] Verify GET `http://localhost:5000/scalar` returns HTTP 200 with `text/html` content-type
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC2"`
- [ ] AC2 tests pass (green phase)

**Estimated Effort:** 2 hours

---

### Group AC3: CORS configuration

**Tests in file:** `e2e/tests/foundation/project-initialization.spec.ts` (AC3 section) and `e2e/tests/api/backend-initialization.api.spec.ts` (AC3 section)

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, add CORS policy:
  ```csharp
  builder.Services.AddCors(options =>
      options.AddPolicy("DevCors", policy =>
          policy.WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()));
  ```
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mappings
- [ ] Optionally read origins from `appsettings.Development.json` `AllowedOrigins` array
- [ ] Verify OPTIONS preflight returns 200/204 with `access-control-allow-origin: http://localhost:5173`
- [ ] Run CORS tests: `npx playwright test --grep "AC3"`
- [ ] All CORS tests pass (green phase)

**Estimated Effort:** 0.5 hours

---

### Group AC5: Solution build integrity

**Tests in file:** `e2e/tests/api/backend-initialization.api.spec.ts` (AC5 section)

**Tasks to make these tests pass:**

- [ ] Ensure all four projects compile without errors
- [ ] Verify `ExceptionHandlingMiddleware` is registered in `Program.cs` before routing
- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` returning Problem Details RFC 7807
- [ ] Non-existent endpoints return JSON (problem+json), not HTML error pages
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "AC5"`
- [ ] AC5 tests pass (green phase)

**Estimated Effort:** 1 hour

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

# Debug specific test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug

# Run with a specific browser
npx playwright test e2e/tests/foundation/ --project=chromium

# Run and open HTML report
npx playwright test e2e/tests/foundation/ e2e/tests/api/ && npx playwright show-report
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All tests written and failing (infrastructure not yet deployed)
- Network-first intercept pattern applied where applicable
- data-testid requirements listed (`app-root`)
- Mock requirements documented (none for this story)
- Implementation checklist created with granular tasks per AC group

**Verification:**

- All tests run and fail because no server is running
- Failure messages reference connection refused (ECONNREFUSED) or element not found
- No test logic bugs — failures are entirely due to missing implementation

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. Pick one AC group from the implementation checklist above (start with AC2 — backend is simpler to verify)
2. Read the tests to understand exactly what HTTP status codes and headers are expected
3. Implement the minimal code to make that group of tests pass
4. Run the targeted test file to verify green
5. Check off tasks in the implementation checklist
6. Move to the next AC group and repeat

**Key Principles:**

- One AC group at a time (don't implement everything at once)
- Minimal implementation (no premature abstraction)
- Run tests frequently for immediate feedback
- Use the implementation checklist as your authoritative roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

1. Verify all 16 tests pass in both spec files
2. Review `Program.cs` for readability and correct middleware ordering
3. Extract CORS origins to `appsettings.Development.json` if not already done
4. Ensure all TypeScript `tsconfig.app.json` settings are correct
5. Run full test suite one final time before marking story done

---

## Next Steps

1. Run the failing tests to confirm RED phase: `npx playwright test e2e/tests/foundation/ e2e/tests/api/`
2. Begin implementation following the implementation checklist above (Task 1 → Task 2 → Task 3 in the story)
3. Work one AC group at a time (red → green for each group)
4. When all 16 tests pass, refactor for quality
5. When refactoring is complete, update story status to `done` in `_bmad-output/implementation-artifacts/sprint-status.yaml`

---

## Knowledge Base References Applied

- **network-first.md** — Route interception registered BEFORE navigation in all E2E tests to prevent race conditions
- **test-quality.md** — Given-When-Then structure with inline comments, one assertion per test, deterministic assertions
- **test-levels-framework.md** — E2E for frontend behavior (AC1, AC3, AC4); API tests for backend endpoints (AC2, AC5)
- **fixture-architecture.md** — Existing `base.fixture.ts` pattern; no new fixtures needed for infrastructure-only story
- **data-factories.md** — No domain entities in Story 1.1; factories deferred to Story 2.1 (clientes) and Story 3.1 (contactos)

---

## Notes

- Story 1.1 is an infrastructure/initialization story — the tests validate server startup and configuration, not user-facing features
- The `data-testid="app-root"` requirement is critical for E2E test stability; the DEV agent must add it to the root element
- AC5 (zero-error build) is validated indirectly via API tests: if the server responds, the build succeeded
- The `ExceptionHandlingMiddleware` test (Problem Details RFC 7807) verifies the middleware exists and is wired — deeper exception testing is in Story 1.3

---

**Generated by BMad TEA Agent (sa-tea-atdd)** — 2026-06-11
