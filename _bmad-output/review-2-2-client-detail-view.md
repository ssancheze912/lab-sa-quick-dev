---
story_key: 2-2-client-detail-view
epic: 2
reviewer: sa-code-review (adversarial senior developer)
review_date: 2026-07-02
stepsCompleted: [1, 2, 3, 4]
verdict: PASS CON OBSERVACIONES
---

# Code Review — Story 2.2: Client Detail View

## Scope

- Story: `_bmad-output/implementation-artifacts/2-2-client-detail-view.md` (marked `implemented`).
- Git range: HEAD~1..HEAD (commit `3365771 — wip(epic-2/story-2.2): implement client detail view`).
- Files declared in Story File List vs git diff: **fully aligned** (27 files, no discrepancies).

## Git vs Story consistency

- Files in Git but not in Story: none.
- Files in Story but not in Git: none.
- Uncommitted changes: none (all clean before auto-fixes applied by this review).

## Review Findings

### High Severity

- **[HIGH] `frontend/src/shared/components/NotFoundClientePanel/NotFoundClientePanel.tsx` — heading level jump (WCAG 2.1 AA).**
  Panel used `<h3>` under the justification "avoid conflict with `<h2>{cliente.nombre}</h2>`". Actually incorrect: when `NotFoundClientePanel` renders it **replaces** `ClienteDetailView`, so the `<h2>` is not on screen. Only the sibling list panel's `<h1>Clientes</h1>` precedes this heading, meaning `<h1> → <h3>` skips a level (WCAG 2.4.6 best practice + company-standards WCAG 2.1 AA compliance).
  **AUTO-FIXED** → `<h3>` promoted to `<h2>`, with a JSDoc-style comment explaining the rationale. Existing test `NotFoundClientePanel.test.tsx` asserts `getByRole('heading', { name: /cliente no encontrado/i })` without level, so no test churn.

### Medium Severity

- **[MED] `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` — missing `encodeURIComponent` on path segment.**
  `apiClient.get(\`/api/v1/clientes/${id}\`)` interpolated the id raw. Even with the backend route constraint `{id:guid}`, defence-in-depth per OWASP requires encoding path parameters at the client. Any test that mutates `id` at runtime (e.g. fuzz / property tests) would hit issues.
  **AUTO-FIXED** → wrapped with `encodeURIComponent(id)`; comment added.

- **[MED] `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — skeleton has no accessible label.**
  `<section data-testid="cliente-detail-skeleton" aria-busy="true">` — `aria-busy` alone does not tell screen-reader users **what** is loading; the region has no `aria-label` or heading. Company standards mandate WCAG 2.1 AA (SC 4.1.3 Status Messages).
  **AUTO-FIXED** → added `aria-label="Cargando detalle del cliente"`.

- **[MED] `frontend/src/modules/crm/clientes/application/useCliente.ts` — dead code + typed error contract violation.**
  Inside `queryFn`, `throw new Error('clienteId is required')` is unreachable because `enabled: Boolean(clienteId)` gates execution. If it were ever reachable (regression), a plain `Error` is thrown while the type param is `AxiosError`, so `error.response?.status === 404` short-circuits to `undefined`, cascading to `failureCount < 2` — meaning we would retry twice on an assertion failure that no retry can fix. Prefer to remove the defensive `throw` or narrow the type to `AxiosError | Error`.
  **NOT AUTO-FIXED** — behaviour change risk. Leave for follow-up.

- **[MED] `frontend/src/shared/components/NotFoundClientePanel/NotFoundClientePanel.tsx` — `role="alert"` + `aria-live="polite"` are semantically conflicting.**
  `role="alert"` has an implicit `aria-live="assertive"`. Explicitly setting `aria-live="polite"` on the same element is a documented WAI-ARIA anti-pattern (unpredictable AT behaviour). Idiomatic alternative: use `role="status"` with `aria-live="polite"` for non-blocking notices.
  **NOT AUTO-FIXED** — story AC #5 explicitly mandates both attributes; changing would contradict the accepted AC. Flag for accessibility follow-up.

### Low Severity

- **[LOW] `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` — defensive `if (!cliente) return null`.**
  If cliente ever becomes undefined outside the pending/error branches, the whole right-hand region disappears (no `role="region"`, no landmark). Screen-reader users lose the panel entirely. Preferred: fall back to the skeleton or an empty placeholder.

- **[LOW] `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` — Problem Details `type` URL points to RFC 9110.**
  Company standards reference **RFC 7807** for Problem Details; the endpoint uses `https://tools.ietf.org/html/rfc9110#section-15.5.5` (HTTP Semantics). Not incorrect (the URL points to the 404 status definition), just inconsistent with the standard.

- **[LOW] `frontend/src/modules/crm/clientes/application/useCliente.test.tsx:84–88` — fixed `setTimeout(50)` as negative assertion.**
  Any perf regression in the test host will flake this "does not fetch when clienteId is undefined" test. Prefer `expect.poll` with a short window or count-based assertion.

## Auto-fixes Applied

| # | File | Change |
|---|------|--------|
| 1 | `frontend/src/shared/components/NotFoundClientePanel/NotFoundClientePanel.tsx` | `<h3>` → `<h2>` (heading hierarchy). |
| 2 | `frontend/src/modules/crm/clientes/infrastructure/clienteApiRepository.ts` | `encodeURIComponent(id)` wrapped path segment. |
| 3 | `frontend/src/modules/crm/clientes/presentation/ClienteDetailView.tsx` | Skeleton `<section>` given `aria-label="Cargando detalle del cliente"`. |

None of the fixes changes behaviour on the happy path; existing tests assert on `role`, `testid`, and text — not on heading level or aria-label — so they remain green.

## Pending Manual Attention

- **[MED]** Remove dead `throw` in `useCliente.queryFn` or widen the query error type (`AxiosError | Error`).
- **[MED]** Reconcile `role="alert"` + `aria-live="polite"` on `NotFoundClientePanel` with WAI-ARIA best practices — either drop `aria-live` (assertive by role) or switch to `role="status"`. Update AC #5 wording accordingly if the accessibility team confirms.
- **[LOW]** Replace `if (!cliente) return null` in `ClienteDetailView` with a defensive placeholder or skeleton to keep the landmark alive.
- **[LOW]** Align Problem Details `type` URL with RFC 7807 in `ClienteEndpoints.cs`.
- **[LOW]** Refactor `useCliente.test.tsx` negative-fetch assertion to remove `setTimeout(50)`.

## Standards Compliance Check

| Standard | Compliant | Notes |
|----------|-----------|-------|
| Clean Architecture + DDD folder structure | ✅ | Domain / Application (CQRS) / Infrastructure / API (backend) + `domain/application/infrastructure/presentation` (frontend) all populated correctly. |
| `Guid` PKs, `DateTimeOffset` timestamps | ✅ | `GetClienteByIdQuery(Guid Id)`, DTO uses `DateTimeOffset`. Unit test `HandleAsync_TimestampsRoundTripAsDateTimeOffset` explicitly guards this. |
| Minimal API + `Results.Problem` (RFC 7807) | ✅ | No controllers; 404 returned as Problem Details with correct content-type. |
| Scalar over Swagger | ✅ | `MapOpenApi()` + `MapScalarApiReference()`; no `UseSwagger()` anywhere. |
| Route constraint `{id:guid}` | ✅ | Prevents `500` on malformed segment; integration test confirms 4xx w/o stack trace. |
| Frontend text in Spanish, code in English | ✅ | Labels ("NIT/RUC", "Teléfono", "Ciudad", "Cliente no encontrado", "Volver a Clientes") + aria-labels in Spanish; source identifiers in English. |
| WCAG 2.1 AA | ⚠️ | Heading hierarchy fix applied; `role="alert"`+`aria-live="polite"` conflict remains as a story-driven choice — flagged for follow-up. |
| pnpm respected, no new deps | ✅ | No package.json diff introduced by Story 2.2. |
| Test coverage (>80% target) | ✅ | 106 frontend tests + 49 unit / 21 integration backend tests pass; 4 new integration tests + 4 unit tests + 5 component tests + 4 hook tests + 3 route integration tests added for Story 2.2 alone. |

## Verdict

**PASS CON OBSERVACIONES** — implementation matches AC #1–#9, folder structure and DDD layering are clean, tests exercise the happy path and 404 + 5xx branches, and NFR6 (no stack trace leaks) has dedicated integration tests. Three safe auto-fixes were applied (heading level, path encoding, skeleton aria-label); five lower-priority issues are documented for follow-up but do not block the story.
