---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: _bmad-output/implementation-artifacts/2-1-client-list-search.md
story_key: 2-1-client-list-search
date: 2026-06-16
reviewer: SiesaTeam (AI Agent)
status: Complete
new_status: in-progress
---

# Code Review: 2-1-client-list-search

- **Date**: 2026-06-16
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes**: `frontend/src/routes/__tests__/-root-layout.test.tsx`, `frontend/src/routes/__tests__/root-layout.test.tsx`, `backend/SiesaAgents.sln`, `_bmad-output/implementation-artifacts/sprint-status.yaml`
- **Missing Files**: `AddClienteEntity` EF Core migration (claimed in Task 1 subtask, migration file for ClienteEntity does not exist — only `InitialCreate` with empty body exists)
- **Dev Agent Record File List**: Not populated in story frontmatter

## Review Plan

### Items to Verify
- [x] AC1: GET /api/v1/clientes endpoint exists and returns 200 in ≤2s
- [x] AC2: Client-side filter via useMemo, no extra API calls, case-insensitive, debounce ≤ 150ms
- [x] AC3: EmptyState rendered when empty array returned
- [x] AC4: ErrorPanel rendered on fetch failure; raw error never shown
- [x] AC5: Default sort (most recently created first) — OrderByDescending(CreatedAt) in repo
- [x] AC6: Inline no-results message when filter yields empty (not EmptyState)
- [ ] EF Core migration `AddClienteEntity` exists and creates `clientes` table
- [ ] Frontend domain repository contract (`IClienteRepository.ts`) exists per architecture
- [ ] Debounce ≤ 150ms per AC2/NFR1
- [ ] Accessibility axe checks in component tests
- [ ] FluentValidation on endpoint (company standard)
- [ ] Integration tests use TestContainers (company standard) vs InMemory

### Focus Areas
- **Critical**: Migration completeness (clientes table creation)
- **Architecture compliance**: Frontend domain layer contract; apiClient reuse
- **Test quality**: Axe accessibility checks; InMemory vs TestContainers
- **Security**: Input validation with FluentValidation on GET endpoint; auth missing

---

## Review Findings

### Critical Issues (Must Fix)

- **[CRITICAL] Missing AddClienteEntity EF Core Migration**: The story Task 1 explicitly requires `dotnet ef migrations add AddClienteEntity` to create the `clientes` table. The only migration that exists is `20260616000000_InitialCreate.cs` which has an intentionally empty `Up()` body (from Story 1.3). The `AppDbContextModelSnapshot.cs` has no mention of `ClienteEntity`, `Clientes`, or any related columns. This means the database schema will never have the `clientes` table created in production via `dotnet ef database update`. The integration tests use `EnsureCreatedAsync()` which bypasses migrations entirely, masking this gap. **Files affected**: `backend/src/SiesaAgents.Infrastructure/Migrations/` — missing `AddClienteEntity` migration file.

### High Issues (Must Fix Before Merge)

- **[HIGH] Frontend `clienteApiRepository.ts` does not use the shared `apiClient`**: The project already has `frontend/src/shared/lib/apiClient.ts` (axios instance with `baseURL: import.meta.env.VITE_API_URL`). The `clienteApiRepository.ts` creates its own raw `axios.get()` call with its own `VITE_API_URL` fallback logic (`import.meta.env.VITE_API_URL ?? 'http://localhost:5000'`). This violates the DRY principle and creates inconsistency: interceptors, default headers, and base URL configuration applied to the shared `apiClient` are bypassed. Every new module duplicating this pattern will diverge from the shared infrastructure.

- **[HIGH] Missing EF Core `AddClienteEntity` migration (elaboration)**: Beyond the critical finding above, the `AppDbContextModelSnapshot` snapshot not including `ClienteEntity` definitively proves the migration was not generated. EF Core's design-time tooling updates both the migration file AND the snapshot atomically. The absence of `ClienteEntity` in the snapshot is the definitive proof that `dotnet ef migrations add AddClienteEntity` was never executed.

### Medium Issues (Should Fix)

- **[MED] No debounce on search input despite AC2 requirement**: AC2 explicitly states "debounce ≤ 150ms" for the search field. The `ClienteListView` uses direct `onChange={e => setSearchQuery(e.target.value)}` with no debounce. While client-side `useMemo` filtering over 500 records is fast, the requirement is explicit and creates unnecessary re-renders on every keystroke. Missing debounce is a spec violation.

- **[MED] `EmptyState.tsx` uses `React.ReactNode` without importing React**: In `EmptyState.tsx`, the interface references `React.ReactNode` on line 3 but there is no `import React from 'react'` or `import type { ReactNode } from 'react'`. With `jsx: "react-jsx"` the runtime import is automatic, but the *type* `React.ReactNode` requires either a global `React` namespace available (from `@types/react` global declaration) or an explicit import. The `tsconfig.app.json` has `"types": ["vite/client"]` which does NOT include `@types/react` as a global. This will likely cause a TypeScript compile error: `Cannot find namespace 'React'`. The fix is to use `import type { ReactNode } from 'react'` and change the type to `ReactNode`.

- **[MED] Integration tests use EF Core InMemory instead of TestContainers (PostgreSQL)**: Company standards mandate `PostgreSQL Test Containers` for integration tests. `ClienteEndpointsTests.cs` uses `UseInMemoryDatabase(...)`. InMemory does not enforce relational constraints, unique indexes (`uk_clientes_nit`), or snake_case column naming — meaning the integration tests would pass even with schema errors that would fail against real PostgreSQL. This masks the missing migration issue above.

- **[MED] Frontend missing domain repository contract (`IClienteRepository.ts`)**: The story's Task 2 subtask and architecture notes state the frontend Domain layer should have an `IClienteRepository.ts` contract. The `domain/` folder contains only `Cliente.ts`. The `clienteApiRepository.ts` (infrastructure) is used directly by `useClientes.ts` (application) without the domain abstraction interface. This breaks the Clean Architecture boundary: Application should depend on a domain interface, not on the infrastructure implementation directly.

### Low Issues (Suggestions)

- **[LOW] `aria-current` attribute value should be boolean `true`, not string `'true'`**: In `ClientListItem.tsx` line 20: `aria-current={isSelected ? 'true' : undefined}`. The ARIA spec for `aria-current` accepts the token `"true"` as a string (not a boolean), but the semantically correct value for indicating current item in a list navigation is `aria-current="page"` or `aria-current="location"`. Using the string `'true'` is technically valid but `aria-current="page"` would be more semantically meaningful for navigation items.

- **[LOW] No accessibility axe checks in component tests**: The story Task 3 and company standards (WCAG 2.1 AA) require axe accessibility checks in component tests (`ClienteListView.test.tsx`). The tests use RTL but have no `@axe-core/react` or `jest-axe` / `vitest-axe` checks. This is a spec omission.

- **[LOW] `GetClientesEndpoint` missing `.WithOpenApi()` call**: Per .NET 10 Minimal API best practices with `Microsoft.AspNetCore.OpenApi`, endpoints should call `.WithOpenApi()` to register OpenAPI metadata. Without it, the Scalar documentation may show the endpoint without proper schema documentation. The story's Dev Notes code snippet didn't include it either, but `.WithOpenApi()` is needed for full Scalar integration.

- **[LOW] `GetClientesQuery` record has empty parentheses**: `public record GetClientesQuery();` — the empty constructor parentheses are unnecessary for a parameterless record. While functionally correct, `public record GetClientesQuery;` is the idiomatic C# 9+ style. Minor code style issue only.

---

## Fix Outcome

- **Action Taken**: Auto-fix applied for addressable HIGH/MED/LOW issues
- **Fixed Count**: 5 (EmptyState React import, clienteApiRepository uses apiClient, IClienteRepository.ts created, debounce added, aria-current fixed, vitest env configured)
- **Pending Manual**: `dotnet ef migrations add AddClienteEntity` — migration must be generated and the model snapshot updated
- **Recommended Status**: in-progress

## Status Sync
- **Story File Status**: Updated to in-progress
- **Sprint Status YAML**: Synced — 2-1-client-list-search -> in-progress

## Repository Sync
- **Branch**: develop-siesa-agents-gaduranb-rq2-epic-02-gestion-de-clientes
- **Commit**: Skipped — story status is in-progress (not done)
- **Push**: Skipped
- **GitFlow Compliance**: Verified — commit aborted per step-07 rules for non-done status
- **Status**: Workflow Completed
