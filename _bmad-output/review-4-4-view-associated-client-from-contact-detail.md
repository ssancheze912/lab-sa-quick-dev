---
stepsCompleted: [1, 2, 3]
story_path: _bmad-output/implementation-artifacts/stories/4-4-view-associated-client-from-contact-detail.md
story_key: 4-4-view-associated-client-from-contact-detail
---

# Code Review: 4-4-view-associated-client-from-contact-detail

- **Date**: 2026-05-21
- **Reviewer**: SiesaTeam (AI Agent)
- **Status**: In Progress

## Initial Discovery

- **Story Status**: review (reviewable)
- **Git Branch**: develop-siesa-agents-gaduranb-rq4-asociacion-cliente-contacto
- **Story 4.4 Implementation Commit**: aec20b8 (feat(story-4.4): display associated client in contact detail with navigation)
- **Undocumented Changes**: Several files from previous stories (4.2, backend commands, adapters) appear as unstaged/staged in working tree — these predate story 4.4 and are NOT part of this story's scope.
- **Missing Files**: None — all story-claimed files are present and verified in the story 4.4 commit.

### Files Verified from Story Dev Agent Record

| File | Action | Git Status |
|------|--------|-----------|
| `frontend/src/modules/crm/contactos/presentation/ContactoDetailPanel.tsx` | Modified | Committed in aec20b8 |
| `frontend/src/modules/crm/contactos/presentation/__tests__/ContactoDetailPanel.cliente.test.tsx` | Created | Committed in aec20b8 |
| `e2e/pages/contactos.page.ts` | Modified | Committed in aec20b8 |
| `e2e/tests/asociacion/asociacion-navegacion.spec.ts` | Modified | Committed in aec20b8 |

---

## Review Plan

### Items to Verify

- [x] AC1: Contact with clienteId shows client name via useClienteById hook
- [x] AC2: Client name is a TanStack Router Link pointing to /clientes/$clienteId (1 click)
- [x] AC3: Contact without clienteId shows "Sin cliente asignado" text
- [x] Task 1: ContactoDto.ClienteId (Guid?) present — verified
- [x] Task 2: GET /api/v1/clientes/{id} endpoint present — verified
- [x] Task 3: useClienteById hook present with correct queryKey ['clientes', id]
- [x] Task 4: ContactoDetailPanel updated with Cliente section
- [x] Task 5: ContactosPage POM updated with clienteAsociadoLink and sinClienteAsignado
- [x] Task 6: E2E-AC-13, E2E-AC-14, E2E-AC-15 added to spec

### Focus Areas

- Code quality: ContactoDetailPanel.tsx (imports, rendering logic)
- Test quality: Unit tests, E2E assertions
- Accessibility: WCAG 2.1 AA compliance on Link element
- Standards compliance: Spanish UI text, TanStack Router, skeleton vs spinner

---

## Review Findings

### Medium Issues (Should Fix)

- **[MED-01] Duplicate TanStack Router import lines** — `ContactoDetailPanel.tsx` lines 3–4 contain two separate `import` statements from `@tanstack/react-router` (`useRouter` and `Link` imported separately). This violates standard TypeScript import hygiene and is inconsistent with the rest of the codebase. Should be: `import { useRouter, Link } from '@tanstack/react-router'`. AUTO-FIXED.

- **[MED-02] E2E-AC-15: weak negative assertion (.not.toBeVisible vs .not.toBeAttached)** — Line 321 of `asociacion-navegacion.spec.ts` uses `await expect(page.getByTestId('clienteAsociadoLink')).not.toBeVisible()`. The story requirement is "assert `clienteAsociadoLink` not present in DOM". If the element exists but is hidden (e.g., CSS `display:none` or `visibility:hidden`), `.not.toBeVisible()` passes but `.not.toBeAttached()` would fail. The correct assertion for DOM absence is `.not.toBeAttached()` — this is what the story requires and what Playwright best practices recommend for "not in DOM" semantics. AUTO-FIXED.

### Low Issues (Nice to Fix)

- **[LOW-01] E2E-AC-14: missing cliente-detail-panel visibility assertion** — The story test description states to "assert client detail panel visible (data-testid='cliente-detail-panel' or equivalent)" after navigation to `/clientes/:clienteId`. The current test only checks the URL, not that the client detail panel rendered. This is a weak end-to-end assertion — the URL could match but the panel could still be loading. The `ClienteDetailView` has `data-testid="cliente-detail-panel"`. Adding a `await expect(page.getByTestId('cliente-detail-panel')).toBeVisible()` assertion would fully validate AC2. AUTO-FIXED.

- **[LOW-02] useClienteById hook called before contact data is loaded — correct but could be clearer** — In `ContactoDetailPanel.tsx`, `useClienteById(data?.clienteId ?? undefined)` is always called regardless of contact loading state. While this is technically safe (enabled: !!id prevents the request when undefined), calling a hook with undefined due to a pending parent query is a subtle pattern. This is by design (React hooks cannot be conditional) and the `enabled: !!id` guard is correct. **No fix needed** — documented as informational.

### Compliance Checks

- DateTimeOffset: ContactoDto uses `DateTimeOffset` — PASS
- UUID PKs: ContactoEntity.Id = Guid.NewGuid() — PASS
- FluentValidation: AssignClienteToContactoValidator present — PASS
- Spanish UI text: "Cliente", "Sin cliente asignado" — PASS
- WCAG 2.1 AA: aria-label="Ir al cliente asociado" on Link — PASS
- TanStack Router Link (not <a href>): PASS
- react-loading-skeleton (not spinner): PASS
- Siesa Blue color #0e79fd on link: PASS
- data-testid consistency: "clienteAsociadoLink" matches POM — PASS
- Error handling: KeyNotFoundException → 404 via global middleware — PASS
- staleTime on useClienteById: 5 min present — PASS
- queryKey as array ['clientes', id]: PASS

---

## Fix Outcome

- **Action Taken**: Auto-fixed
- **Fixed Count**: 3
- **Task Count**: 0
- **Recommended Status**: done

---

## Status Sync

- **Story File Status**: Updated to done
- **Sprint Status YAML**: Synced

---

## Repository Sync

- **Branch**: develop-siesa-agents-gaduranb-rq4-asociacion-cliente-contacto
- **Commit**: Performed
- **Push**: Skipped (no remote configured)
- **GitFlow Compliance**: Verified
- **Status**: Workflow Completed Successfully
