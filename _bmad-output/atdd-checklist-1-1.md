# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-28
**Author:** SiesaTeam
**Primary Test Level:** API + E2E

---

## Story Summary

This story establishes the full-stack monorepo skeleton for the Siesa Agents CRM: a Vite React-TS frontend and a .NET 10 Clean Architecture backend. The goal is a working development environment where both servers start successfully, TypeScript compiles in strict mode, and CORS is properly configured between the two services.

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

- ✅ **Test:** `should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Frontend project does not exist yet; HTTP 200 from localhost:5173 will fail (connection refused)
  - **Verifies:** AC1 — Vite dev server starts and serves the application on the correct port

- ✅ **Test:** `should render the root HTML document with a valid React mount point`
  - **Status:** RED — `[data-testid="app-root"]` element is missing from index.html / App.tsx until implemented
  - **Verifies:** AC1 — React application mounts correctly with required testid

- ✅ **Test:** `should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — No frontend project exists; when implemented, any TypeScript error will fail this test
  - **Verifies:** AC4 — Strict TypeScript mode produces zero compiler errors

- ✅ **Test:** `should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — No frontend project; when implemented, any uncaught JS exception will fail this test
  - **Verifies:** AC1 + AC4 — Application initializes cleanly with no runtime exceptions

- ✅ **Test:** `should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — No frontend project; `vite-error-overlay` must be absent after strict TypeScript compilation
  - **Verifies:** AC4 — TypeScript strict mode compilation produces no Vite overlay errors

- ✅ **Test:** `should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Neither server running; no CORS headers present until backend is configured
  - **Verifies:** AC3 — No CORS-related browser console errors when frontend makes cross-origin requests

- ✅ **Test:** `should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not running; connection refused to port 5000
  - **Verifies:** AC3 — Backend responds to cross-origin requests (200, 301, or 302)

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (147 lines)

- ✅ **Test:** `should have the backend API server running on port 5000`
  - **Status:** RED — .NET backend project does not exist; connection refused on port 5000
  - **Verifies:** AC2 — Backend server starts and responds on port 5000

- ✅ **Test:** `should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — Backend not running; `app.MapScalarApiReference()` not yet implemented
  - **Verifies:** AC2 — Scalar API documentation endpoint returns HTTP 200

- ✅ **Test:** `should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Backend not running; content-type header not available
  - **Verifies:** AC2 — `/scalar` returns valid HTML content (not JSON or binary)

- ✅ **Test:** `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running; when implemented, `/swagger` must return non-200
  - **Verifies:** AC2 — Architecture constraint: Swashbuckle is explicitly forbidden

- ✅ **Test:** `should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running; when implemented, default template endpoint must be removed
  - **Verifies:** AC2 — Default .NET template artifacts are cleaned up

- ✅ **Test:** `should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — Backend not running; `Access-Control-Allow-Origin` header missing
  - **Verifies:** AC3 — CORS policy returns correct `Access-Control-Allow-Origin` response header

- ✅ **Test:** `should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — Backend not running; OPTIONS preflight returns 200 or 204 when CORS is properly configured
  - **Verifies:** AC3 — CORS preflight requests from frontend origin are accepted

- ✅ **Test:** `should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Backend not running; all four projects must be compiled and wired via DI
  - **Verifies:** AC5 — All four Clean Architecture projects compiled and runtime-integrated

- ✅ **Test:** `should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — Backend not running; `ExceptionHandlingMiddleware` not implemented yet
  - **Verifies:** AC2 + AC5 — Backend responds with JSON (not HTML) for unknown routes, middleware active

---

## Data Factories Created

This story is infrastructure-only (no domain entities). The existing `data.helper.ts` is not applicable to Story 1.1. No domain-specific factories are required.

**Existing support infrastructure** (for reference in later stories):
- `e2e/helpers/data.helper.ts` — `buildCliente()`, `buildContacto()` helpers (used in Epics 2 & 3)
- `e2e/helpers/api.helper.ts` — `ApiHelper` class for REST API calls (used in Epics 2 & 3)

---

## Fixtures Created

No new fixtures are required for Story 1.1. Tests use Playwright's built-in `test` and `request` fixtures directly, as there is no auth or domain data to set up.

**Existing fixture infrastructure:**
- `e2e/fixtures/base.fixture.ts` — Provides `clientesPage` and `contactosPage` fixtures (used in later stories)

---

## Mock Requirements

Story 1.1 tests verify real server connectivity and CORS behavior. No mock routes are used. Both servers must be genuinely running for these tests to pass green.

**Runtime requirement:** The `playwright.config.ts` `webServer` block auto-starts the frontend with `pnpm --filter frontend dev`. The backend at `http://localhost:5000` must be started separately by the developer via `dotnet run` in `src/SiesaAgents.API`.

---

## Required data-testid Attributes

### Root Application Mount Point (index.html or App.tsx)

- `app-root` — Top-level React mount container

**Implementation Example:**

```tsx
// Option A: In frontend/index.html
<div id="root" data-testid="app-root"></div>

// Option B: In frontend/src/App.tsx
export default function App() {
  return (
    <div data-testid="app-root">
      {/* Router outlet */}
    </div>
  );
}
```

---

## Implementation Checklist

### Test: `should serve the frontend app on port 5173 without errors`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts` at project root
- [ ] Run `pnpm install` inside `frontend/`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` plugin and `@tanstack/router-plugin/vite`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify `pnpm run dev` starts on port 5173 without errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "port 5173"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should render the root HTML document with a valid React mount point`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Add `data-testid="app-root"` to the root div in `frontend/index.html` OR to the top-level element in `frontend/src/App.tsx`
- [ ] Ensure the `RouterProvider` and `QueryProvider` wrap the application correctly in `frontend/src/main.tsx`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "React mount point"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should load without any TypeScript compilation errors visible in the browser console`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Fix any TypeScript errors that arise from strict mode in the generated Vite template files
- [ ] Ensure no `@ts-ignore` or `any` types are introduced during initialization
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "TypeScript compilation"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should not have any JavaScript runtime errors on initial load`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `src/shared/lib/queryClient.ts` — singleton `QueryClient` with `staleTime: 1000 * 60`
- [ ] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Create `src/routes/__root.tsx` as the TanStack Router root route (shell layout placeholder)
- [ ] Wire `RouterProvider` inside `QueryProvider` in `src/main.tsx`
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "runtime errors"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should load the frontend without Vite TypeScript error overlay`

**File:** `e2e/tests/foundation/project-initialization.spec.ts`

**Tasks to make this test pass:**

- [ ] Verify all steps above are complete (AC1 + AC4 tasks)
- [ ] Run `tsc --noEmit` in `frontend/` to confirm zero TypeScript errors
- [ ] Run test: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts --grep "error overlay"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should have the backend API server running on port 5000`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create solution: `dotnet new sln -n SiesaAgents` in `backend/`
- [ ] Create API project: `dotnet new webapi -n SiesaAgents.API --no-openapi -o backend/src/SiesaAgents.API`
- [ ] Add Scalar.AspNetCore NuGet: `dotnet add backend/src/SiesaAgents.API package Scalar.AspNetCore`
- [ ] Configure minimal `Program.cs` per the architecture pattern (see Dev Notes)
- [ ] Start backend: `dotnet run --project backend/src/SiesaAgents.API`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "port 5000"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: `should serve the Scalar API documentation page at /scalar`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Register `builder.Services.AddOpenApi()` in `Program.cs`
- [ ] Add `app.MapScalarApiReference()` AFTER `app.UseCors()` in `Program.cs`
- [ ] Verify Scalar page loads at `http://localhost:5000/scalar`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Scalar"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Do NOT install Swashbuckle.AspNetCore or call `app.UseSwagger()` / `app.UseSwaggerUI()` anywhere
- [ ] Ensure no `MapSwagger()` or similar calls exist in `Program.cs`
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Swagger"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.1 hours (constraint check)

---

### Test: `should NOT expose WeatherForecast default endpoint`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Delete or never create `WeatherForecastController.cs` / `WeatherForecast.cs` from the generated template
- [ ] Delete `WeatherForecast` minimal API endpoint if auto-generated in `Program.cs`
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
- [ ] Call `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` in `Program.cs`
- [ ] Read CORS origins from `appsettings.Development.json` `AllowedOrigins` array (optional but recommended)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "CORS header"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: `should respond to OPTIONS preflight from frontend origin without CORS rejection`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Ensure `app.UseCors("DevCors")` is registered BEFORE any endpoint mappings (middleware order matters)
- [ ] Verify `AllowAnyHeader()` and `AllowAnyMethod()` are included in the CORS policy
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "OPTIONS preflight"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.25 hours

---

### Test: `should have all four Clean Architecture layers responding`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create Application layer: `dotnet new classlib -n SiesaAgents.Application -o backend/src/SiesaAgents.Application`
- [ ] Create Domain layer: `dotnet new classlib -n SiesaAgents.Domain -o backend/src/SiesaAgents.Domain`
- [ ] Create Infrastructure layer: `dotnet new classlib -n SiesaAgents.Infrastructure -o backend/src/SiesaAgents.Infrastructure`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add all projects to `SiesaAgents.sln` via `dotnet sln add ...`
- [ ] Install NuGet packages: FluentValidation in Application, Npgsql.EntityFrameworkCore.PostgreSQL in Infrastructure
- [ ] Run `dotnet build backend/SiesaAgents.sln` and verify zero errors
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Clean Architecture"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1.5 hours

---

### Test: `should return Problem Details RFC 7807 format for unhandled errors`

**File:** `e2e/tests/api/backend-initialization.api.spec.ts`

**Tasks to make this test pass:**

- [ ] Create `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` using the pattern from Dev Notes
- [ ] Register middleware: `app.UseMiddleware<ExceptionHandlingMiddleware>()` BEFORE `app.UseCors()` in `Program.cs`
- [ ] Ensure unknown routes return JSON content-type (not HTML)
- [ ] Run test: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --grep "Problem Details"`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.75 hours

---

## Running Tests

```bash
# Run all failing tests for Story 1.1
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only E2E frontend tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only API backend tests
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run tests in headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a specific test
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts --debug

# Run with UI reporter
npx playwright test --ui

# Run on specific browser only
npx playwright test e2e/tests/foundation/ --project=chromium
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing (13 tests across 2 files)
- ✅ Test infrastructure directories and base fixtures in place
- ✅ data-testid requirements listed
- ✅ Implementation checklist created with per-test tasks
- ✅ No mock routes — tests verify real server behavior (appropriate for infrastructure story)

**Verification:**

- Tests fail with connection refused / element not found (not test syntax errors)
- Failure messages are clear: "net::ERR_CONNECTION_REFUSED" or "Locator not found"
- Tests fail due to missing implementation (no frontend/backend), not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with backend server first — AC2)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Recommended order:**
1. Backend server + Scalar (AC2) — enables API tests to unblock
2. CORS configuration (AC3) — depends on backend being up
3. Frontend Vite server (AC1) — independent, can parallelize
4. TypeScript strict mode (AC4) — layered on top of AC1
5. Solution build verification (AC5) — final integration check

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all 13 tests pass** (green phase complete)
2. **Review `Program.cs`** for readability and middleware ordering
3. **Extract CORS origins** to `appsettings.Development.json` if not done in GREEN phase
4. **Verify folder structure** matches the architecture diagram in `architecture.md`
5. **Ensure tests still pass** after each refactor

---

## Next Steps

1. **Run failing tests** to confirm RED phase: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`
2. **Review implementation checklist** above, starting with backend (Task 2 in story)
3. **Work one test at a time** (red → green for each)
4. **Share progress** in daily standup
5. **When all 13 tests pass**, refactor for quality
6. **When refactoring complete**, update story status to 'done' in sprint-status.yaml

---

## Knowledge Base References Applied

- **network-first.md** — Network-first response listener registered before `page.goto()` in AC1 and AC4 tests
- **test-quality.md** — One assertion per test (atomic design), Given-When-Then format, explicit waits (no hard waits)
- **selector-resilience.md** — `data-testid="app-root"` selector used exclusively; no CSS class selectors
- **fixture-architecture.md** — `base.fixture.ts` uses `test.extend()` with auto-cleanup pattern
- **test-levels-framework.md** — Infrastructure story uses API tests for backend validation, E2E for frontend load verification; no component tests needed (no UI components implemented in this story)

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Results:**

```
Error: connect ECONNREFUSED 127.0.0.1:5173
  → AC1 tests: server not running

TimeoutError: Waiting for locator('[data-testid="app-root"]') to be visible
  → AC1: data-testid not implemented

Error: connect ECONNREFUSED 127.0.0.1:5000
  → AC2 + AC3 + AC5 tests: backend not running
```

**Summary:**

- Total tests: 13
- Passing: 0 (expected — RED phase)
- Failing: 13 (expected — RED phase)
- Status: ✅ RED phase verified

**Expected Failure Messages per Test:**

| Test | Expected Failure |
|------|-----------------|
| Frontend serves on 5173 | `net::ERR_CONNECTION_REFUSED` on localhost:5173 |
| React mount point visible | `Locator '[data-testid="app-root"]' not found` |
| No TypeScript console errors | Connection refused prevents page load |
| No JS runtime errors | Connection refused prevents page load |
| No Vite error overlay | Connection refused prevents page load |
| CORS no console errors | Backend at 5000 not running |
| Backend health probe | `net::ERR_CONNECTION_REFUSED` on localhost:5000 |
| Backend on port 5000 | `net::ERR_CONNECTION_REFUSED` on localhost:5000 |
| Scalar at /scalar → 200 | `net::ERR_CONNECTION_REFUSED` on localhost:5000 |
| Scalar returns HTML | `net::ERR_CONNECTION_REFUSED` on localhost:5000 |
| No Swagger endpoint | `net::ERR_CONNECTION_REFUSED` on localhost:5000 |
| No WeatherForecast | `net::ERR_CONNECTION_REFUSED` on localhost:5000 |
| CORS header present | `net::ERR_CONNECTION_REFUSED` on localhost:5000 |
| OPTIONS preflight | `net::ERR_CONNECTION_REFUSED` on localhost:5000 |
| Clean Architecture DI | `net::ERR_CONNECTION_REFUSED` on localhost:5000 |
| Problem Details JSON | `net::ERR_CONNECTION_REFUSED` on localhost:5000 |

---

## Notes

- This is a pure infrastructure story with no domain entities, no database, and no UI components. Test levels are deliberately E2E (frontend load) and API (backend contract) only — no component tests are needed.
- The `playwright.config.ts` `webServer` block auto-starts the frontend; the developer must start the backend manually before running tests.
- The `data-testid="app-root"` attribute is the only UI testid required for this story. All subsequent testids are defined in Stories 1.2 and beyond.
- Tests in `e2e/tests/api/` use Playwright's `request` fixture, which bypasses the browser entirely — this is intentional for backend contract testing.
- The Scalar endpoint test (`/scalar`) verifies content-type is `text/html`. Developers must NOT redirect `/scalar` to another URL or return JSON from this route.

---

**Generated by BMad TEA Agent** - 2026-06-28
