# Automation Summary — Story 1.1: Project Initialization & Repository Structure

**Date:** 2026-07-08
**Story:** 1.1 — Project Initialization & Repository Structure
**Epic:** 1 — Project Foundation & Application Shell
**Mode:** BMad-Integrated (expanded existing ATDD suite)
**Coverage Target:** critical-paths + edge cases

## Context

ATDD tests already existed and were GREEN (16 tests: 7 E2E in
`e2e/tests/foundation/project-initialization.spec.ts`, 9 API in
`e2e/tests/api/backend-initialization.api.spec.ts`), covering the happy-path
acceptance criteria (AC1–AC5). This run expanded coverage with edge cases,
negative paths, and unit-level tests the ATDD suite explicitly deferred or
didn't reach.

**Infrastructure change (prerequisite):** `playwright.config.ts` only started
the frontend via `webServer`; the backend had to be running manually. Converted
`webServer` to an array so both the Vite dev server (`5173`) and
`dotnet run --project backend/src/SiesaAgents.API` (`5000`) are launched (or
reused) automatically by Playwright.

## Tests Created

### E2E Tests (P1–P2)

- `e2e/tests/foundation/frontend-shell-edge-cases.spec.ts` (4 tests, 76 lines)
  - [P1] Root document served with `text/html` content-type
  - [P2] Document title is the project title, not the Vite template default
  - [P1] No 4xx/5xx network responses during initial load
  - [P2] `app-root` remains mounted after a full page reload

### API Tests (P1–P2)

- `e2e/tests/api/backend-cors-and-error-edge-cases.api.spec.ts` (7 tests, 128 lines)
  - [P1] Disallowed origin does NOT receive `Access-Control-Allow-Origin` (simple GET)
  - [P1] Disallowed origin does NOT receive CORS access on preflight
  - [P2] Uncommon HTTP method (DELETE) preflight succeeds for the allowed origin (`AllowAnyMethod` boundary)
  - [P1] Problem Details body has RFC 7807 `status`/`title` fields for an unknown route (structural check, not just content-type)
  - [P2] Malformed JSON body does not crash the server (still 404 + JSON, not 500/HTML)
  - [P2] `/SCALAR` (uppercase) resolves the same as `/scalar` (routing case-insensitivity)
  - [P2] 5 concurrent requests to `/scalar` all succeed (stability boundary)

### Unit Tests — Backend (xUnit)

- `backend/tests/SiesaAgents.UnitTests/ExceptionHandlingMiddlewareTests.cs` (5 tests)
  - `InvokeAsync_WhenNextThrows_Returns500WithProblemJsonContentType`
  - `InvokeAsync_WhenNextThrows_DoesNotExposeExceptionMessageOrStackTrace` (security: info-disclosure boundary)
  - `InvokeAsync_WhenNextThrows_ReturnsGenericTitle`
  - `InvokeAsync_WhenNextSucceeds_PassesThroughWithoutModifyingResponse` (happy-path passthrough)
  - `InvokeAsync_WhenNextThrowsAggregateException_StillReturns500WithoutCrashing` (boundary)

  Required adding a `ProjectReference` from `SiesaAgents.UnitTests` to
  `SiesaAgents.API` (previously only referenced Application + Domain).

### Unit Tests — Frontend (Vitest)

- `frontend/src/shared/lib/apiClient.test.ts` (3 tests)
  - [P1] `baseURL` reads from `VITE_API_URL`
  - [P2] `baseURL` changes when the env var changes (not hardcoded)
  - [P2] `Content-Type` defaults to `application/json`
- `frontend/src/shared/lib/queryClient.test.ts` (2 tests)
  - [P2] Default `staleTime` is 60s (not TanStack's `0` default)
  - [P3] Singleton instance identity across imports

  Required adding `frontend/vitest.config.ts` (Node environment — no DOM
  dependency yet) and `test`/`test:watch` scripts to `frontend/package.json`,
  since no unit-test runner was wired up despite `vitest` being installed.

## Bug Found and Fixed

The new `ExceptionHandlingMiddlewareTests` immediately caught a real defect:
`ExceptionHandlingMiddleware` set `Response.ContentType = "application/problem+json"`
and then called `WriteAsJsonAsync(...)`, which **unconditionally overwrites**
`Response.ContentType` (defaulting to `application/json; charset=utf-8`) unless
a `contentType` argument is passed explicitly. The middleware was silently
never emitting the RFC 7807 media type it claimed to on the actual exception
path — only the ATDD 404 test (a different, framework-generated Problem
Details response) happened to pass because it only asserted the body
`contains('json')`, not the exact media type.

**Fix applied:** `backend/src/SiesaAgents.API/Middleware/ExceptionHandlingMiddleware.cs`
now passes `contentType: "application/problem+json"` directly to
`WriteAsJsonAsync`, with a comment explaining why the earlier `ContentType`
assignment was dead code. Verified via `dotnet test` (0 → 6 passing) and
`dotnet build` (0 warnings, 0 errors, including the new
`SiesaAgents.UnitTests → SiesaAgents.API` project reference, which required
the same `NuGetAuditSuppress` entry already used in `SiesaAgents.API.csproj`
to keep the solution build at zero warnings).

## Test Execution Results

```bash
# Playwright (chromium) — ATDD + new automation specs
npx playwright test e2e/tests/foundation e2e/tests/api --project=chromium
# 27 passed (16 ATDD + 11 new)

# Backend unit tests
cd backend && dotnet test SiesaAgents.sln
# Passed! 6/6 (1 pre-existing placeholder + 5 new)

# Frontend unit tests
cd frontend && npx vitest run
# 5/5 passed
```

No healing iterations were needed for the Playwright specs (all passed on
first run against the real, running servers — no mocks). The one backend
test failure (content-type mismatch) was root-caused to production code and
fixed directly rather than weakening the assertion, per test-quality
principles (explicit assertions, no accommodating a wrong implementation).

## Infrastructure Created/Modified

- `playwright.config.ts` — `webServer` converted to an array; backend
  (`dotnet run`, port 5000) now auto-starts/reuses alongside the frontend.
- `package.json` (root) — added `test:e2e:p0`, `test:e2e:p1`, `test:unit` scripts.
- `frontend/package.json` — added `test` (`vitest run`) and `test:watch` scripts.
- `frontend/vitest.config.ts` — new Vitest config (Node environment, `@` alias).
- `e2e/README.md` — new: run instructions, priority-tag legend, directory map,
  ATDD-vs-automation split for the foundation story.
- `backend/tests/SiesaAgents.UnitTests/SiesaAgents.UnitTests.csproj` — added
  `ProjectReference` to `SiesaAgents.API` + matching `NuGetAuditSuppress`.

## Coverage Analysis

**Total new tests:** 21 (11 Playwright E2E/API + 5 backend xUnit + 5 frontend Vitest)

- P0: 0 new (all P0 happy paths already covered by ATDD)
- P1: 6 (CORS negative cases, Problem Details structure, network-error boundary, middleware contract, apiClient env wiring)
- P2: 12 (routing/method/concurrency/malformed-body boundaries, reload stability, staleTime config)
- P3: 1 (singleton identity)
- Unclassified (xUnit, no `[Pn]` title convention in C#): 2 additional middleware boundary cases

**Coverage status:**

- All 5 acceptance criteria still GREEN (verified via full re-run, not just new tests)
- CORS negative/boundary paths now covered (previously only the positive/allowed-origin case existed)
- Problem Details format now verified structurally, and the exception path is
  now unit-tested directly (ATDD explicitly deferred this to Story 1.3)
- Frontend `apiClient`/`queryClient` configuration now has regression coverage
  (previously zero unit tests existed in the frontend project)
- Known gap (documented, not blocking): `shadcn/ui init` could not run in this
  sandbox (proxy-blocked) — no test added since no shadcn component exists yet
  in this story's scope

## Definition of Done

- [x] All tests follow Given-When-Then structure
- [x] All tests have priority tags (Playwright) or descriptive boundary names (xUnit)
- [x] No hard waits, no conditionals controlling test flow
- [x] Explicit assertions in test bodies (no hidden `expect()` in helpers)
- [x] Self-cleaning (stateless GET/OPTIONS calls and pure-function unit tests — nothing persisted)
- [x] Test files under 300 lines
- [x] Full suite runs in seconds, not minutes
- [x] README updated with run instructions and priority-tag convention
- [x] package.json scripts updated (root + frontend)
- [x] Test suite executed locally against real servers (no mocks) — all GREEN

## Next Steps

1. `bmad tea *trace` for Epic 1 to fold this coverage into the traceability matrix
2. When Story 1.3 (global error handling) lands, extend
   `ExceptionHandlingMiddlewareTests` with the richer exception taxonomy it introduces
3. Once `shadcn/ui init` is unblocked, add the first Component-level tests
