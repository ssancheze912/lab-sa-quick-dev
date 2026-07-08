# E2E Test Suite — Siesa Agents CRM

Playwright test suite covering the frontend (`http://localhost:5173`) and backend
(`http://localhost:5000`) started automatically via `playwright.config.ts`
(`webServer` array — both the Vite dev server and `dotnet run` for
`SiesaAgents.API` are launched/reused for you).

## Running Tests

```bash
# Run the full suite (all browsers configured in playwright.config.ts)
pnpm run test:e2e

# Run by priority (tag convention: [P0] [P1] [P2] [P3] in the test title)
pnpm run test:e2e:p0   # Critical paths only
pnpm run test:e2e:p1   # P0 + P1 (pre-merge gate)

# Run a specific file
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Run against a single browser project
npx playwright test --project=chromium

# Debug a specific test
npx playwright test --debug -g "should serve the frontend app"
```

Frontend unit tests (Vitest) live next to the source under `frontend/src/**/*.test.ts`:

```bash
pnpm run test:unit
```

Backend unit tests (xUnit) live under `backend/tests/SiesaAgents.UnitTests`:

```bash
cd backend && dotnet test SiesaAgents.sln
```

## Directory Structure

```
e2e/
├── fixtures/     # Playwright test.extend() fixtures (auto-cleanup patterns)
├── helpers/      # ApiHelper (direct REST calls) and data factories
├── pages/        # Page objects for feature areas with real UI (clientes, contactos)
└── tests/
    ├── foundation/  # Story 1.1 — project shell (frontend init, TS strict mode)
    ├── api/         # Backend API-level tests (no browser)
    └── clientes/    # Feature CRUD flows
```

Foundation-story tests are intentionally split between ATDD (happy-path acceptance
criteria, generated during `*atdd`) and automation-expansion specs (edge cases,
negative paths, boundary conditions, generated during `*automate`):

- `project-initialization.spec.ts` / `backend-initialization.api.spec.ts` — ATDD (AC-driven)
- `frontend-shell-edge-cases.spec.ts` — response headers, document metadata, reload stability
- `backend-cors-and-error-edge-cases.api.spec.ts` — CORS negative cases, Problem Details
  structure, routing case-insensitivity, malformed body handling, concurrency

## Priority Tags

- **[P0]**: Critical paths — must always pass, run every commit
- **[P1]**: High priority — run on PR to main
- **[P2]**: Medium priority — edge cases, run nightly
- **[P3]**: Low priority — exploratory, run on-demand

## Conventions

- No page objects for simple flows — only introduce one (see `pages/`) once a
  feature has enough real UI interaction to justify it.
- Network-first: register `waitForResponse`/`page.route()` **before** navigating.
- No hard waits (`waitForTimeout`) — use explicit response/element-state waits.
- Every test is self-cleaning (fixtures with teardown, or API-created records
  deleted at the end of the test).
