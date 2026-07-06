# E2E Test Suite — Siesa Agents CRM

Playwright test suite covering frontend (Vite, port 5173) and backend (.NET 10, port 5000).

## Structure

```
e2e/
├── fixtures/       # Shared Playwright fixtures (test.extend)
├── helpers/        # ApiHelper (REST calls) and data builders
├── pages/          # (Story-specific page helpers — no page object classes)
├── tests/
│   ├── foundation/  # Story 1.1 — frontend init, E2E level
│   ├── api/         # Story 1.1 — backend init, API level
│   ├── config/      # Story 1.1 — static config/structure verification (unit-equivalent)
│   └── clientes/    # Later epics
```

## Priority Tagging

Every test name is tagged with a priority:

- **[P0]** — Critical path, run every commit
- **[P1]** — High priority, run before merging to main
- **[P2]** — Medium priority, run nightly
- **[P3]** — Low priority, on-demand / exploratory

## Running Tests

```bash
# All tests
npm run test:e2e

# By priority
npm run test:e2e:p0   # P0 only
npm run test:e2e:p1   # P0 + P1

# By level
npm run test:api      # API-level specs only
npm run test:config   # Static config/structure checks (no dev servers needed)

# Single file
npx playwright test e2e/tests/foundation/project-initialization.spec.ts

# Headed / debug
npx playwright test --headed
npx playwright test --debug
```

## Conventions

- Given-When-Then structure in every test body.
- `data-testid` selectors preferred over CSS classes.
- No hard waits (`waitForTimeout`) — use network-first interception (route registered before `goto`) or explicit locator waits.
- No page object classes — fixtures handle setup/teardown, tests stay direct.
- Tests in `e2e/tests/config` read repository files directly (no browser, no dev servers) for fast, deterministic checks of build/config facts (e.g. `tsconfig.app.json` strict flags, `SiesaAgents.sln` project references).
