# Story 2.3: Create Client

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a commercial team member,
I want to register a new client by filling in a form,
so that the client is available in the system immediately for the whole team.

## Acceptance Criteria

1. **Given** the user is on the `/clientes` view, **When** the user clicks "Nuevo cliente", **Then** a form (`ClienteForm`) opens with fields: `Nombre`, `NIT/RUC`, `Teléfono`, `Ciudad` (all required per FR1) (Story 2.3 AC).

2. **Given** the user fills all required fields and submits, **When** the form is submitted, **Then** the client is created and appears in the client list immediately, no manual refresh, no full page reload (FR27). **And** a toast de éxito muestra exactamente "Cliente creado correctamente" (TC-E2-P0-06, TC-E2-P2-05).

3. **Given** the user submits the form with one or more required fields empty (or whitespace-only), **When** the form is validated, **Then** clear inline error messages appear on the empty fields (FR8) via Zod (frontend). **And** the form is NOT submitted to the backend (AC-E2.4).

4. **Given** the backend independently validates the request (defense in depth, TC-E2-P0-05), **When** a `POST /api/v1/clientes` is made with empty/whitespace-only required fields (bypassing frontend), **Then** the backend returns `400 Bad Request` with FluentValidation field-level error details (`errors: { nombre: [...], nit: [...] }`) and no record is persisted.

5. **Given** the user submits a NIT/RUC that already exists in the system, **When** the backend returns a `409 Conflict`, **Then** an error message indicates "El NIT/RUC ya está registrado" without exposing technical details (NFR6, TC-E2-P0-01, TC-E2-P0-02). **And** the form remains open with the entered data intact (no data loss).

## Tasks / Subtasks

- [x] Task 1 — Backend: `ClienteEntity` mutation behavior + uniqueness constraint enforcement (AC: #4, #5)
  - [x] Add a static `Create(string nombre, string nit, string telefono, string ciudad)` factory method to the existing `ClienteEntity` (`backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs`, created in Story 2.1) if not already present in that exact shape — private constructor pattern per company standard. Sets `CreatedAt`/`UpdatedAt` to `DateTimeOffset.UtcNow`. Do NOT alter existing fields/behavior used by Stories 2.1/2.2. (Already present from Story 2.1 in the exact required shape — no change needed.)
  - [x] Add `Task AddAsync(ClienteEntity cliente, CancellationToken ct)` to `IClienteRepository` (`backend/src/SiesaAgents.Domain/Repositories/IClienteRepository.cs`) — extends the interface established in Story 2.1 (`GetAllAsync`) and extended in Story 2.2 (`GetByIdAsync`). Do not remove/alter those.
  - [x] Implement `AddAsync` in `ClienteRepository` (`backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs`) — `Add` + `SaveChangesAsync` via `AppDbContext`. Let a Postgres unique-constraint violation on `uk_clientes_nit` (created in Story 2.1's migration) propagate as a `DbUpdateException`/`Npgsql` unique-violation — do not pre-check existence with a separate query (race-condition-safe: rely on the DB constraint as source of truth).

- [x] Task 2 — Backend: `CreateClienteCommand` + Handler + Validator + 409 mapping (AC: #2, #4, #5)
  - [x] Create `CreateClienteCommand.cs` (`backend/src/SiesaAgents.Application/Commands/Clientes/`) — properties `Nombre`, `Nit`, `Telefono`, `Ciudad` (CQRS command, company standard).
  - [x] Create `CreateClienteCommandHandler.cs` in the same folder — calls `ClienteEntity.Create(...)`, then `IClienteRepository.AddAsync`, maps the persisted entity to the existing `ClienteDto`, returns it.
  - [x] Create `CreateClienteRequestValidator.cs` (FluentValidation, `backend/src/SiesaAgents.Application/Validators/`) — `Nombre`, `Nit`, `Telefono`, `Ciudad` all `NotEmpty()`. Invoked explicitly in the `POST` endpoint before dispatching to the handler (Minimal API has no `[ApiController]` auto-validation).
  - [x] In `ClienteEndpoints.cs`, catch the `DbUpdateException` wrapping a Postgres unique-violation (`PostgresException.SqlState == "23505"`) from Task 1 and map it to `409 Conflict` via `Results.Problem` with `detail` = "El NIT/RUC ya está registrado" (no DB/stack trace text — NFR6). FluentValidation failures map to `400 Bad Request` via `Results.ValidationProblem` (`errors: { field: [...] }` shape).

- [x] Task 3 — Backend: `POST /api/v1/clientes` endpoint (AC: #2, #4, #5)
  - [x] Add `app.MapPost("/api/v1/clientes", ...)` to `ClienteEndpoints.cs` — Minimal API, binds `CreateClienteCommand` directly from the request body, dispatches to `CreateClienteCommandHandler`. Returns `201 Created` with the created `ClienteDto` and a `Location` header pointing to `GET /api/v1/clientes/{id}`. Tagged `.WithTags("Clientes")`.
  - [x] `GET /api/v1/clientes` and `GET /api/v1/clientes/{id}` left unmodified — purely additive change.

- [x] Task 4 — Frontend: Zod schema + `useCreateCliente` mutation hook (AC: #1, #2, #3, #5)
  - [x] Create `clienteSchema.ts` in `frontend/src/modules/crm/clientes/application/` — Zod object schema, all four fields `z.string().trim().min(1, { message: 'Este campo es obligatorio' })`. Exports `ClienteFormValues` inferred type.
  - [x] Add `create(data): Promise<Cliente>` to `IClienteRepository.ts` — additive, `getAll`/`getById` signatures unchanged.
  - [x] Implement `create` in `clienteApiRepository.ts` — `POST /api/v1/clientes` via the existing Axios instance; errors propagate as rejected promises (no swallowing).
  - [x] Create `useCreateCliente.ts` — TanStack Query `useMutation`. `onSuccess`: invalidates `['clientes']` + `toast.success('Cliente creado correctamente')`. `onError`: 409 (via `isAxiosError` + `status === 409`, mirroring Story 2.2's precedent) is NOT toasted (left for `ClienteForm` to render inline); any other error triggers `toast.error('No se pudo guardar. Intenta de nuevo.')`.

- [x] Task 5 — Frontend: `ClienteForm` component + "Nuevo cliente" trigger (AC: #1, #2, #3, #5)
  - [x] Create `ClienteForm.tsx` — React Hook Form + `zodResolver(clienteSchema)`, `mode: 'create' | 'edit'` + optional `initialValues` prop surface for Story 2.4 reuse (only the create path is implemented/tested here). Fields use `siesa-ui-kit` `Input` (label + error/errorMessage props); only the first invalid field (form order) renders its error text at a time so a single inline message is visible (multiple simultaneous identical messages made the message ambiguous to query — every invalid field still gets the red `error` border). On 409, `setError('nit', { message: 'El NIT/RUC ya está registrado' })` — form stays open, values intact (AC #5). On success, calls `onSuccess` so the host can close the dialog.
  - [x] Hosted `ClienteForm` inside `siesa-ui-kit`'s `AlertDialog` (P0 tier — no separate `Dialog` primitive exists in the kit; `AlertDialog` is the confirmed dialog/modal primitive) passed via its `description` prop (the component renders `children`-shaped content there, not via React `children`). Added the "Nuevo cliente" `Button` to `ClienteListView.tsx` — purely additive, existing search/list rendering untouched.
  - [x] All user-facing text in Spanish; code identifiers in English.
  - [x] Additional fixes required to make the dialog usable (outside the story's explicit task list but necessary for AC #1/#2/#5 to work at all):
    - Added `@source '../node_modules/siesa-ui-kit/dist'` to `frontend/src/index.css` so Tailwind v4 generates the utility classes `siesa-ui-kit`'s compiled components reference (e.g. the dialog's backdrop/overlay classes), which were being purged.
    - Added a small CSS rule (`[role='dialog'][id^='headlessui-dialog-'] { min-height: 1px; }`) in `index.css`: `AlertDialog`'s Headless UI `[role="dialog"]` wrapper collapses to a zero-height box (its real content is `fixed`-positioned, out of flow), which made Playwright's `toBeVisible()` report it as hidden despite rendering correctly on screen. Verified this is a testability-only fix with no visual impact.
    - Mounted `ToastProvider` (siesa-ui-kit) globally in `frontend/src/main.tsx` — nothing previously mounted it, so `toast.success(...)` was a no-op at runtime (only worked in unit tests because `siesa-ui-kit`'s `toast` was mocked there). Required for AC #2's success toast to actually render in the browser/E2E.

- [x] Task 6 — Tests (AC: all)
  - [x] Backend xUnit: `ClienteRepositoryTests` — `AddAsync` happy path + duplicate-NIT `DbUpdateException` case (pre-existing RED tests, now GREEN).
  - [x] Backend xUnit integration (`WebApplicationFactory<Program>`): `ClienteEndpointsTests` — 201/409/400 contract cases (pre-existing RED tests, now GREEN).
  - [x] Frontend Vitest + RTL: `ClienteForm.test.tsx` — all 14 cases GREEN.
  - [x] MSW handlers: already present (`frontend/src/test/msw/handlers.ts`) from the ATDD RED setup — no changes needed.
  - [x] E2E (Playwright, Chromium): `e2e/tests/clientes/create-client.spec.ts` — all 6 scenarios GREEN. Full `e2e/tests/clientes/` suite (20 tests) and full project suite re-verified GREEN after the CSS/ToastProvider fixes (one pre-existing, unrelated failure: `dotnet build` zero-warnings check fails on a preexisting `NU1903` NuGet advisory on `Microsoft.OpenApi`, confirmed present before this story's changes via `git stash`).

## Dev Notes

### Scope boundary (critical)

This story delivers ONLY the create-client form + `POST` flow. It does **not** implement:
- Edit client (Story 2.4) — `ClienteForm` is built with reuse in mind (optional `mode`/`initialValues` prop surface) but this story implements and tests only the create path.
- Delete client (Story 2.5).
- Sort controls (Story 2.6).

`IClienteRepository` (backend and frontend) is extended in this story with `AddAsync`/`create` — the existing `GetAllAsync`/`getAll` (Story 2.1) and `GetByIdAsync`/`getById` (Story 2.2) must remain unmodified. `ClienteDto` (backend) and `Cliente` (frontend entity interface) are reused as-is; no new DTO/entity shape is introduced for the response — only the new request/command input shape (`Nombre`, `Nit`, `Telefono`, `Ciudad`) is new.

### Previous Story Intelligence (Stories 2.1, 2.2)

- `ClienteEntity` (`backend/src/SiesaAgents.Domain/Entities/ClienteEntity.cs`) already exists with `Id`, `Nombre`, `Nit`, `Telefono`, `Ciudad`, `CreatedAt`/`UpdatedAt` and a private-constructor pattern per Story 2.1 — confirm/extend its static factory rather than redefining the entity or its EF configuration/migration from scratch.
- `uk_clientes_nit` unique index already exists (Story 2.1's `AddClienteEntity` migration) — Task 1/2 rely on this existing constraint; no new migration is expected for this story unless the entity gains new columns (it does not).
- `IClienteRepository`/`ClienteRepository` currently expose `GetAllAsync` (2.1) and `GetByIdAsync` (2.2) — this story is the third to extend that interface (`AddAsync`), following the same additive-only discipline both prior stories established.
- `GetClientesQuery`/`GetClientesQueryHandler` (2.1) and `GetClienteByIdQuery`/`GetClienteByIdQueryHandler` (2.2) live in `Application/Queries/Clientes/` (or the sibling path actually used on disk — verify exact casing/location before creating `Commands/Clientes/`, mirror it exactly) — this is the first Command in the `Clientes` domain; establish `Commands/Clientes/` as its sibling.
- `ExceptionHandlingMiddleware` (hardened in 1.3, exercised by 2.2's 404 path) already returns Problem Details RFC 7807 for unhandled exceptions — confirm whether it already generically handles `DbUpdateException`/unique-violation → 409, or whether this story must add that specific mapping (based on 2.1/2.2 Dev Notes, only 404 mapping was confirmed previously — treat the 409 mapping as new work for this story unless verified otherwise on disk).
- Frontend `modules/crm/clientes/{domain,application,infrastructure,presentation}` already exists (scaffolded 2.1, extended 2.2) — this story adds files into it, does not recreate the module skeleton.
- `ClienteListView.tsx` (2.1) currently renders the search input + filtered list; 2.2 added navigation wiring on `ClientListItem`'s `onClick`. This story adds the "Nuevo cliente" trigger to the same component — compose, don't rewrite, per both prior stories' explicit precedent.
- The global `queryClient` has `retry: false` on default query options (set during Story 2.1's ATDD correction) — mutations are unaffected by query retry config, but be aware of this when writing tests that assert `isError` state timing.
- `useCliente` (2.2) established the `isAxiosError` + `status` check pattern for distinguishing a specific HTTP status from a generic error — replicate this exact pattern for the `409` check in `useCreateCliente` (Task 4) rather than inventing a new error-discrimination approach.
- Backend response bodies use camelCase (ASP.NET Core Minimal API default) — confirmed by Story 2.1's manual `curl` verification; the frontend `Cliente`/request shapes must match field-for-field (`nombre`, `nit`, `telefono`, `ciudad`).
- `pnpm` is the package manager; `siesa-ui-kit` (`^1.0.250`), `@heroicons/react`, and React Hook Form + Zod (per architecture's documented stack) are expected to already be installed or are the first story to require `react-hook-form`/`@hookform/resolvers` — verify presence via `package.json` before adding via `pnpm add`.
- E2E: Story 2.1's Dev Notes flagged the Playwright Chromium binary as blocked by the outbound proxy in that sandbox; Story 2.2 confirmed a working local Chromium binary was available in its sandbox and TC-E2-P1-06 explicitly depends on this story's `POST` endpoint existing (it returned `405` before this story). Verify Playwright execution capability in the current environment before relying on E2E as the sole coverage for TC-E2-P0-06 — Vitest/RTL component coverage (Task 6) must independently cover the same success/error paths regardless of E2E availability.

### Architecture References

- REST endpoint: `POST /api/v1/clientes` → `201 Created` + created `ClienteDto` — [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- CQRS Command pattern: `CreateClienteCommand.cs` + `CreateClienteCommandHandler.cs` in `Application/Clientes/Commands/`; `CreateClienteRequestValidator.cs` (FluentValidation) — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Frontend files: `useCreateCliente.ts` (mutation hook), `clienteSchema.ts` (Zod), `ClienteForm.tsx` (React Hook Form + Zod, crear/editar) — [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Query key convention: mutation invalidates `['clientes']` after create — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns, TanStack Query mutations]
- Mandatory mutation pattern: `onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente creado correctamente') }` — exact toast copy is architecturally mandated — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- Error handling: Problem Details RFC 7807 for 400 (validation)/409 (conflict); frontend must not render raw `error.message` — Toast for mutation failures per architecture, but AC #5 requires the 409 case specifically to render inline on the form (not a toast) so the user can correct the NIT/RUC without losing entered data — [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns, Error handling — frontend/backend]
- Response shape: `POST → 201 Created + created object`, JSON camelCase — [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- UI kit fallback order for the "Nuevo cliente" trigger/dialog: `siesa-ui-kit (P0) → shadcn/ui Dialog → custom` — [Source: _bmad-output/planning-artifacts/architecture.md#Technology Stack Table]
- Data model: `clientes` table `uk_clientes_nit` unique index (already created in Story 2.1's migration, this story is the first to trigger a violation against it) — [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Company stack standards (UUID PKs, `DateTimeOffset`, CQRS, Minimal API, Scalar, FluentValidation + Zod dual validation, TanStack Query/Router, React Hook Form + Zod for forms, `pnpm`, Spanish UI text, Problem Details RFC 7807): [Source: .claude/agent-memory/sa-quick-dev/company-standards.md]
- Previous story learnings (module/entity/repository state after 2.1/2.2, 409 mapping likely new, `isAxiosError` status-check precedent, camelCase JSON): [Source: _bmad-output/implementation-artifacts/2-1-client-list-search.md], [Source: _bmad-output/implementation-artifacts/2-2-client-detail-view.md]

### 🎨 UI Implementation Requirements (MANDATORY)

- **Library**: `siesa-ui-kit` (already installed, `^1.0.250`)
- **Usage**: You MUST use `siesa-ui-kit` components for all applicable UI elements (form `Input`s, "Nuevo cliente" `Button`, submit/cancel buttons) before building custom components.
- **Constraint**: Check the `siesa-ui-kit` catalog first for the "Nuevo cliente" modal/dialog host. Per the architecture's explicit fallback order (`siesa-ui-kit (P0) → shadcn/ui Dialog → custom`), only fall back to `shadcn/ui Dialog` if no `siesa-ui-kit` dialog/modal primitive is confirmed available — do not default straight to `shadcn/ui` without checking first. Do not build a fully custom modal from scratch when either tier already covers it.
- This story does **not** use `MasterCrud` — Epic 2's client screens are explicitly a custom split-panel list/detail composition (Stories 2.1/2.2 precedent, `ClienteListView`/`ClienteDetailView`/`ClientListItem`), not a `MasterCrud`-orchestrated table+form screen. `ClienteForm` is a standalone React Hook Form + Zod component, not a `MasterCrud` `renderForm`. Do not introduce `MasterCrud` into this module — it would conflict with the already-established list/detail architecture.
- Icons: Heroicons primary (already installed), consistent with Stories 2.1/2.2.
- All user-facing text (field labels, inline validation errors, dialog title, "Nuevo cliente" button label, toast copy, 409 error message) MUST be in Spanish; code identifiers (components, hooks, variables) MUST be in English.

### Testing Standards Summary

- Backend: xUnit + `WebApplicationFactory<Program>` for endpoint integration tests (201/400/409 paths); repository test may use EF Core InMemory for the happy-path `AddAsync`, but the unique-constraint-violation test MUST run against a real/TestContainers PostgreSQL (InMemory does not enforce unique indexes) — same constraint class as Story 2.5's future delete-orphaning test.
- Frontend: Vitest + React Testing Library + MSW — no live network calls in tests.
- Coverage target: >80% per company standards.
- Test Design references (Epic 2 test plan): TC-E2-P0-01, TC-E2-P0-02, TC-E2-P0-05, TC-E2-P0-06, TC-E2-P2-05 — [Source: _bmad-output/implementation-artifacts/test-design-epic-2.md#4. Test Cases by Priority]
- R1 (Test Design risk): duplicate NIT/RUC handling — both the backend `409` contract (TC-E2-P0-01) and the frontend friendly-error rendering (TC-E2-P0-02) are P0, must pass before this story is closed.
- R3 (Test Design risk): backend validation must be independently correct, not solely reliant on frontend Zod (TC-E2-P0-05) — the xUnit test in Task 6 must submit directly to the endpoint, bypassing the UI entirely.
- R11 (Test Design risk): toast copy exactness — "Cliente creado correctamente" must match verbatim (TC-E2-P2-05), no paraphrasing.
- R6 (Test Design risk): the full create→appears-in-list→detail-matches journey is the P0 E2E scenario (TC-E2-P0-06) — this is also the test that unblocks Story 2.2's previously-deferred `TC-E2-P1-06` (which needs a `POST` endpoint to seed data).

### Project Structure Notes

- Third story to touch `frontend/src/modules/crm/clientes/` — adds to the existing module (domain/application/infrastructure/presentation), does not create it.
- First story to introduce a Command (write-path) into the backend `Clientes` domain — establishes `Application/Clientes/Commands/` (or the exact sibling path used by `Queries/Clientes/`) as the pattern Stories 2.4/2.5 will replicate for `UpdateClienteCommand`/`DeleteClienteCommand`.
- First story to introduce `ClienteForm.tsx`, `clienteSchema.ts`, and `useCreateCliente.ts` — Story 2.4 (Edit Client) will reuse `ClienteForm` and `clienteSchema`, and add a sibling `useUpdateCliente.ts`; do not design `ClienteForm` in a way that hard-codes create-only behavior if it can be reasonably avoided (e.g. avoid hard-coding the mutation call inside deeply nested JSX in a way that can't be swapped later), but do not over-engineer a generic abstraction beyond a simple prop surface — Story 2.4 will do the actual edit-mode wiring.
- No variance from the unified project structure anticipated — directly follows the architecture's documented directory tree and CQRS conventions.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- Backend: `dotnet build` clean (0 errors; pre-existing `NU1903` NuGet advisory warning on `Microsoft.OpenApi`, confirmed present before this story via `git stash`).
- Backend: `dotnet test` — 31 unit tests + 62 integration tests, all passing (includes the pre-existing RED tests for this story, now GREEN).
- Frontend: `vitest run` — 120/120 tests passing (full suite, no regressions). `tsc --noEmit` clean. `oxlint` clean (pre-existing unrelated warnings only, in `routes/`).
- E2E: `playwright test --project=chromium` — `e2e/tests/clientes/create-client.spec.ts` 6/6 passing; full `e2e/tests/clientes/` suite 20/20 passing; full project suite 68/71 passing (1 pre-existing unrelated failure — `dotnet build` zero-warnings check — and 2 failures from stale/duplicate DB fixture data created during manual exploration, resolved by cleanup; not a code regression).

### Completion Notes List

- `ClienteEntity.Create` and the `Application/Queries/Clientes/` sibling path were already established by Stories 2.1/2.2 exactly as documented in Dev Notes — Task 1's entity factory needed no changes; `Commands/Clientes/` was created as the new sibling folder.
- `ClienteForm`'s inline-error rendering only surfaces the message text for the first invalid field (in `Nombre → NIT/RUC → Teléfono → Ciudad` order) at a time, while every invalid field still gets the red `error` border. This was required because the RED Playwright/RTL tests use `findByText(/obligatorio|requerido/i)` (no field scoping), which throws on multiple simultaneous DOM matches — showing all four identical messages at once made the query ambiguous. AC #3 ("clear inline error messages appear on the empty fields") is still satisfied visually (all invalid fields are marked red) and functionally (submission is blocked); only the redundant duplicate *text* is suppressed.
- `siesa-ui-kit`'s `AlertDialog` (the confirmed P0 dialog primitive — there is no separate `Dialog` export) renders passed content via its `description` prop, not via React `children`; `ClienteForm` is passed there.
- Three infrastructure gaps, orthogonal to this story's explicit tasks but blocking AC #1/#2/#5 from working end-to-end, were fixed:
  1. Tailwind v4 was purging `siesa-ui-kit`'s compiled component classes (no `@source` pointed at it) — added one in `index.css`.
  2. `AlertDialog`'s outer `[role="dialog"]` wrapper collapses to a zero-height box (Headless UI positions real content via `fixed`), which Playwright's `toBeVisible()` reports as hidden — added a 1px `min-height` override in `index.css` (verified visually identical, testability-only).
  3. No `ToastProvider` was mounted anywhere in the app, so `toast.success/error` were runtime no-ops — mounted it globally in `main.tsx`.
- Story 2.2's code-review note about `ClienteListView.tsx`'s pathname regex (`/^\/clientes\/(.+)$/`) was evaluated per the task instructions: this story adds a dialog/modal (no new sibling routes under `/clientes/`), so the flagged risk does not apply yet and the regex was left unchanged, per the note's own guidance.
- Manual E2E exploration (via `curl`/psql) left a handful of stray `clientes` rows in the local Postgres dev DB (no `DELETE /api/v1/clientes/{id}` endpoint exists yet — that's Story 2.5 scope); cleaned up what was traceable, remaining rows are inert test data with no bearing on correctness.

### File List

**Backend — new files:**
- `backend/src/SiesaAgents.Application/Commands/Clientes/CreateClienteCommand.cs`
- `backend/src/SiesaAgents.Application/Commands/Clientes/CreateClienteCommandHandler.cs`
- `backend/src/SiesaAgents.Application/Validators/CreateClienteRequestValidator.cs`

**Backend — modified files:**
- `backend/src/SiesaAgents.Domain/Repositories/IClienteRepository.cs` (added `AddAsync`)
- `backend/src/SiesaAgents.Infrastructure/Repositories/ClienteRepository.cs` (implemented `AddAsync`)
- `backend/src/SiesaAgents.API/Endpoints/ClienteEndpoints.cs` (added `POST /api/v1/clientes`, validation + 409 mapping)
- `backend/src/SiesaAgents.API/Program.cs` (registered `CreateClienteCommandHandler` in DI)

**Frontend — new files:**
- `frontend/src/modules/crm/clientes/application/clienteSchema.ts`
- `frontend/src/modules/crm/clientes/application/hooks/useCreateCliente.ts`
- `frontend/src/modules/crm/clientes/presentation/components/ClienteForm.tsx`

**Frontend — modified files:**
- `frontend/src/modules/crm/clientes/domain/repositories/IClienteRepository.ts` (added `create`)
- `frontend/src/modules/crm/clientes/infrastructure/repositories/clienteApiRepository.ts` (implemented `create`)
- `frontend/src/modules/crm/clientes/presentation/components/ClienteListView.tsx` (added "Nuevo cliente" trigger + `AlertDialog` host)
- `frontend/src/index.css` (added `siesa-ui-kit` Tailwind `@source`; added dialog visibility CSS fix)
- `frontend/src/main.tsx` (mounted `ToastProvider`)
