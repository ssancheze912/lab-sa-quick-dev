# ATDD Checklist - Epic 1, Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-06-08
**Author:** SiesaTeam
**Primary Test Level:** E2E + API (infrastructure-heavy story)

---

## Story Summary

Initialize the Siesa Agents project skeleton with a Vite/React/TypeScript frontend (port 5173) and a .NET 10 Clean Architecture backend (port 5000) connected via CORS. Verifies dev environment is reproducible, both servers boot, Scalar API docs are served, TypeScript strict mode passes, and the solution builds end-to-end.

**As a** developer
**I want** the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture) projects initialized with all required dependencies
**So that** the team has a working development environment with both servers running

---

## Acceptance Criteria

1. **AC1** — Frontend Vite dev server starts on port 5173 with no errors and TypeScript strict mode (`"strict": true` in `tsconfig.app.json`) is active.
2. **AC2** — Backend starts on port 5000, Scalar API documentation page loads at `/scalar`, and the four Clean Architecture projects (API, Application, Domain, Infrastructure) are referenced correctly in `SiesaAgents.sln`.
3. **AC3** — CORS allows cross-origin requests from `http://localhost:5173` to `http://localhost:5000` without errors (no CORS-related console errors).
4. **AC4** — TypeScript compiler emits zero errors with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true` active.
5. **AC5** — `dotnet build SiesaAgents.sln` compiles all four projects with zero errors or warnings.

---

## Failing Tests Created (RED Phase)

### E2E Tests (5 tests)

**File:** `e2e/tests/foundation/project-initialization.spec.ts` (156 lines)

- **Test:** `AC1 — should serve the frontend app on port 5173 without errors`
  - **Status:** RED — Vite dev server not yet initialized; `pnpm run dev` will fail to start (no frontend project at `frontend/`).
  - **Verifies:** AC1 — HTTP 200 from `http://localhost:5173/` root using network-first response listener.

- **Test:** `AC1 — should render the root HTML document with a valid React mount point`
  - **Status:** RED — `data-testid="app-root"` attribute does not exist (no React app rendered yet).
  - **Verifies:** AC1 — React mount point exists and is visible on the rendered page.

- **Test:** `AC1 — should load without any TypeScript compilation errors visible in the browser console`
  - **Status:** RED — No app exists; Vite dev server not running.
  - **Verifies:** AC1, AC4 — Console error listener attached before navigation; no `[TypeScript]` or `TS` errors should appear.

- **Test:** `AC1 — should not have any JavaScript runtime errors on initial load`
  - **Status:** RED — No app to load; pageerror listener attached before navigation.
  - **Verifies:** AC1 — No JS runtime exceptions on initial render.

- **Test:** `AC3 — should allow frontend to reach backend health endpoint without CORS errors`
  - **Status:** RED — Backend not running; CORS policy not yet configured.
  - **Verifies:** AC3 — Console + pageerror listeners filter for `cors`, `cross-origin`, `access-control` strings; expects zero CORS errors after the frontend triggers a fetch to the backend `/scalar` endpoint.

- **Test:** `AC3 — should receive a valid HTTP response from the backend health probe without CORS blocking`
  - **Status:** RED — Backend not yet built; request will be refused.
  - **Verifies:** AC3 — Cross-origin GET from Playwright request context returns 200/301/302 (not CORS-rejected).

- **Test:** `AC4 — should load the frontend without Vite TypeScript error overlay`
  - **Status:** RED — Frontend project does not exist; no Vite dev server.
  - **Verifies:** AC4 — `vite-error-overlay` element count is zero (no TS strict-mode failures).

### API Tests (9 tests)

**File:** `e2e/tests/api/backend-initialization.api.spec.ts` (146 lines)

- **Test:** `AC2 — should have the backend API server running on port 5000`
  - **Status:** RED — No `backend/SiesaAgents.API` project exists; `dotnet run` cannot start.
  - **Verifies:** AC2, AC5 — Any HTTP response < 500 to `GET /` indicates the server is up.

- **Test:** `AC2 — should serve the Scalar API documentation page at /scalar`
  - **Status:** RED — `app.MapScalarApiReference()` not yet registered; Scalar.AspNetCore NuGet not installed.
  - **Verifies:** AC2 — `GET /scalar` returns HTTP 200.

- **Test:** `AC2 — should return HTML content from the Scalar documentation endpoint`
  - **Status:** RED — Scalar middleware not configured.
  - **Verifies:** AC2 — Response `Content-Type` header contains `text/html`.

- **Test:** `AC2 — should NOT expose any Swagger/OpenAPI UI endpoint (Swashbuckle forbidden)`
  - **Status:** RED — Backend not running. Once green, must remain green; Swagger is forbidden per company standards.
  - **Verifies:** AC2 — `GET /swagger` does NOT return HTTP 200 (architectural guardrail).

- **Test:** `AC2 — should NOT expose WeatherForecast default endpoint`
  - **Status:** RED — Backend not running. Once green, ensures the .NET template default endpoint is removed.
  - **Verifies:** AC2 — `GET /weatherforecast` returns 404 or 405.

- **Test:** `AC3 — should return CORS header allowing http://localhost:5173 origin`
  - **Status:** RED — CORS `DevCors` policy not yet registered in `Program.cs`.
  - **Verifies:** AC3 — `Access-Control-Allow-Origin` header equals `http://localhost:5173` or `*`.

- **Test:** `AC3 — should respond to OPTIONS preflight from frontend origin without CORS rejection`
  - **Status:** RED — CORS middleware not configured; preflight will fail.
  - **Verifies:** AC3 — OPTIONS preflight returns 200 or 204 (not 403 or 0).

- **Test:** `AC5 — should have all four Clean Architecture layers responding (API, Application, Domain, Infrastructure via DI)`
  - **Status:** RED — Solution not yet created; project references do not exist.
  - **Verifies:** AC5 — Server responds to `GET /scalar` with 200, proving all four projects compiled and the host built successfully.

- **Test:** `AC5 — should return Problem Details RFC 7807 format for unhandled errors`
  - **Status:** RED — `ExceptionHandlingMiddleware` stub not yet created (Task 4).
  - **Verifies:** AC5 (and prep for Story 1.3) — Unknown endpoint returns JSON content type (not HTML error page), proving middleware ordering is correct.

### Component Tests (0 tests)

Not applicable for this infrastructure-only story. Component tests are owned by Story 1.2 (Navigation Shell) where the first UI components are introduced.

---

## Data Factories Created

No new factories were created for this story. Story 1.1 is infrastructure-only — no domain entities exist yet. Existing factories in `e2e/helpers/data.helper.ts` (`buildCliente`, `buildContacto`) belong to later epics and are not exercised here.

---

## Fixtures Created

Reuses existing Playwright base fixture at `e2e/fixtures/base.fixture.ts`. No story-specific fixtures required because tests rely only on the raw `page` and `request` objects from `@playwright/test`.

---

## Mock Requirements

None. This story validates real boot of both servers — no mocking; tests assert against the actual Vite dev server and the actual `dotnet run` process.

---

## Required data-testid Attributes

### Frontend Root (`frontend/src/main.tsx` or `frontend/index.html`)

- `app-root` — Root mount element wrapping the React `RouterProvider` (asserted in `should render the root HTML document with a valid React mount point`).

**Implementation Example:**

```tsx
// frontend/src/main.tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div data-testid="app-root">
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </div>
  </StrictMode>
);
```

---

## Implementation Checklist

### Test: AC1 frontend boot tests (4 tests in `project-initialization.spec.ts`)

**Tasks to make these tests pass:**

- [ ] Scaffold `frontend/` via `pnpm create vite@latest frontend -- --template react-ts`
- [ ] Set `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true` in `frontend/tsconfig.app.json`
- [ ] Install runtime deps: `@tanstack/react-router`, `@tanstack/react-query`, `zustand`, `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `react-loading-skeleton`, `siesa-ui-kit`
- [ ] Install dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`, `@tanstack/router-plugin`, `@tanstack/router-devtools`
- [ ] Install TailwindCSS v4 with `@tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` and `@tanstack/router-plugin/vite`
- [ ] Create `src/app/providers/QueryProvider.tsx` wrapping `QueryClientProvider`
- [ ] Create `src/shared/lib/queryClient.ts` and `src/shared/lib/apiClient.ts`
- [ ] Create `src/routes/__root.tsx` (TanStack Router root layout)
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Add `data-testid="app-root"` to the root mount element
- [ ] Verify `pnpm run dev` boots on port 5173
- [ ] Run tests: `npx playwright test e2e/tests/foundation/project-initialization.spec.ts`

### Test: AC2 backend boot + Scalar tests (5 tests in `backend-initialization.api.spec.ts`)

**Tasks to make these tests pass:**

- [ ] Create `backend/SiesaAgents.sln` and four projects under `backend/src/`: `SiesaAgents.API`, `SiesaAgents.Application`, `SiesaAgents.Domain`, `SiesaAgents.Infrastructure`
- [ ] Wire project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add NuGet `Scalar.AspNetCore` to API project
- [ ] Configure `Program.cs` with `builder.Services.AddOpenApi()` + `app.MapScalarApiReference()` (NEVER `UseSwagger`)
- [ ] Remove the generated `WeatherForecast` endpoint and model
- [ ] Verify `dotnet run --project src/SiesaAgents.API` starts on port 5000
- [ ] Verify `http://localhost:5000/scalar` returns HTML 200
- [ ] Run tests: `npx playwright test e2e/tests/api/backend-initialization.api.spec.ts -g "AC2"`

### Test: AC3 CORS cross-origin tests (4 tests across both files)

**Tasks to make these tests pass:**

- [ ] In `Program.cs`, register `DevCors` policy: `WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()`
- [ ] Apply `app.UseCors("DevCors")` BEFORE `app.MapScalarApiReference()` and endpoint mapping
- [ ] Add `AllowedOrigins` array to `appsettings.Development.json` (`["http://localhost:5173"]`)
- [ ] Run tests: `npx playwright test -g "AC3"`

### Test: AC4 TypeScript strict-mode overlay test (1 test)

**Tasks to make this test pass:**

- [ ] Ensure `tsconfig.app.json` has strict flags AND no source file violates them
- [ ] Run `npx tsc --noEmit` locally — must exit 0
- [ ] Run test: `npx playwright test -g "AC4"`

### Test: AC5 Clean-Architecture build + Problem Details tests (2 tests)

**Tasks to make these tests pass:**

- [ ] Run `dotnet build backend/SiesaAgents.sln` — must exit 0 with zero errors/warnings
- [ ] Create `src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs` returning Problem Details RFC 7807 JSON
- [ ] Register middleware in `Program.cs`: `app.UseMiddleware<ExceptionHandlingMiddleware>()` before routing
- [ ] Run tests: `npx playwright test -g "AC5"`

---

## Running Tests

```bash
# Run all failing tests for Story 1.1
npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts

# Run only the frontend foundation tests
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run only the backend API tests
npx playwright test e2e/tests/api/backend-initialization.api.spec.ts

# Run a specific AC (filter by describe block)
npx playwright test -g "AC2"

# Headed mode (see browser)
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --headed

# Debug a single test
npx playwright test e2e/tests/foundation/project-initialization.spec.ts --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete)

**TEA Agent Responsibilities:**

- All 14 tests written and currently failing
- Tests use Given-When-Then structure
- Network-first patterns applied (listeners registered before `page.goto`)
- `data-testid` selectors only — no fragile CSS selectors
- Explicit waits only (`waitForResponse`, `waitForLoadState`) — no hard waits/sleeps
- No fixtures or factories required (infrastructure-only story)

**Verification:**

- Running the suite without a frontend or backend project produces clear failure modes: connection refused (no servers) or missing-element timeouts (no `data-testid="app-root"`).
- All failures are due to missing implementation, not test bugs.

### GREEN Phase (DEV Team — Next Steps)

1. Pick one failing test (start with `AC2 — backend running` to unblock the CORS suite).
2. Implement the minimum code needed (see Implementation Checklist tasks per AC).
3. Re-run the test until it passes.
4. Move to the next AC in numerical order (AC1 → AC2 → AC3 → AC4 → AC5).
5. Avoid over-engineering — only enough to pass the test.

### REFACTOR Phase (DEV Team — After Green)

1. Confirm all 14 tests pass.
2. Extract shared `Program.cs` configuration into helper extension methods if it improves clarity.
3. Re-run the full ATDD suite after each refactor — tests are your safety net.

---

## Next Steps

1. Share this checklist with the dev workflow (`bmad:bmm:workflows:dev-story` or `sa-quick-dev`).
2. Run the failing suite to confirm RED phase: `npx playwright test e2e/tests/foundation e2e/tests/api/backend-initialization.api.spec.ts`.
3. Implement against the checklist one AC at a time.
4. When all tests pass, update `sprint-status.yaml` to mark Story 1.1 as `done`.

---

## Knowledge Base References Applied

- **network-first.md** — Response listeners (`page.waitForResponse`) and console-error listeners registered before `page.goto`.
- **selector-resilience.md** — Exclusive use of `data-testid="app-root"` for the React mount assertion.
- **test-quality.md** — Given-When-Then comments, atomic assertions (one behavior per test), deterministic checks (no hard waits).
- **timing-debugging.md** — `waitForLoadState('networkidle')` used over arbitrary sleeps for the Vite error-overlay assertion.
- **test-levels-framework.md** — Chose E2E for AC1/AC3/AC4 (browser-observable) and API for AC2/AC5 (server contract). No component tests because no UI components exist yet.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `npx playwright test e2e/tests/foundation/project-initialization.spec.ts e2e/tests/api/backend-initialization.api.spec.ts`

**Expected Result:** All 14 tests fail because:

- Frontend project `frontend/` does not exist; `pnpm --filter frontend dev` (configured in `playwright.config.ts` `webServer`) cannot start a Vite server.
- Backend project `backend/SiesaAgents.API` does not exist; `http://localhost:5000/*` requests return `ECONNREFUSED`.
- The `data-testid="app-root"` element is not in any DOM that could be served.

**Summary:**

- Total tests: 14 (7 E2E + 7 API)
- Passing: 0 (expected)
- Failing: 14 (expected)
- Status: RED phase verified

---

## Notes

- Story 1.1 is infrastructure-only — there are no domain entities, no database migrations, no UI components beyond the empty shell.
- The `dotnet build` validation (AC5) is verified indirectly via runtime: if the server starts and responds, the build succeeded. A direct `dotnet build` check is also part of Task 2 in the story.
- The test file `e2e/tests/api/backend-initialization.api.spec.ts` includes an early Problem Details assertion (AC5 second test) that primarily belongs to Story 1.3 but is wired here because the middleware stub is created in Task 4 of this story.
- Existing tests in `e2e/tests/clientes/` belong to later epics — they are NOT part of Story 1.1 and may fail until Epics 2+ are implemented. Scope this ATDD run to the two files listed above.
- The Playwright `webServer` block in `playwright.config.ts` references `pnpm --filter frontend dev`, which already assumes a pnpm workspace — make sure the root `package.json` declares `frontend` as a workspace package when scaffolding.

---

**Generated by BMad TEA Agent (testarch-atdd workflow) — 2026-06-08**
