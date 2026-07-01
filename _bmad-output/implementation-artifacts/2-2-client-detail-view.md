# Story 2.2: Client Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a client by selecting them from the list,
so that I can review all their information without navigating away from the clients section.

## Acceptance Criteria

1. **Given** the client list is displayed, **When** the user clicks on a client item, **Then** the right panel shows the complete client details: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad`. **And** the URL updates to `/clientes/:clienteId` (FR30 deep linking) (Story 2.2 AC).

2. **Given** the user is on the client detail view, **When** the user accesses the URL `/clientes/:clienteId` directly (no prior in-app navigation), **Then** the correct client details are loaded and displayed (FR30, TC-E2-P1-06).

3. **Given** a `clienteId` in the URL does not exist (e.g. a well-formed UUID with no matching record), **When** the page loads, **Then** a graceful not-found message is displayed — no blank page, no unhandled JS error, no console error (TC-E2-P1-07).

4. **Given** the client list is displayed and no client is selected, **When** the user has not clicked any client item, **Then** the right panel shows an empty/default state (no client selected).

## Tasks / Subtasks

- [ ] Task 1 — Backend: `GetClienteById` query + endpoint (AC: #1, #2, #3)
  - [ ] Add `Task<ClienteEntity?> GetByIdAsync(Guid id, CancellationToken ct)` to `IClienteRepository` (`backend/src/SiesaAgents.Domain/Repositories/IClienteRepository.cs`) — extends the existing interface from Story 2.1 (do not remove/alter `GetAllAsync`).
  - [ ] Implement `GetByIdAsync` in `ClienteRepository` (`backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`) using `FirstOrDefaultAsync`. Returns `null` when not found — no exception thrown at repository level.
  - [ ] Create `GetClienteByIdQuery.cs` + `GetClienteByIdQueryHandler.cs` in `backend/src/SiesaAgents.Application/Queries/Clientes/` (CQRS pattern, mirrors `GetClientesQuery`/`GetClientesQueryHandler` from Story 2.1). Handler calls `IClienteRepository.GetByIdAsync`, maps to `ClienteDto?` (reuse existing `ClienteDto` from Story 2.1 — no new DTO needed).
  - [ ] Add `GET /api/v1/clientes/{id:guid}` to `ClienteEndpoints.cs` (`backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs`) — Minimal API, dispatches `GetClienteByIdQuery`. Returns `200 OK` with the `ClienteDto` when found; returns `404 Not Found` with Problem Details (RFC 7807, no stack trace/technical leakage per NFR6) when the handler returns `null`. Tag `.WithTags("Clientes")` per existing convention.
  - [ ] Do not modify the existing `GET /api/v1/clientes` (list) endpoint — this task is purely additive.

- [ ] Task 2 — Frontend: `useCliente(id)` hook + repository extension (AC: #1, #2, #3)
  - [ ] Add `getById(id: string): Promise<Cliente>` to `IClienteRepository.ts` (`frontend/src/modules/crm/clientes/domain/repositories/IClienteRepository.ts`) — extends the Story 2.1 interface.
  - [ ] Implement `getById` in `clienteApiRepository.ts` (`frontend/src/modules/crm/clientes/infrastructure/repositories/clienteApiRepository.ts`) — `GET /api/v1/clientes/:id` via the existing Axios instance. Let a `404` response propagate as a rejected promise (do not swallow it) so the query's `isError`/`error` state can distinguish not-found from other failures.
  - [ ] Create `useCliente.ts` in `frontend/src/modules/crm/clientes/application/hooks/` — TanStack Query hook, `queryKey: ['clientes', id]` (canonical key per architecture — array form, NOT a string), `queryFn` calls `clienteApiRepository.getById(id)`, `enabled: !!id`.

- [ ] Task 3 — Frontend: `ClienteDetailView` component (AC: #1, #2, #3, #4)
  - [ ] Create `ClienteDetailView.tsx` in `frontend/src/modules/crm/clientes/presentation/components/` — the `/clientes/:clienteId` route's right panel (`flex` per UX spec, adjacent to the existing 280px `.panel-list`). Renders:
    - Loading state: `react-loading-skeleton` placeholders (company standard: skeleton screens, not spinners) while `useCliente(clienteId)` is `isLoading`.
    - Not-found state: when the query resolves with a `404` (`error` indicates not-found, e.g. via a typed check on the Axios error status), render a graceful not-found message component/block — no raw error text, no crash (AC #3).
    - Success state: display `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad` labels with their values, in Spanish (AC #1).
  - [ ] Create/confirm an empty/default state block (AC #4) for when no `clienteId` is present — reusable inline in the route component or as a small dedicated block; no client selected → simple guidance message ("Selecciona un cliente para ver el detalle" or similar Spanish copy). Do not conflate this with the "no clients in system" `EmptyState` variant from Story 2.1 — this is a distinct "nothing selected yet" state, not tied to `EmptyState.tsx`'s existing variants.
  - [ ] Do not implement Editar/Eliminar actions or the `ContactManager` composition in this story — those belong to Stories 2.4/2.5 and Epic 4 respectively. This story is read-only detail display.

- [ ] Task 4 — Frontend: routing — `/clientes/:clienteId` + wiring selection (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/routes/_app/clientes.$clienteId.tsx` (TanStack Router file-based, `$` prefix = dynamic parameter per company convention) rendering the split-panel layout: existing `ClienteListView` (list panel, unchanged) + new `ClienteDetailView` (detail panel), passing the route's `clienteId` param to `useCliente`.
  - [ ] Update `frontend/src/routes/_app/clientes.tsx` (the base `/clientes` route, no `:clienteId`) to render `ClienteListView` alongside the "no client selected" empty/default state (AC #4) using the same split-panel composition, so navigating between `/clientes` and `/clientes/:clienteId` only swaps the right panel — do not restructure `ClienteListView` itself.
  - [ ] Wire `ClientListItem`'s existing `onClick` prop (already accepted per Story 2.1, not yet wired) in `ClienteListView.tsx` to navigate via TanStack Router's `useNavigate`/`Link` to `/clientes/:clienteId` — this is the first story to activate that prop. Preserve the `selected` prop behavior: the currently active `clienteId` (from the route param) should mark the matching `ClientListItem` as `selected`.
  - [ ] Confirm no full page reload occurs on selection (SPA navigation only, per FR28) and that typing in the search input while a client is selected does not clear the current selection/URL.

- [ ] Task 5 — Tests (AC: all)
  - [ ] Backend xUnit: `ClienteRepositoryTests` — add case for `GetByIdAsync` returning the correct entity for an existing `Id` and `null` for a non-existent `Id`.
  - [ ] Backend xUnit integration: `ClienteEndpointsTests` — `GET /api/v1/clientes/{id}` returns `200` with the correct `ClienteDto` for an existing client; returns `404` with Problem Details (no stack trace) for a non-existent UUID.
  - [ ] Frontend Vitest + RTL: `ClienteDetailView.test.tsx` — covers rendering of all four fields on success, skeleton during loading, and the not-found block when the mocked `useCliente`/MSW handler returns 404.
  - [ ] Frontend Vitest + RTL: extend `ClienteListView.test.tsx` or add a routing-level test asserting clicking a `ClientListItem` triggers navigation to `/clientes/:clienteId` with the correct id.
  - [ ] E2E (Playwright) — `e2e/tests/clientes/client-detail-view.spec.ts`: TC-E2-P1-06 (seed a client, navigate directly to `/clientes/{uuid}`, assert correct details render, no redirect to `/clientes` root) and TC-E2-P1-07 (navigate to `/clientes/00000000-0000-0000-0000-000000000000`, assert graceful not-found UI, assert zero `console.error` entries via `page.on('console')`).
  - [ ] MSW handlers: add `GET /api/v1/clientes/:id` success and 404 cases to the shared MSW handler file (`frontend/src/test/msw/handlers.ts`, established in Story 2.1).

## Dev Notes

### Scope boundary (critical)

This story delivers ONLY the read-only client detail view + deep-linking navigation. It does **not** implement:
- Editar/Eliminar actions on the detail panel (Stories 2.4/2.5)
- `ContactManager` / associated contacts display (Epic 4, Story 4.1)
- Create client form (Story 2.3)

`IClienteRepository` (backend and frontend) is extended in this story with a `GetById`/`getById` method — the existing `GetAll`/`getAll` (Story 2.1) must remain unmodified. `ClienteDto` (backend) is reused as-is; no new DTO shape is introduced.

### Previous Story Intelligence (Story 2.1)

- `frontend/src/modules/crm/clientes/{domain,application,infrastructure,presentation}` already exists (Story 2.1 scaffolded it) — this story adds files into it, does not recreate the module skeleton.
- `ClientListItem.tsx` (`frontend/src/shared/components/`) already accepts `onClick`/`selected` props "for future Story 2.2 wiring" per Story 2.1's explicit Dev Notes — this is the story that activates them. Do not change the component's prop signature; only wire the caller.
- `frontend/src/routes/_app/clientes.tsx` currently renders `<ClienteListView />` standalone (no split-panel host yet) — Story 2.1 explicitly deferred the split-panel layout composition to this story ("compose, don't rewrite").
- Backend `IClienteRepository`/`ClienteRepository`/`GetClientesQuery` (list-only) exist from Story 2.1 — this story extends the interface, it does not replace it.
- `ClienteDto` (`backend/src/SiesaAgents.Application/DTOs/ClienteDto.cs`) already has `Id`, `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt` — sufficient for the detail view, reuse directly.
- The global `queryClient` has `retry: false` on default query options (set during Story 2.1's ATDD correction) — a `404` on `useCliente` will surface as `isError` immediately without automatic retries masking it; the not-found UI must react to this correctly.
- `pnpm` is the package manager; `siesa-ui-kit` (`^1.0.250`) and `@heroicons/react` are already installed — no new dependencies anticipated for this story.
- Story 1.2/2.1 precedent: shared/cross-cutting presentational pieces go in `frontend/src/shared/components/`; module-specific views go in `modules/crm/clientes/presentation/components/`. `ClienteDetailView` is module-specific (clientes domain) — keep it under `modules/crm/clientes/presentation/components/`, matching `ClienteListView`'s location.

### Architecture References

- Route: `/clientes/:clienteId` → `ClienteDetailView` (detail + future `ContactManager`, out of scope here) — [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture, Routing]
- File-based routing dynamic param: `$` prefix (e.g. `clientes.$clienteId.tsx`) — [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- REST endpoint: `GET /api/v1/clientes/{id}` → Get by ID — [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Query key convention: `['clientes', id]` (single client) — array form mandatory, NOT string keys — [Source: _bmad-output/planning-artifacts/architecture.md#State Management / TanStack Query keys]
- `selectedClienteId` is synchronized with the URL param — no Zustand store needed (URL is the source of truth) — [Source: _bmad-output/planning-artifacts/architecture.md#State Boundaries]
- Directory structure: `modules/crm/clientes/presentation/ClienteDetailView.tsx`, `application/useCliente.ts` — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Error handling: Problem Details RFC 7807 for the 404 case; frontend must not render raw error text — [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling, NFR6]
- Layout: detail panel is `flex` (fills remaining space next to the 280px `.panel-list`) — [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries (Frontend)]
- Company stack standards (UUID PKs, `DateTimeOffset`, CQRS, Minimal API, Scalar, TanStack Query/Router, `pnpm`, skeleton loading states, Heroicons, Spanish UI text): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings (module scaffold state, deferred split-panel composition, `retry:false` query client config): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md]

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, `^1.0.250`)
- **Usage**: You MUST use `siesa-ui-kit` components for all applicable UI elements (layout primitives, labels/field display) before building custom components.
- **Constraint**: Check the `siesa-ui-kit` catalog before creating any custom element for the detail field display. If no direct equivalent exists for the field-list layout, a lightweight custom presentational block is acceptable (consistent with Story 2.1's precedent for `EmptyState`/`ErrorPanel`), but do not build a custom component for anything `siesa-ui-kit` already covers (e.g. skeleton loading uses `react-loading-skeleton` per company standard, not a custom spinner).
- Icons: Heroicons primary (already installed), consistent with Story 2.1.
- All user-facing text (field labels, not-found message, empty/default "no client selected" message) MUST be in Spanish; code identifiers (components, hooks, variables) MUST be in English.

### Testing Standards Summary

- Backend: xUnit + `WebApplicationFactory<Program>` for endpoint integration tests (200 + 404 paths); repository test may use EF Core InMemory (no FK/cascade behavior involved in a simple `GetByIdAsync`, unlike Story 2.5's delete-orphaning test).
- Frontend: Vitest + React Testing Library + MSW — no live network calls in tests.
- Coverage target: >80% per company standards.
- Test Design references (Epic 2 test plan): TC-E2-P1-06 (deep link loads correct client), TC-E2-P1-07 (non-existent id shows graceful not-found, zero console errors) — [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Cases by Priority]
- R7 (Test Design risk): deep-link not-found handling must not throw an unhandled error or render a blank page — this is the story's primary risk to mitigate; assert explicitly via `page.on('console')` in the E2E test that no error-level console entries are logged.

### Project Structure Notes

- Second story to touch `frontend/src/modules/crm/clientes/` — adds to the existing module (domain/application/infrastructure/presentation), does not create it.
- First story to add a dynamic-parameter route (`clientes.$clienteId.tsx`) to the project — establishes the pattern Story 4.3/4.4 (contact↔client navigation) and Epic 3's `contactos.$contactoId.tsx` will replicate.
- No variance from the unified project structure anticipated — directly follows the architecture's documented directory tree and routing conventions.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
