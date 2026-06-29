---
stepsCompleted: [1, 2, 3, 4, 5]
story_path: /home/user/lab-sa-quick-dev/_bmad-output/implementation-artifacts/stories/story-3.2-contact-detail-view.md
story_key: 3-2-contact-detail-view
---

# Code Review: 3-2-contact-detail-view

- **Date**: 2026-06-29
- **Reviewer**: SiesaTeam (AI Agent — Adversarial Senior Developer)
- **Status**: In Progress

## Initial Discovery

- **Undocumented Changes**: `frontend/.tanstack/` (generated dir — untracked, non-blocking), `package-lock.json` / `package.json` (root — non-project files, untracked)
- **Missing Files**: None — all story-claimed files present in git

## Review Plan

### Items to Verify
- [x] AC1: Contact detail view shows Nombre, Cargo, Teléfono, Email + URL updates
- [x] AC2: Deep-link via URL works for direct access
- [x] AC3: Not-found ("Contacto no encontrado") shown gracefully on 404
- [x] AC4: ErrorPanel with Reintentar button on backend failure
- [x] AC5: react-loading-skeleton while loading (not spinners)
- [x] AC6: "Editar" button visible (placeholder)
- [x] AC7: "Eliminar" button visible (placeholder)
- [x] Task 1: useContacto hook with correct query key ['contactos', id]
- [x] Task 2: IContactoRepository.getById / contactoApiRepository.getById
- [x] Task 3: ContactoDetailView component
- [x] Task 4: Route contactos.$contactoId.tsx + navigation from list
- [x] Task 5: Backend GET /api/v1/contactos/{id:guid} endpoint
- [x] Task 6: Unit + component + integration tests

### Focus Areas
- Navigation: ContactoListView.tsx (anchor vs Link)
- Accessibility: ContactoDetailView.tsx (Cargo <dt> label)
- Architecture: GetContactoByIdQuery.cs (no MediatR / custom handler interface)
- 404 vs 5xx differentiation: ContactoDetailView.tsx
- CancellationToken threading: GetContactoByIdQueryHandler.cs

---

## Review Findings

### High Issues (Must Fix)

- **[HIGH] Raw `<a href>` in ContactoListView causes full page reload (AC #1, Task 4)**
  File: `frontend/src/modules/crm/contactos/presentation/ContactoListView.tsx` line 70
  The story explicitly requires TanStack Router `<Link>` for SPA navigation. Using `<a href="/contactos/${contacto.id}">` causes a full browser reload on every click, defeating the SPA architecture. This is inconsistent with `ClienteListView.tsx` which correctly uses `<Link>`. The dev agent acknowledges the workaround "to avoid TanStack Router context dependency in unit tests" — but that is solved with a MemoryRouter/RouterContext wrapper in tests, not by breaking production behavior.
  **Fix**: Replace `<a href>` with TanStack Router `<Link to="/contactos/$contactoId" params={{ contactoId: contacto.id }}>`.

- **[HIGH] Cargo `<dt>` label is a broken self-closing tag with CSS pseudo-content (WCAG 2.1 AA)**
  File: `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` line 99
  `<dt aria-label="Cargo" className="... before:content-['Cargo']" />` is self-closing — the `before:content-['Cargo']` CSS pseudo-element renders content that is NOT part of the accessible text tree in all screen readers. The `aria-label="Cargo"` on the element IS accessible, but the approach is fragile, non-semantic, and fails visual rendering in browsers that honor void elements. The sibling `<dd>` has no `<dt>` text visible in DOM. All other fields use `<dt>Nombre</dt>`, `<dt>Teléfono</dt>` as plain text — this one is inconsistent for no real reason (the comment says "to avoid text collision" which is unfounded).
  **Fix**: Replace with `<dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cargo</dt>`.

### Medium Issues (Should Fix)

- **[MED] GetContactoByIdQueryHandler ignores CancellationToken (threading/performance)**
  File: `backend/src/SiesaAgents.Application/Contactos/Queries/GetContactoByIdQueryHandler.cs` line 8
  `HandleAsync(GetContactoByIdQuery query)` does not accept a `CancellationToken` parameter and calls `repository.GetByIdAsync(query.Id)` without passing one. The `IContactoRepository.GetByIdAsync` signature has `CancellationToken ct = default`, so this is not a compiler error, but the handler interface `IGetContactoByIdQueryHandler` is missing cancellation support. On a cancelled HTTP request (user navigates away), the EF Core query continues executing until completion — wasting DB connections.
  **Fix**: Add `CancellationToken ct = default` to `HandleAsync` and forward it to `GetByIdAsync`.

- **[MED] ContactoDetailView uses inline `onClick={() => refetch()}` — unnecessary lambda wrapper**
  File: `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx` line 46
  `onClick={() => refetch()}` creates a new function reference on every render. The correct pattern (matching AC #4 and Story dev notes) is `onClick={refetch}` directly, since `refetch` already has the correct `() => Promise<QueryObserverResult>` signature compatible with a click handler.
  **Fix**: Change to `onClick={refetch}`.

### Low Issues (Suggestions)

- **[LOW] useContacto.ts sets `staleTime: 0` — defeats TanStack Query cache sharing intent**
  File: `frontend/src/modules/crm/contactos/application/useContacto.ts` line 9
  Story dev notes explicitly state: "This ensures the detail view benefits from cache population if the list was already fetched." With `staleTime: 0`, TanStack Query marks data stale immediately, triggering a background refetch even when data was just fetched by the list query. Either remove `staleTime: 0` (defaults to 0 in TQ5, so it's a no-op but misleading), or set a positive value like `staleTime: 30_000` to get the documented cache benefit.

- **[LOW] ContactoByIdEndpointTests: each TC-1 variant creates its own `ContactoByIdWebApplicationFactory` — inconsistent fixture usage**
  File: `backend/tests/SiesaAgents.IntegrationTests/Contactos/ContactoByIdEndpointTests.cs` lines 92, 169
  `TC1_GetContactoById_Returns200_WithContactoDto` and `TC1_GetContactoById_Returns_ContentTypeApplicationJson` both create new factories inline instead of using the class fixture (`IClassFixture<ContactoByIdWebApplicationFactory>`). This is inconsistent — some tests use `_client` (from the fixture), others use `scopedClient` (local factory). Not a correctness issue but raises setup debt and wastes test-run time with redundant factory startup.

- **[LOW] Missing `aria-live` region for dynamic state changes in ContactoDetailView**
  File: `frontend/src/modules/crm/contactos/presentation/ContactoDetailView.tsx`
  When state transitions from loading → error → data, screen readers may not announce the change. Adding `aria-live="polite"` on the container or using a visually-hidden status announcement would fully satisfy WCAG 2.1 AA 4.1.3 (Status Messages). Not blocking for MVP but noted for accessibility completeness.

---

## Fix Outcome

- **Action Taken**: Fixed automatically
- **Fixed Count**: 4
  1. [HIGH] `ContactoListView.tsx`: Replaced `<a href>` with TanStack Router `<Link to="/contactos/$contactoId" params={...}>` — SPA navigation restored
  2. [HIGH] `ContactoDetailView.tsx` line 99: Replaced broken self-closing `<dt aria-label>` with `<dt>Cargo</dt>` — accessible semantic markup restored
  3. [MED] `ContactoDetailView.tsx` line 46: Replaced `onClick={() => refetch()}` with `onClick={refetch}` — removes unnecessary lambda allocation
  4. [MED] `GetContactoByIdQuery.cs` + `GetContactoByIdQueryHandler.cs` + `ContactosEndpoints.cs`: Added `CancellationToken ct = default` through the handler chain — cancellation token forwarding complete
- **Task Count**: 0
- **Recommended Status**: done (all ACs satisfied, all High/Med issues fixed)

## Status Sync
- **Story File Status**: Updated to done
- **Sprint Status YAML**: Synced — 3-2-contact-detail-view -> done
