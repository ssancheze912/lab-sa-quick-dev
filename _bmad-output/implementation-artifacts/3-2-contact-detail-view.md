# Story 3.2: Contact Detail View

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to view the complete details of a contact by selecting them from the list,
so that I can review all their information at once.

## Acceptance Criteria

1. **Given** the contact list is displayed, **When** the user clicks on a contact item, **Then** the right panel shows the complete contact details: `Nombre`, `Cargo`, `Teléfono`, `Email` (FR13). **And** the URL updates to `/contactos/:contactoId` (FR30 deep linking).

2. **Given** the user accesses `/contactos/:contactoId` directly via URL (no prior in-app navigation), **When** the page loads, **Then** the correct contact details are displayed (FR30, TC-E3-P1-06).

3. **Given** a `contactoId` in the URL does not exist (e.g. a well-formed UUID with no matching record), **When** the page loads, **Then** a graceful not-found message is displayed — no blank page, no unhandled JS error, no console error (TC-E3-P1-07, R5).

4. **Given** the contact list is displayed and no contact is selected, **When** the user has not clicked any contact item, **Then** the right panel shows an empty/default state (no contact selected).

## Tasks / Subtasks

- [ ] Task 1 — Backend: `GetContactoById` query + endpoint (AC: #1, #2, #3)
  - [ ] Add `Task<ContactoEntity?> GetByIdAsync(Guid id, CancellationToken ct)` to `IContactoRepository` (`backend/src/SiesaAgents.Domain/Repositories/IContactoRepository.cs`) — extends the existing interface from Story 3.1 (do not remove/alter `GetAllAsync`).
  - [ ] Implement `GetByIdAsync` in `ContactoRepository` (`backend/src/SiesaAgents.Infrastructure/Repositories/ContactoRepository.cs`) using `FirstOrDefaultAsync`. Returns `null` when not found — no exception thrown at repository level.
  - [ ] Create `GetContactoByIdQuery.cs` + `GetContactoByIdQueryHandler.cs` in `backend/src/SiesaAgents.Application/Queries/Contactos/` (flat `Application/{Kind}/{Domain}/` convention, confirmed on-disk in Story 3.1 — CQRS pattern, mirrors `GetContactosQuery`/`GetContactosQueryHandler`). Handler calls `IContactoRepository.GetByIdAsync`, maps to `ContactoDto?` (reuse the existing `ContactoDto` from Story 3.1 — no new DTO needed).
  - [ ] Add `GET /api/v1/contactos/{id:guid}` to `ContactoEndpoints.cs` (`backend/src/SiesaAgents.API/Endpoints/ContactoEndpoints.cs`) — Minimal API, dispatches `GetContactoByIdQuery`. Returns `200 OK` with the `ContactoDto` when found; returns `404 Not Found` with Problem Details (RFC 7807, no stack trace/technical leakage per NFR6) when the handler returns `null`. Tag `.WithTags("Contactos")`, name `"GetContactoById"`, matching existing convention. `UseStatusCodePages` middleware (already registered in `Program.cs`) automatically shapes a `404` into RFC 7807 — no new error-handling code needed (same as Story 2.2's precedent).
  - [ ] Do not modify the existing `GET /api/v1/contactos` (list) endpoint — this task is purely additive.
  - [ ] Register `GetContactoByIdQueryHandler` in DI (`Program.cs`), alongside the existing `GetContactosQueryHandler` registration.

- [ ] Task 2 — Frontend: `useContacto(id)` hook + repository extension (AC: #1, #2, #3)
  - [ ] Add `getById(id: string): Promise<Contacto>` to `IContactoRepository.ts` (`frontend/src/modules/crm/contactos/domain/repositories/IContactoRepository.ts`) — extends the Story 3.1 interface (currently only has `getAll`). Do not change `getAll`'s signature.
  - [ ] Implement `getById` in `contactoApiRepository.ts` (`frontend/src/modules/crm/contactos/infrastructure/repositories/contactoApiRepository.ts`) — `GET /api/v1/contactos/:id` via the existing Axios instance. Let a `404` response propagate as a rejected promise (do not swallow it) so the query's `isError`/`error` state can distinguish not-found from other failures.
  - [ ] Create `useContacto.ts` in `frontend/src/modules/crm/contactos/application/hooks/` — TanStack Query hook, `queryKey: ['contactos', id]` (canonical key per architecture — array form, NOT a string), `queryFn` calls `contactoApiRepository.getById(id)`. Accept an `{ enabled }` option parameter (mirrors `useCliente`'s signature from Story 2.2) so the caller can hold off the by-id request while list membership is still resolving.

- [ ] Task 3 — Frontend: `ContactoDetailView` component (AC: #1, #2, #3, #4)
  - [ ] Create `ContactoDetailView.tsx` in `frontend/src/modules/crm/contactos/presentation/components/` — the `/contactos/:contactoId` route's right panel (`flex`, adjacent to the existing `.panel-list` rendered by `ContactoListView`). Renders:
    - Empty/default state (AC #4): when no `contactoId` is provided, show a "Selecciona un contacto para ver el detalle" (or equivalent Spanish copy) block — a distinct "nothing selected yet" state, not tied to `EmptyState.tsx`'s `no-contacts`/`search-empty` variants (same distinction Story 2.2 established for clients).
    - Loading state: `react-loading-skeleton` placeholders (company standard: skeleton screens, not spinners) while `useContacto(contactoId)` is `isLoading`.
    - Not-found state: when the query resolves with a `404` (check via `isAxiosError(error) && error.response?.status === 404`), render a graceful not-found message block — no raw error text, no crash (AC #3).
    - Success state: display `Nombre`, `Cargo`, `Teléfono`, `Email` labels with their values, in Spanish (AC #1).
  - [ ] Accept an optional `listMembership?: 'pending' | 'present' | 'missing'` prop (default `'present'`), mirroring `ClienteDetailView`'s exact pattern from Story 2.2. This is REQUIRED to avoid a real browser-level `console.error` "Failed to load resource" log for a doomed 404 request when navigating to a non-existent `contactoId` (Chromium logs this at the network layer regardless of axios/React Query handling — not suppressible via interceptors; verified empirically in Story 2.2's ATDD correction). When `listMembership` is `'missing'`, render the not-found block immediately without issuing the by-id request (pass `enabled: false` to `useContacto`). When `'pending'`, show the skeleton and hold off the request.
  - [ ] Do NOT implement Editar/Eliminar actions in this story — those belong to Stories 3.4/3.5 respectively. This story is read-only detail display (unlike `ClienteDetailView`, which already has Editar/Eliminar wired from Stories 2.4/2.5 — `ContactoDetailView` must NOT copy those buttons/dialogs yet, only the display structure).
  - [ ] Do NOT implement associated-client display/link — that belongs to Epic 4 (FR22, Story 4.4). `ContactoDto`/`Contacto` already carries `clienteId`, but this story's UI does not render it.

- [ ] Task 4 — Frontend: routing — `/contactos/:contactoId` + wiring selection (AC: #1, #2, #3, #4)
  - [ ] Create `frontend/src/routes/_app/contactos.$contactoId.tsx` (TanStack Router file-based, `$` prefix = dynamic parameter per company convention) rendering `ContactoDetailView`, passing the route's `contactoId` param. Compute `listMembership` the same way `clientes.$clienteId.tsx` does: call `useContactos()` (sibling panel already fetches the full list under `['contactos']`), derive `'pending'` while `!isSuccess`, else `'present'`/`'missing'` based on whether `contactoId` is found in the resolved list.
  - [ ] Create `frontend/src/routes/_app/contactos.index.tsx` rendering `<ContactoDetailView />` with no `contactoId` (empty/default state, AC #4) — mirrors `clientes.index.tsx`.
  - [ ] Restructure `frontend/src/routes/_app/contactos.tsx` from its current leaf-route form (renders `<ContactoListView />` standalone) into a parent/child composition: render `<ContactoListView />` + `<Outlet />` inside a `flex h-full` wrapper, exactly mirroring `clientes.tsx`'s restructuring in Story 2.2 (a leaf-style parent route without `<Outlet/>` prevents the `$contactoId` child route's params from ever reaching the detail view in this TanStack Router version — this is the exact regression Story 2.2 already diagnosed and fixed for `clientes`). Add `notFoundComponent: NotFoundView` (reuse `frontend/src/shared/components/NotFoundView.tsx`, already created in Story 2.2) so 404s under `/contactos/*` keep bubbling correctly.
  - [ ] Wire `ContactListItem`'s existing `onClick` prop (already accepted per Story 3.1, currently NOT called anywhere in `ContactoListView.tsx`) in `ContactoListView.tsx` to navigate via TanStack Router's `useNavigate` to `/contactos/$contactoId` — this is the first story to activate that prop. Preserve the `selected` prop: the currently active `contactoId` (from the route param, via `useRouterState`, mirroring `ClienteListView`'s exact derivation) should mark the matching `ContactListItem` as `selected`. **Known Epic 2 issue to avoid repeating** (see `_bmad-output/implementation-artifacts/review-2-2-client-detail-view.md` finding #7): do not derive `selected` with a loose regex like `pathname.match(/^\/contactos\/(.+)$/)`, which would mis-mark a list item as selected if a future sibling static route appears under `/contactos/` (e.g. Story 3.3's create entry point). Scope the match to the actual `$contactoId` route.
  - [ ] Confirm no full page reload occurs on selection (SPA navigation only, per FR28) and that typing in the search input while a contact is selected does not clear the current selection/URL.

- [ ] Task 5 — Tests (AC: all)
  - [ ] Backend xUnit: `ContactoRepositoryTests` — add case for `GetByIdAsync` returning the correct entity for an existing `Id` and `null` for a non-existent `Id`.
  - [ ] Backend xUnit integration: `ContactoEndpointsTests` — `GET /api/v1/contactos/{id}` returns `200` with the correct `ContactoDto` for an existing contact; returns `404` with Problem Details (no stack trace) for a non-existent UUID.
  - [ ] Frontend Vitest + RTL: `ContactoDetailView.test.tsx` — covers rendering of all four fields on success, skeleton during loading, not-found block when the mocked `useContacto`/MSW handler returns 404, and the empty/default state when no `contactoId` is passed.
  - [ ] Frontend Vitest + RTL: extend `ContactoListView.test.tsx` or add a routing-level test asserting clicking a `ContactListItem` triggers navigation to `/contactos/:contactoId` with the correct id.
  - [ ] E2E (Playwright) — `e2e/tests/contactos/contact-detail-view.spec.ts`: TC-E3-P1-06 (seed a contact via the backend, navigate directly to `/contactos/{uuid}`, assert correct details render, no redirect to `/contactos` root) and TC-E3-P1-07 (navigate to `/contactos/00000000-0000-0000-0000-000000000000`, assert graceful not-found UI, assert zero `console.error` entries via `page.on('console')`). Note: seeding a contact for E2E currently requires either direct DB insertion or the `POST /api/v1/contactos` endpoint, which does not exist until Story 3.3 — if run before 3.3 in this pipeline, use a direct `AppDbContext`/DB seed helper (same fallback Story 3.1 used for its schema-reuse regression test), not the POST endpoint.
  - [ ] MSW handlers: add `GET /api/v1/contactos/:id` success and 404 cases to the shared MSW handler file (`frontend/src/test/msw/handlers.ts`, established in Story 3.1).

## Dev Notes

### Scope boundary (critical)

This story delivers ONLY the read-only contact detail view + deep-linking navigation. It does **not** implement:
- Editar/Eliminar actions on the detail panel (Stories 3.4/3.5)
- Associated client display/link (Epic 4, Story 4.4 — FR22)
- Create contact form (Story 3.3)

`IContactoRepository` (backend and frontend) is extended in this story with a `GetById`/`getById` method — the existing `GetAll`/`getAll` (Story 3.1) must remain unmodified. `ContactoDto` (backend) is reused as-is; no new DTO shape is introduced.

### Previous Story Intelligence (Stories 3.1, 2.2, 2.5)

- `frontend/src/modules/crm/contactos/{domain,application,infrastructure,presentation}` already exists (Story 3.1 scaffolded it) — this story adds files into it, does not recreate the module skeleton.
- `ContactListItem.tsx` (`frontend/src/shared/components/`) already accepts `onClick`/`selected` props (Story 3.1, currently inert — `ContactoListView.tsx` renders `<ContactListItem key={contacto.id} contacto={contacto} />` with neither prop wired). This is the story that activates them. Do not change the component's prop signature; only wire the caller.
- `frontend/src/routes/_app/contactos.tsx` currently renders `<ContactoListView />` standalone (leaf route, no split-panel host, no `<Outlet/>`) — Story 3.1 explicitly deferred the split-panel layout composition to this story, exactly like Story 2.1 deferred it to 2.2 for clients.
- **Story 2.2 (Client Detail View) is the exact structural template for this story** — same problem (detail view + deep link + not-found), same solution shape (`useCliente`/`ClienteDetailView`/`clientes.$clienteId.tsx`/`clientes.index.tsx`). Replicate its patterns verbatim for Contacto:
  - The `listMembership` prop pattern on `ClienteDetailView.tsx` exists specifically to avoid a real browser-level console error on a doomed 404 request — this is REQUIRED here too for AC #3/TC-E3-P1-07 (zero console errors), not optional polish.
  - The `clientes.tsx` → parent-with-`<Outlet/>` restructuring (Story 2.2 Completion Notes) is mandatory for the same TanStack Router reason: a leaf-style parent route without `<Outlet/>` prevents child route params from reaching the detail view.
  - `NotFoundView.tsx` (`frontend/src/shared/components/`) already exists (created in Story 2.2) — reuse it as `notFoundComponent` for the `contactos` route tree, do not create a new one.
- Backend `IContactoRepository`/`ContactoRepository`/`GetContactosQuery` (list-only) exist from Story 3.1 — this story extends the interface, it does not replace it.
- `ContactoDto` (`backend/src/SiesaAgents.Application/DTOs/ContactoDto.cs`) already has `Id`, `Nombre`, `Cargo`, `Telefono`, `Email`, `ClienteId` (nullable), `CreatedAt` — sufficient for the detail view, reuse directly.
- The global `queryClient` has `retry: false` on default query options (Story 2.1) — a `404` on `useContacto` will surface as `isError` immediately without automatic retries masking it.
- Known Epic 2 review follow-up NOT yet fixed on `ClienteListView.tsx`: the `selected` derivation uses a loose regex (`pathname.match(/^\/clientes\/(.+)$/)`) that would mis-match future sibling static routes. Do not copy this exact pattern into `ContactoListView.tsx` — scope the `selected` check specifically to the `$contactoId` route match from the start (see Task 4).
- `pnpm` is the package manager; `siesa-ui-kit` (`^1.0.250`), `@heroicons/react`, `react-loading-skeleton` are already installed — no new dependencies anticipated for this story.
- Module-specific views go in `modules/crm/contactos/presentation/components/`; `ContactoDetailView` follows `ContactoListView`'s location, matching the `clientes` module precedent.

### Architecture References

- Route: `/contactos/:contactoId` → `ContactoDetailView` — [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture, Routing]
- File-based routing dynamic param: `$` prefix (e.g. `contactos.$contactoId.tsx`) — [Source: .claude/agent-memory/sa-quick-dev/company-standards.md#TanStack Router Prefixes]
- REST endpoint: `GET /api/v1/contactos/{id}` → Get by ID — [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- Query key convention: `['contactos', id]` (single contact) — array form mandatory, NOT string keys — [Source: _bmad-output/planning-artifacts/architecture.md#State Management / TanStack Query keys]
- Directory structure: `modules/crm/contactos/presentation/ContactoDetailView.tsx`, `application/useContacto.ts` — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure, lines 496-498]
- Backend directory structure (actual on-disk convention, confirmed Epic 2/3.1): flat `Application/Queries/Contactos/GetContactoByIdQuery.cs`/`GetContactoByIdQueryHandler.cs` (not the doc's illustrative nested `Application/Contactos/Queries/` tree) — [Source: _bmad-output/implementation-artifacts/3-1-contact-list-search.md#Architecture References]
- Error handling: Problem Details RFC 7807 for the 404 case; frontend must not render raw error text — [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling, NFR6]
- Layout: detail panel is `flex` (fills remaining space next to the `.panel-list`) — [Source: _bmad-output/planning-artifacts/architecture.md#Component Boundaries (Frontend)]
- Company stack standards (UUID PKs, `DateTimeOffset`, CQRS, Minimal API, Scalar, TanStack Query/Router, `pnpm`, skeleton loading states, Heroicons, Spanish UI text): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings (Story 2.2's exact structural template — `listMembership` pattern, `<Outlet/>` restructuring, `NotFoundView` reuse, `selected`-derivation pitfall): [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]
- Story 3.1 learnings (module scaffold state, `ContactListItem.onClick` deferred to this story, `ContactoDto`/query key conventions): [Source: _bmad-output/implementation-artifacts/3-1-contact-list-search.md]
- Epic 3 Test Design (R5 deep-link risk, TC-E3-P1-06/07, note #7 canonical query key): [Source: _bmad-output/implementation-artifacts/test-design-epic-3.md]

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, `^1.0.250`)
- **Usage**: You MUST use `siesa-ui-kit` components for all applicable UI elements before building custom components.
- **Constraint**: This is a read-only detail display only (no CRUD grid/form composition in this story), NOT a `MasterCrud`-orchestrated screen — do not introduce `MasterCrud` here, consistent with Story 2.2's precedent. Check the `siesa-ui-kit` catalog for a field-list/label-value layout primitive first; if none exists, a lightweight custom `<dl>` block is acceptable (same precedent `ClienteDetailView.tsx` established — no `siesa-ui-kit` equivalent existed for it).
- Icons: Heroicons primary (already installed) — `UserCircleIcon`/`ExclamationTriangleIcon` equivalents for the empty/not-found states, mirroring `ClienteDetailView.tsx`.
- Loading: `react-loading-skeleton` (company standard), not a custom spinner.
- All user-facing text (field labels, not-found message, empty/default "no contact selected" message) MUST be in Spanish; code identifiers (components, hooks, variables) MUST be in English.

### Testing Standards Summary

- Backend: xUnit + `WebApplicationFactory<Program>` for endpoint integration tests (200 + 404 paths); repository test may use EF Core InMemory (no FK/cascade behavior involved in a simple `GetByIdAsync`).
- Frontend: Vitest + React Testing Library + MSW — no live network calls in tests.
- Coverage target: >80% per company standards.
- Test Design references (Epic 3 test plan): TC-E3-P1-06 (deep link loads correct contact), TC-E3-P1-07 (non-existent id shows graceful not-found, zero console errors) — [Source: _bmad-output/implementation-artifacts/test-design-epic-3.md#4. Test Cases by Priority]
- R5 (Test Design risk): deep-link not-found handling must not throw an unhandled error or render a blank page — mitigate via the `listMembership` pattern (Task 3) that avoids ever issuing a doomed by-id request for a known-missing id; assert explicitly via `page.on('console')` in the E2E test that no error-level console entries are logged.
- Non-negotiable constraint (Epic 3 Test Design §10, item 7): the `['contactos']` query key must be reused consistently — `useContacto` must key off `['contactos', id]`, not a divergent string key, so future mutation hooks (3.3/3.4/3.5) invalidate correctly.

### Project Structure Notes

- Second story to touch `frontend/src/modules/crm/contactos/` — adds to the existing module (domain/application/infrastructure/presentation), does not create it.
- Second dynamic-parameter route in the project (`contactos.$contactoId.tsx`), directly replicating the pattern `clientes.$clienteId.tsx` established in Story 2.2.
- No variance from the unified project structure anticipated — directly follows the architecture's documented directory tree and routing conventions, and Story 2.2's already-proven implementation of the equivalent feature for `clientes`.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
