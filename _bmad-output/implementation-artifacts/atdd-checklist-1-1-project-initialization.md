---
story: "1.1"
title: "Project Initialization & Repository Structure"
epic: "1 — Project Foundation & Application Shell"
phase: atdd-red
createdAt: "2026-05-24"
status: red
---

# ATDD Checklist — Story 1.1: Project Initialization & Repository Structure

## Story Context

As a developer, I want the frontend (Vite react-ts) and backend (.NET 10 Clean Architecture)
projects initialized with all required dependencies, so that the team has a working development
environment with both servers running.

---

## Acceptance Criteria Coverage

| AC | Description | Test Level | Test File | Tests | Status |
|----|-------------|-----------|-----------|-------|--------|
| AC1 | `pnpm run dev` starts Vite on port 5173 with no errors; TypeScript strict mode enabled | E2E (Playwright) | `e2e/tests/foundation/story-1-1-project-initialization.spec.ts` | 4 | RED |
| AC2 | `dotnet run` starts backend on port 5000; Scalar loads at `/scalar`; 4 CA projects in solution | API (Playwright request) | `e2e/tests/api/story-1-1-backend-initialization.api.spec.ts` | 5 | RED |
| AC3 | CORS allows requests from `http://localhost:5173` without errors | API (Playwright request) | `e2e/tests/api/story-1-1-backend-initialization.api.spec.ts` | 4 | RED |
| AC4 | TypeScript compiler emits zero errors with `strict:true`, `noImplicitAny:true`, `strictNullChecks:true` | E2E (Playwright) | `e2e/tests/foundation/story-1-1-project-initialization.spec.ts` | 2 | RED |
| AC5 | `dotnet build SiesaAgents.sln` compiles all four projects with zero errors or warnings | API (Playwright request, indirect) | `e2e/tests/api/story-1-1-backend-initialization.api.spec.ts` | 2 | RED |

**Total tests: 17**

---

## Test Inventory

### E2E Tests — `e2e/tests/foundation/story-1-1-project-initialization.spec.ts`

| # | Test Name | AC | Given | When | Then |
|---|-----------|-----|-------|------|------|
| 1 | should respond with HTTP 200 on the root path | AC1 | Clean dev machine, pnpm run dev executed | Browser navigates to http://localhost:5173/ | Server responds with HTTP 200 |
| 2 | should render the React root mount point (data-testid="app-root") | AC1 | Vite dev server running | DOM is ready at root URL | `[data-testid="app-root"]` is visible |
| 3 | should serve a valid HTML document with a non-empty page title | AC1 | Vite dev server on port 5173 | Navigating to root URL | Page title is non-empty (compile succeeded) |
| 4 | should have no JavaScript runtime exceptions on initial page load | AC1 | Frontend initialized with all dependencies | App renders for the first time | Zero `pageerror` events are emitted |
| 5 | should not show Vite TypeScript error overlay on the root page | AC4 | tsconfig.app.json has strict:true, noImplicitAny:true, strictNullChecks:true | Vite compiles and serves the app | `vite-error-overlay` has count 0 |
| 6 | should not emit TypeScript compilation error messages in the browser console | AC4 | TypeScript strict mode enabled | Page loads | Zero TS error messages in console |

### API Tests — `e2e/tests/api/story-1-1-backend-initialization.api.spec.ts`

| # | Test Name | AC | Given | When | Then |
|---|-----------|-----|-------|------|------|
| 7 | should have the backend API server reachable on port 5000 | AC2 | .NET 10 backend project created, dotnet run executed | GET http://localhost:5000/ | Response status < 500 (server is up) |
| 8 | should serve the Scalar API documentation page at /scalar with HTTP 200 | AC2 | Scalar.AspNetCore installed, app.MapScalarApiReference() in Program.cs | GET http://localhost:5000/scalar | HTTP 200 |
| 9 | should return HTML content-type from the Scalar documentation endpoint | AC2 | MapScalarApiReference() wired correctly | GET /scalar | Content-Type contains text/html |
| 10 | should NOT expose a /swagger endpoint (Swashbuckle is explicitly forbidden) | AC2 | Architecture mandates Scalar ONLY | GET http://localhost:5000/swagger | Status is NOT 200 |
| 11 | should NOT expose the default WeatherForecast scaffolding endpoint | AC2 | Backend created from `dotnet new webapi` template | GET /weatherforecast | HTTP 404 or 405 |
| 12 | should return Access-Control-Allow-Origin header allowing the frontend origin | AC3 | Both servers running, CORS "DevCors" policy configured | GET /scalar with Origin: http://localhost:5173 | Access-Control-Allow-Origin == http://localhost:5173 |
| 13 | should respond to CORS OPTIONS preflight with 200 or 204 | AC3 | CORS middleware applied before endpoint mapping | OPTIONS /scalar with preflight headers | HTTP 200 or 204 |
| 14 | should include Access-Control-Allow-Methods in the OPTIONS preflight response | AC3 | CORS policy configured with .AllowAnyMethod() | OPTIONS preflight | Access-Control-Allow-Methods is non-empty |
| 15 | should allow preflight requests for the Content-Type request header | AC3 | CORS policy configured with .AllowAnyHeader() | OPTIONS with Content-Type request header | Access-Control-Allow-Headers is non-empty |
| 16 | should have the server running — proving SiesaAgents.sln compiled successfully | AC5 | SiesaAgents.sln references 4 CA projects | dotnet build + dotnet run, GET /scalar | HTTP 200 (server started = build succeeded) |
| 17 | should return Problem Details RFC 7807 format for requests to non-existent endpoints | AC5 | ExceptionHandlingMiddleware registered in Program.cs | GET /api/nonexistent-endpoint-atdd-probe | Content-Type contains json; status 404 or 400 |

---

## RED Phase Verification

All tests MUST fail (RED) before any implementation begins. The following conditions cause RED state:

| Test # | RED Condition |
|--------|---------------|
| 1-6 | Frontend not initialized — `pnpm create vite` not yet run; localhost:5173 returns ECONNREFUSED |
| 7-11 | Backend not initialized — `dotnet run` not yet executed; localhost:5000 returns ECONNREFUSED |
| 12-15 | CORS policy not configured in Program.cs |
| 16 | Backend solution not built (any of the 4 CA projects failing dotnet build) |
| 17 | ExceptionHandlingMiddleware not registered in Program.cs |

---

## Implementation Checklist (turn GREEN)

### Frontend (AC1, AC4)

- [ ] Run `pnpm create vite@latest frontend -- --template react-ts`
- [ ] Configure `tsconfig.app.json` with `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`
- [ ] Install runtime dependencies: `pnpm add @tanstack/react-router @tanstack/react-query zustand axios react-hook-form zod @hookform/resolvers react-loading-skeleton siesa-ui-kit`
- [ ] Install dev dependencies: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom msw @tanstack/router-plugin @tanstack/router-devtools`
- [ ] Install TailwindCSS v4: `pnpm add tailwindcss @tailwindcss/vite`
- [ ] Configure `vite.config.ts` with `@tailwindcss/vite` and `@tanstack/router-plugin/vite`
- [ ] Add `data-testid="app-root"` to the root element in `index.html` or main component
- [ ] Create `src/main.tsx` wiring `RouterProvider` inside `QueryProvider`
- [ ] Create `.env.development` with `VITE_API_URL=http://localhost:5000`
- [ ] Verify `pnpm run dev` starts on port 5173 — tests 1-6 must turn GREEN

### Backend (AC2, AC3, AC5)

- [ ] Create `dotnet new sln -n SiesaAgents`
- [ ] Create four CA projects (API, Application, Domain, Infrastructure)
- [ ] Add all projects to `SiesaAgents.sln`
- [ ] Add project references: API → Application → Domain; API → Infrastructure → Domain
- [ ] Add `Scalar.AspNetCore` NuGet to `SiesaAgents.API`
- [ ] Configure `Program.cs`:
  - [ ] `builder.Services.AddCors` with policy allowing `http://localhost:5173`
  - [ ] `app.UseMiddleware<ExceptionHandlingMiddleware>()` BEFORE routing
  - [ ] `app.UseCors("DevCors")` BEFORE endpoint mappings
  - [ ] `app.MapScalarApiReference()` — NOT `app.UseSwagger()`
- [ ] Remove default WeatherForecast endpoints and models
- [ ] Create `ExceptionHandlingMiddleware` returning Problem Details RFC 7807
- [ ] Verify `dotnet build SiesaAgents.sln` exits 0 — tests 16-17 must turn GREEN
- [ ] Verify `dotnet run` starts on port 5000 — tests 7-15 must turn GREEN

---

## Test Execution Commands

```bash
# Run all Story 1.1 ATDD tests
npx playwright test e2e/tests/foundation/story-1-1-project-initialization.spec.ts
npx playwright test e2e/tests/api/story-1-1-backend-initialization.api.spec.ts

# Run both together
npx playwright test --grep "AC[1-5]" e2e/tests/foundation/story-1-1 e2e/tests/api/story-1-1

# Run with UI reporter
npx playwright test e2e/tests/foundation/story-1-1-project-initialization.spec.ts --reporter=html
```

---

## Definition of Done for Story 1.1

- [ ] All 17 ATDD tests pass (GREEN)
- [ ] `pnpm run dev` starts Vite on port 5173 without TypeScript errors
- [ ] `dotnet run` starts .NET on port 5000 with Scalar at `/scalar`
- [ ] CORS preflight and actual requests from localhost:5173 succeed without errors
- [ ] `dotnet build SiesaAgents.sln` exits with code 0 and zero errors
- [ ] No `app.UseSwagger()` in Program.cs (violation of company standards)
- [ ] `ExceptionHandlingMiddleware` registered BEFORE endpoint mapping

---

## References

- Story: `_bmad-output/implementation-artifacts/1-1-project-initialization-repository-structure.md`
- Epic: `_bmad-output/planning-artifacts/epics/epic-01-foundation.md`
- Test Design: `_bmad-output/implementation-artifacts/test-design-epic-1.md`
- Company Standards: `.claude/agent-memory/sa-quick-dev/company-standards.md`
- Playwright Config: `playwright.config.ts`
